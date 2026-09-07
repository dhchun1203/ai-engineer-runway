---
phase: quick-260831-wlw
plan: 01
status: complete
subsystem: ui
tags: [typography, font, serif, korean, licensing, design-system]

provides:
  - "본문 세리프 전환 — 클로드의 '제목 산세 + 본문 세리프' 배치를 OFL 서체로 재현"
  - "코드 전용 고정 서체(JetBrains Mono) — 기기마다 다르던 ui-monospace 대체"
  - "서브셋 파이프라인·커버리지 게이트의 다중 폰트 지원"
affects: [fonts-lib, root-layout, globals-css, subset-script, coverage-gate, typography-gate]

actuals:
  tasks: 5
  commits: 1

tech-stack:
  added: ["Newsreader (next/font/google)", "Noto Serif KR (self-hosted subset)", "JetBrains Mono (next/font/google)"]
  patterns:
    - "한국어 폰트는 분류명(serif)이 아니라 실제 한글 자형을 봐야 한다 — Hahmlet은 'serif'지만 라틴만 세리프이고 한글은 고딕이다"
    - "next/font/google로는 한글 폰트를 받을 수 없다 — 구글이 한글을 이름 없는 유니코드 조각으로 쪼개 배포해 Next의 폰트 데이터에 korean 서브셋을 가진 폰트가 0개다"
    - "폰트 스택에서 자리마다 책임 범위가 다르면 커버리지 게이트의 요구 범위도 자리별로 달라야 한다 — 전 폰트에 전 글자를 요구하면 그리지도 않을 글자를 요구하게 된다"
---

## 전제 — 클로드 폰트는 넣을 수 없다

사용자 요청은 "모든 폰트를 클로드 폰트로"였다. 실제 서체는 Styrene(제목)·Tiempos(본문)·
Copernicus(로고), 최근의 Anthropic Serif/Sans/Mono다. **전부 상용 라이선스이거나 앤스로픽
전용 주문 제작**이라 저장소에 넣을 수 없고, 검색에 나오는 "무료 다운로드"는 무단 재배포다.

더 결정적으로 **이 서체들에는 한글이 한 글자도 없다**. 본문이 전부 한국어인 사이트에
그대로 넣으면 한글은 시스템 폰트로 떨어져 라틴과 한글이 따로 노는 화면이 된다.

사용자에게 이 두 사실을 알리고 방향을 물어 **"본문 세리프로 전환(클로드의 배치를 재현)"**
을 선택받았다.

## 배치

| 자리 | 서체 | 조달 |
|---|---|---|
| 본문 라틴 | Newsreader (OFL) | next/font/google — 빌드 때 내려받아 자기 도메인에서 서빙 |
| 본문 한글 | Noto Serif KR (OFL, 가변) | 원본 저장 + 서브셋 자체 호스팅 |
| 제목·UI·그림 라벨 | Pretendard (유지) | 기존 서브셋 |
| 코드 | JetBrains Mono (OFL) | next/font/google |

스택 순서가 곧 역할 분담이다: 라틴 세리프에 한글이 없으므로 한글은 다음 순서인 명조가
받고, 둘 다 없는 글자(①②③ 등)는 맨 뒤 Pretendard가 받는다.

## 물린 것 — Hahmlet은 명조가 아니었다

처음에 Hahmlet을 골랐다. 구글 폰트에서 **serif로 분류된 한국어 폰트**였고 가변축도 있었다.
넣고 나서 화면을 보니 한글이 여전히 산세로 보였다.

측정으로는 Hahmlet이 한글을 그리고 있는 게 맞았다(스택 폭 445.84 ≈ Hahmlet 448.88,
Pretendard 420.43과는 25px 차이). 그런데도 명조로 안 보였다 — 그래서 같은 문자열을
Hahmlet / Pretendard / 시스템 serif / 시스템 sans로 **64px 크게 나란히 렌더해 비교**했다.

결론: **Hahmlet은 라틴만 세리프이고 한글 자형은 고딕이다.** 분류명이 한글 자형을
보장하지 않는다. Noto Serif KR(진짜 명조, 가변 200~900)로 교체했다.

이건 "측정은 통과했는데 눈으로 보니 틀린" 경우다 — 폭 측정만 믿었으면 그대로 배포됐다.

## next/font/google로는 한글을 못 받는다

