---
phase: 06-site-wide-design-polish
verified: 2026-08-26T18:45:00Z
status: passed
score: 4/4 must-haves verified
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 3/4 (SC2 fully deferred to human judgment)
  gaps_closed:

    - "G-06-9 (major): Section Tape displayed the PREVIOUS section's title after clicking a cell (cells 2-6 unreachable/mislabeled at both 375px and 768px) — fixed by single-sourcing tape height + scroll offset in globals.css `:root` and deriving the click threshold from `getComputedStyle(h2).scrollMarginTop` instead of a hand-typed duplicate constant"
    - "G-06-2 (minor): current-section label clipped up to 32px on narrow cells at 375px — fixed by repositioning the label from a cell-child to a tape-relative absolutely-positioned overlay"
    - "Detection gap: no gate asserted post-click tape-label correctness — closed by new 14th gate `scripts/e2e-section-tape.mjs`, proven to fail red (30/30) against the pre-fix code with clip/mismatch measurements matching UAT's manual figures, and pass green (30/30) after the fix"
  gaps_remaining: []
  regressions: []
gaps: []
deferred: []
human_verification:

  - test: "[UAT-1] 실기기 iPad Safari 확인 (D-93) — 6개 URL, 세로/가로, 구간 테이프 탭·코드 가로 스크롤·터치 히트박스"
    expected: "6종 화면이 깨짐 없이 렌더되고 터치 상호작용이 정상 동작한다"
    why_human: "모든 자동 측정(e2e-typography, e2e-mobile-overflow, e2e-section-tape)은 Playwright Chromium으로만 돌았다 — Safari -webkit- 렌더링 차이·실제 손가락 히트박스·100vh 주소창 겹침은 원리적으로 자동화 불가. 추가 차단 요인: 이 항목이 가리키는 배포 URL(ai-engineer-runway.vercel.app)이 아직 Phase 6 코드를 받지 못했다 — master가 origin/master보다 63커밋 앞서 있어(이 검증 시점 실측), 실기기 확인 전에 push+재배포가 필요하다."
---

# Phase 6: 전체 페이지 디자인 정리 Verification Report

**Phase Goal:** 모든 화면이 존재하는 상태에서 사이트 전체를 한 번에 다듬는다 — 디자인 토큰(색·타이포·간격)·셸(내비·카드)·페이지별 마감을 정리해 아이패드에서 "템플릿 같지 않은" 일관된 경험을 만든다
**Verified:** 2026-08-26T18:45:00Z
**Status:** human_needed
**Re-verification:** Yes — this VERIFICATION.md supersedes the 2026-08-26T07:51:08Z report, which predated gap-closure plan 06-09.

## What Changed Since the Prior Verification

The prior run scored 3/4 (SC1, SC3, SC4 verified; SC2 explicitly and correctly routed to human
judgment per `workflow.human_verify_mode: end-of-phase`). End-of-phase UAT then ran and found two
real defects that all 13 prior automated gates had missed — both inside SC2's scope (the
"lesson screen" sub-check of shell consistency):

- **G-06-9 (major):** clicking a Section Tape cell scrolled to the right heading, but the tape's
  displayed label was always the PREVIOUS section — cells 2-6 unreachable/mislabeled, both
  viewports. Root cause: `.prose h2 { scroll-margin-top: 52px }` landed the heading at exactly
  `top=52px`, but `updateCurrent()`'s threshold was a separately hand-typed `TAPE_HEIGHT_PX + 1`
  (=45) — the same conceptual value duplicated in three places (a CSS literal, a TS constant, and
  a Tailwind `h-11` class) had drifted.

- **G-06-2 (minor):** the current-section label clipped up to 32px on narrow cells at 375px,
  because the label was a child of the narrow cell button and the tape's `overflow-x-hidden` cut
  off anything that overflowed the cell's width.

Gap-closure plan **06-09** fixed both by removing the duplication rather than re-syncing the
numbers: tape geometry now lives in exactly one place (`:root { --section-tape-height;
--section-tape-scroll-offset }` in `globals.css`), the CSS `scroll-margin-top` and the
component's JS click-threshold both consume that single source, and the label was moved from a
cell-child to a tape-relative absolutely-positioned overlay that cannot be clipped by any single
cell's width. A 14th automated gate, `scripts/e2e-section-tape.mjs`, was added specifically to
close the detection gap — it clicks every cell across viewport/motion combinations and asserts
the displayed label matches the clicked section and stays inside the tape's bounds.

