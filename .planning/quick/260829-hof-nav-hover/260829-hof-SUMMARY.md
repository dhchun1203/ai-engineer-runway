---
phase: quick-260829-hof
plan: 01
status: complete
subsystem: design
tags: [design, hover, nav, tailwind-v4, cascade-layers, ipad]

requires:
  - phase: quick-260828-d3n
    provides: "크림 종이·각진 패널·하드 오프셋 그림자 팔레트와 컴포넌트 클래스(.chip-solid, .brand-mark, .site-header)"
provides:
  - "내비 호버 문법 — 비활성 항목 잉크 밑줄(좌→우), 활성 항목 accent 하드 그림자로 떠오르기, 로고 표식 뜨기"
  - ".nav-link / .brand-link 클래스 — 헤더 링크를 CSS에서 지목할 수 있는 이름"
affects: [site-nav, globals-css]

actuals:
  tasks: 3
  commits: 1

tech-stack:
  added: []
  patterns:
    - "Tailwind v4에서 유틸리티가 붙은 요소의 상태 스타일은 @layer 밖(unlayered)에 써야 한다 — @layer components 안의 규칙은 명시도와 무관하게 utilities 레이어에 진다"
    - "밑줄 강조는 border-bottom이 아니라 pseudo-element로 — 높이가 흔들리지 않고, 같은 요소의 box-shadow와 속성을 두고 다투지 않는다"
    - "부모 링크의 :hover로 자식 표식을 움직인다 — 12px짜리 장식 요소에 직접 :hover를 걸면 반응 면적이 그것뿐이라 사실상 안 걸린다"
---

## 문제

사용자가 헤더 내비에 호버 효과를 요청했다. 확인해 보니 규칙이 없던 게 아니라 **죽어 있었다.**

`globals.css`의 `@layer components` 안에 이 규칙이 있었다.

```css
.site-header a:not(.chip-solid):hover { color: var(--color-foreground); }
```

Tailwind v4의 레이어 순서는 `theme < base < components < utilities`다. 레이어 간
우선순위는 **명시도보다 먼저** 결정되므로, 항목에 붙은 `text-muted`(utilities)가
`.site-header a:hover`(components, 명시도가 더 높음)를 항상 이긴다.
커서를 올려도 색이 1픽셀도 바뀌지 않는 상태였다.

## 고친 것

**`globals.css`** — 죽은 규칙을 지우고, `.card-interactive`/`.tap-feedback`이 이미 있는
레이어 밖 구간에 내비 호버 문법을 새로 세웠다. unlayered 선언은 모든 `@layer`를 이긴다.

| 대상 | 호버 반응 | 색 |
|---|---|---|
| 비활성 항목 | 글자가 잉크색으로 또렷해지고 밑줄이 좌→우로 그어짐(`::after` scaleX 0→1, 140ms) | `--color-foreground` |
| 활성 항목(꽉 찬 잉크 블록) | 1px 떠오르고 하드 오프셋 그림자 3px | `--color-accent`(파랑) |
| 로고 | 앞의 사각형 표식이 1px 뜨고 그림자 3px→4px | `--color-action`(주황, 기존 유지) |

- 전부 `@media (hover: hover)` 안 — 아이패드에서 탭한 항목이 손을 뗀 뒤에도 밑줄이
  그어진 채 남는 것을 막는다(de93bb9가 버튼·카드에 세운 것과 같은 가드).
- `.nav-link.chip-solid:active`를 같은 명시도로 되받아 두었다. 없으면
  `.nav-link.chip-solid:hover`(0,3,0)가 `.tap-feedback:active`(0,2,0)를 이겨
  활성 항목만 눌러도 내려앉지 않는다.
- `prefers-reduced-motion: reduce`에서 트랜지션과 transform을 끈다 — 밑줄·색·그림자
  같은 상태 자체는 그대로 보이고 움직임만 없앤다(6.B).
- 활성 항목 그림자에 accent(파랑)를 쓴 이유: 잉크 블록 뒤에 foreground 그림자를 깔면
  보이지 않는다. accent는 이 팔레트에서 "링크·활성 상태"를 맡은 축이라 역할이 맞고,
  로고의 accent 블록 + action 그림자와 짝이 된다.

**`site-nav.tsx`** — 항목 링크에 `nav-link`, 로고 링크에 `brand-link`를 붙였다
(데스크톱 행·햄버거 패널 양쪽). `.site-header a`로 뭉뚱그리면 로고까지 밑줄이 그어진다.
겸사겸사 햄버거 버튼의 호버 배경 토큰을 테마 토글과 같은 `badge-neutral`로 맞췄다
(전에는 혼자 `surface-2`, 값은 같지만 이름이 달랐다).

## 검증

프로덕션 빌드를 띄우고 실제 마우스로 호버해 계산된 스타일을 실측했다.

| 확인 | 라이트 | 다크 |
|---|---|---|
| 비활성 항목 글자색 | `rgb(20,22,28)` ✓ | `rgb(232,236,248)` ✓ |
| 비활성 항목 밑줄 | `scaleX(1)`, 2px, 항목 아래 8px ✓ | 같음, 잉크색 반전 ✓ |
| 활성 항목 | `translate(-1px,-1px)` + `rgb(44,79,214) 3px 3px` ✓ | `rgb(111,141,255) 3px 3px` ✓ |
| 로고 표식 | `translate(-1px,-1px)` + `rgb(194,65,12) 4px 4px` ✓ | — |
| 480px 햄버거 패널 항목 | 데스크톱과 같은 반응 ✓ | — |

게이트 check-design-tokens(40파일)·check-brand(101파일), lint, `next build` 모두 통과.

## 남은 것

- 실기기(아이패드 Safari) 확인은 사용자 몫이다 — 이 변경의 핵심 가드가
  `@media (hover: hover)`라서, 자동 검증은 "규칙이 그 안에 있다"까지만 증명한다.
  아이패드에서 항목을 탭한 뒤 손을 뗐을 때 밑줄이 남지 않는지 한 번 봐 주면 된다.
- 같은 `@layer` 함정이 다른 곳에도 있을 수 있다 — `@layer components` 안의
  `.card-interactive.panel:hover`는 box-shadow/transform이라 유틸리티와 겹치지 않아
  살아 있지만, 앞으로 색·배경 상태 스타일을 컴포넌트 레이어에 쓰면 같은 방식으로 죽는다.
