---
phase: 06-site-wide-design-polish
plan: 02
subsystem: ui
tags: [typography, design-tokens, playwright, ui-spec, measurement]

# Dependency graph
requires:
  - phase: 06-site-wide-design-polish (plan 01)
    provides: "--text-* Tailwind v4 typography token namespace (5 sizes/3 weights) proven end-to-end on the lesson page"
provides:
  - "01-UI-SPEC.md Typography table superseded with D-R4K-4's 5-role/3-weight scale — repo has one non-contradictory type contract"
  - "06-D97-MEASUREMENT.md: cookie-state-dependent empty-canvas measurement for the home route, with a binding verdict for 06-07's scope"
affects: [06-07, 06-08]

# Actuals (#2632)
actuals:
  tokens: 2808
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "One-off measurement scripts (D-97-style) are written to the worktree root, run, and deleted before commit — never left in scripts/ as a permanent gate when the plan explicitly calls the check a single verdict, not a recurring one"
    - "data-schedule-ui / data-progress-ui attributes on section roots make Playwright section-presence checks robust without relying on brittle text/class selectors"

key-files:
  created:
    - .planning/phases/06-site-wide-design-polish/06-D97-MEASUREMENT.md
    - ".planning/ui-reviews/06-d97/ (3 screenshots)"
  modified:
    - .planning/phases/01-deployed-curriculum-skeleton/01-UI-SPEC.md

key-decisions:
  - "D-97 verdict: home stays out of 06-07's scope — cookie-present (real-user) state measures 0% empty at 768x1024, well under the 30% threshold, versus the cookie-less state's 55.6% which matches 04-UI-REVIEW's original finding almost exactly"
  - "/curriculum is explicitly carved out of the D-97 verdict — it's empty-canvas in both cookie states (StepCard grid only), so 06-07's /curriculum work proceeds regardless of this measurement"
  - "01-UI-SPEC.md's Typography section keeps its own supersession notice (not just a pointer) so a reader who opens only 01-UI-SPEC.md still sees the current 5-role/3-weight table and the reason it changed, without needing to cross-reference 06-UI-SPEC.md first"

requirements-completed: [SC1, SC2]

coverage:
  - id: D1
    description: "01-UI-SPEC.md's Typography table replaced with the 5-role/3-weight scale (display/heading/subhead/body/label/inline-code at 30/22/17/16/14/15px, weights 700/700/700/400/400·600/400), with a supersession notice citing D-R4K-4 and 06-UI-SPEC.md"
    requirement: "SC1"
    verification:
      - kind: other
        ref: "node scripts/check-brand.mjs (exit 0); grep -c 'text-display' 01-UI-SPEC.md (1 match); git diff --stat shows exactly one changed file"
        status: pass
    human_judgment: false
  - id: D2
    description: "D-97 measurement: cookie-less and cookie-present home states measured at 768x1024, with empty-area percentage, section presence, and a binding verdict recorded in 06-D97-MEASUREMENT.md"
    requirement: "SC2"
    verification:
      - kind: other
        ref: "playwright:.planning/ui-reviews/06-d97/home-768-no-cookie.png, home-768-with-cookie.png, curriculum-768-with-cookie.png; 06-D97-MEASUREMENT.md documents 55.6%/0% empty ratios and 5-section presence delta"
        status: pass
    human_judgment: false

duration: ~25min
completed: 2026-08-26
status: complete
---

# Phase 6 Plan 2: Typography Contract Reconciliation + D-97 Empty-Canvas Measurement Summary

**D-97 판정: 홈은 작업하지 않는다 — 쿠키 있는 실사용 상태의 홈 빈 영역이 0%(768×1024)로 30% 기준선을 크게 밑돌아, D-90의 홈 재배치 범위를 이 플랜에서 종료한다.** 두 가지 정산 작업: `01-UI-SPEC.md`의 Typography 표를 D-R4K-4의 5종/3굵기 값으로 갱신해 저장소의 모순되는 타입 계약을 하나로 통일했고, 04-UI-REVIEW의 "홈 55% 빈 캔버스"가 잠금 해제 쿠키 없는 세션에서만 관측되는 값임을 Playwright 스크린샷과 숫자로 실증했다.