Hahmlet을 처음엔 `next/font/google`로 넣었는데 한글이 안 왔다. 원인을 찾아보니 이 Next
버전의 폰트 데이터에 **`korean` 서브셋을 가진 폰트가 0개**다 — 구글이 한글을 이름 없는
유니코드 구간 90여 조각으로 쪼개 배포하기 때문이다. 그래서 한글은 Pretendard와 같은
방식(원본 저장 → 서브셋 → 자체 호스팅)으로만 가능하다.

## 게이트 확장

- **서브셋 스크립트**가 폰트 하나가 아니라 목록을 돈다. 문자 집합은 공유한다 — 제목과
  본문이 서로 다른 글자를 쓰지 않으므로 집합을 나누면 어긋날 경로만 생긴다.
- **커버리지 게이트**가 폰트마다 **담당 범위**를 따로 갖는다. Pretendard는 콘텐츠 전체
  (본문 스택 맨 뒤 안전망이므로), Noto Serif KR은 한글만. 이 구분이 없었다면 명조에
  ①②③이 없다고 실패했을 것이다 — 애초에 그 폰트가 그리지 않을 글자다.
- 게이트가 실제로 구멍을 잡았다: 처음 붙였을 때 `①②③④⑤⑥`(레슨 본문과 그림에 실제로
  쓰인다)이 명조에 없다고 보고했고, 그래서 Pretendard를 스택 맨 뒤 안전망으로 넣었다.

## 곁가지로 잡은 것 — 타이포 게이트가 이미 깨져 있었다

`e2e-typography`가 그림 안 SVG 글자(13px·18px)를 타입 스케일 위반으로 잡고 있었다.
**오늘 레슨 35편에 그림 115점을 넣을 때(quick 260831-n5r) 이 게이트를 돌리지 않아
놓쳤던 것**이고, 이번 폰트 작업과는 무관하다.

그림 안 글자는 SVG 좌표계 값이라 페이지 타입 스케일과 단위가 다르다(그림이 본문 폭에
맞춰 줄면 화면 크기도 같이 줄고, viewBox마다 배율이 다르다). 게이트가 `[data-diagram]`
내부를 제외하도록 고쳤다 — globals.css가 같은 이유로 크기를 각 SVG에 맡기고 있다.

## 그림 라벨은 산세로 되돌렸다

`.prose [data-diagram] text`가 `font-family: inherit`이라 본문이 세리프가 되자 그림
라벨까지 명조가 됐다. 13~14px 한글 명조는 획이 가늘어 도형 선에 묻힌다. 그림 안 글자는
읽는 문장이 아니라 도형에 붙은 라벨이고, 클로드의 배치에서도 도식·UI 라벨은 산세다.

## 검증

브라우저로 아이패드 세로(768×1024) 프로덕션 빌드 실측.

| 확인 | 결과 |
|---|---|
| 본문 한글 | Noto Serif KR 명조 (64px 비교 렌더로 자형 확인) |
| 본문 라틴 | Newsreader 세리프 |
| 제목·버튼·배지 | Pretendard 산세 |
| 그림 라벨 | Pretendard 산세 |
| 코드 | JetBrains Mono |
| 다크 모드 | 확인 |
| Step 강조색 | 유지(Step 2 주황 확인) |

게이트: `check-design-tokens` · `check-brand` · `check-manifest` · `check-lesson-structure` ·
`check-font-glyph-coverage`(2종) · `e2e-typography` · `e2e-mobile-overflow`(21조합) ·
`e2e-perf-budget` · `next build` — 전부 통과.

## 남길 숫자 — 폰트 용량이 늘었다

첫 방문 전송 바이트에서 폰트가 **1,169,676 bytes(48.5%)** 다. 폰트가 하나에서 넷으로
늘었으니 당연한 결과이고 성능 게이트는 통과하지만, 아이패드 셀룰러에서는 체감될 수 있다.

줄일 여지: 지금 서브셋은 실측 문자에 더해 KS X 1001 완성형 2,350자를 통째로 넣는다(앞으로
쓸 글자를 위한 여유분). 이 여유를 명조에서만 빼면 200KB 이상 줄지만, 레슨을 추가할 때마다
서브셋을 다시 만들어야 한다. 지금은 여유를 남겨 뒀다 — 필요하면 언제든 뺄 수 있다.
