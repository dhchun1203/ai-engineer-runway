---
phase: 06-site-wide-design-polish
plan: 08
subsystem: quality-gates
tags: [playwright, design-tokens, viewport-overflow, uat, phase-closeout]

# Dependency graph
requires:
  - phase: 06-site-wide-design-polish (plan 01)
    provides: "check-design-tokens.mjs static gate (rule c default-disabled), e2e-typography.mjs runtime gate, --text-* token namespace"
  - phase: 06-site-wide-design-polish (plans 03, 04, 05, 06)
    provides: "66/66 arbitrary-value typography spots migrated across 23 files — the D-95 ordering precondition this plan's flag flip depends on"
  - phase: 06-site-wide-design-polish (plan 06)
    provides: "data-section-tape / data-locked-notice attributes and #lesson-article prose container id — used as the overflow gate's lesson-route wait selector"
  - phase: 06-site-wide-design-polish (plan 07)
    provides: "06-D97-MEASUREMENT.md's home empty-canvas verdict — referenced by this plan's UAT-3"
provides:
  - "scripts/e2e-mobile-overflow.mjs — new runtime gate closing D-91 (375x667/768x1024/1024x768 document-level overflow, 21 route x viewport combos)"
  - "scripts/check-design-tokens.mjs with ENFORCE_ARBITRARY_VALUES=true by default — the arbitrary-value gate is now always-on (D-88c, D-95)"
  - "06-UAT.md — 9 concrete human-verification items (UAT-1 real-device Safari, UAT-2a-f backstop visuals, UAT-3 home re-check, plus Task 4's SC2 6-screen consistency check deferred here as test 9)"
affects: []

# Actuals (#2632)
actuals:
  tokens: 8400
  tasks: 4
  commits: 4

tech-stack:
  added: []
  patterns:
    - "Local-scrollable-ancestor exclusion for sub-pixel overflow checks — an element whose ancestor chain (up to but excluding documentElement) has computed overflow-x auto/scroll is skipped from the getBoundingClientRect().right max, because that content is intentionally locally scrollable (table wrappers, code blocks) and document-level scrollWidth/clientWidth already governs whether the page itself scrolls"
    - "hasContent=false lesson fallback: when the manifest has zero such lessons (this repo's actual state, all 35 lessons have content), the gate substitutes a nonexistent lesson slug to exercise the notFound()-rendered shell route instead, logging the substitution explicitly rather than silently skipping the shell-only route class"

key-files:
  created:
    - scripts/e2e-mobile-overflow.mjs
    - .planning/phases/06-site-wide-design-polish/06-UAT.md
  modified:
    - scripts/check-design-tokens.mjs

key-decisions:
  - "e2e-mobile-overflow.mjs's default port is 3213 (e2e-typography.mjs uses 3212) — confirmed distinct to avoid port collisions when both Playwright gates run back-to-back in the same suite"
  - "Sub-pixel right-edge check (the scrollWidth/clientWidth-rounding backstop the plan required) excludes elements inside a local overflow-x:auto/scroll ancestor — the first unfiltered version produced 2 false-positive violations (a table at 439px and a code-block span at 445px, both legitimately scrolling within their own wrapper) that would have failed the gate despite zero actual document-level overflow; this was caught and fixed before the first passing run, not shipped as a known issue"
  - "Task 4 (checkpoint:human-verify, gate=blocking, SC2 6-screen visual consistency) was deferred into 06-UAT.md as test 9 per user decision at the checkpoint, invoking the project's human_verify_mode=end-of-phase config policy (already applied by 06-01 to its own iPad item) — not approved ad hoc mid-execution. The exact verification steps from the checkpoint report (6 localhost URLs, both viewports, the 4-point nav/margin/card/lesson checklist, the pass criterion) were transcribed into the UAT file verbatim so a human can follow it later without re-deriving anything"
  - "UAT-2d (lesson pager long-text backstop) documents a discovered discrepancy between 06-UI-SPEC.md's backstop description and 06-06's shipped implementation: the pager renders fixed short labels ('이전 레슨'/'다음 레슨' + one chevron, per D-R4K-7's literal-arrow removal), not the adjacent lesson's title — so a long adjacent-lesson title cannot structurally cause pager-label wrapping under the code as shipped. The UAT item was reworded to check the actually relevant thing (two-button stacking at 375px) instead of asking a human to hunt for an impossible scenario"

requirements-completed: [SC1, SC3, SC4]

