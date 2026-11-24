# 수업 복습 레슨 훑기 형태 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 수업 복습 21편의 본문을 "핵심은 펼치고 나머지는 자세히 보기로 접는" 형태로 바꿔, 펼친 분량을 1/5 정도로 줄인다.

**Architecture:** 본문 MDX(`src/content/class-lessons/*/index.mdx`)만 고친다. 접기는 기존 `.prose details` 스타일을 쓰는 `<details><summary>자세히 보기</summary>` 원시 HTML. 원래 코드 블록과 그림이 하나도 사라지지 않았는지, 펼친 분량이 얼마인지 검사 스크립트로 잰다.

**Tech Stack:** MDX(Velite), Node 스크립트(의존성 없음).

**Spec:** `docs/superpowers/specs/2026-11-24-class-lessons-skim-design.md`

## Global Constraints

- 퀴즈, 명령어, 용어 `review.yml`은 손대지 않는다. 퀴즈 id 불변.
- 절(h2)은 회차당 5~8개, 접힌 칸 안에 h2 금지(소제목은 `###`).
- 절마다 접힌 칸은 최대 하나, summary 글자는 `자세히 보기`.
- `## 오늘 꼭 기억할 주의점`은 펼친 채 유지.
- 가운데점(·), 긴 하이픈(—), ─ 글리프, 이모지 금지. 한국어 2~3문장마다 문단.
- 원래 코드 블록, `<Figure>`, 시뮬레이터 태그는 하나도 지우지 않는다(펼친 쪽이든 접힌 쪽이든 어딘가에 남는다).
- 기준 원본: 커밋 `def1e86`(변환 직전).

## Review Focus

- 접힌 칸 안에 빈 줄 없이 마크다운을 쓰면 MDX가 코드 블록을 글자로 찍는다: `<summary>` 다음과 `</details>` 앞에 빈 줄을 둔다. 검사 스크립트의 렌더 확인(빌드 후 화면)에서 잡는다.
- 목차 막대 숫자(N/총)가 줄어든 h2 수와 맞는지: 화면 확인 단계에서 본다.
- 책갈피 위치: h2 제목이 바뀌면 순서 폴백으로 비슷한 자리로 간다(받아들임).
- 인쇄: print-mode.tsx가 접힌 칸을 자동으로 펼친다(기존 동작, 확인만).

---

### Task 1: 검사 스크립트

**Files:**
- Create: `scripts/check-class-skim.mjs`

**Interfaces:**
- Produces: `node scripts/check-class-skim.mjs [slug...] [--base def1e86]` 출력 한 줄씩 `slug 원본자수 → 펼친자수 (비율%) h2=N details=M 빠진코드=K 빠진그림=J`, 문제(빠진 블록, details 안 h2, 절당 details 2개 이상)가 있으면 exit 1.

- [ ] Step 1: 스크립트 작성. 원본은 `git show <base>:<path>`. 코드 블록은 펜스 안 내용을 공백 정규화해 비교, 그림은 `<Figure label="...">`의 label과 시뮬레이터 태그 이름(`<[A-Z][A-Za-z]+Simulator|Chart|Histogram|Toggle|Playground|Explorer|Checker`)으로 비교. 펼친 자수는 `<details>...</details>`와 frontmatter를 뺀 글자 수.
- [ ] Step 2: 아직 안 바꾼 21회차에 돌려 비율 100%, 빠짐 0, exit 0인지 확인.

### Task 2: 21회차 파일럿

**Files:**
- Modify: `src/content/class-lessons/21-titanic-eda-missing-values/index.mdx`

- [ ] Step 1: 형태대로 다시 쓰기(절 14개 → 6~7개로 묶기).
- [ ] Step 2: `node scripts/check-class-skim.mjs 21-titanic-eda-missing-values` 빠짐 0, 비율 30% 이하.
- [ ] Step 3: `npx velite build`, `node scripts/check-class.mjs`, 금지 글리프 0.
- [ ] Step 4: dev 서버로 아이패드 크기 화면 확인(접힘 렌더, 코드 블록 정상, 목차 막대 숫자, 가로 넘침 0).
- [ ] Step 5: 커밋, push, 배포 Ready. 사용자에게 아이패드 확인 요청 후 승인 대기.

### Task 3: 나머지 20편 (승인 후, 병렬)

- [ ] Step 1: 회차 묶음마다 서브에이전트 하나(파일 겹침 없음). 각자 Task 2의 Step 1~3을 맡은 회차에 수행.
- [ ] Step 2: 돌아온 결과를 `check-class-skim.mjs`(전체)로 다시 재고, 화면은 대표 몇 편을 확인.
- [ ] Step 3: `.claude/skills/class-lesson/SKILL.md` 3절(본문)을 훑기 형태로 고친다.
- [ ] Step 4: `npx next build`, 커밋, push, 배포 Ready.