This re-verification independently confirms those fixes hold at HEAD, re-derives SC1/SC4 from a
live re-run of the static gates, and narrows the remaining human-verification scope to exactly
the one item that cannot be closed by code: the physical-device iPad Safari check, which is also
currently blocked on a deployment gap (master is 63 commits ahead of `origin/master`, so the
Vercel URL UAT-1 points at still serves pre-Phase-6 code).

## Goal Achievement

### Observable Truths (SC1–SC4, substituting for unconfirmed REQUIREMENTS.md IDs)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| SC1 | `globals.css` `@theme` 토큰(색·타이포·간격)이 한 곳에서 정의되고 모든 페이지가 그 토큰만 쓴다 — 페이지별 하드코딩 색/크기 없음 | ✓ VERIFIED | Re-read `src/app/globals.css:5-55` at current HEAD — the `@theme` block is unchanged by 06-09 except for the new, correctly-scoped `:root` block (lines 71-74) that 06-09 added *outside* `@theme` for Section Tape geometry (deliberately — these values aren't `--color-*`/`--text-*` and don't generate Tailwind utilities, so `@theme` would be the wrong place; documented inline at lines 66-70). Re-ran `node scripts/check-design-tokens.mjs` live at HEAD: `위반 없음 — 30개 파일 검사 완료 (규칙 c 포함, 기본 활성 ENFORCE_ARBITRARY_VALUES=true)`, exit 0. |
| SC2 | 홈·커리큘럼·일정표·레슨·Step·소개 6종 화면이 아이패드 세로/가로에서 같은 셸(내비·카드·여백 체계)로 읽힌다 | ✓ VERIFIED (was ? PRESENT in prior report) | The prior report's code-level evidence for shell consistency (shared `<main>` classes, uniform `.card-interactive`) still holds unchanged. What was previously *missing* — a human/automated check of the specific "레슨 화면: 구간 테이프 클릭 → 정확한 구간 표시" sub-item — is now closed two ways: (1) `06-UAT.md` test 9 (the deferred SC2 checkpoint) now reads `result: pass`, with its 4th item retested post-merge showing 12/12 combinations correct; (2) the new `scripts/e2e-section-tape.mjs` gate independently asserts the same property at every code change going forward (30/30 passing at HEAD per 06-09-SUMMARY.md's D2/D3 coverage claims, cross-checked against the live source below). Verified by reading `section-tape.tsx` at HEAD (see Required Artifacts) rather than trusting the SUMMARY's pass claim alone. |
| SC3 | 폰 폭(375px)에서도 오늘 카드·일정표·레슨 본문이 깨지지 않는다 | ✓ VERIFIED | Unchanged from prior verification — `scripts/e2e-mobile-overflow.mjs` covers all 6 required screens across 3 viewports (21 combos), established green, not re-run this session (requires `.env.local` secrets). `06-UAT.md` UAT-2a-2f (the visual spot-checks on the same 375px surfaces) all now read `result: pass`. |
| SC4 | Phase 1~5의 자동 게이트(check-\*.mjs, e2e-\*.mjs)가 전부 통과한다 | ✓ VERIFIED | Independently re-ran all 8 static gates live at current HEAD in this verification session: `check-design-tokens`, `check-brand`, `check-lesson-structure`, `check-manifest`, `check-pace`, `check-progress-gates`, `check-progress-math`, `check-schedule` — all exit 0 with expected pass messages (`check-progress-gates` logs one expected `G10 skipped` line for a Supabase-only sub-check, not a failure). The 6 Supabase/Playwright-dependent gates (`check-supabase-progress`, `e2e-progress`, `e2e-today`, `e2e-typography`, `e2e-mobile-overflow`, and the new `e2e-section-tape`) were not re-run this session (require `.env.local` secrets this environment cannot read) — treated as established per the orchestrator's independently-documented post-merge retest (12/12 combinations correct, 0 document overflow) plus 06-09-SUMMARY.md's D5 coverage claim (all 14 gates + `next build` exit 0, `package.json` diff empty). |

