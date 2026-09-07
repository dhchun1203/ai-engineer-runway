---
quick_id: 260827-mdz
slug: v1-0-lint-6-3-eslint-claude
date: 2026-08-27
mode: quick
description: "v1.0 마감 전 lint 정합성 정리 — 에러 6건·경고 3건 + eslint 스캔 범위"
---

# Quick Task: v1.0 마감 전 lint 정합성 정리

## 왜 지금인가

`npm run lint`는 이 저장소의 어떤 게이트에도 들어 있지 않다. 그 결과 Phase 1부터
이월돼 온 에러 3건에 더해 **Phase 8이 새로 만든 에러 3건**이 아무 게이트에도 걸리지
않은 채 남았다. 마일스톤 close 전 감사(`audit-open`)가 5건을 열린 항목으로 보고했고,
실제 실행해 보니 감사가 모르던 Phase 8 신규분까지 합쳐 에러 6·경고 3이었다.
v1.0으로 봉인하기 전에 닫는다.

## 대상 (실측, 스테일 워크트리 사본 제외)

| # | 파일:행 | 규칙 | 출처 |
|---|---|---|---|
| 1 | `src/components/lesson-nav.tsx:10` | `@next/next/no-assign-module-variable` | Phase 1 |
| 2 | `src/app/api/progress/route.ts:79` | `@next/next/no-assign-module-variable` | Phase 8 신규 |
| 3 | `src/components/theme-toggle.tsx:15` | `react-hooks/set-state-in-effect` | Phase 1 |
| 4 | `src/components/dday-countdown-live.tsx:27` | `react-hooks/set-state-in-effect` | Phase 8 신규 |
| 5 | `src/components/progress-provider.tsx:77` | `react-hooks/set-state-in-effect` | Phase 8 신규 |
| 6 | `src/components/schedule-table.tsx:190` | `react-hooks/immutability` | Phase 8 이전 |
| 7 | `src/components/lesson-nav.tsx:4` | 미사용 `StepId` (warning) | Phase 1 |
| 8 | `scripts/e2e-perf-budget.mjs:240` | 미사용 `budgetMs` (warning) | Phase 8 |
| 9 | `scripts/e2e-section-tape.mjs:271` | 미사용 `clickedIndex` (warning) | Phase 6 |

추가: `eslint.config.mjs`의 `globalIgnores`에 `.claude/**`를 넣는다 — git에 등록되지
않은 고아 에이전트 워크트리 5개(`.claude/worktrees/agent-*`)가 소스 사본을 들고 있어
같은 위반이 중복 집계된다. 디렉터리 자체는 지우지 않는다(내용 확인 없이 삭제하지 않음).

## Tasks

### Task 1 — 이름 충돌·미사용 식별자 (동작 무관)
**Files:** `lesson-nav.tsx`, `route.ts`, `e2e-perf-budget.mjs`, `e2e-section-tape.mjs`, `eslint.config.mjs`
**Action:** `module` 지역 변수 2곳 개명, 미사용 식별자 3건 제거, eslint ignore에 `.claude/**` 추가.
**Verify:** 해당 5개 파일 `npx eslint` 0 문제.
**Done:** 순수 식별자 변경 — 렌더 결과·응답 스키마 무변경.

### Task 2 — effect 내 동기 setState 3건
**Files:** `theme-toggle.tsx`, `dday-countdown-live.tsx`, `progress-provider.tsx`
**Action:**
- `theme-toggle`: `useEffect`+`useState` → `useSyncExternalStore`(구독은 documentElement
  class MutationObserver, 서버 스냅샷 `null`). 하이드레이션 시 렌더 결과가 기존과 동일하다
  (`isDark`가 `null`이면 Moon 아이콘 + "다크 모드로 전환" — 현행과 같음).
- `dday-countdown-live`: 같은 API로 교체. 서버 스냅샷 = `initialDaysUntil`, 클라이언트
  스냅샷 = `daysUntil(COURSE_START_DATE, todayInSeoul())`. D8-O 계약(정적 셸은 빌드 시점 값,
  수화 후 브라우저 기준 정정) 그대로.
- `progress-provider`: effect 안의 `setState({status:"loading"})`를 `refresh()`(이벤트
  핸들러)로 옮긴다. 최초 마운트는 `useState` 초기값이 이미 loading이라 동일.
**Verify:** `e2e-today.mjs`의 D-day 정확성 시나리오, `e2e-progress.mjs` 진도 아일랜드 시나리오.
**Done:** 마운트 후 재계산·fetch 타이밍과 DOM 마커가 전부 그대로다.

### Task 3 — 렌더 중 변수 재할당 제거 + 전체 회귀 확인
**Files:** `schedule-table.tsx`
**Action:** `let seenTodayAnchor` 뮤테이션 대신 첫 오늘 행을 렌더 전에 한 번 찾아 객체
동일성으로 판정한다.
**Verify:** `npm run lint` 0 에러 0 경고, `npm run build`, 게이트 회귀(진도·라우트·디자인
토큰·브랜드·구간 테이프·오늘/일정).
**Done:** 오늘 앵커 마커가 정확히 1건으로 유지된다.

## 제약

- 동작 변경 금지 — 순수 lint 정합성 수정.
- 새 npm 패키지 0개.
- `.claude/worktrees/` 디렉터리는 삭제하지 않는다.
