# 오프라인 모드 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 인터넷이 없을 때도 아이패드에서 저장한 학습 콘텐츠를 읽고, 완료 체크와 메모를 남기고, 연결이 돌아오면 자동으로 서버와 맞추는 오프라인 모드를 만든다.

**Architecture:** 직접 쓴 서비스 워커(`public/sw.js`)가 콘텐츠 문서는 네트워크 먼저, 정적 파일은 캐시 먼저로 다루고, 개인 화면은 오프라인 목차(`/offline`)로 대신한다. 캐시 이름에 빌드 id를 넣어 같은 빌드의 HTML과 JS 조각을 한 캐시에 묶는다. 내 진도와 메모는 IndexedDB(`offline-db`)에 마지막 사본과 쓰기 대기열로 남기고, 기존 Server Action을 그대로 다시 불러 동기화한다(서버 계약 변경 없음). 헤더의 ON AIR 램프가 연결 상태와 대기 개수를 보여 준다.

**Tech Stack:** Next.js 16.3.2 App Router, React 19.2, Tailwind v4, Supabase(기존 Server Action 재사용), Service Worker, Cache Storage, IndexedDB, Playwright(`@playwright/test`, 기존 devDependency), Node 타입 스트리핑 게이트(`scripts/*.mjs`, 의존성 0).

**Spec:** `docs/superpowers/specs/2026-09-23-offline-mode-design.md`

## Global Constraints

- 작업은 메인 체크아웃 `C:/Users/dhchu/dev/aiEngineerCourse`의 브랜치 `feat/offline-mode`에서 한다. git worktree는 쓰지 않는다(사용자 보안 규칙상 worktree에는 `.env.local`을 가져올 수 없다). 각 Task는 이 브랜치에 커밋하고, 병합과 배포는 마지막 Task에서만 한다.
- 추적되지 않는 기존 파일 `.claude/launch.json`, `output/`은 커밋하지 않는다. `git add`에는 항상 파일 경로를 하나씩 적는다.
- Next.js는 이 저장소 버전(16.3.2) 규칙을 따른다. 코드 쓰기 전 `node_modules/next/dist/docs/`의 해당 가이드(특히 `01-app/02-guides/progressive-web-apps.md`, `01-app/03-api-reference/05-config/01-next-config-js/headers.md`, `.../env.md`, `01-app/03-api-reference/03-file-conventions/route.md`)를 확인한다. 페이지의 `params`, `searchParams`는 Promise다.
- 외부 의존성 추가 금지(`package.json` 변경 없음). 서비스 워커는 Serwist, Workbox 없이 직접 쓴다.
- 서버 계약은 바꾸지 않는다. Server Action 시그니처와 `/api/progress`, `/api/basecamp-note`, `/api/article-note` 응답은 그대로다. 유일한 예외는 `/api/auth` 응답에 `userId` 필드 하나를 더하는 것(계정 전환 감지용, Task 3).
- 완료 토글 재생은 "목표 상태"로 보낸다. 서버는 `!currentlyDone`을 저장하므로 `toggleLessonComplete(slug, !target)`, `toggleBasecampItem(id, !target)`로 부른다.
- 서비스 워커는 production(`next build` 후 `next start`, Vercel)에서만 등록한다. 개발 서버(Turbopack)에서는 등록하지 않는다. 오프라인 동작 확인은 항상 빌드 후 `next start`로 한다.
- 공개되는 모든 글과 UI, 코드 주석에 교육기관명 금지(`scripts/check-brand.mjs`가 src, docs, public을 검사). 이메일 주소도 쓰지 않는다(같은 게이트가 잡는다). 테스터 계정 이메일과 비밀번호는 문서와 코드에 쓰지 않고 실행 시 환경 변수 `E2E_TESTER_EMAIL`, `E2E_TESTER_PASSWORD`로만 넘긴다(값은 사용자 auto-memory의 tester-account 메모).
- 새 UI 문구와 새 한국어 주석에는 가운데점(U+00B7)과 긴하이픈(U+2014)을 쓰지 않는다. 쉼표, 줄바꿈, 괄호로 쓴다.
- UI 버튼과 아이콘에 이모지 금지. 아이콘은 `lucide-react`. 램프는 글자와 도형으로 그린다.
- 색은 디자인 토큰으로만. `.tsx`와 `globals.css`의 `@theme` 밖에 hex, rgb 리터럴 금지, Tailwind 임의값 대괄호(`[...]`) 금지, 기본 팔레트 색 유틸리티(`text-blue-500` 등) 금지(`scripts/check-design-tokens.mjs`).
- 애니메이션은 opacity, transform, box-shadow만 바꾸고, 바로 뒤에 `@media (prefers-reduced-motion: reduce)` 블록으로 끈다.
- 터치 타깃 44px 이상(`min-h-11`, `min-w-11`), 아이패드(768px) 우선, 375px에서도 헤더가 한 줄이고 가로 넘침이 없어야 한다.
- 기존 게이트 불변식 유지: `complete-button.tsx`에 `?? initialDone`과 `await onToggled?.()`가 남아야 하고(G12), `progress-provider.tsx`의 `status: "loading", data` 리터럴은 정확히 1회(G23), `'use client'` 파일은 `lib/supabase/admin`, `lib/progress-store`를 import하지 않는다(G2).
- 기존 실패 기준선(작업 전 master에서 확인됨). 이 목록 밖의 새 실패가 없어야 한다.
  - `node scripts/check-progress-gates.mjs`: 3건(G9, G17 `src\app\schedule\page.tsx not found`, G22 `src\components\roadmap\lesson-toc.tsx`)
  - `node scripts/check-design-tokens.mjs`: `src/components/til/til-streak.tsx` 3건
  - `node scripts/check-brand.mjs`: 기존 docs 3개 파일(`plans/2026-09-10-til-learning-log.md`, `specs/2026-09-07-bonus-concepts-curriculum-design.md`, `specs/2026-09-10-til-learning-log-design.md`)
  - `node scripts/check-font-glyph-coverage.mjs`: Pretendard 비한글 21자(U+00F7, U+014D, U+203B, U+2197, U+21A9, U+21BA, U+21BB, U+2260, U+2423, U+2500, U+25B3, U+25B6, U+25BE, U+25C0, U+300A, U+300B, U+627F, U+71B1, U+7D50, U+8D77, U+8F49)
  - `npm run lint`: 기존 오류 4건(`basecamp-step-checklist.tsx` refs during render, `attention-viz.tsx` unescaped quotes, `lesson-toc.tsx` setState in effect). `basecamp-step-checklist.tsx`는 이번에 고치지만 그 오류를 늘리지 않는다.
  - 타입 검사는 `npx next typegen && npx tsc --noEmit -p .`로 한다(맨 `tsc`는 작업 전부터 실패).
- 커밋 메시지 끝 줄: `Co-Authored-By: (세션이 안내한 attribution 줄)`

## File Structure

| 파일 | 역할 |
| --- | --- |
| `src/lib/offline/offline-logic.ts` (생성) | 의존성 0 순수 로직: 대기열 항목과 합치기, 진도 사본에 대기열 얹기, 정적 파일 주소 추출, 경로 분류, 사본 출처, 메모 키, 인증 응답 해석, 용량 표기. Node가 그대로 로드해 검사한다 |
| `scripts/check-offline-logic.mjs` (생성) | 위 순수 로직 검사 + `public/sw.js`와 판정 대조 |
| `public/sw.js` (생성) | 서비스 워커: 설치 시 `/offline` 미리 저장, 활성화 시 옛 캐시 삭제, 요청 규칙 |
| `next.config.ts` (수정) | `env.NEXT_PUBLIC_BUILD_ID`, `/sw.js` 응답 헤더 |
| `src/proxy.ts` (수정) | `/sw.js`를 로그인 없이 열리는 경로에 추가(로그아웃 상태에서도 해제 가능) |
| `src/lib/offline/connectivity.ts` (생성) | 연결 상태 저장소(`useOnline`, `isOnline`, 10초 확인 요청) |
| `src/lib/offline/db.ts` (생성) | IndexedDB `offline-db` v1 Promise 래퍼, meta 읽기와 쓰기, DB 삭제 |
| `src/lib/offline/queue.ts` (생성) | 쓰기 대기열(넣기, 읽기, 지우기)과 대기 개수 저장소(`useQueueCount`) |
| `src/lib/offline/snapshots.ts` (생성) | 진도와 메모의 마지막 사본 저장, 오프라인 읽기(사본 + 대기열) |
| `src/lib/offline/sync.ts` (생성) | `writeOrQueue`(온라인이면 바로, 아니면 대기열), `replayQueue`(동기화), 인증 조회, 재로그인 필요 저장소 |
| `src/lib/offline/cache.ts` (생성) | 캐시 이름 규칙(`offline-<빌드 id>`), 저장된 경로 조회, 캐시 삭제 |
| `src/lib/offline/wipe.ts` (생성) | 로그아웃과 계정 전환 때 저장본, IndexedDB, 서비스 워커 정리 |
| `src/lib/offline/download.ts` (생성) | "전체 받기"(페이지, 화면 파일, 내 데이터 사본), 저장본 지우기, 목록 파일 읽기 |
| `src/components/offline/offline-runtime.tsx` (생성) | 루트 아일랜드: 계정 대조, 서비스 워커 등록과 해제, 동기화 계기, 오프라인 링크 이동 |
| `src/components/offline/sign-out-form.tsx` (생성) | 로그아웃 전에 기기 저장본을 지우는 폼 |
| `src/components/offline/offline-center.tsx` (생성) | `/offline` 화면 본체(전체 받기, 동기화 현황, 저장된 콘텐츠 목차) |
| `src/components/offline/on-air-lamp.tsx` (생성) | 헤더의 ON AIR 램프와 대기 개수 배지 |
| `src/app/offline/page.tsx` (생성) | 정적 셸 페이지 |
| `src/app/offline-manifest.json/route.ts` (생성) | 오프라인 대상 URL과 제목 목록(정적 생성) |
| `src/app/api/auth/route.ts` (수정) | 응답에 `userId` 추가 |
| `src/app/layout.tsx` (수정) | `<OfflineRuntime />` 마운트 |
| `src/app/login/page.tsx`, `src/app/signup/page.tsx` (수정) | 로그아웃 폼을 `SignOutForm`으로 |
| `src/components/site-nav.tsx` (수정) | 더보기에 "오프라인 저장", 오른쪽 컨트롤에 램프 |
| `src/components/continue-reading-card.tsx` (수정) | `parseLastLesson` export |
| `src/components/progress-provider.tsx` (수정) | 사본 저장, 오프라인이면 사본 + 대기열로 그리기 |
| `src/components/complete-button.tsx`, `src/components/basecamp/basecamp-step-checklist.tsx`, `src/components/basecamp/basecamp-prep-checklist.tsx` (수정) | 쓰기를 `writeOrQueue`로 |
| `src/components/lesson-notepad.tsx` (수정) | 메모 저장을 `writeOrQueue`로, "기기에 저장됨" 상태 |
| `src/components/basecamp-note.tsx`, `src/components/article-note.tsx` (수정) | 메모 사본 저장과 오프라인 읽기 |
| `src/components/run-python.tsx`, `src/components/run-sql.tsx`, `src/components/bookmark-button.tsx`, `src/components/lesson-needs-review.tsx`, `src/components/lesson-til.tsx` (수정) | 오프라인이면 잠금과 짧은 안내 |
| `src/app/globals.css` (수정) | 램프 색 토큰(`@theme`), 램프 도형과 애니메이션 |
| `scripts/e2e-offline.mjs` (생성) | 오프라인 모드 브라우저 게이트(포트 3216, 프로덕션 서버) |

---

### Task 1: 브랜치와 오프라인 순수 로직

**Files:**
- Create: `src/lib/offline/offline-logic.ts`
- Test: `scripts/check-offline-logic.mjs`

**Interfaces:**
- Produces (offline-logic.ts, 전부 named export):
  - `type QueueKind = "lessonComplete" | "basecampItem" | "note"`
  - `type QueueInput = { kind: "lessonComplete"; key: string; value: boolean } | { kind: "basecampItem"; key: string; value: boolean } | { kind: "note"; key: string; value: string }`
  - `type QueueItem = QueueInput & { id: string; at: number }`(유니언 각 갈래에 `id`, `at`)
  - `queueItemId(kind: QueueKind, key: string): string` (`"<kind>|<key>"`)
  - `toQueueItem(input: QueueInput, at: number): QueueItem`
  - `sortQueue(items: readonly QueueItem[]): QueueItem[]` (at 오름차순, 원본 불변)
  - `queuedNote(queue: readonly QueueItem[], noteKey: string): string | null`
  - `type ProgressCounts`, `type NoteField`, `type ProgressLike`
  - `overlayProgress<T extends ProgressLike>(data: T, queue: readonly QueueItem[], noteBody: string | null): T`
  - `extractStaticAssetPaths(text: string): string[]`
  - `type OfflinePathKind = "content" | "personal" | "bypass"`, `classifyOfflinePath(pathname: string): OfflinePathKind`
  - `NOTE_KEY_PREFIX: { lesson: ""; basecamp: "basecamp:"; article: "article:" }`
  - `type NoteTarget = "lesson" | "basecamp" | "article"`, `parseNoteKey(key: string): { target: NoteTarget; slug: string }`
  - `type SnapshotSource = { kind: "progress" | "note"; api: string; key: string }`, `snapshotSourceFor(pageUrl: string): SnapshotSource | null`
  - `type AuthState = { loggedIn: boolean; userId: string | null }`, `parseAuthState(json: unknown): AuthState`
  - `type OfflineManifestItem = { url: string; title: string }`, `type OfflineManifestGroup = { label: string; items: OfflineManifestItem[] }`, `type OfflineManifest = { buildId: string; groups: OfflineManifestGroup[] }`
  - `formatBytes(bytes: number): string`

- [ ] **Step 1: 작업 브랜치 만들기**

```bash
cd C:/Users/dhchu/dev/aiEngineerCourse
git checkout master
git pull --ff-only
git checkout -b feat/offline-mode
```

Expected: `Switched to a new branch 'feat/offline-mode'`.

- [ ] **Step 2: 실패하는 검사 스크립트 작성**

`scripts/check-offline-logic.mjs`:

```js
#!/usr/bin/env node
// 오프라인 모드 순수 로직 게이트. src/lib/offline/offline-logic.ts의 함수를 node:assert로
// 직접 실행해 검증한다. 외부 의존성 0, 새 devDependency 없음. offline-logic.ts는 import를
// 쓰지 않으므로 Node가 타입 스트리핑으로 그대로 로드한다(check-progress-math.mjs와 같은 원리).
// 검사 0건은 성공이 아니라 실패다.
//
// 실행: node scripts/check-offline-logic.mjs

import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const LOGIC_PATH = path.join(ROOT, 'src', 'lib', 'offline', 'offline-logic.ts');

const failures = [];
let caseCount = 0;

function runCase(name, fn) {
  caseCount += 1;
  try {
    fn();
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

// 경로 판정 표. public/sw.js 대조에도 같은 표를 쓴다.
const PATH_TABLE = [
  ['/lesson/python-variables', 'content'],
  ['/lesson/python-variables/', 'content'],
  ['/step/1', 'content'],
  ['/curriculum', 'content'],
  ['/basecamp/ai-literacy-prompt', 'content'],
  ['/basecamp', 'personal'],
  ['/concepts', 'content'],
  ['/concepts/attention', 'content'],
  ['/concepts/terms', 'content'],
  ['/concepts/terms/runner', 'content'],
  ['/roadmap/some-lesson', 'content'],
  ['/roadmap', 'personal'],
  ['/articles', 'content'],
  ['/articles/linear-ci-bottleneck', 'content'],
  ['/glossary', 'content'],
  ['/about', 'content'],
  ['/offline', 'content'],
  ['/', 'personal'],
  ['/notes', 'personal'],
  ['/bookmarks', 'personal'],
  ['/inbox', 'personal'],
  ['/review', 'personal'],
  ['/til', 'personal'],
  ['/til/abc', 'personal'],
  ['/admin', 'personal'],
  ['/login', 'bypass'],
  ['/signup', 'bypass'],
  ['/unlock', 'bypass'],
  ['/unlock/done', 'bypass'],
  ['/api/progress', 'bypass'],
  ['/_next/static/chunks/a.js', 'bypass'],
  ['/lessons', 'personal'],
  ['/loginx', 'personal'],
];

// 정적 파일 주소 추출 표본. HTML 속성, RSC 페이로드 안의 이스케이프된 문자열,
// HTML 엔티티, 디렉터리 문자열, 외부 출처, CSS url()을 함께 담는다.
const ASSET_SAMPLE = [
  '<link rel="stylesheet" href="/_next/static/css/app.css?dpl=dpl_1"/>',
  '<script src="/_next/static/chunks/main.js" async=""></script>',
  '<script>self.__next_f.push([1,"0:[\\"/_next/static/chunks/page-abc.js\\",\\"/_next/static/chunks/page-abc.js\\"]"])</script>',
  '<link rel="preload" href="/_next/static/media/font.woff2" as="font"/>',
  '<script>var base = "/_next/static/chunks/";</script>',
  '<div data-x="{&quot;/_next/static/chunks/data.js&quot;}"></div>',
  '<script src="https://cdn.example.com/other.js"></script>',
  '@font-face{src:url(/_next/static/media/a.woff2) format("woff2")}',
  '.x{background:url("/_next/static/media/b.png")}',
].join('\n');

const ASSET_EXPECTED = [
  '/_next/static/chunks/data.js',
  '/_next/static/chunks/main.js',
  '/_next/static/chunks/page-abc.js',
  '/_next/static/css/app.css?dpl=dpl_1',
  '/_next/static/media/a.woff2',
  '/_next/static/media/b.png',
  '/_next/static/media/font.woff2',
];

function baseProgress() {
  return {
    unlocked: true,
    ok: true,
    overall: { completed: 1, total: 4, percent: 25 },
    steps: { 1: { completed: 1, total: 4, percent: 25 } },
    completedSlugs: ['a'],
    lesson: { slug: 'b', done: false, note: { ok: true, body: '서버 메모' }, til: '한 줄', needsReview: true },
  };
}

async function main() {
  const logic = await import(pathToFileURL(LOGIC_PATH).href);
  const {
    queueItemId,
    toQueueItem,
    sortQueue,
    queuedNote,
    overlayProgress,
    extractStaticAssetPaths,
    classifyOfflinePath,
    NOTE_KEY_PREFIX,
    parseNoteKey,
    snapshotSourceFor,
    parseAuthState,
    formatBytes,
  } = logic;

  runCase('queueItemId는 kind|key', () => {
    assert.equal(queueItemId('note', 'article:x'), 'note|article:x');
  });

  runCase('toQueueItem은 id와 at을 붙인다', () => {
    assert.deepEqual(toQueueItem({ kind: 'note', key: 'basecamp:x', value: '본문' }, 5), {
      kind: 'note',
      key: 'basecamp:x',
      value: '본문',
      id: 'note|basecamp:x',
      at: 5,
    });
  });

  runCase('같은 kind와 key는 같은 id(대기열에서 마지막 것만 남는다)', () => {
    const first = toQueueItem({ kind: 'lessonComplete', key: 'a', value: true }, 1);
    const second = toQueueItem({ kind: 'lessonComplete', key: 'a', value: false }, 2);
    assert.equal(first.id, second.id);
    const other = toQueueItem({ kind: 'basecampItem', key: 'a', value: true }, 3);
    assert.notEqual(first.id, other.id);
  });

  runCase('sortQueue는 at 오름차순, 원본 불변', () => {
    const items = [
      toQueueItem({ kind: 'note', key: 'c', value: '3' }, 3),
      toQueueItem({ kind: 'note', key: 'a', value: '1' }, 1),
      toQueueItem({ kind: 'note', key: 'b', value: '2' }, 2),
    ];
    const snapshot = JSON.stringify(items);
    assert.deepEqual(sortQueue(items).map((i) => i.at), [1, 2, 3]);
    assert.equal(JSON.stringify(items), snapshot);
  });

  runCase('queuedNote는 같은 키의 메모만 찾는다', () => {
    const queue = [
      toQueueItem({ kind: 'lessonComplete', key: 'b', value: true }, 1),
      toQueueItem({ kind: 'note', key: 'b', value: '대기 메모' }, 2),
    ];
    assert.equal(queuedNote(queue, 'b'), '대기 메모');
    assert.equal(queuedNote(queue, 'c'), null);
    assert.equal(queuedNote([toQueueItem({ kind: 'lessonComplete', key: 'b', value: true }, 1)], 'b'), null);
  });

  runCase('overlayProgress: 완료 추가가 목록, 전체 진행률, 레슨 상태에 반영', () => {
    const data = baseProgress();
    const out = overlayProgress(data, [toQueueItem({ kind: 'lessonComplete', key: 'b', value: true }, 1)], null);
    assert.deepEqual(out.completedSlugs, ['a', 'b']);
    assert.deepEqual(out.overall, { completed: 2, total: 4, percent: 50 });
    assert.equal(out.lesson.done, true);
    assert.equal(out.lesson.til, '한 줄');
    assert.equal(out.lesson.needsReview, true);
    assert.deepEqual(out.steps, baseProgress().steps);
    assert.deepEqual(data, baseProgress());
  });

  runCase('overlayProgress: 완료 취소', () => {
    const out = overlayProgress(baseProgress(), [toQueueItem({ kind: 'lessonComplete', key: 'a', value: false }, 1)], null);
    assert.deepEqual(out.completedSlugs, []);
    assert.deepEqual(out.overall, { completed: 0, total: 4, percent: 0 });
  });

  runCase('overlayProgress: 이미 같은 상태면 진행률 불변', () => {
    const out = overlayProgress(baseProgress(), [toQueueItem({ kind: 'lessonComplete', key: 'a', value: true }, 1)], null);
    assert.deepEqual(out.overall, { completed: 1, total: 4, percent: 25 });
  });

  runCase('overlayProgress: 늦게 넣은 항목이 이긴다', () => {
    const queue = [
      toQueueItem({ kind: 'lessonComplete', key: 'b', value: true }, 2),
      toQueueItem({ kind: 'lessonComplete', key: 'b', value: false }, 1),
    ];
    const out = overlayProgress(baseProgress(), queue, null);
    assert.equal(out.lesson.done, true);
  });

  runCase('overlayProgress: 메모 우선순위(대기열 > 사본 > 서버)', () => {
    const queued = overlayProgress(baseProgress(), [toQueueItem({ kind: 'note', key: 'b', value: '대기 메모' }, 1)], '사본 메모');
    assert.deepEqual(queued.lesson.note, { ok: true, body: '대기 메모' });
    const copy = overlayProgress(baseProgress(), [], '사본 메모');
    assert.deepEqual(copy.lesson.note, { ok: true, body: '사본 메모' });
    const server = overlayProgress(baseProgress(), [], null);
    assert.deepEqual(server.lesson.note, { ok: true, body: '서버 메모' });
  });

  runCase('overlayProgress: 메모 읽기 실패는 사본이 없으면 그대로', () => {
    const data = { ...baseProgress(), lesson: { ...baseProgress().lesson, note: { ok: false } } };
    assert.deepEqual(overlayProgress(data, [], null).lesson.note, { ok: false });
  });

  runCase('overlayProgress: completedSlugs가 null이면 대기열로 레슨 상태만', () => {
    const data = { ...baseProgress(), completedSlugs: null, overall: null };
    const out = overlayProgress(data, [toQueueItem({ kind: 'lessonComplete', key: 'b', value: true }, 1)], null);
    assert.equal(out.completedSlugs, null);
    assert.equal(out.overall, null);
    assert.equal(out.lesson.done, true);
  });

  runCase('overlayProgress: lesson이 null이면 null', () => {
    const out = overlayProgress({ ...baseProgress(), lesson: null }, [], '사본');
    assert.equal(out.lesson, null);
  });

  runCase('extractStaticAssetPaths: HTML, RSC, CSS에서 같은 출처 정적 파일만', () => {
    assert.deepEqual([...extractStaticAssetPaths(ASSET_SAMPLE)].sort(), ASSET_EXPECTED);
  });

  runCase('classifyOfflinePath 표', () => {
    for (const [pathname, expected] of PATH_TABLE) {
      assert.equal(classifyOfflinePath(pathname), expected, pathname);
    }
  });

  runCase('NOTE_KEY_PREFIX', () => {
    assert.deepEqual({ ...NOTE_KEY_PREFIX }, { lesson: '', basecamp: 'basecamp:', article: 'article:' });
  });

  runCase('parseNoteKey', () => {
    assert.deepEqual(parseNoteKey('basecamp:x'), { target: 'basecamp', slug: 'x' });
    assert.deepEqual(parseNoteKey('article:y'), { target: 'article', slug: 'y' });
    assert.deepEqual(parseNoteKey('python-variables'), { target: 'lesson', slug: 'python-variables' });
  });

  runCase('snapshotSourceFor', () => {
    assert.deepEqual(snapshotSourceFor('/lesson/python-variables'), {
      kind: 'progress',
      api: '/api/progress?lesson=python-variables',
      key: 'python-variables',
    });
    assert.deepEqual(snapshotSourceFor('/basecamp/ai-literacy-prompt'), {
      kind: 'note',
      api: '/api/basecamp-note?slug=ai-literacy-prompt',
      key: 'basecamp:ai-literacy-prompt',
    });
    assert.deepEqual(snapshotSourceFor('/articles/linear-ci-bottleneck'), {
      kind: 'note',
      api: '/api/article-note?slug=linear-ci-bottleneck',
      key: 'article:linear-ci-bottleneck',
    });
    assert.equal(snapshotSourceFor('/concepts/attention'), null);
    assert.equal(snapshotSourceFor('/articles'), null);
    assert.equal(snapshotSourceFor('/lesson/a/b'), null);
  });

  runCase('parseAuthState', () => {
    assert.deepEqual(parseAuthState({ loggedIn: true, userId: 'u1' }), { loggedIn: true, userId: 'u1' });
    assert.deepEqual(parseAuthState({ loggedIn: 1 }), { loggedIn: true, userId: null });
    assert.deepEqual(parseAuthState({ loggedIn: true, userId: 5 }), { loggedIn: true, userId: null });
    assert.deepEqual(parseAuthState({ loggedIn: true, userId: '' }), { loggedIn: true, userId: null });
    assert.deepEqual(parseAuthState(null), { loggedIn: false, userId: null });
  });

  runCase('formatBytes', () => {
    assert.equal(formatBytes(0), '0 B');
    assert.equal(formatBytes(512), '512 B');
    assert.equal(formatBytes(1536), '1.5 KB');
    assert.equal(formatBytes(5 * 1024 * 1024), '5.0 MB');
  });

  report();
}

function report() {
  if (caseCount === 0) {
    console.error('check-offline-logic: 수행한 검사가 0건입니다. 실패로 처리합니다.');
    process.exit(1);
  }
  if (failures.length > 0) {
    console.error(`check-offline-logic: ${caseCount}건 중 ${failures.length}건 실패`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log(`check-offline-logic: ${caseCount}건 전부 통과`);
}

main().catch((e) => {
  console.error(`check-offline-logic: ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
});
```

- [ ] **Step 3: 실패 확인**

Run: `node scripts/check-offline-logic.mjs`
Expected: 종료 코드 1, `check-offline-logic: Cannot find module ... offline-logic.ts` 형태의 오류.

- [ ] **Step 4: 순수 로직 구현**

`src/lib/offline/offline-logic.ts`:

```ts
// 오프라인 모드의 순수 로직(의존성 0). import 문을 하나도 쓰지 않는다. 그래야 Node가
// 타입 스트리핑으로 이 파일을 그대로 로드하고, scripts/check-offline-logic.mjs가 직접
// 실행해 검증한다(progress-math.ts와 같은 원칙). 타입도 erasable 문법만 쓴다(enum 금지).
//
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

