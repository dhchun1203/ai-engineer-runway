// 오프라인 모드의 순수 로직(의존성 0). import 문을 하나도 쓰지 않는다. 그래야 Node가
// 타입 스트리핑으로 이 파일을 그대로 로드하고, scripts/check-offline-logic.mjs가 직접
// 실행해 검증한다(progress-math.ts와 같은 원칙). 타입도 erasable 문법만 쓴다(enum 금지).

// public/sw.js는 TS 모듈을 import할 수 없어 classifyOfflinePath와 extractStaticAssetPaths의
// 규칙을 복제한다. 두 판정이 같은지는 check-offline-logic.mjs가 같은 표로 대조한다.
// 한쪽을 고치면 다른 쪽도 함께 고친다.

// ---------------------------------------------------------------------------
// 쓰기 대기열 항목(설계 3.4). id가 "kind|key"라서 같은 항목을 다시 넣으면 IndexedDB의
// put이 앞의 것을 덮어쓴다. 즉 같은 kind와 key는 마지막 것만 남는다.

export type QueueInput =
  | { kind: "lessonComplete"; key: string; value: boolean }
  | { kind: "basecampItem"; key: string; value: boolean }
  | { kind: "note"; key: string; value: string };

export type QueueKind = QueueInput["kind"];

// userId: 넣을 때 확인된 계정(모르면 없음). 없으면 기기 저장본의 주인(meta.userId)의 것으로
// 본다(이 필드가 생기기 전에 넣은 항목 포함). rejections: 서버가 거절한 횟수 중 센 것(없으면 0).
// lastRejectedAt: 마지막으로 센 거절의 시각. 같은 키에 새 값을 넣으면 두 필드 모두 없어진다.
type QueueItemBase = { id: string; at: number; userId?: string; rejections?: number; lastRejectedAt?: number };

export type QueueItem =
  | (QueueItemBase & { kind: "lessonComplete"; key: string; value: boolean })
  | (QueueItemBase & { kind: "basecampItem"; key: string; value: boolean })
  | (QueueItemBase & { kind: "note"; key: string; value: string });

export function queueItemId(kind: QueueKind, key: string): string {
  return `${kind}|${key}`;
}

export function toQueueItem(input: QueueInput, at: number, userId: string | null = null): QueueItem {
  const item: QueueItem = { ...input, id: queueItemId(input.kind, input.key), at };
  return userId === null ? item : { ...item, userId };
}

/**
 * 이 계정(accountId)의 항목만 고른다. accountId를 모르면(null) 기기 저장본의 주인(metaOwner)을
 * 지금 계정으로 본다. userId가 없는 항목은 metaOwner의 것이고, 둘 다 모르면 지금 계정의 것으로
 * 본다(예전 동작). 다른 계정이 남긴 변경을 화면에 얹거나 서버로 보내지 않기 위해서다.
 */
export function itemsForAccount(
  queue: readonly QueueItem[],
  accountId: string | null,
  metaOwner: string | null,
): QueueItem[] {
  const current = accountId ?? metaOwner;
  if (current === null) return [...queue];
  return queue.filter((item) => (item.userId ?? metaOwner ?? current) === current);
}

// 서버가 같은 항목을 이만큼 거절하면 대기열에서 버린다(배포로 없어진 레슨 등). 남겨 두면 대기
// 개수 배지가 영영 안 사라지고, 로그아웃할 때마다 확인을 묻고, 같은 키의 이후 변경도 계속
// 대기열로 간다.
// 단 거절은 앞서 센 거절에서 30분이 지나야 한 번 더 센다. 서버 저장소가 잠시 멈춘 동안에도
// 로그인 확인(/api/auth)은 통과해 모든 재생이 "거절"로 보인다. 페이지를 몇 번 옮기는 것만으로
// 한도를 채워 오프라인에서 쓴 변경을 버리지 않게, 센 거절 세 번이 적어도 한 시간에 걸치게 한다.
export const MAX_QUEUE_REJECTIONS = 3;
export const REJECTION_SPACING_MS = 30 * 60 * 1000;

/**
 * 거절을 한 번 반영한 항목. 앞서 센 거절에서 30분이 안 지났으면 입력을 그대로(같은 객체) 돌려준다.
 * 세면 rejections와 lastRejectedAt을 바꾼 새 객체, 한도에 닿으면 null(버린다). 입력은 바꾸지 않는다.
 */
export function afterRejection(item: QueueItem, now: number): QueueItem | null {
  if (item.lastRejectedAt !== undefined && now - item.lastRejectedAt < REJECTION_SPACING_MS) return item;
  const rejections = (item.rejections ?? 0) + 1;
  return rejections >= MAX_QUEUE_REJECTIONS ? null : { ...item, rejections, lastRejectedAt: now };
}

