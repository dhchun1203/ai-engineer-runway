# Phase 8: 성능·인터랙션·스마트폰 최적화 - Pattern Map

**Mapped:** 2026-08-27
**Files analyzed:** 12 (신규 6 + 수정 6)
**Analogs found:** 11 / 12 (신규 Route Handler는 프로젝트 내 첫 사례 — 가장 가까운 서버 데이터 접근 모듈로 대체 매핑)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `scripts/e2e-perf-budget.mjs` (신규) | test (e2e gate script) | batch/measurement | `scripts/e2e-mobile-overflow.mjs` | role-match (서버 부트스트랩 방식이 dev→build+start로 달라짐) |
| `scripts/check-progress-gates.mjs` G9 (수정) | config/gate | batch (static analysis) | 같은 파일의 G4 로직(`scripts/check-progress-gates.mjs:131-155`) | exact (문자열 존재/순서 검사 기법 재사용) |
| `scripts/subset-font.mjs` (신규) | utility (build-prep script) | file-I/O + transform | `scripts/e2e-mobile-overflow.mjs`의 `.velite/lessons.json` 독립 재파싱 관례 (라인 84-95) | role-match (파일 직접 스캔 원칙만 공유, 실행 형태는 다름) |
| 신규 폰트 커버리지 정적 게이트 (파일명 미정, 예: `scripts/check-font-glyph-coverage.mjs`) | test (static gate) | file-I/O + transform | `scripts/check-manifest.mjs` | role-match (독립 실측값 비교 + exit code 관례) |
| `src/app/api/progress/route.ts` (신규) | route (Route Handler, GET) | request-response | `src/app/unlock/route.ts` | role-match (같은 `NextResponse`/쿠키 규율, GET vs 인증 방식은 다름) — 데이터 조합 자체는 `src/app/page.tsx`의 `hasUnlockCookie()`→`readCompletedLessonIds()` 순서를 그대로 옮긴 것 |
| `src/app/page.tsx` (수정 — force-dynamic 제거, revalidate=3600 추가, 쿠키 호출 제거) | route (page, Server Component) | request-response → ISR | `src/app/about/page.tsx` (목표 정적 셸의 형태) | exact (정적 셸 형태 기준) — 현재 코드 자체가 "쿠키 읽는 동적 라우트"의 분석 대상 |
| `src/app/curriculum/page.tsx` (수정, 동일 패턴) | route (page) | request-response → ISR | `src/app/page.tsx` (같은 phase 내 자매 라우트, 동일 리팩터링) | exact |
| `src/app/schedule/page.tsx` (수정, 동일 패턴) | route (page) | request-response → ISR | `src/app/page.tsx` | exact |
| `src/app/lesson/[lessonId]/page.tsx` (수정 — force-dynamic 제거, 완전 정적) | route (page, dynamic segment) | request-response → static | `src/app/about/page.tsx` (목표 형태) + `src/app/step/[stepId]/page.tsx` (같은 리팩터링 대상, 자매 파일) | exact |
| `src/app/step/[stepId]/page.tsx` (수정, 동일 패턴) | route (page, dynamic segment) | request-response → static | `src/app/lesson/[lessonId]/page.tsx` | exact |
| `src/components/progress-island.tsx` (신규 'use client') | component (client, data-fetching) | request-response (fetch) | `src/components/complete-button.tsx` | role-match (클라이언트 아일랜드 관례는 같음, `complete-button.tsx`는 fetch가 아니라 Server Action 호출이라 fetch 배선 자체는 신규) |
| `src/components/skeleton-*.tsx` (신규) | component (presentational) | transform (레이아웃 자리표시) | `src/components/progress-error.tsx`(`ProgressReadError`, 에러 상태 관례) | role-match — 로딩 스켈레톤 자체의 analog 없음(신규 패턴), 에러 상태 관례만 참고 |
| `src/components/section-tape.tsx` (수정 — 스크롤 리스너 스로틀) | component (client, scroll-driven) | event-driven | 없음 — 이 저장소에 IntersectionObserver/CSS-only sticky 기반 스크롤 컴포넌트가 없다 | no analog — new pattern (rAF 스로틀 자체 추가) |
| 버튼/카드 `:active` 눌림 피드백 (여러 기존 컴포넌트 수정) | component (presentational, class 추가) | transform | `src/components/complete-button.tsx`(버튼 클래스 구성 관례), `src/app/about/page.tsx:37`(링크 버튼 클래스 구성) | exact (클래스 조합 컨벤션) |

