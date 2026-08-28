---
phase: quick-260828-w2r
plan: 01
status: complete
subsystem: progress
tags: [debug, ipad, webkit, react-19, optimistic-ui, gates]

requires:
  - phase: 08-performance-and-mobile
    provides: "정적 셸 + 마운트 후 GET /api/progress 진도 아일랜드 구조"
provides:
  - "refresh() 배경 재조회 계약 — 화면을 비우지 않고 Promise를 돌려준다"
  - "완료 버튼 pendingDone 모델 — 저장·재조회가 끝날 때까지 표시값 고정, 그 사이 탭 무시"
  - "G12 개정(불변식 기반) + G23 신설(재조회가 화면을 비우지 않음)"
affects: [complete-button, progress-provider, lesson-notepad, progress-gates]

actuals:
  tasks: 3
  commits: 2

tech-stack:
  added: []
  patterns:
    - "낙관적 UI의 '되돌림 지점'을 서버 값이 실제로 도착하는 시점에 맞춘다 — useOptimistic은 되돌림이 트랜지션 종료에 묶여 있어, 서버 값이 별도 fetch로 오는 화면에서는 옛 값이 드러나는 창을 만든다"
    - "재조회는 화면을 비우지 않는다 — 로딩 스켈레톤은 보여줄 이전 데이터가 없는 최초 로드에서만"
    - "게이트는 구현 수단(훅 이름)이 아니라 불변식을 못박는다 — 수단을 바꿔야 할 때 게이트가 변경을 가로막지 않도록"
---

## 증상

아이패드에서 레슨 완료를 탭하면 "완료했어요 ✓"로 바뀌었다가 버튼이 회색이 되고,
다시 "레슨 완료하기"로 돌아온다.

## 조사

프로덕션(WebKit, iPad 디바이스 프로필)으로 실측했다. **저장은 처음부터 정상이었다.**

| 확인 | 결과 |
|---|---|
| 탭 → Server Action POST | 200, 1건 (중복 없음) |
| 직후 재조회 GET /api/progress | `lesson.done=true`, `completedSlugs` +1 |
| 새로고침 후 | done 유지 |
| 응답 캐시 헤더 | `private, no-store`, `x-vercel-cache: MISS` |

문제는 저장과 재조회 **사이의 화면**이었고, 원인이 두 겹이다.

1. **재조회가 화면을 비웠다.** `refresh()`가 상태를 `loading`으로 되돌려 진도
   아일랜드 전체가 스켈레톤으로 교체됐다 — 방금 누른 버튼이 통째로 언마운트됐다가
   다시 마운트된다. 이것이 "회색" 구간의 정체다(실측 200~600ms, 느린 회선에서는 더 길다).

2. **낙관적 값의 되돌림 시점이 서버 값 도착 시점과 어긋났다.** `useOptimistic`의
   낙관적 값은 트랜지션이 끝나는 순간 prop(`initialDone`)으로 되돌아간다. 그런데 이
   화면의 서버 값은 트랜지션이 아니라 별도 fetch(GET /api/progress)로 도착한다 —
   그 사이 구간에서는 아직 옛 값(미완료)이 드러난다.

3. 둘이 겹치면 **깜빡임이 오조작을 부른다.** 버튼이 사라졌다 돌아오는 순간을 다시
   탭하면 완료가 그대로 취소되고, 사용자에게는 "한 번 눌렀는데 되돌아갔다"로 보인다.

## 고친 것

- `progress-provider.tsx` — `refresh()`가 화면을 비우지 않는다. 배경에서 다시 읽고
  응답이 도착한 뒤에만 상태를 바꿔 끼우며, 재조회 완료 시점을 알리는 Promise를
  돌려준다. 스켈레톤은 최초 로드에서만 나온다.
- `complete-button.tsx` — 표시값을 `pendingDone ?? initialDone`으로 바꿨다.
  `pendingDone`은 저장과 재조회가 **둘 다** 끝난 뒤에 푼다. 그동안 버튼은 같은 자리에
  같은 모습으로 남고 추가 탭은 무시된다.
- `check-progress-gates.mjs` — G12를 "useOptimistic을 호출할 것"에서 실제 불변식으로
  교체(표시값이 `?? initialDone`으로 수렴 + `await onToggled?.()`), G23 신설(진도
  프로바이더에 loading 상태 객체 리터럴이 하나뿐).

## 검증

- WebKit(iPad 프로필)에서 `/api/progress` 응답에 1.2초 지연을 주입하고 측정 —
  상태 전이가 `done` **하나뿐**. 수정 전 같은 조건에서는 `done → 스켈레톤(회색) → done`.
- `e2e-progress.mjs` 전 시나리오 통과(완료 토글 왕복 + 잠금 해제 흐름).
- 게이트 brand·design-tokens·manifest·route-rendering·lesson-structure·progress-gates,
  lint, 빌드 통과.
- 조사 중 건드린 진도 데이터는 원래 상태(1-1 두 편 완료)로 복구 확인.

## 남은 것

- 실기기(아이패드 Safari) 재확인은 사용자 몫 — 자동 게이트가 실기기를 대체하지
  못한다는 것은 이 프로젝트가 이미 두 번 겪은 교훈이다(Phase 6 메모장 하단 틈).