/** 넣은 순서(at 오름차순). 원본 배열은 바꾸지 않는다. */
export function sortQueue(items: readonly QueueItem[]): QueueItem[] {
  return [...items].sort((a, b) => a.at - b.at);
}

/** 이 메모 키로 대기 중인 본문. 여러 개면 뒤의 것(정렬된 입력 기준 가장 늦은 것). */
export function queuedNote(queue: readonly QueueItem[], noteKey: string): string | null {
  let found: string | null = null;
  for (const item of queue) {
    if (item.kind === "note" && item.key === noteKey) found = item.value;
  }
  return found;
}

// ---------------------------------------------------------------------------
// 진도 사본에 대기열 변경분을 얹는다. /api/progress 응답(ProgressData)과 같은 모양의
// 필요한 필드만 구조로 받는다(여기서 앱 타입을 import하지 않기 위해서다).
// steps와 modules는 레슨이 어느 모듈에 속하는지 알아야 다시 셀 수 있어 그대로 둔다.

export type ProgressCounts = { completed: number; total: number; percent: number };
export type NoteField = { ok: true; body: string } | { ok: false };
export type ProgressLike = {
  overall: ProgressCounts | null;
  completedSlugs: string[] | null;
  lesson: { slug: string; done: boolean; note: NoteField } | null;
};

function percentOf(completed: number, total: number): number {
  return total === 0 ? 0 : Math.min(100, Math.max(0, Math.round((completed / total) * 100)));
}

/**
 * noteBody는 기기에 남긴 메모 사본(없으면 null). 메모 우선순위는 대기열 > 사본 > data의 값.
 * 입력은 바꾸지 않고 새 객체를 돌려준다.
 */
export function overlayProgress<T extends ProgressLike>(
  data: T,
  queue: readonly QueueItem[],
  noteBody: string | null,
): T {
  const ordered = sortQueue(queue);

  let completedSlugs: string[] | null = data.completedSlugs;
  let overall: ProgressCounts | null = data.overall;
  if (completedSlugs !== null) {
    const done = new Set(completedSlugs);
    let delta = 0;
    for (const item of ordered) {
      if (item.kind !== "lessonComplete") continue;
      const had = done.has(item.key);
      if (item.value && !had) {
        done.add(item.key);
        delta += 1;
      } else if (!item.value && had) {
        done.delete(item.key);
        delta -= 1;
      }
    }
    completedSlugs = [...done].sort();
    if (overall !== null && delta !== 0) {
      const completed = Math.min(overall.total, Math.max(0, overall.completed + delta));
      overall = { ...overall, completed, percent: percentOf(completed, overall.total) };
    }
  }

  const base = data.lesson;
  let lesson: ProgressLike["lesson"] = base;
  if (base !== null) {
    let done = base.done;
    if (completedSlugs !== null) {
      done = completedSlugs.includes(base.slug);
    } else {
      for (const item of ordered) {
        if (item.kind === "lessonComplete" && item.key === base.slug) done = item.value;
      }
    }
    const body = queuedNote(ordered, base.slug) ?? noteBody;
    const note: NoteField = body === null ? base.note : { ok: true, body };
    lesson = { ...base, done, note };
  }

  return { ...data, completedSlugs, overall, lesson } as T;
}

// ---------------------------------------------------------------------------
// 받은 HTML(또는 CSS)에서 같은 출처 /_next/static/ 파일 주소를 뽑는다. RSC 페이로드 안의
// 이스케이프된 문자열(\")과 HTML 엔티티(&quot;)에서 멈추도록 \ & ; 를 경계로 둔다.
// 파일 이름(점이 있는 마지막 조각)이 없는 디렉터리 문자열은 버린다.

