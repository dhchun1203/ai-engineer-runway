---
phase: 06-site-wide-design-polish
verified: 2026-08-26T07:51:08Z
status: human_needed
score: 3/4 must-haves verified
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "[SC2] 6종 화면(홈·커리큘럼·일정표·레슨·Step·소개) 시각 일관성 — 아이패드 세로/가로"
    expected: "내비 위치·컨테이너 여백 규칙·카드 모양(모서리·배경·hover)·레슨 화면(구간 테이프, 인라인 코드 칩, 페이저)이 6개 화면 전부에서 '한 사람이 만든 하나의 사이트'로 읽힌다"
    why_human: "시각적 일관성 판단은 픽셀 assert로 환원되지 않는다 — code-level 증거(공유 <main> 셸 클래스, card-interactive 4곳, 단일 chevron 페이저)는 일치를 강하게 뒷받침하지만 최종 판정은 사람 눈으로만 가능하다. 06-08 Task 4가 `workflow.human_verify_mode: end-of-phase` 정책에 따라 06-UAT.md 테스트 9로 이월했다."
  - test: "[UAT-1] 실기기 iPad Safari 확인 (D-93) — 6개 URL, 세로/가로, 구간 테이프 탭·코드 가로 스크롤·터치 히트박스"
    expected: "6종 화면이 깨짐 없이 렌더되고 터치 상호작용이 정상 동작한다"
    why_human: "모든 자동 측정(e2e-typography, e2e-mobile-overflow)은 Playwright Chromium으로만 돌았다 — Safari -webkit- 렌더링 차이·실제 손가락 히트박스·100vh 주소창 겹침은 원리적으로 자동화 불가"
  - test: "[UAT-2a~2f] Section Tape 긴 제목 처리 / 카드·페이저·진행률 바 375px 내부 요소 시각 배치 6건"
    expected: "긴 텍스트가 잘리지 않고 자연스럽게 줄바꿈되며, 카드/페이저 내부 요소가 시각적으로 어색하지 않다"
    why_human: "문서 수준 가로 오버플로 0은 e2e-mobile-overflow.mjs가 이미 자동 확인했다(D-91) — 여기서는 자동 게이트가 못 보는 '보기 좋음' 판단만 남았다"
  - test: "[UAT-3] 쿠키 있는 홈 빈 캔버스 재확인 (D-97 후속) — 768×1024"
    expected: "홈은 5개 섹션이 뷰포트를 넘겨 빈 캔버스가 보이지 않고, /curriculum은 전체 진행률·D-day가 Step 카드 위에 함께 보인다"
    why_human: "06-D97-MEASUREMENT.md의 판정이 자동 스크립트 실측이었으므로 Phase 종료 시 사람이 실제 화면으로 한 번 승인하는 절차"
gaps: []
deferred: []
---

# Phase 6: 전체 페이지 디자인 정리 Verification Report

