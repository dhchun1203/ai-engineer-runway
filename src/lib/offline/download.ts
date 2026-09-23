// "전체 받기"(설계 3.2)와 새 배포 뒤 옛 저장본 옮기기가 함께 쓰는 받기 모듈. 페이지가
// Cache API로 받는다(서비스 워커가 아니라).
//   downloadUrls: 콘텐츠 페이지 주소 목록을 쿠키와 함께 받아 지금 빌드 캐시에 넣는다. 콘텐츠가
//     아닌 주소, 로그인 만료나 권한 없음으로 튕긴 응답(redirected), 실패 응답, 다른 출처 응답은
//     넣지 않고 "받지 못한 항목"으로 센다. HTML이면 그 안의 같은 출처 /_next/static/ 주소를
//     뽑아 함께 받고, CSS 안의 글꼴과 이미지 주소도 한 번 더 뽑는다.
//   downloadAll(전체 받기): 1) 로그인 상태와 계정을 확인한다. 2) /offline-manifest.json을 받아
//     캐시에 넣는다(오프라인 목차의 제목 출처). 3) 목록의 주소를 받는다. 4) 내 데이터: 레슨
//     진도 응답과 베이스캠프, 아티클 메모를 사본으로 남긴다. 한 번도 열지 않은 레슨에도
//     오프라인에서 메모를 쓸 수 있게 하려는 것이다. 사본을 쓰기 전마다 기기 저장본의 주인이
//     시작할 때의 계정과 같은지 본다(다른 계정 사본이 섞이지 않게).
// 캐시 이름은 서비스 워커와 같은 offline-<빌드 id>다. 받는 도중 로그아웃 등으로 캐시가 통째로
// 지워지거나 기기 공간이 모자라면 남은 받기를 모두 건너뛴다(쓰기 전에 caches.has로 확인한다.
// 지운 캐시를 되살리지 않게).
// 전체 받기의 상태(진행, 결과)는 모듈의 공유 저장소에 둔다. 화면을 떠났다 돌아와도 도는 중인
// 받기를 그대로 보여 주고, 도는 동안 두 번째 받기를 시작하지 않는다.

import { useSyncExternalStore } from "react";
import type { ProgressData } from "@/components/progress-provider";
import { clearOfflineCaches, currentCacheName, olderCacheNames } from "./cache";
import { getMeta, offlineDbExists, setMeta } from "./db";
import { clearCopies, keepProgressCopy, saveNoteCopy } from "./snapshots";
import { fetchAuthState } from "./sync";
import {
  classifyOfflinePath,
  extractStaticAssetPaths,
  snapshotSourceFor,
  type OfflineManifest,
  type SnapshotSource,
} from "./offline-logic";

export type DownloadPhase = "pages" | "files" | "data";
export type DownloadProgress = { phase: DownloadPhase; done: number; total: number; bytes: number; failed: number };

/** downloadUrls 진행 콜백의 네 번째 인자. 단계별 개수와 받은 용량(전체 받기 화면이 쓴다). */
export type UrlDownloadDetail = { phase: "pages" | "files"; phaseDone: number; phaseTotal: number; bytes: number };

/** 전체 받기가 멈춘 까닭. login: 로그인이 풀림, network: 서버에 닿지 않음, quota: 기기 공간 부족,
 * wiped: 받는 도중 저장본이 지워짐, account: 받는 도중 계정이 바뀜, busy: 이미 도는 중. */
export type DownloadStopReason = "login" | "network" | "quota" | "wiped" | "account" | "busy";

export class DownloadStopError extends Error {
  readonly reason: DownloadStopReason;
  constructor(reason: DownloadStopReason) {
    super(`offline download stopped: ${reason}`);
    this.name = "DownloadStopError";
    this.reason = reason;
  }
}

export const MANIFEST_PATH = "/offline-manifest.json";
const CONCURRENCY = 4;

type NoteApiResponse = { unlocked: boolean; note: { ok: true; body: string } | { ok: false } };

// ---------------------------------------------------------------------------
// 전체 받기 상태 저장소

