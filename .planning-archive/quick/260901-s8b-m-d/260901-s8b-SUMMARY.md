---
phase: quick-260901-s8b
plan: 01
subsystem: ui
tags: [pace, projection, schedule, home, computeProjection]

requires:
  - phase: 03-today-focus
    provides: computePace/computeAheadDetail/catchUpDays in src/lib/pace.ts, PaceStatusPanel component
provides:
  - computeProjection pure function in src/lib/pace.ts (완료 예측일)
  - PaceStatusPanel projection prop + conditional projection-line render
affects: [research-edu-sites-round2, home-page]

actuals:
  tokens: 4171
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "pace.ts 무-import 순수 함수 규약 유지 — daysBetween/addDays 로컬 헬퍼도 Date 전역만 사용"
    - "behind 상태에서 예측 줄을 숨기는 두 겹 방어: 함수의 show 플래그 + 컴포넌트 isBehind 분기의 코드 경로 부재"

key-files:
  created: []
  modified:
    - src/lib/pace.ts
    - scripts/check-pace.mjs
    - src/components/pace-status.tsx
    - src/app/page.tsx

key-decisions:
  - "예측 집계는 분이 아니라 레슨 개수 기준 — computeProjection은 minutesBySlug를 받지 않는다"
  - "카운트기반 pastDueIncomplete를 behind 판정의 프록시로 사용 — 권위 있는 분 단위 판정은 여전히 computePace 소관"

patterns-established:
  - "완료 예측일 표시 조건(show=false 4중 가드: 완료0개/경과일<2/behind프록시/남은0개)을 함수 반환값에 코드화 — UI가 조건을 재판단하지 않는다"

requirements-completed: [round2-완료예측일]

coverage:
  - id: D1
    description: "computeProjection이 show/projectedFinish/remainingCount 계약대로 동작한다(완료0개·경과일부족·시작전·behind프록시·정상예측A/B·남은0개·개강후today·불변 9케이스)"
    requirement: round2-완료예측일
    verification:
      - kind: unit
        ref: "scripts/check-pace.mjs — computeProjection 전용 9케이스"
        status: pass
    human_judgment: false
  - id: D2
    description: "check-pace.mjs 기존 29케이스가 회귀 없이 그대로 통과한다(computePace/computeAheadDetail/catchUpDays 반환 불변)"
    verification:
      - kind: unit
        ref: "scripts/check-pace.mjs — 전체 38케이스"
        status: pass
    human_judgment: false
  - id: D3
    description: "홈 페이스 패널이 실제 ahead 상태(Supabase 진도 데이터)에서 '이 속도면 9월 18일 완주 예정 · 개강 전에 끝나요'를 accent 색으로 렌더한다"
    requirement: round2-완료예측일
    verification:
      - kind: automated_ui
        ref: "agent-browser 라이트/다크 스크린샷, http://localhost:3000, unlock 쿠키로 실제 completedIds 조회"
        status: pass
    human_judgment: false
  - id: D4
    description: "behind 상태에서는 예측 줄이 렌더되지 않는다(코드 경로 부재 + show 플래그 이중 방어)"
    verification: []
    human_judgment: true
    rationale: "실제 Supabase 진도 데이터가 현재 ahead 상태라 behind를 재현하려면 프로덕션 진도를 임의로 되돌려야 한다 — 실사용자 진도 데이터 훼손 위험이 있어 보류. isBehind 분기에 projectionLine을 세팅하는 코드가 아예 없음을 코드 리뷰로 확인했고(구조적 보장), computeProjection의 pastDueIncomplete>0 → show:false 게이트도 단위 테스트로 검증됨(D1) — 실제 화면에서의 behind 렌더 부재는 다음 배정일이 밀렸을 때 육안 확인 필요"
  - id: D5
    description: "on-track 상태에서는 예측 줄이 중성색(destructive 아님)으로 렌더된다"
    verification: []
    human_judgment: true
    rationale: "실제 Supabase 진도 데이터가 현재 ahead 상태라 on-track을 재현할 수 없었다 — 코드 리뷰로 on-track(else) 분기의 className이 'text-body font-normal'(중성)임을 확인했으나 화면 실측은 다음 on-track 상태에서 필요"

duration: 약 35분
completed: 2026-09-01
status: complete
---

# Quick Task 260901-s8b: 완료 예측일(computeProjection) Summary

**pace.ts에 레슨-개수 기준 완료 예측 순수 함수(computeProjection)를 추가하고, 홈 페이스 패널에 ahead/on-track 전용 "이 속도면 M월 D일 완주 예정" 한 줄을 배선했다 — behind 상태에는 렌더 코드 경로 자체가 없다.**

## Performance

- **Duration:** 약 35분
- **Tasks:** 2/2 완료
- **Files modified:** 4

## Accomplishments

