// 새 배포 뒤 옛 저장본 옮기기(설계 3.1, 컨트롤러 결정 (a)). 새 배포는 빌드 id와 캐시 이름
// (offline-<빌드 id>)을 바꾸지만 옛 캐시는 지우지 않는다(오프라인 조회는 모든 offline-*
// 캐시에서 찾는다). 온라인이고 로그인했고 이 페이지가 서버와 같은 빌드일 때, 옛 캐시에 있던
// 콘텐츠 주소를 지금 빌드 캐시로 다시 받고, 하나도 빠짐없이 받았을 때만 옛 캐시를 지운다.
// 일부라도 실패하면 지우지 않는다(다음 페이지 로드 때 다시 시도한다). 같은 빌드에서 시도는
// 최대 MAX_ATTEMPTS번이다(계속 실패하는 페이지가 매번 받기를 되풀이하지 않게). 횟수는 기기
// 저장소(meta)에 빌드 id별로 남긴다.
//
// 옮기는 대상: 옛 캐시의 주소 중 새 목록 파일(/offline-manifest.json)에 있는 콘텐츠 페이지.
// 옛 빌드의 /_next/static 조각은 새 서버에 없을 수 있어 다시 받지 않는다(새 HTML이 가리키는
// 새 조각을 함께 받는다). 새 목록에 없는 주소(지운 레슨, 볼 권한이 없어진 로드맵)도 옮기지
// 않는다. 이미 지금 빌드 캐시에 있는 주소(새 빌드에서 이미 방문한 페이지)는 건너뛴다.
// 해시 없는 아이콘(/icon 등)은 받지 않고 옛 캐시의 것을 지금 캐시로 옮긴다.
// 지우는 캐시는 시작할 때 고른 옛 캐시 목록뿐이다(그 사이 더 새 배포가 만든 캐시는 지우지 않는다).
//
// 페이지 로드마다 한 번만 시도한다. 부르는 곳은 offline-runtime.tsx(계정 대조 직후)다.
// 진행 상황은 작은 공유 저장소로 알린다(/offline 화면이 "새 버전으로 다시 받는 중"을 보인다).

import { useSyncExternalStore } from "react";
import { BUILD_ID, copyIconsFrom, currentCacheName, deleteCaches, olderCacheNames } from "./cache";
import { isOnline } from "./connectivity";
import { getMeta, setMeta } from "./db";
import { downloadUrls, fetchManifest, isDownloadRunning, saveManifestResponse } from "./download";
import { classifyOfflinePath } from "./offline-logic";
import { fetchAuthState } from "./sync";

export type MigrationState =
  | { status: "idle" }
  | { status: "running"; done: number; total: number }
  | { status: "done" }
  | { status: "error" };

const IDLE: MigrationState = { status: "idle" };
const MAX_ATTEMPTS = 3;
const ATTEMPTS_KEY = `migrationAttempts:${BUILD_ID}`;

let state: MigrationState = IDLE;
const listeners = new Set<() => void>();
// 이 페이지 로드에서 이미 시도했는가(옮길 것이 없다고 확인한 경우 포함).
let attempted = false;
// 지금 확인이나 옮기기가 도는 중인가(경로 이동이 겹쳐 두 번 시작하지 않게).
let inFlight = false;

function setState(next: MigrationState): void {
  state = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getState(): MigrationState {
  return state;
}

function getServerState(): MigrationState {
  return IDLE;
}

export function useMigrationState(): MigrationState {
  return useSyncExternalStore(subscribe, getState, getServerState);
}

async function pathsIn(cacheName: string): Promise<Set<string>> {
  const paths = new Set<string>();
  // 열기 전에 확인한다(open은 없는 캐시를 새로 만든다).
  if (!(await caches.has(cacheName))) return paths;
  const cache = await caches.open(cacheName);
  for (const request of await cache.keys()) paths.add(new URL(request.url).pathname);
  return paths;
}

/** 이번 빌드에서 몇 번 시도했는가. 읽지 못하면 0(시도는 한다). */
async function readAttempts(): Promise<number> {
  try {
    return (await getMeta<number>(ATTEMPTS_KEY)) ?? 0;
  } catch (error) {
    console.warn("[offline] reading migration attempts failed", error);
    return 0;
  }
}

async function migrate(): Promise<void> {
  // 지울 대상은 여기서 한 번만 고른다.
  const older = await olderCacheNames();
  if (older.length === 0) {
    attempted = true;
    return;
  }
  const auth = await fetchAuthState();
  // 서버에 닿지 않거나 로그인이 아니면 이번에는 하지 않는다(다음 로드 때 다시 본다).
  if (auth === null || !auth.loggedIn) return;
  // 옛 빌드 페이지는 옮기지 않는다. 지금 빌드 캐시가 서버의 최신 빌드여야 옛 캐시를 지울 수 있다.
  if (auth.buildId === null || auth.buildId !== BUILD_ID) return;
  attempted = true;
  const attempts = await readAttempts();
  if (attempts >= MAX_ATTEMPTS) return;
  await setMeta(ATTEMPTS_KEY, attempts + 1).catch((error: unknown) => {
    console.warn("[offline] saving migration attempts failed", error);
  });
  setState({ status: "running", done: 0, total: 0 });

  const fresh = await fetchManifest();
  if (!fresh.ok) {
    setState({ status: "error" });
    return;
  }
  await saveManifestResponse(fresh.response);
  const listed = new Set(fresh.manifest.groups.flatMap((group) => group.items.map((entry) => entry.url)));

  const oldPaths = new Set<string>();
  for (const name of older) for (const path of await pathsIn(name)) oldPaths.add(path);
  const current = await pathsIn(currentCacheName());
  const urls = [...oldPaths].filter(
    (path) => classifyOfflinePath(path) === "content" && listed.has(path) && !current.has(path),
  );

  const result = await downloadUrls(urls, (done, total) => setState({ status: "running", done, total }));
  if (result.failed > 0) {
    console.warn(`[offline] migrating older caches left ${result.failed} failures, keeping older caches`);
    setState({ status: "error" });
    return;
  }
  await copyIconsFrom(older);
  await deleteCaches(older);
  setState({ status: "done" });
}

/**
 * 옛 빌드 캐시가 있으면 지금 빌드 캐시로 옮긴다. 페이지 로드마다 한 번만 한다. 오프라인이거나
 * 전체 받기가 도는 중이면 이번 기회는 쓰지 않고 넘어간다(다음 경로 이동 때 다시 본다).
 */
export function startMigrationOnce(): void {
  if (attempted || inFlight) return;
  if (typeof window === "undefined" || !("caches" in window)) return;
  if (!isOnline() || isDownloadRunning()) return;
  inFlight = true;
  void migrate()
    .catch((error: unknown) => {
      console.warn("[offline] migrating older caches failed", error);
      attempted = true;
      setState({ status: "error" });
    })
    .finally(() => {
      inFlight = false;
    });
}