export type QueueItem =
  | { id: string; at: number; kind: "lessonComplete"; key: string; value: boolean }
  | { id: string; at: number; kind: "basecampItem"; key: string; value: boolean }
  | { id: string; at: number; kind: "note"; key: string; value: string };

export function queueItemId(kind: QueueKind, key: string): string {
  return `${kind}|${key}`;
}

export function toQueueItem(input: QueueInput, at: number): QueueItem {
  return { ...input, id: queueItemId(input.kind, input.key), at };
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

export type AuthState = { loggedIn: boolean; userId: string | null };

export function parseAuthState(json: unknown): AuthState {
  if (typeof json !== "object" || json === null) return { loggedIn: false, userId: null };
  const record = json as { loggedIn?: unknown; userId?: unknown };
  const userId = typeof record.userId === "string" && record.userId.length > 0 ? record.userId : null;
  return { loggedIn: Boolean(record.loggedIn), userId };
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
```

- [ ] **Step 5: 통과 확인**

Run: `node scripts/check-offline-logic.mjs`
Expected: `check-offline-logic: 20건 전부 통과`

Run: `npx next typegen && npx tsc --noEmit -p .`
Expected: 오류 없음(출력 없음).

- [ ] **Step 6: Commit**

```bash
git add src/lib/offline/offline-logic.ts scripts/check-offline-logic.mjs
git commit -m "feat(offline): 오프라인 모드 순수 로직과 검사 게이트(대기열, 진도 사본 덧씌우기, 경로 분류, 정적 파일 추출)

Co-Authored-By: (세션이 안내한 attribution 줄)"
```

---

### Task 2: 서비스 워커와 빌드 버전

**Files:**
- Create: `public/sw.js`
- Modify: `next.config.ts` (전체 교체)
- Modify: `src/proxy.ts:21-23` (`PUBLIC_EXACT`)
- Modify: `scripts/check-offline-logic.mjs` (import 두 줄, `main()` 끝의 `report();` 앞에 대조 블록)

**Interfaces:**
- Consumes: Task 1의 `classifyOfflinePath`, `extractStaticAssetPaths`(대조 대상)
- Produces:
  - `process.env.NEXT_PUBLIC_BUILD_ID: string`(빌드 때 박힘. Vercel은 커밋 sha, 로컬은 `local-<시각>`)
  - 서비스 워커 계약: 등록 주소 `/sw.js?v=<NEXT_PUBLIC_BUILD_ID>`, 캐시 이름 `offline-<v>`, `/offline` 설치 시 미리 저장, 오프라인 폴백 `302 /offline?from=<encodeURIComponent(경로)>`
  - sw.js 최상위 함수 `classifyPath(pathname)`, `isStaticAssetPath(pathname)`, `extractAssetPaths(text)`(검사 스크립트가 vm으로 부른다)

- [ ] **Step 1: 대조 검사 추가(실패하는 테스트)**

`scripts/check-offline-logic.mjs` 맨 위 import 묶음에서

```js
import assert from 'node:assert/strict';
import path from 'node:path';
```

를 다음으로 바꾼다.

```js
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
```

같은 파일 `main()` 안의 마지막 줄

```js
  report();
}
```

을 다음으로 바꾼다(첫 번째로 나오는 `  report();\n}` 하나뿐이다).

```js
  // --- public/sw.js 대조: 서비스 워커는 TS를 import할 수 없어 규칙을 복제한다. 복제본이
  // offline-logic.ts와 같은 판정을 내는지 같은 표로 확인한다. sw.js는 classic 스크립트라
  // 최상위 function 선언이 vm 컨텍스트의 전역 속성이 된다.
  const SW_PATH = path.join(ROOT, 'public', 'sw.js');
  const sw = vm.createContext({
    self: {
      location: { search: '?v=check', origin: 'http://127.0.0.1:3216' },
      addEventListener() {},
    },
    URL,
    URLSearchParams,
  });
  vm.runInContext(fs.readFileSync(SW_PATH, 'utf8'), sw, { filename: 'sw.js' });

  runCase('sw.js classifyPath가 offline-logic.ts와 같은 판정', () => {
    for (const [pathname, expected] of PATH_TABLE) {
      assert.equal(sw.classifyPath(pathname), expected, pathname);
    }
  });

  runCase('sw.js extractAssetPaths가 offline-logic.ts와 같은 결과', () => {
    assert.deepEqual(Array.from(sw.extractAssetPaths(ASSET_SAMPLE)).sort(), ASSET_EXPECTED);
  });

  runCase('sw.js isStaticAssetPath', () => {
    for (const p of ['/_next/static/chunks/a.js', '/fonts/PretendardVariable.subset.woff2', '/static/x.png', '/icon', '/apple-icon', '/favicon.ico']) {
      assert.equal(sw.isStaticAssetPath(p), true, p);
    }
    for (const p of ['/api/progress', '/lesson/a', '/_next/image', '/manifest.webmanifest', '/offline']) {
      assert.equal(sw.isStaticAssetPath(p), false, p);
    }
  });

  report();
}
```

- [ ] **Step 2: 실패 확인**

Run: `node scripts/check-offline-logic.mjs`
Expected: 종료 코드 1, `ENOENT ... public\sw.js` 오류.

- [ ] **Step 3: 서비스 워커 작성**

`public/sw.js`:

```js
/* global self, caches */
/*
 * 오프라인 모드 서비스 워커(docs/superpowers/specs/2026-09-23-offline-mode-design.md 3.1).
 * 외부 라이브러리 없이 직접 쓴다. 등록은 src/components/offline/offline-runtime.tsx가
 * 로그인 상태에서만 /sw.js?v=<빌드 id>로 한다. 캐시 이름은 "offline-" + 그 빌드 id다.
 * 새 배포는 새 등록 주소라 새 서비스 워커가 설치되고, activate에서 옛 캐시를 지운다.
 * 같은 빌드의 HTML과 JS 조각을 한 캐시에 묶어, 옛 HTML이 없는 조각을 찾는 일이 없게 한다.
 *
 * 요청 규칙
 *   문서(navigate), 콘텐츠 경로: 네트워크 먼저. 성공하면 캐시에 갱신 저장(쿼리 없는 주소만),
 *     실패하면 캐시, 캐시도 없으면 /offline?from=<경로> 안내.
 *   문서, 개인 화면: 네트워크 먼저, 실패하면 /offline?from=<경로>(오프라인 목차).
 *   문서, 로그인 관련과 /api, /_next: 손대지 않는다.
 *   같은 출처 정적 파일(/_next/static, /fonts, /static, 아이콘): 캐시 먼저.
 *   그 밖(GET이 아닌 요청, Server Action, /api, 외부 출처): 손대지 않는다(항상 네트워크).
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

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

async function handleNavigation(event, url, kind) {
  try {
    const response = await fetch(event.request);
    // 콘텐츠만, 쿼리 없는 주소만, 정상 응답만 저장한다. 로그인 만료로 /login에 튕긴
    // 응답(opaqueredirect)이나 개인 화면은 저장하지 않는다(다른 사람 정보가 남지 않게).
    if (kind === "content" && url.search === "" && response.ok && response.type === "basic" && !response.redirected) {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(absolute(url.pathname), copy)));
    }
    return response;
  } catch (error) {
    if (kind === "content") {
      // 쿼리는 무시하고 경로로 찾는다(예: /articles?tag=... 는 기본 목록으로 대신).
      const cached = await caches.match(absolute(url.pathname), { cacheName: CACHE_NAME, ignoreVary: true });
      if (cached) return cached;
    }
    if (url.pathname === OFFLINE_PATH) return offlineNotice();
    return Response.redirect(absolute(OFFLINE_PATH + "?from=" + encodeURIComponent(url.pathname)), 302);
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request, { cacheName: CACHE_NAME, ignoreVary: true });
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && response.type === "basic") {
    const copy = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
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
    event.respondWith(cacheFirst(request));
  }
});
```

- [ ] **Step 4: 대조 통과 확인**

Run: `node scripts/check-offline-logic.mjs`
Expected: `check-offline-logic: 23건 전부 통과`

- [ ] **Step 5: 빌드 버전과 응답 헤더**

`next.config.ts` 전체를 다음으로 바꾼다.

```ts
import type { NextConfig } from "next";

const isDev = process.argv.indexOf("dev") !== -1;
const isBuild = process.argv.indexOf("build") !== -1;
if (!process.env.VELITE_STARTED && (isDev || isBuild)) {
  process.env.VELITE_STARTED = "1";
  import("velite").then((m) => m.build({ watch: isDev, clean: !isDev }));
}

const nextConfig: NextConfig = {
  // 오프라인 모드의 빌드 id(docs/superpowers/specs/2026-09-23-offline-mode-design.md 3.1).
  // env 설정값은 빌드 때 번들에 그대로 박힌다. 서비스 워커 등록 주소(/sw.js?v=...)와
  // 캐시 이름(offline-<id>)이 이 값을 쓴다. Vercel은 커밋 sha, 로컬 빌드는 빌드 시각.
  env: {
    NEXT_PUBLIC_BUILD_ID: process.env.VERCEL_GIT_COMMIT_SHA || `local-${Date.now()}`,
  },
  // 서비스 워커 파일은 절대 캐시하지 않는다(Next PWA 가이드 권장). 캐시되면 새 배포의
  // 서비스 워커가 늦게 설치되어 옛 캐시 규칙이 계속 돈다.
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
  // 소스맵 생성을 끈다(배포 저장소 절감). 소스맵(.js.map)은 각 배포의 서버 산출물에서
  // 큰 비중(측정 시 약 52MB/배포)을 차지했는데, 디버깅 보조일 뿐 런타임 동작과는 무관하다.
  // Vercel은 배포마다 산출물을 통째로 보관하므로, 배포 1건을 줄이면 앞으로 누적이 훨씬 느려진다.
  // 이 프로젝트는 Turbopack으로 빌드하므로 turbopackSourceMaps까지 함께 끈다.
  productionBrowserSourceMaps: false,
  experimental: {
    serverSourceMaps: false,
    turbopackSourceMaps: false,
  },
};

export default nextConfig;
```

- [ ] **Step 6: proxy에서 /sw.js 열기**

`src/proxy.ts`에서

```ts
const PUBLIC_EXACT = new Set(['/manifest.webmanifest', '/icon', '/robots.txt', '/sitemap.xml']);
```

를 다음으로 바꾼다.

```ts
// /sw.js(오프라인 모드 서비스 워커)는 로그아웃 상태에서도 열려야 한다. 브라우저는 등록된
// 서비스 워커를 주기적으로 다시 받는데, 로그아웃 뒤 /login으로 튕기면 갱신과 해제가 꼬인다.
const PUBLIC_EXACT = new Set(['/manifest.webmanifest', '/icon', '/robots.txt', '/sitemap.xml', '/sw.js']);
```

- [ ] **Step 7: 빌드와 헤더 확인**

Run: `npm run build 2>&1 | tail -15`
Expected: 성공.

Run(로그아웃 상태, 쿠키 없이 요청):

```bash
node --env-file=.env.local -e 'const {spawn,execSync}=require("child_process");const c=spawn(process.execPath,["node_modules/next/dist/bin/next","start","--port","3216","--hostname","127.0.0.1"],{stdio:"ignore",env:process.env});(async()=>{for(let i=0;i<90;i++){try{const r=await fetch("http://127.0.0.1:3216/sw.js?v=check");console.log(r.status,"|",r.headers.get("cache-control"),"|",r.headers.get("content-type"),"|",r.headers.get("service-worker-allowed"));break}catch{await new Promise(s=>setTimeout(s,1000))}}execSync("taskkill /pid "+c.pid+" /T /F",{stdio:"ignore"})})()'
```

Expected: `200 | no-cache, no-store, must-revalidate | application/javascript; charset=utf-8 | /`

- [ ] **Step 8: Commit**

```bash
git add public/sw.js next.config.ts src/proxy.ts scripts/check-offline-logic.mjs
git commit -m "feat(offline): 서비스 워커와 빌드 id 캐시 버전, /sw.js 응답 헤더

Co-Authored-By: (세션이 안내한 attribution 줄)"
```

---

### Task 3: 기기 저장소, 동기화 엔진, 런타임 아일랜드, 로그아웃 정리

**Files:**
- Create: `src/lib/offline/connectivity.ts`, `src/lib/offline/db.ts`, `src/lib/offline/queue.ts`, `src/lib/offline/snapshots.ts`, `src/lib/offline/sync.ts`, `src/lib/offline/cache.ts`, `src/lib/offline/wipe.ts`
- Create: `src/components/offline/offline-runtime.tsx`, `src/components/offline/sign-out-form.tsx`
- Create: `scripts/e2e-offline.mjs` (부트스트랩 + 시나리오 A, H)
- Modify: `src/app/api/auth/route.ts` (전체 교체)
- Modify: `src/app/layout.tsx` (import 1줄, `<ScrollToTop />` 아래 1줄)
- Modify: `src/app/login/page.tsx:109-113`, `src/app/signup/page.tsx:49-53` (로그아웃 폼)

**Interfaces:**
- Consumes: Task 1 `QueueInput`, `QueueItem`, `QueueKind`, `queueItemId`, `toQueueItem`, `sortQueue`, `queuedNote`, `overlayProgress`, `parseNoteKey`, `parseAuthState`, `AuthState`; Task 2 서비스 워커 계약
- Produces:
  - connectivity.ts: `probeOnline(): Promise<boolean>`, `isOnline(): boolean`, `markOffline(): void`, `subscribeOnline(listener: () => void): () => void`, `useOnline(): boolean`
  - db.ts: `type StoreName = "progressSnapshot" | "noteSnapshots" | "queue" | "meta"`, `idbGet<T>(name, id): Promise<T | undefined>`, `idbGetAll<T>(name): Promise<T[]>`, `idbPut<T extends { id: string }>(name, value: T): Promise<void>`, `idbDelete(name, id): Promise<void>`, `idbClear(name): Promise<void>`, `idbCount(name): Promise<number>`, `getMeta<T>(id: string): Promise<T | undefined>`, `setMeta<T>(id: string, value: T): Promise<void>`, `offlineDbExists(): Promise<boolean>`, `deleteOfflineDb(): Promise<void>`
  - queue.ts: `countQueue(): Promise<number>`, `refreshQueueCount(): Promise<void>`, `resetQueueCount(): void`, `useQueueCount(): number`, `enqueue(input: QueueInput): Promise<void>`, `hasQueued(kind: QueueKind, key: string): Promise<boolean>`, `readQueue(): Promise<QueueItem[]>`, `removeIfUnchanged(item: QueueItem): Promise<void>`
  - snapshots.ts: `keepProgressCopy(lessonId: string | undefined, data: ProgressData): Promise<ProgressData>`, `readProgressCopy(lessonId: string | undefined): Promise<ProgressData | null>`, `saveNoteCopy(noteKey: string, body: string): Promise<void>`, `keepNoteCopy(noteKey: string, body: string): Promise<string>`, `readNoteCopy(noteKey: string): Promise<string | null>`, `clearCopies(): Promise<void>`
  - sync.ts: `type WriteResult = "sent" | "queued"`, `writeOrQueue(input: QueueInput, send: () => Promise<void>): Promise<WriteResult>`, `fetchAuthState(): Promise<AuthState | null>`, `replayQueue(): Promise<void>`, `useNeedsLogin(): boolean`
  - cache.ts: `OFFLINE_CACHE_PREFIX = "offline-"`, `BUILD_ID: string`, `currentCacheName(): string`, `listCachedPaths(): Promise<Set<string>>`, `clearOfflineCaches(): Promise<void>`
  - wipe.ts: `type WipeOptions = { keepQueue?: boolean; keepRegistration?: boolean }`, `wipeOfflineData(options?: WipeOptions): Promise<void>`
  - `<OfflineRuntime />`(props 없음), `<SignOutForm action={() => Promise<void>}>{children}</SignOutForm>`
  - `/api/auth` 응답: `{ loggedIn: boolean, isOwner: boolean, roadmapViewer: boolean, userId: string | null }`
  - e2e 스크립트의 앵커 줄: `    // === H. 로그아웃하면 기기 저장본이 모두 지워진다(항상 마지막) ===` (Task 4, 5, 6이 이 줄 바로 위에 블록을 넣는다)

- [ ] **Step 1: 연결 상태 저장소**

`src/lib/offline/connectivity.ts`:

```ts
// 연결 상태 저장소(설계 3.5 "상태 판단"). 오프라인 기능 전부가 이 하나를 본다.
// navigator.onLine과 online/offline 이벤트를 쓰되, 오프라인인 동안에는 10초마다 같은
// 출처에 가벼운 HEAD 요청(/manifest.webmanifest, 로그인 없이 열리는 경로)을 보내 실제
// 복구를 확인한다. online 이벤트가 와도 이 확인이 통과해야 온라인으로 바꾼다(와이파이만
// 붙고 인터넷은 안 되는 경우를 거른다). 서비스 워커는 HEAD를 건드리지 않는다.

import { useSyncExternalStore } from "react";

const PROBE_URL = "/manifest.webmanifest";
const PROBE_INTERVAL_MS = 10_000;
const PROBE_TIMEOUT_MS = 5_000;

let online = true;
let started = false;
let probeTimer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

function stopProbing(): void {
  if (probeTimer !== null) {
    clearInterval(probeTimer);
    probeTimer = null;
  }
}

function startProbing(): void {
  if (probeTimer !== null) return;
  probeTimer = setInterval(() => {
    void probeOnline().then((reachable) => {
      if (reachable) setOnline(true);
    });
  }, PROBE_INTERVAL_MS);
}

function setOnline(next: boolean): void {
  if (next) stopProbing();
  else startProbing();
  if (next === online) return;
  online = next;
  emit();
}

function start(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  online = navigator.onLine;
  if (!online) startProbing();
  window.addEventListener("offline", () => setOnline(false));
  window.addEventListener("online", () => {
    void probeOnline().then((reachable) => {
      if (reachable) setOnline(true);
      else startProbing();
    });
  });
}

/** 서버에 닿는지만 본다(응답 코드는 보지 않는다). */
export async function probeOnline(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    await fetch(PROBE_URL, { method: "HEAD", cache: "no-store", signal: controller.signal });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export function isOnline(): boolean {
  start();
  return online;
}

/** 요청이 네트워크 오류로 실패했을 때 호출한다. 확인 요청이 복구를 감지하면 다시 온라인이 된다. */
export function markOffline(): void {
  start();
  setOnline(false);
}

export function subscribeOnline(listener: () => void): () => void {
  start();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getServerOnline(): boolean {
  return true;
}

export function useOnline(): boolean {
  return useSyncExternalStore(subscribeOnline, isOnline, getServerOnline);
}
```

- [ ] **Step 2: IndexedDB 래퍼**

`src/lib/offline/db.ts`:

```ts
// 오프라인 모드의 IndexedDB(offline-db, 버전 1) 얇은 Promise 래퍼(설계 3.4). 외부 라이브러리
// 없이 이 기능에 필요한 동작만 둔다. 저장소 네 개는 모두 keyPath "id"다.
//   progressSnapshot: { id: 레슨 slug 또는 "", data: /api/progress 응답, at }
//   noteSnapshots:    { id: 메모 키, body, at }
//   queue:            QueueItem(offline-logic.ts). id가 "kind|key"라 같은 항목은 덮어써진다
//   meta:             { id: "userId" | "lastDownloadAt" | "lastSyncAt", value }

export type StoreName = "progressSnapshot" | "noteSnapshots" | "queue" | "meta";

const DB_NAME = "offline-db";
const DB_VERSION = 1;
const STORE_NAMES: readonly StoreName[] = ["progressSnapshot", "noteSnapshots", "queue", "meta"];

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  const opening = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("indexedDB unavailable"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const name of STORE_NAMES) {
        if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: "id" });
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      // 다른 탭이 DB를 지우려 하면(로그아웃) 연결을 놓아 준다. 다음 호출이 다시 연다.
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };
    request.onerror = () => reject(request.error);
  });
  dbPromise = opening.catch((error: unknown) => {
    dbPromise = null;
    throw error;
  });
  return dbPromise;
}