## Performance

- **Duration:** ~25 min
- **Started:** 2026-08-26T04:20:00Z
- **Completed:** 2026-08-26T04:45:00Z
- **Tasks:** 2
- **Files modified:** 5 (1 doc edit + 1 doc created + 3 screenshots)

## Accomplishments

- Replaced `01-UI-SPEC.md`'s Typography table (4 roles/2 weights) with the 5-role/3-weight scale from `06-UI-SPEC.md` (display 30px/700, heading 22px/700, subhead 17px/700, body 16px/400, label 14px/400·600, inline code 15px/400), added a supersession notice citing D-R4K-4 and 04-UI-REVIEW's Pillar 4 runtime finding, and updated the Application Map to the new role names
- Appended a one-line Section Tape 24px width-floor exception to the Spacing Scale's existing exceptions list, without touching the 44px touch-target rule body
- Wrote a one-off (not committed to `scripts/`) Playwright measurement script that boots the dev server on port 3214, opens a 768×1024 Chromium context, screenshots the home route in both cookie-less and cookie-present states, computes the empty-viewport-area percentage from `<main>`'s last child bounding rect, checks presence of all 5 home sections via `data-schedule-ui`/`data-progress-ui` attributes, and screenshots `/curriculum` once for reference — then deleted the script before committing
- Measured and recorded: cookie-less home = 55.6% empty (D-day + today-card only), cookie-present home = 0% empty (all 5 sections render, content exceeds viewport) — confirming 04-UI-REVIEW's 55% figure came from the pre-unlock session state that real single-user traffic never actually experiences
- Wrote `06-D97-MEASUREMENT.md` with the numeric verdict, section-presence table, screenshot references, and an explicit carve-out noting `/curriculum` remains empty-canvas in both cookie states and is unaffected by this verdict

## Task Commits

Each task was committed atomically:

1. **Task 1: 01-UI-SPEC.md Typography 표 5종/3굵기 개정 (D-R4K-4)** - `1b9fc8a` (docs)
2. **Task 2: D-97 실측 — 쿠키 있는 홈의 빈 캔버스 비율 확정** - `cf9176e` (docs)

**Plan metadata:** this commit (docs: complete plan) — see below

## Files Created/Modified

- `.planning/phases/01-deployed-curriculum-skeleton/01-UI-SPEC.md` - Typography section replaced with 5-role/3-weight table + supersession notice; Spacing Scale exceptions list gained the Section Tape width-floor line
- `.planning/phases/06-site-wide-design-polish/06-D97-MEASUREMENT.md` - Empty-canvas measurement results, section-presence table, verdict
- `.planning/ui-reviews/06-d97/home-768-no-cookie.png` - Cookie-less home screenshot, 768×1024
- `.planning/ui-reviews/06-d97/home-768-with-cookie.png` - Cookie-present home screenshot, 768×1024
- `.planning/ui-reviews/06-d97/curriculum-768-with-cookie.png` - Reference screenshot, `/curriculum`, cookie-present, 768×1024

## Decisions Made

1. **D-97 verdict is "don't touch the home route" (Task 2)** — the cookie-present empty ratio (0%) is not just under the 30% threshold, it's at the floor (content exceeds the viewport entirely). No ambiguity requiring a judgment call.
2. **Measurement script written to worktree root and deleted post-run, not placed in `scripts/`** — the plan's action text explicitly frames this as a one-time verdict, not a recurring gate; keeping it out of `scripts/` avoids implying it's meant to be re-run as part of the standard gate suite.
3. **Section presence detected via existing `data-schedule-ui`/`data-progress-ui` attributes** already present on `DDayCountdown`, `TodayLessonCard`, `PaceStatusPanel`, `BehindLessonsList`, and `ProgressSummary` — no new test IDs or markup needed, kept the measurement script fully read-only with respect to `src/`.

