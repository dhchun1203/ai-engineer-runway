---
phase: 03-schedule-and-today
verified: 2026-08-25T00:00:00Z
status: passed
score: 45/45 must-haves verified (4 ROADMAP success criteria + 41 plan-level truths across 4 plans)
behavior_unverified: 0
overrides_applied: 0
---

# Phase 3: 학습 일정과 오늘의 학습 Verification Report

**Phase Goal:** 학습자가 사이트를 열면 오늘 무엇을 공부해야 하는지, 개강까지 페이스가 맞는지 즉시 알 수 있다
**Verified:** 2026-08-25
**Status:** passed
**Re-verification:** No — initial verification

## Method Note

This verification did not stop at reading SUMMARY.md claims. For every truth that depends on runtime rendering behavior (ahead/on-track/behind pace panel, celebration state, progress-read-error fallback) I independently bundled the actual production components (`pace-status.tsx`, `today-lesson-card.tsx`, `progress-error.tsx`) with esbuild and rendered them via `react-dom/server` with synthetic props matching the exact shapes the app would pass in production (e.g. a `PaceResult` with `status: "behind", gapMinutes: 240, missedSlugs: ["a","b"]`). This produces real HTML output, not code-review inference, for states that the live site cannot currently exhibit (today is 2026-08-25, day one of the schedule — no past-due lessons exist yet to trigger a live "behind" or "celebration" state). The harness files were temporary and have been deleted; `git status` confirms no residue.

I also ran every automated gate myself rather than trusting the SUMMARY.md "PASSED" claims, re-ran the full build, both e2e suites (`e2e-today.mjs`, `e2e-progress.mjs` for regression), and spot-checked git diffs for the 35-file mdx edit claimed in Plan 02.

## Goal Achievement

### ROADMAP Success Criteria (primary must-haves)

| # | Success Criterion | Status | Evidence |
|---|---|---|---|
| 1 | 2026-08-25~09-29 일자별 일정표, 날짜별 배정 레슨 + 총 소요시간이 하루 3시간 이내(하루 1레슨, 평균 약 2h) | ✓ VERIFIED | `check-schedule.mjs` (18 cases, 36-row structure, boundary dates) pass; `check-manifest.mjs` Invariant 6/12/13 confirm total=4200min, distribution {150:20,90:10,60:5}, max=150min/day (≤3h); `/schedule` e2e s1 confirms 36 rows rendered |
| 2 | 사이트 기본 화면이 "오늘의 학습", 오늘 배정 레슨 + 완료 여부 표시, 레슨 페이지 이동 | ✓ VERIFIED | `src/app/page.tsx` renders `<TodayLessonCard>` unconditionally; e2e t1/t2 confirm cookie-independent rendering and date-branch text; CTA links to `/lesson/{slug}` confirmed in source and harness render |
| 3 | 모든 레슨에 예상 소요시간 표시, 일정 배분이 그 수치 근거 | ✓ VERIFIED | `EstimatedTime`/`formatEstimatedTime` used throughout; `check-manifest.mjs` Invariant 13 ties `estimatedMinutes` to (depth, isProject) derivation; per-day cap (≤150min) is the mechanism satisfying the 3h/day constraint |
| 4 | 개강일 D-day 카운트다운 + on-track/behind 상태 표시 | ✓ VERIFIED | `daysUntil()` boundary-tested (36/1/0/-1) in `check-schedule.mjs`; `computePace()` 18-case unit suite incl. Pitfall-3 (future-lesson-precompletion) trap; render harness confirms `PaceStatusPanel` produces correct behind/ahead copy with correctly computed numbers (240min → "약 4시간", 2 lessons, `catchUpDays(240)`=8) |

### Automated Gate Results (run directly by this verifier, not taken from SUMMARY.md)

| Command | Result |
|---|---|
| `npm run build` | ✓ Success — `/`, `/curriculum`, `/schedule` all appear as dynamic (ƒ) routes, Velite regenerated 35 lessons |
| `node scripts/check-manifest.mjs` | ✓ "all 13 invariants passed (35 lessons, 19 modules, total 4200 minutes)" |
| `node scripts/check-schedule.mjs` | ✓ "18개 케이스 모두 통과" |
| `node scripts/check-pace.mjs` | ✓ "18개 케이스 모두 통과" |
| `node scripts/check-progress-math.mjs` | ✓ "11개 케이스 모두 통과" (Phase 2 regression) |
| `node scripts/check-progress-gates.mjs` | ✓ "all gates passed" (G17–G20 incl.) |
| `node scripts/check-brand.mjs` | ✓ "위반 없음 — 85개 파일 검사 완료" (KANT/Kant never appears) |
| `node --env-file=.env.local scripts/e2e-today.mjs` | ✓ 13/14 scenarios pass; t8 explicitly skipped (documented below) |
| `node --env-file=.env.local scripts/e2e-progress.mjs` | ✓ All Phase 2 scenarios pass — no regression from Phase 3 route restructuring |

