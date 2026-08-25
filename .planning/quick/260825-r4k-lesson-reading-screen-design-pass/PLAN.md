---
task_id: 260825-r4k
description: 코드블록 복사 버튼이 모든 레슨에서 동작하지 않는 [Critical] 결함 수정 (04-UI-REVIEW Priority Fix 1)
mode: quick
created: 2026-08-25
---

# 복사 버튼 수정

## 범위 결정 기록

이 태스크는 원래 "레슨 읽기 화면 frontend-design 패스"로 열렸으나, 착수 직전에 범위를 축소했다.

**축소 이유:** ROADMAP **Phase 6 (전체 페이지 디자인 정리)** 가 이미 목표 문장에서
`frontend-design` 스킬을 명시적으로 지목하고 있다. 그리고 이 화면의 디자인은 `globals.css` +
셸이라 **나중에 고쳐도 이미 작성된 레슨 전부에 소급 적용된다** — "Phase 5의 25편이 개선된
읽기 화면을 물려받으려면 먼저 해야 한다"는 당초 근거는 성립하지 않았다. 디자인 결정 8건은
`.planning/phases/06-site-wide-design-polish/06-DESIGN-INPUT.md`로 이관했다.

**남긴 이유:** 복사 버튼은 디자인이 아니라 **기능 버그**이고, 소급 적용이 안 되는 종류의
비용(= 고칠 때까지 매일의 학습 마찰)이 발생한다. 사전학습 시작일이 2026-08-25(오늘)이고
레슨 대부분이 "이 코드를 Supabase SQL 에디터에 붙여넣으세요" 구조다.

## 결함

`velite.config.ts:8`의 `transformerCopyButton`이 인라인 `onclick`을 **문자열로** 내보낸다.
Velite가 컴파일한 MDX는 React 엘리먼트로 렌더되므로 React가 문자열 핸들러를 거부한다.

측정(직접 확인):
- `.velite/lessons.json`에 `onClick:"navigator.clipboard.writeText(...)"` **44곳**
- `rehype-pretty-copy` 클래스 126곳
- 콘솔: 코드블록당 에러 1개 (`1-4-sql-queries-and-joins`에서 9개)
- 클릭 시 클립보드에 아무것도 쓰이지 않고 `rehype-pretty-copied` 클래스도 안 붙음
- `.velite/pages.json`(=/about)은 0곳 — 레슨 화면 전용 결함

## 작업

- [ ] T1 `velite.config.ts` — `transformerCopyButton` 제거
- [ ] T2 `src/components/code-block.tsx` 신규 — 실제 React 클라이언트 복사 버튼
- [ ] T3 `src/components/mdx-content.tsx` — 기본 컴포넌트 맵에 `pre: CodeBlock` 주입
      (두 호출 지점 `/lesson`, `/about`을 각각 고치지 않도록 한 곳에서 처리)
- [ ] T4 `src/app/globals.css` — 죽은 `.rehype-pretty-copy` 규칙 쌍 제거, 새 버튼 규칙으로 교체
- [ ] T5 `package.json` — 미사용이 된 `@rehype-pretty/transformers` 제거

## 함께 고치는 잠재 결함

버튼이 `overflow-x: auto`인 `<pre>` **안에** 절대 위치로 떠 있었다 — 긴 코드를 가로
스크롤하면 버튼이 같이 밀려 나간다. 새 구조는 `position: relative` 래퍼에 버튼을 두고
`<pre>`만 스크롤시켜 이 문제도 함께 없앤다.

## 지키는 계약 (회귀 금지)

- 터치 타깃 44×44 유지 (UX-01, 아이패드)
- hover 없이 항상 보임 (기존 `visibility: "always"`와 동등) — 아이패드에 hover가 없다
- `<pre>` 우측 padding 3.5rem 유지 — 코드 첫 줄이 버튼 아래로 안 밀림 (G-04-2 재발 금지)
- `min-height: 3.25rem` 유지 — 한 줄 코드블록에서 버튼이 넘치지 않음
- 가로 스크롤 유지

## 검증

- `.velite/lessons.json`에 `onClick:"` 문자열 0곳
- `npm run build` 통과
- 라이브: 콘솔 에러 0, 클릭 시 클립보드에 코드가 실제로 쓰임, 44×44 유지