export type DownloadState = {
  status: "idle" | "running" | "done" | "error";
  progress: DownloadProgress | null;
  reason: DownloadStopReason | null;
  /** navigator.storage.persist() 결과. 묻지 않았으면 null. */
  persisted: boolean | null;
};

const IDLE_STATE: DownloadState = { status: "idle", progress: null, reason: null, persisted: null };

let downloadState: DownloadState = IDLE_STATE;
const downloadListeners = new Set<() => void>();

function setDownloadState(patch: Partial<DownloadState>): void {
  downloadState = { ...downloadState, ...patch };
  for (const listener of downloadListeners) listener();
}

function subscribeDownload(listener: () => void): () => void {
  downloadListeners.add(listener);
  return () => {
    downloadListeners.delete(listener);
  };
}

function getDownloadState(): DownloadState {
  return downloadState;
}

function getServerDownloadState(): DownloadState {
  return IDLE_STATE;
}

export function useDownloadState(): DownloadState {
  return useSyncExternalStore(subscribeDownload, getDownloadState, getServerDownloadState);
}

// 전체 받기(또는 저장본 지우기)가 도는 중인가. 옛 저장본 옮기기는 이때 시작하지 않는다.
let downloadRunning = false;

export function isDownloadRunning(): boolean {
  return downloadRunning;
}

// ---------------------------------------------------------------------------
// 캐시에 받기

async function runPool<T>(items: readonly T[], worker: (item: T) => Promise<void>): Promise<void> {
  let next = 0;
  async function lane(): Promise<void> {
    while (next < items.length) {
      const current = items[next];
      next += 1;
      await worker(current);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, () => lane()));
}

/** 받기 한 번의 대상 캐시. stop이 정해지면 남은 받기를 모두 건너뛴다. */
type Target = { name: string; cache: Cache; stop: "wiped" | "quota" | null };

async function openTarget(): Promise<Target> {
  const name = currentCacheName();
  // 여기서만 캐시를 만든다(로그인 상태에서 사용자가 누른 받기, 또는 확인을 거친 옮기기).
  return { name, cache: await caches.open(name), stop: null };
}

function isQuotaError(error: unknown): boolean {
  return error instanceof DOMException && (error.name === "QuotaExceededError" || error.code === 22);
}

async function putGuarded(target: Target, url: string, response: Response): Promise<boolean> {
  if (target.stop) return false;
  if (!(await caches.has(target.name))) {
    // 받는 도중 저장본이 지워졌다(로그아웃, 저장본 지우기). 남은 것은 넣지 않는다.
    target.stop = "wiped";
    return false;
  }
  try {
    await target.cache.put(url, response);
    return true;
  } catch (error) {
    if (isQuotaError(error)) {
      console.warn("[offline] device storage is full, stopping download", error);
      target.stop = "quota";
      return false;
    }
    throw error;
  }
}

function storable(res: Response): boolean {
  return res.ok && !res.redirected && res.type === "basic";
}

function isContentPage(url: string): boolean {
  return classifyOfflinePath(new URL(url, window.location.origin).pathname) === "content";
}

type Counters = { done: number; failed: number; bytes: number };

/** 받은 HTML(다른 파일이면 null). 받지 못하면 counters.failed를 올린다. */
async function savePage(target: Target, url: string, counters: Counters): Promise<string | null> {
  // 콘텐츠 페이지만 받는다(개인 화면이 기기에 남지 않게. 목록 파일도 이 규칙을 따르지만 겹으로 막는다).
  if (target.stop || !isContentPage(url)) {
    counters.failed += 1;
    return null;
  }
  try {
    const res = await fetch(url, { credentials: "same-origin", cache: "no-store" });
    if (!storable(res)) {
      counters.failed += 1;
      return null;
    }
    const isHtml = (res.headers.get("content-type") ?? "").includes("text/html");
    const body = await res.clone().blob();
    counters.bytes += body.size;
    const html = isHtml ? await body.text() : null;
    if (!(await putGuarded(target, url, res))) {
      counters.failed += 1;
      return null;
    }
    return html;
  } catch (error) {
    console.warn("[offline] saving page failed", url, error);
    counters.failed += 1;
    return null;
  }
}