function run<T>(
  name: StoreName,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(name, mode);
        const request = action(tx.objectStore(name));
        tx.oncomplete = () => resolve(request.result);
        tx.onerror = () => reject(tx.error ?? request.error);
        tx.onabort = () => reject(tx.error ?? request.error);
      }),
  );
}

export function idbGet<T>(name: StoreName, id: string): Promise<T | undefined> {
  return run(name, "readonly", (store) => store.get(id) as IDBRequest<T | undefined>);
}

export function idbGetAll<T>(name: StoreName): Promise<T[]> {
  return run(name, "readonly", (store) => store.getAll() as IDBRequest<T[]>);
}

export function idbPut<T extends { id: string }>(name: StoreName, value: T): Promise<void> {
  return run(name, "readwrite", (store) => store.put(value)).then(() => undefined);
}

export function idbDelete(name: StoreName, id: string): Promise<void> {
  return run(name, "readwrite", (store) => store.delete(id)).then(() => undefined);
}

export function idbClear(name: StoreName): Promise<void> {
  return run(name, "readwrite", (store) => store.clear()).then(() => undefined);
}

export function idbCount(name: StoreName): Promise<number> {
  return run(name, "readonly", (store) => store.count());
}

type MetaRecord<T> = { id: string; value: T };

export async function getMeta<T>(id: string): Promise<T | undefined> {
  const record = await idbGet<MetaRecord<T>>("meta", id);
  return record?.value;
}

export function setMeta<T>(id: string, value: T): Promise<void> {
  return idbPut<MetaRecord<T>>("meta", { id, value });
}

/** DB를 새로 만들지 않고 있는지만 본다(로그아웃 상태에서 빈 DB가 생기지 않게). */
export async function offlineDbExists(): Promise<boolean> {
  if (typeof indexedDB === "undefined") return false;
  if (typeof indexedDB.databases !== "function") return true;
  try {
    return (await indexedDB.databases()).some((info) => info.name === DB_NAME);
  } catch {
    return true;
  }
}

export async function deleteOfflineDb(): Promise<void> {
  if (dbPromise) {
    try {
      (await dbPromise).close();
    } catch {
      // 열기에 실패한 연결은 닫을 것이 없다.
    }
    dbPromise = null;
  }
  if (typeof indexedDB === "undefined") return;
  await new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });
}
```

- [ ] **Step 3: 대기열과 대기 개수 저장소**

`src/lib/offline/queue.ts`:

```ts
// 쓰기 대기열(설계 3.4)과 헤더 램프가 보는 대기 개수 저장소. 대기열 항목의 id가
// "kind|key"라 같은 항목을 다시 넣으면 앞의 것을 덮어쓴다(마지막 것만 남는다).

import { useSyncExternalStore } from "react";
import { idbCount, idbDelete, idbGet, idbGetAll, idbPut } from "./db";
import {
  queueItemId,
  sortQueue,
  toQueueItem,
  type QueueInput,
  type QueueItem,
  type QueueKind,
} from "./offline-logic";

let cachedCount = 0;
let loaded = false;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export async function countQueue(): Promise<number> {
  try {
    return await idbCount("queue");
  } catch {
    return 0;
  }
}

export async function refreshQueueCount(): Promise<void> {
  const next = await countQueue();
  if (next === cachedCount) return;
  cachedCount = next;
  emit();
}

/** DB를 지운 직후에 쓴다. 다시 세면 빈 DB가 새로 생기므로 0으로만 맞춘다. */
export function resetQueueCount(): void {
  if (cachedCount === 0) return;
  cachedCount = 0;
  emit();
}

function subscribeQueueCount(listener: () => void): () => void {
  listeners.add(listener);
  if (!loaded) {
    loaded = true;
    void refreshQueueCount();
  }
  return () => {
    listeners.delete(listener);
  };
}

function getQueueCount(): number {
  return cachedCount;
}

function getServerQueueCount(): number {
  return 0;
}

export function useQueueCount(): number {
  return useSyncExternalStore(subscribeQueueCount, getQueueCount, getServerQueueCount);
}

export async function enqueue(input: QueueInput): Promise<void> {
  await idbPut("queue", toQueueItem(input, Date.now()));
  await refreshQueueCount();
}

export async function hasQueued(kind: QueueKind, key: string): Promise<boolean> {
  try {
    return (await idbGet<QueueItem>("queue", queueItemId(kind, key))) !== undefined;
  } catch {
    return false;
  }
}

export async function readQueue(): Promise<QueueItem[]> {
  try {
    return sortQueue(await idbGetAll<QueueItem>("queue"));
  } catch {
    return [];
  }
}

/** 보낸 항목을 지운다. 보내는 사이에 같은 항목이 새 값으로 바뀌었으면 남긴다. */
export async function removeIfUnchanged(item: QueueItem): Promise<void> {
  try {
    const current = await idbGet<QueueItem>("queue", item.id);
    if (current && current.at === item.at && current.value === item.value) {
      await idbDelete("queue", item.id);
    }
  } catch {
    // 지우지 못하면 다음 동기화에서 같은 값을 한 번 더 보낸다(결과는 같다).
  }
  await refreshQueueCount();
}
```

- [ ] **Step 4: 내 데이터 사본**

`src/lib/offline/snapshots.ts`:

```ts
// 진도와 메모의 마지막 사본(설계 3.4). 온라인에서 받을 때마다 갱신하고, 오프라인이면
// 사본에 대기열 변경분을 얹어 돌려준다. 모든 함수는 기기 저장소 오류를 삼킨다. 사본은
// 부가 기능이라 실패해도 기존 화면 흐름을 깨면 안 된다.

import type { ProgressData, ProgressLesson } from "@/components/progress-provider";
import { idbClear, idbGet, idbGetAll, idbPut } from "./db";
import { readQueue } from "./queue";
import { overlayProgress, queuedNote } from "./offline-logic";

type ProgressCopy = { id: string; data: ProgressData; at: number };
type NoteCopy = { id: string; body: string; at: number };

/** 받은 진도 응답을 사본으로 남기고, 대기 중인 변경분을 얹어 돌려준다. */
export async function keepProgressCopy(lessonId: string | undefined, data: ProgressData): Promise<ProgressData> {
  if (!data.unlocked || !data.ok) return data;
  try {
    const at = Date.now();
    await idbPut<ProgressCopy>("progressSnapshot", { id: lessonId ?? "", data, at });
    if (data.lesson && data.lesson.note.ok) {
      await idbPut<NoteCopy>("noteSnapshots", { id: data.lesson.slug, body: data.lesson.note.body, at });
    }
    const queue = await readQueue();
    return queue.length === 0 ? data : overlayProgress(data, queue, null);
  } catch {
    return data;
  }
}

/**
 * 오프라인 읽기. 완료 목록과 진행률은 가장 최근 사본에서, 레슨 칸(til, 다시 보기 표시)은
 * 그 레슨의 사본에서, 메모는 메모 사본에서 가져온 뒤 대기열을 얹는다. 사본이 하나도 없으면 null.
 */
export async function readProgressCopy(lessonId: string | undefined): Promise<ProgressData | null> {
  try {
    const copies = await idbGetAll<ProgressCopy>("progressSnapshot");
    if (copies.length === 0) return null;
    const latest = copies.reduce((a, b) => (b.at > a.at ? b : a));
    let lesson: ProgressLesson | null = null;
    let noteBody: string | null = null;
    if (lessonId) {
      const own = copies.find((copy) => copy.id === lessonId);
      lesson = own?.data.lesson ?? { slug: lessonId, done: false, note: { ok: false }, til: "", needsReview: false };
      const noteCopy = await idbGet<NoteCopy>("noteSnapshots", lessonId);
      noteBody = noteCopy?.body ?? null;
    }
    const queue = await readQueue();
    return overlayProgress({ ...latest.data, lesson }, queue, noteBody);
  } catch {
    return null;
  }
}

export async function saveNoteCopy(noteKey: string, body: string): Promise<void> {
  try {
    await idbPut<NoteCopy>("noteSnapshots", { id: noteKey, body, at: Date.now() });
  } catch {
    // 사본 저장 실패는 무시한다(다음 온라인 조회 때 다시 남긴다).
  }
}

/** 서버 메모를 사본으로 남기고, 아직 동기화 안 된 메모가 있으면 그것을 돌려준다. */
export async function keepNoteCopy(noteKey: string, body: string): Promise<string> {
  await saveNoteCopy(noteKey, body);
  return queuedNote(await readQueue(), noteKey) ?? body;
}

/** 오프라인 메모 읽기. 대기열 > 사본. 둘 다 없으면 null(메모장을 열지 않는다). */
export async function readNoteCopy(noteKey: string): Promise<string | null> {
  const queued = queuedNote(await readQueue(), noteKey);
  if (queued !== null) return queued;
  try {
    return (await idbGet<NoteCopy>("noteSnapshots", noteKey))?.body ?? null;
  } catch {
    return null;
  }
}

export async function clearCopies(): Promise<void> {
  await idbClear("progressSnapshot");
  await idbClear("noteSnapshots");
}
```

- [ ] **Step 5: 동기화 엔진**

`src/lib/offline/sync.ts`:

```ts
// 쓰기와 동기화(설계 3.4).
//
// writeOrQueue: 기존 Server Action 호출부를 감싼다. 온라인이면 지금처럼 바로 보낸다.
// 오프라인이거나, 보냈는데 서버에 닿지 않으면(확인 요청까지 실패) 대기열에 넣고 성공처럼
// 돌아간다. 서버에 닿는데 실패한 것은 진짜 오류라 그대로 던진다(호출부의 기존 오류 표시).
// 같은 항목이 이미 대기 중이면 새 값도 대기열로 보낸다. 그래야 재생 중인 옛 값이 새 값을
// 덮어쓰는 순서 뒤집힘이 없다.
//
// replayQueue: 대기열을 넣은 순서대로 기존 Server Action으로 다시 부른다. 성공한 항목만
// 지운다. 로그인이 풀려 있으면 멈추고 "다시 로그인하면 동기화돼요"를 켠다. 완료 토글은
// 목표 상태로 보낸다. 서버는 !currentlyDone을 저장하므로 currentlyDone = !목표로 부른다.

import { useSyncExternalStore } from "react";
import { toggleLessonComplete } from "@/app/lesson/[lessonId]/actions";
import { saveLessonNoteAction } from "@/app/lesson/[lessonId]/note-actions";
import { toggleBasecampItem } from "@/app/basecamp/actions";
import { saveBasecampNoteAction } from "@/app/basecamp/[slug]/note-actions";
import { saveArticleNoteAction } from "@/app/articles/[slug]/note-actions";
import { isOnline, markOffline, probeOnline } from "./connectivity";
import { getMeta, setMeta } from "./db";
import { enqueue, hasQueued, readQueue, removeIfUnchanged } from "./queue";
import { saveNoteCopy } from "./snapshots";
import { parseAuthState, parseNoteKey, type AuthState, type QueueInput, type QueueItem } from "./offline-logic";

export type WriteResult = "sent" | "queued";

// 재생 한 번에 최대 몇 바퀴 도는가. 재생 중에 새 항목이 들어오면 다음 바퀴가 이어서 보낸다.
const MAX_REPLAY_ROUNDS = 5;

let needsLogin = false;
const needsLoginListeners = new Set<() => void>();

function setNeedsLogin(next: boolean): void {
  if (next === needsLogin) return;
  needsLogin = next;
  for (const listener of needsLoginListeners) listener();
}

function subscribeNeedsLogin(listener: () => void): () => void {
  needsLoginListeners.add(listener);
  return () => {
    needsLoginListeners.delete(listener);
  };
}

function getNeedsLogin(): boolean {
  return needsLogin;
}

function getServerNeedsLogin(): boolean {
  return false;
}

export function useNeedsLogin(): boolean {
  return useSyncExternalStore(subscribeNeedsLogin, getNeedsLogin, getServerNeedsLogin);
}

export async function writeOrQueue(input: QueueInput, send: () => Promise<void>): Promise<WriteResult> {
  if (!isOnline() || (await hasQueued(input.kind, input.key))) {
    await enqueue(input);
    if (isOnline()) void replayQueue();
    return "queued";
  }
  try {
    await send();
  } catch (error) {
    if (await probeOnline()) throw error;
    markOffline();
    await enqueue(input);
    return "queued";
  }
  if (input.kind === "note") await saveNoteCopy(input.key, input.value);
  return "sent";
}

/** 로그인 상태 조회. 서버에 닿지 않으면 null. */
export async function fetchAuthState(): Promise<AuthState | null> {
  try {
    const res = await fetch("/api/auth", { cache: "no-store" });
    if (!res.ok) return null;
    return parseAuthState(await res.json());
  } catch {
    return null;
  }
}

function sendQueued(item: QueueItem): Promise<void> {
  if (item.kind === "lessonComplete") return toggleLessonComplete(item.key, !item.value);
  if (item.kind === "basecampItem") return toggleBasecampItem(item.key, !item.value);
  const { target, slug } = parseNoteKey(item.key);
  if (target === "basecamp") return saveBasecampNoteAction(slug, item.value);
  if (target === "article") return saveArticleNoteAction(slug, item.value);
  return saveLessonNoteAction(slug, item.value);
}

async function runReplay(): Promise<void> {
  for (let round = 0; round < MAX_REPLAY_ROUNDS; round += 1) {
    if (!isOnline()) return;
    const items = await readQueue();
    if (items.length === 0) {
      setNeedsLogin(false);
      return;
    }
    const auth = await fetchAuthState();
    if (auth === null) return;
    if (!auth.userId) {
      setNeedsLogin(true);
      return;
    }
    // 다른 계정의 대기열이면 보내지 않는다. 계정 대조(offline-runtime.tsx)가 지운다.
    const owner = await getMeta<string>("userId").catch(() => undefined);
    if (owner && owner !== auth.userId) return;
    setNeedsLogin(false);

    for (const item of items) {
      try {
        await sendQueued(item);
      } catch {
        if (!(await probeOnline())) {
          markOffline();
          return;
        }
        const again = await fetchAuthState();
        if (again !== null && !again.userId) setNeedsLogin(true);
        // 서버가 거절했다. 대기열은 지우지 않고 다음 계기에 다시 시도한다.
        return;
      }
      await removeIfUnchanged(item);
      if (item.kind === "note") await saveNoteCopy(item.key, item.value);
    }
    await setMeta("lastSyncAt", Date.now()).catch(() => undefined);
  }
}

let running: Promise<void> | null = null;

/** 동시에 한 번만 돈다. 이미 돌고 있으면 그 약속을 돌려준다. */
export function replayQueue(): Promise<void> {
  if (!running) {
    running = runReplay()
      .catch(() => undefined)
      .finally(() => {
        running = null;
      });
  }
  return running;
}
```

- [ ] **Step 6: 캐시 이름과 정리**

`src/lib/offline/cache.ts`:

```ts
// 오프라인 저장본(Cache Storage) 이름과 조회. public/sw.js와 같은 규칙이다. 캐시 이름은
// "offline-" + 빌드 id. 빌드 id는 next.config.ts의 env(NEXT_PUBLIC_BUILD_ID)가 빌드 때
// 박아 넣고, 서비스 워커는 등록 주소의 ?v= 로 같은 값을 받는다.

export const OFFLINE_CACHE_PREFIX = "offline-";
export const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID ?? "dev";

export function currentCacheName(): string {
  return `${OFFLINE_CACHE_PREFIX}${BUILD_ID}`;
}

function hasCacheStorage(): boolean {
  return typeof window !== "undefined" && "caches" in window;
}

/** 지금 빌드 캐시에 들어 있는 주소의 경로(pathname) 집합. */
export async function listCachedPaths(): Promise<Set<string>> {
  if (!hasCacheStorage()) return new Set();
  try {
    const cache = await caches.open(currentCacheName());
    const requests = await cache.keys();
    return new Set(requests.map((request) => new URL(request.url).pathname));
  } catch {
    return new Set();
  }
}