## Pattern Assignments

### `scripts/e2e-perf-budget.mjs` (test, batch/measurement)

**Analog:** `scripts/e2e-mobile-overflow.mjs`

**서버 부트스트랩 패턴 — 그대로 복제할 부분** (`scripts/e2e-mobile-overflow.mjs:239-261`):
```js
const nextBin = path.join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next');
const child = spawn(process.execPath, [nextBin, 'dev', '--port', String(PORT), '--hostname', HOST], {
  cwd: ROOT,
  stdio: ['ignore', 'pipe', 'pipe'],
  env: process.env,
});
...
await waitForServerReady();
```

**여기서 반드시 갈라져야 하는 지점(Wave 0 요구사항):** 위 코드는 `next dev`를 spawn한다. `08-VALIDATION.md`("`next dev`가 아니라 `next build && next start`를 부트스트랩해야 한다")와 `08-RESEARCH.md` Wave 0 항목이 명시적으로 금지하는 패턴이다. 새 스크립트는 두 단계로 나눠야 한다:
1. `execSync('next build', { cwd: ROOT, stdio: 'inherit' })` (또는 `spawn` + 완료 대기) — 실패 시 즉시 `FatalError`
2. 그다음에만 `spawn(process.execPath, [nextBin, 'start', '--port', ...])`로 프로덕션 서버 기동, `waitForServerReady()`는 그대로 재사용 가능

**환경변수 필수 검증 패턴 — 그대로 복제** (`scripts/e2e-mobile-overflow.mjs:56-75`): `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`/`UNLOCK_SECRET` 부재 시 `process.exit(1)`. 새 게이트도 동일한 3개 env var가 필요하다(빌드 서버가 `admin.ts`를 통해 요구).

**서버 종료 패턴 — 그대로 복제** (`scripts/e2e-mobile-overflow.mjs:154-169`): `killServerTree()` — Windows에서 `taskkill /pid ${child.pid} /T /F`, 그 외 `child.kill('SIGKILL')`. `next start`는 자식 프로세스를 spawn할 수 있어 트리 킬이 `next dev`보다 더 중요해질 수 있다.

**포트 충돌 회피 관례** (`scripts/e2e-mobile-overflow.mjs:46-50`): 기존 6개 게이트가 이미 서로 다른 포트(`E2E_OVERFLOW_PORT` 등 개별 env override)를 쓴다. 새 스크립트도 3213과 겹치지 않는 전용 포트(예: 3214)를 기본값으로 잡아야 병렬/연속 실행 시 충돌하지 않는다.

**결과 집계/실패 판정 패턴 — 그대로 복제** (`scripts/e2e-mobile-overflow.mjs:264-360`): 라우트×조건 조합을 순회하며 `results` 배열에 `{ pass, reasons }`를 쌓고, 실패 0건 방어(`results.length === 0`이면 `FatalError`), 실패 목록을 정렬해 사람이 읽을 수 있게 출력한 뒤 `FatalError`로 종료.

**TTFB/60fps 측정 로직**은 `08-RESEARCH.md` "Code Examples" 절에 이미 구체 코드가 있다(Navigation Timing API, rAF 프레임 델타 수집) — 이 패턴맵이 아니라 그 절을 그대로 이식한다.

---

### `scripts/check-progress-gates.mjs` — G9 갱신 (test/config, static)