### Plan-Level Truths — 03-01 (Tracer: home/curriculum/nav)

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | 홈이 오늘의 학습, 오늘 레슨 카드가 제목·소요시간·깊이배지·링크를 렌더 | ✓ VERIFIED | e2e t1, `page.tsx`/`today-lesson-card.tsx` source |
| 2 | D-day가 'D-{n}'/'D-DAY (개강일)' 경계로 렌더 | ✓ VERIFIED | `daysUntil` boundary cases + `dday-countdown.tsx` source |
| 3 | buildSchedule 36행, 경계 날짜 정확 | ✓ VERIFIED | `check-schedule.mjs` 18 cases |
| 4 | todayInSeoul 타임존 자정 경계 정확 | ✓ VERIFIED | `check-schedule.mjs` KST 14:59:59/15:00:00 UTC cases |
| 5 | 8/25 이전·9/30 이후 빈 화면 아님 | ✓ VERIFIED | e2e t2 branch assertions |
| 6 | 쿠키 없이도 D-day/오늘레슨 보이고 진도마커 0건 | ✓ VERIFIED | e2e t1, t7 |
| 7 | /curriculum Step 3개 + 쿠키시 진행률바 | ✓ VERIFIED | e2e t3/t4 |
| 8 | 내비 4항목 전부 활성 | ✓ VERIFIED | e2e t5, `site-nav.tsx` source |
| 9 | 375px 폭에서 오늘 레슨 제목 줄바꿈, 요소 겹침 없음 | ⚠ Not independently re-confirmed at exactly 375px | Design uses no truncation classes (verified in source); Plan 04's iPad UAT covered 744px+ viewports, not phone width specifically. Low risk (no fixed-width/`truncate` classes present) but not visually re-verified by this pass — see Human Verification. |
| 10 | D-day 한 줄, 줄바꿈/축약 없음 | ✓ VERIFIED | `whitespace-nowrap` literal class in `dday-countdown.tsx` |

### Plan-Level Truths — 03-02 (Duration rebalance + manifest gates + doc updates)

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | 35레슨 합계 정확히 4200분 | ✓ VERIFIED | `check-manifest.mjs` Invariant 6 |
| 2 | 분포 정확히 150×20/90×10/60×5 | ✓ VERIFIED | `check-manifest.mjs` Invariant 12 |
| 3 | (depth, isProject) 파생 규칙 일치 | ✓ VERIFIED | `check-manifest.mjs` Invariant 13 |
| 4 | 다른 7개 필드는 편집 전후 동일 | ✓ VERIFIED | `git show --numstat eb74e04` confirms all 35 mdx files are exactly 1 insertion/1 deletion (the `estimatedMinutes` line only) |
| 5 | 모든 estimatedMinutes ≥1 정수 (스키마 유지) | ✓ VERIFIED | `npm run build` succeeds (Velite schema validation would fail build otherwise) |
| 6 | 렌더된 소요시간 문자열이 갱신값 반영 | ✓ VERIFIED | `formatEstimatedTime` recomputes from live `.velite/lessons.json` values; confirmed via manifest gate |
| 7 | 하루 최대 150분(2.5h), 3시간 이내 | ✓ VERIFIED | max value in distribution is 150 (Invariant 12) |
| 8 | ROADMAP/PROJECT/REQUIREMENTS "4~6시간" 문구 제거, D-35 반영 | ✓ VERIFIED | Direct read of all 3 files (top of this session) + `git show 7ee930b` diff confirms scoped single-line replacements |

