---
phase: 03-schedule-and-today
plan: 03
subsystem: ui
tags: [pace-calculation, korean-timezone, pure-function, boundary-testing, e2e, lucide-react]

# Dependency graph
requires:
  - phase: 03-schedule-and-today (Plan 01)
    provides: today.ts/schedule.ts/schedule-data.ts pure modules, TodayLessonCard 4-state shell, DDayCountdown, e2e-today.mjs 5-scenario baseline
  - phase: 03-schedule-and-today (Plan 02)
    provides: estimatedMinutes 하향 확정(총합 4,200분) — computePace의 실제 입력값
provides:
  - "src/lib/pace.ts — computePace(3분기 ahead/on-track/behind), catchUpDays, 의존성 0 순수 모듈"
  - "src/components/pace-status.tsx, src/components/behind-lessons-list.tsx — 진도 게이트(D-37) 하에서만 렌더되는 페이스 패널·밀린 레슨 목록"
  - "src/components/today-lesson-card.tsx 확장 — completed/tomorrow prop, celebration 상태(D-38)"
  - "src/app/page.tsx 통합 — computePace 호출, 렌더 순서 D-day→오늘카드→페이스→밀린레슨→전체진행률"
  - "scripts/check-pace.mjs(18케이스) + check-progress-gates.mjs G18/G19 확장 + e2e-today.mjs t6~t8"
affects: [03-schedule-and-today (Plan 04: 일정표 페이지가 이 pace.ts/computePace 결과와 동일한 완료 표시 규칙을 재사용)]

# Actuals (#2632)
actuals:
  tokens: 10150
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "computePace의 두 완료 합계 스코프(어제까지 vs 전체 배정)를 이름이 다른 변수로 강제 분리 — Pitfall 3 오판 경로를 구조적으로 차단"
    - "밀린 레슨 행 데이터는 page.tsx가 missedSlugs를 getLessonBySlug/rows와 조합해서만 만든다 — behind-lessons-list.tsx는 재계산하지 않는 순수 표현 컴포넌트"
    - "today-lesson-card의 celebration 상태는 page.tsx가 completed===true 또는 pace.status==='ahead'를 판단해 최종 state로 전달 — 컴포넌트 자신은 pace를 모른다"

key-files:
  created:
    - src/lib/pace.ts
    - scripts/check-pace.mjs
    - src/components/pace-status.tsx
    - src/components/behind-lessons-list.tsx
  modified:
    - src/components/today-lesson-card.tsx
    - src/app/page.tsx
    - scripts/check-progress-gates.mjs
    - scripts/e2e-today.mjs

key-decisions:
  - "computePace/catchUpDays는 RESEARCH.md Pattern 2 코드를 출발점으로 삼되 completedThroughYesterday(어제까지 배정 완료)와 completedAllAssignedMinutes(전체 배정 완료)를 반드시 별도 변수로 유지 — Pitfall 3의 실패 모드를 코드 구조로 차단"
  - "today-lesson-card.tsx는 pace를 직접 받지 않는다 — celebration 전환 판단(completed===true 또는 ahead)은 page.tsx가 하고, 컴포넌트는 이미 결정된 state/tomorrow만 렌더한다"
  - "밀린 레슨·페이스 패널 모두 개수 상한·접기 UI를 두지 않는다(RESEARCH Open Question 2 채택) — 예외 상황(여러 주 방치)에 폴리싱 시간을 쓰지 않는다"
  - "G19를 신설해 pace.ts/schedule.ts가 Supabase·progress-store·Velite 매니페스트를 참조하지 않음을 상시 검사 — G13(progress.ts)과 동일한 계층 분리 게이트 패턴을 확장 적용"

patterns-established:
  - "완료 분 합계의 두 스코프(어제까지/전체)를 변수명으로 분리해 페이스 판정 함수 내부에서 절대 합치지 않는다는 규칙 — Pitfall 3류 회귀를 이후 pace.ts 수정에서도 방지"
  - "진도 파생 UI 컴포넌트(pace-status/behind-lessons-list)는 pace 계산 결과나 이미 조립된 행 데이터만 props로 받고 매니페스트/완료집합을 스스로 조회하지 않는다는 원칙을 오늘 레슨 카드에도 확장 적용"

requirements-completed: [SCHED-02, SCHED-04]

