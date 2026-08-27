---
phase: 02-progress-tracking
plan: 04
subsystem: progress-tracking
tags: [nextjs-server-components, home-dashboard, e2e-testing, static-gates, vercel-deploy]

requires:
  - phase: 02-progress-tracking (02-03)
    provides: "progress-math.ts/progress.ts/progress-badge.tsx confirmed interfaces (overallProgress, stepProgress, nextIncompleteLesson) consumed directly, no re-exploration"
  - phase: 02-progress-tracking (02-02)
    provides: "hasUnlockCookie() cookie gate, ProgressReadError, force-dynamic + cookie-gate-first pattern (verified on the lesson page, reused verbatim on the Step page and now the home page)"
provides:
  - "src/components/progress-summary.tsx — home progress summary block (ProgressSummary), 3-state copy (empty/populated/all-complete), independent server-render + a11y contract, absorbable by Phase 3's 오늘의 학습 view per D-25"
  - "Step card real-data progress bars with per-Step identity fill colors, entirely omitted (not just visually hidden) when no progress prop is passed"
  - "Home page gated wiring — force-dynamic, unconditional hasUnlockCookie() before any read, single readCompletedLessonIds() shared by summary + 3 Step cards"
  - "e2e-progress.mjs home scenarios (i1-i5) proving the Phase's homepage success criteria against a real dev server + real Supabase DB"
  - "check-progress-gates.mjs G15/G16 regression gates + G9 extended to the home page"
  - "02-VALIDATION.md filled in with the Phase's actual test infrastructure and full per-task verification map"
  - "Production Vercel deployment verified end-to-end (env vars registered + fresh deploy confirmed live)"
affects: []

actuals:
  tokens: 10124
  tasks: 3
  commits: 5

tech-stack:
  added: []
  patterns:
    - "Independent re-derivation for cross-check assertions — the CTA target e2e check recomputes the expected first-incomplete slug from .velite/lessons.json + a regex-parsed modules.ts order map, never importing progress.ts, so a bug in the app's own calculation can't silently pass its own test (T-02-23)"
    - "Before/after delta assertions instead of absolute-zero assertions where the underlying DB state isn't script-owned — the home e2e scenario checks that the two non-probe Steps' progress bars are UNCHANGED across a probe completion, not that they equal literally 0, since the shared Supabase table also serves production and future real usage"
    - "Literal Step-identity fill-color class map (STEP_FILL_CLASSES) on the progress bar, mirroring the existing STEP_BORDER_CLASSES pattern — Tailwind JIT can't scan a dynamically assembled class string"

key-files:
  created:
    - src/components/progress-summary.tsx
  modified:
    - src/components/step-card.tsx
    - src/app/page.tsx
    - scripts/e2e-progress.mjs
    - scripts/check-progress-gates.mjs
    - .planning/phases/02-progress-tracking/02-VALIDATION.md
    - .planning/phases/02-progress-tracking/02-USER-SETUP.md
    - .planning/STATE.md
    - .planning/WINDOWS.md

key-decisions:
  - "ProgressBadge always renders in the summary block (including the empty state) — only the large 28px accent percent number is suppressed when completed===0. D-26 requires completed/total+percent together in the summary, and the truths list only forbids emphasizing the big percent number at 0, not the badge itself."
  - "Step card's progress bar fill color and percent text both come from a single `progress?: ProgressCounts | null` prop, entirely omitted (not rendered) when absent — matches D-20's 'progress UI doesn't exist in the DOM' contract rather than showing a 0% bar for locked/read-failed visitors."
  - "e2e home-scenario assertions use before/after deltas for the two non-probe Steps rather than asserting they equal 0, because the shared Supabase progress table also backs production and will carry real completions once studying starts — an absolute-zero assertion would make this gate permanently fail after Phase 2 ships."

patterns-established:
  - "CTA/derived-value e2e checks recompute the expected value independently from raw manifest data rather than importing the app's own calculation function (already established for the Step badge count in 02-03; now generalized to the home CTA target)."

