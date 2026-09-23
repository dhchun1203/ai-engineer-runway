/* global self, caches */
/*
 * 오프라인 모드 서비스 워커(docs/superpowers/specs/2026-09-23-offline-mode-design.md 3.1).
 * 외부 라이브러리 없이 직접 쓴다. 등록은 src/components/offline/offline-runtime.tsx가
 * 로그인 상태에서만 /sw.js?v=<빌드 id>로 한다. 캐시 이름은 "offline-" + 그 빌드 id다.
 * 새 배포는 새 등록 주소라 새 서비스 워커가 설치된다. 새 배포가 와도 옛 캐시는 지우지
 * 않는다(activate에서 다른 offline-* 캐시를 지우지 않음) — 옛 캐시를 새 캐시로 다시
 * 받은 뒤 지우는 일은 페이지 쪽 런타임(이후 단계)이 한다. 같은 빌드의 HTML과 JS 조각을
 * 한 캐시에 묶어, 옛 HTML이 없는 조각을 찾는 일이 없게 한다.
 *
 * 요청 규칙
 *   문서(navigate), 콘텐츠 경로: 네트워크 먼저. 성공하면 캐시에 갱신 저장(쿼리 없는 주소만),
 *     실패하면 캐시(현재 캐시 먼저, 없으면 모든 offline-* 캐시에서 검색), 캐시도 없으면
 *     /offline?from=<경로> 안내.
 *   문서, 개인 화면: 네트워크 먼저, 실패하면 /offline?from=<경로>(오프라인 목차).
 *   문서, 로그인 관련과 /api, /_next: 손대지 않는다.
 *   같은 출처 정적 파일(/_next/static, /fonts, /static, 아이콘): 캐시 먼저(현재 캐시,
 *     없으면 모든 offline-* 캐시).
 *   그 밖(GET이 아닌 요청, Server Action, /api, 외부 출처): 손대지 않는다(항상 네트워크).
 *
 * 캐시 쓰기는 caches.has(CACHE_NAME)이 참일 때만 한다(install이 이 캐시를 만든다 —
 * 아직 설치가 끝나지 않았거나 캐시가 통째로 지워진 상태에서 쓰지 않기 위해서). 쓰기는
 * event.waitUntil로 살려 두고, 실패해도 응답에는 영향이 없도록 콘솔 경고로만 남긴다.
 *
 * classifyPath와 extractAssetPaths는 src/lib/offline/offline-logic.ts의 classifyOfflinePath,
 * extractStaticAssetPaths와 같은 규칙이다. 두 판정이 같은지는 scripts/check-offline-logic.mjs가
 * 같은 표로 대조한다. 한쪽을 고치면 다른 쪽도 고친다.
 */

const VERSION = new URLSearchParams(self.location.search).get("v") || "dev";
const CACHE_PREFIX = "offline-";
const CACHE_NAME = CACHE_PREFIX + VERSION;
const OFFLINE_PATH = "/offline";

const CONTENT_EXACT = ["/curriculum", "/concepts", "/concepts/terms", "/articles", "/glossary", "/about", "/offline"];
const CONTENT_PREFIXES = ["/lesson/", "/step/", "/basecamp/", "/concepts/", "/roadmap/", "/articles/"];
const BYPASS_ROOTS = ["/login", "/signup", "/unlock", "/api", "/_next"];
const STATIC_PREFIXES = ["/_next/static/", "/fonts/", "/static/"];
const STATIC_EXACT = ["/icon", "/apple-icon", "/favicon.ico"];
const ASSET_PATTERN = /\/_next\/static\/[^"'\s<>()\\&;]+/g;

function classifyPath(pathname) {
  const path = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  if (BYPASS_ROOTS.some((root) => path === root || path.startsWith(root + "/"))) return "bypass";
  if (CONTENT_EXACT.includes(path)) return "content";
  if (CONTENT_PREFIXES.some((prefix) => path.startsWith(prefix))) return "content";
  return "personal";
}

function isStaticAssetPath(pathname) {
  return STATIC_PREFIXES.some((prefix) => pathname.startsWith(prefix)) || STATIC_EXACT.includes(pathname);
}

function extractAssetPaths(text) {
  const found = new Set();
  for (const match of text.matchAll(ASSET_PATTERN)) {
    const file = match[0].split("?")[0];
    if (file.slice(file.lastIndexOf("/") + 1).includes(".")) found.add(match[0]);
  }
  return Array.from(found);
}

function absolute(path) {
  return new URL(path, self.location.origin).href;
}

// 현재 캐시(CACHE_NAME)에서 먼저 찾고, 없으면 모든 offline-* 캐시를 뒤진다(옛 배포의
// HTML이 옛 캐시에 있던 자기 조각을 그 캐시에서 찾을 수 있게 — 다른 배포가 캐시를
// 지우지 않으므로 여러 개가 함께 남아 있을 수 있다).
async function matchAnyCache(request) {
  const current = await caches.open(CACHE_NAME);
  const hit = await current.match(request, { ignoreVary: true });
  if (hit) return hit;
  return caches.match(request, { ignoreVary: true });
}

// CACHE_NAME이 이미 만들어져 있을 때만 쓴다(install이 만든다). 캐시가 통째로 지워졌거나
// 아직 설치 전이면 조용히 아무 것도 하지 않는다 — 호출부는 이 promise를 event.waitUntil로
// 살려 두고 실패를 콘솔 경고로만 남긴다.
async function cachePut(request, response) {
  if (!(await caches.has(CACHE_NAME))) return;
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response);
}