**Phase Goal:** 모든 화면이 존재하는 상태에서 사이트 전체를 한 번에 다듬는다 — 디자인 토큰(색·타이포·간격)·셸(내비·카드)·페이지별 마감을 정리해 아이패드에서 "템플릿 같지 않은" 일관된 경험을 만든다
**Verified:** 2026-08-26T07:51:08Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (SC1–SC4, substituting for unconfirmed REQUIREMENTS.md IDs)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| SC1 | `globals.css` `@theme` 토큰(색·타이포·간격)이 한 곳에서 정의되고 모든 페이지가 그 토큰만 쓴다 — 페이지별 하드코딩 색/크기 없음 | ✓ VERIFIED | `src/app/globals.css:5-55` defines all color and `--text-*` tokens in one `@theme` block. Re-ran `node scripts/check-design-tokens.mjs` live: `위반 없음 — 30개 파일 검사 완료 (규칙 c 포함, 기본 활성 ENFORCE_ARBITRARY_VALUES=true)`, exit 0 — the arbitrary-value rule (WR-02's known false-negative gap notwithstanding) is enabled by default, matching 06-08's claim. Grepped `src/**/*.tsx` for `text-[…]`, `leading-[…]`, `[#hex]` bracket literals in `className` — zero matches (only 3 hex values appear, all inside `//` comments in `depth-badge.tsx`/`step-card.tsx` documenting the token values, not literal Tailwind classes). |
| SC2 | 홈·커리큘럼·일정표·레슨·Step·소개 6종 화면이 아이패드 세로/가로에서 같은 셸(내비·카드·여백 체계)로 읽힌다 | ? PRESENT — human judgment required | Code-level evidence strongly supports this: all 6 route `<main>` elements share the identical class pattern `mx-auto flex w-full max-w-{5xl|3xl} flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8` (width 5xl vs 3xl is a documented intentional split, not a shell inconsistency — confirmed in `src/app/{page,curriculum/page,schedule/page}.tsx` vs `src/app/{lesson/[lessonId]/page,step/[stepId]/page,about/page}.tsx`). `.card-interactive` hover contract is applied uniformly across `step-card.tsx`, `module-accordion.tsx`, `schedule-table.tsx`, `today-lesson-card.tsx`. This is a visual-consistency judgment call, explicitly and correctly deferred to `06-UAT.md` test 9 per `workflow.human_verify_mode: end-of-phase` (06-08 Task 4 was originally a blocking human-verify checkpoint). Not scored as VERIFIED because no human has confirmed it yet — 06-UAT.md shows all 9 tests `result: pending`. |
| SC3 | 폰 폭(375px)에서도 오늘 카드·일정표·레슨 본문이 깨지지 않는다 | ✓ VERIFIED | `scripts/e2e-mobile-overflow.mjs` covers all 6 required screens (`/`, `/curriculum`, `/schedule`, `/step/1`, `/about`, `/lesson/1-1-course-orientation` with `#lesson-article` wait) plus a not-found shell, at 375×667/768×1024/1024×768 (21 route×viewport combinations) with a documented zero-tolerance `scrollWidth`/`getBoundingClientRect().right` assertion. Orchestrator-established run (not re-executed here per instructions — requires `.env.local` secrets this session cannot read) reported zero document-level horizontal overflow across all 21 combos. Code inspection confirms the gate genuinely targets the three named surfaces (today card via `/`, schedule table via `/schedule`, lesson body via the `#lesson-article`-gated lesson route) rather than a subset. |
| SC4 | Phase 1~5의 자동 게이트(check-\*.mjs, e2e-\*.mjs)가 전부 통과한다 | ✓ VERIFIED | Independently re-ran 6 of the 8 static gates live: `check-design-tokens.mjs`, `check-brand.mjs`, `check-lesson-structure.mjs`, `check-manifest.mjs`, `check-pace.mjs`, `check-progress-gates.mjs`, `check-progress-math.mjs`, `check-schedule.mjs` — all exit 0 with the expected pass messages. The 3 Supabase/Playwright-dependent gates (`check-supabase-progress.mjs`, `e2e-progress.mjs`, `e2e-today.mjs`, `e2e-typography.mjs`, `e2e-mobile-overflow.mjs`) were not re-run (require `.env.local` secrets this session is blocked from reading) — treated as established evidence per the orchestrator's prior green run, consistent with instructions. |

**Score:** 3/4 truths verified (1 present-and-code-supported, explicitly routed to human judgment per project policy — not a gap)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/app/globals.css` | Single `@theme` block for color/typography/spacing tokens | ✓ VERIFIED | Lines 5-55; also houses card-hover, focus-visible, prose overrides, inline-code-chip, table-wrapper-adjacent, and complete-animation rules — all token-referencing, no new hardcoded literals introduced outside documented exceptions (`color-mix()` opacity blends reference existing tokens). |
| `scripts/check-design-tokens.mjs` | Static gate: no literal colors/arbitrary Tailwind values outside `@theme` | ✓ VERIFIED, ran live | Exit 0, 30 files scanned, `ENFORCE_ARBITRARY_VALUES=true` by default (06-08 claim confirmed). Known non-blocking gap: WR-02 (opacity/`!`-suffixed default-palette colors not caught) — currently unexploited (no such literals exist in `src/`). |
| `scripts/e2e-typography.mjs` | Runtime gate: computed font sizes match the 5+1 size / 3 weight set | ✓ EXISTS, established passing | `ROUTES = ['/lesson/1-1-course-orientation']` only — confirms WR-04 (single-route coverage, ~20 other typography-migrated routes/components are only covered by the static gate, not runtime `getComputedStyle`). Not a phase-blocking gap (the static gate does catch class-name typos on all files), but a real coverage limitation. |
| `scripts/e2e-mobile-overflow.mjs` | Runtime gate: zero horizontal overflow at 375/768/1024 across 6 screen types | ✓ EXISTS, established passing | `buildRoutes()` (lines 96-113) covers all 6 required screens + a not-found shell; 3-viewport loop confirmed. |
| `src/components/section-tape.tsx` | Section Tape sticky nav component (06-06) | ✓ EXISTS, substantive, wired into `/lesson/[lessonId]/page.tsx:62` | Functional — measures h2 structure via ResizeObserver, renders proportional cells, click-to-scroll. See CR-01 below re: a latent (not live) staleness risk on client-side pager navigation. |
| `src/components/mdx-content.tsx` (`TableWrapper`) | Horizontal-scroll wrapper for MDX tables | ✓ VERIFIED, wired | Lines 21-27; registered in `defaultComponents.table` (line 34), applied to all `/lesson` and `/about` MDX renders. |
| Route pages (7) + home dashboard components (4) typography migration (06-04) | Arbitrary-bracket typography → semantic tokens | ✓ VERIFIED | `git show cf2577e` confirms a className-only diff touching `progress-summary.tsx`, `pace-status.tsx`, `dday-countdown.tsx`, `behind-lessons-list.tsx` — `src/app/page.tsx` itself was not modified in Phase 6 (consistent with the D-97 "leave home alone" verdict; last touch was Phase 3). |
| `/curriculum` reshuffle (06-07) | D-day + overall progress placed above the Step-card grid | ✓ VERIFIED | `src/app/curriculum/page.tsx:31-38` — `DDayCountdown` and `ProgressSummary` render before the `<section>` grid of `StepCard`s. |
| Nav/pager/badge/button typography + dual-glyph removal (06-05) | Single chevron icon per pager button, no literal arrow + icon duplication | ✓ VERIFIED | `src/components/lesson-nav.tsx:39-49` — exactly one `ChevronLeft`/`ChevronRight` lucide icon per `PagerButton`, no literal `‹`/`›`/`←`/`→` glyph text found anywhere in the file. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `@theme --text-*` declarations | Rendered DOM computed `font-size` | Tailwind v4 utility generation → component `className` → browser render | ✓ WIRED (established via e2e-typography, spot-checked via code) | Namespace fix confirmed correct in `globals.css` comment (lines 39-44) citing `node_modules/tailwindcss/theme.css:347-372`; `.prose h1-h4`/`.prose code` overrides pin sizes explicitly (lines 231-278). |
| `check-design-tokens.mjs` | Repo source files | Static regex scan, run pre-commit/CI-style | ✓ WIRED, ran live | Confirmed exit 0 in this verification session, not just cited from SUMMARY. |
| `SectionTape` | `/lesson/[lessonId]/page.tsx` | Component mount, `articleId`/`stepId` props | ✓ WIRED but see CR-01 | Mounted at line 62 with **no `key` prop** and `articleId` = literal constant `LESSON_ARTICLE_ID`, unchanged across lessons — confirmed in source. The `useEffect`'s `[articleId]` dependency therefore never re-fires on a client-side pager transition, exactly as the code review's CR-01 describes. Not remediated in the reviewed code. |

### Data-Flow Trace (Level 4)

Not separately applicable — this phase is a styling/structure migration, not new data-fetching. All progress/D-day/step data flows were established in Phases 1-5 and are covered by SC4 (regression gates), not re-derived here.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Static token gate enforces no literal colors/arbitrary values | `node scripts/check-design-tokens.mjs` | `위반 없음 — 30개 파일 검사 완료`, exit 0 | ✓ PASS |
| Brand-name gate (KANT exclusion, project hard rule) | `node scripts/check-brand.mjs` | `위반 없음 — 87개 파일 검사 완료`, exit 0 | ✓ PASS |
| Regression gates (Phase 1-5 static) all still green | `node scripts/check-{lesson-structure,manifest,pace,progress-gates,progress-math,schedule}.mjs` | All 6 report pass, all exit 0 | ✓ PASS |
| Runtime typography/overflow gates (`e2e-typography.mjs`, `e2e-mobile-overflow.mjs`, `check-supabase-progress.mjs`, `e2e-progress.mjs`, `e2e-today.mjs`) | Requires `.env.local` (SUPABASE_URL/UNLOCK_SECRET) and a spawned dev server | Not re-run (session blocked from reading `.env.local`; instructions say treat prior orchestrator run as evidence) | ? SKIP (established, not independently re-verified) |
| `git grep` for KANT/Kant mentions in `src/` | `grep -rni "kant" src/` | 0 matches | ✓ PASS |
| CR-01 (Section Tape staleness on pager navigation) — code confirms the described mechanism | Read `section-tape.tsx:71-138`, `lesson-nav.tsx`, `page.tsx:62` | `useEffect` deps = `[articleId]` only, `articleId` = literal constant, no `key` prop on `<SectionTape>` | Confirmed present in code as described; orchestrator's empirical 5/5-hop test found it does not currently reproduce (see 06-REVIEW.md appendix) — latent fragility, not a live defect |

### Requirements Coverage

REQUIREMENTS.md has no confirmed IDs for Phase 6 (grep for Phase 6 rows returned nothing), consistent with the ROADMAP note that SC1-SC4 substitute as the requirement units. All 8 plans' `requirements:` frontmatter fields use only `SC1`-`SC4` (confirmed via grep) — no orphaned or unclaimed requirement IDs exist to report.

| Requirement | Source Plans | Description | Status |
|---|---|---|---|
| SC1 | 06-01, 02, 03, 04, 05, 06, 08 | Centralized design tokens, zero hardcoded values | ✓ SATISFIED |
| SC2 | 06-02, 03, 04, 05, 06, 07, 08 | 6-screen shell consistency on iPad | ? NEEDS HUMAN (deferred per policy) |
| SC3 | 06-06, 08 | No breakage at 375px on 3 named surfaces | ✓ SATISFIED |
| SC4 | 06-01, 03, 04, 05, 06, 07, 08 | All prior-phase automated gates still green | ✓ SATISFIED |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/section-tape.tsx` | 138 (`useEffect` deps), `src/app/lesson/[lessonId]/page.tsx:62` (no `key`) | Stale-closure risk on client-side lesson→lesson pager navigation (CR-01) | ⚠️ Warning (downgraded from Critical by orchestrator's empirical 5/5-hop non-repro test) | Currently latent — correctness rests on the incidental fact that no two consecutive lessons in this content set render at identical `scrollHeight`. One-line fix available (`key={lesson.slug}`), not applied in this phase. |
| `src/components/today-lesson-card.tsx` | 76-81 | `card-interactive` hover applied to whole card when only the small CTA link is clickable (WR-01) | ⚠️ Warning | Documented trade-off in 06-03-SUMMARY.md; low real-world impact on iPad (no meaningful `:hover` on tap) but a real desktop UX inconsistency. |
| `scripts/check-design-tokens.mjs` | 110-112, 355-371 | False-negative gap for opacity/`!`-suffixed default-palette colors (WR-02) | ⚠️ Warning | Currently unexploited (no such literals in `src/`) but is the only thing standing between future PRs and a silent regression, now that the rule enforces by default. |
| `src/components/section-tape.tsx` | 145-197 | Idle/placeholder tape cells have no accessible name during pre-hydration or measurement-failure states (WR-03) | ⚠️ Warning | Screen-reader accessibility gap, not a visual/functional defect. |
| `scripts/e2e-typography.mjs` | 46 | Runtime typography assertion covers only 1 of ~20 migrated routes/components (WR-04) | ⚠️ Warning | Static gate still catches class-name typos on all files; only the *rendered pixel value* on non-lesson routes is unverified by a runtime browser check. |

No `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER` debt markers found in the phase's touched files (`section-tape.tsx`, `mdx-content.tsx`, `globals.css`, the 3 new/modified gate scripts) — the one `PLACEHOLDER` string match (`PLACEHOLDER_SECTION_COUNT`) is a semantic constant name, not a stub marker.

### Human Verification Required

All 9 items below are already recorded with full URLs/steps in `.planning/phases/06-site-wide-design-polish/06-UAT.md` (status: all `pending`) — not duplicated here in full per the single-sink convention. Summary:

1. **UAT-1 — 실기기 iPad Safari 확인 (D-93)**: 6 screens, portrait/landscape, Section Tape tap, code-block horizontal swipe, touch-target accuracy. Why human: Safari `-webkit-` rendering and real touch cannot be simulated by Chromium-based automated gates.
2. **UAT-2a~2f — 6 visual spot-checks**: long section-title wrapping, long lesson-title card wrapping, 375px internal card overflow (visual), pager button stacking at 375px, progress-bar/pace-panel overflow (visual), overdue-lesson-list wrapping. Why human: document-level overflow is already proven 0 by `e2e-mobile-overflow.mjs` — these are "does it look right" judgments the automated gate cannot make.
3. **UAT-3 — 쿠키 있는 홈 재확인 (D-97 후속)**: human sign-off on the D-97 automated-script empty-canvas verdict.
4. **[SC2] Test 9 — 6-screen shell visual consistency**: the roadmap's SC2 itself, deferred per `workflow.human_verify_mode: end-of-phase` policy (06-08 Task 4).

### Gaps Summary

No blocking gaps found. All four ROADMAP success criteria (SC1-SC4) are either code-verified with live-reproduced evidence (SC1, SC4), backed by established prior automated-gate evidence with code-level confirmation of correct coverage (SC3), or are inherently a human-judgment criterion that has been correctly and deliberately routed to end-of-phase UAT per project policy rather than skipped (SC2).

The one substantive code-review finding (CR-01, Section Tape staleness on pager navigation) was independently confirmed present in the code during this verification, but the orchestrator's empirical test found it does not currently manifest as a live defect across 5 consecutive real navigation hops — it is correctly classified as a Warning (latent fragility with a known one-line fix), not a blocker. WR-01 through WR-04 and IN-01/IN-02 remain open, minor, non-blocking findings.

Status is `human_needed` rather than `passed` solely because the human_verification section (SC2's visual-consistency judgment plus the 8 other UAT items) is non-empty and all 9 items in `06-UAT.md` still read `result: pending` — this is the correct and expected state for this phase, not a defect.

---

_Verified: 2026-08-26T07:51:08Z_
_Verifier: Claude (gsd-verifier)_