/** 받은 파일이 CSS면 그 본문(안의 주소를 더 뽑기 위해), 아니면 null. 이미 있으면 받지 않는다. */
async function saveAsset(target: Target, assetPath: string, counters: Counters): Promise<string | null> {
  if (target.stop) {
    counters.failed += 1;
    return null;
  }
  try {
    if (await target.cache.match(assetPath)) return null;
    const res = await fetch(assetPath, { credentials: "same-origin" });
    if (!storable(res)) {
      counters.failed += 1;
      return null;
    }
    const body = await res.clone().blob();
    counters.bytes += body.size;
    const css = assetPath.split("?")[0].endsWith(".css") ? await body.text() : null;
    if (!(await putGuarded(target, assetPath, res))) {
      counters.failed += 1;
      return null;
    }
    return css;
  } catch (error) {
    console.warn("[offline] saving static file failed", assetPath, error);
    counters.failed += 1;
    return null;
  }
}

async function saveUrls(
  target: Target,
  urls: readonly string[],
  onProgress: (done: number, total: number, failed: number, detail: UrlDownloadDetail) => void,
): Promise<{ done: number; failed: number }> {
  const counters: Counters = { done: 0, failed: 0, bytes: 0 };
  let total = urls.length;
  let phase: UrlDownloadDetail["phase"] = "pages";
  let phaseDone = 0;
  let phaseTotal = urls.length;
  const report = () =>
    onProgress(counters.done, total, counters.failed, { phase, phaseDone, phaseTotal, bytes: counters.bytes });
  report();

  const assets = new Set<string>();
  await runPool(urls, async (url) => {
    const html = await savePage(target, url, counters);
    if (html !== null) for (const assetPath of extractStaticAssetPaths(html)) assets.add(assetPath);
    counters.done += 1;
    phaseDone += 1;
    report();
  });
  // 멈췄으면 화면 파일 단계를 건너뛴다(남은 페이지는 이미 받지 못한 항목으로 셌다).
  if (target.stop) return { done: counters.done, failed: counters.failed };

  const seen = new Set(assets);
  const pending = [...assets];
  phase = "files";
  phaseDone = 0;
  phaseTotal = pending.length;
  total += pending.length;
  report();
  while (pending.length > 0 && !target.stop) {
    const batch = pending.splice(0, pending.length);
    await runPool(batch, async (assetPath) => {
      const css = await saveAsset(target, assetPath, counters);
      if (css !== null) {
        for (const nested of extractStaticAssetPaths(css)) {
          if (seen.has(nested)) continue;
          seen.add(nested);
          pending.push(nested);
          phaseTotal += 1;
          total += 1;
        }
      }
      counters.done += 1;
      phaseDone += 1;
      report();
    });
  }
  return { done: counters.done, failed: counters.failed };
}

/**
 * 콘텐츠 페이지 주소 목록을 지금 빌드 캐시에 받는다(HTML이면 그 화면 파일까지). done과 total은
 * 페이지와 화면 파일을 합친 개수이고, 화면 파일을 찾을 때마다 total이 는다.
 */
export async function downloadUrls(
  urls: string[],
  onProgress: (done: number, total: number, failed: number, detail: UrlDownloadDetail) => void,
): Promise<{ done: number; failed: number }> {
  return saveUrls(await openTarget(), urls, onProgress);
}

// ---------------------------------------------------------------------------
// 목록 파일

export type ManifestFetch =
  | { ok: true; manifest: OfflineManifest; response: Response }
  | { ok: false; reason: "login" | "network" };

