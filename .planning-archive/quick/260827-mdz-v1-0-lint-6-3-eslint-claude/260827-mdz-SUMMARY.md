---
quick_id: 260827-mdz
slug: v1-0-lint-6-3-eslint-claude
date: 2026-08-27
status: complete
tasks: 3
commits: 3
files_modified: 9
---

# Quick Task Summary: v1.0 마감 전 lint 정합성 정리

**`npm run lint`이 에러 6·경고 3에서 0·0으로 — Phase 1부터 이월돼 온 3건과 Phase 8이 새로 만든 3건을 v1.0 봉인 전에 닫았다.**

## 왜 이 작업이 생겼나

`/gsd-complete-milestone`의 마감 전 감사(`audit-open`)가 열린 항목 5건을 보고했다. 실제로 `npm run lint`를 돌려 보니 감사가 알던 항목(전부 Phase 1~5 시절 이월분)에 더해 **Phase 8이 만든 에러 3건**이 더 있었다.

원인은 단순하다 — `npm run lint`가 이 저장소의 20종 게이트 어디에도 들어 있지 않다. 빌드는 통과하므로 lint 위반은 아무 데서도 걸리지 않고 쌓였다.

## 고친 것

| # | 파일 | 규칙 | 조치 |
|---|---|---|---|
| 1 | `src/components/lesson-nav.tsx:10` | `@next/next/no-assign-module-variable` | `module` → `lessonModule` |
| 2 | `src/app/api/progress/route.ts:79` | `@next/next/no-assign-module-variable` | 루프 변수 `module` → `stepModule` |
| 3 | `src/components/theme-toggle.tsx:15` | `react-hooks/set-state-in-effect` | `useSyncExternalStore`로 교체 |
| 4 | `src/components/dday-countdown-live.tsx:27` | `react-hooks/set-state-in-effect` | `useSyncExternalStore`로 교체 |
| 5 | `src/components/progress-provider.tsx:77` | `react-hooks/set-state-in-effect` | loading 되돌림을 `refresh()`로 이동 |
| 6 | `src/components/schedule-table.tsx:190` | `react-hooks/immutability` | 앵커 행을 렌더 전 `find`로 판정 |
| 7 | `src/components/lesson-nav.tsx:4` | 미사용 `StepId` | import 제거 |
| 8 | `scripts/e2e-perf-budget.mjs:240` | 미사용 `budgetMs` | 구조분해·인자 객체에서 제거 |
| 9 | `scripts/e2e-section-tape.mjs:271` | 미사용 `clickedIndex` | 파라미터 제거 + 주석을 실제 사용처로 정정 |

추가로 `eslint.config.mjs`의 `globalIgnores`에 `.claude/**`를 넣었다 — git에 등록되지 않은 고아 에이전트 워크트리 5개(`.claude/worktrees/agent-*`)가 소스 사본을 들고 있어 같은 위반이 중복 집계됐다.

## 설계 판단 3건

- **`theme-toggle`·`dday-countdown-live`를 `useSyncExternalStore`로 옮긴 이유** — 둘 다 "서버가 알 수 없고 브라우저에서만 알 수 있는 값"을 마운트 후 읽어 정정하는 패턴이다. React가 정확히 이 경우를 위해 제공하는 API라 effect 안 setState를 없애면서 렌더 결과는 그대로 유지된다. 서버 스냅샷을 각각 `null`(테마 미상)과 `initialDaysUntil`(빌드 시점 D-day)로 둬 하이드레이션 마크업이 기존과 동일하다.
- **`theme-toggle`의 구독을 `MutationObserver`로 둔 이유** — `toggleTheme`이 `classList.toggle` 후 별도로 `setIsDark(next)`를 부르던 것을 없앨 수 있다. 클래스를 만지는 다른 경로(layout.tsx의 하이드레이션 이전 인라인 스크립트 등)가 생겨도 버튼 표시가 자동으로 따라간다.
- **`schedule-table` 앵커를 객체 동일성으로 판정한 이유** — `groupRowsByWeek`이 `rows` 원소를 복사하지 않고 순서대로 재배치만 하므로, `rows.find(r => r.date === today)`가 고르는 행은 기존 순회(주차 → 주 내 행)가 처음 만나던 행과 정확히 같다. 마커 1건 계약이 유지된다.

## 검증

- `npm run lint` — **0 에러 0 경고** (작업 전 10 에러 5 경고, 워크트리 사본 포함 집계)
- `npm run build` — 통과. 라우트 렌더 모드 무변화(정적 `/about`·`/curriculum`·`/step/*`·`/lesson/*` 35개, 동적 `/`·`/schedule`·`/api/progress`)
- 정적 게이트 10종 전부 exit 0 — `check-progress-gates`(G1~G22), `check-route-rendering`, `check-design-tokens`, `check-brand`, `check-manifest`, `check-lesson-structure`, `check-schedule`, `check-pace`, `check-progress-math`, `check-font-glyph-coverage`
- e2e 게이트 6종 전부 exit 0 (**실 `.env.local` 자격증명**) — 특히 이번 수정이 직접 건드린 경로:
  - `e2e-today`: D-day 정확성 시나리오(다음 날 00:05 KST 고정 → 수화 후 정확히 1 정정, D8-O) 통과, s3 오늘 행 마커 통과
  - `e2e-progress`: 전 시나리오 통과 — g(완료 클릭 → 즉시 반영 → 재방문 유지)가 `refresh()` 재배선 후에도 동작
  - `e2e-section-tape`(30/30), `e2e-lesson-note`(A~N), `e2e-mobile-overflow`(21/21), `e2e-typography`

## Task Commits

1. **Task 1: 이름 충돌·미사용 식별자 lint 정리** — `53ffd59` (fix)
2. **Task 2: effect 내 동기 setState 3건 제거** — `609993e` (fix)
3. **Task 3: 일정표 오늘 앵커를 렌더 중 뮤테이션 없이 판정** — `3e9bdfd` (fix)

## 남긴 것 (이번 범위 밖)

- **`.claude/worktrees/agent-*` 5개 디렉터리** — git에 등록되지 않은 고아 워크트리다(`git worktree list`에 없음). 내용을 확인하지 않고 지우지 않았다. lint 대상에서만 뺐다. 정리하려면 각 디렉터리에 남은 변경이 없는지 확인 후 삭제할 것.
- **`npm run lint`가 여전히 게이트가 아니다** — 이번에 0으로 만들었지만, 같은 부채가 다시 쌓이는 것을 막는 장치는 없다. 다음 마일스톤에서 `npm run lint`를 배포 게이트에 넣는 것을 검토할 것.
- **08-REVIEW.md의 Warning 5건** — WR-01(메모장 언마운트 시 미저장 디바운스 입력 유실 이론적 경로) 등은 lint와 무관한 별개 항목으로 그대로 남아 있다.

---
*Quick task: 260827-mdz*
*Completed: 2026-08-27*