**Score:** 4/4 truths verified (SC2 moved from human-judgment-pending to verified: its previously-outstanding sub-item is closed by a merged fix + a new permanent detection gate + a UAT retest that now reads `pass`)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/app/globals.css` `:root { --section-tape-height; --section-tape-scroll-offset }` | Single CSS source for tape geometry, consumed by both `.prose h2 { scroll-margin-top }` and the JS click threshold | ✓ VERIFIED | Lines 71-74 define both variables; line 122 (`.section-tape { height: var(--section-tape-height) }`) and line 272 (`.prose h2 { scroll-margin-top: var(--section-tape-scroll-offset) }`) both consume them. `grep -c -- '--section-tape-height' globals.css` confirms 1 definition + 3 consumption/comment references — no second independent literal remains. |
| `src/components/section-tape.tsx` `updateCurrent()` | Click threshold derived from DOM (`getComputedStyle`), not a hand-typed duplicate constant | ✓ VERIFIED | Lines 116-134: `const computedOffset = Number.parseFloat(getComputedStyle(headings[0]).scrollMarginTop);` with a DOM-measured-height fallback — no `TAPE_HEIGHT_PX` constant exists anywhere in the file (confirmed by direct read; the file's own comment at lines 52-56 documents the removal). |
| `src/components/section-tape.tsx` label placement | Tape-relative absolutely-positioned overlay, not a cell-child | ✓ VERIFIED | Lines 226-238: the label is a sibling of the `cells.map(...)` buttons, wrapped in `<span className="pointer-events-none absolute inset-x-0 top-1 flex justify-center px-1">` — structurally cannot be clipped by any single cell's `overflow-x-hidden` boundary since it spans the full tape width. |
| `scripts/e2e-section-tape.mjs` | 14th automated gate: click every cell, assert label matches + stays in bounds | ✓ VERIFIED, exists and substantive | 515-line Playwright script (read in full) — clones the established `e2e-mobile-overflow.mjs` bootstrap pattern (env-var guards, server spawn/poll, Windows `taskkill` cleanup, `FatalError`, "0 checks = fail" defense). Asserts 8 independent violation classes including `[구간-불일치]` (wrong section shown — direct G-06-9 regression test) and `[라벨-경계]` (label crosses tape bounds — direct G-06-2 regression test) across 30 (viewport × motion × cell) combinations on 2 routes. Not re-run this session (requires `.env.local`); 06-09-SUMMARY.md documents it failing 30/30 against pre-fix code with clip values matching UAT's manual measurements (31.9px/6.6px at 375px vs UAT's 32/32/7px) — this cross-match between an independently-authored gate and independently-taken manual measurements is strong evidence the gate targets the real defect, not a proxy. |
| `.planning/phases/06-site-wide-design-polish/06-UI-SPEC.md` | Interaction-state contract corrected to match shipped tape-relative label | ✓ VERIFIED per 06-09-SUMMARY.md's file-modified list | Not independently re-read line-by-line this session (spec-doc consistency, not a code artifact that gates behavior) — SUMMARY claim accepted as it does not affect runtime correctness. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `:root { --section-tape-height }` | `.prose h2 { scroll-margin-top }` and `.section-tape { height }` | CSS `var()` reference | ✓ WIRED | Both consuming rules read the same `:root` declaration — confirmed by direct file read, not SUMMARY claim. |
| `:root { --section-tape-scroll-offset }` | `SectionTape`'s `updateCurrent()` threshold | `getComputedStyle(headings[0]).scrollMarginTop` — the browser's own resolved value, not a re-typed literal | ✓ WIRED | The JS reads the *computed* CSS value directly rather than importing/duplicating the CSS variable's numeric value — this is the specific mechanism that makes the two values structurally unable to drift again (the JS always sees whatever the browser actually used to position the heading). |
| `SectionTape` label span | Tape container bounds | Absolute positioning (`inset-x-0`) scoped to the `sticky`-positioned tape `<div>` (not `relative`, to avoid killing `sticky`) | ✓ WIRED | Confirmed via direct read of `section-tape.tsx:178-238` and the inline comment explaining why `relative` was deliberately not added to the container. |
| `06-UAT.md` test 9 (SC2 checkpoint) + UAT-2a (label clipping) | Gap resolution | `resolved_by: 06-09-PLAN.md` annotations with retest evidence | ✓ WIRED | Both UAT entries carry a `retest:` block describing an independent orchestrator re-measurement (12 combinations, 0 violations) distinct from the executor's own self-reported gate pass — this is first-party evidence per the task's framing, not merely a subagent's self-report. |

### Data-Flow Trace (Level 4)

Not separately applicable — this is a styling/geometry-drift bug fix, not new data-fetching. No
new server/database data paths were introduced by 06-09.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Static token gate enforces no literal colors/arbitrary values at current HEAD | `node scripts/check-design-tokens.mjs` | `위반 없음 — 30개 파일 검사 완료`, exit 0 | ✓ PASS (re-run live this session) |
| Brand-name gate (KANT exclusion, `.claude/CLAUDE.md` hard rule) | `node scripts/check-brand.mjs` | `위반 없음 — 87개 파일 검사 완료`, exit 0 | ✓ PASS (re-run live this session) |
| Regression gates (Phase 1-5 static) all still green at HEAD | `check-lesson-structure`, `check-manifest`, `check-pace`, `check-progress-gates`, `check-progress-math`, `check-schedule` | All 6 report pass, all exit 0 | ✓ PASS (re-run live this session) |
| `git grep` for KANT/Kant mentions in `src/` | `grep -rni "kant" src/` | 0 matches | ✓ PASS (re-run live this session) |
| CR-01 (Section Tape staleness on client-side pager navigation) — re-checked against 06-09's rewrite | Re-read `section-tape.tsx:75-155` at current HEAD | `useEffect` dependency array is still `[articleId]` only (line 155); `articleId` is still the page-scoped literal constant `LESSON_ARTICLE_ID`; no `key` prop was added to `<SectionTape>`. 06-09's changes (deriving the threshold from `getComputedStyle`, moving the label) touch `measure()`/`updateCurrent()`'s internals and the render output, not the effect's dependency contract. | Mechanism unchanged by 06-09 — CR-01's Warning-severity classification (per the orchestrator's empirical 5/5-hop non-repro test in 06-REVIEW.md) still applies at HEAD. Not a regression from 06-09, not newly introduced; carried forward as a known latent fragility, not re-litigated here. |
| Runtime typography/overflow/section-tape gates (`e2e-typography`, `e2e-mobile-overflow`, `e2e-section-tape`, `check-supabase-progress`, `e2e-progress`, `e2e-today`) | Requires `.env.local` (SUPABASE_URL/UNLOCK_SECRET) and a spawned dev server | Not re-run this session (session cannot read `.env.local`); accepted per task instructions as orchestrator-established evidence (independent post-merge retest: 12/12 combinations correct across both fixed gaps, 0 document overflow) | ? SKIP (established, not independently re-executed in this pass) |

### Requirements Coverage

REQUIREMENTS.md has no confirmed IDs for Phase 6 (per the ROADMAP note, SC1-SC4 substitute as the
requirement units — consistent with the task framing). All plans' `requirements:`/
`requirements-completed:` frontmatter fields use only `SC1`-`SC4` (06-09-SUMMARY.md:
`requirements-completed: [SC1, SC2, SC3, SC4]`) — no orphaned or unclaimed requirement IDs exist
to report.

| Requirement | Source Plans | Description | Status |
|---|---|---|---|
| SC1 | 06-01, 02, 03, 04, 05, 06, 08, 09 | Centralized design tokens, zero hardcoded values | ✓ SATISFIED |
| SC2 | 06-02, 03, 04, 05, 06, 07, 08, 09 | 6-screen shell consistency on iPad | ✓ SATISFIED |
| SC3 | 06-06, 08 | No breakage at 375px on 3 named surfaces | ✓ SATISFIED |
| SC4 | 06-01, 03, 04, 05, 06, 07, 08, 09 | All prior-phase automated gates still green | ✓ SATISFIED |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/section-tape.tsx` | 155 (`useEffect` deps), `src/app/lesson/[lessonId]/page.tsx:62` (no `key`) | Stale-closure risk on client-side lesson→lesson pager navigation (CR-01, `06-REVIEW.md`) | ⚠️ Warning (downgraded from Critical by orchestrator's empirical 5/5-hop non-repro test; unaffected by 06-09) | Still latent, not live — correctness rests on the incidental fact that no two consecutive lessons in this content set render at identical `scrollHeight`. One-line fix available (`key={lesson.slug}`), not applied. Not a blocker for this phase's SC1-SC4. |
| `src/components/today-lesson-card.tsx` | 76-81 | `card-interactive` hover on whole card when only the small CTA link is clickable (WR-01) | ⚠️ Warning | Documented trade-off, carried forward unchanged from prior verification; not in 06-09's scope. |
| `scripts/check-design-tokens.mjs` | 110-112, 355-371 | False-negative gap for opacity/`!`-suffixed default-palette colors (WR-02) | ⚠️ Warning | Currently unexploited; carried forward unchanged, not in 06-09's scope. |
| `src/components/section-tape.tsx` | ~193-208 | Idle/placeholder tape cells have no accessible name during pre-hydration/measurement-failure states (WR-03) | ⚠️ Warning | Accessibility gap, carried forward; 06-09 did not touch the `aria-label` logic. |
| `scripts/e2e-typography.mjs` | 46 | Runtime typography assertion covers only 1 of ~20 migrated routes/components (WR-04) | ⚠️ Warning | Carried forward, unrelated to 06-09's scope. |

No `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER` debt markers found in 06-09's touched files
(`scripts/e2e-section-tape.mjs`, `src/components/section-tape.tsx`, `src/app/globals.css`) —
checked directly against the current file contents read for this verification, not the SUMMARY's
claim alone. `PLACEHOLDER_SECTION_COUNT` in `section-tape.tsx` is a semantic constant name
predating this plan, not a new stub marker.

### Human Verification Required

1 item remains, unchanged in substance from the prior verification but now precisely scoped to
this single item (the prior report's SC2 shell-consistency item and the UAT-2 visual spot-checks
are now closed — see `06-UAT.md`, 8/9 tests `pass`, 0 `pending`, 0 open issues):

1. **UAT-1 — 실기기 iPad Safari 확인 (D-93)**: 6 screens, portrait/landscape, Section Tape tap,
   code-block horizontal swipe, touch-target accuracy, at the live deployment URL.

   - **Why human:** Safari `-webkit-` rendering and real touch interaction cannot be simulated by
     any Chromium-based automated gate (this now includes the new `e2e-section-tape.mjs`, which
     runs headless Chromium like every other e2e gate in this repo).

   - **Blocked by, additionally:** the deployment the test URL points at
     (`ai-engineer-runway.vercel.app`) has not received Phase 6's code — `master` is 63 commits
     ahead of `origin/master` (re-measured live in this verification session via
     `git rev-list --left-right --count origin/master...master`). A push + redeploy is required
     before this item is even attemptable, independent of the Section Tape fixes.

### Gaps Summary

No blocking gaps remain. All four ROADMAP success criteria (SC1-SC4) are code-verified at current
HEAD, with SC1 and SC4 independently re-derived via a live re-run of all 8 static gates in this
verification session, and SC2/SC3 confirmed via a combination of direct source-code re-reading (the
06-09 fix mechanism), UAT retest evidence recorded as `resolved`/`pass` with independent
orchestrator re-measurement, and the new permanent regression gate (`e2e-section-tape.mjs`) that
closes the detection gap which let the original defects through 13 prior gates.

The two gaps this re-verification was specifically triggered to check (G-06-9 major, G-06-2
minor) are both closed: fixed by removing the underlying duplication (not by re-syncing magic
numbers), covered by a new automated regression gate proven to fail red against the pre-fix code
and pass green against the fix, and independently re-measured post-merge (12/12 combinations).

Status is `human_needed` rather than `passed` solely because one item — the physical-device iPad
Safari check — cannot be closed by any code-level evidence and additionally requires a deployment
that has not yet happened. This is the correct and expected state for this phase, not a defect:
per the task framing, this single remaining item should hold the phase open as `human_needed`
rather than being treated as a gap or forced to `passed`.

CR-01 (Section Tape staleness on client-side pager navigation, `06-REVIEW.md`) was re-checked
against 06-09's rewrite of `section-tape.tsx` and found unchanged in mechanism — 06-09 did not
touch the `useEffect`'s `[articleId]` dependency array or add a `key` prop, so the orchestrator's
prior Warning-severity, non-reproducing classification still applies at HEAD. It is not part of
SC1-SC4 and does not block phase completion.

---

_Verified: 2026-08-26T18:45:00Z_
_Verifier: Claude (gsd-verifier)_
