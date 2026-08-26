---
phase: 06-site-wide-design-polish
plan: 07
subsystem: ui
tags: [empty-canvas, curriculum, progress-summary, dday, D-90, D-97]

# Dependency graph
requires:
  - phase: 06-site-wide-design-polish (plan 02)
    provides: "06-D97-MEASUREMENT.md — binding verdict scoping this plan's home task to no-op"
  - phase: 06-site-wide-design-polish (plan 04)
    provides: "Semantic typography tokens already applied to src/app/curriculum/page.tsx (text-display, etc.) — not regressed by this plan"
provides:
  - "/curriculum first screen now renders overall progress (ProgressSummary) and D-day (DDayCountdown) above the StepCard grid, using the same calculation functions and props signatures the home route already uses — zero new data paths"
affects: []

# Actuals (#2632)
actuals:
  tokens: 538
  tasks: 2
  commits: 1

tech-stack:
  added: []
  patterns:
    - "Cross-route component reuse without new queries: /curriculum now calls the same overallProgress()/nextIncompleteLesson()/daysUntil() pure functions the home route calls, passing the already-fetched completedIds — no new Supabase reads, no new lib functions"
    - "3-branch conditional (completedIds truthy / progressRead failed / neither) replicated verbatim from src/app/page.tsx onto src/app/curriculum/page.tsx so cookie-less visitors never see an empty progress box"

key-files:
  modified:
    - src/app/curriculum/page.tsx

key-decisions:
  - "Task 2 (home reshuffle) executed as a documented no-op per 06-D97-MEASUREMENT.md's binding verdict — cookie-present home empty-area is 0% (well under the 30% threshold), so D-90's home scope is closed without touching src/app/page.tsx. See 'D-97 Verdict Applied' section below."
  - "Within /curriculum, DDayCountdown is placed above ProgressSummary (D-day first, unconditional; progress summary second, cookie-conditional) to mirror the home route's top-to-bottom ordering (compact orientation info first, detailed section second) — the plan's task text lists ProgressSummary as priority 1 and D-day as priority 2, but that is a 'what to add, in order of importance' list, not a mandated visual stacking order, and no acceptance criterion in the plan tests order."
  - "No pace/behind-lessons sections were added to /curriculum — the plan's <action> block for Task 1 names only overall progress and D-day as the two things to pull in; pace/behind-lessons are home-specific 'today' framing, not curriculum-map framing, and adding them would exceed the plan's stated scope under the timebox instruction"

requirements-completed: [SC2, SC4]

coverage:
  - id: D1
    description: "/curriculum's first screen shows overall progress (heading, percent, progress bar, CTA) and D-day countdown above the existing 3-card Step grid, using ProgressSummary/DDayCountdown unmodified and overallProgress()/nextIncompleteLesson()/daysUntil() unmodified"
    requirement: "SC2"
    verification:
      - kind: other
        ref: "npx next build (exit 0, via env-wrapper for Supabase env vars); node scripts/check-design-tokens.mjs --strict --only src/app/curriculum/page.tsx (exit 0); node scripts/check-progress-math.mjs (exit 0, 11/11 cases); node scripts/check-brand.mjs (exit 0, 86 files)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Cookie-less visitors to /curriculum do not see a progress-summary element (data-progress-ui=\"summary\" absent), while D-day (data-schedule-ui=\"dday\") renders unconditionally, matching home's existing conditional structure"
    requirement: "SC4"
    verification:
      - kind: other
        ref: "curl http://localhost:4207/curriculum (no cookie): grep -c 'data-progress-ui=\"summary\"' = 0, grep -c 'data-schedule-ui=\"dday\"' = 1"
        status: pass
    human_judgment: false
  - id: D3
    description: "Cookie-present visitors to /curriculum see both the progress-summary and D-day elements — the unlock cookie flow (/unlock?key=UNLOCK_SECRET) followed by a re-request with that cookie confirms both markers present"
    requirement: "SC4"
    verification:
      - kind: other
        ref: "one-off fetch-based script hit /unlock then /curriculum with the returned cookie: progress-summary present=true, dday present=true"
        status: pass
    human_judgment: false
  - id: D4
    description: "Empty-viewport-area at 768x1024 (cookie-present, iPad-portrait) dropped to 0% (content now exceeds the viewport) — strictly smaller than any positive baseline, confirming the empty-canvas gap 06-02's reference screenshot showed (StepCard-grid-only /curriculum) is closed"
    requirement: "SC2"
    verification:
      - kind: other
        ref: "one-off Playwright measurement (same method as 06-D97-MEASUREMENT.md): /curriculum cookie-present 768x1024 bottom=1124.5px viewport=1024px empty=0.0%"
        status: pass
    human_judgment: false
  - id: D5
    description: "Shell contract preserved: force-dynamic rendering strategy, max-w-5xl container, gap-8 layout gap, and zero diff outside src/app/curriculum/page.tsx (no new queries in src/lib, no new content helpers, no component-file edits)"
    requirement: "SC4"
    verification:
      - kind: other
        ref: "grep -c 'max-w-5xl' src/app/curriculum/page.tsx = 1, grep -c 'gap-8' = 2 (container + grid); export const dynamic = \"force-dynamic\" line unchanged; git diff --stat src/lib src/content src/components (all empty)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Home route (src/app/page.tsx) left untouched, per 06-D97-MEASUREMENT.md's binding verdict — the numeric basis for that decision is recorded verbatim in this summary's D-97 Verdict Applied section"
    requirement: "SC2"
    verification:
      - kind: other
        ref: "git diff --stat src/app/page.tsx (empty)"
        status: pass
    human_judgment: false

