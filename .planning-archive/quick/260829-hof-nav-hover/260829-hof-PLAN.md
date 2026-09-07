---
task_id: 260829-hof
description: 헤더 내비게이션에 호버 효과 — 비활성 항목은 잉크 밑줄이 좌→우로 그어지고, 활성 항목은 강조색 하드 그림자로 떠오르며, 로고 표식도 한 뼘 더 뜬다
mode: quick
created: 2026-08-29
phase: quick-260829-hof
plan: 01
type: design
wave: 1
depends_on: []
autonomous: true
files_modified:
  - src/app/globals.css
  - src/components/site-nav.tsx

must_haves:
  truths:
    - "마우스가 있는 기기에서 내비 항목에 커서를 올리면 눈에 보이는 반응이 있다 — 비활성 항목은 글자가 잉크색으로 또렷해지면서 밑줄이 좌에서 우로 그어진다."
    - "현재 페이지 항목(꽉 찬 잉크 블록)도 반응한다 — 버튼과 같은 문법으로 1px 떠오르고 강조색 하드 그림자가 뒤에 깔린다."
    - "로고에 커서를 올리면 앞의 사각형 표식이 한 뼘 더 뜬다."
    - "터치 기기(아이패드)에서는 이 효과들이 손을 뗀 뒤에 붙들려 남지 않는다 — 전부 @media (hover: hover) 안에 있다."
    - "prefers-reduced-motion: reduce에서 트랜지션과 transform이 꺼진다 — 상태 자체(색·밑줄·그림자)는 즉시 보인다."
    - "누르는 동안의 tap-feedback(내려앉기)이 호버 규칙에 가려지지 않는다."
    - "새 색을 만들지 않는다 — foreground / accent / action 기존 토큰만 쓴다(check-design-tokens 통과)."
    - "640px 미만 햄버거 패널의 항목도 데스크톱 행과 같은 규칙을 받는다."
---

<objective>
사용자가 내비에 호버가 없다고 지적했다. 실제로 규칙은 존재했지만 죽어 있었다.

`globals.css`의 `.site-header a:not(.chip-solid):hover { color: ... }`가
`@layer components` 안에 있다. Tailwind v4의 레이어 순서는
`theme, base, components, utilities`이므로, 항목에 붙은 `text-muted`
유틸리티(= utilities 레이어)가 명시도와 무관하게 항상 이긴다.
즉 커서를 올려도 색이 바뀌지 않는다 — 화면상 호버가 전혀 없다.

고칠 것은 두 가지다.
1. 규칙을 레이어 밖(unlayered)으로 옮겨 실제로 적용되게 한다.
   unlayered 선언은 모든 @layer를 이긴다 — 같은 파일의 `.card-interactive`,
   `.tap-feedback`이 이미 이 자리에 있다.
2. 색 변화 하나로는 이 디자인의 문법에 못 미친다. 잉크 밑줄(비활성)과
   하드 오프셋 그림자로 떠오르기(활성)를 더해 "누를 수 있다"를
   깊이로 말한다 — 직전 커밋 de93bb9가 버튼·카드에 세운 것과 같은 문법.
</objective>

<tasks>
1. site-nav.tsx: 내비 항목 링크에 `nav-link`, 로고 링크에 `brand-link` 클래스를
   붙인다(데스크톱 행 + 햄버거 패널 양쪽). 햄버거 버튼의 hover 배경 토큰을
   테마 토글과 같은 badge-neutral로 맞춘다.
2. globals.css: `@layer components` 안의 죽은 `.site-header a:hover` 규칙을
   제거하고, `.tap-feedback` 블록 뒤 unlayered 구간에 내비 호버 문법을
   새로 세운다 — `.nav-link::after` 밑줄(scaleX 0→1),
   `.nav-link.chip-solid:hover` 떠오르기 + accent 하드 그림자,
   `.brand-link:hover .brand-mark` 표식 뜨기. 전부 @media (hover: hover)
   안에, prefers-reduced-motion 해제 규칙 포함.
3. 게이트 확인: design-tokens / brand / lint / build.
</tasks>