requirements-completed: [TRACK-04, TRACK-03, PLAT-02]

coverage:
  - id: D1
    description: "ProgressSummary — server-renderable (no 'use client'), no self-fetch, three states (empty/populated/all-complete) rendering UI-SPEC Copywriting Contract text, progressbar a11y attributes, CTA to next incomplete lesson or /step/1 on all-complete"
    requirement: "TRACK-04"
    verification:
      - kind: unit
        ref: "Task 1 inline Node verify script (checks absence of 'use client', presence of role=progressbar + aria-value* triad)"
        status: pass
      - kind: e2e
        ref: "node --env-file=.env.local scripts/e2e-progress.mjs 시나리오 i2 (summary marker + empty-state copy + percent=0 when actual completed count is 0)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Step card real-data progress bars — hardcoded progressPercent=0 removed, progress? prop drives bar/badge, Step-identity fill color via literal class map, bar entirely absent when progress is undefined (locked or read-failure)"
    requirement: "TRACK-03"
    verification:
      - kind: unit
        ref: "Task 2 inline Node verify script (no /progressPercent\\s*=\\s*0/ in step-card.tsx) + node scripts/check-progress-gates.mjs G15"
        status: pass
      - kind: e2e
        ref: "node --env-file=.env.local scripts/e2e-progress.mjs 시나리오 i2/i3 (3 step-bar markers present, probe's own Step bar value increases while the other two are unchanged)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Home page gated wiring — force-dynamic, hasUnlockCookie() called unconditionally before any progress read, single readCompletedLessonIds() call shared by the summary and all 3 Step cards, ProgressReadError rendered on read failure with no progress UI"
    requirement: "PLAT-02"
    verification:
      - kind: unit
        ref: "Task 2 inline Node verify script (force-dynamic export + hasUnlockCookie appears before readCompletedLessonIds by string position) + node scripts/check-progress-gates.mjs G9 (home added to DYNAMIC_GATED_PAGES)"
        status: pass
      - kind: e2e
        ref: "node --env-file=.env.local scripts/e2e-progress.mjs 시나리오 i1 (no-cookie GET / has zero data-progress-ui markers, all 3 /step/N links present, site title present)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Phase-closing e2e gate — 5 home scenarios (i1-i5) proving all 5 Phase-2 success criteria on the homepage against a real dev server + real Supabase DB, plus G15 (no leftover hardcoded 0) and G16 (no /dashboard route regression, D-25) static gates"
    requirement: "TRACK-03, TRACK-04, PLAT-02"
    verification:
      - kind: e2e
        ref: "node --env-file=.env.local scripts/e2e-progress.mjs (full run — all scenarios i1-i5, b-e, h1-h4, g1-g5 pass; probe row confirmed absent from the live progress table both before and after the run)"
        status: pass
      - kind: other
        ref: "node --env-file=.env.local scripts/check-progress-gates.mjs (all gates including G9/G15/G16 pass)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Build-artifact secret scan (G10) actually exercised against a real npm run build output, not silently skipped"
    requirement: "PLAT-02"
    verification:
      - kind: other
        ref: "npm run build && node --env-file=.env.local scripts/check-progress-gates.mjs (G10 runs — no 'skipped' line — and passes, confirming no SUPABASE_SERVICE_ROLE_KEY/UNLOCK_SECRET literal reaches .next/static)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Production Vercel deployment verified end-to-end after resolving a stale-deploy issue (30 unpushed commits) and a UNLOCK_SECRET value mismatch — production /unlock now issues a valid HttpOnly cookie and the production home page renders the summary + 3 step-bar markers for a valid unlock cookie"
    requirement: "PLAT-02"
    verification:
      - kind: other
        ref: "Read-only GET probe against https://ai-engineer-runway.vercel.app/unlock?key=<local UNLOCK_SECRET> (redirect: manual) — status 307, Location contains state=ok, Set-Cookie present + HttpOnly; follow-up GET / with that cookie shows data-progress-ui=\"summary\" and 3x data-progress-ui=\"step-bar\", no read-error marker"
        status: pass
    human_judgment: false
  - id: D7
    description: "Phase 2's five success criteria confirmed on the production URL and an iPad real device — device-switch persistence, progress display accuracy, CTA correctness, external-visitor DOM absence via devtools, iPad touch/motion/theme UX (12 human-check items, Task 3 human-check A-D)"
    verification: []
    human_judgment: true
    rationale: "workflow.human_verify_mode=end-of-phase (default) — Task 3's <verify><human-check> 12 items are not executed now; they are harvested by /gsd-verify-work's end-of-phase UAT flow, consistent with the pattern already established by 02-02 and 02-03 in this same phase. All 12 items are automatable-in-spirit but require an actual iPad and human visual/tactile judgment (animation feel, touch-target comfort, devtools element inspection) that the e2e scripts already prove structurally (i1-i5, h1-h4, g1-g5) but cannot substitute for. Recorded in .planning/WINDOWS.md as unrun-verify (entry 3, phase 02, src/app/page.tsx)."

