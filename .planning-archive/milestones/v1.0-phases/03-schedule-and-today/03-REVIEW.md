---
phase: 03-schedule-and-today
reviewed: 2026-08-25T00:00:00Z
depth: standard
files_reviewed: 19
files_reviewed_list:
  - scripts/check-manifest.mjs
  - scripts/check-pace.mjs
  - scripts/check-progress-gates.mjs
  - scripts/check-schedule.mjs
  - scripts/e2e-today.mjs
  - src/app/curriculum/page.tsx
  - src/app/page.tsx
  - src/app/schedule/page.tsx
  - src/components/behind-lessons-list.tsx
  - src/components/dday-countdown.tsx
  - src/components/pace-status.tsx
  - src/components/schedule-auto-scroll.tsx
  - src/components/schedule-table.tsx
  - src/components/site-nav.tsx
  - src/components/step-card.tsx
  - src/components/today-lesson-card.tsx
  - src/lib/pace.ts
  - src/lib/schedule.ts
  - src/lib/schedule-data.ts
  - src/lib/today.ts
findings:
  critical: 1
  warning: 5
  info: 2
  total: 8
status: issues_found
---

# Phase 03: Code Review Report

**Reviewed:** 2026-08-25T00:00:00Z
**Depth:** standard
**Files Reviewed:** 19
**Status:** issues_found

## Summary

Reviewed the schedule/pace/"오늘의 학습" feature slice: the pure calculation modules (`schedule.ts`, `today.ts`, `pace.ts`), the layer combining them (`schedule-data.ts`), the three gated pages (`/`, `/curriculum`, `/schedule`), their presentational components, and the four accompanying test/gate scripts. The pure calculation modules are careful and well-covered by `check-pace.mjs`/`check-schedule.mjs` (boundary cases, mutation-safety, buffer-day exclusion, Pitfall-3 future-completion regression all explicitly asserted) — no defects found there.

The one blocker is in `scripts/e2e-today.mjs`'s t8 scenario, which mutates a live Supabase `progress` row (delete + later upsert) with no separate test schema/table and an imperfect restore path — a real data-loss/data-corruption risk for what is a single-user app's only copy of its progress data. The warnings are mostly about silent-failure/silent-drop patterns that diverge from this codebase's own stated philosophy (elsewhere, e.g. `check-manifest.mjs`, invariant violations fail loudly) — here, a manifest/schedule slug mismatch would instead produce a blank UI card or a silently shortened schedule table rather than a diagnosable error.

## Critical Issues

### CR-01: e2e-today.mjs destructively mutates live progress data with an imperfect, non-atomic restore

**File:** `scripts/e2e-today.mjs:361-409`
**Issue:** Scenario t8 deletes a real row from the `progress` table (`admin.from('progress').delete().eq('lesson_id', probeSlug)`, line 377) to force a "behind" state, then restores it in a `finally` block. Two problems compound the risk:

1. There is no indication this script targets a separate test/staging Supabase project — it reads the same `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` env vars the app itself uses (per the project context, this is a single-person app with a single Supabase project). If the Node process is killed externally (OS OOM kill, terminal close, CI timeout `SIGKILL`, power loss) between the `delete` (line 377) and the `finally` restore (line 401), the learner's real completion record for `probeSlug` is permanently gone — `finally` blocks do not run across a hard process kill.
2. Even on the successful/expected path, the restore only ever writes `completed_at: new Date().toISOString()` (line 404). The preceding read (lines 366-369) only selects `lesson_id`, never the original `completed_at` — so a "successful" test run silently overwrites the true historical completion timestamp with the test run's timestamp, permanently losing the original completion date for that lesson.

**Fix:** Capture the full original row (including `completed_at`) before deleting, and restore that exact row rather than a synthesized one:
```javascript
const { data: existingRows, error: selectError } = await admin
  .from('progress')
  .select('lesson_id, completed_at')
  .eq('lesson_id', probeSlug);
// ...
if (wasCompleted) {
  const { error: restoreError } = await admin
    .from('progress')
    .upsert({ lesson_id: probeSlug, completed_at: existingRows[0].completed_at });
  // ...
}
```
Additionally, either point this script at a dedicated test Supabase project (separate `E2E_SUPABASE_URL`/`E2E_SUPABASE_SERVICE_ROLE_KEY`), or add an explicit guard/confirmation before running t8 against the same project the live app writes to, so a real user's only progress record is never at risk from a test run.

## Warnings

### WR-01: "assigned" today-state with an unresolvable lesson slug renders a completely blank card