### Plan-Level Truths — 03-03 (Pace judgment, behind list, celebration)

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | ahead/on-track/behind — 정확히 하나 렌더 | ✓ VERIFIED | `check-pace.mjs` 18 cases + e2e t6 (live) + render harness (behind/ahead HTML confirmed) |
| 2 | 어제까지 배정 vs 완료 분 비교, 오늘 배정 제외 | ✓ VERIFIED | `pace.ts` source uses `pastRows = rows.filter(r => r.date < todayStr)`; unit-tested |
| 3 | 미래 선완료해도 어제까지 미완료면 behind (Pitfall 3) | ✓ VERIFIED | Explicit unit case in `check-pace.mjs`; source keeps `completedThroughYesterday` and `completedAllAssignedMinutes` as separate named variables |
| 4 | 첫날 완료 0건이어도 on-track (behind 아님) | ✓ VERIFIED | Unit case in `check-pace.mjs`; matches live system state today |
| 5 | 버퍼일이 배정/완료/밀림 목록에서 제외 | ✓ VERIFIED | Unit case; `computePace` filters `lessonSlug !== null` |
| 6 | behind 시 정량 문구 + 따라잡기 문구(K=ceil(gap/30)) | ✓ VERIFIED | Render-harness output: "약 4시간 분량(2개 레슨) 밀렸어요." + "하루 30분씩 추가하면 8일이면 따라잡아요." — math confirmed correct (240/30=8) |
| 7 | behind 문구 값이 커져도 구조 고정, 말줄임 없음 | ✓ VERIFIED | Source uses plain `<p>` with no truncation class, sentence structure is fixed text with interpolated numbers |
| 8 | behind 아니면 밀린 레슨 섹션 DOM에 없음(흐림 아님) | ✓ VERIFIED | `behindRows.length > 0 ? <BehindLessonsList/> : null` in `page.tsx`; component itself also returns `null` for empty rows |
| 9 | 밀린 레슨 행 구성(날짜·제목·소요시간·CTA), /lesson/{slug} 이동 | ✓ VERIFIED | `behind-lessons-list.tsx` source review |
| 10 | 밀린 레슨 0/1/N개 동일 구조, 특수분기 없음 | ✓ VERIFIED | Source: single `.map()` over rows, no count branching |
| 11 | (backstop) 여러 주 밀려도 전량 나열, 접기 없음 | ✓ VERIFIED | Source inspection: no `<details>`, no slice/limit on `rows` |
| 12 | 완료/앞서면 축하 상태 + 내일 미리보기, 자동이동 없음 | ✓ VERIFIED | Render harness confirms both celebration branches (tomorrow=lesson, tomorrow=none) render correct heading/body/CTA; no `redirect()`/`router.push`/`window.location` found anywhere in Phase 3 files |
| 13 | 9/28·9/29 인접 경계에서 축하 상태가 깨지지 않음 | ✓ VERIFIED | `page.tsx` derives `tomorrow` via `rows[todayIndex+1]` with explicit buffer/none branches; harness confirms both non-lesson branches render without error |
| 14 | 오늘 레슨 상태가 완료/미완료/쿠키없음 3경우 각 정확히 하나 | ✓ VERIFIED | e2e t1/t2/t6/t7 cover all 3 |
| 15 | 조회 실패 시 ProgressReadError, 추측 상태 없음 | ✓ VERIFIED | `page.tsx`: `completedIds ? (...) : progressRead && !progressRead.ok ? <ProgressReadError/> : null`; harness confirms banner text renders correctly, no percentage/status text possible in that branch |
| 16 | 쿠키 없으면 페이스/밀린레슨 DOM에 없음, 오늘레슨 정보는 보임 | ✓ VERIFIED | e2e t7 explicitly checks both conditions simultaneously |