duration: "약 55분 (프리컨디션 재확인·프로덕션 배포 디버깅 대기 시간 포함)"
completed: 2026-08-24
status: complete
---

# Phase 2 Plan 4: 홈 대시보드와 Phase 종단 게이트 Summary

**홈 진행률 요약 블록 + Step 카드 실데이터 + 5개 e2e 홈 시나리오로 Phase 2의 다섯 성공 기준을 개발 서버·실 Supabase·실 프로덕션 3곳에서 증명하고, 도중 발견한 프로덕션 배포 정체(30개 미푸시 커밋)와 UNLOCK_SECRET 불일치를 모두 해소**

## Performance

- **Duration:** 약 55분 (Task 3 시작 시 프리컨디션 미충족으로 두 차례 정지·재개, 프로덕션 재배포 대기 시간 포함)
- **Started:** 2026-08-24T08:46:59Z
- **Completed:** 2026-08-24T09:42:11Z
- **Tasks:** 3 (전부 auto, Task 3는 precondition gate로 두 번 중단·재개)
- **Files modified:** 9 (created 1, modified 8)

## Accomplishments

- `src/components/progress-summary.tsx`: 서버 렌더 전용 `ProgressSummary` — 완료 0건/진행 중/전건 완료 3상태를 UI-SPEC Copywriting Contract 그대로 렌더, empty state에서만 28px 큰 퍼센트 숫자를 생략, CTA는 미완료 시 `/lesson/{다음 미완료 slug}`(이어서 학습하기) 전건 완료 시 `/step/1`(커리큘럼 처음으로)로 분기
- `src/components/step-card.tsx`: 하드코딩 `progressPercent = 0`과 Phase 1 예고 주석 제거, `progress?: ProgressCounts | null` prop으로 실데이터 주입, Step 상징 색 채움 리터럴 클래스 맵(`STEP_FILL_CLASSES`), progress prop이 없으면 바/배지 자체를 렌더하지 않음(잠금 없음·조회 실패 공용 폴백)
- `src/app/page.tsx`: `force-dynamic` 선언, `hasUnlockCookie()`를 어떤 조회보다 먼저 무조건 호출, `readCompletedLessonIds()` 요청당 1회만 호출해 요약 블록과 Step 카드 3장이 결과를 공유, 조회 실패 시 `ProgressReadError` 렌더
- `scripts/e2e-progress.mjs`: 홈 시나리오 5개(i1-i5) 추가 — 쿠키 없음(마커 0건+링크 3개), 잠금 쿠키(요약+바 3개 존재, 완료 0건이면 empty state 문구·퍼센트 0 확인), 프로브 완료(전체+해당 Step만 증가, 나머지 두 Step은 before/after delta로 불변 확인), CTA 대상 독립 재계산 검증(앱 코드 재사용 없이 매니페스트+modules.ts 정규식 파싱으로 기대 slug 산출), 프로브 삭제 후 원상 복구 확인
- `scripts/check-progress-gates.mjs`: G9에 홈 페이지 추가, G15(step-card.tsx 하드코딩 0 회귀 방지) 신설, G16(`/dashboard` 라우트 부재 — D-25 회귀 방지) 신설
- `.planning/phases/02-progress-tracking/02-VALIDATION.md`: 템플릿 자리표시자를 Phase 2 실제 값으로 전부 채움 — 게이트 스크립트 4종 인벤토리, 12개 태스크 전체 검증 맵, 수동 전용 항목 3개(D-23 애니메이션 체감, 아이패드 실기기 UX, 기기 전환+외부인 차단 실기기 확인)
- 프로덕션 배포 정체 발견·해소: 로컬 30개 커밋(`02-01`~`02-04` Task 1-2)이 `origin/master`에 한 번도 푸시되지 않아 Vercel 재배포가 Phase 1 시절 빌드를 다시 서빙 — `git push origin master`로 해결(Phase 1 Plan 6과 동일 패턴, Rule 3)
- `UNLOCK_SECRET` 프로덕션 값 불일치 발견·해소: 재배포 후에도 `/unlock`이 `state=invalid`를 반환 — 사용자가 Vercel Production 환경변수를 재저장한 뒤 읽기 전용 프로브로 최종 확인(`state=ok` + HttpOnly 쿠키 발급 + 홈 요약/Step 바 마커 정상 렌더)