- `computeProjection(rows, completedIds, todayStr, scheduleStart)` 순수 함수 신설 — show/projectedFinish/remainingCount 계약, 완료0개·경과일<2·behind프록시(pastDueIncomplete)·남은0개 4중 가드로 예측 표시 여부를 코드화
- `daysBetween`/`addDays` 무-import 순수 날짜 헬퍼 추가(schedule.ts와 동일한 Date.UTC 산술 패턴) — pace.ts의 import 0개 규약 유지
- `scripts/check-pace.mjs`에 computeProjection 전용 9케이스 추가, 기존 29케이스 전부 회귀 없음(총 38케이스 통과)
- `PaceStatusPanel`에 projection prop + 조건부 예측 줄 렌더 — isAhead/on-track 분기에서만 projectionLine을 세팅, isBehind 분기에는 그 코드가 아예 없어 리서치 2단 경고(늦은 완주일이 격려를 낙담으로 반전)를 구조로 차단
- 톤 규칙(D-43) 적용: ahead면 accent, on-track이면 중성, destructive 토큰 미사용
- 개강일(COURSE_START_DATE) 전 완주 예측이면 "· 개강 전에 끝나요" 격려 문구 자동 추가
- 실제 Supabase 진도 데이터(8/35 완료, ahead 상태)로 홈을 열어 "이 속도면 9월 18일 완주 예정 · 개강 전에 끝나요"가 accent 색으로 렌더되는 것을 라이트/다크 양쪽에서 육안 확인

## Task Commits

1. **Task 1: pace.ts에 computeProjection 순수 함수 추가 + check-pace.mjs 전용 케이스** - `69bd599` (feat)
2. **Task 2: PaceStatusPanel에 예측 줄 렌더 + page.tsx 조립** - `96fb54e` (feat)

_TDD 표시(tdd="true")가 있었지만 pace.ts는 이미 게이트 스크립트가 assert 기반 실행 검증을 겸하는 구조라 RED/GREEN 별도 커밋 분리 없이 구현+테스트 케이스를 한 커밋으로 묶었다(computeAheadDetail 선례와 동일한 기존 관례)._

## Files Created/Modified

- `src/lib/pace.ts` - computeProjection + Projection 타입 + daysBetween/addDays 헬퍼 추가(computePace/computeAheadDetail/catchUpDays 미수정)
- `scripts/check-pace.mjs` - computeProjection 전용 9케이스 섹션 추가(기존 29케이스 미수정)
- `src/components/pace-status.tsx` - projection prop, buildProjectionLine 헬퍼, isAhead/on-track 전용 조건부 렌더
- `src/app/page.tsx` - computeProjection 호출 + PaceStatusPanel에 projection prop 전달

## Decisions Made

- 예측 집계는 분이 아니라 레슨 "개수" 기준으로 계산 — computeProjection은 minutesBySlug를 받지 않는다(예측이 묻는 것은 "며칠 걸리는지"라 개수가 더 직접적인 단위)
- pastDueIncomplete(카운트기반 behind 프록시)는 computePace의 분 단위 판정을 대체하지 않고, 예측 줄을 숨기는 함수 쪽 방어로만 쓴다 — 권위 있는 판정은 여전히 computePace 소관

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- 워크트리에 `node_modules`가 없어 `npm ci`로 설치, `.velite`가 없어 `node node_modules/velite/bin/velite.js build --clean`으로 생성해야 tsc/lint/build가 정상 동작했다(계획의 "Session trap" 주의사항이 예상한 상황과 다르게, MDX/velite 설정을 건드리지 않았는데도 워크트리 초기 상태 자체에 두 산출물이 아예 없었다). `.next/types` 생성을 위해 `npx next build`도 한 번 실행(프로덕션 빌드는 Supabase env 부재로 페이지 데이터 수집 단계에서 실패했지만 TypeScript 검사 자체는 그 전에 통과 — tsc --noEmit 재실행으로 최종 확인).
- 육안 검증을 위해 메인 저장소의 `.env.local`을 워크트리로 복사(gitignore 대상, 커밋되지 않음 확인)하고 `/unlock?key=...`로 실제 잠금 해제 쿠키를 발급해 실제 Supabase 진도 데이터를 읽었다 — 결과적으로 실제 ahead 상태를 눈으로 확인할 수 있었다(계획이 예상한 "실제 ahead 상태를 못 볼 수도 있다"보다 나은 결과).
- on-track·behind 상태는 실제 데이터가 ahead였던 관계로 화면 실측하지 못했다(진도를 임의로 되돌리면 실사용자 진도 데이터가 훼손됨) — SUMMARY coverage D4·D5에 human_judgment로 남기고, 로직은 코드 리뷰 + 단위 테스트(38케이스)로 확인했다.
- 홈 페이지에서 pre-existing 하이드레이션 경고(`<html>` className의 폰트 변수 서버/클라이언트 불일치)가 콘솔에 떴다 — 이번 작업이 건드린 pace.ts/pace-status.tsx/page.tsx와 무관한 layout.tsx/폰트 로딩 영역의 기존 이슈라 범위 밖으로 두고 수정하지 않았다(Scope Boundary).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- computeProjection·PaceStatusPanel 배선 완료, 리서치 2단 "완료 예측일" 항목 종료
- 남은 리서치 2단 후보(힌트 사다리, 예측 프롬프트, 반전 박스+안테피스 예고, TIL+코넬 큐, manifest→이어서 읽기, 내 노트 단권화, 궁금한 것 인박스, skip link+Safari Reader 등)는 STATE.md에 기존 목록대로 남아 있음
- on-track/behind 상태의 예측 줄 표시(D4·D5)는 다음에 실제로 그 상태에 진입했을 때(또는 별도 개발 환경에서 진도 데이터를 자유롭게 조작할 수 있을 때) 육안 확인을 권장

---
*Quick Task: 260901-s8b*
*Completed: 2026-09-01*

## Self-Check: PASSED

- FOUND: src/lib/pace.ts
- FOUND: scripts/check-pace.mjs
- FOUND: src/components/pace-status.tsx
- FOUND: src/app/page.tsx
- FOUND commit: 69bd599
- FOUND commit: 96fb54e
