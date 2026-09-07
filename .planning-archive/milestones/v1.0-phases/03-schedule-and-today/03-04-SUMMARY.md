---
phase: 03-schedule-and-today
plan: 04
subsystem: ui
tags: [scroll-into-view, tailwind, e2e, gate-hardening, ipad-uat]

# Dependency graph
requires:
  - phase: 03-schedule-and-today (Plan 01)
    provides: "getScheduleRows()/schedule.ts/today.ts 순수 계산, hasUnlockCookie 게이트 복제 관례, e2e-today.mjs 5시나리오 기반"
  - phase: 03-schedule-and-today (Plan 02)
    provides: "estimatedMinutes 하향 확정치 — 일정 행의 소요시간 표기 입력값"
  - phase: 03-schedule-and-today (Plan 03)
    provides: "완료 표시 규칙(CheckCircle2 아이콘 + 톤다운 텍스트)과 e2e-today.mjs t1~t8 기반"
provides:
  - "src/components/schedule-table.tsx — ScheduleTable({ rows, today, completedIds }), 순수 서버 렌더 컴포넌트, 36행+개강일 행을 1~6주차로 그룹"
  - "src/components/schedule-auto-scroll.tsx — ScheduleAutoScroll({ targetId }), targetId 하나만 받는 최소 클라이언트 아일랜드"
  - "src/app/schedule/page.tsx — /schedule 라우트, force-dynamic + hasUnlockCookie 자체 게이트"
  - "scripts/check-progress-gates.mjs G20 신설, DYNAMIC_GATED_PAGES에 /schedule 추가"
  - "scripts/e2e-today.mjs s1~s5 — /schedule 쿠키 유/무 왕복, 오늘 행, 개강일 문구, 매니페스트 정합성"
  - "Phase 3 전체를 닫는 아이패드 실기기 UAT 승인 기록 (2건 실측 결함 + 수정)"
affects: [Phase 4 (Step 1 콘텐츠) — 일정표/오늘의 학습 루프가 이제 실사용 가능한 상태로 고정됨]

# Actuals (#2632)
actuals:
  tokens: 5806
  tasks: 3
  commits: 4

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "일정 행의 배지/소요시간 그룹을 고정 폭 grid(64px+88px)로 묶어, 레슨 제목 줄바꿈으로 행 높이가 바뀌어도 열 정렬이 흔들리지 않게 하는 관례 — 이후 표 형태 UI에도 재사용 가능"
    - "카드형 그리드 레이아웃의 브레이크포인트를 아이패드 세로 폭(744px) 기준으로 재검증 — sm:(640px) 대신 lg:(1024px)로 3열 전환을 늦춰 좁은 태블릿에서 헤더 넘침을 방지"

key-files:
  created:
    - src/components/schedule-table.tsx
    - src/components/schedule-auto-scroll.tsx
    - src/app/schedule/page.tsx
  modified:
    - scripts/check-progress-gates.mjs
    - scripts/e2e-today.mjs
    - src/app/curriculum/page.tsx
    - src/components/step-card.tsx

key-decisions:
  - "주차 그룹은 실제 달력 주가 아니라 시작일(8/25) 기준 7일 오프셋으로 계산(A2 채택) — 아이패드 UAT에서 6주차 1일짜리 그룹이 어색하지 않다는 것을 육안 확인"
  - "일정 행의 날짜·소요시간·깊이 배지 그룹을 고정 폭 grid로 묶어 레슨 제목 줄바꿈에도 정렬이 흔들리지 않게 함 — UAT 1라운드에서 3·4·5주차만 들쑥날쑥했던 실측 결함을 구조적으로 차단"
  - "Step 카드 3열 그리드 전환 브레이크포인트를 sm(640px)에서 lg(1024px)로 올림 — 아이패드 세로 폭(744px)이 sm 이상이라 3열로 눌려 헤더가 넘쳤던 것을 lg 미만에서는 2열 유지로 해결"

patterns-established:
  - "ScheduleAutoScroll처럼 클라이언트 아일랜드의 props를 DOM id 문자열 하나로 좁혀 진도/시크릿 데이터가 클라이언트 번들에 직렬화될 경로 자체를 없애는 패턴 — G20이 이를 상시 검사"
  - "고정 폭 컬럼 grid는 리터럴 Tailwind 클래스로만 작성(문자열 조립 금지)한다는 관례를 배지/소요시간 그룹에도 확장 적용"

requirements-completed: [SCHED-01, SCHED-03]