coverage:
  - id: D1
    description: "시크릿 쿠키 보유 시 ahead/on-track/behind 3단계 중 정확히 하나가 렌더된다 (D-42)"
    requirement: "SCHED-04"
    verification:
      - kind: unit
        ref: "scripts/check-pace.mjs (18 cases: 3분기 판정 전체 커버)"
        status: pass
      - kind: e2e
        ref: "scripts/e2e-today.mjs#t6 (쿠키 포함 GET / → data-schedule-ui=\"pace\" 1건 + data-pace-status 유효값)"
        status: pass
    human_judgment: false
  - id: D2
    description: "페이스 판정이 어제까지 배정 레슨의 estimatedMinutes 합 vs 완료 분 합으로 나오고, 오늘 배정 레슨은 판정에서 제외된다 (D-40/D-41)"
    requirement: "SCHED-04"
    verification:
      - kind: unit
        ref: "scripts/check-pace.mjs (어제까지 배정 3건 전부/1건만 완료, 오늘 배정 포함 ahead 케이스)"
        status: pass
    human_judgment: false
  - id: D3
    description: "미래 배정 레슨을 미리 완료해도 어제까지 배정분에 미완료가 있으면 behind로 판정된다 (Pitfall 3 오판 경로 차단)"
    requirement: "SCHED-04"
    verification:
      - kind: unit
        ref: "scripts/check-pace.mjs (\"미래 레슨 선완료 + 어제까지 미완료 -> behind\" 케이스)"
        status: pass
    human_judgment: false
  - id: D4
    description: "일정 첫날(2026-08-25)에 완료가 0건이어도 어제까지 배정분이 0이므로 behind가 아니다"
    requirement: "SCHED-04"
    verification:
      - kind: unit
        ref: "scripts/check-pace.mjs (첫날 완료 0건 -> on-track 케이스)"
        status: pass
      - kind: e2e
        ref: "scripts/e2e-today.mjs#t8 (오늘 2026-08-25 기준 어제까지 배정분 없음 → 명시적 스킵으로 이 경계를 재확인)"
        status: pass
    human_judgment: false
  - id: D5
    description: "버퍼일 행(lessonSlug=null)은 배정 합계·완료 합계·밀린 레슨 목록 어디에도 들어가지 않는다"
    requirement: "SCHED-04"
    verification:
      - kind: unit
        ref: "scripts/check-pace.mjs (버퍼일 섞인 rows 케이스)"
        status: pass
    human_judgment: false
  - id: D6
    description: "behind일 때 정량(약 N시간 분량 M개 레슨) + 따라잡기 안내(하루 30분씩 K일) 두 문장이 함께 렌더되고 K=ceil(gapMinutes/30)이다 (D-43)"
    requirement: "SCHED-04"
    verification:
      - kind: unit
        ref: "scripts/check-pace.mjs (catchUpDays 0/1/30/150/151 5케이스) + src/components/pace-status.tsx 코드 검사(formatEstimatedTime 재사용, 두 문장 분리 렌더)"
        status: pass
    human_judgment: true
    rationale: "behind 카피가 실제 화면에 렌더되는 왕복은 e2e-today.mjs#t8이 오늘(2026-08-25) 기준 어제까지 배정분이 없어 스킵됐다 — 계산 로직(unit)과 컴포넌트 코드는 확인했으나 실제 문장 줄바꿈·톤은 과거 배정분이 생기는 날 육안 확인이 필요하다"
  - id: D7
    description: "쿠키가 없으면 페이스 패널·밀린 레슨 섹션이 DOM에 없고 D-day·오늘 배정 레슨 정보는 그대로 보인다 (D-37)"
    requirement: "SCHED-02"
    verification:
      - kind: e2e
        ref: "scripts/e2e-today.mjs#t7 (쿠키 없음 → pace/behind-list 마커 0건 + dday/today-card 마커 1건씩 동시 확인)"
        status: pass
    human_judgment: false
  - id: D8
    description: "오늘 배정 레슨은 완료·미완료·쿠키 없음 세 경우 모두 정확히 하나의 상태로 렌더되며 여러 개 배정은 발생하지 않는다 (D-32)"
    requirement: "SCHED-02"
    verification:
      - kind: e2e
        ref: "scripts/e2e-today.mjs#t1, #t2, #t6, #t7 (쿠키 유/무·날짜 분기 왕복)"
        status: pass
    human_judgment: false
  - id: D9
    description: "오늘 배정 레슨을 완료했거나 앞서 있으면 축하 상태(오늘 학습을 모두 마쳤어요!) + 내일 레슨 미리보기가 렌더되고, 이동은 사용자가 링크를 눌러야만 일어난다 (D-38)"
    verification: []
    human_judgment: true
    rationale: "오늘(2026-08-25)은 사전학습 첫날이라 실제 완료 데이터가 없어 celebration 분기가 이번 세션 e2e에서 실제로 트리거되지 않았다 — today-lesson-card.tsx 코드 경로(completed===true || pace.status==='ahead' → celebration, tomorrow 3분기 처리)는 확인했으나 실제 완료 이벤트 발생 후 육안 확인이 필요하다"
  - id: D10
    description: "진도 조회가 실패하면 페이스 패널 자리에 기존 ProgressReadError 배너가 뜨고 밀린 레슨 섹션은 통째로 생략되며, 추측 상태(0%/on-track 등)가 표시되지 않는다"
    verification: []
    human_judgment: true
    rationale: "이번 세션에서 Supabase 조회 실패를 실제로 유발하지 않았다 — page.tsx의 progressRead && !progressRead.ok 분기가 ProgressReadError를 렌더하고 behindRows는 completedIds가 null이라 항상 빈 배열이 되는 코드 경로는 확인했으나 실제 장애 재현 검증은 하지 않았다"
  - id: D11
    description: "pace.ts가 의존성 0을 유지하고(순수 모듈), Supabase·progress-store·Velite 매니페스트를 참조하지 않는다"
    verification:
      - kind: unit
        ref: "scripts/check-progress-gates.mjs G18(import 0줄) + G19(계층 분리) — mutation test로 import 주입 시 G18 실패 확인 후 원복"
        status: pass
    human_judgment: false

