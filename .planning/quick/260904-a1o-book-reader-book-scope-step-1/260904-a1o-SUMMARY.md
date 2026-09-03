---
quick_id: 260904-a1o
slug: book-reader-book-scope-step-1
date: 2026-09-04
status: complete
commits:
  - 70ea9ae
  - 7a991cf
---

# Quick Task 260904-a1o — 스탭별 "책으로 읽기(book reader)"

## 무엇을 만들었나

스텝 화면에 **"📖 책으로 읽기"** 버튼을 넣고, 누르면 `/book/[step]`에서 그 스텝의
레슨들을 **한 권의 책처럼 이어 읽는** 화면을 붙였다. 레슨 모음이 아니라 하나의
스토리라인으로 읽힌다:

- **표지** → **스텝 여는 글** → **챕터(레슨)들** — 각 챕터가 "왜 배우나" 도입 →
  개념 설명(비유·SVG 다이어그램·TwistBox) → `NextTeaser`(다음 챕터로 넘어가는
  다리)로 흐르고, 챕터 사이는 `❧`로 나뉜다.
- 학습 장치(학습 목표·실무 예제 코드 실행기·실무 팁·용어표·스스로 점검)는 걷어내
  이동 중에도 술술 읽히게 했다.

## 어떻게

- **`velite.config.ts`** — 레슨 헤딩이 게이트 L1로 전 레슨 동일한 점을 이용해
  원문에서 `## 2`(왜 배우나) + `## 3`(개념 설명) 본문 + 끝의 `<NextTeaser>`만
  잘라(`sliceBookContent`) `@mdx-js/mdx` function-body로 컴파일한 **`bookCode`**와,
  대략 읽기 시간 **`bookMinutes`**를 레슨마다 만든다. 렌더는 기존
  `MDXContent`(`new Function`) 그대로 — 새 로더를 만들지 않았다.
- **`src/content/book-scopes.ts`** — 스텝 메타 + 챕터 목록 + 스텝 여는 글 + 총
  읽기 시간 조립(`print-scopes.ts`의 형제).
- **`src/app/book/[step]/page.tsx`** — `print/[scope]`와 같은 정적 프리렌더 계약
  (진도·쿠키 안 읽음). SSG로 `/book/1·2·3` 프리렌더.
- **`src/components/reading-progress.tsx`** — rAF 배칭 상단 읽기 진행 바.
- **`src/app/step/[stepId]/page.tsx`** — 헤더에 책 버튼(44px+).
- **`remark-gfm`** 직접 의존성 추가(개념 섹션 GFM 표).

## 검증

- 아이패드 폭(768) 내장 브라우저 실측 — 라이트/다크 모두: 표지·여는 글·챕터
  연속·SVG 다이어그램·`NextTeaser` 다리·`❧` 구분·진행 바·맨 위로 확인. 렌더
  에러 없음(HMR 소켓 경고만).
- `npm run build` 통과 — `/book/1·2·3` SSG, `/step/[stepId]` 정적 셸 유지.
- 게이트: check-brand·manifest·route-rendering·design-tokens·progress-gates 통과,
  lint 통과. `check-lesson-structure` L7 경고(2-1 레슨)는 선행 이슈(비차단).

## 곁다리로 바로잡음

- **G22 게이트 드리프트**: 스크롤 리스너 허용 목록을 하드코딩에서 "각 파일이
  rAF 배칭을 지키는지 검증하는" 형태로 일반화. 이 과정에서 이미 rAF 배칭인데도
  목록 누락으로 G22를 빨갛게 만들던 **`bookmark-button.tsx`**(선행 이슈,
  260904-241 SUMMARY에 "별도 태스크"로 기록됨)도 함께 초록으로 돌렸다.

## 범위 밖 (후속)

- **Step 2·3 스토리 심화** — 여는 글과 챕터 간 서사 브릿지 고도화. 지금은
  파이프라인이 전 스텝에 동작해 `/book/2·3`도 열리지만, 여는 글은 뼈대만 두었다.
  Step 1 파일럿을 아이패드 배포본에서 승인받은 뒤 진행.

## 상태

Step 1 파일럿 완료. push 후 사용자 아이패드 배포본 확인 대기.