coverage:
  - id: D1
    description: "e2e-mobile-overflow.mjs measures document.documentElement.scrollWidth <= clientWidth (equality passes) plus a sub-pixel getBoundingClientRect().right backstop, across 375x667/768x1024/1024x768 x 7 routes (5 route pages, 1 content lesson with a table, 1 not-found shell substituted for the 0 hasContent=false lessons found) = 21 combos, all pass. Pre-measurement hidden-overflow guard (T-06-22) verified live: temporarily injected overflow-x:hidden on body, confirmed all 21 combos fail with an explicit guard-violation message, then reverted with a clean git diff"
    requirement: "SC3"
    verification:
      - kind: e2e
        ref: "node --env-file=.env.local scripts/e2e-mobile-overflow.mjs (exit 0, 21/21 combos); manual hidden-overflow injection test (exit 1, 21/21 combos, reverted)"
        status: pass
    human_judgment: false
  - id: D2
    description: "check-design-tokens.mjs's ENFORCE_ARBITRARY_VALUES flipped true — flag-less default run now enforces rule (c) and exits 0 (0 residual violations after --strict confirmed 0 before the flip). Allowlist unchanged at exactly 2 tokens (the same about/page.tsx decorative marker 06-01/06-04 registered)"
    requirement: "SC1"
    verification:
      - kind: other
        ref: "node scripts/check-design-tokens.mjs (flag-less, exit 0); grep -c 'ENFORCE_ARBITRARY_VALUES = true' == 1; allowlist Map still has exactly 1 file entry / 2 tokens"
        status: pass
    human_judgment: false
  - id: D3
    description: "Full 13-gate suite (9 static + 4 e2e, static-first per the plan's fast-fail-first ordering) run twice consecutively, all 13 exit 0 both times — check-brand, check-design-tokens, check-lesson-structure, check-manifest, check-pace, check-progress-gates, check-progress-math, check-schedule, check-supabase-progress, e2e-progress, e2e-today, e2e-typography, e2e-mobile-overflow. package.json has zero diff (no integrated runner script added, per the plan's explicit prohibition). next build also verified green (44 pages) as an out-of-band sanity check"
    requirement: "SC4"
    verification:
      - kind: other
        ref: "13 gates x 2 consecutive runs, all exit 0 (26/26 individual invocations); git diff package.json empty; npx next build exit 0"
        status: pass
    human_judgment: false
  - id: D4
    description: "06-UAT.md written with 9 concrete, human-checkable tests: UAT-1 (real-device iPad Safari, 6 screens x 2 orientations), UAT-2a-f (the 6 backstop visual items from 06-UI-SPEC.md's UI Considerations table, each with a real lesson-slug URL — the longest-titled lesson 2-4-project-ai-shop-frontend used for long-text checks), UAT-3 (D-97 home empty-canvas re-check). No placeholder '확인한다' instructions — every item names the exact URL and steps"
    verification:
      - kind: other
        ref: "test -f 06-UAT.md; grep -c 'http\\|/lesson/\\|/curriculum\\|/schedule' == 19 (>=1 per test); node scripts/check-brand.mjs exit 0"
        status: pass
    human_judgment: false
  - id: D5
    description: "SC2 (6 screens read as one shell at iPad portrait/landscape) — a pure visual-consistency judgment, not reducible to a pixel assertion. Deferred from the plan's Task 4 checkpoint into 06-UAT.md test 9, per human_verify_mode=end-of-phase and the user's explicit checkpoint decision. Not yet verified — awaiting /gsd-verify-work 06"
    requirement: "SC2"
    verification: []
    human_judgment: true
    rationale: "Task 4 was a checkpoint:human-verify (gate=blocking) requiring a human to judge cross-screen visual consistency. Auto mode was not active in this session (auto_advance=false, _auto_chain_active=false per .planning/config.json), so the executor correctly stopped rather than self-approving. The user then explicitly deferred this to end-of-phase UAT rather than approving ad hoc mid-execution, matching the project's configured policy and 06-01's own precedent for its iPad confirmation item. The exact checkpoint verification steps were transcribed verbatim into 06-UAT.md test 9 so nothing is lost or re-derived later."

duration: ~2h10min
completed: 2026-08-26
status: complete
---

# Phase 6 Plan 8: Phase Closeout — Overflow Gate, Arbitrary-Value Gate Flip, UAT Summary

**Closed Phase 6 with three things: a new runtime gate (`e2e-mobile-overflow.mjs`) proving zero document-level horizontal overflow at 375/768/1024px across 21 route x viewport combinations (D-91, closing a truth that went unconfirmed for two consecutive phases), the final flip of `check-design-tokens.mjs`'s arbitrary-value rule to default-on now that all 66 legacy spots are migrated (D-88c/D-95), and a 9-item `06-UAT.md` — including the SC2 6-screen visual-consistency check, deferred here per the project's end-of-phase verification policy rather than approved mid-execution.**

## Performance

- **Duration:** ~2h10min (includes worktree bootstrap: `npm ci` for `node_modules`, `npx velite build` for `.velite/`, both absent on worktree creation — same pattern every prior plan in this phase documented)
- **Completed:** 2026-08-26T07:31:15Z
- **Tasks:** 4 (3 auto tasks executed + committed; Task 4 checkpoint resolved by user decision as deferred-to-uat, closed with a UAT-file amendment + this summary, no code)
- **Files modified:** 3 (2 created: `scripts/e2e-mobile-overflow.mjs`, `.planning/phases/06-site-wide-design-polish/06-UAT.md`; 1 modified: `scripts/check-design-tokens.mjs`)

## Accomplishments

- Built `scripts/e2e-mobile-overflow.mjs`: a new Playwright runtime gate that boots a dev server (reusing `e2e-typography.mjs`'s bootstrap, distinct default port 3213), then for 7 routes x 3 viewports (375x667/768x1024/1024x768) asserts `document.body`/`documentElement` computed `overflow-x` is never `hidden` before measuring, checks `documentElement.scrollWidth <= clientWidth` (equality passes), and backstops with a sub-pixel `getBoundingClientRect().right` max check that correctly excludes elements inside a locally scrollable ancestor (table wrappers, code blocks) — 21/21 combos pass with zero document-level overflow
- Verified the gate's own false-positive defense live: temporarily injected `overflow-x: hidden` on `body` in `globals.css`, ran the gate, confirmed all 21 combos fail with an explicit `T-06-22` guard-violation message, then reverted the CSS with a clean `git diff`
- Flipped `check-design-tokens.mjs`'s `ENFORCE_ARBITRARY_VALUES` constant from `false` to `true` — the arbitrary-bracket/default-palette-color rule (rule c) is now enforced by default with zero flags, closing D-88c/D-95 now that the D-95 ordering precondition (66/66 legacy spots migrated across 06-01/03/04/05/06) is satisfied. Confirmed `--strict` reported 0 residual violations before flipping, and the flag-less run reports 0 violations after
- Ran the complete 13-gate suite (9 static gates first, then 4 Playwright e2e gates, per the plan's fast-fail-first ordering) twice consecutively — all 13 exit 0 both times, confirming idempotence and zero regression across the whole phase's changes
- Wrote `06-UAT.md`: 9 concrete tests covering everything that cannot be automated — real-device iPad Safari (Chromium cannot see Safari's `-webkit-` differences or real touch hit-boxes), 6 backstop visual items named explicitly in `06-UI-SPEC.md`'s UI Considerations table (each with a real lesson-slug URL, using the course's actual longest lesson title `[Project 1] AI 쇼핑몰 프론트엔드 준비 가이드` / `2-4-project-ai-shop-frontend` for long-text checks), the D-97 home empty-canvas re-confirmation, and — added after the Task 4 checkpoint resolution — the SC2 6-screen shell-consistency check

## Task Commits

Each task was committed atomically:

1. **Task 1: 뷰포트 가로 오버플로 게이트 신설 (D-91)** — `9925ebc` (feat)
2. **Task 2: 임의값 게이트 활성화 + 게이트 13종 전체 스위트 (D-88c, D-94, D-95)** — `2a1008e` (feat)
3. **Task 3: 자동화 불가 항목을 UAT로 기록 (D-93)** — `ee1bd94` (docs)
4. **Task 4: 6종 화면 시각 일관성 사람 검수 (SC2)** — checkpoint reached and returned per plan (`autonomous: false`, auto mode inactive); resolved by explicit user decision as **deferred-to-uat**, not approved ad hoc. Closed via a `06-UAT.md` amendment — `4707eec` (docs, adds test 9 with the checkpoint's exact verification steps)

**Plan metadata:** this commit (docs: complete plan) — see below (worktree mode: STATE.md/ROADMAP.md excluded, orchestrator updates centrally)

## Files Created/Modified

- `scripts/e2e-mobile-overflow.mjs` (new) — Runtime viewport-overflow gate: hidden-guard assertion, scrollWidth/clientWidth equality check, sub-pixel right-edge backstop with scrollable-ancestor exclusion, table-wrapper observation logging, hasContent=false lesson fallback logic
- `scripts/check-design-tokens.mjs` — `ENFORCE_ARBITRARY_VALUES` flipped `false` -> `true`; header/inline comments updated to describe the now-default-on state; success-message wording clarified to name the actual trigger (constant vs. `--strict` flag) instead of always crediting `--strict`
- `.planning/phases/06-site-wide-design-polish/06-UAT.md` (new) — 9 concrete UAT tests (UAT-1 real-device Safari, UAT-2a-f backstop visuals, UAT-3 home re-check, test 9 = deferred SC2 checkpoint)

## Decisions Made

1. **`e2e-mobile-overflow.mjs`'s default port (3213) confirmed distinct from `e2e-typography.mjs`'s (3212)** — required so the two Playwright gates don't collide when run back-to-back in the full 13-gate suite, per the plan's own acceptance criteria.
2. **Sub-pixel right-edge check excludes elements inside a local `overflow-x:auto`/`scroll` ancestor.** The first unfiltered implementation flagged 2 false positives (a table extending to 439px inside its `overflow-x-auto` wrapper on `/about`, and a code-block-internal `span` at 445px on the lesson page) — both are intentional local scroll content the plan's own "표 특례" (table exception) principle already carves out as observation-only, not a document-level violation. Extended the same principle to the general sub-pixel backstop rather than shipping a gate that would permanently fail on the site's own table/code-block components.
3. **Task 4's SC2 checkpoint deferred to `06-UAT.md` rather than approved ad hoc**, per explicit user instruction at the checkpoint. This is not a plan deviation — `autonomous: false` and auto mode being inactive (`auto_advance: false`, `_auto_chain_active: false`) meant the executor correctly stopped and returned the checkpoint per protocol; the user's subsequent decision to defer (citing the project's `human_verify_mode: end-of-phase` config, already applied by 06-01 to its own iPad item) was made through the proper channel, not bypassed.
4. **`06-UAT.md`'s UAT-2d (lesson pager long-text) item reworded after discovering an implementation reality**: 06-06 shipped the pager with fixed short labels (`이전 레슨`/`다음 레슨` + one chevron, per D-R4K-7), not the adjacent lesson's actual title — so a long adjacent-lesson title structurally cannot cause pager-label wrapping under the code as shipped. Rather than leave a UAT instruction asking a human to hunt for a scenario the code makes impossible, the item was reworded to check what's actually relevant (two-button stacking at 375px) and the discrepancy documented inline for future readers.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Sub-pixel overflow check produced false positives on legitimately-scrollable content**
- **Found during:** Task 1, first run of `e2e-mobile-overflow.mjs` against the real dev server
- **Issue:** The plan-required sub-pixel `getBoundingClientRect().right` backstop, implemented as a naive "max right across every element on the page," flagged the `/about` table (which correctly scrolls inside its `overflow-x-auto` wrapper per 06-06) and a lesson-page code-block-internal `span` as violations, even though `document.documentElement.scrollWidth <= clientWidth` was already true (375px === 375px) — the document itself was not overflowing; only content deliberately contained in a local horizontal-scroll wrapper was.
- **Fix:** Added a `hasScrollableAncestor()` walk that excludes any element whose ancestor chain (excluding `documentElement` itself) has computed `overflow-x` of `auto`/`scroll` from the max-right calculation — this generalizes the plan's own "표 특례" (table exception, explicitly observation-only) principle to any local-scroll container, not just tables.
- **Files modified:** `scripts/e2e-mobile-overflow.mjs`
- **Verification:** Re-ran the gate after the fix — all 21 combos pass with 0 false positives; the hidden-overflow guard test (deliberately injecting `overflow-x: hidden`) still correctly fails all 21 combos afterward, confirming the fix didn't weaken the guard itself.
- **Committed in:** `9925ebc` (Task 1 commit — fixed before the first commit, not shipped as a known bug)

---

**Total deviations:** 1 auto-fixed (Rule 1, caught and fixed within Task 1 before any commit — not a post-hoc patch)
**Impact on plan:** None on scope — the fix is entirely within `scripts/e2e-mobile-overflow.mjs`, the plan's own declared file for Task 1, and makes the gate correctly distinguish "document overflows" from "a component has its own intentional local scroll," which is exactly what the plan's own table-exception principle already established for one case.

## Checkpoint Resolution (Task 4)

Task 4 was a `checkpoint:human-verify` (`gate="blocking"`) requiring a human to visually judge
whether 6 screens read as one consistent shell at iPad portrait/landscape (SC2). Auto mode was
not active in this session (`workflow.auto_advance: false`, `_auto_chain_active: false` in
`.planning/config.json`), so per the standard checkpoint protocol the executor stopped and
returned the full checkpoint state (completed tasks, exact verification URLs/steps, pass
criterion) rather than self-approving.

The coordinator relayed the user's decision: **defer to end-of-phase UAT**, not approve ad hoc.
Rationale recorded here per the coordinator's instruction:

- `.planning/config.json` sets `workflow.human_verify_mode: "end-of-phase"` — this project's
  configured policy collects human visual verification at phase end, not mid-plan. 06-01's
  executor already applied this same policy to its own lesson-page typography confirmation item
  (see 06-01-SUMMARY.md coverage D6).
- `06-UAT.md` (this plan's own Task 3 deliverable) is the artifact designed to carry exactly this
  kind of item forward — `/gsd-verify-work` walks each item and records pass/fail, a strictly
  better path than an ad-hoc approval mid-execution with no persistent record.
- Task 4 has no code — nothing is left unimplemented by deferring it.

**Action taken:** amended `06-UAT.md` with a new test 9, transcribing the checkpoint report's
exact verification steps verbatim (the 6 `localhost:3000` URLs, both viewports, the 4-point
nav-position/container-margin/card-shape/lesson-screen checklist, and the "one site built by
one person" pass criterion) so a human can execute it later without re-deriving anything.
Committed as `4707eec`. Task 4's acceptance is satisfied by this concrete, human-checkable
artifact existing — not by a synthetic pass/fail recorded by this executor.

## Issues Encountered

None beyond the deviation documented above. All three auto tasks' `<verify>` blocks and
acceptance criteria passed after that one fix; the 13-gate full-suite double-run and the
hidden-overflow guard test both behaved exactly as the plan's acceptance criteria specified.

## User Setup Required

None — no external service configuration required. `.env.local` (gitignored, not copied into
the worktree) was read via the same `--env-file=<main-repo-absolute-path>/.env.local` workaround
every prior plan in this phase documented; no repo files were changed by that workaround.

## Next Phase Readiness

- All 4 measurable success criteria's automated evidence is closed: SC1 (arbitrary-value gate
  default-on, 0 violations), SC3 (0 document-level horizontal overflow across 21 route x viewport
  combos), SC4 (13/13 gates green, twice consecutively, idempotent). SC2 (6-screen visual
  consistency) has its verification artifact (`06-UAT.md` test 9) in place but is **not yet
  verified** — it awaits a human running `/gsd-verify-work 06`.
- `06-UAT.md` now carries all 9 outstanding human-verification items for this phase in one place:
  UAT-1 (real-device Safari), UAT-2a-f (6 backstop visuals), UAT-3 (D-97 home re-check), and test
  9 (the deferred SC2 checkpoint). This is the single entry point `/gsd-verify-work 06` should
  read to close out Phase 6.
- The `hasScrollableAncestor()` exclusion pattern in `e2e-mobile-overflow.mjs` is available as
  precedent for any future runtime gate that needs to distinguish "document overflows" from
  "a component has its own intentional local scroll."
- Phase 6's own claims (token migration, shell unification, 3 new/enabled gates) are now backed
  by an executable, idempotent, two-run-verified test suite rather than plan-time assertions —
  the phase's stated purpose ("이 Phase의 주장이 다음 Phase에서 조용히 썩지 않도록 실행 가능한
  검사로 못박는다") is met for everything except the one inherently-visual criterion.

---
*Phase: 06-site-wide-design-polish*
*Completed: 2026-08-26*

## Self-Check: PASSED

- FOUND: scripts/e2e-mobile-overflow.mjs
- FOUND: scripts/check-design-tokens.mjs
- FOUND: .planning/phases/06-site-wide-design-polish/06-UAT.md
- FOUND: commit 9925ebc (Task 1)
- FOUND: commit 2a1008e (Task 2)
- FOUND: commit ee1bd94 (Task 3)
- FOUND: commit 4707eec (Task 4 — UAT amendment)