export async function clearOfflineCaches(): Promise<void> {
  if (!hasCacheStorage()) return;
  const names = await caches.keys();
  await Promise.all(names.filter((name) => name.startsWith(OFFLINE_CACHE_PREFIX)).map((name) => caches.delete(name)));
}
```

`src/lib/offline/wipe.ts`:

```ts
// 기기 저장본 정리(설계 3.6). 로그아웃 버튼, 로그아웃 상태 감지, 다른 계정 로그인 감지가 부른다.
// keepQueue: 동기화 안 된 쓰기만 남기고 사본은 지운다(세션이 만료돼 로그아웃 상태가 된 경우,
//   같은 계정으로 다시 로그인하면 동기화된다. 다른 계정이면 계정 대조가 모두 지운다).
// keepRegistration: 서비스 워커는 남긴다(계정만 바뀐 경우).

import { clearOfflineCaches } from "./cache";
import { deleteOfflineDb } from "./db";
import { resetQueueCount } from "./queue";
import { clearCopies } from "./snapshots";

export type WipeOptions = { keepQueue?: boolean; keepRegistration?: boolean };

export async function wipeOfflineData(options: WipeOptions = {}): Promise<void> {
  try {
    await clearOfflineCaches();
  } catch {
    // 캐시 삭제 실패는 다음 계정 대조에서 다시 시도한다.
  }
  try {
    if (options.keepQueue) await clearCopies();
    else await deleteOfflineDb();
  } catch {
    // 위와 같다.
  }
  if (!options.keepQueue) resetQueueCount();
  if (!options.keepRegistration && typeof navigator !== "undefined" && "serviceWorker" in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    } catch {
      // 해제 실패는 다음 계정 대조에서 다시 시도한다.
    }
  }
}
```

- [ ] **Step 7: /api/auth에 userId**

근거: 계정 전환 감지(설계 3.6)에는 "지금 로그인한 사람이 누구인가"가 필요한데 현재 응답에는 로그인 여부만 있다. 자기 자신의 id만 돌려주고 `no-store`라 다른 사용자에게 새지 않는다.

`src/app/api/auth/route.ts` 전체를 다음으로 바꾼다.

```ts
// GET /api/auth: 내비가 "로그인"/"프로필" 라벨을 고르기 위한 최소 인증 상태 조회.
// 진도 데이터를 읽지 않고 게이트 판정(hasUnlockCookie)만 반환한다(/api/progress보다
// 가볍다). 클라이언트 내비가 마운트 시 한 번 부른다. 캐시 금지(사용자별, 상태별 응답).

import { NextResponse } from 'next/server';
import { hasUnlockCookie } from '@/lib/auth';
import { isOwnerSession } from '@/lib/owner';
import { isRoadmapViewer } from '@/lib/roadmap-access';
import { getCurrentUserId } from '@/lib/current-user';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0, must-revalidate' };

export async function GET() {
  // loggedIn: 아무 사용자 로그인 여부(내비 라벨용). isOwner: 소유자 전용 항목(슬랙 피드, 가입
  // 승인) 노출 여부. roadmapViewer: 채널톡 로드맵을 볼 수 있는 계정인지. 내비가 이 값으로
  // "채널톡 로드맵" 항목을 허용 계정에게만 보인다.
  // userId: 오프라인 모드가 기기 저장본의 주인과 지금 로그인한 사람이 같은지 대조하는 값
  // (다른 계정이면 저장본을 지운다). 요청한 사람 자신의 id만 돌려준다. 시크릿 쿠키로만
  // 통과한 경우에는 사용자 id가 없어 null이다.
  const [loggedIn, isOwner, roadmapViewer, userId] = await Promise.all([
    hasUnlockCookie(),
    isOwnerSession(),
    isRoadmapViewer(),
    getCurrentUserId(),
  ]);
  return NextResponse.json(
    { loggedIn, isOwner, roadmapViewer, userId },
    { status: 200, headers: NO_STORE_HEADERS },
  );
}
```

- [ ] **Step 8: 런타임 아일랜드**

`src/components/offline/offline-runtime.tsx`:

```tsx
"use client";

// 오프라인 모드의 보이지 않는 런타임(설계 3.1, 3.4, 3.6, 4절 위험 1). 루트 레이아웃에 한 번만 둔다.
//   1) 계정 대조와 서비스 워커 등록: 경로가 바뀔 때마다 /api/auth로 로그인 상태를 본다.
//      로그인이 아니면 저장본을 지우고 서비스 워커를 해제한다(동기화 안 된 대기열이 있으면
//      대기열만 남긴다). 다른 계정이면 기기 사본과 대기열을 모두 지운다. 로그인이면
//      production에서만 /sw.js?v=<빌드 id>를 등록한다. 개발 서버의 청크 주소는 해시가
//      아니라 캐시 먼저 전략과 맞지 않는다.
//   2) 동기화 계기: 앱 시작(위 대조 직후), 온라인 복귀, 화면이 다시 보일 때.
//   3) 오프라인 링크 이동: Next의 클라이언트 이동은 HTML이 아니라 RSC 데이터를 받아서
//      오프라인에서는 실패한다. 오프라인이면 같은 출처 <a> 클릭을 캡처 단계에서 가로채
//      location.assign으로 전체 이동시킨다. 그러면 서비스 워커가 저장된 HTML을 준다.

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { BUILD_ID } from "@/lib/offline/cache";
import { isOnline, subscribeOnline } from "@/lib/offline/connectivity";
import { getMeta, offlineDbExists, setMeta } from "@/lib/offline/db";
import { countQueue } from "@/lib/offline/queue";
import { fetchAuthState, replayQueue } from "@/lib/offline/sync";
import { wipeOfflineData } from "@/lib/offline/wipe";

const SERVICE_WORKER_URL = `/sw.js?v=${encodeURIComponent(BUILD_ID)}`;

/** 로그인 상태를 확인해 저장본을 정리하고 서비스 워커를 등록한다. 돌려주는 값은 "동기화를 시도해도 되는가". */
async function reconcileAccount(): Promise<boolean> {
  const auth = await fetchAuthState();
  // 서버에 닿지 않는다(오프라인). 판단할 수 없으니 저장본은 그대로 두고 동기화는 허용한다.
  // 동기화 엔진이 보내기 전에 로그인을 다시 확인한다.
  if (auth === null) return true;

  if (!auth.loggedIn) {
    const keepQueue = (await offlineDbExists()) && (await countQueue()) > 0;
    await wipeOfflineData({ keepQueue });
    return false;
  }

  if (auth.userId) {
    const owner = await getMeta<string>("userId").catch(() => undefined);
    if (owner && owner !== auth.userId) {
      await wipeOfflineData({ keepRegistration: true });
    }
    await setMeta("userId", auth.userId).catch(() => undefined);
  }

  if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
    await navigator.serviceWorker.register(SERVICE_WORKER_URL, { scope: "/" });
  }
  return true;
}

function isPlainLeftClick(event: MouseEvent): boolean {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

export function OfflineRuntime() {
  const pathname = usePathname();
  // 로그아웃 상태에서 동기화를 부르면 빈 DB가 새로 생긴다. 대조 결과를 기억해 막는다.
  const canSyncRef = useRef(false);

  useEffect(() => {
    let active = true;
    reconcileAccount()
      .catch(() => true)
      .then((canSync) => {
        if (!active) return;
        canSyncRef.current = canSync;
        if (canSync) void replayQueue();
      });
    return () => {
      active = false;
    };
  }, [pathname]);

  useEffect(() => {
    const unsubscribe = subscribeOnline(() => {
      if (isOnline() && canSyncRef.current) void replayQueue();
    });
    function handleVisibility() {
      if (document.visibilityState === "visible" && canSyncRef.current) void replayQueue();
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (isOnline() || event.defaultPrevented || !isPlainLeftClick(event)) return;
      const target = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(target instanceof HTMLAnchorElement)) return;
      if (target.target && target.target !== "_self") return;
      if (target.hasAttribute("download")) return;
      const url = new URL(target.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // 같은 문서 안 이동(#소제목)은 브라우저에 맡긴다.
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      event.preventDefault();
      event.stopPropagation();
      window.location.assign(url.href);
    }
    window.addEventListener("click", handleClick, true);
    return () => window.removeEventListener("click", handleClick, true);
  }, []);

  return null;
}
```

`src/app/layout.tsx`에서

```tsx
import { ScrollToTop } from "@/components/scroll-to-top";
```

아래에 추가:

```tsx
import { OfflineRuntime } from "@/components/offline/offline-runtime";
```

같은 파일에서

```tsx
        <ScrollToTop />
      </body>
```

를 다음으로 바꾼다.

```tsx
        <ScrollToTop />
        {/* 오프라인 모드 런타임(서비스 워커 등록과 해제, 계정 대조, 동기화, 오프라인 링크
            이동). 화면에는 아무것도 그리지 않는다. */}
        <OfflineRuntime />
      </body>
```

- [ ] **Step 9: 로그아웃 폼**

`src/components/offline/sign-out-form.tsx`:

```tsx
"use client";

// 로그아웃 폼(설계 3.6). 서버 로그아웃(signOutAction) 전에 이 기기의 오프라인 저장본
// (Cache Storage, IndexedDB)을 모두 지우고 서비스 워커를 해제한다. 정리가 실패해도
// 로그아웃은 진행한다. 로그아웃 뒤 첫 화면에서 계정 대조가 한 번 더 정리한다.

import type { ReactNode } from "react";
import { wipeOfflineData } from "@/lib/offline/wipe";

export function SignOutForm({ action, children }: { action: () => Promise<void>; children: ReactNode }) {
  async function handleAction() {
    try {
      await wipeOfflineData();
    } catch {
      // 위 설명대로 로그아웃은 막지 않는다.
    }
    await action();
  }

  return <form action={handleAction}>{children}</form>;
}
```

`src/app/login/page.tsx`에서 import 묶음 끝(`import { signOutAction } from './actions';` 아래)에 추가:

```tsx
import { SignOutForm } from '@/components/offline/sign-out-form';
```

같은 파일에서

```tsx
              <form action={signOutAction}>
                <button type="submit" className="chip tap-feedback min-h-11 text-body">
                  로그아웃
                </button>
              </form>
```

를 다음으로 바꾼다.

```tsx
              <SignOutForm action={signOutAction}>
                <button type="submit" className="chip tap-feedback min-h-11 text-body">
                  로그아웃
                </button>
              </SignOutForm>
```

`src/app/signup/page.tsx`에서 `import { SignupForm } from './signup-form';` 아래에 추가:

```tsx
import { SignOutForm } from '@/components/offline/sign-out-form';
```

같은 파일에서

```tsx
            <form action={signOutAction}>
              <button type="submit" className="chip tap-feedback min-h-11 text-body">
                로그아웃
              </button>
            </form>
```

를 다음으로 바꾼다.

```tsx
            <SignOutForm action={signOutAction}>
              <button type="submit" className="chip tap-feedback min-h-11 text-body">
                로그아웃
              </button>
            </SignOutForm>
```

- [ ] **Step 10: 정적 검사**

```bash
node scripts/check-offline-logic.mjs
npx next typegen && npx tsc --noEmit -p .
npm run lint 2>&1 | tail -15
node scripts/check-design-tokens.mjs --only src/components/offline/offline-runtime.tsx src/components/offline/sign-out-form.tsx
node scripts/check-progress-gates.mjs 2>&1 | tail -6
```

Expected: 순수 로직 23건 통과; tsc 출력 없음; lint는 기존 4건 외 새 오류 없음; 토큰 검사 위반 0; 진도 게이트는 기존 3건(G9, G17, G22)만.

- [ ] **Step 11: 브라우저 게이트 작성(부트스트랩 + A, H)**

`scripts/e2e-offline.mjs`:

```js
#!/usr/bin/env node
// 오프라인 모드 브라우저 게이트(docs/superpowers/specs/2026-09-23-offline-mode-design.md 5절).
// e2e-lesson-note.mjs의 부트스트랩(서버 spawn/대기/Windows taskkill 종료/FatalError/finally
// 정리/"검사 0건 = 실패"/한국어 로그)을 복제한다. 기존 게이트처럼 공유 모듈로 빼지 않는다.
//
// 다른 게이트와 다른 점 두 가지.
// 1) 개발 서버가 아니라 프로덕션 서버(next start)를 띄운다. 서비스 워커는 production에서만
//    등록되고(offline-runtime.tsx), 개발 서버(Turbopack)의 청크 주소는 해시가 아니라 캐시
//    먼저 전략과 맞지 않는다. 그래서 호출자가 먼저 `npm run build`를 해 둬야 한다.
// 2) 시크릿 쿠키(runway_unlock)가 아니라 테스터 계정으로 실제 로그인한다. 대기열 동기화는
//    Server Action이 로그인 사용자 id로 저장하는데, 시크릿 쿠키에는 사용자 id가 없다.
//
// "오프라인"은 두 겹으로 만든다. context.setOffline(true)(navigator.onLine과 offline 이벤트)와
// 서버 프로세스 종료(서비스 워커의 네트워크 요청까지 확실히 실패). 복귀는 서버 재기동 후
// setOffline(false).
//
// 실행: E2E_TESTER_EMAIL=... E2E_TESTER_PASSWORD=... node --env-file=.env.local scripts/e2e-offline.mjs
// (값은 테스터 계정. 문서와 코드에 쓰지 않는다.)
// 포트 3216(3210~3215는 기존 게이트). E2E_OFFLINE_PORT로 덮어쓸 수 있다.
// 테스터의 프로브 레슨 완료 행과 메모 행을 시작 때 백업하고 finally에서 복원한다.
// 어떤 출력에도 쿠키 값, 비밀번호, 이메일을 찍지 않는다.

import { chromium } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const LOG = 'e2e-offline';
const PORT = process.env.E2E_OFFLINE_PORT ? Number(process.env.E2E_OFFLINE_PORT) : 3216;
const HOST = '127.0.0.1';
const BASE_URL = `http://${HOST}:${PORT}`;
const SERVER_READY_TIMEOUT_MS = 180_000;
const FETCH_TIMEOUT_MS = 30_000;

class FatalError extends Error {}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TESTER_EMAIL = process.env.E2E_TESTER_EMAIL;
const TESTER_PASSWORD = process.env.E2E_TESTER_PASSWORD;

for (const [name, value] of [
  ['SUPABASE_URL', SUPABASE_URL],
  ['SUPABASE_SERVICE_ROLE_KEY', SUPABASE_SERVICE_ROLE_KEY],
  ['E2E_TESTER_EMAIL', TESTER_EMAIL],
  ['E2E_TESTER_PASSWORD', TESTER_PASSWORD],
]) {
  if (!value) {
    console.error(
      `${LOG}: ${name} 환경 변수가 비어 있습니다. \`E2E_TESTER_EMAIL=... E2E_TESTER_PASSWORD=... node --env-file=.env.local scripts/e2e-offline.mjs\`로 실행하세요.`,
    );
    process.exit(1);
  }
}

if (!fs.existsSync(path.join(ROOT, '.next', 'BUILD_ID'))) {
  console.error(`${LOG}: .next/BUILD_ID가 없습니다. 먼저 \`npm run build\`를 실행하세요(이 게이트는 next start로 돈다).`);
  process.exit(1);
}

// 앱 코드를 import하지 않는다. .velite/lessons.json을 독립 재파싱한다.
function readLessonsManifest() {
  const lessonsPath = path.join(ROOT, '.velite', 'lessons.json');
  if (!fs.existsSync(lessonsPath)) {
    console.error(`${LOG}: ${path.relative(ROOT, lessonsPath)}가 없습니다. \`npm run build\`를 먼저 실행하세요.`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(lessonsPath, 'utf8'));
}

const LESSONS = readLessonsManifest();
const PROBE_LESSON = LESSONS.find((l) => l.hasContent === true);
if (!PROBE_LESSON) {
  console.error(`${LOG}: hasContent가 참인 레슨을 매니페스트에서 찾지 못했습니다.`);
  process.exit(1);
}
const PROBE_SLUG = PROBE_LESSON.slug;
const PROBE_ROUTE = `/lesson/${PROBE_SLUG}`;

function killServerTree(child) {
  if (!child || child.exitCode !== null) return;
  if (process.platform === 'win32') {
    try {
      execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: 'ignore' });
    } catch {
      // 이미 종료되었을 수 있음. 무시
    }
  } else {
    try {
      child.kill('SIGKILL');
    } catch {
      // 이미 종료되었을 수 있음. 무시
    }
  }
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function waitForServerReady() {
  const deadline = Date.now() + SERVER_READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      const res = await fetchWithTimeout(BASE_URL, { redirect: 'manual' });
      if (res.status < 500) return;
    } catch {
      // 아직 기동 중. 재시도
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new FatalError('서버가 제한 시간(180초) 안에 기동하지 않았습니다.');
}

async function waitForServerDown() {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    try {
      await fetchWithTimeout(BASE_URL, { redirect: 'manual' });
    } catch {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new FatalError('서버가 15초 안에 내려가지 않았습니다.');
}

const serverOutput = [];
let server = null;

async function startServer() {
  const nextBin = path.join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next');
  server = spawn(process.execPath, [nextBin, 'start', '--port', String(PORT), '--hostname', HOST], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  });
  server.stdout.on('data', (d) => serverOutput.push(d.toString()));
  server.stderr.on('data', (d) => serverOutput.push(d.toString()));
  try {
    await waitForServerReady();
  } catch (e) {
    throw new FatalError(`${e.message}\n--- 서버 출력(마지막 부분) ---\n${serverOutput.join('').slice(-4000)}`);
  }
}

async function stopServer() {
  killServerTree(server);
  server = null;
  await waitForServerDown();
}

async function goOffline(context) {
  await context.setOffline(true);
  await stopServer();
}

async function goOnline(context) {
  await startServer();
  await context.setOffline(false);
}

// --- 결과 누적기. 실패는 항목 순서대로 모아 마지막에 한 번에 출력한다 ---
const results = [];
function record(id, label, pass, detail) {
  results.push({ id, label, pass, detail: detail ?? '' });
  console.log(`${LOG}: ${id} ${label}: ${pass ? 'OK' : 'FAIL'}${detail ? ` (${detail})` : ''}`);
}

async function pollUntil(read, isDone, timeoutMs, intervalMs = 500) {
  const deadline = Date.now() + timeoutMs;
  let value = await read();
  while (!isDone(value) && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    value = await read();
  }
  return value;
}

async function login(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="email"]', TESTER_EMAIL);
  await page.fill('input[name="password"]', TESTER_PASSWORD);
  await Promise.all([
    page.waitForURL((url) => url.pathname === '/', { timeout: 30_000 }),
    page.click('button[type="submit"]'),
  ]);
}

async function readAuth(page) {
  return page.evaluate(() => fetch('/api/auth', { cache: 'no-store' }).then((r) => r.json()));
}

// e2e-lesson-note.mjs와 같은 신호: 진도 아일랜드가 loading을 벗어날 때까지 기다린다.
async function waitForProgressSettled(page) {
  await page.waitForSelector('[data-progress-island]');
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-progress-island]');
    return el !== null && el.getAttribute('data-progress-state') !== 'loading';
  });
}

async function waitForServiceWorker(page) {
  return page.evaluate(() =>
    Promise.race([
      navigator.serviceWorker.ready.then((registration) => Boolean(registration.active)),
      new Promise((resolve) => setTimeout(() => resolve(false), 20_000)),
    ]),
  );
}

// offline-db 한 저장소의 키 목록. DB가 없으면 만들지 않고 빈 목록(open만 하면 빈 v1 DB가
// 생겨 앱의 저장소 생성을 막는다).
async function idbKeys(page, storeName) {
  return page.evaluate(async (name) => {
    const dbs = typeof indexedDB.databases === 'function' ? await indexedDB.databases() : [];
    if (!dbs.some((d) => d.name === 'offline-db')) return [];
    return new Promise((resolve) => {
      const request = indexedDB.open('offline-db');
      request.onerror = () => resolve([]);
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(name)) {
          db.close();
          resolve([]);
          return;
        }
        const keysRequest = db.transaction(name, 'readonly').objectStore(name).getAllKeys();
        keysRequest.onsuccess = () => {
          db.close();
          resolve(keysRequest.result.map(String));
        };
        keysRequest.onerror = () => {
          db.close();
          resolve([]);
        };
      };
    });
  }, storeName);
}

async function queueCount(page) {
  return (await idbKeys(page, 'queue')).length;
}

async function waitForQueueEmpty(page, timeoutMs) {
  const count = await pollUntil(() => queueCount(page), (n) => n === 0, timeoutMs, 1000);
  return count === 0;
}

async function backupProbe(admin, userId) {
  const { data: progressRow, error: progressError } = await admin
    .from('progress')
    .select('completed_at')
    .eq('user_id', userId)
    .eq('lesson_id', PROBE_SLUG)
    .maybeSingle();
  if (progressError) throw new FatalError(`완료 행 백업 조회 실패: ${progressError.message}`);
  const { data: noteRow, error: noteError } = await admin
    .from('lesson_note')
    .select('body, til, needs_review')
    .eq('user_id', userId)
    .eq('lesson_id', PROBE_SLUG)
    .maybeSingle();
  if (noteError) throw new FatalError(`메모 행 백업 조회 실패: ${noteError.message}`);
  return { progressRow, noteRow };
}