coverage:
  - id: D1
    description: "/schedule이 8/25~9/29 36개 날짜 행을 1~6주차로 그룹 렌더하고 9/30 개강일 행으로 마무리한다"
    requirement: "SCHED-01"
    verification:
      - kind: unit
        ref: "scripts/check-schedule.mjs (18케이스)"
        status: pass
      - kind: e2e
        ref: "scripts/e2e-today.mjs#s1 (36행), #s4 (개강일 문구)"
        status: pass
    human_judgment: false
  - id: D2
    description: "각 일정 행이 날짜·레슨명·소요시간·깊이 배지를 담고 행 전체가 /lesson/{slug} 링크이며 최소 44px 터치 타깃을 갖는다"
    requirement: "SCHED-03"
    verification:
      - kind: unit
        ref: "scripts/check-progress-gates.mjs (min-h-11 클래스 검사 포함 리터럴 클래스 검사)"
        status: pass
      - kind: manual_procedural
        ref: "아이패드 mini 6세대 Safari 실기기 확인 — 항목 3 (손가락 터치로 레슨 이동 확인)"
        status: pass
    human_judgment: true
    rationale: "터치 타깃의 실제 조작감은 자동 게이트로 확정할 수 없어 Task 3 체크포인트 3번이 최종 승인을 맡았다"
  - id: D3
    description: "오늘 행이 accent로 강조되고 페이지 진입 시 자동 스크롤된다"
    verification:
      - kind: e2e
        ref: "scripts/e2e-today.mjs#s3 (오늘 행 마커)"
        status: pass
      - kind: manual_procedural
        ref: "아이패드 실기기 확인 항목 2 (자동 스크롤 육안 확인)"
        status: pass
    human_judgment: true
    rationale: "scrollIntoView의 실제 뷰포트 동작은 헤드리스 e2e로 재현되지 않아 실기기 육안 확인이 최종 증거다"
  - id: D4
    description: "쿠키 유/무에서 일정 데이터의 양이 같고 완료 체크마크만 다르다 (D-37)"
    verification:
      - kind: e2e
        ref: "scripts/e2e-today.mjs#s1, #s2 (쿠키 없음/있음 모두 36행, 마커만 차이)"
        status: pass
    human_judgment: false
  - id: D5
    description: "좁은 iPad 세로 폭에서도 레슨 제목이 말줄임 없이 줄바꿈되고 날짜·소요시간·깊이 배지는 고정폭으로 유지되어 정렬이 깨지지 않는다 (backstop truth)"
    verification:
      - kind: manual_procedural
        ref: "아이패드 실기기 확인 항목 3 — 1라운드에서 3·4·5주차 정렬 흔들림 발견 → 고정폭 grid로 수정(1d34f1d) → 재확인 승인"
        status: pass
    human_judgment: true
    rationale: "긴 제목 줄바꿈 시 정렬 유지 여부는 실제 뷰포트에서만 눈으로 확인 가능 — backstop 항목으로 처음부터 수동 검증 전제"
  - id: D6
    description: "신설 클라이언트 아일랜드가 오늘 행 DOM 식별자 문자열 하나만 받고 진도·시크릿 데이터를 props로 받지 않는다 (T-03-15)"
    verification:
      - kind: unit
        ref: "scripts/check-progress-gates.mjs G20 (mutation test로 진도 식별자 주입 시 실패 확인 후 원복)"
        status: pass
    human_judgment: false
  - id: D7
    description: "커리큘럼 페이지 Step 카드가 아이패드 세로 폭에서 헤더 텍스트 넘침 없이 렌더된다 (UAT 2라운드 실측 결함)"
    verification:
      - kind: manual_procedural
        ref: "아이패드 실기기 확인 — sm→lg 브레이크포인트 수정(394af2b) 후 승인"
        status: pass
    human_judgment: true
    rationale: "실제 아이패드 뷰포트에서만 재현된 결함이며 수정 후 육안 재확인으로만 종결"

# Metrics
duration: ~40min (자동 검증 + UAT 2라운드 왕복 포함)
completed: 2026-08-25
status: complete
---

# Phase 3 Plan 4: 학습 일정표와 Phase 3 종단 UAT Summary

**8/25~9/29 36행 주 단위 일정표(`/schedule`)와 오늘 행 자동 스크롤을 배포하고, 8개 명령 종단 게이트와 아이패드 실기기 UAT로 Phase 3(학습 일정과 오늘의 학습)를 승인 완료했다**

## Performance

- **Duration:** ~40min (자동 태스크 + 아이패드 UAT 2라운드 왕복 포함)
- **Completed:** 2026-08-25
- **Tasks:** 3/3 (Task 1·2 auto, Task 3 checkpoint:human-verify)
- **Files modified:** 7 (3 created, 4 modified across task + fix commits)

