---
phase: 03-schedule-and-today
plan: 01
subsystem: ui
tags: [nextjs, app-router, force-dynamic, korean-timezone, boundary-testing, e2e]

# Dependency graph
requires:
  - phase: 02-progress-tracking
    provides: hasUnlockCookie(), readCompletedLessonIds(), overallProgress(), stepProgress(), nextIncompleteLesson(), progress-summary/progress-error/step-card components
provides:
  - "오늘의 학습" home page rendering D-day countdown + today's assigned lesson, cookie-independent
  - /curriculum route hosting the Step-card grid (moved from home) with its own force-dynamic + hasUnlockCookie gate
  - src/lib/today.ts, src/lib/schedule.ts — zero-dependency pure modules (todayInSeoul, daysUntil, buildSchedule, scheduleTotalDays)
  - src/lib/schedule-data.ts — manifest-coupling layer (getScheduleRows, getLessonMinutesBySlug)
  - 4-item active global nav (/, /curriculum, /schedule, /about)
  - scripts/e2e-today.mjs (5-scenario real-server round trip) and scripts/check-schedule.mjs (18-case boundary gate)
  - check-progress-gates.mjs G17 (cookie-gate ordering on / and /curriculum) and G18 (today.ts/schedule.ts stay import-free)
affects: [03-schedule-and-today (Plans 02-04 build pace/schedule-table/behind-lessons on top of these modules)]

# Actuals (#2632)
actuals:
  tokens: 10054
  tasks: 2
  commits: 2

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Zero-dependency pure modules (today.ts, schedule.ts) loaded directly by Node 22.6+ type-stripping in gate scripts — no transpiler step"
    - "Route-level cookie gate duplication: force-dynamic + hasUnlockCookie() first-call is copied per-route (not inherited) since Next.js RSC route segments don't inherit dynamic rendering from siblings"
    - "Independent gate re-derivation: e2e-today.mjs recomputes expected schedule from .velite/lessons.json + regex-parsed modules.ts instead of importing app code, so a shared bug can't pass its own check"

key-files:
  created:
    - src/lib/today.ts
    - src/lib/schedule.ts
    - src/lib/schedule-data.ts
    - src/components/dday-countdown.tsx
    - src/components/today-lesson-card.tsx
    - src/app/curriculum/page.tsx
    - scripts/e2e-today.mjs
    - scripts/check-schedule.mjs
  modified:
    - src/app/page.tsx
    - src/components/site-nav.tsx
    - scripts/check-progress-gates.mjs

key-decisions:
  - "Home page reorganized to '오늘의 학습' (today's lesson) with D-day countdown; Step grid dashboard relocated to new /curriculum route, each route independently re-gating hasUnlockCookie before any progress read (Pitfall 4)"
  - "today.ts/schedule.ts kept at zero import statements (like progress-math.ts) so check-schedule.mjs loads them via Node's native TypeScript stripping without a transpiler"
  - "Schedule assignment always derived from getOrderedLessons() slug order, never a hardcoded 35-entry date map (D-32/D-33)"

patterns-established:
  - "Boundary-value gate scripts (check-schedule.mjs) mirror check-progress-math.mjs's runCase/failures/exit-1 structure for pure-function modules"
  - "Cookie-gate-ordering static checks (G14, G17) verify string-index precedence of hasUnlockCookie vs the data-read call in route source, catching silent gate-skip regressions without running the server"

requirements-completed: [SCHED-01, SCHED-02, SCHED-04]