## Task Commits

Each task was committed atomically:

1. **Task 1: 홈 전체 진행률 요약 블록과 이어서 학습하기 CTA** - `957f673` (feat)
2. **Task 2: Step 카드 실데이터 연결과 홈 배선** - `9936ac7` (feat)
3. **Task 3 (interim, precondition blocked)** - `463519a` (docs — first blocker note)
4. **Task 3 (interim, precondition re-check, root-caused stale deploy)** - `902e8be` (docs — pushed origin/master, narrowed blocker to UNLOCK_SECRET mismatch)
5. **Task 3: Phase 종단 게이트 — 다섯 성공 기준 전부 훑기** - `0ea0ffe` (feat — precondition confirmed met, e2e/gates/validation-doc work completed)

**Plan metadata:** (다음 커밋에서 기록)

## Files Created/Modified

- `src/components/progress-summary.tsx` - 홈 진행률 요약 블록
- `src/components/step-card.tsx` - 실데이터 Step 카드 (Step 상징 색 진행률 바)
- `src/app/page.tsx` - 홈 게이트 + 요약 블록/Step 진도 주입
- `scripts/e2e-progress.mjs` - 홈 시나리오 5개(i1-i5) 추가
- `scripts/check-progress-gates.mjs` - G9 확장·G15·G16 신설
- `.planning/phases/02-progress-tracking/02-VALIDATION.md` - 템플릿 → 실제 값
- `.planning/phases/02-progress-tracking/02-USER-SETUP.md` - Vercel 배선 완료로 상태 갱신
- `.planning/STATE.md` - 블로커 기록 2건(발견→해소)
- `.planning/WINDOWS.md` - Task 3 human-check 12개 항목을 unrun-verify로 기록

## Decisions Made

