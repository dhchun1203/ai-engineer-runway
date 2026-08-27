# Phase 3: 학습 일정과 오늘의 학습 - Pattern Map

**Mapped:** 2026-08-24
**Files analyzed:** 13 (3 lib + 1 script family + 3 app routes + 5 components + 1 nav edit)
**Analogs found:** 13 / 13

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|-----------------|---------------|
| `src/lib/today.ts` | utility | transform | `src/lib/progress-math.ts` | exact (dependency-0 pure module convention) |
| `src/lib/schedule.ts` | utility | transform | `src/lib/progress-math.ts` (pure calc) + `src/lib/progress.ts` (manifest-boundary wiring) | exact |
| `src/lib/pace.ts` | utility | transform | `src/lib/progress-math.ts` | exact |
| `scripts/check-schedule.mjs` | test | batch | `scripts/check-progress-math.mjs` | exact |
| `scripts/check-pace.mjs` | test | batch | `scripts/check-progress-math.mjs` | exact |
| `scripts/check-manifest.mjs` (extend) | test | batch | itself (existing file, extend in place) | exact |
| `src/app/page.tsx` (rewrite) | route/controller | request-response | itself (existing `src/app/page.tsx`, current pattern) | exact |
| `src/app/curriculum/page.tsx` | route/controller | request-response | `src/app/page.tsx` (current, pre-rewrite content moves here) | exact |
| `src/app/schedule/page.tsx` | route/controller | request-response | `src/app/page.tsx` (force-dynamic + cookie-gate pattern) | exact |
| `src/components/today-lesson-card.tsx` | component | request-response | `src/components/progress-summary.tsx` | role-match |
| `src/components/dday-countdown.tsx` | component | request-response | `src/components/progress-badge.tsx` (small server-render pure `<span>`) | role-match |
| `src/components/pace-status.tsx` | component | request-response | `src/components/progress-summary.tsx` (conditional heading/body by state) | role-match |
| `src/components/behind-lessons-list.tsx` | component | request-response | `src/components/step-card.tsx` (list of links with badges) | role-match |
| `src/components/schedule-table.tsx` | component | request-response | `src/components/step-card.tsx` + `depth-badge.tsx`/`estimated-time.tsx` (row composition) | role-match |
| `src/components/site-nav.tsx` (edit) | component | request-response | itself (existing file, edit `NAV_ITEMS` hrefs) | exact |
| `src/content/lessons/**/*.mdx` (frontmatter edit) | config | batch | itself (existing files, bulk `estimatedMinutes` value edit) | exact |

## Pattern Assignments

### `src/lib/today.ts` (utility, transform)

**Analog:** `src/lib/progress-math.ts` (full file, lines 1-44 — read above)

**Zero-dependency pure module convention** (lines 1-5):
```typescript
// 진행률 계산의 심장 — 의존성 0 순수 모듈. import 문을 하나도 쓰지 않는다.
// 그래야 Node가 이 파일을 별도 트랜스파일러 없이 그대로 로드할 수 있고
// (scripts/check-progress-math.mjs), 화면 작업이 계산 정확성을 다시 의심하지
// 않아도 된다 (D-26).
```
Apply verbatim to `today.ts`, `schedule.ts`, `pace.ts`: no `import` statements, top comment stating why (Node 22.6+ type-stripping loads it directly, verified by `check-*.mjs`).

**Pure function signature style** (lines 14-27): input params only (no I/O), explicit return type alias exported alongside the function (`ProgressCounts` next to `aggregate`). Mirror with `ScheduleRow`/`PaceResult` type exports beside `buildSchedule`/`computePace` (already specified in RESEARCH.md Pattern 2 — copy that code directly, it already follows this convention).

**Immutability contract**: `aggregate`/`firstIncompleteSlug` never mutate `completedIds`/`slugs` inputs (verified by `check-progress-math.mjs` case "두 함수 모두 입력 Set·배열을 변형하지 않는다", lines 68-79). `schedule.ts`/`pace.ts` must uphold the same contract for `completedIds`/`rows`.

---

### `src/lib/schedule.ts` (utility, transform)

**Analog:** `src/lib/progress.ts` (full file, lines 1-43 — read above)

