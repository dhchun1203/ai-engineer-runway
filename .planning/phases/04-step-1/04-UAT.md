---
status: testing
phase: 04-step-1
source: [04-VERIFICATION.md]
started: 2026-08-25T04:51:48Z
updated: 2026-08-25T04:51:48Z
---

## Current Test

number: 1
name: SQL 레슨 2편의 SQL 블록을 Supabase SQL 에디터에서 실제로 실행
expected: |
  모든 블록이 에러 없이 실행되고, 본문이 설명한 결과(행 수, 에러 메시지 등)와
  실제 출력이 일치한다.
awaiting: user response

## Tests

### 1. SQL 레슨 2편의 SQL 블록 라이브 실행

**왜 사람이 해야 하나:** 04-05 실행자도, 04-07 종단 게이트도, 검증자도 전부
Supabase SQL 에디터 접근이 없는 격리 환경에서 돌았다. 세 번 모두 문법·의미론 검토로만
확인했고 아무도 실제로 실행하지 못했다. Phase 4의 성공 기준 3번은 예제가
"실행 가능한" 것을 요구하므로, 이 항목은 추론으로 대체할 수 없다.

**할 일:**

1. Supabase 대시보드(https://supabase.com/dashboard) → 이 프로젝트 → 왼쪽 메뉴 **SQL Editor**
2. 프로덕션에서 레슨을 연다:
   `https://ai-engineer-runway.vercel.app/lesson/1-4-relational-db-basics`
3. 본문의 SQL 블록을 **위에서부터 순서대로** 복사(코드 블록 우상단 복사 버튼)해 붙여넣고 실행한다.
   순서가 중요하다 — 앞 블록이 만든 테이블에 뒤 블록이 의존한다.
4. 특히 확인할 블록: **외래키 위반을 일부러 일으키는 `INSERT`**
   (`INSERT INTO practice.enrollments (student_id, subject_id) VALUES (999, 1);`)
   — 본문은 이게 **에러가 나는 것이 정상**이라고 설명한다. 실제로 에러가 나야 하고,
   에러 메시지가 본문 설명과 맞아야 한다.
5. 이어서 `https://ai-engineer-runway.vercel.app/lesson/1-4-sql-queries-and-joins` 를 같은 방식으로 실행한다.
   JOIN 결과의 **행 수**가 본문이 말한 숫자와 맞는지 확인한다.
6. 끝나면 연습용 스키마를 지운다: `DROP SCHEMA practice CASCADE;`
   (모든 예제가 `practice.` 스키마 안에만 있으므로 진도 데이터에는 영향이 없다 — grep으로 확인됨)

expected: 각 블록이 설명대로 동작한다. 실패하는 블록이 있으면 그 블록의 SQL과 에러 메시지를 적어 주세요.
result: [pending]

### 2. 아직 사람이 안 본 5편 훑어보기

**왜 사람이 해야 하나:** `check-lesson-structure.mjs`는 구조(헤딩·개수·`<details>` 짝·표 행수)만
검사하고 시각적 렌더 결과는 검사하지 않는다. 파일럿의 두 렌더 결함은 모든 자동 게이트를
통과하고도 사람이 프로덕션 화면을 보고서야 잡혔다.

**이미 기계로 배제된 것 (다시 찾지 않아도 됨):**

- 코드 블록 배경 불일치 → 10편 전부 `<pre>`가 `data-theme`을 갖고 있어 파일럿과 같은
  배경 규칙을 적용받는다 (누락 0건)
- `<details>` 안 마크다운이 raw 텍스트로 새는 문제 → 10편 전부 누출 0건
- 1줄 코드 블록의 빈 공간 → 프로덕션 실측 완료 (높이 56px, 위아래 여백 16px 대칭, 버튼 44×44 내부)
- 검증자가 4편(`1-1-dev-environment-setup`, `1-2-git-branch-and-pr`,
  `1-4-relational-db-basics`, `1-5-ml-model-types`)을 스크린샷으로 확인, 결함 0건

**그래서 남은 건 결함 사냥이 아니라 "읽을 만한가" 판단이다.** 아래 5편을 아이패드에서 훑어봐 주세요:

1. https://ai-engineer-runway.vercel.app/lesson/1-1-course-orientation
2. https://ai-engineer-runway.vercel.app/lesson/1-2-generative-ai-basics
3. https://ai-engineer-runway.vercel.app/lesson/1-3-python-functions-and-io
4. https://ai-engineer-runway.vercel.app/lesson/1-4-sql-queries-and-joins
5. https://ai-engineer-runway.vercel.app/lesson/1-5-ml-metrics-and-pipeline

각 레슨에서:
- 사전지식 없이 읽히는가 (파일럿과 같은 톤인가)
- "정답 보기"를 손가락으로 한 번에 펼칠 수 있는가
- 가로 모드·다크 모드에서 안 깨지는가

expected: 파일럿에서 승인한 것과 같은 수준으로 읽히고, 새로운 시각 결함이 없다.
result: [pending]

## Summary

total: 2
passed: 0
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps
