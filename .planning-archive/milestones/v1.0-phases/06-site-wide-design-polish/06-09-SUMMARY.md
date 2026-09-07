---
phase: 06-site-wide-design-polish
plan: 09
subsystem: ui
tags: [nextjs, react, tailwind-v4, playwright, section-tape, gap-closure]

# Dependency graph
requires:
  - phase: 06-site-wide-design-polish (plan 06)
    provides: "SectionTape component, .prose h2 scroll-margin-top, .section-tape-cell:focus-visible"
  - phase: 06-site-wide-design-polish (plan 08)
    provides: "check-design-tokens.mjs strict mode, gate-sensitivity-recheck practice (deliberately break, confirm red, revert)"
provides:
  - "scripts/e2e-section-tape.mjs (14th automated gate) -- clicks every Section Tape cell across viewport x motion-mode combinations and asserts the displayed label matches the clicked section, stays inside the tape's bounds, doesn't overlap the bar, doesn't ellipsis on real titles, and produces zero document-level overflow"
  - "--section-tape-height / --section-tape-scroll-offset :root variables in globals.css -- single source for Section Tape geometry, consumed by both the CSS scroll-margin-top and the component's DOM-derived click threshold"
  - "Section Tape label repositioned to be an absolutely-positioned child of the tape container (not the button), eliminating the overflow-x-hidden clipping that G-06-2 reported"
affects: []

# Actuals (#2632)
actuals:
  tokens: 7700
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "CSS custom properties as the single source for a value consumed both by a plain CSS declaration (scroll-margin-top) and by JS (getComputedStyle().scrollMarginTop) -- eliminates a class of drift where the same conceptual value is hand-copied into two languages and only one gets updated"
    - "Tape-relative (not cell-relative) label placement for a sticky horizontal strip UI -- an absolutely-positioned overlay spanning the full container width, centered via inset-x-0 + justify-center + max-w-full, so the label's own maximum width is bounded by the container instead of by whichever cell happens to be narrow"

key-files:
  created:
    - scripts/e2e-section-tape.mjs
  modified:
    - src/components/section-tape.tsx
    - src/app/globals.css
    - .planning/phases/06-site-wide-design-polish/06-UI-SPEC.md

key-decisions:
  - "Section Tape label is centered across the full tape width rather than clamped to follow the current cell's horizontal position -- the 100%-opacity bar plus the label's own 2-digit number already communicate which cell is current, so JS-measured per-cell clamping wasn't worth its cost inside this phase's 2-day timebox; a CSS-only centered layout guarantees zero clipping regardless of which cell is current"
  - "No bottom-of-document fallback rule was added to updateCurrent() -- after deriving the click threshold from getComputedStyle(h2).scrollMarginTop, cell 6 (the last section) already landed on exactly the right index in all 5 gate combinations without any special-casing, so no unverified branch was added per the plan's explicit instruction"
  - "Sensitivity-check B's CSS push had to be -200px, not the plan's suggested -40px, to actually trip [라벨-경계] -- because the label is now tape-centered (not cell-anchored), a 375px tape has 90px+ of margin on each side even for the site's longest section title, so 40px of push is absorbed without crossing the boundary. Documented as a deviation below."

requirements-completed: [SC1, SC2, SC3, SC4]