**Analog:** 같은 파일의 G4 로직 (`scripts/check-progress-gates.mjs:131-155`)

**현재 G9 (제거/교체 대상)** (`scripts/check-progress-gates.mjs:245-265`):
```js
const DYNAMIC_GATED_PAGES = [
  path.join(ROOT, 'src', 'app', 'lesson', '[lessonId]', 'page.tsx'),
  path.join(ROOT, 'src', 'app', 'step', '[stepId]', 'page.tsx'),
  path.join(ROOT, 'src', 'app', 'page.tsx'),
  path.join(ROOT, 'src', 'app', 'curriculum', 'page.tsx'),
  path.join(ROOT, 'src', 'app', 'schedule', 'page.tsx'),
];
for (const pagePath of DYNAMIC_GATED_PAGES) {
  const source = readFileIfExists(pagePath);
  if (source === null) { fail(...); continue; }
  if (!/export\s+const\s+dynamic\s*=\s*["']force-dynamic["']/.test(source)) {
    fail(`G9 failed: ... missing "export const dynamic = 'force-dynamic'"`);
  }
}
```

**갱신 방향 (RESEARCH Pitfall 1이 권고한 대로)**: 같은 5개 파일 목록은 유지하되 단언을 뒤집는다 — `force-dynamic` 부재를 요구하고, `cookies()`/`hasUnlockCookie` 직접 호출도 없음을 검사한다. 추가로 새 `/api/progress/route.ts`가 존재하고 `hasUnlockCookie()` 문자 위치가 `readCompletedLessonIds()`보다 앞선다는 순서 계약을 G4와 같은 인덱스 비교 기법으로 검사한다:

```js
// G4의 순서 검사 기법 그대로 재사용 (scripts/check-progress-gates.mjs:143-153)
const hasUnlockIdx = source.indexOf('hasUnlockCookie');
const readCompletedIdx = source.indexOf('readCompletedLessonIds');
if (hasUnlockIdx === -1 || readCompletedIdx === -1 || hasUnlockIdx >= readCompletedIdx) {
  fail(`G9 failed: hasUnlockCookie must be called before readCompletedLessonIds in .../api/progress/route.ts`);
}
```

---

### `src/app/api/progress/route.ts` (route, request-response) — 신규, 저장소 내 첫 Route Handler

**분석:** `app/api/**/route.ts` 패턴은 이 저장소에 하나도 없다(Glob 결과 0건). 가장 가까운 두 analog를 조합해야 한다:
1. **Route Handler 형태 자체**: `src/app/unlock/route.ts` (전체, 34줄) — `NextResponse` 사용법, `export async function GET(request: Request)` 시그니처, 쿠키를 응답/로그에 남기지 않는 규율.
2. **쿠키→진도 조회 순서 자체**: `src/app/page.tsx:24-28`의 게이트 순서.

**Auth/게이트 패턴** (`src/app/unlock/route.ts:14-17`, 조합 대상):
```ts
export async function GET(request: Request) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key') ?? undefined;
  const valid = isValidUnlockValue(key, process.env.UNLOCK_SECRET);
  ...
}
```
새 핸들러는 쿼리 파라미터 검증 대신 `hasUnlockCookie()`를 무조건 먼저 호출한다(`src/app/page.tsx:25`, `src/app/lesson/[lessonId]/page.tsx:42`와 동일한 "무조건, 어떤 조회보다도 먼저" 원칙 — 주석 그대로 복제할 가치가 있다).

**핵심 조합 로직 — `src/app/page.tsx:25-28`에서 그대로 옮겨오는 부분**:
```ts
const unlocked = await hasUnlockCookie();
const progressRead = unlocked ? await readCompletedLessonIds() : null;
const completedIds = progressRead?.ok ? progressRead.completedIds : null;
```