**File:** `src/app/page.tsx:36-44`, `src/components/today-lesson-card.tsx:39-74`
**Issue:** `state` is set to `"assigned"` purely from `!todayRow.isBuffer` (page.tsx:38), independent of whether `getLessonBySlug(todayRow.lessonSlug)` actually resolves (page.tsx:44 falls back to `null` on lookup failure). In `TodayLessonCard`, the branch chain is `before-start` / `after-range` / `buffer` / `celebration` / `else if (todayLesson)` (today-lesson-card.tsx:43-74) — there is no branch for `state === "assigned"` with `todayLesson === null`. In that case `heading`, `body`, and `cta` all stay `null`, and the outer render (`state === "assigned" && todayLesson ? ... : (<div>{heading}{body}</div>)`, lines 81-108) produces an empty `<section data-schedule-ui="today-card">` with no heading, no body, and no CTA — a silent, unexplained blank card instead of a diagnosable fallback message.
**Fix:** Add an explicit fallback branch, e.g. treat an unresolved `todayLesson` as its own state (or reuse `after-range`'s copy pattern) so the card always shows *something* actionable:
```typescript
} else if (state === "assigned" && !todayLesson) {
  heading = "일정 정보를 불러오지 못했어요";
  body = "잠시 후 다시 시도해 주세요.";
  cta = { href: "/schedule", label: "일정표 보기" };
}
```

### WR-02: /schedule silently drops rows instead of degrading gracefully, undermining the "36 rows always" invariant

**File:** `src/app/schedule/page.tsx:41-44`
**Issue:** When a non-buffer `ScheduleRow`'s `lessonSlug` doesn't resolve via `getLessonBySlug`, the row-mapping callback returns `null` and the row is filtered out entirely (line 55), rather than degrading to a buffer-like placeholder. `scripts/e2e-today.mjs`'s s1 scenario asserts exactly 36 `data-schedule-ui="row"` markers unconditionally (e2e-today.mjs ~line 424). If manifest/schedule drift ever produces an unresolvable slug, the user-facing symptom is a schedule table silently short by one row (not a red flag to the person debugging it), while this repo's convention elsewhere (`check-manifest.mjs`) is to fail loudly on any such invariant break. This is an inconsistent defensive-coding pattern between the "fail loud" build-time gates and this "fail silent" runtime path.
**Fix:** At minimum, render a visible placeholder row (similar to the buffer row) when lookup fails, so the row count invariant holds and the failure is visible in the UI rather than only surfacing as an off-by-one in an e2e assertion.

### WR-03: Duplicated hardcoded date strings instead of deriving from `SCHEDULE_START`/`COURSE_START_DATE`

**File:** `src/app/page.tsx:105`, `src/app/schedule/page.tsx:64`, `src/components/today-lesson-card.tsx:45`
**Issue:** These three lines hardcode the schedule dates as literal Korean strings (`"2026-09-30 개강"`, `"2026-08-25 ~ 2026-09-29 · 하루 1레슨"`, `"사전학습은 2026-08-25부터 시작됩니다."`) even though `src/lib/schedule.ts` already exports `SCHEDULE_START` and `COURSE_START_DATE` for exactly this purpose (and `src/components/schedule-table.tsx:109` correctly interpolates `COURSE_START_DATE` for its own copy). If either constant is ever changed, these three strings will silently drift out of sync with the actual computed schedule.
**Fix:** Interpolate the constants, e.g. `` `AI Engineer 교육과정 사전학습 · ${COURSE_START_DATE} 개강` `` (page.tsx already imports `COURSE_START_DATE`), and derive the schedule page's end date from `SCHEDULE_START` + `scheduleTotalDays(...)` rather than a literal.

### WR-04: Type assertions in `schedule-table.tsx` mask the same null-drift risk as WR-02

**File:** `src/components/schedule-table.tsx:75-81`
**Issue:** `ScheduleLessonRow` force-casts `row.depth as "심화" | "개요"`, `row.stepId as StepId`, and `row.estimatedMinutes as number` even though `ScheduleTableRow`'s own type declares these as nullable for exactly the case where a lesson wasn't resolved. Because the page layer (WR-02) drops rows with a failed lookup rather than passing them through as `null`-field buffer-like rows, these casts are currently unreachable with `null` — but they're a latent trap: if the page-layer filtering in WR-02 were ever "fixed" by passing the row through instead of dropping it, this component would silently forward `null` into `DepthBadge`/`EstimatedTime` (which type-expect non-null values) instead of failing a type check.
**Fix:** Use a runtime guard (e.g. `if (row.depth === null || row.stepId === null || row.estimatedMinutes === null) return null;` at the top of `ScheduleLessonRow`) instead of a blind `as` cast, so a future data-shape change fails predictably rather than propagating `null` through components typed to reject it.

### WR-05: Stale comment in `site-nav.tsx` claims `/schedule` is still a 404

**File:** `src/components/site-nav.tsx:9`
**Issue:** The comment above `NAV_ITEMS` says `"일정표"("/schedule")는 Plan 04가 라우트를 채우기 전까지 404이지만...` ("/schedule is a 404 until Plan 04 fills in the route"). This phase (03-04) has since implemented `src/app/schedule/page.tsx` — the route is live, so the comment now misleads future readers into thinking `/schedule` is still a placeholder.
**Fix:** Update the comment to reflect that all four nav routes are now live, e.g. remove the "until Plan 04" caveat.

## Info

### IN-01: `Home()` server component has grown large and mixes several concerns inline

**File:** `src/app/page.tsx:22-131`
**Issue:** The ~110-line `Home()` function inlines schedule-row lookup, pace computation, celebration-state derivation, tomorrow-row lookup, and behind-lessons row assembly all in one function body. This is still readable today, but each concern (e.g. the tomorrow-row lookup at lines 60-76, and the behindRows assembly at lines 78-98) is independently testable pure logic that's currently only exercised indirectly through the e2e script.
**Fix:** Consider extracting `computeTomorrowInfo(rows, todayRow)` and `buildBehindRows(pace, rows)` as named helpers (in `page.tsx` or a co-located file) for readability and unit-testability, without changing behavior.

### IN-02: `bodyLines.map((line) => <p key={line}>)` uses text content as the React key

**File:** `src/components/pace-status.tsx:53-57`
**Issue:** Using the rendered string itself as the `key` works today because the two possible "behind" body lines are always distinct, but it's fragile — any future copy edit that causes two lines to coincide (e.g. both defaulting to the same fallback string) would produce a duplicate-key React warning.
**Fix:** Use the array index as the key instead (`bodyLines.map((line, i) => <p key={i}>...)`), which is safe here since `bodyLines` is a short, statically-ordered array with no reordering/filtering after creation.

---

_Reviewed: 2026-08-25T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