coverage:
  - id: D1
    description: "New scripts/e2e-section-tape.mjs gate exists and, run against the unfixed component, exits 1 with [구간-불일치] on cells 2-6 at both 375px/768px and [라벨-경계] with a 30px+ clip at 375px -- proving the gate actually catches G-06-9/G-06-2 before any fix"
    requirement: "SC1"
    verification:
      - kind: e2e
        ref: "node --env-file=.env.local scripts/e2e-section-tape.mjs (run against pre-fix code, commit 595df81's parent state) -- exit 1, 30/30 checks failed, 25 [구간-불일치] hits (cells 2-6 x 5 viewport/motion/route combos), 13 [라벨-경계] hits including 31.9px/6.6px at 375px and 17.2px at 768px (matches 06-UAT.md's measured 32/32/7px and 17/17px within ~0.1-0.2px)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Clicking any of the 6 cells displays that section's own number+title, verified across 2 viewports x 2 motion modes on the primary lesson plus 1 more viewport/mode combo on the manifest's last lesson (30 checks total)"
    requirement: "SC2"
    verification:
      - kind: e2e
        ref: "node --env-file=.env.local scripts/e2e-section-tape.mjs (post-fix) -- exit 0, 0 [구간-불일치] across all 30 checks"
        status: pass
    human_judgment: false
  - id: D3
    description: "The current-section label never crosses the tape's left/right/top/bottom bounds (0.5px tolerance) and never ellipsizes on this course's real section titles, at 375px and 768px"
    requirement: "SC3"
    verification:
      - kind: e2e
        ref: "node --env-file=.env.local scripts/e2e-section-tape.mjs (post-fix) -- exit 0, 0 [라벨-경계]/[라벨-말줄임]/[라벨-없음]/[라벨-중복]/[라벨-겹침]/[테이프-미부착]/[문서-오버플로] across all 30 checks"
        status: pass
    human_judgment: false
  - id: D4
    description: "Tape geometry (height, scroll-margin-top offset) is defined in exactly one place in CSS and consumed (not re-typed) everywhere else -- no code path where the two values can independently drift again"
    requirement: "SC1"
    verification:
      - kind: other
        ref: "grep -c -- '--section-tape-height' src/app/globals.css == 4 (definition + 3 consumption/comment sites); grep -c -- '--section-tape-scroll-offset' == 3; grep -c 'calc(' == 2; grep -c 'scrollMarginTop' src/components/section-tape.tsx == 1; grep -n 'TAPE_HEIGHT_PX' section-tape.tsx | grep -v '//' | wc -l == 0 (no live code references remain, constant removed)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Full 14-gate suite (9 static + 5 e2e, sequential) plus next build all exit 0; package.json diff stays empty"
    requirement: "SC4"
    verification:
      - kind: other
        ref: "check-brand, check-design-tokens, check-lesson-structure, check-manifest, check-pace, check-progress-gates, check-progress-math, check-schedule, check-supabase-progress, e2e-progress, e2e-today, e2e-typography, e2e-mobile-overflow, e2e-section-tape -- all exit 0; npx next build exit 0; git diff --stat package.json empty"
        status: pass
    human_judgment: false
  - id: D6
    description: "Gate sensitivity re-check: deliberately breaking the fix (zeroing the DOM-derived threshold; pushing the label 200px left via a temporary CSS rule) each independently trips the gate red, and both were fully reverted with a clean git diff"
    verification: []
    human_judgment: true
    rationale: "This is a manual dev-time sensitivity exercise (06-08's established practice) rather than something the gate itself asserts about its own sensitivity -- recorded here as an audit trail, not something automatable inside the gate's own run."

duration: ~55min
completed: 2026-08-26
status: complete
---

# Phase 6 Plan 9: Section Tape Gap Closure (G-06-9, G-06-2) + Detection Gate Summary

**New `e2e-section-tape.mjs` gate (14th automated gate) that clicks every Section Tape cell and asserts the label matches, plus a single-CSS-source fix for the section-mismatch bug and a tape-relative label reposition that eliminates the label-clipping bug.**

## Performance

- **Duration:** ~55 min
- **Completed:** 2026-08-26
- **Tasks:** 3
- **Files modified:** 4 (1 new: `scripts/e2e-section-tape.mjs`; 3 modified: `section-tape.tsx`, `globals.css`, `06-UI-SPEC.md`)

## Accomplishments