const STATIC_ASSET_PATTERN = /\/_next\/static\/[^"'\s<>()\\&;]+/g;

function hasFileName(assetPath: string): boolean {
  const withoutQuery = assetPath.split("?")[0];
  return withoutQuery.slice(withoutQuery.lastIndexOf("/") + 1).includes(".");
}

export function extractStaticAssetPaths(text: string): string[] {
  const found = new Set<string>();
  for (const match of text.matchAll(STATIC_ASSET_PATTERN)) {
    if (hasFileName(match[0])) found.add(match[0]);
  }
  return [...found];
}

// ---------------------------------------------------------------------------
// 문서 경로 분류(설계 2절, 3.1). content = 오프라인에서도 읽는 콘텐츠(저장 대상),
// personal = 사용자별로 서버가 그리는 화면(오프라인이면 목차로 대신), bypass = 로그인 관련과
// 내부 경로(서비스 워커가 손대지 않음).

export type OfflinePathKind = "content" | "personal" | "bypass";

const CONTENT_EXACT = ["/curriculum", "/concepts", "/concepts/terms", "/articles", "/glossary", "/about", "/offline"];
const CONTENT_PREFIXES = ["/lesson/", "/step/", "/basecamp/", "/concepts/", "/roadmap/", "/articles/"];
const BYPASS_ROOTS = ["/login", "/signup", "/unlock", "/api", "/_next"];

export function classifyOfflinePath(pathname: string): OfflinePathKind {
  const path = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  if (BYPASS_ROOTS.some((root) => path === root || path.startsWith(`${root}/`))) return "bypass";
  if (CONTENT_EXACT.includes(path)) return "content";
  if (CONTENT_PREFIXES.some((prefix) => path.startsWith(prefix))) return "content";
  return "personal";
}

// ---------------------------------------------------------------------------
// 메모 키. 서버 저장 키와 같은 규칙이다(레슨은 slug 그대로, 베이스캠프와 아티클은 접두사).
// 클라이언트는 Server Action에 접두사 없는 slug를 넘기고, 접두사는 서버 액션이 붙인다.

export const NOTE_KEY_PREFIX = { lesson: "", basecamp: "basecamp:", article: "article:" } as const;

export type NoteTarget = "lesson" | "basecamp" | "article";

export function parseNoteKey(key: string): { target: NoteTarget; slug: string } {
  if (key.startsWith(NOTE_KEY_PREFIX.basecamp)) {
    return { target: "basecamp", slug: key.slice(NOTE_KEY_PREFIX.basecamp.length) };
  }
  if (key.startsWith(NOTE_KEY_PREFIX.article)) {
    return { target: "article", slug: key.slice(NOTE_KEY_PREFIX.article.length) };
  }
  return { target: "lesson", slug: key };
}

// ---------------------------------------------------------------------------
// "전체 받기"가 페이지와 함께 받아 두는 내 데이터 사본의 출처. 레슨은 진도 응답
// (완료와 메모를 함께 담는다), 베이스캠프와 아티클은 메모 응답이다.

export type SnapshotSource = { kind: "progress" | "note"; api: string; key: string };

const LESSON_PAGE = /^\/lesson\/([^/?#]+)$/;
const BASECAMP_PAGE = /^\/basecamp\/([^/?#]+)$/;
const ARTICLE_PAGE = /^\/articles\/([^/?#]+)$/;

export function snapshotSourceFor(pageUrl: string): SnapshotSource | null {
  const lesson = LESSON_PAGE.exec(pageUrl);
  if (lesson) {
    return { kind: "progress", api: `/api/progress?lesson=${lesson[1]}`, key: decodeURIComponent(lesson[1]) };
  }
  const basecamp = BASECAMP_PAGE.exec(pageUrl);
  if (basecamp) {
    return {
      kind: "note",
      api: `/api/basecamp-note?slug=${basecamp[1]}`,
      key: `${NOTE_KEY_PREFIX.basecamp}${decodeURIComponent(basecamp[1])}`,
    };
  }
  const article = ARTICLE_PAGE.exec(pageUrl);
  if (article) {
    return {
      kind: "note",
      api: `/api/article-note?slug=${article[1]}`,
      key: `${NOTE_KEY_PREFIX.article}${decodeURIComponent(article[1])}`,
    };
  }
  return null;
}

// ---------------------------------------------------------------------------
// /api/auth 응답 해석. userId가 없으면(시크릿 쿠키 로그인 등) null.
// buildId는 서버의 현재 빌드 id. 대기열 재생 전에 페이지의 빌드 id와 비교한다(다르면
// 새로 불러온 뒤 재생한다. 빌드마다 서버 작업 식별자가 달라지기 때문). 읽지 못하면 null.

export type AuthState = { loggedIn: boolean; userId: string | null; buildId: string | null };

export function parseAuthState(json: unknown): AuthState {
  if (typeof json !== "object" || json === null) return { loggedIn: false, userId: null, buildId: null };
  const record = json as { loggedIn?: unknown; userId?: unknown; buildId?: unknown };
  const userId = typeof record.userId === "string" && record.userId.length > 0 ? record.userId : null;
  const buildId = typeof record.buildId === "string" && record.buildId.length > 0 ? record.buildId : null;
  return { loggedIn: Boolean(record.loggedIn), userId, buildId };
}

// ---------------------------------------------------------------------------
// /offline-manifest.json 모양(라우트 핸들러와 /offline 화면이 함께 쓴다).

export type OfflineManifestItem = { url: string; title: string };
export type OfflineManifestGroup = { label: string; items: OfflineManifestItem[] };
export type OfflineManifest = { buildId: string; groups: OfflineManifestGroup[] };

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