async function restoreProbe(admin, userId, backup) {
  const progress = backup.progressRow
    ? await admin
        .from('progress')
        .upsert(
          { user_id: userId, lesson_id: PROBE_SLUG, completed_at: backup.progressRow.completed_at },
          { onConflict: 'user_id,lesson_id' },
        )
    : await admin.from('progress').delete().eq('user_id', userId).eq('lesson_id', PROBE_SLUG);
  if (progress.error) throw new Error(`완료 행 복원 실패: ${progress.error.message}`);
  const note = backup.noteRow
    ? await admin.from('lesson_note').upsert(
        {
          user_id: userId,
          lesson_id: PROBE_SLUG,
          body: backup.noteRow.body,
          til: backup.noteRow.til,
          needs_review: backup.noteRow.needs_review,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,lesson_id' },
      )
    : await admin.from('lesson_note').delete().eq('user_id', userId).eq('lesson_id', PROBE_SLUG);
  if (note.error) throw new Error(`메모 행 복원 실패: ${note.error.message}`);
}

async function main() {
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  let browser;
  let userId = null;
  let backup = null;

  try {
    await startServer();
    console.log(`${LOG}: 프로덕션 서버 기동 완료 (probe lesson: ${PROBE_SLUG})`);

    browser = await chromium.launch();
    // 1024 폭: 램프 글자(ON AIR)가 보이는 폭(640px 이상)에서 본다.
    const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
    const page = await context.newPage();

    await login(page);
    const auth = await readAuth(page);
    if (typeof auth?.userId !== 'string' || auth.userId.length === 0) {
      throw new FatalError('/api/auth가 userId를 돌려주지 않습니다. 테스터 로그인과 /api/auth 변경을 확인하세요.');
    }
    userId = auth.userId;
    backup = await backupProbe(admin, userId);
    console.log(
      `${LOG}: 테스터 프로브 행 백업 완료 (완료 행=${Boolean(backup.progressRow)}, 메모 행=${Boolean(backup.noteRow)})`,
    );

    // === A. /sw.js 응답과 서비스 워커 등록 ===
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/sw.js?v=e2e`, { redirect: 'manual' });
      const info = {
        status: res.status,
        cacheControl: res.headers.get('cache-control') ?? '',
        contentType: res.headers.get('content-type') ?? '',
        allowed: res.headers.get('service-worker-allowed'),
      };
      const pass =
        info.status === 200 &&
        info.cacheControl.includes('no-store') &&
        info.contentType.includes('javascript') &&
        info.allowed === '/';
      record('A1', '/sw.js 헤더(쿠키 없이 200, no-store, javascript, Service-Worker-Allowed)', pass, JSON.stringify(info));
    } catch (e) {
      record('A1', '/sw.js 헤더', false, `예외: ${e.message}`);
    }

    try {
      await page.goto(`${BASE_URL}${PROBE_ROUTE}`, { waitUntil: 'domcontentloaded' });
      const active = await waitForServiceWorker(page);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(800);
      const state = await page.evaluate(async () => {
        const offlineKeys = (await caches.keys()).filter((k) => k.startsWith('offline-'));
        return {
          controlled: navigator.serviceWorker.controller !== null,
          offlineKeys,
          lessonCached: Boolean(await caches.match(location.pathname)),
        };
      });
      const pass = active && state.controlled && state.offlineKeys.length === 1 && state.lessonCached;
      record('A2', '로그인 후 서비스 워커 활성, 페이지 제어, 빌드 캐시 1개, 방문한 레슨 저장', pass, JSON.stringify({ active, ...state }));
    } catch (e) {
      record('A2', '서비스 워커 등록', false, `예외: ${e.message}`);
    }

    // === H. 로그아웃하면 기기 저장본이 모두 지워진다(항상 마지막) ===
    // 로그아웃 뒤에는 로그인이 필요한 시나리오를 돌릴 수 없다. 새 시나리오는 이 주석 위에 넣는다.
    try {
      if (server === null) await goOnline(context);
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.click('button:has-text("로그아웃")');
      await page.waitForSelector('input[name="email"]', { timeout: 30_000 });
      const after = await pollUntil(
        () =>
          page.evaluate(async () => {
            const offlineCaches = (await caches.keys()).filter((k) => k.startsWith('offline-')).length;
            const dbs = typeof indexedDB.databases === 'function' ? await indexedDB.databases() : [];
            const registrations = (await navigator.serviceWorker.getRegistrations()).length;
            return { offlineCaches, offlineDb: dbs.some((d) => d.name === 'offline-db'), registrations };
          }),
        (v) => v.offlineCaches === 0 && !v.offlineDb && v.registrations === 0,
        10_000,
      );
      const pass = after.offlineCaches === 0 && !after.offlineDb && after.registrations === 0;
      record('H', '로그아웃하면 저장본, IndexedDB, 서비스 워커가 모두 사라짐', pass, JSON.stringify(after));
    } catch (e) {
      record('H', '로그아웃 정리', false, `예외: ${e.message}`);
    }

    await browser.close();
    browser = undefined;

    console.log(`${LOG}: 수행한 검사 수 = ${results.length}`);
    if (results.length === 0) {
      throw new FatalError('수행한 검사가 0건입니다. 시나리오 목록을 확인하세요.');
    }
    const failures = results.filter((r) => !r.pass);
    if (failures.length > 0) {
      console.error(`${LOG}: ${failures.length}건의 위반이 발견되었습니다:\n`);
      for (const f of failures) console.error(`  - [${f.id}] ${f.label}: ${f.detail}`);
      throw new FatalError(`${failures.length}건의 위반으로 게이트 실패`);
    }
    console.log(`${LOG}: 검사한 ${results.length}건 전부 통과`);
  } finally {
    if (browser) await browser.close().catch(() => {});
    killServerTree(server);
    server = null;
    if (backup && userId) {
      try {
        await restoreProbe(admin, userId, backup);
        console.log(`${LOG}: 테스터 프로브 행 복원 완료`);
      } catch (e) {
        console.error(`${LOG}: 복원 실패. 수동 확인이 필요합니다: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(`${LOG}: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  });
```

- [ ] **Step 12: 게이트 실행**

```bash
npm run build 2>&1 | tail -5
E2E_TESTER_EMAIL='<테스터 이메일>' E2E_TESTER_PASSWORD='<테스터 비밀번호>' node --env-file=.env.local scripts/e2e-offline.mjs
```

(`<...>` 두 값은 사용자 auto-memory의 tester-account 메모에서 가져와 실행 때만 넣는다.)

Expected: `A1 ... OK`, `A2 ... OK`, `H ... OK`, `검사한 3건 전부 통과`, `테스터 프로브 행 복원 완료`.

- [ ] **Step 13: Commit**

```bash
git add src/lib/offline/connectivity.ts src/lib/offline/db.ts src/lib/offline/queue.ts src/lib/offline/snapshots.ts src/lib/offline/sync.ts src/lib/offline/cache.ts src/lib/offline/wipe.ts src/components/offline/offline-runtime.tsx src/components/offline/sign-out-form.tsx src/app/api/auth/route.ts src/app/layout.tsx src/app/login/page.tsx src/app/signup/page.tsx scripts/e2e-offline.mjs
git commit -m "feat(offline): 기기 저장소와 동기화 엔진, 서비스 워커 등록과 계정 대조, 로그아웃 정리

Co-Authored-By: (세션이 안내한 attribution 줄)"
```

---

### Task 4: 전체 받기 목록과 `/offline` 화면

**Files:**
- Create: `src/app/offline-manifest.json/route.ts`
- Create: `src/lib/offline/download.ts`
- Create: `src/components/offline/offline-center.tsx`
- Create: `src/app/offline/page.tsx`
- Modify: `src/components/continue-reading-card.tsx` (`function parseLastLesson` 앞에 `export`)
- Modify: `src/components/site-nav.tsx` (더보기의 "PDF 내보내기" 아래에 항목 1줄)
- Modify: `scripts/e2e-offline.mjs` (H 앵커 위에 B, C 블록)

**Interfaces:**
- Consumes: Task 1 `OfflineManifest`, `extractStaticAssetPaths`, `snapshotSourceFor`, `SnapshotSource`, `classifyOfflinePath`, `formatBytes`; Task 3 `currentCacheName`, `clearOfflineCaches`, `listCachedPaths`, `getMeta`, `setMeta`, `keepProgressCopy`, `saveNoteCopy`, `useOnline`, `useQueueCount`, `useNeedsLogin`
- Produces:
  - `GET /offline-manifest.json` → `OfflineManifest`(그룹 라벨: 레슨, 베이스캠프, AI 뜯어보기, 로드맵, 아티클, 기타)
  - download.ts: `type DownloadPhase = "pages" | "files" | "data"`, `type DownloadProgress = { phase: DownloadPhase; done: number; total: number; bytes: number; failed: number }`, `loadManifest(): Promise<OfflineManifest | null>`, `downloadAll(onProgress: (progress: DownloadProgress) => void): Promise<DownloadProgress>`, `clearSavedPages(): Promise<void>`
  - continue-reading-card.tsx: `parseLastLesson(raw: string | null): { slug: string; title: string } | null`
  - `/offline` 화면의 DOM 계약: `[data-offline-missing]`(from 안내), `[data-offline-status="idle|running|done|error"]`, `[data-offline-download]`(버튼), `[data-offline-count][data-saved][data-total]`, `[data-offline-progress]`, `[data-offline-toc]`(목차, 안의 `a`가 저장된 링크)

- [ ] **Step 1: 실패하는 브라우저 시나리오 추가(B, C)**

`scripts/e2e-offline.mjs`에서 다음 줄

```js
    // === H. 로그아웃하면 기기 저장본이 모두 지워진다(항상 마지막) ===
```

을 다음으로 바꾼다(블록을 넣고 앵커 줄은 그대로 남긴다).

```js
    // === B0. 서비스 워커 설치 때 /offline이 미리 저장됨(전체 받기 전) ===
    // A에서 로그인 직후 설치됐고, 아직 /offline을 방문하지 않았다.
    try {
      const precached = await page.evaluate(async () => Boolean(await caches.match('/offline')));
      record('B0', '설치 때 오프라인 목차(/offline) 미리 저장', precached, `precached=${precached}`);
    } catch (e) {
      record('B0', '설치 때 /offline 미리 저장', false, `예외: ${e.message}`);
    }

    // === B. /offline에서 전체 받기 ===
    try {
      await page.goto(`${BASE_URL}/offline`, { waitUntil: 'domcontentloaded' });
      await page.click('[data-offline-download]');
      await page.waitForSelector('[data-offline-status="done"], [data-offline-status="error"]', { timeout: 300_000 });
      await page.waitForFunction(
        () => Number(document.querySelector('[data-offline-count]')?.getAttribute('data-saved') ?? '0') > 1,
        null,
        { timeout: 15_000 },
      );
      const summary = await page.evaluate(async (probeRoute) => {
        const count = document.querySelector('[data-offline-count]');
        return {
          status: document.querySelector('[data-offline-status]')?.getAttribute('data-offline-status') ?? null,
          saved: Number(count?.getAttribute('data-saved') ?? '0'),
          total: Number(count?.getAttribute('data-total') ?? '0'),
          progress: document.querySelector('[data-offline-progress]')?.textContent ?? '',
          probeCached: Boolean(await caches.match(probeRoute)),
          manifestCached: Boolean(await caches.match('/offline-manifest.json')),
          tocLinks: document.querySelectorAll('[data-offline-toc] a').length,
        };
      }, PROBE_ROUTE);
      const snapshotKeys = await idbKeys(page, 'progressSnapshot');
      const pass =
        summary.status === 'done' &&
        summary.total > 0 &&
        summary.saved >= Math.floor(summary.total * 0.9) &&
        summary.probeCached &&
        summary.manifestCached &&
        summary.tocLinks > 0 &&
        snapshotKeys.includes(PROBE_SLUG);
      record(
        'B',
        '전체 받기 완료(페이지 90% 이상, 프로브 레슨, 목록 파일, 내 진도 사본)',
        pass,
        JSON.stringify({ ...summary, snapshotHasProbe: snapshotKeys.includes(PROBE_SLUG) }),
      );
    } catch (e) {
      record('B', '전체 받기', false, `예외: ${e.message}`);
    }

    // === C. 오프라인 읽기(새로고침, 링크 이동, 개인 화면 대체, 저장 안 된 페이지) ===
    try {
      await page.goto(`${BASE_URL}${PROBE_ROUTE}`, { waitUntil: 'domcontentloaded' });
      const nextHref = await page.getAttribute('a[data-pager="next"]', 'href');
      await goOffline(context);

      await page.reload({ waitUntil: 'domcontentloaded' });
      const title = (await page.textContent('h1'))?.trim() ?? null;
      record('C1', '오프라인 새로고침에도 레슨 본문이 보임', title === PROBE_LESSON.title, `h1=${title}`);

      if (nextHref) {
        await Promise.all([
          page.waitForURL((url) => url.pathname === nextHref, { timeout: 15_000 }),
          page.click('a[data-pager="next"]'),
        ]);
        const nextTitle = (await page.textContent('h1'))?.trim() ?? '';
        record('C2', '오프라인 링크 이동(저장된 다음 레슨)', nextTitle.length > 0, `path=${nextHref} h1=${nextTitle}`);
      } else {
        record('C2', '오프라인 링크 이동', false, '프로브 레슨에 다음 레슨 링크가 없음');
      }

      await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('[data-offline-toc] a', { timeout: 15_000 });
      await page.waitForSelector('[data-offline-missing]', { timeout: 15_000 });
      const home = await page.evaluate(() => ({
        path: location.pathname,
        from: new URLSearchParams(location.search).get('from'),
        links: document.querySelectorAll('[data-offline-toc] a').length,
      }));
      record('C3', '오프라인 홈(/)은 오프라인 목차로 대체', home.path === '/offline' && home.from === '/' && home.links > 0, JSON.stringify(home));

      await page.goto(`${BASE_URL}/lesson/offline-e2e-not-saved`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('[data-offline-missing]', { timeout: 15_000 });
      const missing = await page.evaluate(() => ({
        path: location.pathname,
        text: document.querySelector('[data-offline-missing]')?.textContent ?? '',
      }));
      record('C4', '저장 안 된 콘텐츠 주소는 안내 화면', missing.path === '/offline' && missing.text.includes('아직 기기에 저장되지'), JSON.stringify(missing));
    } catch (e) {
      record('C', '오프라인 읽기', false, `예외: ${e.message}`);
    }
    if (server === null) await goOnline(context);

    // === H. 로그아웃하면 기기 저장본이 모두 지워진다(항상 마지막) ===
```

- [ ] **Step 2: 실패 확인**

```bash
npm run build 2>&1 | tail -3
E2E_TESTER_EMAIL='<테스터 이메일>' E2E_TESTER_PASSWORD='<테스터 비밀번호>' node --env-file=.env.local scripts/e2e-offline.mjs
```

Expected: 종료 코드 1. `B0 ... FAIL`(아직 `/offline` 페이지가 없어 설치 때 저장할 것이 없다), `B 전체 받기: FAIL (예외: ... [data-offline-download] ...)`, C 계열 FAIL(C1은 A에서 저장된 레슨이라 통과할 수 있다. 다음 레슨 이동부터 실패한다). A1, A2, H는 OK.

- [ ] **Step 3: 오프라인 목록 라우트**

`src/app/offline-manifest.json/route.ts`:

```ts
// GET /offline-manifest.json: "전체 받기"가 받을 오프라인 대상 URL과 제목 목록(설계 3.2).
// velite 데이터만 쓰고 쿠키를 읽지 않아 빌드 때 정적으로 만들어진다. 빌드 id는 참고용이다
// (캐시 이름은 클라이언트 번들에 박힌 같은 값을 쓴다). proxy가 로그인을 요구한다.
// /offline 화면은 이 파일을 캐시에도 넣어 두고, 오프라인 목차의 제목을 여기서 읽는다.

import { NextResponse } from "next/server";
import { getOrderedLessons, getStep } from "@/content/curriculum-helpers";
import { getOrderedBasecampLessons } from "@/content/basecamp-lesson-helpers";
import { getOrderedConcepts } from "@/content/concept-helpers";
import { getSortedTerms } from "@/content/term-helpers";
import { getOrderedRoadmapLessons } from "@/content/roadmap-lesson-helpers";
import { getSortedArticles } from "@/content/article-helpers";
import type { OfflineManifest, OfflineManifestItem } from "@/lib/offline/offline-logic";

const STEP_IDS = [1, 2, 3] as const;

function item(url: string, title: string): OfflineManifestItem {
  return { url, title };
}

function seg(value: string): string {
  return encodeURIComponent(value);
}

export function GET() {
  const body: OfflineManifest = {
    buildId: process.env.NEXT_PUBLIC_BUILD_ID ?? "dev",
    groups: [
      {
        label: "레슨",
        items: [
          item("/curriculum", "커리큘럼 전체"),
          ...STEP_IDS.map((id) => item(`/step/${id}`, `STEP ${id}. ${getStep(id)?.title ?? ""}`)),
          ...getOrderedLessons().map((lesson) => item(`/lesson/${seg(lesson.slug)}`, lesson.title)),
        ],
      },
      {
        label: "베이스캠프",
        items: getOrderedBasecampLessons().map((lesson) => item(`/basecamp/${seg(lesson.slug)}`, lesson.title)),
      },
      {
        label: "AI 뜯어보기",
        items: [
          item("/concepts", "AI 뜯어보기 목차"),
          ...getOrderedConcepts().map((concept) => item(`/concepts/${seg(concept.slug)}`, concept.title)),
          item("/concepts/terms", "용어 사전"),
          ...getSortedTerms().map((term) => item(`/concepts/terms/${seg(term.id)}`, term.title)),
        ],
      },
      {
        label: "로드맵",
        items: getOrderedRoadmapLessons().map((lesson) => item(`/roadmap/${seg(lesson.slug)}`, lesson.title)),
      },
      {
        label: "아티클",
        items: [
          item("/articles", "아티클 목록"),
          ...getSortedArticles().map((article) => item(`/articles/${seg(article.slug)}`, article.title)),
        ],
      },
      {
        label: "기타",
        items: [item("/glossary", "용어집"), item("/about", "소개"), item("/offline", "오프라인 저장")],
      },
    ],
  };
  return NextResponse.json(body);
}
```

- [ ] **Step 4: 전체 받기 모듈**

`src/lib/offline/download.ts`:

```ts
// "전체 받기"(설계 3.2). /offline 화면에서 돈다(서비스 워커가 아니라 페이지가 Cache API로 받는다).
//   1) /offline-manifest.json을 받아 캐시에 넣는다(오프라인 목차의 제목 출처).
//   2) 페이지: 목록의 URL을 쿠키와 함께 받아 HTML을 캐시에 넣는다. 로그인 만료나 권한
//      없음으로 튕긴 응답(redirected)은 넣지 않고 "받지 못한 항목"으로 센다.
//   3) 화면 파일: 받은 HTML에서 같은 출처 /_next/static/ 주소를 뽑아 받는다. CSS 안의
//      글꼴과 이미지 주소도 한 번 더 뽑는다.
//   4) 내 데이터: 레슨 진도 응답과 베이스캠프, 아티클 메모를 사본으로 남긴다. 한 번도 열지
//      않은 레슨에도 오프라인에서 메모를 쓸 수 있게 하려는 것이다.
// 캐시 이름은 서비스 워커와 같은 offline-<빌드 id>다.

import type { ProgressData } from "@/components/progress-provider";
import { clearOfflineCaches, currentCacheName } from "./cache";
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

const MANIFEST_PATH = "/offline-manifest.json";
const CONCURRENCY = 4;

type NoteApiResponse = { unlocked: boolean; note: { ok: true; body: string } | { ok: false } };

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

async function savePage(cache: Cache, url: string, progress: DownloadProgress): Promise<string | null> {
  try {
    const res = await fetch(url, { credentials: "same-origin", cache: "no-store" });
    if (!res.ok || res.redirected) {
      progress.failed += 1;
      return null;
    }
    const html = await res.clone().text();
    progress.bytes += new Blob([html]).size;
    await cache.put(url, res);
    return html;
  } catch {
    progress.failed += 1;
    return null;
  }
}

/** 받은 파일이 CSS면 그 본문(안의 주소를 더 뽑기 위해), 아니면 null. 이미 있으면 받지 않는다. */
async function saveAsset(cache: Cache, assetPath: string, progress: DownloadProgress): Promise<string | null> {
  try {
    if (await cache.match(assetPath)) return null;
    const res = await fetch(assetPath, { credentials: "same-origin" });
    if (!res.ok) {
      progress.failed += 1;
      return null;
    }
    progress.bytes += (await res.clone().blob()).size;
    const isCss = assetPath.split("?")[0].endsWith(".css");
    const text = isCss ? await res.clone().text() : null;
    await cache.put(assetPath, res);
    return text;
  } catch {
    progress.failed += 1;
    return null;
  }
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
  } catch {
    return false;
  }
}

/** 목록 파일. 온라인이면 새로 받고, 오프라인이면 캐시 사본. 둘 다 없으면 null. */
export async function loadManifest(): Promise<OfflineManifest | null> {
  try {
    const res = await fetch(MANIFEST_PATH, { cache: "no-store" });
    if (res.ok && !res.redirected) return (await res.json()) as OfflineManifest;
  } catch {
    // 오프라인. 아래 캐시 사본으로 간다.
  }
  try {
    const cached = await caches.match(MANIFEST_PATH, { cacheName: currentCacheName() });
    if (cached) return (await cached.json()) as OfflineManifest;
  } catch {
    // 캐시도 없다.
  }
  return null;
}

export async function downloadAll(onProgress: (progress: DownloadProgress) => void): Promise<DownloadProgress> {
  const manifestRes = await fetch(MANIFEST_PATH, { credentials: "same-origin", cache: "no-store" });
  if (!manifestRes.ok || manifestRes.redirected) throw new Error("offline-manifest");
  const cache = await caches.open(currentCacheName());
  await cache.put(MANIFEST_PATH, manifestRes.clone());
  const manifest = (await manifestRes.json()) as OfflineManifest;
  const pages = manifest.groups.flatMap((group) => group.items.map((entry) => entry.url));

  const progress: DownloadProgress = { phase: "pages", done: 0, total: pages.length, bytes: 0, failed: 0 };
  const report = () => onProgress({ ...progress });
  report();

  const assets = new Set<string>();
  await runPool(pages, async (url) => {
    const html = await savePage(cache, url, progress);
    if (html !== null) for (const assetPath of extractStaticAssetPaths(html)) assets.add(assetPath);
    progress.done += 1;
    report();
  });

  const seen = new Set(assets);
  const pending = [...assets];
  Object.assign(progress, { phase: "files", done: 0, total: pending.length });
  report();
  while (pending.length > 0) {
    const batch = pending.splice(0, pending.length);
    await runPool(batch, async (assetPath) => {
      const css = await saveAsset(cache, assetPath, progress);
      if (css !== null) {
        for (const nested of extractStaticAssetPaths(css)) {
          if (seen.has(nested)) continue;
          seen.add(nested);
          pending.push(nested);
          progress.total += 1;
        }
      }
      progress.done += 1;
      report();
    });
  }

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

  await setMeta("lastDownloadAt", Date.now()).catch(() => undefined);
  return { ...progress };
}

/** 저장한 페이지를 모두 지우고 오프라인 목차(/offline)만 다시 받아 둔다. 대기열과 사본은 남긴다. */
export async function clearSavedPages(): Promise<void> {
  await clearOfflineCaches();
  const cache = await caches.open(currentCacheName());
  const progress: DownloadProgress = { phase: "pages", done: 0, total: 1, bytes: 0, failed: 0 };
  const html = await savePage(cache, "/offline", progress);
  if (html === null) return;
  for (const assetPath of extractStaticAssetPaths(html)) await saveAsset(cache, assetPath, progress);
}
```

- [ ] **Step 5: 이어서 읽기 파서 공개**

`src/components/continue-reading-card.tsx`에서

```tsx
function parseLastLesson(raw: string | null): { slug: string; title: string } | null {
```

를 다음으로 바꾼다.

```tsx
// /offline 화면(offline-center.tsx)의 "이어서 읽기"도 같은 검증을 쓴다.
export function parseLastLesson(raw: string | null): { slug: string; title: string } | null {
```

- [ ] **Step 6: 오프라인 저장 화면**

`src/components/offline/offline-center.tsx`:

```tsx
"use client";

// 오프라인 저장 화면(/offline, 설계 3.3). 온라인이면 "전체 받기"와 저장본 관리, 오프라인이면
// 서비스 워커가 개인 화면 대신 보여 주는 목차다. 목차에는 Cache Storage에 실제로 있는
// 주소만 보인다. 제목은 /offline-manifest.json(오프라인이면 저장해 둔 사본)에서 온다.
// ?from=<경로>는 서비스 워커가 붙인다. 저장 안 된 콘텐츠면 "아직 저장되지 않았어요",
// 개인 화면이면 "오프라인에서는 열 수 없어요"를 먼저 보여 준다.
// 목차 링크는 prefetch를 끈다(백 개가 넘는 링크의 RSC 미리 받기를 막는다). 오프라인에서
// 누르면 offline-runtime.tsx가 전체 이동으로 바꿔 서비스 워커가 저장본을 준다.

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Download, Trash2 } from "lucide-react";
import { parseLastLesson } from "@/components/continue-reading-card";
import { listCachedPaths } from "@/lib/offline/cache";
import { useOnline } from "@/lib/offline/connectivity";
import { getMeta } from "@/lib/offline/db";
import { clearSavedPages, downloadAll, loadManifest, type DownloadProgress } from "@/lib/offline/download";
import { classifyOfflinePath, formatBytes, type OfflineManifest } from "@/lib/offline/offline-logic";
import { useQueueCount } from "@/lib/offline/queue";
import { useNeedsLogin } from "@/lib/offline/sync";

type Status = "idle" | "running" | "done" | "error";

type Overview = {
  manifest: OfflineManifest | null;
  cached: ReadonlySet<string>;
  lastDownloadAt: number | null;
  usage: number | null;
};

const EMPTY_OVERVIEW: Overview = { manifest: null, cached: new Set(), lastDownloadAt: null, usage: null };

const PHASE_LABEL: Record<DownloadProgress["phase"], string> = {
  pages: "페이지",
  files: "화면 파일",
  data: "내 진도와 메모",
};

async function loadOverview(): Promise<Overview> {
  const [manifest, cached, lastDownloadAt, estimate] = await Promise.all([
    loadManifest(),
    listCachedPaths(),
    getMeta<number>("lastDownloadAt").catch(() => undefined),
    navigator.storage?.estimate ? navigator.storage.estimate().catch(() => null) : Promise.resolve(null),
  ]);
  return { manifest, cached, lastDownloadAt: lastDownloadAt ?? null, usage: estimate?.usage ?? null };
}

function subscribeNothing(): () => void {
  return () => {};
}

function readFromParam(): string | null {
  return new URLSearchParams(window.location.search).get("from");
}

function readLastLessonRaw(): string | null {
  try {
    return localStorage.getItem("lastLesson");
  } catch {
    return null;
  }
}

function readNothing(): null {
  return null;
}

function describeProgress(progress: DownloadProgress): string {
  const failed = progress.failed > 0 ? ` | 받지 못한 항목 ${progress.failed}개` : "";
  return `${PHASE_LABEL[progress.phase]} ${progress.done}/${progress.total} | 받은 용량 ${formatBytes(progress.bytes)}${failed}`;
}

export function OfflineCenter() {
  const online = useOnline();
  const pending = useQueueCount();
  const needsLogin = useNeedsLogin();
  const from = useSyncExternalStore(subscribeNothing, readFromParam, readNothing);
  const lastLesson = parseLastLesson(useSyncExternalStore(subscribeNothing, readLastLessonRaw, readNothing));
  const [overview, setOverview] = useState<Overview>(EMPTY_OVERVIEW);
  const [reloadKey, setReloadKey] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [persisted, setPersisted] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    loadOverview().then((next) => {
      if (active) setOverview(next);
    });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  async function handleDownload() {
    setStatus("running");
    setProgress(null);
    try {
      // 기기가 저장본을 함부로 지우지 않게 요청한다(거절되면 안내만 한다).
      if (navigator.storage?.persist) setPersisted(await navigator.storage.persist());
      setProgress(await downloadAll(setProgress));
      setStatus("done");
    } catch {
      setStatus("error");
    }
    setReloadKey((key) => key + 1);
  }

  async function handleClear() {
    if (!window.confirm("기기에 저장한 페이지를 모두 지울까요? 동기화를 기다리는 체크와 메모는 지우지 않아요.")) return;
    await clearSavedPages();
    setProgress(null);
    setStatus("idle");
    setReloadKey((key) => key + 1);
  }

  const allItems = overview.manifest?.groups.flatMap((group) => group.items) ?? [];
  const savedCount = allItems.filter((entry) => overview.cached.has(entry.url)).length;
  const groups = (overview.manifest?.groups ?? [])
    .map((group) => ({ label: group.label, items: group.items.filter((entry) => overview.cached.has(entry.url)) }))
    .filter((group) => group.items.length > 0);
  // 새 배포는 옛 캐시를 지운다(설계 3.1). 받은 적이 있는데 목차 한 장만 남았으면 알려 준다.
  const wiped = overview.lastDownloadAt !== null && savedCount <= 1;
  const lastLessonHref = lastLesson ? `/lesson/${encodeURIComponent(lastLesson.slug)}` : null;
  const canContinue = lastLessonHref !== null && (online || overview.cached.has(lastLessonHref));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-display font-black break-keep">오프라인 저장</h1>
        <p className="max-w-2xl break-keep text-body font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
          인터넷이 없을 때도 저장한 레슨을 읽고, 완료 체크와 메모를 남길 수 있어요. 연결되면 자동으로 서버와 맞춰요.
        </p>
      </header>

      {from ? (
        <p data-offline-missing className="panel break-keep p-4 text-body font-normal">
          {classifyOfflinePath(from) === "content"
            ? "이 페이지는 아직 기기에 저장되지 않았어요. 인터넷에 연결되면 열 수 있어요."
            : "이 화면은 내 정보를 서버에서 바로 그려서 오프라인에서는 열 수 없어요. 아래 저장된 콘텐츠를 읽어 보세요."}
        </p>
      ) : null}

      <section className="panel flex flex-col gap-2 p-5">
        <h2 className="text-heading font-extrabold">동기화</h2>
        <p className="break-keep text-body font-normal">
          {pending > 0
            ? `동기화를 기다리는 체크와 메모가 ${pending}개 있어요. 연결되면 자동으로 보내요.`
            : "동기화를 기다리는 변경이 없어요."}
        </p>
        {needsLogin ? (
          <p className="break-keep text-body font-bold text-destructive dark:text-destructive-dark">
            다시 로그인하면 동기화돼요.
          </p>
        ) : null}
        {canContinue && lastLesson && lastLessonHref ? (
          <Link
            href={lastLessonHref}
            prefetch={false}
            className="nav-link tap-feedback inline-flex min-h-11 w-fit items-center text-body font-bold text-accent dark:text-accent-dark"
          >
            이어서 읽기: {lastLesson.title}
          </Link>
        ) : null}
      </section>

      <section data-offline-status={status} className="panel flex flex-col gap-3 p-5">
        <h2 className="text-heading font-extrabold">기기에 저장하기</h2>
        <p data-offline-count data-saved={savedCount} data-total={allItems.length} className="text-body font-normal">
          저장된 페이지 {savedCount}/{allItems.length}
          {overview.usage !== null ? ` | 사용 중인 기기 공간 약 ${formatBytes(overview.usage)}` : ""}
        </p>
        {overview.lastDownloadAt !== null ? (
          <p className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
            마지막으로 받은 시각: {new Date(overview.lastDownloadAt).toLocaleString("ko-KR")}
          </p>
        ) : null}
        {wiped ? (
          <p className="break-keep text-body font-bold text-warn dark:text-warn-dark">
            새 버전이 배포되어 저장본을 비웠어요. 떠나기 전에 다시 받아 주세요.
          </p>
        ) : null}
        {online ? (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              data-offline-download
              onClick={() => void handleDownload()}
              disabled={status === "running"}
              aria-busy={status === "running"}
              className="btn-action tap-feedback min-h-11 text-body"
            >
              <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
              {status === "running" ? "받는 중…" : "전체 받기"}
            </button>
            <button
              type="button"
              onClick={() => void handleClear()}
              disabled={status === "running"}
              className="btn tap-feedback min-h-11 text-body"
            >
              <Trash2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              저장본 지우기
            </button>
          </div>
        ) : (
          <p className="break-keep text-body font-normal">
            지금은 오프라인이에요. 새로 받기는 인터넷에 연결된 뒤에 할 수 있어요.
          </p>
        )}
        <p role="status" aria-live="polite" data-offline-progress className="break-keep text-label font-normal">
          {progress ? describeProgress(progress) : ""}
          {status === "done" ? " | 다 받았어요." : ""}
          {status === "error" ? "받지 못했어요. 연결을 확인하고 다시 눌러 주세요." : ""}
        </p>
        {persisted === false ? (
          <p className="break-keep text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
            브라우저가 저장본 보호 요청을 받아 주지 않았어요. 홈 화면 앱으로 쓰면 더 오래 유지돼요.
          </p>
        ) : null}
        <p className="break-keep text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
          아이패드에서는 Safari의 공유 버튼, 홈 화면에 추가로 설치한 앱으로 써야 저장본이 오래 유지돼요.
        </p>
      </section>

      <section data-offline-toc className="flex flex-col gap-4">
        <h2 className="text-heading font-extrabold">저장된 콘텐츠</h2>
        {groups.length === 0 ? (
          <p className="break-keep text-body font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
            아직 저장한 페이지가 없어요.
          </p>
        ) : (
          groups.map((group) => (
            <div key={group.label} className="flex flex-col gap-2">
              <h3 className="text-body font-extrabold">
                {group.label}{" "}
                <span className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
                  {group.items.length}
                </span>
              </h3>
              <ul className="panel flex flex-col p-2">
                {group.items.map((entry) => (
                  <li key={entry.url}>
                    <Link
                      href={entry.url}
                      prefetch={false}
                      className="nav-link tap-feedback flex min-h-11 items-center break-keep px-3 text-body font-normal"
                    >
                      {entry.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
```

`src/app/offline/page.tsx`:

```tsx
import type { Metadata } from "next";
import { OfflineCenter } from "@/components/offline/offline-center";

// 오프라인 저장 화면(설계 3.3). 쿠키도 사용자 데이터도 읽지 않는 정적 셸이다. 그래야
// 서비스 워커가 이 HTML을 저장해 두었다가 누구의 개인 화면 대신이든 그대로 보여 줄 수 있다.
// 내용(저장 현황, 목차)은 전부 클라이언트 아일랜드가 기기 저장소에서 읽는다.
export const metadata: Metadata = {
  title: "오프라인 저장",
};

export default function OfflinePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <OfflineCenter />
    </main>
  );
}
```

- [ ] **Step 7: 네비 항목**

`src/components/site-nav.tsx`에서

```tsx
      { label: "PDF 내보내기", href: "/print" },
```

바로 아래에 추가:

```tsx
      // 오프라인 저장(/offline): 전체 받기와 저장본 관리, 오프라인이면 목차 화면.
      { label: "오프라인 저장", href: "/offline" },
```

- [ ] **Step 8: 정적 검사와 게이트 통과 확인**

```bash
npx next typegen && npx tsc --noEmit -p .
npm run lint 2>&1 | tail -15
node scripts/check-design-tokens.mjs --only src/components/offline/offline-center.tsx src/app/offline/page.tsx
npm run build 2>&1 | tail -40
E2E_TESTER_EMAIL='<테스터 이메일>' E2E_TESTER_PASSWORD='<테스터 비밀번호>' node --env-file=.env.local scripts/e2e-offline.mjs
```

Expected: tsc 출력 없음; lint 새 오류 없음; 토큰 위반 0; 빌드 라우트 표에 `/offline`(정적 ○)과 `/offline-manifest.json`(정적 ○); 게이트 `A1, A2, B0, B, C1, C2, C3, C4, H` 전부 OK, `검사한 9건 전부 통과`.

- [ ] **Step 9: 화면 확인(768px)**

게이트가 쓴 방식 그대로 헤드리스로 보거나, 내장 브라우저를 아이패드 크기(768x1024)로 열어 `npx next start --port 3216 --hostname 127.0.0.1`의 `/offline`에서 확인한다(개발 서버에서는 서비스 워커가 등록되지 않는다).
- 제목, 동기화 칸, 저장 칸, 목차가 한 열로 쌓이고 가로 넘침이 없다
- 전체 받기 중 진행 문구가 "페이지 n/N", "화면 파일 n/N", "내 진도와 메모 n/N" 순서로 바뀐다
- 목차 그룹(레슨, 베이스캠프, AI 뜯어보기, 로드맵, 아티클, 기타) 제목 옆에 개수, 각 링크 높이 44px 이상
- 더보기 메뉴의 "PDF 내보내기" 바로 아래에 "오프라인 저장"

- [ ] **Step 10: Commit**

```bash
git add src/app/offline-manifest.json/route.ts src/lib/offline/download.ts src/components/offline/offline-center.tsx src/app/offline/page.tsx src/components/continue-reading-card.tsx src/components/site-nav.tsx scripts/e2e-offline.mjs
git commit -m "feat(offline): 전체 받기 목록과 오프라인 저장 화면(목차 겸용), 네비 항목

Co-Authored-By: (세션이 안내한 attribution 줄)"
```

---

### Task 5: 완료 체크와 메모를 대기열에 연결, 오프라인 읽기

**Files:**
- Modify: `src/components/progress-provider.tsx` (import, 헤더 주석 끝, effect `l.97-112`, `refresh` `l.117-124`)
- Modify: `src/components/complete-button.tsx` (import, `handleToggle` 안 호출 1곳)
- Modify: `src/components/basecamp/basecamp-step-checklist.tsx` (import, `handleToggle` 안 호출 1곳)
- Modify: `src/components/basecamp/basecamp-prep-checklist.tsx` (import, `handleToggle` 안 호출 1곳)
- Modify: `src/components/lesson-notepad.tsx` (import, `SaveStatus`, props, `flush`, 상태 문구)
- Modify: `src/components/basecamp-note.tsx`, `src/components/article-note.tsx` (import, effect, 메모장 prop)
- Modify: `scripts/e2e-offline.mjs` (H 앵커 위에 D, E 블록)

**Interfaces:**
- Consumes: Task 1 `NOTE_KEY_PREFIX`; Task 3 `writeOrQueue`, `keepProgressCopy`, `readProgressCopy`, `keepNoteCopy`, `readNoteCopy`
- Produces:
  - `LessonNotepad` 새 선택 prop `noteKeyPrefix?: string`(기본 `""`), `SaveStatus`에 `"queued"` 추가, DOM `[data-notepad-status="queued"]`
  - `ProgressProvider`: 오프라인이면 사본으로 `status: "ready"`

- [ ] **Step 1: 실패하는 브라우저 시나리오 추가(D, E)**

`scripts/e2e-offline.mjs`에서

```js
    // === H. 로그아웃하면 기기 저장본이 모두 지워진다(항상 마지막) ===
```

을 다음으로 바꾼다.

```js
    // === D. 오프라인 완료 체크와 메모가 대기열에 쌓인다 ===
    const offlineNote = `오프라인메모-${Date.now()}-한글`;
    let expectedDone = null;
    try {
      await goOffline(context);
      await page.goto(`${BASE_URL}${PROBE_ROUTE}`, { waitUntil: 'domcontentloaded' });
      await waitForProgressSettled(page);
      const islandState = await page.getAttribute('[data-progress-island]', 'data-progress-state');
      record('D1', '오프라인에서 진도 아일랜드가 기기 사본으로 준비됨', islandState === 'ready', `state=${islandState}`);

      const before = await page.getAttribute('[data-progress-ui="complete-button"]', 'data-complete-state');
      expectedDone = before !== 'done';
      await page.click('[data-progress-ui="complete-button"] button');
      await page.waitForSelector(
        `[data-progress-ui="complete-button"][data-complete-state="${expectedDone ? 'done' : 'todo'}"]`,
        { timeout: 10_000 },
      );
      const afterToggle = await queueCount(page);
      record('D2', '오프라인 완료 체크가 화면에 반영되고 대기열에 1건', afterToggle === 1, `before=${before} queue=${afterToggle}`);

      await page.click('[data-notepad] button[aria-expanded]');
      await page.waitForSelector('[data-notepad-input]');
      await page.fill('[data-notepad-input]', offlineNote);
      await page.waitForTimeout(1800);
      const noteStatus = await page.getAttribute('[data-notepad-status]', 'data-notepad-status');
      const afterNote = await queueCount(page);
      record('D3', '오프라인 메모가 기기에 저장됨 상태로 대기열에 들어감', noteStatus === 'queued' && afterNote === 2, `status=${noteStatus} queue=${afterNote}`);
    } catch (e) {
      record('D', '오프라인 쓰기', false, `예외: ${e.message}`);
    }

    // === E. 온라인 복귀 후 자동 동기화와 서버 반영 ===
    try {
      if (server === null) await goOnline(context);
      const drained = await waitForQueueEmpty(page, 40_000);
      const { data: progressRow } = await admin
        .from('progress')
        .select('lesson_id')
        .eq('user_id', userId)
        .eq('lesson_id', PROBE_SLUG)
        .maybeSingle();
      const { data: noteRow } = await admin
        .from('lesson_note')
        .select('body')
        .eq('user_id', userId)
        .eq('lesson_id', PROBE_SLUG)
        .maybeSingle();
      const serverDone = progressRow !== null;
      const pass = drained && expectedDone !== null && serverDone === expectedDone && noteRow?.body === offlineNote;
      record('E1', '복귀하면 대기열이 비고 서버에 완료와 메모가 반영됨', pass, JSON.stringify({ drained, expectedDone, serverDone, noteMatches: noteRow?.body === offlineNote }));

      await page.reload({ waitUntil: 'domcontentloaded' });
      await waitForProgressSettled(page);
      const uiState = await page.getAttribute('[data-progress-ui="complete-button"]', 'data-complete-state');
      record('E2', '새로고침 후 화면도 서버 값과 같음', uiState === (expectedDone ? 'done' : 'todo'), `ui=${uiState}`);
    } catch (e) {
      record('E', '동기화', false, `예외: ${e.message}`);
    }
    if (server === null) await goOnline(context);

    // === H. 로그아웃하면 기기 저장본이 모두 지워진다(항상 마지막) ===
```

- [ ] **Step 2: 실패 확인**

```bash
npm run build 2>&1 | tail -3
E2E_TESTER_EMAIL='<테스터 이메일>' E2E_TESTER_PASSWORD='<테스터 비밀번호>' node --env-file=.env.local scripts/e2e-offline.mjs
```

Expected: 종료 코드 1. `D1 ... FAIL (state=error)`, 이어서 완료 버튼이 없어 `D 오프라인 쓰기: FAIL (예외 ...)`, `E1 ... FAIL`. 나머지 OK.

- [ ] **Step 3: 진도 아일랜드(사본 저장과 오프라인 읽기)**

`src/components/progress-provider.tsx`에서

```tsx
// lib/supabase/admin이나 lib/progress-store를 절대 import하지 않는다
// (check-progress-gates.mjs G2).
```

를 다음으로 바꾼다.

```tsx
// lib/supabase/admin이나 lib/progress-store를 절대 import하지 않는다
// (check-progress-gates.mjs G2).
//
// 오프라인 모드(설계 3.4): 받은 응답은 기기 사본으로 남기고, 동기화 안 된 쓰기(대기열)를
// 얹어 보여 준다. 받기가 실패하면(오프라인) 사본에 대기열을 얹어 ready로 그린다. 사본이
// 없을 때만 기존처럼 error다.
```

같은 파일 import 묶음의

```tsx
import type { ProgressCounts } from "@/lib/progress-math";
```

아래에 추가:

```tsx
import { keepProgressCopy, readProgressCopy } from "@/lib/offline/snapshots";
```

같은 파일에서 effect와 refresh

```tsx
  useEffect(() => {
    const controller = new AbortController();

    fetch(url, { signal: controller.signal, cache: "no-store" })
      .then((res) => res.json() as Promise<ProgressData>)
      .then((data) => {
        if (controller.signal.aborted) return;
        setState(toState(data));
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setState({ status: "error", data: null });
      });

    return () => controller.abort();
  }, [url]);

  // 재조회는 화면을 비우지 않는다 — status를 loading으로 되돌리지 않고, 응답이
  // 도착한 뒤에만 상태를 바꿔 끼운다. 돌려주는 Promise는 완료 버튼이 자기 임시
  // 상태를 언제 풀지 판단하는 신호다.
  const refresh = useCallback(
    () =>
      fetch(url, { cache: "no-store" })
        .then((res) => res.json() as Promise<ProgressData>)
        .then((data) => setState(toState(data)))
        .catch(() => setState({ status: "error", data: null })),
    [url],
  );
```

를 다음으로 바꾼다.

```tsx
  useEffect(() => {
    const controller = new AbortController();

    fetch(url, { signal: controller.signal, cache: "no-store" })
      .then((res) => res.json() as Promise<ProgressData>)
      .then((data) => keepProgressCopy(lessonId, data))
      .then((data) => {
        if (controller.signal.aborted) return;
        setState(toState(data));
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        readProgressCopy(lessonId).then((copy) => {
          if (controller.signal.aborted) return;
          setState(copy ? toState(copy) : { status: "error", data: null });
        });
      });

    return () => controller.abort();
  }, [url, lessonId]);

  // 재조회는 화면을 비우지 않는다. status를 loading으로 되돌리지 않고, 응답이
  // 도착한 뒤에만 상태를 바꿔 끼운다. 돌려주는 Promise는 완료 버튼이 자기 임시
  // 상태를 언제 풀지 판단하는 신호다. 오프라인이면 사본(+대기열)으로 바꿔 끼운다.
  const refresh = useCallback(
    () =>
      fetch(url, { cache: "no-store" })
        .then((res) => res.json() as Promise<ProgressData>)
        .then((data) => keepProgressCopy(lessonId, data))
        .then((data) => setState(toState(data)))
        .catch(() =>
          readProgressCopy(lessonId).then((copy) =>
            setState(copy ? toState(copy) : { status: "error", data: null }),
          ),
        ),
    [url, lessonId],
  );
```

- [ ] **Step 4: 완료 버튼**

`src/components/complete-button.tsx`에서

```tsx
import { toggleLessonComplete } from '@/app/lesson/[lessonId]/actions';
```

아래에 추가:

```tsx
import { writeOrQueue } from '@/lib/offline/sync';
```

같은 파일에서

```tsx
      await toggleLessonComplete(lessonId, initialDone);
```

를 다음으로 바꾼다.

```tsx
      // 오프라인이거나 연결이 끊겨 있으면 기기 대기열에 목표 상태로 넣고 성공처럼 진행한다
      // (연결되면 자동 동기화, 설계 3.4). 서버에 닿는데 실패한 것만 아래 catch로 간다.
      await writeOrQueue(
        { kind: 'lessonComplete', key: lessonId, value: next },
        () => toggleLessonComplete(lessonId, initialDone),
      );
```

- [ ] **Step 5: 베이스캠프 체크리스트 두 곳**

`src/components/basecamp/basecamp-step-checklist.tsx`에서

```tsx
import { toggleBasecampItem } from '@/app/basecamp/actions';
```

아래에 추가:

```tsx
import { writeOrQueue } from '@/lib/offline/sync';
```

같은 파일에서

```tsx
      await toggleBasecampItem(itemId, wasDone);
```

를 다음으로 바꾼다.

```tsx
      // 연결이 끊겨 있으면 기기 대기열에 목표 상태로 넣는다(오프라인 모드 설계 3.4).
      await writeOrQueue(
        { kind: 'basecampItem', key: itemId, value: !wasDone },
        () => toggleBasecampItem(itemId, wasDone),
      );
```

`src/components/basecamp/basecamp-prep-checklist.tsx`에서

```tsx
import { toggleBasecampItem } from '@/app/basecamp/actions';
```

아래에 추가:

```tsx
import { writeOrQueue } from '@/lib/offline/sync';
```

같은 파일에서

```tsx
      await toggleBasecampItem(id, wasDone);
```

를 다음으로 바꾼다.

```tsx
      // 연결이 끊겨 있으면 기기 대기열에 목표 상태로 넣는다(오프라인 모드 설계 3.4).
      await writeOrQueue(
        { kind: 'basecampItem', key: id, value: !wasDone },
        () => toggleBasecampItem(id, wasDone),
      );
```

- [ ] **Step 6: 메모장**

`src/components/lesson-notepad.tsx`에서

```tsx
import { saveLessonNoteAction } from '@/app/lesson/[lessonId]/note-actions';
```

아래에 추가:

```tsx
import { NOTE_KEY_PREFIX } from '@/lib/offline/offline-logic';
import { writeOrQueue } from '@/lib/offline/sync';
```

같은 파일에서

```tsx
type SaveStatus = 'idle' | 'saving' | 'saved' | 'failed';
```

를 다음으로 바꾼다.

```tsx
// queued: 오프라인이라 기기 대기열에 넣었다(연결되면 자동으로 서버에 보낸다).
type SaveStatus = 'idle' | 'saving' | 'saved' | 'queued' | 'failed';
```

같은 파일에서

```tsx
  saveAction = saveLessonNoteAction,
}: {
  lessonId: string;
  initialBody: string;
  saveAction?: (lessonId: string, body: string) => Promise<void>;
}) {
```

를 다음으로 바꾼다.

```tsx
  saveAction = saveLessonNoteAction,
  // 오프라인 대기열의 메모 키 접두사(서버 저장 키와 같은 규칙). 정규 레슨은 없음,
  // 베이스캠프는 "basecamp:", 아티클은 "article:"(NOTE_KEY_PREFIX).
  noteKeyPrefix = NOTE_KEY_PREFIX.lesson,
}: {
  lessonId: string;
  initialBody: string;
  saveAction?: (lessonId: string, body: string) => Promise<void>;
  noteKeyPrefix?: string;
}) {
```

같은 파일 `flush()` 안에서

```tsx
    try {
      await saveAction(lessonId, current);
      lastSavedRef.current = current;
      if (mountedRef.current) setStatus('saved');
    } catch {
```

를 다음으로 바꾼다.

```tsx
    try {
      // 오프라인이거나 연결이 끊겼으면 기기 대기열에 넣는다(오프라인 모드 설계 3.4).
      const result = await writeOrQueue(
        { kind: 'note', key: `${noteKeyPrefix}${lessonId}`, value: current },
        () => saveAction(lessonId, current),
      );
      lastSavedRef.current = current;
      if (mountedRef.current) setStatus(result === 'queued' ? 'queued' : 'saved');
    } catch {
```

같은 파일에서

```tsx
            {status === 'saved' ? '저장됨' : ''}
```

를 다음으로 바꾼다.

```tsx
            {status === 'saved' ? '저장됨' : ''}
            {status === 'queued' ? '기기에 저장했어요. 연결되면 자동으로 서버에 보내요.' : ''}
```

- [ ] **Step 7: 베이스캠프와 아티클 메모 읽기**

`src/components/basecamp-note.tsx`에서

```tsx
import type { BasecampNoteResponse } from "@/app/api/basecamp-note/route";
```

아래에 추가:

```tsx
import { NOTE_KEY_PREFIX } from "@/lib/offline/offline-logic";
import { keepNoteCopy, readNoteCopy } from "@/lib/offline/snapshots";
```

같은 파일의 effect 전체

```tsx
  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/basecamp-note?slug=${encodeURIComponent(slug)}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then((res) => res.json() as Promise<BasecampNoteResponse>)
      .then((data) => {
        if (controller.signal.aborted) return;
        if (!data.unlocked) return setState({ status: "locked" });
        if (data.note.ok) return setState({ status: "ready", body: data.note.body });
        return setState({ status: "error" });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setState({ status: "error" });
      });

    return () => controller.abort();
  }, [slug]);
```

를 다음으로 바꾼다.

```tsx
  useEffect(() => {
    const controller = new AbortController();
    const noteKey = `${NOTE_KEY_PREFIX.basecamp}${slug}`;

    fetch(`/api/basecamp-note?slug=${encodeURIComponent(slug)}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then((res) => res.json() as Promise<BasecampNoteResponse>)
      .then(async (data) => {
        if (controller.signal.aborted) return;
        if (!data.unlocked) return setState({ status: "locked" });
        if (!data.note.ok) return setState({ status: "error" });
        // 서버 본문을 기기 사본으로 남기고, 동기화 안 된 메모가 있으면 그것을 보여 준다.
        const body = await keepNoteCopy(noteKey, data.note.body);
        if (controller.signal.aborted) return;
        setState({ status: "ready", body });
      })
      .catch(async () => {
        if (controller.signal.aborted) return;
        // 오프라인이면 기기 사본(대기열 우선)으로 메모장을 연다. 사본이 없으면 기존 안내.
        const body = await readNoteCopy(noteKey);
        if (controller.signal.aborted) return;
        setState(body === null ? { status: "error" } : { status: "ready", body });
      });

    return () => controller.abort();
  }, [slug]);
```

같은 파일에서

```tsx
    <LessonNotepad lessonId={slug} initialBody={state.body} saveAction={saveBasecampNoteAction} />
```

를 다음으로 바꾼다.

```tsx
    <LessonNotepad
      lessonId={slug}
      initialBody={state.body}
      saveAction={saveBasecampNoteAction}
      noteKeyPrefix={NOTE_KEY_PREFIX.basecamp}
    />
```

`src/components/article-note.tsx`에서

```tsx
import type { ArticleNoteResponse } from "@/app/api/article-note/route";
```

아래에 추가:

```tsx
import { NOTE_KEY_PREFIX } from "@/lib/offline/offline-logic";
import { keepNoteCopy, readNoteCopy } from "@/lib/offline/snapshots";
```

같은 파일의 effect 전체

```tsx
  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/article-note?slug=${encodeURIComponent(slug)}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then((res) => res.json() as Promise<ArticleNoteResponse>)
      .then((data) => {
        if (controller.signal.aborted) return;
        if (!data.unlocked) return setState({ status: "locked" });
        if (data.note.ok) return setState({ status: "ready", body: data.note.body });
        return setState({ status: "error" });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setState({ status: "error" });
      });

    return () => controller.abort();
  }, [slug]);
