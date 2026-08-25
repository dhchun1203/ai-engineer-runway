---
task_id: 260825-r4k
status: complete
date: 2026-08-25
commit: 920741e
---

# 요약 — 코드블록 복사 버튼 수정

## 무엇을 했나

`velite.config.ts`의 `transformerCopyButton`을 제거하고, `<pre>`를 감싸는 실제 React
클라이언트 컴포넌트(`src/components/code-block.tsx`)로 교체했다.

원인: 트랜스포머가 인라인 `onclick`을 **문자열**로 내보내는데, Velite가 컴파일한 MDX는
React 엘리먼트로 렌더되므로 React가 문자열 핸들러를 거부하고 내부 noop을 붙였다.
버튼은 멀쩡해 보였지만 클립보드에 아무것도 쓰지 않았다.

주입 지점을 `mdx-content.tsx`의 기본 컴포넌트 맵에 뒀다 — 호출부(`/lesson`, `/about`)를
각각 고치면 한쪽을 빠뜨리기 쉽기 때문이다.

## 함께 고친 잠재 결함

버튼이 `overflow-x: auto`인 `<pre>` **안에** 절대 위치로 있었다 → 긴 코드를 가로
스크롤하면 버튼이 같이 밀려 나갔다. `position: relative` 래퍼로 옮겨 해결.
(현재 레슨에는 가로 오버플로가 나는 블록이 없어 드러나지 않던 결함이다 — 2111px
스크롤을 강제해 재현·검증했다.)

## 측정 결과 (프로덕션 빌드, iPad 세로 768×1024)

| 항목 | 이전 | 이후 |
|---|---|---|
| `.velite/lessons.json`의 문자열 `onClick` 핸들러 | 44 | **0** |
| 콘솔 에러 (`1-4-sql-queries-and-joins`) | 9 | **0** |
| `writeText` 호출 / resolve | 호출 안 됨 | **1회 / `ok`** |
| 복사된 내용 | 없음 | **SQL 39줄 전량** (head·tail 대조 확인) |
| 상태 전환 | 없음 | **`idle → copied → idle`** (2초 피드백) |
| 가로 2111px 스크롤 시 버튼 이동 | (해당 없음) | **0px** |

유지된 계약: 터치 타깃 44×44 · `pre` 우측 padding 56px(3.5rem) · `min-height` 52px ·
`overflow-x: auto` · 페이지 가로 오버플로 0 · hover 없이 항상 보임.
접근성 추가: 한국어 `aria-label`, `role="status"` 라이브 리전, 성공/실패 색 구분
(accent / destructive 기존 토큰 재사용, 새 색 없음).

## 게이트

`check-brand` · `check-lesson-structure` · `check-manifest` · `check-pace` ·
`check-progress-gates` · `check-progress-math` · `check-schedule` — **7/7 통과**
`npm run build` 통과, `eslint` 통과, 6개 라우트 200.

**미실행:** `check-supabase-progress`, `e2e-progress`, `e2e-today` — 실제 Supabase 자격증명이
필요하고 이 변경과 무관하다. ROADMAP SC4는 여전히 미검증 상태로 남는다(04-UI-REVIEW와 동일).

## 범위 축소 기록

이 태스크는 "레슨 읽기 화면 frontend-design 패스"로 열렸다가 착수 직전 축소됐다.
ROADMAP **Phase 6**이 이미 `frontend-design`을 지목하고 있고, 이 화면의 디자인은
CSS라서 나중에 고쳐도 작성된 레슨 전부에 소급 적용된다 — "Phase 5가 물려받으려면
먼저 해야 한다"는 당초 근거가 성립하지 않았다.

설계해둔 디자인 결정 8건은 폐기하지 않고
`.planning/phases/06-site-wide-design-polish/06-DESIGN-INPUT.md`로 이관했다.

## 남은 것 (이 태스크 범위 밖)

- 04-UI-REVIEW의 나머지 결함(인라인 코드 리터럴 백틱 58곳, `prose` 타입 스케일 이탈,
  페이저 이중 글리프, 표 가로 스크롤 래퍼, `<main>` 랜드마크, 잠금 상태 문구) → **Phase 6**
- 측정 중 발견: 내비 `일정표`(36px)·`소개`(24px)와 브레드크럼 `Step 1`(39px)의 **가로 폭이
  44px 미만**이다(높이는 44px). 04-UI-REVIEW는 이를 0건으로 봤는데 한 축만 검사한
  것으로 보인다. 이 변경과 무관한 내비 셸 문제 → **Phase 6**
- 실기기 iPad Safari 확인 — 지금까지 측정은 전부 Playwright Chromium.
  `navigator.clipboard`는 Safari에서 사용자 제스처 규칙이 더 엄격하다(제스처 안에서
  곧바로 호출하도록 구현해뒀으나 실기기 확인은 아직)
