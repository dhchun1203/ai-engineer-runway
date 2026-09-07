# 번외 커리큘럼 "AI 뜯어보기" 설계

작성일: 2026-09-07
상태: 승인됨 (인프라 + 파일럿 1편 착수)

## 배경 / 목표

Step 1~3 정규 커리큘럼과 **별개로**, AI가 실제로 어떻게 동작하는지를
"하네스 설명처럼" 쉽게 풀어내는 번외 커리큘럼을 추가한다. 사용자가 AI 엔지니어
과정을 수강하며 개념의 밑바닥(토큰·어텐션·에이전트/하네스 등)을 직관으로
붙잡게 하는 것이 목적이다.

핵심 스타일 3종 장치 (사용자가 명시):
- **비유** — 개념마다 일상 비유 하나로 고정
- **그림(인터랙티브 시각화)** — 이 번외의 1순위 자산. 정적 SVG를 넘어
  **직접 만져보는 시각화**를 아주 적극적으로 쓴다 (사용자 지시 2026-09-07).
- **반문** — 독자에게 되묻고 답하기 (`TwistBox` + `<details>` 접기)

저술 방법론은 `eli5` 스킬(그림 우선·직관 설명) 방식을 따른다 — 레슨·소개 페이지와 동일.

## 하드 제약 (사용자 요구사항)

1. **진도·일정에 절대 영향 없음.** 완료 체크·진행률·일정표·복습 어디에도
   집계되지 않는다.
2. 브랜딩 규칙 유지 — 공개 문안에 "KANT"/"Kant" 금지, "AI Engineer 교육과정"
   표기 (`.claude/CLAUDE.md` HARD RULE).
3. 아이패드(iPad Safari) 우선 반응형, 터치 타깃 44px+, 코드 블록 가로 스크롤.
4. UI·콘텐츠 한국어.

## 격리 근거 (왜 진도에 안 섞이는가)

진행률(`src/lib/progress-math.ts`)·일정(`src/lib/schedule-data.ts`)·복습
(`/review`, `src/lib/review.ts`)·용어집(`/glossary`,
`src/content/curriculum-helpers.ts`)은 **전부 `lessons` Velite 컬렉션만**
소비한다. 따라서 별도 컬렉션 `concepts`를 만들면 구조적으로 그 어디에도
집계되지 않는다 — 코드로 배제하는 게 아니라 애초에 다른 컬렉션이라 안 보인다.

빌드 게이트도 안전: `scripts/check-lesson-structure.mjs`는
`src/content/lessons/step-1/2/3`만 순회하고, `scripts/check-manifest.mjs`는
`.velite/lessons.json`만 읽는다. 새 폴더는 자유 형식이어도 걸리지 않는다.
(`scripts/check-brand.mjs`는 전역 스캔이므로 KANT 금지는 새 콘텐츠에도 적용 — 준수.)

## 콘텐츠 모델

새 Velite 컬렉션 `concepts`, 패턴 `src/content/concepts/**/*.mdx`.

Frontmatter (레슨의 stepId/moduleId/depth/estimatedMinutes 는 **넣지 않는다** —
그것들은 일정 입력값이다):

```
title: string          # 개념 제목
order: number          # 번외 내 순서 (1..N)
slug: slug("concepts") # /concepts/[slug]
summary: string        # 인덱스 카드용 한 줄 요약(훅)
icon: string           # 이모지 (카드/헤더 표시)
```

transform 산출:
- `permalink: /concepts/${slug}`
- `readingMinutes` — `velite.config.ts`의 `estimateBookMinutes`와 같은 방식으로
  본문 글자 수 기반 대략 읽기 시간 (SVG·코드펜스·태그 제거 후 분당 500자, 최소 1분)

본문은 **자유 형식** — 레슨의 6단 게이트/용어표/자가진단 파서를 타지 않는다.

## 라우트 & 화면

- `/concepts` — 개념 카드 그리드(이모지·제목·요약·읽기시간). 완전 정적.
  진도 프로바이더·쿠키 없음(`/glossary`와 같은 정적 셸).
- `/concepts/[slug]` — 개념 리더. `MDXContent`로 컴파일된 MDX 렌더.
  `generateStaticParams`로 정적 생성. 하단에 이전/다음 개념 이동 링크(번외 순서 내).

## 내비게이션

`src/components/site-nav.tsx`의 `NAV_ITEMS`에 단독 대메뉴 1개 추가:
`{ label: "AI 뜯어보기", href: "/concepts" }`. 데스크톱 행·모바일 아코디언 양쪽이
같은 `NAV_ITEMS`를 쓰므로 한 곳만 고치면 된다. `isActiveHref`가 `startsWith`라
`/concepts/[slug]`에서도 활성 표시된다.

## 시각화 (핵심 자산)

