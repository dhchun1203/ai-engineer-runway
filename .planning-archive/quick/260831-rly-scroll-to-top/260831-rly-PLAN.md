---
phase: quick-260831-rly
plan: 01
status: complete
subsystem: ui
tags: [ui, navigation, floating, ipad, a11y]

provides:
  - "전 화면 공통 '맨 위로' 플로팅 버튼 — 스크롤에 반응해 나타나고 사라짐"
affects: [root-layout, globals-css]
---

# 맨 위로 가기 플로팅 버튼

레슨 본문이 길고(그림 확장 후 더 길어졌다) 아이패드에서 위로 돌아가려면 계속 쓸어
올려야 한다. 우측 하단에 상시 대기하는 버튼을 둔다.

## 바닥에 이미 있는 것 (조사 결과)

`.note-sheet`(레슨 페이지 메모장) — `position: fixed`, 좌우 전체 폭, `bottom: 0`,
손잡이 높이 44px, `z-index: 40`. 레슨 페이지에서 버튼이 이 위에 겹치면 메모장 손잡이를
가린다.

→ 버튼은 손잡이 **위로** 올리고, `z-index`는 40보다 **낮게** 둔다. 메모장을 펼치면
버튼이 그 뒤로 가려지는 게 맞다 — 메모를 쓰는 중에는 맨 위로 갈 일이 없다.

## 작업

| # | 내용 |
|---|---|
| 1 | `src/components/scroll-to-top.tsx` — 스크롤 감지 + 맨 위로 이동 (클라이언트 컴포넌트) |
| 2 | `globals.css` — `.scroll-top` 자리·표시 규칙, 메모장 있는 페이지에서 띄우기, 인쇄 숨김 |
| 3 | 루트 레이아웃에 배치 (전 페이지 공통) |
| 4 | 게이트 + 내장 브라우저 아이패드 세로 실측 |

## 결정

- **나타나는 시점**: 스크롤 480px 이상. 첫 화면에서는 안 보인다(맨 위인데 맨 위로 버튼은 소음).
- **모양**: `.btn` 재사용 (44px 터치 타깃 · 1px 잉크 테두리 · 3px 하드 오프셋 그림자 ·
  호버 시 떠오름). 새 버튼 스타일을 만들지 않는다 — 정사각 폭만 덮어쓴다.
- **자리**: 우측 하단. 메모장이 있는 페이지(`body:has([data-notepad])`)에서는 손잡이
  높이만큼 올린다. `env(safe-area-inset-bottom)` 반영.
- **z-index 30**: 헤더(20)·구간 테이프(10)보다 위, 메모장(40)보다 아래.
- **숨김 방식**: `visibility: hidden` — 탭 순서에서도 빠진다(`opacity: 0`만으로는
  안 보이는 버튼에 포커스가 들어간다).
- **모션**: `prefers-reduced-motion`이면 부드러운 스크롤·페이드를 끈다.
- **인쇄**: `data-print-hide` — globals.css의 열린 문을 그대로 쓴다.

## 게이트

`check-design-tokens` · `check-brand` · `e2e-mobile-overflow` · `next build` ·
내장 브라우저 768×1024 실측(라이트/다크, 레슨/비레슨 페이지)