**Manifest-boundary comment + import pattern** (lines 1-14):
```typescript
// 매니페스트 조회(curriculum-helpers.ts)와 순수 집계(progress-math.ts)를 조합하는
// 얇은 층. Velite 콘텐츠 매니페스트 모듈을 직접 import하지 않는다 — 매니페스트
// 접근은 curriculum-helpers.ts의 공개 함수를 통한다(PATTERNS의 import 관례).
// Supabase 관련 모듈도 import하지 않는다 — 이 파일은 완료 집합을 인자로 받을
// 뿐 스스로 읽지 않는다(ARCHITECTURE 책임 맵의 계층 분리).

import type { StepId } from '@/content/modules';
import {
  getModulesByStep,
  getLessonsByModule,
  getOrderedLessons,
  getLessonBySlug,
} from '@/content/curriculum-helpers';
import { aggregate, firstIncompleteSlug, type ProgressCounts } from './progress-math';
```
**Important distinction:** `schedule.ts`/`pace.ts` themselves must stay dependency-0 (per RESEARCH.md Anti-Patterns — they take `orderedSlugs: readonly string[]` as a parameter, not import `curriculum-helpers.ts` directly). It is the **call site** (`src/app/page.tsx` / `src/app/schedule/page.tsx`) that imports both `curriculum-helpers.ts` (for `getOrderedLessons()`) and `schedule.ts`/`pace.ts`, and wires them together — following the same "thin combining layer" role that `progress.ts` plays for `progress-math.ts` today. Concretely: `getOrderedLessons().map(l => l.slug)` is computed in the page/route file (or a new thin wiring function similar to `overallProgress()` in `progress.ts`), then passed into `buildSchedule(...)`.

**Thin wiring function shape** (lines 21-24):
```typescript
export function overallProgress(completedIds: ReadonlySet<string>): ProgressCounts {
  const slugs = getOrderedLessons().map((lesson) => lesson.slug);
  return aggregate(completedIds, slugs);
}
```
Mirror this shape for a new `progress.ts` (or page-level) function that gets ordered slugs + `estimatedMinutes` map from `curriculum-helpers.ts`/Velite lessons and calls `buildSchedule`/`computePace`.

**Concrete implementation:** already fully specified in `03-RESEARCH.md` "Pattern 2" (verbatim code for `buildSchedule`) — copy that code as the starting point; it already matches this project's conventions (Date.UTC arithmetic, no manifest import inside the pure file).

---

### `src/lib/pace.ts` (utility, transform)

**Analog:** `src/lib/progress-math.ts` (same as `today.ts` above) for style; concrete algorithm already specified in RESEARCH.md Pattern 2 (`computePace`) — copy verbatim, it already follows the zero-dependency convention and matches D-40~D-43.

---

### `scripts/check-schedule.mjs`, `scripts/check-pace.mjs` (test, batch)

**Analog:** `scripts/check-progress-math.mjs` (full file, lines 1-97 — read above)

**Structure to copy:**
```javascript
#!/usr/bin/env node
// <one-line description of what's being verified + which lib file>

import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const TARGET_PATH = path.join(ROOT, 'src', 'lib', 'schedule.ts'); // or pace.ts

const failures = [];

function runCase(name, fn) {
  try {
    fn();
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

async function main() {
  const { buildSchedule } = await import(pathToFileURL(TARGET_PATH).href);

  runCase('<case description>', () => {
    assert.deepStrictEqual(/* ... */);
  });

  // ... more runCase() blocks, one per boundary condition ...

  if (failures.length > 0) {
    console.error(`check-schedule: ${failures.length}개 케이스 실패:\n`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }

  console.log('check-schedule: N개 케이스 모두 통과');
  process.exit(0);
}

main().catch((e) => {
  console.error(`check-schedule: 실행 중 오류 — ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
});
```
Dynamic `import(pathToFileURL(...))` is how this project loads `.ts` lib files with zero transpiler (Node 22.6+ type stripping) — reuse exactly. `check-schedule.mjs` must cover boundary cases per RESEARCH.md Wave 0 Gaps: no rows before start date, last lesson day = 9/28, buffer day = 9/29, total 36 rows. `check-pace.mjs` must cover the 3-way ahead/on-track/behind branch plus `missedSlugs` accuracy (RESEARCH.md Pitfall 3).

---

### `src/app/page.tsx` (rewrite → "오늘의 학습", route/controller, request-response)

**Analog:** current `src/app/page.tsx` itself (full file, lines 1-49 — read above). This file is being rewritten in place; its existing gate pattern must be preserved exactly.

**Force-dynamic + unconditional cookie gate** (lines 9-20):
```typescript
// 홈도 쿠키를 읽으므로 동적 렌더링이 필요하다 — 조건부 쿠키 접근이 캐시된
// 응답을 내보내는 문제(RESEARCH Pitfall 4)를 원천 차단한다. `/unlock` 직후
// 리다이렉트로 도착했을 때 방금 켠 진도가 안 보이는 것을 막는 바로 그 화면이다.
export const dynamic = "force-dynamic";