- ProgressSummary는 empty state에서도 `ProgressBadge`(완료 0/전체 · 0%)는 렌더하고 28px 큰 퍼센트 숫자만 생략 — D-26이 배지 표시를 상시 요구하고, must_haves.truths는 큰 퍼센트 숫자 강조만 금지하기 때문
- Step 카드 진행률 바/배지는 `progress` prop 부재 시 완전히 렌더하지 않음(0%로 표시하지 않음) — D-20의 "진도 요소 존재 자체가 안 보임" 요구를 Phase 1의 상시 0% 바 관행보다 우선
- e2e 홈 시나리오의 "나머지 두 Step 불변" 검증은 절대값 0이 아니라 before/after delta로 판정 — 같은 Supabase 테이블이 프로덕션도 서빙하므로, 이 Phase 이후 실사용 진도가 쌓이면 절대값 0 단언은 영구히 깨지는 게이트가 됨

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Task 3의 명시된 자동 검증 명령이 자기 의도(G10 실제 실행)를 스스로 무효화**
- **Found during:** Task 3 (`npm run build && node scripts/check-progress-gates.mjs ...` 최초 실행)
- **Issue:** Plan의 action 항목 (2)는 "G10(빌드 산출물 시크릿 스캔)이 실제로 실행되도록"라고 명시했지만, 제시된 `<verify><automated>` 명령의 `node scripts/check-progress-gates.mjs` 호출에는 `--env-file=.env.local`이 없어 `SUPABASE_SERVICE_ROLE_KEY`/`UNLOCK_SECRET`이 프로세스 환경에 없었고, G10은 "secret env vars not present in this run"으로 조용히 skip됨 — 명시된 acceptance criterion("G10이 실제로 실행되어 통과한다")과 모순
- **Fix:** 이 태스크의 검증 시 `check-progress-gates.mjs`를 `node --env-file=.env.local scripts/check-progress-gates.mjs`로 실행 — G10이 실제로 `.next/static`을 스캔하고 통과함을 확인
- **Files modified:** 없음(검증 명령 실행 방식만 수정, 스크립트 자체는 변경 없음)
- **Verification:** `node --env-file=.env.local scripts/check-progress-gates.mjs` 출력에서 "G10 skipped" 라인 없이 "all gates passed" 확인
- **Committed in:** `0ea0ffe` (검증 실행 방식 변경이므로 코드 커밋 없음, 이 SUMMARY에 기록)

**2. [Rule 3 - Blocking] 프로덕션이 30개 미푸시 로컬 커밋으로 인해 Phase 1 시절 빌드를 서빙**
- **Found during:** Task 3 precondition 재확인 (사용자가 Vercel 환경변수 등록 완료를 알린 직후)
- **Issue:** `git log --oneline origin/master..HEAD`로 `02-01`부터 이 Plan의 Task 1-2까지 30개 커밋이 전부 로컬에만 존재함을 발견 — 사용자의 Vercel 재배포는 이 오래된 커밋을 다시 빌드했을 뿐이라 `/unlock` 라우트 자체가 없어 404를 반환(키 값과 무관하게 항상 404)
- **Fix:** `git push origin master` (Phase 1 Plan 6에서 동일 패턴을 이미 겪고 기록한 대응을 그대로 적용, STATE.md 결정 로그 참고)
- **Files modified:** 없음(git push, 파일 변경 없음)
- **Verification:** 푸시 후 최대 4분 폴링으로 `/unlock`이 404→307로 바뀜을 확인해 새 빌드가 라이브임을 증명
- **Committed in:** N/A (원격 푸시, 로컬 커밋 아님) — `902e8be`가 이 발견과 조치를 문서화

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking issue). **Impact:** 둘 다 검증 파이프라인·배포 프로세스 자체의 정확성 문제이며 애플리케이션 코드 로직에는 영향 없음. 범위 확장 없음.

## Precondition Gate Resolution

Task 3의 `<precondition>`(Vercel Production 4종 env var 등록)이 최초 실행 시 미충족으로 판정되어 체크포인트로 두 차례 정지했다:

1. **1차 정지:** 읽기 전용 프로브(`GET /unlock?key=<local secret>`, `redirect: manual`)가 `404`를 반환 — 처음에는 env var 문제로 보였으나, 재조사 결과 프로덕션이 애초에 이 코드(`/unlock` 라우트 자체)를 갖고 있지 않은 30커밋 뒤진 배포임을 확인(Deviation #2). `git push origin master`로 해결, 재배포까지 최대 4분 폴링으로 확인.
2. **2차 정지:** 새 배포가 라이브된 뒤에도 프로브가 `state=invalid`를 반환 — `UNLOCK_SECRET` 값이 로컬과 프로덕션 사이에 불일치. 이건 코드로 자동 수정 불가능한 항목(Vercel 대시보드 값 자체의 문제)이라 사용자에게 재확인·재저장을 요청했고, 사용자가 완료를 알린 뒤 프로브가 `state=ok` + `HttpOnly` 쿠키 발급 + 홈 요약/Step 바 마커 정상 렌더로 확정됐다.

두 정지 모두 비밀값을 로그에 출력하지 않고 상태 코드·리다이렉트 대상·쿠키 존재 여부만으로 판정했다.

## Issues Encountered

- Task 3의 `<verify><human-check>` 12개 항목(A. 기기 전환, B. 진행률 표시, C. 외부인 차단, D. 아이패드 경험)은 `workflow.human_verify_mode=end-of-phase`(기본값)에 따라 지금 실행되지 않음 — `/gsd-verify-work`의 end-of-phase UAT 흐름에서 harvest됨. `.planning/WINDOWS.md`에 `unrun-verify`로 기록(02-02/02-03에 이어 세 번째 항목, 이번 Phase의 마지막 배치).
- `npm run lint`가 이 Plan이 만들지 않은 Phase 1 파일 2곳(`src/components/lesson-nav.tsx`, `src/components/theme-toggle.tsx`)에서 사전 존재하는 오류를 계속 보고함(02-01/02-02/02-03에서 이미 확인·기록된 것과 동일, `.planning/phases/02-progress-tracking/deferred-items.md` 참고). 이 Plan이 만든/수정한 파일만 골라 `npx eslint`로 실행하면 0건 통과. 범위 밖이므로 수정하지 않음.

## User Setup Required

None remaining — `.planning/phases/02-progress-tracking/02-USER-SETUP.md`의 Vercel 환경변수 4종 등록이 이 Plan 중 완료·검증됨(Status: Complete로 갱신).

## Next Phase Readiness

- Phase 2의 다섯 성공 기준이 개발 서버+실 Supabase(`e2e-progress.mjs` 전체 통과)와 실 프로덕션(읽기 전용 프로브) 양쪽에서 자동 검증됨. 사람 확인 12개 항목만 end-of-phase UAT로 남음.
- `TRACK-03`/`TRACK-04`/`PLAT-02` 3개 공유 요구사항은 이 Plan의 SUMMARY가 각 요구사항을 선언한 마지막 Plan이므로 `requirements.ready-ids` 확인 후 즉시 완료 표시 예정(이 SUMMARY 커밋 직후 처리).
- 프로덕션 배포 상태가 이번 Plan 중 처음으로 실제 검증됨(이전까지는 로컬 `.env.local` 기준으로만 검증되어 왔음) — Phase 3부터는 로컬 커밋을 주기적으로 push하는 습관이 필요함(이번에 발견된 30커밋 지연이 재발하지 않도록).
- 블로커 없음(두 건 모두 이 Plan 안에서 발견·해소 완료).

## Self-Check: PASSED

- All 9 created/modified files verified present on disk with expected content (`progress-summary.tsx` created; `step-card.tsx`, `page.tsx`, `e2e-progress.mjs`, `check-progress-gates.mjs`, `02-VALIDATION.md`, `02-USER-SETUP.md`, `STATE.md`, `WINDOWS.md` modified)
- All 5 commits (`957f673`, `9936ac7`, `463519a`, `902e8be`, `0ea0ffe`) verified present in `git log --oneline --all`
- Re-ran plan-level `<verification>`: `npm run build && node --env-file=.env.local scripts/check-progress-gates.mjs && node scripts/check-progress-math.mjs && node scripts/check-brand.mjs && node scripts/check-manifest.mjs && node --env-file=.env.local scripts/check-supabase-progress.mjs && node --env-file=.env.local scripts/e2e-progress.mjs && npx tsc --noEmit` — all exit 0
- `npx eslint` scoped to this Plan's files (all tasks) — 0 issues; full `npm run lint` still reports the same 2 pre-existing Phase 1 issues (out of scope, unrelated files, unchanged count from 02-01/02-02/02-03)
- Production progress table confirmed empty of script-created rows both before and after the e2e run (direct read via service_role client)
- Production `/unlock` + home page confirmed working via read-only probe (no secrets printed)

---
*Phase: 02-progress-tracking*
*Completed: 2026-08-24*