## Accomplishments
- `src/components/schedule-table.tsx`가 36개 날짜 행을 1~6주차 그룹(시작일 기준 7일 오프셋)으로 렌더하고, 버퍼일(9/29)은 비링크 안내 행으로, 개강일(9/30)은 accent 좌측 테두리 마커 행으로 표 밖에서 처리한다
- `src/components/schedule-auto-scroll.tsx`가 이 phase의 유일한 신규 클라이언트 JS로서 `targetId: string` 하나만 받아 오늘 행으로 `scrollIntoView`를 수행하며, 오늘이 범위 밖이면 조용히 아무 것도 하지 않는다
- `src/app/schedule/page.tsx`가 `force-dynamic` + `hasUnlockCookie()` 선호출 게이트를 자체 복제해, 쿠키 유무와 무관하게 36행 전체를 렌더하고 완료 체크마크만 조건부로 얹는다(D-37)
- `check-progress-gates.mjs`에 G20(클라이언트 아일랜드 진도/시크릿 식별자 부재 검사)이 신설되고 `DYNAMIC_GATED_PAGES`에 `/schedule`이 추가되어 Phase 3의 세 라우트가 모두 같은 게이트 규칙 아래 있다
- `e2e-today.mjs`에 s1~s5 5개 시나리오가 추가되어 쿠키 유/무 36행 동일성, 오늘 행 마커, 개강일 문구, 매니페스트 정합성을 상시 검증한다 — 전체 8개 명령 종단 스위트(build~e2e-today)가 green
- 아이패드 mini 6세대 Safari 실기기 UAT에서 2건의 실측 결함(일정표 3·4·5주차 열 정렬 흔들림, 커리큘럼 Step 카드 헤더 넘침)을 찾아 즉시 수정·재확인 승인받아 Phase 3을 닫았다

## Task Commits

Each task was committed atomically:

1. **Task 1: 주 단위 일정표와 오늘 행 자동 스크롤** - `4b5b42b` (feat)
2. **Task 2: /schedule 게이트 상시화와 phase 종단 스위트** - `0264521` (feat)
3. **UAT 1라운드 수정: 일정표 열 정렬 — 배지/소요시간 그룹을 고정 폭 grid로** - `1d34f1d` (fix)
4. **UAT 2라운드 수정: 커리큘럼 Step 카드 헤더 넘침 수정 (sm→lg 브레이크포인트)** - `394af2b` (fix)
5. **Task 3: 아이패드 실기기 확인 (checkpoint:human-verify)** - 커밋 없음(사용자 승인으로 종료), 위 fix 2건이 이 태스크에서 발견되어 즉시 반영됨

**Plan metadata:** (this commit, following SUMMARY.md creation)

## Files Created/Modified
- `src/components/schedule-table.tsx` - `ScheduleTable({ rows, today, completedIds })`, `type ScheduleTableRow` — 주차 그룹 렌더, 고정폭 배지/소요시간 grid(1d34f1d로 수정)
- `src/components/schedule-auto-scroll.tsx` - `ScheduleAutoScroll({ targetId })` — `"use client"` 최소 아일랜드
- `src/app/schedule/page.tsx` - `SchedulePage()`, `dynamic = "force-dynamic"`, `hasUnlockCookie()` 선호출
- `scripts/check-progress-gates.mjs` - G20 신설(클라이언트 아일랜드 진도 식별자 검사), `DYNAMIC_GATED_PAGES`에 `/schedule` 추가
- `scripts/e2e-today.mjs` - s1~s5 `/schedule` 시나리오 추가
- `src/app/curriculum/page.tsx` - Step 카드 그리드 브레이크포인트 `sm:grid-cols-3` → `lg:grid-cols-3` (394af2b)
- `src/components/step-card.tsx` - 라벨 `whitespace-nowrap`, 제목 `break-keep` 적용해 헤더 넘침 차단 (394af2b)

