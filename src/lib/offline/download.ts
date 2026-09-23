// "전체 받기"(설계 3.2)와 새 배포 뒤 옛 저장본 옮기기가 함께 쓰는 받기 모듈. 페이지가
// Cache API로 받는다(서비스 워커가 아니라).
//   downloadUrls: 주소 목록을 쿠키와 함께 받아 지금 빌드 캐시에 넣는다. 로그인 만료나 권한
//     없음으로 튕긴 응답(redirected), 실패 응답, 다른 출처 응답은 넣지 않고 "받지 못한 항목"으로
//     센다. HTML이면 그 안의 같은 출처 /_next/static/ 주소를 뽑아 함께 받고, CSS 안의 글꼴과
//     이미지 주소도 한 번 더 뽑는다.
//   downloadAll(전체 받기): 1) /offline-manifest.json을 받아 캐시에 넣는다(오프라인 목차의
//     제목 출처). 2) 목록의 주소를 downloadUrls로 받는다. 3) 내 데이터: 레슨 진도 응답과
//     베이스캠프, 아티클 메모를 사본으로 남긴다. 한 번도 열지 않은 레슨에도 오프라인에서
//     메모를 쓸 수 있게 하려는 것이다.
// 캐시 이름은 서비스 워커와 같은 offline-<빌드 id>다. 받는 도중 로그아웃 등으로 캐시가 통째로
// 지워지면 남은 것은 넣지 않는다(쓰기 전에 caches.has로 확인한다. 지운 캐시를 되살리지 않게).

import type { ProgressData } from "@/components/progress-provider";
import { clearOfflineCaches, currentCacheName, olderCacheNames } from "./cache";
import { setMeta } from "./db";
import { keepProgressCopy, saveNoteCopy } from "./snapshots";
import {
  extractStaticAssetPaths,
  snapshotSourceFor,
  type OfflineManifest,
  type SnapshotSource,
} from "./offline-logic";

export type DownloadPhase = "pages" | "files" | "data";
export type DownloadProgress = { phase: DownloadPhase; done: number; total: number; bytes: number; failed: number };

/** downloadUrls 진행 콜백의 네 번째 인자. 단계별 개수와 받은 용량(전체 받기 화면이 쓴다). */
export type UrlDownloadDetail = { phase: "pages" | "files"; phaseDone: number; phaseTotal: number; bytes: number };

export const MANIFEST_PATH = "/offline-manifest.json";
const CONCURRENCY = 4;

type NoteApiResponse = { unlocked: boolean; note: { ok: true; body: string } | { ok: false } };

// 전체 받기가 도는 중인가(옛 저장본 옮기기는 이때 시작하지 않는다).
let downloadRunning = false;

export function isDownloadRunning(): boolean {
  return downloadRunning;
}

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

/** 받기 한 번의 대상 캐시. 쓰기 직전마다 캐시가 아직 있는지 확인한다. */
type Target = { name: string; cache: Cache; gone: boolean };

async function openTarget(): Promise<Target> {
  const name = currentCacheName();
  // 여기서만 캐시를 만든다(로그인 상태에서 사용자가 누른 받기, 또는 확인을 거친 옮기기).
  return { name, cache: await caches.open(name), gone: false };
}

async function putGuarded(target: Target, url: string, response: Response): Promise<boolean> {
  if (target.gone) return false;
  if (!(await caches.has(target.name))) {
    // 받는 도중 저장본이 지워졌다(로그아웃, 저장본 지우기). 남은 것은 넣지 않는다.
    target.gone = true;
    return false;
  }
  await target.cache.put(url, response);
  return true;
}

function storable(res: Response): boolean {
  return res.ok && !res.redirected && res.type === "basic";
}

type Counters = { done: number; failed: number; bytes: number };

