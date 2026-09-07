---
phase: quick-260826-tbx
plan: "01"
subsystem: schedule
tags: [nextjs, typescript, tdd, date-arithmetic, react-keys]
requires:
  - phase: 03-daily-schedule-and-pace
    provides: src/lib/schedule.ts, src/lib/pace.ts, the /schedule and / routes
provides:
  - "SCHEDULE_START shifted to 2026-08-28 with a new DOUBLE_LESSON_DATES constant (8/29, 9/5, 9/12) so all 35 lessons still land inside 8/28-9/28"
  - "buildSchedule/scheduleTotalDays accept an optional doubleDates/doubleDayCount parameter, backward compatible"
  - "rowsForDate/firstRowAfter pure helpers for 0-2 rows on a given date and the first row strictly after a date"
  - "schedule-table.tsx/page.tsx/today-lesson-card.tsx now correctly render a date with two lesson rows"
affects: [schedule, pace, home-page, schedule-page]
actuals:
  tokens: 14279
  tasks: 3
  commits: 5
tech-stack:
  added: []
  patterns:
    - "Constant single-source-of-truth via dynamic import instead of a re-declared literal"
    - "Day-count-based list grouping instead of row-count slicing"
    - "Anchor/highlight separation: one boolean for a unique DOM id, a separate boolean for visual emphasis across all matching rows"
key-files:
  created: []
  modified:
    - src/lib/schedule.ts
    - src/lib/schedule-data.ts
    - src/app/page.tsx
    - src/app/schedule/page.tsx
    - src/components/schedule-table.tsx
    - src/components/today-lesson-card.tsx
    - scripts/check-schedule.mjs
    - scripts/check-pace.mjs
    - scripts/e2e-today.mjs
    - .planning/REQUIREMENTS.md
key-decisions:
  - "DD-1: kept one-row-per-lesson (two rows can share a date) instead of a lessonSlugs array model - pace.ts already tolerates duplicate dates (proven, no code change needed), progress-store keys only on lesson_id not date, total row count stays 36"
  - "DD-2: DOUBLE_LESSON_DATES names which 3 dates get 2 lessons, never which lesson goes where - assignment still derives purely from orderedSlugs order"
  - "DD-3: today/tomorrow row selection lives in schedule.ts as pure functions (rowsForDate/firstRowAfter) because 2026-08-26 is before SCHEDULE_START, so no live request can exercise the double-lesson-day home screen - the pure functions let check-schedule.mjs prove the logic deterministically today"
  - "DD-4: deleted e2e-today.mjs's own SCHEDULE_START copy, now dynamically imports the constant from schedule.ts; independent algorithm reimplementation stays, only the constant collapsed to one source"
  - "Added a completedIds prop to TodayLessonCard (alongside the existing aggregate completed boolean) to compute the 2-lesson-day CTA target and per-lesson checkmarks"
requirements-completed: [SCHED-01, SCHED-02]
coverage:
  - id: D1
    description: "35 lessons assigned exactly once across 2026-08-28..2026-09-28, with exactly 8/29, 9/5, 9/12 doubled and 9/29 as the buffer day"
    requirement: SCHED-01
    verification:
      - kind: unit
        ref: "scripts/check-schedule.mjs (34 cases)"
        status: pass
    human_judgment: false
  - id: D2
    description: "/schedule renders all 33 distinct dates with the 3 doubled dates as 2 rows each and unique React keys, without splitting a doubled date across week headings"
    requirement: SCHED-02
    verification:
      - kind: e2e
        ref: "scripts/e2e-today.mjs s6 (date-count histogram) and s7 (no duplicate-key console warning)"
        status: pass
    human_judgment: true
    rationale: "s7 cannot actually observe a React duplicate-key bug for this component - react-dom's duplicate-key warning only exists in react-dom-client (confirmed via grep on node_modules/react-dom/cjs/), not the server renderer, and schedule-table.tsx is a pure Server Component. The fix is still correct per DD-1's action items, but a human should visually confirm /schedule's 2-row groups and week boundaries."
  - id: D3
    description: "Home 'today' view handles 0/1/2 lessons assigned today, and 'tomorrow' points at the next date's first row, not the same date's second lesson"
    requirement: SCHED-02
    verification:
      - kind: unit
        ref: "scripts/check-schedule.mjs (rowsForDate('2026-08-29') returns 2 rows; firstRowAfter('2026-08-29').date === '2026-08-30')"
        status: pass
    human_judgment: true
    rationale: "Today (2026-08-26) is before SCHEDULE_START, so no live e2e request exercises the 2-lesson-day home screen end to end. The underlying date logic is proven at the data layer, but the actual rendered 2-lesson TodayLessonCard has not been visually confirmed."