## Deviations from Plan

**1. [Rule 3 - Blocking] Fresh worktree had no `node_modules` at all**
- **Found during:** pre-Task-1 setup (verifying `check-brand.mjs` could run)
- **Issue:** This worktree was created without an `npm install` step — `node_modules/` was entirely absent, so neither `check-brand.mjs`'s dependencies-free run nor the Task 2 Playwright measurement could execute.
- **Fix:** Ran `npm install` (525 packages, ~31s) at the worktree root. Playwright's Chromium binary was already present in the shared `%LOCALAPPDATA%\ms-playwright` cache from 06-01's prior work in a sibling worktree, so no browser download was needed.
- **Files modified:** none (environment-only; `node_modules/` is gitignored)
- **Verification:** `node scripts/check-brand.mjs` ran clean (86 files, 0 violations) after install.
- **Committed in:** N/A (environment-only workaround, no repo files changed)

**2. [Rule 3 - Blocking] `.env.local` not present in the worktree (gitignored, not copied on worktree creation)**
- **Found during:** Task 2 precondition check
- **Issue:** Same class of issue documented in 06-01-SUMMARY.md Deviation 3 — `.env.local` is gitignored and `git worktree add` does not copy it.
- **Fix:** Ran the D-97 measurement script with `node --env-file="<main-repo>/.env.local"` against the main repo's absolute path, exactly as 06-01 did for its env-dependent scripts.
- **Files modified:** none
- **Verification:** `UNLOCK_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` all resolved; the measurement script ran to completion and produced correct results (cookie state actually flipped between the two home screenshots, confirmed by the 55.6%→0% delta and the section-presence table).
- **Committed in:** N/A (environment-only workaround, no repo files changed)

**3. [Rule 3 - Blocking] Cold worktree Velite race (same defect class as 06-01 Deviation 4)**
- **Found during:** pre-Task-2 setup
- **Issue:** `next.config.ts`'s fire-and-forget `velite.build({ watch: isDev })` isn't awaited by Next's config load, so a dev server on a cold worktree (`.velite/` absent) can start serving 500s before Velite's first build finishes.
- **Fix:** Ran `npx velite build` once before invoking the measurement script, matching 06-01's documented workaround.
- **Files modified:** none
- **Verification:** The subsequent measurement script run hit no `Module not found: Can't resolve '#site/content'` errors.
- **Committed in:** N/A (environment-only workaround, no repo files changed)

---

**Total deviations:** 3 (all environment-only setup workarounds, no repo-file changes, no scope creep — all three replicate patterns already documented and accepted in 06-01-SUMMARY.md for the same worktree-isolation class of issue)
**Impact on plan:** None on the committed deliverables. Both tasks' acceptance criteria are met exactly as specified; the deviations were prerequisites for running verification at all, not changes to what was verified.

## Issues Encountered

None beyond the deviations above.

## User Setup Required

None - no external service configuration required. `UNLOCK_SECRET` was already present in the main repo's `.env.local` (pre-existing from earlier phases); this plan only read it, via `process.env`, exactly once, and never logged, wrote, or screenshotted its value.

## Next Phase Readiness

- **06-07 must read this SUMMARY's first line before scoping its home-page work** — the D-97 verdict is binding: home stays out of scope, `/curriculum` remains in scope regardless.
- The repository now has exactly one Typography contract (`01-UI-SPEC.md`, superseded-in-place by D-R4K-4's values) — no future plan needs to reconcile two documents.
- This plan touched zero files under `src/` — fully parallel-safe with the same wave's 06-03/06-04/06-05 substitution plans as designed.

---
*Phase: 06-site-wide-design-polish*
*Completed: 2026-08-26*