export default async function Home() {
  // 무조건, 그리고 어떤 조회보다도 먼저 호출한다 — 레슨/Step 페이지와 동일한
  // 게이트 순서를 지켜 조건부 호출이 만드는 캐시 문제를 피한다.
  const unlocked = await hasUnlockCookie();

  const progressRead = unlocked ? await readCompletedLessonIds() : null;
  const completedIds = progressRead?.ok ? progressRead.completedIds : null;
  ...
}
```
**Apply verbatim** in the rewritten `page.tsx`: `export const dynamic = "force-dynamic"` + `hasUnlockCookie()` called first, unconditionally, before any other data read (including the new `todayInSeoul()`/`buildSchedule()` calls, which are cookie-independent per D-37 and can be computed regardless of `unlocked`).

**New composition (per D-36/D-37/D-38/D-39):** the schedule/today-row/D-day data (public, always computed) feeds `today-lesson-card.tsx`/`dday-countdown.tsx`. The `completedIds`-gated data (pace status, behind list, per-lesson completion) feeds `pace-status.tsx`/`behind-lessons-list.tsx`, rendered only when `completedIds` is non-null — same conditional-render shape as lines 30-37 (`ProgressSummary` vs `ProgressReadError` vs `null`).

**Error-read fallback pattern** (lines 35-37, reuse for schedule page too):
```typescript
) : progressRead && !progressRead.ok ? (
  <ProgressReadError />
) : null}
```

---

### `src/app/curriculum/page.tsx` (new route/controller, request-response)

**Analog:** `src/app/page.tsx` pre-rewrite (same file/lines as above) — this new file receives the *moved* Step-grid content (`steps.map(...)` block, lines 38-46) plus its own copy of the force-dynamic + cookie-gate header (lines 9-20).

**Critical pitfall (RESEARCH.md Pitfall 4):** must include its own `export const dynamic = "force-dynamic"` and its own unconditional `hasUnlockCookie()` call — do not assume the gate is inherited from `/`. Omitting it silently makes `StepCard` progress bars permanently `undefined`.

```typescript
import { steps } from "@/content/modules";
import { StepCard } from "@/components/step-card";
import { hasUnlockCookie } from "@/lib/auth";
import { readCompletedLessonIds } from "@/lib/progress-store";
import { stepProgress } from "@/lib/progress";

export const dynamic = "force-dynamic";