## Decisions Made
- 주차 그룹은 실제 달력 주가 아니라 시작일(8/25) 기준 7일 오프셋으로 계산(RESEARCH A2 채택) — 6주차가 1일짜리 그룹이 되는 것을 UAT에서 육안으로 승인받음
- 일정 행의 날짜·소요시간·깊이 배지 그룹을 고정 폭 grid(64px+88px)로 묶어, 레슨 제목이 줄바꿈되어 행이 2줄이 되어도 정렬이 흔들리지 않게 함 — UAT 1라운드 실측 결함(3·4·5주차만 들쑥날쑥)을 구조적으로 재발 방지
- Step 카드 3열 그리드 전환 브레이크포인트를 `sm`(640px)에서 `lg`(1024px)로 올림 — 아이패드 세로 폭(744px)이 `sm` 이상이라 3열로 눌려 헤더 텍스트가 카드 밖으로 넘쳤던 것을 2열 유지로 해결

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] 일정표 열 정렬 흔들림 — 배지/소요시간이 콘텐츠 폭에 따라 밀림**
- **Found during:** Task 3 UAT 1라운드 (사용자: "3, 4주차는 들쑥날쑥해", "5주차도 마찬가지")
- **Issue:** 날짜·소요시간·깊이 배지 그룹이 인라인 flex로만 배치되어 있어, 주차별로 레슨 제목 길이가 달라지면 배지 그룹의 시작 위치가 밀렸다
- **Fix:** 배지/소요시간 그룹을 고정 폭 grid(64px+88px)로 재구성해 콘텐츠 폭과 무관하게 항상 같은 위치에 고정
- **Files modified:** src/components/schedule-table.tsx
- **Commit:** 1d34f1d

**2. [Rule 1 - Bug] 커리큘럼 Step 카드 헤더 텍스트가 아이패드 세로 폭에서 카드 밖으로 넘침**
- **Found during:** Task 3 UAT 2라운드 (사용자: "스텝3 카드의 헤더 텍스트가 카드 영역을 벗어나고 있어")
- **Issue:** Step 카드 그리드가 `sm:grid-cols-3`(640px 이상)에서 3열로 전환되는데, 아이패드 세로 폭(744px)이 이 기준을 넘어 카드 폭이 좁아지면서 라벨과 제목이 줄바꿈되지 않고 넘쳤다
- **Fix:** 그리드 전환 브레이크포인트를 `lg:grid-cols-3`(1024px)로 올려 아이패드 세로 폭에서는 2열을 유지하고, 라벨에 `whitespace-nowrap`, 제목에 `break-keep`을 적용
- **Files modified:** src/app/curriculum/page.tsx, src/components/step-card.tsx
- **Commit:** 394af2b

---

**Total deviations:** 2 auto-fixed (Rule 1 — 둘 다 아이패드 실기기 UAT에서 발견된 레이아웃 버그)
**Impact on plan:** 두 수정 모두 계획에 있던 backstop truth("좁은 iPad 세로 폭에서도 정렬이 깨지지 않는다")와 UI-SPEC의 아이패드 우선 원칙을 실제로 충족시키기 위한 필수 수정이다. 범위 확장(scope creep) 없음 — 기존 컴포넌트의 스타일 클래스만 조정했다.

## Issues Encountered
- e2e-today.mjs가 port 3211에서 자체 서버를 띄우는 구조라 이전 세션에서 3000번 포트를 점유한 dev 서버와 충돌하지 않았다 — 오케스트레이터가 3000번을 정리한 뒤 재실행해 정상 통과했다
- e2e-today.mjs#t8(behind 상태 실제 렌더링)은 실행 시점(2026-08-25, 사전학습 첫날)에 어제까지 배정된 레슨이 없어 이번에도 조건부 스킵됐다 — Plan 03 SUMMARY에서 이미 문서화된 플래그된 경계이며 이번 Plan의 범위(SCHED-01/03) 밖이다

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 3(학습 일정과 오늘의 학습)의 SCHED-01~04 요구사항 전부가 자동 게이트 + 아이패드 실기기 UAT로 확인·승인됐다 — `/`, `/curriculum`, `/schedule` 세 라우트가 모두 force-dynamic + 게이트 우선 호출 규칙 아래 상시 검증된다
- Phase 4(Step 1 심화 콘텐츠) 착수 전, 실제 사용 며칠 후 과거 배정분이 쌓이면 `e2e-today.mjs#t8`(behind 상태)을 스킵 없이 재실행해 페이스 판정의 실제 화면 왕복을 마저 확인할 것을 권장
- 커리큘럼 페이지 그리드 브레이크포인트 수정(`sm`→`lg`)이 Step 카드 외 다른 카드형 그리드 UI에도 같은 원칙(아이패드 세로 폭 744px 기준 재검증)을 적용해야 함을 시사 — Phase 4/5 콘텐츠 작업 중 유사 그리드 신설 시 참고

---
*Phase: 03-schedule-and-today*
*Completed: 2026-08-25*

## Self-Check: PASSED

All 7 created/modified files confirmed present on disk; all 4 commits (4b5b42b, 0264521, 1d34f1d, 394af2b) confirmed in git log.