**에러 응답 형태**: `progressRead.ok === false`일 때 기존 페이지들은 `<ProgressReadError />`(`src/components/progress-error.tsx`)를 렌더한다. Route Handler는 렌더할 수 없으므로 이 상태를 JSON 필드로 변환해야 한다 — `08-RESEARCH.md` Pattern 1의 `{ unlocked: true, completedIds: null, error: read.error }, { status: 502 }` 형태를 그대로 채택.

**보안 규율 재사용** (`src/app/unlock/route.ts:6`): "응답·로그 어디에도 key 값이나 시크릿을 남기지 않는다" — 새 핸들러에도 동일 주석을 남기고, 쿠키 원문 값을 절대 JSON에 포함하지 않는다(불리언 `unlocked`만 노출).

---

### `src/app/page.tsx` / `curriculum/page.tsx` / `schedule/page.tsx` (route, ISR 전환)

**현재 코드(수정 대상)** — `src/app/page.tsx:17-32`:
```ts
export const dynamic = "force-dynamic";

export default async function Home() {
  const unlocked = await hasUnlockCookie();
  const progressRead = unlocked ? await readCompletedLessonIds() : null;
  const completedIds = progressRead?.ok ? progressRead.completedIds : null;
  const today = todayInSeoul();
  ...
}
```

**목표 형태 analog** — `src/app/about/page.tsx:1-19` (완전 정적, `export const metadata`만 있고 `dynamic`/쿠키 호출 없음):
```tsx
export const metadata: Metadata = { title: "소개" };
export default function AboutPage() {
  const page = pages.find((p) => p.slug === "making-of");
  return ( ... );
}
```

**적용 방향**: `hasUnlockCookie()`/`readCompletedLessonIds()` 호출과 `progressRead`/`completedIds` 계산을 페이지에서 완전히 제거하고 `<ProgressIsland />`로 대체한다. `todayInSeoul()`, `getScheduleRows()`, `rowsForDate()` 등 날짜 의존 계산은 그대로 유지한다(`src/app/page.tsx:32-37` — 이 부분은 손대지 않음). 파일 상단에 `export const revalidate = 3600;`(리터럴, 계산식 금지 — RESEARCH Anti-Patterns) 추가.

**주의**: `curriculum/page.tsx:26`, `schedule/page.tsx:26`도 각각 `todayInSeoul()`을 호출한다(RESEARCH VERIFIED 인용) — 세 파일 모두 같은 패턴으로 일괄 수정.

---

### `src/app/lesson/[lessonId]/page.tsx` / `step/[stepId]/page.tsx` (route, 완전 정적 전환)

**현재 코드** — `src/app/lesson/[lessonId]/page.tsx:24-53`: `export const dynamic = "force-dynamic";` 선언, `hasUnlockCookie()`(42행, notFound()보다 먼저), `readCompletedLessonIds()`(49행), `readLessonNote()`(52행) 세 개의 쿠키 의존 조회가 페이지 컴포넌트 본문에 있다.

**적용 방향**: `dynamic = "force-dynamic"` 제거, `generateStaticParams()`(30-32행)는 그대로 유지, 세 쿠키 의존 조회(`unlocked`/`progressRead`/`noteRead`)를 전부 제거하고 `<ProgressIsland lessonId={lesson.slug} />` + (메모장도 진도와 같은 이유로 쿠키 의존이라면) 별도 클라이언트 아일랜드로 옮긴다. `LessonNotepad`(`src/components/lesson-notepad.tsx`)가 이미 `'use client'`인지 확인 필요 — 이번 phase 범위상 `noteRead`도 같은 이유로 정적 셸에서 제거해야 하는지는 계획 단계에서 명시적으로 결정할 사안(RESEARCH가 `/api/progress` 하나만 언급했으므로, 메모 읽기를 같은 엔드포인트에 합칠지 별도로 뺄지는 미확정 — Open Question으로 남김).