export default async function CurriculumPage() {
  const unlocked = await hasUnlockCookie();
  const progressRead = unlocked ? await readCompletedLessonIds() : null;
  const completedIds = progressRead?.ok ? progressRead.completedIds : null;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <section className="grid grid-cols-1 gap-8 sm:grid-cols-3">
        {steps.map((step) => (
          <StepCard
            key={step.id}
            step={step}
            progress={completedIds ? stepProgress(step.id, completedIds) : undefined}
          />
        ))}
      </section>
    </main>
  );
}
```
(Per Open Question 1 in RESEARCH.md — default to Step cards only, no separate aggregate % block, unless discuss-phase says otherwise.)

---

### `src/app/schedule/page.tsx` (new route/controller, request-response)

**Analog:** `src/app/page.tsx` (force-dynamic + cookie-gate header, same lines 9-20) combined with RESEARCH.md's explicit Pattern 1 example for this exact route:
```typescript
export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const unlocked = await hasUnlockCookie(); // 무조건, 어떤 조회보다 먼저
  const progressRead = unlocked ? await readCompletedLessonIds() : null;
  const completedIds = progressRead?.ok ? progressRead.completedIds : null;

  const today = todayInSeoul(); // 신규 today.ts
  const rows = buildSchedule(getOrderedLessons(), SCHEDULE_START, SCHEDULE_DAYS); // 신규 schedule.ts
  const todayRow = rows.find((r) => r.date === today) ?? null;

  // 일정 데이터(todayRow)는 completedIds 유무와 무관하게 항상 사용 가능(D-37).
  // completedIds가 null이면 완료 체크·페이스 UI만 생략한다.
}
```
`rows` (all 36 rows, public per D-37) is passed to `schedule-table.tsx` regardless of `completedIds`; only the per-row completed-check display is conditional on `completedIds !== null`.

---

### `src/components/today-lesson-card.tsx` (component, request-response)

**Analog:** `src/components/progress-summary.tsx` (full file, lines 1-79 — read above)

**Server-render pure component shape, no client directive** (lines 1-16):
```typescript
import Link from "next/link";
import type { ProgressCounts } from "@/lib/progress-math";
import { ProgressBadge } from "@/components/progress-badge";

