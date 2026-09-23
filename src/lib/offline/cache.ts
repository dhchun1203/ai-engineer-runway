// 오프라인 저장본(Cache Storage) 이름과 조회. public/sw.js와 같은 규칙이다. 캐시 이름은
// "offline-" + 빌드 id. 빌드 id는 next.config.ts의 env(NEXT_PUBLIC_BUILD_ID)가 빌드 때
// 박아 넣고, 서비스 워커는 등록 주소의 ?v= 로 같은 값을 받는다.
//
// 읽기만 하는 곳에서 caches.open()을 부르지 않는다. open은 없는 캐시를 새로 만들어, 지운
// 캐시를 되살리거나 로그아웃 뒤 빈 캐시를 남긴다. 이름은 caches.keys()로 고르고, 열기 직전에
// caches.has()로 한 번 더 확인한다.

export const OFFLINE_CACHE_PREFIX = "offline-";
export const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID ?? "dev";

export function currentCacheName(): string {
  return `${OFFLINE_CACHE_PREFIX}${BUILD_ID}`;
}

function hasCacheStorage(): boolean {
  return typeof window !== "undefined" && "caches" in window;
}

async function offlineCacheNames(): Promise<string[]> {
  if (!hasCacheStorage()) return [];
  return (await caches.keys()).filter((name) => name.startsWith(OFFLINE_CACHE_PREFIX));
}

/**
 * 모든 offline-* 캐시(지금 빌드와 옛 빌드)에 들어 있는 주소의 경로(pathname) 합집합.
 * 오프라인 조회가 모든 offline-* 캐시에서 찾으므로(설계 3.1), "저장됨" 판정도 같은 범위를 본다.
 */
export async function listCachedPaths(): Promise<Set<string>> {
  const paths = new Set<string>();
  try {
    for (const name of await offlineCacheNames()) {
      if (!(await caches.has(name))) continue;
      const cache = await caches.open(name);
      for (const request of await cache.keys()) paths.add(new URL(request.url).pathname);
    }
  } catch (error) {
    console.warn("[offline] listing cached paths failed", error);
  }
  return paths;
}

/** 지금 빌드가 아닌 offline-* 캐시 이름들. */
export async function olderCacheNames(): Promise<string[]> {
  const current = currentCacheName();
  return (await offlineCacheNames()).filter((name) => name !== current);
}

/**
 * 이름을 받은 캐시만 지운다. 옛 캐시의 주소를 새 캐시로 다시 받은 뒤에만 부른다. 지울 이름은
 * 옮기기를 시작할 때 고른 목록이다. 지우는 순간에 다시 고르면, 그 사이 더 새 배포의 서비스
 * 워커가 만든 캐시까지 지울 수 있다.
 */
export async function deleteCaches(names: readonly string[]): Promise<void> {
  const current = currentCacheName();
  await Promise.all(names.filter((name) => name !== current).map((name) => caches.delete(name)));
}

// 해시 없는 아이콘 경로. 옛 캐시를 지우기 전에 지금 캐시에 없으면 옮겨 둔다(오프라인 아이콘).
const ICON_PATHS = new Set(["/icon", "/apple-icon", "/favicon.ico"]);

/** 옛 캐시(names)의 아이콘 항목 중 지금 캐시에 없는 것을 지금 캐시로 옮긴다. 지금 캐시가 없으면 하지 않는다. */
export async function copyIconsFrom(names: readonly string[]): Promise<void> {
  const current = currentCacheName();
  if (!(await caches.has(current))) return;
  const target = await caches.open(current);
  for (const name of names) {
    if (name === current || !(await caches.has(name))) continue;
    const source = await caches.open(name);
    for (const request of await source.keys()) {
      if (!ICON_PATHS.has(new URL(request.url).pathname)) continue;
      if (await target.match(request)) continue;
      const response = await source.match(request);
      if (response) await target.put(request, response);
    }
  }
}

export async function clearOfflineCaches(): Promise<void> {
  const names = await offlineCacheNames();
  await Promise.all(names.map((name) => caches.delete(name)));
}