/** 새로 받은 목록 파일(온라인, 로그인 상태). 로그인 화면으로 튕기면 reason "login". */
export async function fetchManifest(): Promise<ManifestFetch> {
  try {
    const res = await fetch(MANIFEST_PATH, { credentials: "same-origin", cache: "no-store" });
    if (res.redirected) return { ok: false, reason: "login" };
    if (!storable(res)) return { ok: false, reason: "network" };
    return { ok: true, manifest: (await res.clone().json()) as OfflineManifest, response: res };
  } catch (error) {
    // 오프라인에서 나는 네트워크 오류는 예상된 실패라 경고로 남기지 않는다.
    if (typeof navigator === "undefined" || navigator.onLine) console.warn("[offline] fetching manifest failed", error);
    return { ok: false, reason: "network" };
  }
}

/** 목록 파일을 지금 빌드 캐시에 넣는다(오프라인 목차의 제목 출처). */
export async function saveManifestResponse(response: Response): Promise<void> {
  await putGuarded(await openTarget(), MANIFEST_PATH, response);
}

/** 목록 파일. 온라인이면 새로 받고, 오프라인이면 캐시 사본(지금 빌드 먼저, 없으면 옛 빌드). 둘 다 없으면 null. */
export async function loadManifest(): Promise<OfflineManifest | null> {
  const fresh = await fetchManifest();
  if (fresh.ok) return fresh.manifest;
  try {
    for (const name of [currentCacheName(), ...(await olderCacheNames())]) {
      // cacheName을 준 caches.match는 없는 캐시를 만들지 않는다.
      const cached = await caches.match(MANIFEST_PATH, { cacheName: name });
      if (cached) return (await cached.json()) as OfflineManifest;
    }
  } catch (error) {
    console.warn("[offline] reading cached manifest failed", error);
  }
  return null;
}

// ---------------------------------------------------------------------------
// 내 데이터 사본

/**
 * 기기 저장본의 주인이 아직 owner인가. owner가 null(사용자 id 없는 로그인)이면 대조하지 않는다.
 * DB가 사라졌으면(로그아웃 정리) false. DB를 새로 만들지 않도록 먼저 있는지 본다.
 */
async function deviceOwnerIs(owner: string | null): Promise<boolean> {
  if (owner === null) return true;
  if (!(await offlineDbExists())) return false;
  return (await getMeta<string>("userId")) === owner;
}

async function saveSnapshot(source: SnapshotSource, owner: string | null): Promise<"saved" | "failed" | "account"> {
  try {
    const res = await fetch(source.api, { cache: "no-store" });
    if (!res.ok) return "failed";
    if (source.kind === "progress") {
      const data = (await res.json()) as ProgressData;
      if (!data.unlocked || !data.ok) return "failed";
      if (!(await deviceOwnerIs(owner))) return "account";
      await keepProgressCopy(source.key === "" ? undefined : source.key, data);
      return "saved";
    }
    const data = (await res.json()) as NoteApiResponse;
    if (!data.unlocked || !data.note.ok) return "failed";
    if (!(await deviceOwnerIs(owner))) return "account";
    await saveNoteCopy(source.key, data.note.body);
    return "saved";
  } catch (error) {
    console.warn("[offline] saving data copy failed", source.api, error);
    return "failed";
  }
}

async function clearCopiesIfPresent(): Promise<void> {
  try {
    if (await offlineDbExists()) await clearCopies();
  } catch (error) {
    console.warn("[offline] clearing copies after account change failed", error);
  }
}

// ---------------------------------------------------------------------------
// 전체 받기