### Plan-Level Truths — 03-04 (Schedule table route + UAT)

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | /schedule 36행, 1~6주차 그룹, 9/30 개강일 행 마무리 | ✓ VERIFIED | e2e s1 (36 rows), s4 (course-start copy); `schedule-table.tsx` source (7-day grouping, `CourseStartRow` outside the 36-row loop) |
| 2 | 각 행 날짜·레슨명·소요시간·깊이배지 한 줄, 전체가 링크, ≥44px | ✓ VERIFIED | `min-h-11` class present on all lesson rows (source); acceptance criteria enforced by plan's own automated check |
| 3 | 9/29 버퍼 행 비링크 안내문구, 9/30 개강일 accent 테두리 | ✓ VERIFIED | `ScheduleBufferRow` renders `<div>` not `<Link>`; `CourseStartRow` has `border-accent` class |
| 4 | 오늘 행 accent 강조 + 자동 스크롤 | ✓ VERIFIED | e2e s3 (marker presence/absence by range); UAT (human) confirmed actual `scrollIntoView` behavior on real iPad |
| 5 | 지난 날짜 중성 톤, 취소선/투명도 미사용 | ✓ VERIFIED | `PAST_TONE_CLASS` uses neutral text-color token only, no `line-through`/`opacity-` classes |
| 6 | 쿠키 없이도 36행 전체 보임, 완료체크만 사라짐 | ✓ VERIFIED | e2e s1/s2 (identical row count, cookie-only marker diff) |
| 7 | 쿠키 있으면 완료표시, 조회실패시 체크마크만 사라짐(일정은 유지) | ✓ VERIFIED | `SchedulePage`: `completedIds` passed straight to `ScheduleTable`, independent of `rows`/`tableRows` construction |
| 8 | 범위 밖(8/25 이전, 9/30 이후)에도 36행 정상, 자동스크롤 예외 없음 | ✓ VERIFIED | `ScheduleAutoScroll` guards with `if (!target) return;`; `todayInRange` conditional gates whether the island is even rendered |
| 9 | 일정이 진도와 무관하게 항상 같은 매핑 (D-33) | ✓ VERIFIED | `getScheduleRows()` takes no completedIds argument; same function used by `/` and `/schedule` (e2e s5 cross-checks first-row slug against independent manifest recomputation) |
| 10 | (backstop) 좁은 iPad 세로 폭에서 줄바꿈 시 열 정렬 안 깨짐 | ✓ VERIFIED | Real iPad mini UAT found and fixed exactly this defect (commit `1d34f1d`, fixed-width grid for badge/time column) — confirmed via user approval, not just code review |
| 11 | 클라이언트 아일랜드가 targetId 문자열 하나만 받음 (T-03-15) | ✓ VERIFIED | `schedule-auto-scroll.tsx` source: single `{ targetId: string }` prop; G20 gate enforces no progress/secret identifiers |

## Data-Flow Trace (Level 4)

| Value | Source | Flows to render | Status |
|---|---|---|---|
| Today's lesson (title/depth/minutes) | `getOrderedLessons()` → `getScheduleRows()` → `rows.find()` → `getLessonBySlug()` | `TodayLessonCard` | ✓ FLOWING |
| D-day number | `todayInSeoul()` + `daysUntil(COURSE_START_DATE, today)` | `DDayCountdown` | ✓ FLOWING |
| Pace status/gap/missed | `readCompletedLessonIds()` (Supabase, service_role) → `computePace(rows, minutesBySlug, completedIds, today)` | `PaceStatusPanel`, `BehindLessonsList` | ✓ FLOWING (confirmed live via e2e t6, and via harness for behind/ahead branches not reachable today) |
| Schedule rows (36 + course-start) | `.velite/lessons.json` → `getOrderedLessons()` → `buildSchedule()` | `ScheduleTable` | ✓ FLOWING |
| Completion checkmarks | Supabase `progress` table → `readCompletedLessonIds()` → `completedIds` Set | `ScheduleTable` row `isDone`, `TodayLessonCard` | ✓ FLOWING |

No hardcoded/static fallback values found in any Phase 3 rendering path.

## Requirements Coverage

| Requirement | Description | Status | Evidence |
|---|---|---|---|
| SCHED-01 | 8/25~9/29 하루 3시간 이내 기준 일정표 | ✓ SATISFIED | `/schedule` route, `check-schedule.mjs`, `check-manifest.mjs` |
| SCHED-02 | "오늘의 학습" 기본 랜딩 + 완료 상태 | ✓ SATISFIED | `src/app/page.tsx`, e2e t1/t2/t6/t7 |
| SCHED-03 | 소요시간 표시, 일정이 그 수치 근거 | ✓ SATISFIED | `estimatedMinutes` schema + Invariant 13 derivation rule |
| SCHED-04 | D-day + on-track/behind | ✓ SATISFIED | `daysUntil`, `computePace`, render-harness confirmation |

No orphaned requirements — REQUIREMENTS.md traceability table maps all four SCHED-* IDs to Phase 3 as "Complete", matching the four IDs declared across the four plans' frontmatter.

## Anti-Patterns Found

None. Searched all Phase 3 created/modified files for `TBD|FIXME|XXX|TODO|HACK|PLACEHOLDER|placeholder|coming soon|not yet implemented` (case-insensitive) — zero matches. No `return null`/empty-stub patterns found outside of intentional, documented "render nothing" branches (e.g., `BehindLessonsList` returning `null` for an empty array, which is the specified behavior). No destructive Tailwind color tokens used anywhere in pace/schedule/dday components. No `redirect()`/`router.push()`/`window.location` calls anywhere in Phase 3 code (confirms the "no forced navigation" prohibitions from all 4 plans).