coverage:
  - id: D1
    description: "홈(/)이 '오늘의 학습' 화면으로 재편되어 D-day 카운트다운과 오늘 배정 레슨 카드를 쿠키 여부와 무관하게 렌더한다"
    requirement: "SCHED-01"
    verification:
      - kind: e2e
        ref: "scripts/e2e-today.mjs#t1 (쿠키 없음 → dday 1건 + today-card 1건 + 진도 마커 0건)"
        status: pass
      - kind: unit
        ref: "scripts/check-schedule.mjs (18 cases: buildSchedule/scheduleTotalDays/todayInSeoul/daysUntil boundaries)"
        status: pass
    human_judgment: false
  - id: D2
    description: "오늘이 개강 전(8/25 이전)이면 '곧 시작해요', 개강 후(9/30 이상)면 '개강했어요!' 상태를 빈 화면 없이 렌더한다"
    requirement: "SCHED-02"
    verification:
      - kind: e2e
        ref: "scripts/e2e-today.mjs#t2 (오늘 날짜 분기별 홈 상태 문구/링크)"
        status: pass
    human_judgment: false
  - id: D3
    description: "D-day가 'D-{n}' 형태로 표시되고 개강일 당일·이후에는 음수 대신 'D-DAY'로 표시된다"
    requirement: "SCHED-04"
    verification:
      - kind: unit
        ref: "scripts/check-schedule.mjs (daysUntil: 36/1/0/-1 boundary cases)"
        status: pass
    human_judgment: false
  - id: D4
    description: "/curriculum이 Step 카드 3개 + 쿠키 보유 시 Step별 진행률 바를 렌더하고, 쿠키 없는 응답에는 진도 마커가 0건이다"
    verification:
      - kind: e2e
        ref: "scripts/e2e-today.mjs#t3, #t4 (Step 링크 3건 + 진도 마커 0건 / 진행률 바 3건)"
        status: pass
    human_judgment: false
  - id: D5
    description: "글로벌 내비 4항목(오늘의 학습/커리큘럼/일정표/소개)이 모두 활성 링크다"
    verification:
      - kind: e2e
        ref: "scripts/e2e-today.mjs#t5 (내비 4개 href 전부 존재)"
        status: pass
    human_judgment: false
  - id: D6
    description: "홈·/curriculum 라우트 게이트 순서(hasUnlockCookie 우선)와 today.ts/schedule.ts의 의존성 0 원칙이 상시 게이트로 굳었다"
    verification:
      - kind: unit
        ref: "scripts/check-progress-gates.mjs G17, G18 — all gates passed"
        status: pass
    human_judgment: false
  - id: D7
    description: "D-day 표시 톤(경고색·재촉 문구 금지)과 375px 폭 카드 레이아웃(줄바꿈, 겹침 없음)이 실제 화면에서 의도대로 보인다"
    verification: []
    human_judgment: true
    rationale: "시각적 톤·레이아웃 판단은 코드로 자동 검증할 수 없는 인간 판단 영역 — 체크포인트에서 사용자가 이미 직접 확인하고 'verified' 승인함"

# Metrics
duration: ~36min (includes a human-verify checkpoint pause between Task 1 and Task 2)
completed: 2026-08-24
status: complete
---

# Phase 3 Plan 1: 트레이서 — 오늘의 학습 홈 재편 Summary

**매니페스트 파생 일정(35레슨 하루 1개 + 버퍼일)에서 D-day·오늘 레슨까지 이어지는 경로를 홈에 뚫고, Step 대시보드는 /curriculum으로 분리했으며, 경계값 18케이스 게이트와 라우트 게이트 2건을 상시화했다**

## Performance

- **Duration:** ~36min (Task 1: dfc7221→37b41e2, 체크포인트 대기 포함; Task 2: 37b41e2→90cd22d)
- **Completed:** 2026-08-24
- **Tasks:** 2/2
- **Files modified:** 11 (9 in Task 1, 2 in Task 2)

## Accomplishments
- 홈(`/`)이 "오늘의 학습" 화면으로 재편되어 D-day 카운트다운과 오늘 배정 레슨 카드를 쿠키 여부와 무관하게 렌더한다
- Step 카드 대시보드가 `/curriculum`으로 분리 이전되어 자체 `force-dynamic` + `hasUnlockCookie()` 게이트를 복제했다 (Pitfall 4 회피)
- `today.ts`/`schedule.ts` 의존성 0 순수 모듈 + `schedule-data.ts` 매니페스트 결합 층이 완성되어 이후 페이스·일정표 Plan(03-02~04)의 기반이 됐다
- 글로벌 내비 4항목(오늘의 학습/커리큘럼/일정표/소개)이 전부 활성 링크로 점등됐다 (`/schedule`은 Plan 04까지 404지만 링크 자체는 존재)
- `scripts/e2e-today.mjs`(실서버 5시나리오)와 `scripts/check-schedule.mjs`(18케이스 경계값)로 왕복·경계 양쪽을 상시 검증한다
- `check-progress-gates.mjs`에 G17(라우트 게이트 순서)·G18(순수 모듈 유지) 추가로 회귀 방지선을 굳혔다

## Task Commits

Each task was committed atomically:

1. **Task 1: 트레이서 — 매니페스트에서 오늘 레슨·D-day까지 한 줄기로 뚫기** - `37b41e2` (feat)
2. **Task 2: 일정 경계값 단위 게이트와 라우트 게이트 상시화** - `90cd22d` (feat)

**Plan metadata:** (this commit, following SUMMARY.md creation)

## Files Created/Modified
- `src/lib/today.ts` - `todayInSeoul(now?)`, `daysUntil(target, from)` — 의존성 0, Asia/Seoul 자정 경계 정확
- `src/lib/schedule.ts` - `SCHEDULE_START`, `COURSE_START_DATE`, `scheduleTotalDays`, `buildSchedule` — 의존성 0
- `src/lib/schedule-data.ts` - `getScheduleRows()`, `getLessonMinutesBySlug()` — 매니페스트 결합 얇은 층
- `src/components/dday-countdown.tsx` - D-day 표시(`D-{n}`/`D-DAY`), 재촉 톤 없음
- `src/components/today-lesson-card.tsx` - 4상태(`before-start`/`assigned`/`buffer`/`after-range`) 카드
- `src/app/page.tsx` - "오늘의 학습" 재편, ProgressSummary/ProgressReadError 3분기 보존
- `src/app/curriculum/page.tsx` - 신설, Step 그리드 이전 + 자체 게이트 복제
- `src/components/site-nav.tsx` - `NAV_ITEMS` 4항목 href 전부 채움
- `scripts/e2e-today.mjs` - 실서버 왕복 5시나리오, 독립 기대값 재계산
- `scripts/check-schedule.mjs` - 18케이스 경계값 단위 게이트 (Task 2 신규)
- `scripts/check-progress-gates.mjs` - G17(라우트 게이트 순서), G18(순수 모듈 유지) 추가 (Task 2)

## Decisions Made
- 홈 재편은 CONTEXT.md가 이미 사용자 결정으로 확정한 사항이라 체크포인트로 재확인하지 않고 트레이서 태스크로 직행 (reversibility="costly"로 문서화)
- `today.ts`/`schedule.ts`는 `progress-math.ts`와 같은 이유로 import 0을 유지 — 게이트 스크립트가 트랜스파일러 없이 직접 로드
- 일정 배정은 항상 `getOrderedLessons()` slug 순서에서 파생, 35개 날짜→레슨 하드코딩 상수를 쓰지 않음

## Deviations from Plan

None - plan executed exactly as written. Task 2 was scoped and implemented per the plan's `<action>` section without architectural changes.

## Issues Encountered
- e2e-today.mjs 최초 실행 시 이전 실행자 세션이 남긴 leftover dev 서버(포트 3000, PID 37256)가 Next.js의 단일 인스턴스 잠금 때문에 e2e 스크립트의 포트 3211 서버 기동을 막았음(`Another next dev server is already running.`). Leftover 프로세스를 종료(`taskkill /PID 37256 /F`)하고 재실행하여 5/5 시나리오 통과로 해결 — 코드 변경 없음, 환경 정리 사안.

## Next Phase Readiness
- `today.ts`/`schedule.ts`/`schedule-data.ts`가 Plan 02(페이스 판정)·Plan 04(일정표 페이지)가 그대로 재사용할 수 있는 안정된 인터페이스로 확정됐다
- `scripts/check-schedule.mjs`의 경계값 커버리지가 이후 Plan들의 페이스 계산(`computePace`, `catchUpDays`) 검증에 필요한 날짜 산술 정확성을 이미 보장한다
- `/schedule` 링크는 활성화됐지만 라우트가 아직 없다 — Plan 04가 채우기 전까지 404이며, 이는 계획된 순서다

---
*Phase: 03-schedule-and-today*
*Completed: 2026-08-24*

## Self-Check: PASSED

All 8 created files confirmed present on disk; all 2 task commits (37b41e2, 90cd22d) confirmed in git log.
