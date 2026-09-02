---
quick_id: 260902-j7t
slug: mobile-menu-collapse-anim
date: 2026-09-02
status: complete
commit: 4ca54ce
---

# Quick Task 260902-j7t — 모바일 메뉴 닫힘(접힘) 애니메이션 (완료)

## 무엇을 했나

펼침만 있던 모바일 햄버거 패널에 **닫힐 때 접히는** 애니메이션을 대칭으로 추가했다.
이전엔 조건부 렌더라 닫는 순간 패널이 사라졌는데, 이제 접힘이 끝난 뒤 언마운트한다.

## 어떻게

- `src/components/site-nav.tsx`
  - `open`(논리 토글)과 `panelMounted`(실제 DOM 존재)를 분리.
  - effect: open=true면 즉시 `panelMounted=true`(reveal 발화). open=false면 보류하되,
    reduced-motion이면 즉시 언마운트(그땐 onAnimationEnd가 안 뜨므로).
  - 패널 렌더 조건을 `panelMounted`로, `data-state={open ? "open" : "closed"}` 부여,
    `onAnimationEnd`에서 닫히는 중이면(`!open`) 언마운트.
- `src/app/globals.css`
  - `@keyframes nav-panel-conceal`(1fr→0fr, opacity 1→0) 신설.
  - `.nav-panel-reveal`을 `[data-state="open"]`(reveal 200ms ease-out) /
    `[data-state="closed"]`(conceal 180ms ease-in **forwards**)로 분기.
  - reduced-motion에서 양쪽 `animation: none`.

## 성능·견고성 판단

- 펼침과 동일한 grid-rows 기법이라 추가 비용 없음. conceal `forwards`로 언마운트
  직전 재확장 깜빡임 차단.
- reduced-motion에서 onAnimationEnd 미발화로 패널이 남아 클릭을 가로채는 함정을
  즉시-언마운트 경로로 방어.
- 빠른 토글(열자마자 닫기 등)은 애니메이션이 교체되며 자연 복구 — 마지막 방향의
  animationend만 유효.

## 검증 (내장 브라우저, 375px 모바일 폭)

- 열기: 시작 높이 1px, `animation-name: nav-panel-reveal`, `data-state: open`.
- 닫기: 높이 476px → 316px → (~180ms 후) 패널 DOM 제거. `afterClosePanelExists: false`.
- 버튼 `aria-expanded`가 닫힘과 함께 false로 복귀.

## 변경 파일

- `src/components/site-nav.tsx`
- `src/app/globals.css`

커밋: `4ca54ce`
