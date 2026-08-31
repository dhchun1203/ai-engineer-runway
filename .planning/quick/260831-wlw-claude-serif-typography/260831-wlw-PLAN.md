---
phase: quick-260831-wlw
plan: 01
status: complete
subsystem: ui
tags: [typography, font, serif, korean, design-system]

provides:
  - "본문 세리프 전환 — 클로드의 '제목 산세 + 본문 세리프' 배치 재현"
  - "코드 전용 모노 서체"
affects: [fonts-lib, root-layout, globals-css, font-subset-gate]
---

# 클로드 인상의 타이포그래피 — 본문 세리프 전환

## 전제 (사용자에게 이미 알린 사실)

클로드의 실제 서체(Styrene·Tiempos·Copernicus·Anthropic Serif/Sans/Mono)는 전부
상용 라이선스 또는 앤스로픽 전용 주문 제작이라 이 저장소에 넣을 수 없다. 그리고
**한글이 한 글자도 없다** — 본문이 전부 한국어인 이 사이트에는 그대로 쓸 수 없다.

따라서 목표는 "클로드 폰트를 가져오기"가 아니라 **"클로드의 배치를 라이선스 가능한
서체로 재현하기"** 다. 클로드의 배치는 제목 산세 + 본문 세리프다.

## 서체 선택

| 자리 | 서체 | 라이선스 | 이유 |
|---|---|---|---|
| 본문 라틴 | Newsreader | OFL | Tiempos와 같은 계열의 뉴스 세리프. 가변축(opsz·wght)이라 굵기 집합을 다 덮는다 |
| 본문 한글 | Hahmlet | OFL | 가변 명조(100~900). 라틴 세리프와 짝을 맞춰 설계됐고, 이 사이트가 쓰는 600~800 굵기를 전부 낸다 |
| 제목·UI | Pretendard (유지) | OFL | 클로드가 제목에 산세를 쓰는 배치 그대로. 이미 서브셋·게이트가 붙어 있어 건드릴 이유가 없다 |
| 코드 | JetBrains Mono | OFL | 현재 `ui-monospace`(기기마다 다른 서체)를 고정된 하나로 바꾼다 |

**폰트 스택 순서**: 라틴 서체를 먼저 둔다. 라틴 세리프에는 한글이 없으므로 한글은
자동으로 다음 순서인 한글 명조로 떨어진다 — 이게 라틴/한글 혼용의 표준 방식이다.

## 조달 방식

`next/font/google`. 런타임에 구글로 요청이 나가는 방식이 아니라 **빌드 때 내려받아
자기 도메인에서 서빙**한다(Next.js 기본 동작). 그래서 개인정보·추가 왕복 문제가 없고,
Pretendard처럼 파일을 저장소에 넣지 않아도 된다.

한글 서체는 구글이 유니코드 구간별로 90여 조각으로 쪼개 배포하므로, 브라우저가
그 페이지에 실제로 쓰인 글자의 조각만 내려받는다 — 우리가 만든 서브셋 파이프라인과
같은 효과를 얻는다.

## 작업

| # | 내용 |
|---|---|
| 1 | `src/lib/fonts.ts` — Newsreader·Hahmlet·JetBrains Mono 추가 (Pretendard 유지) |
| 2 | 루트 레이아웃에 폰트 변수 연결 |
| 3 | `globals.css` — body 세리프, 제목 Pretendard 고정, 코드 모노 고정 |
| 4 | 글리프 커버리지 게이트가 Pretendard만 보던 범위 문제 정리 |
| 5 | 게이트 + 내장 브라우저 아이패드 세로 실측(라이트/다크, 레슨/비레슨) |

## 위험

- **제목이 산세로 남는데 본문만 세리프가 되면 위계가 어긋날 수 있다** → 실측으로 확인.
- **한글 명조는 산세보다 작은 크기에서 읽기 어렵다** → 아이패드에서 본문 크기 실측.
- 빌드 때 구글에서 폰트를 받으므로 네트워크가 막히면 빌드가 실패한다 → 폴백 스택을
  시스템 세리프까지 적어 둔다.

## 게이트

`check-design-tokens` · `check-brand` · `e2e-typography`(크기·굵기 히스토그램) ·
`e2e-mobile-overflow` · `check-font-glyph-coverage` · `next build`