인터랙티브 시각화 컴포넌트는 **클라이언트 컴포넌트**로 만들어, 레슨/소개와
격리한다. `MDXContent`는 이미 `components?` prop을 받으므로, 개념 리더는
`<MDXContent code={...} components={conceptComponents} />`로 **번외 전용 컴포넌트
맵**을 주입한다 — `mdx-content.tsx`의 `defaultComponents`(모든 레슨에 로드)를
건드리지 않아, 무거운 시각화가 레슨 페이지 번들에 새지 않는다.

기술: **기본은 순수 React + SVG/CSS**, 부드러운 전환·제스처 애니는 **`motion`**
(framer-motion 후신, React 19 지원) 하나만 허용 (사용자 결정 2026-09-07).
`motion/react`에서 import. 접근성: `prefers-reduced-motion` 존중,
자동재생보다 사용자가 스텝을 넘기는 상호작용 우선. 아이패드 터치 타깃 44px+.

개념별 시각화 아이디어(파일럿 확정 후 확장):
- 토큰: 글 입력 → 토큰 조각으로 실시간 분해(칩 색칠)
- 임베딩: 단어를 2D "의미 지도" 위 점으로, 가까운 뜻끼리 모임
- 어텐션: 한 단어가 문장의 어디를 보는지 연결선 하이라이트
- 다음 단어/온도: 온도 슬라이더로 확률 막대 분포가 뾰족↔평평
- 컨텍스트 윈도우: 긴 대화 위를 미끄러지는 창, 넘치면 앞이 밀려남
- RAG: 질문 → 검색 → 근거 삽입 → 답변 흐름 스텝
- 에이전트/하네스(**파일럿**): 사용자→모델 생각→도구 호출→관찰→반복 루프 스테퍼

## 컴포넌트 재사용 / 신규

재사용: `MDXContent`(components 주입), `TwistBox`, `NextTeaser`, `CodeBlock`(pre 매핑),
SVG 다이어그램 스타일(`--diagram-*`), 카드 스타일(`.panel`/`.chip`, `step-card` 참고).

미사용(레슨 전용 학습 장치): `LessonPresenter`, `PredictPrompt`, `RunPython`,
`RunSQL`, `complete-button`, `progress-provider`, 복습/게이트.

신규:
- Velite `concepts` 컬렉션 (`velite.config.ts`)
- `src/app/concepts/page.tsx` (인덱스)
- `src/app/concepts/[slug]/page.tsx` (리더) — 번외 전용 컴포넌트 맵 주입
- `src/components/concepts/` — 인터랙티브 시각화 컴포넌트 모음 + 번외 컴포넌트 맵
- 개념 카드 컴포넌트(또는 인덱스 페이지 인라인) + 이전/다음 링크
- 내비 항목 1줄
- 의존성 추가: `motion` (애니메이션 한정)

## 개념 라인업 (10편, 토큰→하네스 한 줄기)

| # | slug | 제목 | 한 줄 |
|---|------|------|-------|
| 1 | tokens | 🔤 토큰 | AI는 글자가 아니라 조각으로 읽는다 |
| 2 | embeddings | 🧭 임베딩 | 뜻을 좌표로 바꾼다 — 의미의 지도 |
| 3 | attention | 👀 어텐션 | 문장에서 어디를 볼지 고르는 법 |
| 4 | next-token | 🎲 다음 단어 맞히기 | 확률·온도로 답이 매번 달라지는 이유 |
| 5 | weights | 🧠 가중치 | "학습했다"는 게 실제로 저장한 것 |
| 6 | training-stages | 📚 사전학습·파인튜닝·RLHF | 똑똑해지고 말을 잘 듣게 되는 3단계 |
| 7 | context-window | 🪟 컨텍스트 윈도우 | AI의 작업 기억과 그 한계 |
| 8 | rag | 🔎 임베딩 검색과 RAG | AI에게 참고서를 쥐여주기 |
| 9 | agent-harness | 🤖 에이전트와 하네스 | 도구를 쥔 AI가 스스로 도는 루프 (**파일럿**) |
| 10 | hallucination | 🌫️ 환각 | 왜 구조적으로 생기나, 무엇을 검증하나 |

## 진행 순서 (파일럿 우선)

1. **인프라 + 파일럿 1편**: `concepts` 컬렉션 + 두 라우트 + 내비 + 9번
   "에이전트와 하네스" 1편 완성.
2. 아이패드 크기 브라우저 확인 → push 배포 후 실기기 확인 → 승인.
3. 나머지 9편 저술(스타일 확정 후 병렬 가능).

## 검증

- `velite build` 통과(새 컬렉션 컴파일, `readingMinutes` 산출).
- `/concepts`·`/concepts/[slug]` 아이패드 폭에서 렌더·터치·다크모드 확인.
- 진행률·일정표·`/review`·`/glossary` **불변** 확인(번외가 어디에도 안 잡힘).
- KANT 미언급 확인(`check-brand.mjs`).
- push 배포 후 아이패드 실기기 확인.