- Built `scripts/e2e-section-tape.mjs`, a new Playwright-based gate cloning the bootstrap pattern from `e2e-mobile-overflow.mjs` (env var checks, server spawn/poll, Windows `taskkill` process-tree cleanup, `FatalError`, `finally` cleanup, "0 checks = fail" defense, Korean logs, `tN/총N` scenario numbering). It clicks all 6 cells on `/lesson/1-1-course-orientation` across 2 viewports x 2 `prefers-reduced-motion` modes (24 checks), plus all cells on the manifest's last lesson at 375px/reduce (6 more checks) — 30 total. Each click asserts 8 independent violation classes: `[구간-불일치]` (wrong section displayed), `[라벨-경계]` (label crosses tape bounds), `[라벨-없음]`, `[라벨-중복]`, `[라벨-말줄임]`, `[라벨-겹침]`, `[테이프-미부착]`, `[문서-오버플로]`.
- **Ran the new gate against the unfixed component first** (Task 1's core requirement): exit 1, all 30/30 checks failed. `[구간-불일치]` fired on cells 2-6 in all 5 combinations (25 hits), matching G-06-9 exactly. `[라벨-경계]` fired with clip values (31.9px/6.6px at 375px, 17.2px at 768px) that closely match 06-UAT.md's manually-measured 32/32/7px and 17/17px — direct evidence the new gate detects the real defect, not a proxy for it.
- Fixed G-06-9 by moving the tape-height/scroll-offset pair (previously three independent copies: a CSS literal, a TS constant, and a Tailwind `h-11` class) into a single `:root` block in `globals.css` (`--section-tape-height`, `--section-tape-scroll-offset` via `calc()`). `section-tape.tsx`'s click-threshold now reads `getComputedStyle(h2).scrollMarginTop` directly (with a DOM-measured height fallback) instead of comparing against a hand-typed number — the same value the browser used to land the heading, so the two numbers cannot drift again.
- Fixed G-06-2 by moving the current-section label out of the `button` (where it was clipped to the cell's narrow width by the tape's `overflow-x-hidden`) into a single absolutely-positioned child of the tape container, centered across the tape's full width (`inset-x-0` + `justify-center` + `max-w-full`) with `pointer-events-none` so it doesn't block cell clicks. Added `truncate` on the title span as the documented last-resort backstop (never triggers on this course's real titles — the gate asserts `[라벨-말줄임]` stays at 0).
- Ran the sensitivity re-check established in 06-08: deliberately zeroed the DOM-derived click threshold (gate failed with 25 `[구간-불일치]` hits) and deliberately pushed the label with a temporary CSS `transform` (gate failed with 18 `[라벨-경계]` hits at -200px). Both changes fully reverted; confirmed `git status --porcelain src/ scripts/` shows only the intended diff afterward.
- Ran the full 14-gate suite (9 static gates first, then 5 e2e gates sequentially to avoid port collisions) plus `next build` — all exit 0. `package.json` diff stayed empty throughout.
- Corrected `06-UI-SPEC.md`: the **current** state row in the interaction-state table now describes tape-relative label placement instead of the stale "칸 안에 표시" contract, and the `scroll-margin-top` code sample references the `:root` variable instead of the literal `52px`.

## Task Commits

Each task was committed atomically:

1. **Task 1: 구간 테이프 게이트 신설 + 수정 전 빨간불 확인 (탐지 공백 해소)** - `595df81` (feat)
2. **Task 2: 테이프 기하를 CSS 한 곳에서 정의하고 임계값을 거기서 유도한다 (G-06-9)** - `2d2da3e` (fix)
3. **Task 3: 라벨을 테이프 기준으로 배치해 잘림을 없애고, 게이트 감도와 14종 무회귀를 확인한다 (G-06-2)** - `f9baa52` (fix)

**Plan metadata:** this commit (docs: complete plan) — see below

## Files Created/Modified

- `scripts/e2e-section-tape.mjs` (new) - 14th automated gate; clicks every Section Tape cell and asserts label correctness, boundary containment, no overlap/ellipsis/duplication, sticky attachment, and zero document overflow
- `src/components/section-tape.tsx` - Added `data-section-tape-label`/`data-section-tape-label-title` attributes (Task 1); removed `TAPE_HEIGHT_PX`, derived click threshold from `getComputedStyle`, replaced `h-11` with the `.section-tape` CSS class (Task 2); moved the current-section label from a button child to an absolutely-positioned tape-relative overlay with `pointer-events-none` and `truncate` (Task 3)
- `src/app/globals.css` - Added `:root { --section-tape-height; --section-tape-scroll-offset }` single source and `.section-tape { height: ... }` rule; changed `.prose h2`'s `scroll-margin-top` from a `52px` literal to the `:root` variable reference
- `.planning/phases/06-site-wide-design-polish/06-UI-SPEC.md` - Corrected the **current** interaction-state row and the `scroll-margin-top` code sample to match the shipped tape-relative-label / CSS-variable implementation

## Decisions Made

1. **Label centered across the full tape width, not clamped to follow the current cell** — the 100%-opacity bar and the label's own 2-digit number already signal which cell is current; per-cell clamping would need JS-measured label width on every render, which wasn't worth the cost inside this phase's 2-day timebox. A CSS-only centered layout with `max-w-full` guarantees zero clipping for any cell, at any viewport, for any title length up to the tape's width.
2. **No bottom-of-document fallback added to `updateCurrent()`** — the plan made this conditional on cell 6 still failing after the DOM-derived-threshold fix. It didn't: all 5 gate combinations showed cell 6 landing correctly once the threshold came from `getComputedStyle`, so per the plan's explicit instruction ("마지막 칸이 이미 초록불이면 이 규칙을 추가하지 않는다"), no additional unverified branch was written.
3. **Sensitivity-check B needed -200px, not the plan's suggested -40px** — because the label design is now tape-centered rather than cell-anchored, even the site's longest section title leaves 90px+ of margin on each side of a 375px tape, so a 40px leftward push is fully absorbed inside that margin and never crosses the boundary. -200px reliably breaks it. This is a deviation from the plan's exact suggested magnitude, not from its intent (see Deviations below).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Sensitivity-check B's suggested -40px push did not trip `[라벨-경계]`**
- **Found during:** Task 3 (deliberate-break sensitivity re-check, second of two checks)
- **Issue:** The plan's action text suggested adding `transform: translateX(-40px)` to `[data-section-tape-label]` as a temporary CSS rule to confirm the gate still catches a boundary violation. At -40px, the gate ran clean (exit 0, 0 `[라벨-경계]`) — the centered-label design (Decision 1 above) leaves enough margin on a 375px tape that 40px of leftward push stays inside the tape's bounds.
- **Fix:** Increased the temporary push to -200px, which reliably exceeds the tape's centering margin regardless of viewport/cell and tripped `[라벨-경계]` (18 hits, exit 1) as intended. This is a magnitude adjustment to prove the same property the plan asked for (gate sensitivity to a real boundary violation) — not a scope change.
- **Files modified:** `src/app/globals.css` (temporary, fully reverted before commit — confirmed via `git status --porcelain src/ scripts/`)
- **Verification:** Gate exit 1 with 18 `[라벨-경계]` hits at -200px; reverted; `git diff src/app/globals.css` empty after revert
- **Committed in:** N/A (temporary sensitivity-check change, never committed — only the final reverted state was committed as part of Task 3's `f9baa52`)

---

**Total deviations:** 1 (magnitude adjustment to a plan-suggested test value, not a scope or correctness change)
**Impact on plan:** None on shipped behavior. The underlying property the plan wanted proven (the gate reacts to a real `[라벨-경계]` violation) was proven; only the specific px value needed to trigger it changed because the implementation centers the label across the tape rather than anchoring it to the current cell.

## Issues Encountered

- `next build` fails to forward `--env-file` through Turbopack's worker processes (same pre-existing worktree issue documented in 06-01/06-03/06-06's SUMMARYs) — worked around with a small uncommitted wrapper script that reads `.env.local` into `process.env` before `spawnSync`ing `next build`, exactly as prior plans in this phase did. No repo changes; not a deviation.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Both UAT gaps (G-06-9 major, G-06-2 minor) from `06-UAT.md` are closed, verified by a new automated gate (`e2e-section-tape.mjs`) that specifically targets clicking behavior and label-boundary containment — the detection gap that let 13 prior gates miss these defects is closed alongside the defects themselves.
- The gate suite is now 14 (9 static + 5 e2e); all 14 plus `next build` are green. `package.json` diff remains empty (06-08's "no integration runner script" contract preserved).
- Section Tape's geometry is now single-sourced in CSS (`--section-tape-height`, `--section-tape-scroll-offset`) — any future change to the tape's height only needs to touch one `:root` declaration; both the CSS scroll-margin and the JS click-threshold read from it.
- This closes out Phase 6's remaining UAT gap-closure scope. The phase's only outstanding item is UAT test 1 (real iPad Safari device check), which was already `blocked_by: physical-device` in `06-UAT.md` and is unaffected by this plan.

---
*Phase: 06-site-wide-design-polish*
*Completed: 2026-08-26*

## Self-Check: PASSED

- FOUND: scripts/e2e-section-tape.mjs
- FOUND: src/components/section-tape.tsx (modified)
- FOUND: src/app/globals.css (modified)
- FOUND: .planning/phases/06-site-wide-design-polish/06-UI-SPEC.md (modified)
- FOUND: commit 595df81 (Task 1)
- FOUND: commit 2d2da3e (Task 2)
- FOUND: commit f9baa52 (Task 3)