duration: ~35min
completed: 2026-08-26
status: complete
---

# Phase quick-260826-tbx Plan 01: Shift Study Start Date to 2026-08-28 Summary

**Shifted SCHEDULE_START to 2026-08-28 and redistributed all 35 lessons across 32 study days by doubling three Saturdays (8/29, 9/5, 9/12), fixing four presentation-layer bugs a naive constant-only edit would have left broken (duplicate row keys, week-grouping-by-row-count, duplicate DOM anchor id, "tomorrow" pointing at today's second lesson), and collapsing e2e-today.mjs's duplicate SCHEDULE_START constant into schedule.ts's single source.**

## Performance

- **Duration:** ~35 min
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments

- `src/lib/schedule.ts`: `SCHEDULE_START` moved to `2026-08-28`, new `DOUBLE_LESSON_DATES` constant, `scheduleTotalDays(lessonCount, doubleDayCount = 0)` and `buildSchedule(orderedSlugs, startDateISO, totalDays, doubleDates = [])` both backward-compatible extensions, plus two new pure helpers `rowsForDate`/`firstRowAfter`. Zero `import` statements added.
- `src/lib/schedule-data.ts`: `getScheduleRows()` threads `DOUBLE_LESSON_DATES` through as the single entry point both `/` and `/schedule` use.
- `src/components/schedule-table.tsx`: row `key` now uses `lessonSlug` for lesson rows instead of `date` (not unique on the 3 doubled dates); week grouping counts 7 distinct days instead of slicing rows in chunks of 7; `id="schedule-today"`/`today-row` marker attach to only the first row of today's date, while the accent highlight applies to every row on that date.
- `src/app/schedule/page.tsx`: header date-range text now derives from `SCHEDULE_START` and the last row's `date` instead of a hardcoded literal.
- `src/app/page.tsx`: today lookup uses `rowsForDate(rows, today)` (0-2 rows); tomorrow lookup uses `firstRowAfter(rows, today)` instead of `rows.indexOf(todayRow) + 1`; `completedToday` requires every lesson assigned today to be complete.
- `src/components/today-lesson-card.tsx`: `todayLesson: Lesson | null` widened to `todayLessons: readonly Lesson[]` (0-2); single-lesson rendering stays pixel-identical; a 2-lesson day renders each lesson as its own linked row, CTA points at the first incomplete lesson via a new `completedIds` prop.
- `scripts/check-schedule.mjs`: 34 cases covering the new constants, double-assignment behavior, ordering/uniqueness/boundary invariants, and the new helpers.
- `scripts/e2e-today.mjs`: dropped its own `SCHEDULE_START` re-declaration (DD-4), now dynamically imports it from `schedule.ts`; added s6 (date-count histogram) and s7 (no React duplicate-key warning).
- `scripts/check-pace.mjs`: 4 new cases proving `computePace` already tolerates two rows sharing a date, with zero production code change.
- `.planning/REQUIREMENTS.md`: SCHED-01 text updated to match the shipped 2026-08-28 start date and doubled-Saturday pacing.

## Task Commits

Each task was committed via TDD RED/GREEN pairs:

1. **Task 1: 2레슨 날짜를 아는 순수 일정 모듈** — `e0fd4e1` (test, RED: 34 check-schedule.mjs cases), `857f323` (feat, GREEN: schedule.ts + schedule-data.ts)
2. **Task 2: 같은 날짜 2행을 렌더하는 표현층** — `3b8a621` (test, RED: e2e-today.mjs s6/s7 + DD-4 constant collapse), `9663053` (feat, GREEN: schedule-table.tsx/page.tsx/schedule/page.tsx/today-lesson-card.tsx)
3. **Task 3: 중복 날짜 페이스 판정 증명 + 게이트 14종** — `9202a38` (test, all 4 new check-pace.mjs cases pass immediately against unmodified pace.ts, proving DD-1; also updates REQUIREMENTS.md)

_Note: Task 3 has no separate GREEN commit — pace.ts required zero code changes, so the RED commit's cases passed on first run, which is the expected outcome when the task's purpose is proving an existing invariant rather than adding new behavior._

**Plan metadata:** not committed separately in this worktree — STATE.md/ROADMAP.md updates are owned by the orchestrator after merge, per this plan's explicit instruction to skip them here.

## Files Created/Modified

- `src/lib/schedule.ts` - SCHEDULE_START='2026-08-28', DOUBLE_LESSON_DATES constant, extended scheduleTotalDays/buildSchedule, new rowsForDate/firstRowAfter
- `src/lib/schedule-data.ts` - threads DOUBLE_LESSON_DATES through the single entry point
- `src/app/page.tsx` - today/tomorrow lookups use rowsForDate/firstRowAfter; completedToday requires all of today's lessons done
- `src/app/schedule/page.tsx` - header date range derived instead of hardcoded
- `src/components/schedule-table.tsx` - unique row keys, day-count week grouping, single today anchor
- `src/components/today-lesson-card.tsx` - todayLesson widened to todayLessons array, new completedIds prop, 2-lesson row rendering
- `scripts/check-schedule.mjs` - 34 cases covering new constants/signatures/helpers
- `scripts/check-pace.mjs` - 4 new duplicate-date cases proving DD-1
- `scripts/e2e-today.mjs` - dropped duplicate SCHEDULE_START, added s6/s7
- `.planning/REQUIREMENTS.md` - SCHED-01 text updated

## Decisions Made

See `key-decisions` in frontmatter (DD-1 through DD-4, plus the TodayLessonCard `completedIds` prop addition). All four DD decisions were pre-investigated in the plan itself and implemented as written — no reversals.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `next build` cannot receive env vars via `node --env-file=` (Turbopack worker restriction)**
- **Found during:** Task 1 verification (`npx tsc --noEmit` required a prior build/dev run to generate `.next/types` ambient `PageProps`/`LayoutProps` types in this fresh worktree)
- **Issue:** `node --env-file=<path> node_modules/next/dist/bin/next build` fails with `ERR_WORKER_INVALID_EXEC_ARGV: --env-file= is not allowed in NODE_OPTIONS` — Turbopack's build workers inherit `NODE_OPTIONS`, and Node disallows `--env-file` there
- **Fix:** wrote a throwaway helper `scripts/build-with-env-tbx.mjs` (task-suffixed, never staged/committed) that parses the env file and spawns `next build` with the parsed vars merged into `env`
- **Files modified:** none tracked (helper stays untracked)
- **Verification:** the build completed successfully both times it was run via the helper; `npx tsc --noEmit` then passed clean
- **Committed in:** N/A — helper script never committed, by design

---

**Total deviations:** 1 auto-fixed (1 blocking, tooling-only, no production code affected)
**Impact on plan:** Zero scope creep — a local build-tooling workaround for a fresh worktree's missing `.next/types`, needed only to run the plan's own `<verify>` steps.

## Issues Encountered

- **s7's console-warning check has a blind spot for Server Components.** Confirmed via `grep -rl "Encountered two children" node_modules/react-dom/cjs/` that React's duplicate-key warning only exists in `react-dom-client.development.js`, not the server renderer — s7 would pass even without the `schedule-table.tsx` key fix, since `/schedule`'s row list is a pure Server Component with no client-side reconciliation. The key/grouping/anchor fixes were still implemented exactly per the plan's action items; flagged as `human_judgment: true` on coverage item D2 above.
- **Today (2026-08-26) is before SCHEDULE_START (2026-08-28), so no live e2e request exercises the 2-lesson-day home screen.** The `TodayLessonCard` 2-lesson branch and CTA logic are proven at the data layer only — flagged as `human_judgment: true` on coverage item D3.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Schedule data model, presentation layer, and pace judgment verified against the new 8/28 start date and 3-doubled-Saturday distribution — full 14-gate suite + `npm run build` all pass.
- Two items flagged for human spot-check when reachable: (1) visually confirm `/schedule`'s doubled dates render as clean 2-row groups without a broken week boundary; (2) once one of the three doubled dates arrives (or via a manual date override), confirm the home card renders both lessons correctly and the CTA points at the right one.
- No blockers for Phase 6 iPad real-device UAT — this quick task did not touch any `.planning/phases/06-*` artifact.

---
*Phase: quick-260826-tbx*
*Completed: 2026-08-26*