export function ProgressSummary({
  counts,
  nextLessonSlug,
}: {
  counts: ProgressCounts;
  nextLessonSlug: string | null;
}) {
```
Mirror: props are pre-computed plain data (e.g., `todayLesson: Lesson | null`, `completed: boolean | null`, `tomorrowLesson: Lesson | null`), the component does no data fetching itself.

**Conditional heading/body by state** (lines 21-32) — directly maps to D-38 ("완료했거나 앞서 있으면 축하 메시지 + 내일 레슨 미리보기"):
```typescript
let heading: string;
let body: string;
if (isAllComplete) {
  heading = "커리큘럼을 모두 완료했어요!";
  body = "축하합니다. 처음부터 다시 볼 수도 있어요.";
} else if (isEmpty) {
  heading = "학습을 시작해볼까요?";
  body = "완료한 레슨이 아직 없어요.";
} else {
  heading = "전체 진행률";
  body = `${completed}/${total} 레슨 완료 · ${percent}%`;
}
```

**CTA link pattern** (lines 37-41, 69-76):
```typescript
const cta = isAllComplete
  ? { href: "/step/1", label: "커리큘럼 처음으로" }
  : nextLessonSlug
    ? { href: `/lesson/${nextLessonSlug}`, label: "이어서 학습하기" }
    : null;
...
{cta ? (
  <Link
    href={cta.href}
    className="flex min-h-11 w-fit items-center justify-center rounded-lg bg-accent px-4 py-2 text-[16px] font-semibold leading-[1.6] text-white dark:bg-accent-dark dark:text-background-dark"
  >
    {cta.label}
  </Link>
) : null}
```
Reuse the exact `min-h-11` (44px touch target) button classes for "오늘 레슨으로 이동"/"내일 레슨 미리보기" CTAs.

---

### `src/components/dday-countdown.tsx` (component, request-response)

**Analog:** `src/components/progress-badge.tsx` (full file, lines 1-35 — read above)

**Minimal pure server-render `<span>` shape** (lines 10-21):
```typescript
export function ProgressBadge({
  completed,
  total,
  percent,
  className,
}: {
  completed: number;
  total: number;
  percent: number;
  className?: string;
}) {
  const percentClass = percent > 0 ? PERCENT_ACCENT_CLASS : PERCENT_NEUTRAL_CLASS;

  return (
    <span
      data-progress-ui="badge"
      className={`... ${className ? ` ${className}` : ""}`}
    >
```
Mirror for `dday-countdown.tsx`: props `{ daysUntil: number }`, single `<span>`, `data-*` attribute for test/inspection hooks (this codebase's convention, e.g. `data-schedule-ui="dday"`), literal Tailwind classes (no dynamic class string interpolation beyond a pre-defined map, per the Tailwind JIT constraint noted in `depth-badge.tsx`/`step-card.tsx` comments).

---

### `src/components/pace-status.tsx` (component, request-response)

**Analog:** `src/components/progress-summary.tsx` (same file as `today-lesson-card.tsx` above) — the 3-branch `if/else if/else` heading+body selection (lines 21-32) is the direct template for D-42's `ahead`/`on-track`/`behind` 3-state display, and D-43's "정량 + 안내 문구" (`gapMinutes` → K-day catch-up text) slots into the `body` string exactly like `${completed}/${total} 레슨 완료 · ${percent}%` does today.

---

### `src/components/behind-lessons-list.tsx` (component, request-response)

**Analog:** `src/components/step-card.tsx` (full file, lines 1-63 — read above) for the "list item = full-row `<Link>` with badges" shape:
```typescript
<Link
  href={`/step/${step.id}`}
  className={`flex min-h-11 flex-col gap-3 rounded-lg border-l-4 bg-surface p-4 dark:bg-surface-dark ${STEP_BORDER_CLASSES[step.id]}`}
>
```
Mirror per missed lesson: `<Link href={`/lesson/${slug}`} className="flex min-h-11 items-center gap-2 ...">` wrapping lesson title + `EstimatedTime`/`DepthBadge`. Map over `missedSlugs` from `computePace()`.

---

### `src/components/schedule-table.tsx` (component, request-response)

**Analog:** `src/components/step-card.tsx` (badge/progress composition, lines 42-59) + `src/components/estimated-time.tsx` (full file, lines 1-18) + `src/components/depth-badge.tsx` (full file, lines 1-33) — all three reused directly per row.

**EstimatedTime formatting to reuse verbatim** (lines 3-10):
```typescript
export function formatEstimatedTime(minutes: number): string {
  if (minutes < 60) {
    return `약 ${minutes}분`;
  }
  const hours = Math.round((minutes / 60) * 10) / 10;
  const display = Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
  return `약 ${display}시간`;
}
```

**DepthBadge Step-accent-color map pattern** (lines 6-15) — same "literal class map, no dynamic string interpolation" constraint applies to any new per-row styling (e.g. today-row accent, past-row muted tone per D-46):
```typescript
const STEP_ACCENT_CLASSES: Record<StepId, string> = {
  1: "bg-step-1/10 text-step-1 border-step-1/40 dark:bg-step-1-dark/10 dark:text-step-1-dark dark:border-step-1-dark/40",
  2: "...",
  3: "...",
};
```

**Full-row-as-link with 44px touch target** (D-45 requirement) — directly copy the `StepCard` `<Link className="flex min-h-11 ...">` wrapper shape; each schedule row becomes `<Link href={`/lesson/${slug}`} className="flex min-h-11 items-center gap-2 ...">` containing date, lesson title, `EstimatedTime`, `DepthBadge`, and (if `completedIds` unlocked) a completed-check indicator.

---

### `src/components/site-nav.tsx` (edit)

**Analog:** itself (full file, lines 1-79 — read above)

**Exact change required** (lines 14-19):
```typescript
const NAV_ITEMS: readonly NavItem[] = [
  { label: "오늘의 학습", href: null },
  { label: "커리큘럼", href: "/" },
  { label: "일정표", href: null },
  { label: "소개", href: "/about" },
];
```
becomes:
```typescript
const NAV_ITEMS: readonly NavItem[] = [
  { label: "오늘의 학습", href: "/" },
  { label: "커리큘럼", href: "/curriculum" },
  { label: "일정표", href: "/schedule" },
  { label: "소개", href: "/about" },
];
```
No other change needed — `NavBadge`/disabled-state rendering (lines 21-27, 46-57) becomes dead code once all four items have `href` values, but the component logic itself doesn't need touching (branch simply never triggers). The `isActive` comparison logic (line 58) already treats `href === "/"` specially — unaffected since `/` now maps to "오늘의 학습" not "커리큘럼", which is exactly what's wanted (home = 오늘의 학습 per D-36).

---

### `src/content/lessons/**/*.mdx` (frontmatter bulk edit, D-31)

**Analog:** itself — bulk `estimatedMinutes` value substitution per RESEARCH.md's confirmed mapping (270→150, 180→90, 150→60, 120→60). No structural pattern needed; RESEARCH.md Pitfall 2 requires re-running `next dev`/`npm run build` after the edit to force Velite regeneration, and RESEARCH.md's Security section requires the edit script to target only the `estimatedMinutes` field (regex/AST-narrow), not touch `depth`/`moduleId`, followed by full `scripts/check-manifest.mjs` re-run to confirm structural integrity.

---

## Shared Patterns

### Force-dynamic + unconditional cookie gate (D-17/D-18/D-20, D-37)
**Source:** `src/app/page.tsx` lines 9-20 (current version)
**Apply to:** `src/app/page.tsx` (rewritten), `src/app/curriculum/page.tsx`, `src/app/schedule/page.tsx` — all three routes independently declare `export const dynamic = "force-dynamic"` and call `hasUnlockCookie()` first, unconditionally, before any other data access (including the new `todayInSeoul()` call, which is safe to call regardless but should still come after the gate call for consistency with existing files).
```typescript
export const dynamic = "force-dynamic";

export default async function PageName() {
  const unlocked = await hasUnlockCookie();
  const progressRead = unlocked ? await readCompletedLessonIds() : null;
  const completedIds = progressRead?.ok ? progressRead.completedIds : null;
  // ... public data (schedule/today/D-day) computed unconditionally below ...
}
```

### Zero-dependency pure calculation modules
**Source:** `src/lib/progress-math.ts` (whole file)
**Apply to:** `src/lib/today.ts`, `src/lib/schedule.ts`, `src/lib/pace.ts`
No `import` statements inside these three files; they receive all data as function parameters (ordered slugs, minutes map, completed set, today string) so `curriculum-helpers.ts`/Velite/Supabase concerns stay in the caller (`src/app/page.tsx` / `src/app/schedule/page.tsx`, or a thin `progress.ts`-style wiring function). This lets `node scripts/check-*.mjs` load them via dynamic `import(pathToFileURL(...))` with zero transpiler, exactly like `check-progress-math.mjs` does today.

### `node:assert/strict` verification scripts
**Source:** `scripts/check-progress-math.mjs` (whole file)
**Apply to:** `scripts/check-schedule.mjs`, `scripts/check-pace.mjs`, and the extension of `scripts/check-manifest.mjs`
Same `runCase(name, fn)` collector + `failures` array + single `main()` + `process.exit(1)`-on-failure structure. No test framework dependency.

### Step-accent literal class maps (no dynamic Tailwind class interpolation)
**Source:** `src/components/depth-badge.tsx` lines 6-15, `src/components/step-card.tsx` lines 8-21
**Apply to:** `src/components/schedule-table.tsx` (today-row accent, Step-colored elements), `src/components/behind-lessons-list.tsx` (if Step-color-coded)
Always a `Record<StepId, string>` object with every class name written out literally — never string-template a Tailwind class from a variable, since Tailwind's JIT scanner only picks up literal class strings.

### 44px touch target on full-row links (D-45)
**Source:** `src/components/step-card.tsx` line 30 (`className="flex min-h-11 flex-col gap-3 ..."`), `src/components/progress-summary.tsx` line 71 (`className="flex min-h-11 w-fit items-center justify-center ..."`)
**Apply to:** `src/components/schedule-table.tsx` rows, `src/components/behind-lessons-list.tsx` items, `src/components/today-lesson-card.tsx` CTA links
Every clickable row/CTA uses `min-h-11` (44px) as the minimum height class — required per PROJECT.md's iPad touch-target constraint and explicitly required by D-45.

## No Analog Found

None — every file in scope has at least a role-match analog in the existing codebase (this phase adds no new architectural layer; RESEARCH.md confirms it purely extends the existing static-shell + progress-overlay pattern).

## Metadata

**Analog search scope:** `src/lib/`, `src/app/`, `src/components/`, `scripts/`, `src/content/` (directories directly named in CONTEXT.md "Reusable Assets" and RESEARCH.md "Recommended Project Structure")
**Files scanned:** `src/app/page.tsx`, `src/components/site-nav.tsx`, `src/lib/progress-math.ts`, `src/lib/progress.ts`, `scripts/check-progress-math.mjs`, `src/components/progress-summary.tsx`, `src/components/step-card.tsx`, `src/components/estimated-time.tsx`, `src/components/depth-badge.tsx`, `src/components/progress-badge.tsx`, `src/lib/auth.ts`, `src/content/curriculum-helpers.ts` (12 files read directly, plus `src/app/**/page.tsx` glob for route inventory)
**Pattern extraction date:** 2026-08-24