**목표 형태 analog**: `src/app/about/page.tsx` (완전 정적) — 단, about 페이지는 동적 세그먼트가 없으므로 `generateStaticParams()` 형태는 대신 현재 `lesson/page.tsx:30-32` 자체를 그대로 유지.

---

### `src/components/progress-island.tsx` (신규 client component, fetch 기반)

**Analog:** `src/components/complete-button.tsx` (전체, 84줄) — 클라이언트 아일랜드의 상태 관리 관례(마운트 후 서버 상태를 신뢰, prop 수렴).

**가져올 관례** — `data-*` 속성으로 테스트 훅 제공 (`src/components/complete-button.tsx:44-45`):
```tsx
<div data-progress-ui="complete-button" data-complete-state={optimisticDone ? 'done' : 'todo'} ...>
```
`ProgressIsland`도 동일하게 `data-progress-island` 같은 훅을 노출해야 e2e 게이트가 DOM에서 로딩/에러/완료 상태를 식별할 수 있다(SC5의 "DOM 클래스 검사" 요구와 직결).

**에러 상태 analog**: `src/components/progress-error.tsx`(`ProgressReadError`) — 기존 페이지들이 `progressRead.ok === false`일 때 렌더하던 컴포넌트. `ProgressIsland`의 fetch 실패 시에도 같은 컴포넌트를 재사용할 수 있는지 확인 후, 재사용 가능하면 새 컴포넌트를 만들지 말 것(Don't Hand-Roll 원칙).

**fetch 배선 자체는 신규 패턴** — 이 저장소에 클라이언트 컴포넌트가 `fetch('/api/...')`를 부르는 기존 사례가 없다(전부 Server Action 경유). `useEffect` + `AbortController` 조합을 새로 도입해야 하며, `complete-button.tsx`가 쓰는 `useOptimistic`/`useTransition`은 fetch-on-mount 시나리오에는 맞지 않는다(그 훅들은 사용자 액션 트랜지션용) — 대신 `useState` 3종(`{ status: 'loading' | 'ready' | 'error', data }`) 패턴을 쓰는 것이 이 컴포넌트의 실제 필요에 맞다.

---

### 스켈레톤 컴포넌트 (신규, no analog — RESEARCH 코드 예시 채택)

이 저장소에 로딩 스켈레톤 컴포넌트가 없다. `08-RESEARCH.md` Pattern 4의 코드를 그대로 채택:
```tsx
function CompleteButtonSkeleton() {
  return (
    <div
      className="flex min-h-11 items-center justify-center rounded-lg border border-badge-neutral-bg dark:border-badge-neutral-bg-dark animate-pulse bg-badge-neutral-bg/50 dark:bg-badge-neutral-bg-dark/50"
      aria-hidden="true"
    />
  );
}
```
**높이 일치 규율**: `complete-button.tsx:54`의 실제 버튼이 `min-h-11`을 쓰므로 스켈레톤도 정확히 같은 클래스를 공유해야 CLS가 0이다(RESEARCH가 명시).

**reduced-motion 끄기 — globals.css 기존 관례 재사용** (`src/app/globals.css:198-202`, `.note-sheet-panel`과 `src/app/globals.css:554-559`, `.complete-check-icon`/`.complete-ring-glow::after`):
```css
@media (prefers-reduced-motion: reduce) {
  .note-sheet-panel { transition: none; }
}
@media (prefers-reduced-motion: reduce) {
  .complete-check-icon, .complete-ring-glow::after { animation: none; }
}
```
새 스켈레톤 펄스도 같은 형태로 `animation: none`(`animate-pulse`는 Tailwind 유틸리티 클래스라 직접 끌 수 없으므로, 커스텀 클래스 `.skeleton-pulse { animation: pulse ...; }`를 globals.css에 정의하고 같은 미디어 쿼리로 끄는 방식을 취해야 함 — `animate-pulse`를 조건부로 토글하는 것보다 이 방식이 기존 관례와 정합적).

---

### `:active` 눌림 피드백 — 임의값 대괄호 없이 (여러 기존 컴포넌트)

**Analog(클래스 조합 관례):** `src/components/complete-button.tsx:54-58`, `src/app/about/page.tsx:37`

**게이트 제약 — 반드시 준수**: `scripts/check-design-tokens.mjs:228-247`(`findArbitraryValueTokens`)가 `/[A-Za-z][A-Za-z0-9:_/-]*-\[/g` 정규식으로 **모든** `word-[...]` 형태를 위반으로 잡는다. `translate-y-[1px]`/`scale-[0.98]`(스킬 원문 예시)는 이 게이트에서 즉시 실패한다.

**대안(RESEARCH Pattern 3, 그대로 채택)**:
```tsx
className="... active:translate-y-px active:scale-95 transition-transform duration-100"
```
`translate-y-px`(정확히 1px, named step)와 `scale-95`(0.95)는 임의값 대괄호가 아니므로 게이트를 통과한다.

**만약 정확히 `scale-[0.98]`이 필요하면 — 기존 allowlist 관례 재사용** (`scripts/check-design-tokens.mjs:64-67`):
```js
const ARBITRARY_ALLOWLIST_TOKENS = new Map([
  ['src/app/about/page.tsx', new Set(["before:top-[0.4em]", "before:content-['']"])],
]);
```
파일 경로 + 정확한 토큰 문자열로 좁게 등록하는 기존 관례를 그대로 따를 것 — 와일드카드로 열지 말 것.

---

### `src/components/section-tape.tsx` (수정 — 스크롤 리스너 스로틀)

**현재 코드(안티패턴)** — `src/components/section-tape.tsx:148-149`:
```tsx
const handleScroll = () => updateCurrent();
window.addEventListener("scroll", handleScroll, { passive: true });
```
`updateCurrent()`(112-134행)는 모든 `<h2>`에 `getBoundingClientRect()`를 호출하고(130행) `setCurrentIndex(idx)`(134행)를 매 스크롤 프레임마다 호출한다 — design-taste-frontend 5.D가 명시적으로 금지하는 패턴.

**analog 없음**: 이 저장소에 IntersectionObserver나 CSS-only sticky 기반 스크롤 추적 컴포넌트가 없다(grep 결과 section-tape.tsx가 유일한 스크롤 리스너 사용처). RESEARCH가 권고한 최소 변경(재작성 아님)을 그대로 적용:
```tsx
// 신규 패턴 — 이 저장소 최초의 rAF 스로틀 스크롤 핸들러
let rafId: number | null = null;
const handleScroll = () => {
  if (rafId !== null) return;
  rafId = requestAnimationFrame(() => {
    rafId = null;
    updateCurrent();
  });
};
```
그리고 `updateCurrent()` 내부에서 `idx`가 실제로 바뀔 때만 `setCurrentIndex(idx)`를 호출하도록 가드 추가(현재 134행은 무조건 호출). `scroll-margin-top` 임계값 정밀 계산 로직(116-126행)은 건드리지 않는다(G-06-9 재발 방지 조항, RESEARCH가 명시).

---

### 폰트 로딩 (`src/lib/fonts.ts`, 수정 대상)

**현재 전체 코드** (`src/lib/fonts.ts:1-8`):
```ts
import localFont from "next/font/local";

export const pretendard = localFont({
  src: "../../public/fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  weight: "45 920",
  display: "swap",
});
```
`next/font/local`(단일 파일 로컬 폰트)이지 `@font-face` 수동 선언이 아니다. `subset-font.mjs`가 서브셋 파일(`PretendardVariable.subset.woff2`)을 생성한 뒤에는 `src` 경로만 교체하면 된다 — `localFont()` 호출 구조 자체는 변경 없음. `weight`/`variable`/`display` 옵션도 서브셋 여부와 무관하므로 그대로 유지.

---

## Shared Patterns

### 쿠키 게이트 순서 계약 (V4 Access Control)
**Source:** `src/app/page.tsx:24-28`, `src/app/lesson/[lessonId]/page.tsx:40-42`, `src/app/unlock/route.ts` 전체
**Apply to:** `src/app/api/progress/route.ts`
```ts
// 무조건, 그리고 어떤 조회보다도 먼저 호출한다
const unlocked = await hasUnlockCookie();
```
새 Route Handler도 이 "무조건 먼저" 원칙과 G4가 이미 강제하는 "문자 위치 순서 검사" 기법을 그대로 따라야 하며, 갱신된 G9이 이를 검사한다.

### `prefers-reduced-motion` 끄기
**Source:** `src/app/globals.css:198-202`, `554-559`
**Apply to:** 스켈레톤 펄스, `.step-card-reveal` 순차 등장, `:active` 트랜지션(트랜지션은 짧아 보통 예외 처리되나 명시가 안전)
```css
@media (prefers-reduced-motion: reduce) {
  .some-new-class { animation: none; }
}
```

### 정적 게이트 exit-code 규율
**Source:** `scripts/check-manifest.mjs`, `scripts/check-progress-gates.mjs`의 `fail()` 헬퍼 패턴
**Apply to:** 신규 폰트 글리프 커버리지 게이트 — 실측값을 코드 상수/파일에서 독립적으로 재계산하고 다르면 비어 있지 않은 오류 메시지와 함께 exit code != 0.

### 독립 재파싱(앱 코드 import 금지) 원칙
**Source:** `scripts/e2e-mobile-overflow.mjs:84-95`(`.velite/lessons.json` 독립 재파싱 주석 — "같은 함수를 재사용하면 계산이 틀려도 검증이 같이 틀린다")
**Apply to:** `scripts/subset-font.mjs`(레슨 MDX 전수 스캔은 이 원칙에 이미 부합 — RESEARCH가 명시), 신규 폰트 글리프 커버리지 게이트도 같은 원칙으로 앱 코드 대신 소스 파일을 직접 스캔.

### `data-*` 테스트 훅 노출 관례
**Source:** `src/components/complete-button.tsx:44-45`(`data-progress-ui`, `data-complete-state`), `src/app/lesson/[lessonId]/page.tsx:89`(`data-progress-controls`), `108`(`data-locked-notice`)
**Apply to:** `ProgressIsland`, 스켈레톤, 에러 상태 — SC5의 "DOM 클래스 검사" 자동 게이트가 이 훅에 의존하게 될 것.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/app/api/progress/route.ts` | route (Route Handler) | request-response | 저장소에 `app/api/**/route.ts`가 하나도 없다(Glob 0건) — `src/app/unlock/route.ts`(다른 목적, GET+리다이렉트)와 페이지 내 조회 순서(`src/app/page.tsx`)를 조합해야 함 |
| `scripts/e2e-perf-budget.mjs`의 `next build && next start` 부트스트랩 부분 | test (e2e gate) | batch | 기존 6개 e2e 게이트는 전부 `next dev`를 spawn한다 — 프로덕션 빌드 기반 부트스트랩은 이 phase가 최초 |
| `src/components/skeleton-*.tsx` | component | transform | 로딩 스켈레톤 컴포넌트가 이 저장소에 없다 — RESEARCH Pattern 4 코드를 그대로 이식 |
| `src/components/section-tape.tsx`의 rAF 스로틀 | component (client) | event-driven | IntersectionObserver/CSS-only sticky 기반 스크롤 컴포넌트가 없어 참고할 "잘 만든" 기존 코드가 없다 — 최소 변경(스로틀 추가)만 적용 |

## Metadata

**Analog search scope:** `src/app/**/page.tsx`, `src/app/**/route.ts`, `src/components/**/*.tsx`, `src/lib/**/*.ts`, `scripts/*.mjs`
**Files scanned:** 약 20개(직접 Read) + Glob 결과 다수
**Pattern extraction date:** 2026-08-27