/** 받은 HTML(다른 파일이면 null). 받지 못하면 counters.failed를 올린다. */
async function savePage(target: Target, url: string, counters: Counters): Promise<string | null> {
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

  const seen = new Set(assets);
  const pending = [...assets];
  phase = "files";
  phaseDone = 0;
  phaseTotal = pending.length;
  total += pending.length;
  report();
  while (pending.length > 0) {
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
 * 주소 목록을 지금 빌드 캐시에 받는다(HTML이면 그 화면 파일까지). done과 total은 페이지와
 * 화면 파일을 합친 개수이고, 화면 파일을 찾을 때마다 total이 는다.
 */
export async function downloadUrls(
  urls: string[],
  onProgress: (done: number, total: number, failed: number, detail: UrlDownloadDetail) => void,
): Promise<{ done: number; failed: number }> {
  return saveUrls(await openTarget(), urls, onProgress);
}

async function saveSnapshot(source: SnapshotSource): Promise<boolean> {
  try {
    const res = await fetch(source.api, { cache: "no-store" });
    if (!res.ok) return false;
    if (source.kind === "progress") {
      const data = (await res.json()) as ProgressData;
      if (!data.unlocked || !data.ok) return false;
      await keepProgressCopy(source.key === "" ? undefined : source.key, data);
      return true;
    }
    const data = (await res.json()) as NoteApiResponse;
    if (!data.unlocked || !data.note.ok) return false;
    await saveNoteCopy(source.key, data.note.body);
    return true;
  } catch (error) {
    console.warn("[offline] saving data copy failed", source.api, error);
    return false;
  }
}

/** 새로 받은 목록 파일(온라인, 로그인 상태). 받지 못하면 null. */
export async function fetchManifest(): Promise<{ manifest: OfflineManifest; response: Response } | null> {
  try {
    const res = await fetch(MANIFEST_PATH, { credentials: "same-origin", cache: "no-store" });
    if (!storable(res)) return null;
    return { manifest: (await res.clone().json()) as OfflineManifest, response: res };
  } catch (error) {
    // 오프라인에서 나는 네트워크 오류는 예상된 실패라 경고로 남기지 않는다.
    if (typeof navigator === "undefined" || navigator.onLine) console.warn("[offline] fetching manifest failed", error);
    return null;
  }
}

/** 목록 파일을 지금 빌드 캐시에 넣는다(오프라인 목차의 제목 출처). */
export async function saveManifestResponse(response: Response): Promise<void> {
  await putGuarded(await openTarget(), MANIFEST_PATH, response);
}

/** 목록 파일. 온라인이면 새로 받고, 오프라인이면 캐시 사본(지금 빌드 먼저, 없으면 옛 빌드). 둘 다 없으면 null. */
export async function loadManifest(): Promise<OfflineManifest | null> {
  const fresh = await fetchManifest();
  if (fresh) return fresh.manifest;
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

export async function downloadAll(onProgress: (progress: DownloadProgress) => void): Promise<DownloadProgress> {
  downloadRunning = true;
  try {
    const fresh = await fetchManifest();
    if (!fresh) throw new Error("offline-manifest");
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

    const sources: SnapshotSource[] = [{ kind: "progress", api: "/api/progress", key: "" }];
    for (const url of pages) {
      const source = snapshotSourceFor(url);
      if (source) sources.push(source);
    }
    Object.assign(progress, { phase: "data", done: 0, total: sources.length });
    report();
    await runPool(sources, async (source) => {
      if (!(await saveSnapshot(source))) progress.failed += 1;
      progress.done += 1;
      report();
    });

    await setMeta("lastDownloadAt", Date.now()).catch((error: unknown) => {
      console.warn("[offline] saving lastDownloadAt failed", error);
    });
    return { ...progress };
  } finally {
    downloadRunning = false;
  }
}

/** 저장한 페이지를 모두 지우고 오프라인 목차(/offline)만 다시 받아 둔다. 대기열과 사본은 남긴다. */
export async function clearSavedPages(): Promise<void> {
  await clearOfflineCaches();
  await downloadUrls(["/offline"], () => {});
}