/** 전체 받기. 이미 도는 중이면 DownloadStopError("busy")를 던진다. 멈추면 DownloadStopError. */
export async function downloadAll(onProgress: (progress: DownloadProgress) => void): Promise<DownloadProgress> {
  if (downloadRunning) throw new DownloadStopError("busy");
  downloadRunning = true;
  try {
    const auth = await fetchAuthState();
    if (auth === null) throw new DownloadStopError("network");
    if (!auth.loggedIn) throw new DownloadStopError("login");
    const owner = auth.userId;
    if (owner !== null) {
      // 계정 대조(offline-runtime.tsx)가 이미 적어 둔다. 없으면(첫 방문 직후) 지금 계정으로 적는다.
      // 기기 저장소를 읽지 못하면 넘어간다(사본 쓰기 직전의 대조가 실패해 사본만 빠진다).
      const recorded = await getMeta<string>("userId").catch((error: unknown) => {
        console.warn("[offline] reading device data owner failed", error);
        return null;
      });
      if (recorded === undefined) {
        await setMeta("userId", owner).catch((error: unknown) => {
          console.warn("[offline] saving device data owner failed", error);
        });
      } else if (recorded !== null && recorded !== owner) {
        throw new DownloadStopError("account");
      }
    }

    const fresh = await fetchManifest();
    if (!fresh.ok) throw new DownloadStopError(fresh.reason);
    const target = await openTarget();
    await putGuarded(target, MANIFEST_PATH, fresh.response);
    const pages = fresh.manifest.groups.flatMap((group) => group.items.map((entry) => entry.url));

    const progress: DownloadProgress = { phase: "pages", done: 0, total: pages.length, bytes: 0, failed: 0 };
    const report = () => onProgress({ ...progress });
    report();

    await saveUrls(target, pages, (_done, _total, failed, detail) => {
      Object.assign(progress, {
        phase: detail.phase,
        done: detail.phaseDone,
        total: detail.phaseTotal,
        bytes: detail.bytes,
        failed,
      });
      report();
    });
    if (target.stop) throw new DownloadStopError(target.stop);

    const sources: SnapshotSource[] = [{ kind: "progress", api: "/api/progress", key: "" }];
    for (const url of pages) {
      const source = snapshotSourceFor(url);
      if (source) sources.push(source);
    }
    Object.assign(progress, { phase: "data", done: 0, total: sources.length });
    report();
    let accountChanged = false;
    await runPool(sources, async (source) => {
      if (accountChanged) return;
      const outcome = await saveSnapshot(source, owner);
      if (outcome === "account") accountChanged = true;
      else if (outcome === "failed") progress.failed += 1;
      progress.done += 1;
      report();
    });
    // 사본을 다 쓴 뒤에도 한 번 더 본다(쓰는 사이 계정이 바뀌었으면 섞였을 수 있는 사본을 비운다).
    if (!accountChanged && owner !== null) {
      const after = await fetchAuthState();
      if (after !== null && after.userId !== owner) accountChanged = true;
    }
    if (accountChanged) {
      await clearCopiesIfPresent();
      throw new DownloadStopError("account");
    }

    await setMeta("lastDownloadAt", Date.now()).catch((error: unknown) => {
      console.warn("[offline] saving lastDownloadAt failed", error);
    });
    return { ...progress };
  } finally {
    downloadRunning = false;
  }
}

/**
 * 화면의 "전체 받기" 버튼. 진행과 결과를 공유 저장소에 싣는다. 이미 도는 중이면 아무것도 하지 않는다.
 * 기기가 저장본을 함부로 지우지 않게 persist를 요청한다(거절되면 화면이 안내만 한다).
 */
export function startDownload(): void {
  if (downloadRunning || downloadState.status === "running") return;
  setDownloadState({ status: "running", progress: null, reason: null });
  void (async () => {
    try {
      if (navigator.storage?.persist) {
        try {
          setDownloadState({ persisted: await navigator.storage.persist() });
        } catch (error) {
          console.warn("[offline] requesting persistent storage failed", error);
        }
      }
      const progress = await downloadAll((next) => setDownloadState({ progress: next }));
      setDownloadState({ status: "done", progress });
    } catch (error) {
      console.warn("[offline] download all failed", error);
      const reason = error instanceof DownloadStopError ? error.reason : "network";
      setDownloadState({ status: "error", reason });
    }
  })();
}

/** 저장한 페이지를 모두 지우고 오프라인 목차(/offline)만 다시 받아 둔다. 대기열과 사본은 남긴다. */
export async function clearSavedPages(): Promise<void> {
  if (downloadRunning) throw new DownloadStopError("busy");
  downloadRunning = true;
  try {
    await clearOfflineCaches();
    await downloadUrls(["/offline"], () => {});
  } finally {
    downloadRunning = false;
    setDownloadState({ status: "idle", progress: null, reason: null });
  }
}
