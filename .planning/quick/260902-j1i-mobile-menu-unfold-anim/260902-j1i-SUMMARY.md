---
quick_id: 260902-j1i
slug: mobile-menu-unfold-anim
date: 2026-09-02
status: complete
commit: 344f013
---

# Quick Task 260902-j1i — 모바일 메뉴 펼침 애니메이션 (완료)

## 무엇을 했나

640px 미만 햄버거 메뉴 패널(`#site-nav-panel`)이 "살짝 페이드인"(opacity +
translateY(-4px))만 되던 것을, **위에서 아래로 펼쳐지는(unfold)** 애니메이션으로
교체했다.

## 어떻게

- `src/app/globals.css` — `@keyframes nav-panel-reveal`를 `grid-template-rows`
  `0fr → 1fr` + `opacity` `0 → 1`로 재작성. `.nav-panel-reveal`를 grid 컨테이너
  (`display: grid; grid-template-rows: 1fr; animation: … 200ms ease-out`)로,
  새 `.nav-panel-clip`(`min-height: 0; overflow: hidden`) 추가.
- `src/components/site-nav.tsx` — 패널 콘텐츠를 `.nav-panel-clip` 래퍼 한 겹으로
  감쌈(grid 자식이 0fr 구간에서 잘리도록). 로직 변경 없음.

## 성능 판단 (요청: "성능에는 문제없도록")

- **grid-rows 0fr→1fr**는 콘텐츠 auto 높이를 JS로 재지 않고 순수 CSS로 진짜 높이를
  펴는 현대 표준 기법. 대안 기각:
  - `max-height` 하드코딩 → 콘텐츠가 잘리거나 이징이 튐.
  - `transform: scaleY` → 컴포지터 전용으로 가장 싸지만 텍스트가 눌려 찌그러져
    메뉴 가독성 훼손.
- grid-rows는 프레임당 레이아웃을 유발하나 대상이 작은 패널 하나(≤7행)·지속
  ~200ms라 비용이 무시할 수준. reduced-motion에서는 `animation: none`으로 즉시 표시.

## 검증 (내장 브라우저, 375px 모바일 폭)

- 햄버거 클릭 → 패널 높이가 **1px → 288px → 467px(~180ms)**로 매끄럽게 펼쳐짐.
- 계산 스타일 확인: `display: grid`, `grid-template-rows: 475px`(=1fr 해소),
  `animation-name: nav-panel-reveal`, `animation-duration: 0.2s`,
  `.nav-panel-clip { overflow: hidden; min-height: 0 }`, 링크 9개 모두 렌더.
- `@keyframes nav-panel-reveal` 등록 확인. reduced-motion 블록은 기존 패턴 계승
  (base 규칙의 `display:grid; grid-template-rows:1fr`로 즉시 전개).
- 데스크톱은 `sm:hidden`이라 영향 없음.

## 변경 파일

- `src/app/globals.css`
- `src/components/site-nav.tsx`

커밋: `344f013`