# Metrics
duration: ~15min
completed: 2026-08-25
status: complete
---

# Phase 3 Plan 3: 시간 가중 페이스 판정과 밀린 레슨·축하 상태 Summary

**어제까지 배정분 기준 3단계(ahead/on-track/behind) 페이스 판정 순수 모듈(pace.ts)을 신설하고, 홈에 페이스 패널·밀린 레슨 목록·오늘 학습 완료 축하 상태를 얹었으며, 쿠키 유/무 두 경로 왕복과 계층 분리를 게이트로 상시화했다**

## Performance

- **Duration:** ~15min (Task 1: 598fc53, Task 2: 6e496e6, Task 3: 533975e)
- **Completed:** 2026-08-25
- **Tasks:** 3/3
- **Files modified:** 8 (4 created, 4 modified)

## Accomplishments
- `src/lib/pace.ts`가 의존성 0 순수 모듈로 `computePace`(3분기 ahead/on-track/behind)와 `catchUpDays`를 제공하고, "미래 레슨 선완료가 어제까지 미완료를 가리는" Pitfall 3 오판 경로를 별도 변수 스코프로 구조적으로 차단했다
- `scripts/check-pace.mjs`가 18개 경계값 케이스(첫날 0건, 3분기 전환, Pitfall 3, 버퍼일 제외, minutesBySlug 부재, 범위 밖 날짜, 입력 불변성, catchUpDays 5케이스)로 판정 정확성을 3초 내 단독 검증한다
- 홈에 페이스 패널(`pace-status.tsx`, accent는 ahead에만)과 밀린 레슨 목록(`behind-lessons-list.tsx`, 접기 UI 없음)이 추가되어 쿠키 보유 시에만 렌더되고, `today-lesson-card.tsx`가 완료 마커·CTA 전환·celebration(축하) 상태까지 확장됐다
- `src/app/page.tsx`가 `hasUnlockCookie` 게이트 순서를 유지한 채 `computePace`를 통합하고, 렌더 순서(D-day → 오늘 카드 → 페이스 → 밀린 레슨 → 전체 진행률)를 UI-SPEC대로 확정했다
- `check-progress-gates.mjs`에 G18(pace.ts 순수성 추가) + G19(pace.ts/schedule.ts 계층 분리 신설)가 상시 검사를 확장했고, `e2e-today.mjs`에 t6(쿠키 있음 페이스 렌더)·t7(쿠키 없음 진도 마커 0건+공개 마커 1건씩 동시 확인)·t8(과거 배정 미완료→behind, 조건부+원상복구) 3개 시나리오가 추가됐다
- 전체 검증 체인(build, check-pace, check-schedule, check-manifest, check-progress-math, check-progress-gates, check-brand, e2e-today 8시나리오, check-supabase-progress)이 무회귀로 통과했다

## Task Commits

Each task was committed atomically:

1. **Task 1: 시간 가중 페이스 판정 순수 모듈과 단위 게이트** - `598fc53` (feat)
2. **Task 2: 페이스 패널 · 밀린 레슨 · 축하 상태를 홈에 얹기** - `6e496e6` (feat)
3. **Task 3: 게이트 확장 — 순수성·게이트 순서 상시화와 쿠키 유/무 종단 검증** - `533975e` (test)

**Plan metadata:** (this commit, following SUMMARY.md creation)

## Files Created/Modified
- `src/lib/pace.ts` - `computePace(rows, minutesBySlug, completedIds, todayStr)`, `catchUpDays(gapMinutes)` — 의존성 0
- `scripts/check-pace.mjs` - 18케이스 경계값 게이트(node:assert/strict, 신규 의존성 없음)
- `src/components/pace-status.tsx` - `PaceStatusPanel({ pace })`, accent는 ahead에만, destructive 미사용
- `src/components/behind-lessons-list.tsx` - `BehindLessonsList({ rows })`, 전체 나열(접기 UI 없음)
- `src/components/today-lesson-card.tsx` - `completed`/`tomorrow` prop과 `celebration` 상태 추가
- `src/app/page.tsx` - `computePace` 통합, celebration 판단, 밀린 레슨 행 조립, 렌더 순서 확정
- `scripts/check-progress-gates.mjs` - G18에 pace.ts 추가, G19(계층 분리) 신설
- `scripts/e2e-today.mjs` - t6(쿠키 있음)·t7(쿠키 없음 동시 확인)·t8(behind 조건부 왕복) 추가

## Decisions Made
- `computePace`의 완료 분 합계 두 스코프(어제까지 vs 전체 배정)를 이름이 다른 변수(`completedThroughYesterday`/`completedAllAssignedMinutes`)로 강제 분리 — Pitfall 3의 실패 모드(하나로 합쳐 오판)를 코드 구조로 차단
- `today-lesson-card.tsx`는 `pace`를 직접 받지 않고, celebration 전환 판단(완료 또는 ahead)은 `page.tsx`가 미리 계산해 최종 `state`로 전달 — 컴포넌트는 이미 결정된 값만 렌더하는 순수 표현 계층 원칙 유지
- 밀린 레슨 목록·페이스 패널 모두 개수 상한이나 접기 UI를 두지 않음(RESEARCH Open Question 2 채택) — 여러 주 방치라는 예외 상황에 폴리싱 시간을 쓰지 않는다
- `check-progress-gates.mjs`에 G19를 신설해 `pace.ts`/`schedule.ts`가 Supabase·progress-store·Velite 매니페스트를 참조하지 않음을 상시 검사 — G13(progress.ts)과 같은 형태의 계층 분리 게이트를 확장

## Deviations from Plan

None - plan executed exactly as written. Task 1~3 모두 `<action>` 지시대로 구현됐고 Rule 1~4 개입이 필요한 버그·누락·아키텍처 변경은 없었다.

## Issues Encountered
- `e2e-today.mjs#t8`은 실행 시점(2026-08-25, 사전학습 첫날)에 "어제까지 배정된 레슨"이 아직 존재하지 않아 조건부로 스킵됐다 — 계획이 이미 예상한 경계(플래그된 assumption)이며, 스킵 사유가 명시적으로 출력됐다. behind 상태의 실제 화면 렌더링(정량+따라잡기 문구, celebration 상태)은 위 coverage D6/D9에서 human_judgment로 표시하고 과거 배정분이 실제로 쌓이는 날 육안 확인이 필요함을 남겼다.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `computePace`/`catchUpDays`가 안정된 인터페이스로 확정되어 Plan 04(일정표 페이지)가 동일한 완료 표시·페이스 규칙을 재사용할 수 있다
- `check-pace.mjs`의 경계값 커버리지와 `e2e-today.mjs`의 t6~t8이 Plan 04의 일정표 페이지 완료 표시 검증에 필요한 기반을 이미 마련했다
- 실제 사용 며칠 후(과거 배정분이 쌓이는 시점) `e2e-today.mjs#t8`을 재실행하면 behind 판정과 밀린 레슨 목록의 실제 화면 왕복을 스킵 없이 확인할 수 있다

---
*Phase: 03-schedule-and-today*
*Completed: 2026-08-25*

## Self-Check: PASSED

All 8 created/modified files confirmed present on disk; all 3 task commits (598fc53, 6e496e6, 533975e) confirmed in git log.