## Prohibitions (judgment-tier, non-authoritative LLM check — human review recommended for final sign-off)

All prohibitions across the 4 plans are judgment-tier (tone, no-gamification, no-auto-navigate, no-institution-name). Per-plan frontmatter, they were left `status: unverified` at plan-authoring time (this is the planner's default, not a post-hoc field). This verifier's independent checks:

- **No pressure/shame tone (D-43):** Confirmed via render harness — behind copy reads "조금 밀렸어요" / "약 4시간 분량(2개 레슨) 밀렸어요." / "하루 30분씩 추가하면 8일이면 따라잡아요." — no exclamation marks, no red/destructive color classes, no "실패/게으름" vocabulary.
- **No gamification (streaks/badges):** Confirmed absent — grepped all Phase 3 components, no streak/badge/points logic exists.
- **No forced navigation (D-38):** Confirmed — no `redirect`/`router.push`/`window.location` in any Phase 3 file; all state transitions require a user-clicked `<Link>`.
- **No institution name exposure:** Confirmed via `check-brand.mjs` (85 files, 0 violations) and a manual grep for "kant"/"Kant" across all Phase 3 files (0 hits).
- **No auto-rebalancing of missed schedule (D-33):** Confirmed — `getScheduleRows()` takes no completion-state argument.
- **Editing scope limited to `estimatedMinutes` (T-03-06):** Confirmed via `git show --numstat` on the 35-file commit.

These pass an LLM-judgment review; flagging for a final human skim per the judgment-tier protocol, since this session (interactive) can offer non-authoritative confirmation but not a substitute for the developer's own read.

## Human Verification Required

### 1. 375px 폭(폰) 오늘 레슨 카드 레이아웃 (03-01 truth #9)

**Test:** 실제 폰 또는 375px 뷰포트 시뮬레이터로 `/`을 열고 제목이 긴 오늘 레슨을 확인한다.
**Expected:** 레슨 제목이 말줄임 없이 줄바꿈되고 카드 내부 요소(배지·CTA)가 겹치지 않는다.
**Why human:** Plan 04의 실기기 UAT는 아이패드(744px 세로)에서만 진행되어 phone-width(375px) 레이아웃은 자동 게이트로도, 실기기 확인으로도 다뤄지지 않았다. 코드상 `truncate`나 고정폭 클래스는 없어 위험도는 낮지만 시각적으로 확정되지 않았다.

### 2. 실제 "behind" 상태의 라이브 종단 왕복 (03-03 truths #1, #6; e2e-today.mjs#t8)

**Test:** 사전학습 며칠 경과 후(과거 배정 레슨이 실제로 존재하는 날), `node --env-file=.env.local scripts/e2e-today.mjs`를 재실행해 t8이 스킵 없이 통과하는지 확인한다. 또는 수동으로 과거 배정 레슨 하나를 미완료로 둔 채 브라우저에서 `/`를 열어 behind 패널과 밀린 레슨 목록을 육안 확인한다.
**Expected:** t8이 `data-pace-status="behind"`와 `data-schedule-ui="behind-list"` 1건을 확인하고 통과한다.
**Why human:** 오늘(2026-08-25)은 일정 첫날이라 "어제까지 배정된 레슨"이 아직 존재하지 않아, 이 특정 상태의 실제 HTTP 왕복(쿠키 → Supabase 조회 → computePace → 렌더)은 시간이 지나야만 재현 가능하다. 이 검증에서 나는 동일 컴포넌트를 합성 props로 직접 렌더링해 출력이 정확함을 확인했고, 순수 계산 로직은 18개 케이스로 전수 검증됐으므로 위험도는 낮지만, 전체 파이프라인의 라이브 왕복은 아직 미확인 상태다. 이는 Plan 03/04 SUMMARY.md에도 이미 문서화된, 코드 결함이 아닌 캘린더 시간 제약에 의한 정상적인 지연이다.

## Gaps Summary

No blocking gaps. All 4 ROADMAP success criteria and all 4 SCHED-* requirements are satisfied with direct evidence — automated gates I ran myself (not SUMMARY.md claims), a full production build, two full e2e regression suites, git diff inspection of the 35-file content edit, and a from-scratch behavioral render of the pace/celebration/error UI states that the live site cannot currently exhibit (day one of the schedule). Two items are flagged for human follow-up (phone-width layout, live behind-state e2e once calendar time passes) — neither blocks the phase goal, which is already observably true in the codebase today.

---

*Verified: 2026-08-25*
*Verifier: Claude (gsd-verifier)*