// 저장된 페이지가 하나도 없을 때(오프라인 목차조차 없을 때)의 마지막 안내.
function offlineNotice() {
  const html =
    '<!doctype html><html lang="ko"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1"><title>오프라인</title></head>' +
    '<body style="font-family: sans-serif; padding: 24px; line-height: 1.6">' +
    "<p>인터넷에 연결되어 있지 않고, 이 기기에 저장된 페이지도 없어요.</p>" +
    "<p>연결되면 더보기, 오프라인 저장에서 전체 받기를 눌러 주세요.</p>" +
    "</body></html>";
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

// 설치 때 오프라인 목차(/offline)와 그 화면 파일을 미리 받는다. 전체 받기를 하기 전에
// 비행기 모드가 되어도 목차 화면만은 뜨게 하려는 것이다. 로그인 상태에서만 등록되므로
// 같은 출처 fetch에 쿠키가 함께 간다.
async function precacheOfflinePage() {
  const cache = await caches.open(CACHE_NAME);
  const response = await fetch(OFFLINE_PATH, { credentials: "same-origin", cache: "no-store" });
  if (!response.ok || response.redirected) return;
  const html = await response.clone().text();
  await cache.put(absolute(OFFLINE_PATH), response);
  await Promise.all(
    extractAssetPaths(html).map(async (assetPath) => {
      try {
        const asset = await fetch(assetPath, { credentials: "same-origin" });
        if (asset.ok) await cache.put(absolute(assetPath), asset);
      } catch (error) {
        // 받지 못한 파일은 다음 온라인 방문 때 캐시 먼저 규칙이 채운다.
      }
    }),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    precacheOfflinePage()
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

// 옛 배포의 caches는 여기서 지우지 않는다(컨트롤러 판단) — 새 배포가 와도 옛 캐시는
// 그대로 둔다. 옛 캐시를 새 캐시로 다시 받은 뒤 지우는 일은 페이지 쪽 런타임(이후 단계)이
// 한다.
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

async function handleNavigation(event, url, kind) {
  try {
    const response = await fetch(event.request);
    // 콘텐츠만, 쿼리 없는 주소만, 정상 응답만 저장한다. 로그인 만료로 /login에 튕긴
    // 응답(opaqueredirect)이나 개인 화면은 저장하지 않는다(다른 사람 정보가 남지 않게).
    if (kind === "content" && url.search === "" && response.ok && response.type === "basic" && !response.redirected) {
      const copy = response.clone();
      event.waitUntil(
        cachePut(absolute(url.pathname), copy).catch((err) => console.warn("[sw] cache write failed", err)),
      );
    }
    return response;
  } catch (error) {
    if (kind === "content") {
      // 쿼리는 무시하고 경로로 찾는다(예: /articles?tag=... 는 기본 목록으로 대신).
      const cached = await matchAnyCache(absolute(url.pathname));
      if (cached) return cached;
    }
    if (url.pathname === OFFLINE_PATH) return offlineNotice();
    return Response.redirect(absolute(OFFLINE_PATH + "?from=" + encodeURIComponent(url.pathname)), 302);
  }
}

async function cacheFirst(event, request) {
  const cached = await matchAnyCache(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && response.type === "basic") {
    const copy = response.clone();
    event.waitUntil(cachePut(request, copy).catch((err) => console.warn("[sw] cache write failed", err)));
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    const kind = classifyPath(url.pathname);
    if (kind === "bypass") return;
    event.respondWith(handleNavigation(event, url, kind));
    return;
  }

  if (isStaticAssetPath(url.pathname)) {
    event.respondWith(cacheFirst(event, request));
  }
});
