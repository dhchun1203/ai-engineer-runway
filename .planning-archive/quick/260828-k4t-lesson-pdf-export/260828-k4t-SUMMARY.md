---
phase: quick-260828-k4t
plan: 01
status: complete
subsystem: content-delivery
tags: [print, pdf, ipad, notability, static-routes, tailwind-v4]

requires:
  - phase: quick-260827-0y8
    provides: "[data-notepad] 메모장 DOM 계약 — 인쇄에서 숨겨야 할 대상"
  - phase: 06-site-wide-design-polish
    provides: "[data-section-tape] · [data-code-block] · [data-progress-controls] DOM 계약, tap-feedback/card-interactive 눌림 클래스"
provides:
  - "globals.css @media print — 사이트 전역 인쇄 계약(지면 여백·크롬 숨김·코드 줄바꿈·쪽 나눔·다크 안전망)"
  - "[data-print-hide] — 앞으로 추가될 화면 전용 요소가 선택자 목록을 건드리지 않고 인쇄에서 빠지는 열린 문"
  - "[data-print-break] — 인쇄에서 새 쪽을 여는 표식"
  - "print-mode.tsx — 인쇄 직전 .dark 해제 + <details> 펼침, 인쇄 후 원복(루트 레이아웃에 상주)"
  - "print-button.tsx — window.print() 트리거"
  - "print-scopes.ts — all | step-N | module-N-M 범위 네임스페이스 + getLessonNumber(모듈id-순번)"
  - "레슨/묶음 문서 제목 끝의 커리큘럼 번호 — Safari가 만드는 PDF 파일명 규약"
  - "/print 허브 + /print/[scope] 23개 정적 라우트"
affects: [lesson-page, curriculum-page, root-layout, globals-css]

actuals:
  tasks: 4
  commits: 4

tech-stack:
  added: []
  patterns:
    - "브라우저 인쇄를 PDF 렌더러로 삼는다 — 서버 chromium(puppeteer) 없이 iOS Safari 인쇄 미리보기 → 공유 시트 → Notability 경로를 그대로 출력 파이프라인으로 쓴다"
    - "CSS로 되돌릴 수 없는 두 가지(다크 유틸리티 수백 개, <details>의 open HTML 상태)만 인쇄 직전 DOM 조작으로 처리하고, 나머지는 전부 @media print — 조작한 것에는 표식(data-print-opened)을 달아 원복 범위를 우리가 바꾼 것으로 한정한다"
    - "beforeprint/afterprint와 matchMedia('print') 두 경로를 함께 듣는다 — Safari의 인쇄 이벤트 발화가 불안정하고, 공유 시트→인쇄처럼 버튼을 거치지 않는 경로도 잡아야 한다. enter()/leave()는 멱등이라 두 경로가 겹쳐도 무해하다"
    - "범위를 단일 슬러그 네임스페이스(all/step-N/module-N-M)로 통일 — 라우트 하나 + generateStaticParams가 곧 프리렌더 목록"
    - "문서 <title>이 Safari가 만드는 PDF 파일명이다 — 제목 끝에 커리큘럼 번호를 붙여('… · 1-3-1', '… (인쇄용) · 1-3') Notability 파일 목록에서 제목만으로 커리큘럼 위치를 알 수 있게 한다"
    - "묶음 인쇄본의 목차·레슨 머리에 찍는 번호도 묶음마다 달라지는 일련번호(01/02)가 아니라 커리큘럼 번호로 통일 — 화면·파일명·종이가 같은 번호 체계를 쓴다"

key-files:
  created:
    - src/components/print-mode.tsx
    - src/components/print-button.tsx
    - src/content/print-scopes.ts
    - src/app/print/page.tsx
    - "src/app/print/[scope]/page.tsx"
  modified:
    - src/app/globals.css
    - src/app/layout.tsx
    - "src/app/lesson/[lessonId]/page.tsx"
    - src/app/curriculum/page.tsx
---

## 무엇을 만들었나

레슨을 PDF로 꺼내 Notability에서 애플펜슬로 필기할 수 있게 했다. 입구는 두 개다.

- **레슨 한 편** — 레슨 화면 제목 아래 "PDF로 저장" 버튼
- **여러 편 묶음** — `/print` 허브에서 전체(35편) / Step 3개 / 모듈 19개 중 범위 선택

## 왜 이렇게 했나

서버 PDF 렌더러(puppeteer/chromium)를 붙이지 않았다. 이 사이트는 완전 정적
프리렌더이고 Vercel 함수에 chromium을 얹는 비용이 얻는 것보다 크다. 반면 iOS
Safari의 인쇄 미리보기는 그 자체가 PDF이고 공유 시트에서 Notability로 바로
넘어간다 — 브라우저가 이미 PDF 렌더러다. npm 패키지가 하나도 늘지 않았다.

## 검증 (Playwright 인쇄 미디어 실측, 17/17)

| 확인 | 결과 |
|---|---|
| 다크 모드에서 인쇄 → .dark 해제 | PASS |
| 접힌 정답 상자 5개 전량 펼침 | PASS (5/5, 화면에서는 0/5) |
| 사이트 헤더·복사 버튼·완료 버튼·페이저·구간 테이프·메모장·PDF 버튼 숨김 | PASS (전부 0건) |
| 코드 블록 `white-space: pre-wrap` 전환 | PASS |
| 인쇄 후 다크 모드·details 원복, 표식 잔여 0 | PASS |
| 레슨 PDF / 모듈 묶음 / 전체 묶음 생성 | PASS (693KB / 1.0MB / 8.2MB·약 222쪽) |
| 묶음 문서 제목 = PDF 파일명 | PASS ("Python 프로그래밍 기초 (인쇄용) · 1-3") |
| 레슨 35편 전부 제목 끝에 커리큘럼 번호 | PASS (불일치 0건) |

빌드: 23개 인쇄 라우트 전부 SSG 프리렌더. 게이트 brand·design-tokens·manifest·
route-rendering·lesson-structure·progress-gates 전부 통과, lint 0.

## 뒤이은 보완 (커밋 4)

레슨 페이지에 문서 제목이 없어 모든 레슨 PDF가 "AI Engineer Runway" 하나로 저장되던
문제를 함께 잡았다 — 이제 제목이 `Python 변수·자료형 · 1-3-1`이고, 묶음은
`Python 프로그래밍 기초 (인쇄용) · 1-3`이다. 인쇄본 목차·레슨 머리의 번호도
일련번호에서 커리큘럼 번호로 바꿔 파일명·종이·커리큘럼이 같은 번호를 쓴다.

## 남은 것

- 쪽 번호·머리말은 넣지 않았다 — CSS만으로 지면 번호를 매기려면 paged.js 같은
  런타임이 필요한데, 필기용 PDF에 그만한 값이 없다고 봤다.
- 실기기(아이패드 Safari) UAT는 사용자 확인 대기.