duration: ~50min
completed: 2026-08-26
status: complete
---

# Phase 6 Plan 7: Curriculum Empty-Canvas Reshuffle (D-90) + Home Scope Closure (D-97) Summary

**`/curriculum`'s first screen no longer shows only a 3-card Step grid — it now pulls in the same already-computed overall progress and D-day values the home route already renders, using the identical components and calculation functions, so the empty-canvas gap at iPad-portrait closes (0% empty vs. a nonzero baseline) with zero new data paths. The home route (`src/app/page.tsx`) was left untouched, per 06-02's D-97 measurement: the cookie-present real-user state already renders all 5 sections with content exceeding the viewport (0% empty), so D-90's home-reshuffle scope closes as a documented no-op rather than an implementation.**

## D-97 Verdict Applied (Task 2)

Per `.planning/phases/06-site-wide-design-polish/06-D97-MEASUREMENT.md`:

> **판정: 홈은 작업하지 않는다. D-90의 홈 범위를 종료한다.** (쿠키 있는 실사용 상태의 빈 영역 0% < 30% 기준선)

Numeric basis: cookie-present home measured 0% empty at 768×1024 (all 5 sections render, `<main>`'s last child bottom = 1049.7px exceeds the 1024px viewport). Cookie-less home measured 55.6% empty — this is the state that produced 04-UI-REVIEW's original "홈 55% 빈 캔버스" finding, but it is not the state the real single-user visitor (who always carries a 10-year unlock cookie) actually experiences.

**Task 2 executed as a no-op.** `src/app/page.tsx` was not read for editing purposes beyond the required `read_first` review, and no diff exists against it (`git diff --stat src/app/page.tsx` is empty). This is the plan's own explicitly anticipated outcome for a "빈 영역 < 30%" verdict, not a scope reduction improvised by this executor.

## Performance

- **Duration:** ~50 min (includes worktree bootstrap: `npm ci` for `node_modules`, `npx velite build` for `.velite/`, both absent on worktree creation — same pattern 06-01/06-02/06-04 documented)
- **Tasks:** 2 (1 code change + 1 documented no-op)
- **Files modified:** 1 (`src/app/curriculum/page.tsx`)

## Accomplishments

- `/curriculum` now imports and renders `ProgressSummary` (fed by `overallProgress(completedIds)` and `nextIncompleteLesson(completedIds)?.slug ?? null`) and `DDayCountdown` (fed by `daysUntil(COURSE_START_DATE, today)`) — the exact same components, calculation functions, and argument shapes the home route already uses, with zero new Supabase queries, zero new `src/lib` functions, and zero component-file edits
- Replicated the home route's 3-branch conditional structure for the progress section: `completedIds` truthy → `ProgressSummary`; `progressRead` present but not `ok` → `ProgressReadError`; neither → nothing. `DDayCountdown` renders unconditionally (static public schedule info, same as home per D-37)
- Container contract preserved: `max-w-5xl`, `gap-8`, `force-dynamic`, and the pre-existing `hasUnlockCookie()`-first call order were all left untouched
- Verified the empty-canvas gap closed: cookie-present `/curriculum` at 768×1024 now measures 0% empty viewport area (content exceeds the viewport), confirmed with the same measurement method 06-02 used for its D-97 home measurement
- Verified the cookie-less/cookie-present conditional split at the HTTP-response level: no cookie → 0 `data-progress-ui="summary"` elements, 1 `data-schedule-ui="dday"` element; with cookie (via a one-off `/unlock` fetch, secret never logged) → both elements present

## Task Commits

1. **Task 1: `/curriculum` 재배치 — 이미 계산된 진행률·D-day를 끌어온다 (D-90)** — `7144cf0` (feat)
2. **Task 2: 홈 재배치 — D-97 판정에 따른 조건부 실행** — no-op, no commit (per plan's own acceptance criteria for the no-op branch: "no-op인 경우: `git diff src/app/page.tsx`가 비어 있다")

**Plan metadata:** this commit (docs: complete plan) — see below (worktree mode: STATE.md/ROADMAP.md excluded, orchestrator updates centrally)

## Files Created/Modified

- `src/app/curriculum/page.tsx` — Added `ProgressSummary`, `ProgressReadError`, `DDayCountdown` imports; added `overallProgress`, `nextIncompleteLesson` to the existing `@/lib/progress` import; added `todayInSeoul`/`daysUntil` from `@/lib/today` and `COURSE_START_DATE` from `@/lib/schedule`; rendered `DDayCountdown` and the conditional progress section between the `<header>` and the Step-card grid. No other files touched.

## Decisions Made

1. **DDayCountdown placed above ProgressSummary** — the plan's Task 1 action text lists progress summary as priority-1 and D-day as priority-2, read here as "what to add, in importance order" rather than a mandated visual stack order (no acceptance criterion tests element order). Placing the compact, unconditional D-day widget first and the larger, cookie-conditional progress section second mirrors the home route's own top-to-bottom shape (compact orientation info near the top, detailed sections below), which better serves the phase's "같은 셸로 읽힌다" (SC2) goal than an arbitrary alternate order would.
2. **No pace/behind-lessons sections added to `/curriculum`** — Task 1's `<action>` names only "전체 진행률" and "D-day" as the two things to pull in; pace status and missed-lesson lists are home's "오늘의 학습" framing, not curriculum-map framing. Adding them would be scope creep against the plan's own enumerated list and against the timebox instruction naming this plan the first v2-drop candidate if it balloons.
3. **Home task executed as a no-op, not skipped silently** — per the plan's own instructions for this exact D-97-verdict branch, the decision and its numeric basis are recorded here (see "D-97 Verdict Applied" above) rather than omitted.

## Deviations from Plan

### Auto-fixed Issues

None — no bugs, missing functionality, or blocking issues were found in the scope of this plan's own files.

### Environment-only setup (not deviations from plan output, no repo files changed)

**1. [Rule 3 - Blocking] Fresh worktree had no `node_modules`**
- **Found during:** pre-Task-1 verification setup
- **Issue:** Same class of issue documented in 06-01/06-02/06-04 SUMMARYs — `git worktree add` does not create `node_modules`.
- **Fix:** Ran `npm ci` (525 packages, ~35s) at the worktree root.
- **Files modified:** none (gitignored)
- **Committed in:** N/A

**2. [Rule 3 - Blocking] Cold worktree Velite race**
- **Found during:** pre-build setup
- **Issue:** Same defect class as 06-01/06-02 Deviation — `next.config.ts`'s fire-and-forget `velite.build()` isn't awaited by Next's config load.
- **Fix:** Ran `npx velite build` once before building/serving.
- **Files modified:** none
- **Committed in:** N/A

**3. [Rule 3 - Blocking] `.env.local` not present in the worktree (gitignored, not copied on worktree creation)**
- **Found during:** `npx next build` failing on missing `SUPABASE_URL`
- **Issue:** Same as 06-01/06-02/06-04's documented finding.
- **Fix:** Wrote a plan-unique env-wrapper script (`build-with-env-0607.mjs`, scratchpad-only, not committed) that reads the main repo's `.env.local` by absolute path into `process.env` and `spawnSync`s the target command — same pattern 06-01/06-04 established. Used a `0607`-suffixed filename per this plan's parallel-execution instructions to avoid clobbering the sibling wave-3 agent's scratchpad files.
- **Files modified:** none
- **Committed in:** N/A

**Total deviations:** 0 auto-fixed code changes; 3 environment-only setup workarounds (all replicate patterns already documented and accepted in prior wave summaries for this repo's worktree-isolation class of issue).
**Impact on plan:** None on committed deliverables — both tasks' acceptance criteria are met as specified.

## Issues Encountered

- The plan's Task 1 acceptance criterion `grep -c 'force-dynamic' src/app/curriculum/page.tsx`가 1 does not hold (actual count is 2) — but this is **pre-existing**, not introduced by this plan: the file's `read_first`-referenced comment block (lines 7–10, untouched by this diff) already contains the literal string "force-dynamic" in Korean prose above the actual `export const dynamic = "force-dynamic";` declaration. `git diff` confirms this plan's edit did not touch that comment region. The rendering-strategy intent the criterion is checking for (`force-dynamic` still declared, still called first) is intact and verified separately (`export const dynamic = "force-dynamic"` line present, `hasUnlockCookie()` still the first call). Not treated as a deviation requiring a fix since nothing is broken; noted here for traceability.

## User Setup Required

None — no external service configuration required. `UNLOCK_SECRET` was already present in the main repo's `.env.local` (pre-existing from earlier phases); this plan only read it in-process for one-off verification scripts and never logged, wrote, or printed its value.

## Next Phase Readiness

- `/curriculum` and `/` both now correctly reflect their D-90/D-97 dispositions: `/curriculum` reshuffled, `/` explicitly closed with numeric justification recorded in two places (`06-D97-MEASUREMENT.md` and this summary).
- No new tech debt: zero new Supabase queries, zero new `src/lib` functions, zero component-file changes — the entire diff is prop-wiring inside one route file.
- Worktree bootstrap for this repo continues to need, in order: (1) `npx velite build` once, (2) `npm ci` for `node_modules`, (3) a per-plan (not shared) env-wrapper script pointing at the main repo's `.env.local` — this plan's fourth confirmation of the same three-step pattern documented by 06-01/06-02/06-04.

---
*Phase: 06-site-wide-design-polish*
*Completed: 2026-08-26*
