---
phase: quick-260828-d3n
plan: 01
status: complete
subsystem: design-system
tags: [design, tokens, tailwind-v4, dark-mode, typography]

requires:
  - phase: 06-site-wide-design-polish
    provides: "토큰 기반 색·타이포 계층과 이를 강제하는 게이트(check-design-tokens, e2e-typography) — 팔레트 교체가 한 곳에서 끝난 이유"
provides:
  - "크림 종이·각진 패널 팔레트(라이트/다크) — marketing.dailyaithread.com 이식"
  - ".panel/.panel-hero/.btn/.btn-action/.chip/.chip-solid/.site-header/.brand-mark/.hairline 컴포넌트 클래스"
  - "--radius-* = 0 전역 각짐, --text-*--letter-spacing 전역 트래킹"
affects: [globals-css, site-nav, step-card, module-accordion, progress-summary, complete-button, schedule-table, print-pages, prose]

actuals:
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "팔레트 교체를 @theme 토큰 값 수정만으로 끝낸다 — 컴포넌트가 시맨틱 토큰 이름(bg-surface, text-accent)만 부르고 있었기 때문에 30여 개 파일을 손대지 않고 색이 전부 바뀐다. 06 페이즈가 세운 토큰 규율의 배당금이다"
    - "Tailwind v4의 --radius-* 네임스페이스를 0으로 두면 rounded-lg/xl 호출 지점을 한 곳도 고치지 않고 사이트가 각져진다"
    - "자간을 --text-*--letter-spacing으로 크기 토큰에 묶는다 — 컴포넌트마다 tracking 유틸리티를 다는 것보다 어긋날 경로가 없다"
    - "컴포넌트 클래스는 @layer components에 둔다 — 레이어 밖에 두면 .panel의 border 단축 속성이 유틸리티(border-l-4/border-l-step-N)를 이겨 Step 색 왼쪽 막대가 사라진다. 반대로 유틸리티를 이겨야 하는 규칙(.rounded-full 무력화)만 레이어 밖에 남긴다"
    - "게이트의 허용 집합은 디자인 결정이 바뀌면 함께 바뀐다 — 굵기 800/900과 36px을 추가했다. 집합이 열린 것이 아니라 새 값으로 다시 닫혔다"

key-files:
  modified:
    - src/app/globals.css
    - scripts/check-design-tokens.mjs
    - scripts/e2e-typography.mjs
    - src/components/site-nav.tsx
    - src/components/step-card.tsx
    - src/components/module-accordion.tsx
    - src/components/progress-summary.tsx
    - src/components/complete-button.tsx
    - src/components/schedule-table.tsx
    - src/components/depth-badge.tsx
---

## 무엇을 했나

사용자가 만든 자매 학습 사이트 **marketing.dailyaithread.com**의 디자인을 이 사이트
전체에 이식했다. 원본 사이트를 브라우저로 열어 CSS 커스텀 프로퍼티·계산된 스타일·
스크린샷을 실측해 시스템을 복원한 뒤 옮겼다(추측으로 흉내내지 않았다).

**디자인 성격** — 크림색 종이(#f5f4f0) 위 흰 패널, 둥근 모서리 0, 흐림 없는 하드
오프셋 그림자, 굵은 제목(900/800)과 좁은 자간(-0.04em), 파랑(accent)과 주황(action)
두 강조축. 인쇄물에 가까운 편집 디자인이다.

## 어디까지 바뀌었나

| 표면 | 전 | 후 |
|---|---|---|
| 지면 | 연회색 #f8fafc | 크림 종이 #f5f4f0 |
| 카드 | 둥근 모서리, 테두리 없음 | 각진 1px 잉크 테두리 + 오프셋 그림자 |
| 헤더 | 얇은 회색 경계선 | 지면색 + 굵은 잉크 밑줄, 활성 항목은 꽉 찬 잉크 블록 |
| 버튼 | 파란 채움 | 주황 실행 버튼 / 잉크 테두리 버튼, 누르면 그림자만큼 내려앉음 |
| 배지 | 알약형 틴트 배경 | 각진 색 테두리 칩 |
| 제목 | 30px / 700 | 36px / 900, 자간 -0.04em |
| 본문 | 행간 1.8 | 행간 1.9, h2 위 얇은 선 |

## 왜 이렇게 빨리 끝났나

Phase 6이 세운 토큰 규율 덕분이다. 컴포넌트가 리터럴 색을 쓰지 않고 시맨틱 토큰
이름(`bg-surface`, `text-accent`, `border-badge-neutral-bg`)만 부르고 있어서, `@theme`
값 교체만으로 30여 개 파일의 색이 한 번에 바뀌었다. 모서리도 마찬가지로 Tailwind v4의
`--radius-*` 네임스페이스를 0으로 두는 것으로 끝났다 — `rounded-lg` 호출 지점을 한
곳도 고치지 않았다.

손으로 고친 것은 **형태**뿐이다: 어떤 면이 패널이고 어떤 것이 버튼·칩인지.

## 함정 하나

컴포넌트 클래스를 레이어 밖에 정의했더니 `.panel`의 `border` 단축 속성이 카드의
`border-l-4 border-l-step-N` 유틸리티를 이겨 **Step 색 왼쪽 막대가 사라졌다**.
Tailwind v4에서 레이어 밖 CSS는 모든 레이어를 이긴다. `@layer components`로 옮겨
해결했고, 반대로 유틸리티를 이겨야 하는 규칙(`.rounded-full` 무력화)만 레이어 밖에
남겼다.

## 검증

빌드, 게이트 10종(brand·design-tokens·manifest·route-rendering·lesson-structure·
progress-gates·progress-math·schedule·pace·font-glyph-coverage), lint,
e2e-progress·e2e-typography·e2e-mobile-overflow(21/21) 전부 통과. 라이트·다크 양쪽
아이패드 폭(834px)에서 홈·커리큘럼·Step·레슨·일정표·PDF 허브·소개 스크린샷 확인.

## 남은 것

- 실기기(아이패드 Safari) 확인은 사용자 몫.
- Step 색이 파랑·주황·황토로 바뀌었다 — 06-UI-SPEC.md의 D-04 삼색 표기는 이 결정
  이후 낡았다. 문서 정합은 다음 문서 갱신 때 함께 처리한다.