```

를 다음으로 바꾼다.

```tsx
  useEffect(() => {
    const controller = new AbortController();
    const noteKey = `${NOTE_KEY_PREFIX.article}${slug}`;

    fetch(`/api/article-note?slug=${encodeURIComponent(slug)}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then((res) => res.json() as Promise<ArticleNoteResponse>)
      .then(async (data) => {
        if (controller.signal.aborted) return;
        if (!data.unlocked) return setState({ status: "locked" });
        if (!data.note.ok) return setState({ status: "error" });
        // 서버 본문을 기기 사본으로 남기고, 동기화 안 된 메모가 있으면 그것을 보여 준다.
        const body = await keepNoteCopy(noteKey, data.note.body);
        if (controller.signal.aborted) return;
        setState({ status: "ready", body });
      })
      .catch(async () => {
        if (controller.signal.aborted) return;
        // 오프라인이면 기기 사본(대기열 우선)으로 메모장을 연다. 사본이 없으면 기존 안내.
        const body = await readNoteCopy(noteKey);
        if (controller.signal.aborted) return;
        setState(body === null ? { status: "error" } : { status: "ready", body });
      });

    return () => controller.abort();
  }, [slug]);
```

같은 파일에서

```tsx
    <LessonNotepad lessonId={slug} initialBody={state.body} saveAction={saveArticleNoteAction} />
```

를 다음으로 바꾼다.

```tsx
    <LessonNotepad
      lessonId={slug}
      initialBody={state.body}
      saveAction={saveArticleNoteAction}
      noteKeyPrefix={NOTE_KEY_PREFIX.article}
    />
```

- [ ] **Step 8: 정적 검사와 게이트 통과 확인**

```bash
npx next typegen && npx tsc --noEmit -p .
npm run lint 2>&1 | tail -15
node scripts/check-progress-gates.mjs 2>&1 | tail -6
node scripts/check-design-tokens.mjs --only src/components/lesson-notepad.tsx src/components/complete-button.tsx src/components/basecamp-note.tsx src/components/article-note.tsx
npm run build 2>&1 | tail -3
E2E_TESTER_EMAIL='<테스터 이메일>' E2E_TESTER_PASSWORD='<테스터 비밀번호>' node --env-file=.env.local scripts/e2e-offline.mjs
```

Expected: tsc 출력 없음; lint 새 오류 없음(`basecamp-step-checklist.tsx`의 기존 refs 오류 1건은 그대로, 늘지 않음); 진도 게이트는 기존 3건만(G12, G23 통과 유지); 토큰 위반 0; 게이트 `A1, A2, B0, B, C1~C4, D1~D3, E1, E2, H` 전부 OK, `검사한 14건 전부 통과`, 복원 완료.

- [ ] **Step 9: Commit**

```bash
git add src/components/progress-provider.tsx src/components/complete-button.tsx src/components/basecamp/basecamp-step-checklist.tsx src/components/basecamp/basecamp-prep-checklist.tsx src/components/lesson-notepad.tsx src/components/basecamp-note.tsx src/components/article-note.tsx scripts/e2e-offline.mjs
git commit -m "feat(offline): 완료 체크와 메모를 오프라인 대기열에 연결, 기기 사본으로 진도와 메모 읽기

Co-Authored-By: (세션이 안내한 attribution 줄)"
```

---

### Task 6: ON AIR 램프와 온라인 전용 기능 잠금

**Files:**
- Create: `src/components/offline/on-air-lamp.tsx`
- Modify: `src/app/globals.css` (`@theme` 안 `--color-destructive-dark` 줄 아래 토큰 4줄, 파일 끝에 램프 블록)
- Modify: `src/components/site-nav.tsx` (import 1줄, 오른쪽 컨트롤 래퍼 1줄)
- Modify: `src/components/run-python.tsx`, `src/components/run-sql.tsx`, `src/components/bookmark-button.tsx`, `src/components/lesson-needs-review.tsx`, `src/components/lesson-til.tsx`
- Modify: `scripts/e2e-offline.mjs` (H 앵커 위에 F, G 블록)

**Interfaces:**
- Consumes: Task 3 `useOnline`, `useQueueCount`, `useNeedsLogin`
- Produces:
  - `<OnAirLamp />`(props 없음). DOM: `a[data-onair="on|off"][data-pending="<n>"]`, 안의 `.onair-lamp[data-state="on|off"]`, 대기 배지 `[data-onair-badge]`
  - 토큰 `--color-onair`, `--color-onair-dark`, `--color-offair`, `--color-offair-dark`(유틸리티 `text-onair`, `text-offair` 등)
  - 키프레임 `lamp-breathe`(3s), `lamp-blink`(1s)

- [ ] **Step 1: 실패하는 브라우저 시나리오 추가(F, G)**

`scripts/e2e-offline.mjs`에서

```js
    // === H. 로그아웃하면 기기 저장본이 모두 지워진다(항상 마지막) ===
```

을 다음으로 바꾼다.

```js
    // === F. ON AIR 램프, 동작 줄이기, 온라인 전용 기능 잠금, 대기 개수 배지 ===
    {
      const readLamp = () =>
        page.evaluate(() => {
          const link = document.querySelector('[data-onair]');
          const dot = link?.querySelector('.onair-lamp');
          return {
            mode: link?.getAttribute('data-onair') ?? null,
            pending: link?.getAttribute('data-pending') ?? null,
            text: link?.textContent ?? '',
            animation: dot ? getComputedStyle(dot).animationName : null,
          };
        });
      try {
        await page.goto(`${BASE_URL}${PROBE_ROUTE}`, { waitUntil: 'domcontentloaded' });
        await waitForProgressSettled(page);
        await page.waitForSelector('[data-onair="on"]', { timeout: 15_000 });
        const on = await readLamp();
        record('F1', '온라인: ON AIR, 숨 쉬는 불빛', on.text.includes('ON AIR') && on.animation === 'lamp-breathe', JSON.stringify(on));

        await goOffline(context);
        await page.waitForSelector('[data-onair="off"]', { timeout: 10_000 });
        const off = await readLamp();
        record('F2', '오프라인: OFF AIR, 깜빡임', off.text.includes('OFF AIR') && off.animation === 'lamp-blink', JSON.stringify(off));

        await page.emulateMedia({ reducedMotion: 'reduce' });
        const reduced = await readLamp();
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        record('F3', '동작 줄이기 설정이면 램프 애니메이션 없음', reduced.animation === 'none', JSON.stringify(reduced));

        const locks = await page.evaluate(() => ({
          needsReview: document.querySelector('[data-needs-review] button')?.disabled ?? null,
          til: document.querySelector('[data-til] button')?.disabled ?? null,
        }));
        record('F4', '오프라인이면 다시 보기 표시와 TIL 저장이 잠김', locks.needsReview === true && locks.til === true, JSON.stringify(locks));

        // 완료를 두 번 누른다. 같은 항목이라 대기열에서 1건으로 합쳐지고, 최종 목표가 서버
        // 값과 같아 동기화 후에도 서버 값은 바뀌지 않는다.
        await page.click('[data-progress-ui="complete-button"] button');
        await page.waitForSelector('[data-onair][data-pending="1"]', { timeout: 10_000 });
        const badge = await page.evaluate(() => document.querySelector('[data-onair-badge]')?.textContent ?? null);
        await page.click('[data-progress-ui="complete-button"] button');
        await page.waitForTimeout(800);
        const afterTwo = await readLamp();
        record('F5', '대기 개수 배지(같은 항목 두 번은 1건으로 합쳐짐)', badge === '1' && afterTwo.pending === '1', JSON.stringify({ badge, afterTwo }));

        await goOnline(context);
        await page.waitForSelector('[data-onair="on"][data-pending="0"]', { timeout: 40_000 });
        record('F6', '복귀하면 ON AIR, 대기 0', true, '');
      } catch (e) {
        record('F', '램프', false, `예외: ${e.message}`);
      }
      if (server === null) await goOnline(context);
    }

    // === G. 헤더 한 줄 유지(램프 추가 후 375/768/1024), 가로 넘침 없음 ===
    {
      const storageState = await context.storageState();
      for (const vp of [
        { width: 375, height: 667, label: '375x667' },
        { width: 768, height: 1024, label: '768x1024' },
        { width: 1024, height: 768, label: '1024x768' },
      ]) {
        try {
          const vpContext = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, storageState });
          const vpPage = await vpContext.newPage();
          await vpPage.goto(`${BASE_URL}${PROBE_ROUTE}`, { waitUntil: 'domcontentloaded' });
          await vpPage.waitForSelector('[data-onair]', { timeout: 15_000 });
          const m = await vpPage.evaluate(() => ({
            navHeight: document.querySelector('header nav')?.getBoundingClientRect().height ?? null,
            lampWidth: document.querySelector('[data-onair]')?.getBoundingClientRect().width ?? null,
            lampHeight: document.querySelector('[data-onair]')?.getBoundingClientRect().height ?? null,
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
          }));
          const pass =
            m.navHeight !== null &&
            m.navHeight <= 64 &&
            m.lampWidth >= 44 &&
            m.lampHeight >= 44 &&
            m.scrollWidth <= m.clientWidth;
          record(`G-${vp.label}`, '헤더 한 줄, 램프 터치 타깃 44px, 가로 넘침 없음', pass, JSON.stringify(m));
          await vpContext.close();
        } catch (e) {
          record(`G-${vp.label}`, '헤더 한 줄', false, `예외: ${e.message}`);
        }
      }
    }

    // === H. 로그아웃하면 기기 저장본이 모두 지워진다(항상 마지막) ===
```

- [ ] **Step 2: 실패 확인**

```bash
npm run build 2>&1 | tail -3
E2E_TESTER_EMAIL='<테스터 이메일>' E2E_TESTER_PASSWORD='<테스터 비밀번호>' node --env-file=.env.local scripts/e2e-offline.mjs
```

Expected: 종료 코드 1. `F ... FAIL (예외: ... [data-onair="on"] ...)`, G 세 폭 FAIL. 나머지 OK.

- [ ] **Step 3: 램프 토큰과 애니메이션**

`src/app/globals.css`의 `@theme` 블록에서

```css
  --color-destructive-dark: #ff4d6d;
```

바로 아래에 추가:

```css
  /* ON AIR 램프(오프라인 모드, 2026-09-23). 온라인은 ok, 오프라인은 destructive와 같은
     값이다. 따로 이름을 두는 이유: 램프 색을 바꿀 때 완료, 경고 표시까지 같이 바뀌지
     않게 한다. */
  --color-onair: #15803d;
  --color-onair-dark: #2fd48a;
  --color-offair: #c02033;
  --color-offair-dark: #ff4d6d;
```

같은 파일 맨 끝에 추가:

```css

/* ON AIR 램프(오프라인 모드, src/components/offline/on-air-lamp.tsx). 색은 요소의 글자색
   (text-onair / text-offair 유틸리티, @theme 토큰)을 currentColor로 받아 배경과 빛 번짐에
   쓴다. 새 색 리터럴 없음. 온라인은 약 3초 주기로 천천히 숨 쉬고(밝기와 번짐만), 오프라인은
   1초 주기로 또렷하게 깜빡인다. 방송 램프라 이 디자인에서 예외적으로 둥글다(.rounded-full은
   이 사이트에서 각지게 덮이므로 여기서 직접 둥글게 한다). */
@keyframes lamp-breathe {
  0%,
  100% {
    opacity: 0.55;
    box-shadow: 0 0 0 0 transparent;
  }
  50% {
    opacity: 1;
    box-shadow: 0 0 0 3px color-mix(in srgb, currentColor 35%, transparent);
  }
}

@keyframes lamp-blink {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.15;
  }
  100% {
    opacity: 1;
  }
}

.onair-lamp {
  display: inline-block;
  border-radius: 9999px;
  background-color: currentColor;
  animation: lamp-breathe 3s ease-in-out infinite;
}

.onair-lamp[data-state="off"] {
  animation: lamp-blink 1s step-end infinite;
}

@media (prefers-reduced-motion: reduce) {
  .onair-lamp,
  .onair-lamp[data-state="off"] {
    animation: none;
    opacity: 1;
  }
}
```

- [ ] **Step 4: 램프 컴포넌트**

`src/components/offline/on-air-lamp.tsx`:

```tsx
"use client";

// 헤더의 ON AIR 램프(설계 3.5). 온라인이면 "ON AIR"와 천천히 숨 쉬는 불빛, 오프라인이면
// "OFF AIR"와 또렷한 깜빡임. 동기화를 기다리는 변경이 있으면 램프 위에 개수 배지를
// 얹는다. 누르면 오프라인 저장 화면(/offline)으로 간다.
//
// 640px 미만에서는 글자를 숨기고 램프만 보인다. 375px 폭에서 로고, 램프, 햄버거, 테마
// 버튼이 한 줄에 들어가는 최대 폭이다(글자까지 넣으면 헤더가 두 줄로 접힌다). 배지는
// 흐름 밖(absolute)에 얹어 폭을 늘리지 않는다. 상태 변화는 화면 밖 라이브 영역이 알린다.

import Link from "next/link";
import { useOnline } from "@/lib/offline/connectivity";
import { useQueueCount } from "@/lib/offline/queue";
import { useNeedsLogin } from "@/lib/offline/sync";

export function OnAirLamp() {
  const online = useOnline();
  const pending = useQueueCount();
  const needsLogin = useNeedsLogin();

  const parts = [online ? "온라인" : "오프라인"];
  if (pending > 0) parts.push(`동기화 대기 ${pending}개`);
  if (needsLogin) parts.push("다시 로그인하면 동기화돼요");
  const description = `${parts.join(", ")}. 오프라인 저장 화면 열기`;

  return (
    <>
      <Link
        href="/offline"
        prefetch={false}
        data-onair={online ? "on" : "off"}
        data-pending={pending}
        aria-label={description}
        title={description}
        className="tap-feedback relative flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 px-2 text-label font-bold text-badge-neutral-text hover:bg-badge-neutral-bg dark:text-badge-neutral-text-dark dark:hover:bg-badge-neutral-bg-dark"
      >
        <span
          aria-hidden="true"
          data-state={online ? "on" : "off"}
          className={`onair-lamp h-2.5 w-2.5 shrink-0 ${
            online ? "text-onair dark:text-onair-dark" : "text-offair dark:text-offair-dark"
          }`}
        />
        <span aria-hidden="true" className="hidden sm:inline">
          {online ? "ON AIR" : "OFF AIR"}
        </span>
        {pending > 0 ? (
          <span
            aria-hidden="true"
            data-onair-badge
            className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center bg-foreground px-1 text-label font-bold leading-none text-background dark:bg-foreground-dark dark:text-background-dark"
          >
            {pending}
          </span>
        ) : null}
      </Link>
      <span role="status" aria-live="polite" className="sr-only">
        {online ? "온라인 상태예요." : "오프라인 상태예요. 저장한 페이지만 열 수 있어요."}
      </span>
    </>
  );
}
```

`src/components/site-nav.tsx`에서

```tsx
import { ThemeToggle } from "@/components/theme-toggle";
```

아래에 추가:

```tsx
import { OnAirLamp } from "@/components/offline/on-air-lamp";
```

같은 파일에서

```tsx
        <div className="flex items-center gap-1 lg:contents">
          <button
```

를 다음으로 바꾼다.

```tsx
        <div className="flex items-center gap-1 lg:contents">
          {/* ON AIR 램프(오프라인 모드). 로그인 상태에서만. 1024px 이상에서는 래퍼가
              contents라 nav의 직계 자식(로고, 항목, 램프, 테마 버튼)으로 선다. */}
          {loggedIn ? <OnAirLamp /> : null}
          <button
```

- [ ] **Step 5: 온라인 전용 기능 잠금(설계 3.7)**

`src/components/run-python.tsx`에서

```tsx
import { TraceEditor, buildTraceTemplate } from '@/components/trace-editor';
```

아래에 추가:

```tsx
import { useOnline } from '@/lib/offline/connectivity';
```

같은 파일에서

```tsx
  const [status, setStatus] = useState<Status>('idle');
```

바로 아래에 추가:

```tsx
  // 실행 엔진을 CDN에서 받으므로 오프라인이면 실행을 막고 안내한다(오프라인 모드 설계 3.7).
  const online = useOnline();
```

같은 파일의 실행 버튼에서

```tsx
            onClick={handleRunClick}
            disabled={isBusy}
          >
```

를 다음으로 바꾼다.

```tsx
            onClick={handleRunClick}
            disabled={isBusy || !online}
          >
```

같은 파일에서

```tsx
          {status === 'idle' ? (
            <span className="text-label font-normal text-muted dark:text-muted-dark">
              처음 실행은 파이썬 환경을 내려받느라 시간이 걸려요(10초 이상 걸릴 수 있어요).
            </span>
          ) : null}
```

를 다음으로 바꾼다.

```tsx
          {!online ? (
            <span className="text-label font-normal text-muted dark:text-muted-dark">
              인터넷 연결 후 실행할 수 있어요.
            </span>
          ) : status === 'idle' ? (
            <span className="text-label font-normal text-muted dark:text-muted-dark">
              처음 실행은 파이썬 환경을 내려받느라 시간이 걸려요(10초 이상 걸릴 수 있어요).
            </span>
          ) : null}
```

`src/components/run-sql.tsx`에서

```tsx
import { TraceEditor, buildTraceTemplate } from '@/components/trace-editor';
```

아래에 추가:

```tsx
import { useOnline } from '@/lib/offline/connectivity';
```

같은 파일에서

```tsx
  const [status, setStatus] = useState<Status>('idle');
```

바로 아래에 추가:

```tsx
  // 실행 엔진을 CDN에서 받으므로 오프라인이면 실행을 막고 안내한다(오프라인 모드 설계 3.7).
  const online = useOnline();
```

같은 파일의 실행 버튼에서

```tsx
            onClick={handleRunClick}
            disabled={isBusy}
          >
```

를 다음으로 바꾼다.

```tsx
            onClick={handleRunClick}
            disabled={isBusy || !online}
          >
```

같은 파일에서

```tsx
          {status === 'idle' ? (
            <span className="text-label font-normal text-muted dark:text-muted-dark">
              처음 실행은 SQL 환경을 내려받느라 시간이 걸려요(10초 이상 걸릴 수 있어요).
            </span>
          ) : null}
```

를 다음으로 바꾼다.

```tsx
          {!online ? (
            <span className="text-label font-normal text-muted dark:text-muted-dark">
              인터넷 연결 후 실행할 수 있어요.
            </span>
          ) : status === 'idle' ? (
            <span className="text-label font-normal text-muted dark:text-muted-dark">
              처음 실행은 SQL 환경을 내려받느라 시간이 걸려요(10초 이상 걸릴 수 있어요).
            </span>
          ) : null}
```

`src/components/bookmark-button.tsx`에서

```tsx
import { addBookmarkAction, removeBookmarkAction } from "@/app/lesson/[lessonId]/bookmark-actions";
```

아래에 추가:

```tsx
import { useOnline } from "@/lib/offline/connectivity";
```

같은 파일에서

```tsx
  const [pending, setPending] = useState(false);
```

바로 아래에 추가:

```tsx
  // 북마크는 서버에만 저장한다. 오프라인이면 잠그고 안내한다(오프라인 모드 설계 3.7).
  const online = useOnline();
```

같은 파일의 버튼 속성

```tsx
        disabled={pending}
        aria-pressed={isCurrentBookmarked}
        aria-label={isCurrentBookmarked ? "이 위치 북마크 해제" : "이 위치 북마크"}
        title={isCurrentBookmarked ? "이 위치 북마크 해제" : "이 위치 북마크"}
```

를 다음으로 바꾼다.

```tsx
        disabled={pending || !online}
        aria-pressed={isCurrentBookmarked}
        aria-label={
          !online
            ? "인터넷 연결 후 북마크할 수 있어요"
            : isCurrentBookmarked
              ? "이 위치 북마크 해제"
              : "이 위치 북마크"
        }
        title={
          !online
            ? "인터넷 연결 후 북마크할 수 있어요"
            : isCurrentBookmarked
              ? "이 위치 북마크 해제"
              : "이 위치 북마크"
        }
```

`src/components/lesson-needs-review.tsx`에서

```tsx
import { setLessonNeedsReviewAction } from '@/app/lesson/[lessonId]/needs-review-actions';
```

아래에 추가:

```tsx
import { useOnline } from '@/lib/offline/connectivity';
```

같은 파일에서

```tsx
  const [error, setError] = useState<string | null>(null);
```

바로 아래에 추가:

```tsx
  // 다시 보기 표시는 오프라인 대기열 대상이 아니다. 오프라인이면 잠근다(설계 3.7).
  const online = useOnline();
```

같은 파일에서

```tsx
        onClick={handleToggle}
        disabled={isPending}
        aria-busy={isPending}
        aria-pressed={shown}
```

를 다음으로 바꾼다.

```tsx
        onClick={handleToggle}
        disabled={isPending || !online}
        aria-busy={isPending}
        aria-pressed={shown}
```

같은 파일에서

```tsx
      {shown ? (
        <p className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
```

를 다음으로 바꾼다.

```tsx
      {!online ? (
        <p className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
          인터넷 연결 후 표시할 수 있어요.
        </p>
      ) : null}
      {shown ? (
        <p className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
```

`src/components/lesson-til.tsx`에서

```tsx
import { saveLessonTilAction } from '@/app/lesson/[lessonId]/til-actions';
```

아래에 추가:

```tsx
import { useOnline } from '@/lib/offline/connectivity';
```

같은 파일에서

```tsx
  const [status, setStatus] = useState<SaveStatus>('idle');
```

바로 아래에 추가:

```tsx
  // TIL은 오프라인 대기열 대상이 아니다. 오프라인이면 저장 버튼을 잠근다(설계 3.7).
  const online = useOnline();
```

같은 파일에서

```tsx
          onClick={() => void handleSave()}
          disabled={status === 'saving'}
```

를 다음으로 바꾼다.

```tsx
          onClick={() => void handleSave()}
          disabled={status === 'saving' || !online}
```

같은 파일에서

```tsx
          {status === 'saved' ? '저장됨' : ''}
```

를 다음으로 바꾼다.

```tsx
          {!online ? '인터넷 연결 후 저장할 수 있어요.' : ''}
          {status === 'saved' ? '저장됨' : ''}
```

- [ ] **Step 6: 정적 검사와 게이트 통과 확인**

```bash
npx next typegen && npx tsc --noEmit -p .
npm run lint 2>&1 | tail -15
node scripts/check-design-tokens.mjs 2>&1 | tail -6
node scripts/check-design-tokens.mjs --only src/components/offline/on-air-lamp.tsx src/components/site-nav.tsx src/components/run-python.tsx src/components/run-sql.tsx src/components/bookmark-button.tsx src/components/lesson-needs-review.tsx src/components/lesson-til.tsx
npm run build 2>&1 | tail -3
E2E_TESTER_EMAIL='<테스터 이메일>' E2E_TESTER_PASSWORD='<테스터 비밀번호>' node --env-file=.env.local scripts/e2e-offline.mjs
```

Expected: tsc 출력 없음; lint 새 오류 없음; 전체 토큰 검사는 기존 `til-streak.tsx` 3건만(globals.css 새 위반 없음); `--only` 검사 위반 0; 게이트 `A1, A2, B0, B, C1~C4, D1~D3, E1, E2, F1~F6, G-375x667, G-768x1024, G-1024x768, H` 전부 OK, `검사한 23건 전부 통과`, 복원 완료.

- [ ] **Step 7: 화면 확인(자기 검토)**

게이트의 G 시나리오가 헤더 높이와 터치 타깃을 숫자로 확인한다. 그 밖의 어색한 디테일은 헤드리스 스크린샷으로 직접 본다(내장 브라우저 창이 가려져 있으면 캡처가 멈추므로 Playwright 헤드리스가 확실하다). 게이트 F 시나리오 직후 상태를 한 번 찍어 보는 일회용 스크립트를 스크래치패드에 만들어 768x1024, 라이트와 다크(`colorScheme`)에서 확인한다.
- 램프가 헤더 오른쪽, 햄버거 왼쪽에 있고 로고, 햄버거, 테마 버튼과 세로 가운데가 맞는다
- 온라인 초록 불빛, 오프라인 빨강 깜빡임, 배지 숫자가 램프를 가리지 않는다
- 다크 모드에서 램프 색이 `-dark` 토큰으로 바뀐다
- 독서 도우미, 맨 위로 버튼, 북마크 버튼(모두 화면 아래쪽 고정)과 겹치지 않는다(램프는 헤더 안에만 있다)

- [ ] **Step 8: Commit**

```bash
git add src/components/offline/on-air-lamp.tsx src/app/globals.css src/components/site-nav.tsx src/components/run-python.tsx src/components/run-sql.tsx src/components/bookmark-button.tsx src/components/lesson-needs-review.tsx src/components/lesson-til.tsx scripts/e2e-offline.mjs
git commit -m "feat(offline): 헤더 ON AIR 램프와 대기 개수 배지, 오프라인이면 실행기와 온라인 전용 기능 잠금

Co-Authored-By: (세션이 안내한 attribution 줄)"
```

---

### Task 7: 전체 검증, 병합, 배포, 아이패드 확인 안내

**Files:** 없음(검증과 병합만)

- [ ] **Step 1: 정적 게이트 일괄**

```bash
node scripts/check-offline-logic.mjs
node scripts/check-design-tokens.mjs 2>&1 | tail -6
node scripts/check-progress-gates.mjs 2>&1 | tail -6
node scripts/check-brand.mjs 2>&1 | grep -E "offline|sw\.js|on-air|sign-out|e2e-offline|api.auth|site-nav|globals" ; echo "brand-new-violations-exit=$?"
node scripts/check-font-glyph-coverage.mjs 2>&1 | tail -4
npx next typegen && npx tsc --noEmit -p .
npm run lint 2>&1 | tail -15
```

Expected: 순수 로직 23건 통과; 토큰은 기존 `til-streak.tsx` 3건만; 진도 게이트는 기존 3건만; brand 필터 결과 없음(`brand-new-violations-exit=1`, grep이 아무 줄도 못 찾음); 글리프는 Global Constraints의 21자 외 새 누락 없음; tsc 출력 없음; lint 기존 4건 외 새 오류 없음.

새 누락 글리프가 나오면 `node scripts/subset-font.mjs`로 서브셋을 다시 만들고 `public/fonts/*.subset.woff2`를 함께 커밋한다.

- [ ] **Step 2: 빌드, 라우트 계약, 오프라인 게이트**

```bash
npm run build 2>&1 | tail -40
node scripts/check-route-rendering.mjs
E2E_TESTER_EMAIL='<테스터 이메일>' E2E_TESTER_PASSWORD='<테스터 비밀번호>' node --env-file=.env.local scripts/e2e-offline.mjs
```

Expected: 빌드 성공(`/offline` ○, `/offline-manifest.json` ○); 라우트 계약 통과(레슨, 스텝, 커리큘럼 정적 유지); 오프라인 게이트 23건 전부 통과, 복원 완료.

- [ ] **Step 3: 병합과 push**

```bash
git status --short
git checkout master
git pull --ff-only
git merge --no-ff feat/offline-mode -m "Merge branch 'feat/offline-mode': 오프라인 모드(서비스 워커, 기기 대기열 동기화, ON AIR 램프)

Co-Authored-By: (세션이 안내한 attribution 줄)"
git push origin master
```

Expected: `git status --short`에는 기존 추적 안 된 `.claude/launch.json`, `output/`만; 병합 충돌 없음; push 성공.

- [ ] **Step 4: Vercel 배포 확인**

push 후 1~3분 기다린 뒤:

```bash
gh api repos/dhchun1203/ai-engineer-runway/commits/$(git rev-parse HEAD)/status --jq '.statuses[] | "\(.context) \(.state)"'
```

Expected: `Vercel success`. 목록이 비어 있으면 체크 런으로 확인한다.

```bash
gh api repos/dhchun1203/ai-engineer-runway/commits/$(git rev-parse HEAD)/check-runs --jq '.check_runs[] | "\(.name) \(.status) \(.conclusion)"'
```

Expected: Vercel 항목이 `completed success`. 이어서 배포 사이트 헤더:

```bash
curl -s -D - -o /dev/null "https://ai-engineer-hub-kr.vercel.app/sw.js?v=check" | grep -iE "^HTTP|cache-control|content-type|service-worker-allowed"
```

Expected: `HTTP/2 200`, `cache-control: no-cache, no-store, must-revalidate`, `content-type: application/javascript; charset=utf-8`, `service-worker-allowed: /`.

- [ ] **Step 5: 사용자에게 아이패드 확인 안내 전달**

아래 단계를 그대로 사용자에게 보낸다(사용자가 직접 확인한다).

1. 아이패드 Safari에서 `https://ai-engineer-hub-kr.vercel.app`에 로그인한다.
2. 홈 화면 앱이 없으면 공유 버튼, 홈 화면에 추가로 설치한다. 이후는 모두 홈 화면 아이콘으로 연 앱에서 한다(Safari 탭은 저장본이 쉽게 지워진다).
3. 앱 헤더 오른쪽에 초록 불빛과 "ON AIR"가 천천히 숨 쉬는지 본다.
4. 더보기, 오프라인 저장, "전체 받기"를 누른다. "페이지, 화면 파일, 내 진도와 메모" 순서로 숫자가 오르고 "다 받았어요"가 나오면 "저장된 페이지 n/N"을 확인한다.
5. 커리큘럼에서 레슨 하나를 연다.
6. 제어 센터에서 비행기 모드를 켜고 Wi-Fi도 끈다. 램프가 빨간 "OFF AIR"로 깜빡이는지 본다.
7. 레슨 아래 "다음" 버튼을 눌러 다음 레슨이 열리는지, 로고(홈)를 눌러 "오프라인 저장" 목차 화면이 뜨는지 본다.
8. 레슨에서 "레슨 완료하기"를 누르고, 메모를 열어 한 줄 쓴다. "기기에 저장했어요" 문구와 램프 위 숫자 2가 보이는지 본다.
9. 앱 전환기에서 앱을 위로 밀어 완전히 닫고, 비행기 모드 그대로 홈 화면 아이콘으로 다시 연다. 오프라인 목차가 뜨고, 목차에서 방금 레슨을 누르면 완료 표시와 메모가 남아 있는지 본다.
10. 비행기 모드를 끄고 Wi-Fi를 켠다. 10초쯤 안에 램프가 초록 "ON AIR"로 바뀌고 숫자가 사라지는지, 레슨을 새로고침해도 완료와 메모가 그대로인지 본다.
11. 새 버전이 배포되면 저장본이 비워진다. 비행 전에는 오프라인 저장 화면에서 "저장된 페이지" 숫자를 보고, 적으면 다시 "전체 받기"를 누른다.

- [ ] **Step 6: 기록**

메모리에 `offline-mode-feature.md`(요약: 직접 쓴 서비스 워커, 캐시 `offline-<빌드 id>`와 새 배포 시 비워짐, IndexedDB `offline-db` 대기열 동기화, ON AIR 램프, 게이트 `scripts/e2e-offline.mjs`는 빌드 후 테스터 계정 환경 변수로 실행)를 만들고 `MEMORY.md` 목록에 한 줄 추가한다.
