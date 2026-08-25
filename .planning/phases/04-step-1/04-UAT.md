---
status: diagnosed
phase: 04-step-1
source: [04-VERIFICATION.md]
started: 2026-08-25T04:51:48Z
updated: 2026-08-25T07:28:06Z
---

## Current Test

[testing complete]

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
result: issue
source: automated (Supabase MCP — execute_sql, project wxqteqiuihrgtxmztauc)
reported: "블록 자체는 16개 전부 본문대로 동작. 단, 1편 → 2편 순서로 이어서 실습하면 2편 준비 블록이 column \"score\" of relation \"enrollments\" does not exist 에러로 실패한다. 2편 본문은 오히려 '두 번 실행해도 안전합니다'라고 안심시킨다."
severity: major

**사람 대신 자동 실행됨.** 이 항목이 사람에게 넘겨진 이유는 오직 "격리 환경이라 Supabase에
접근할 수 없다"는 것이었다. 이번 세션에는 Supabase MCP가 붙어 있어 그 전제가 깨졌으므로,
본문 SQL 블록을 위에서부터 순서대로 실제 실행해 결과를 본문 주장과 대조했다.

1편 `1-4-relational-db-basics` — 7블록 전부 통과:

| 블록 | 본문 주장 | 실제 결과 |
|------|-----------|-----------|
| 스키마 + 3테이블 생성 | 성공 | 성공 |
| INSERT 3종 | 3 · 3 · 4행 | 일치 |
| SELECT students | 학생 3명 | 3행 |
| JOIN 조회 | "결과는 총 4행" | 정확히 4행 |
| classrooms 생성 | 성공 | 성공 |
| 홍길동 추가 | "id는 자동으로 4" | id=4, 4번째 줄 |
| FK 위반 INSERT | `insert or update on table "enrollments" violates foreign key constraint` | **글자 그대로 일치** (23503, `enrollments_student_id_fkey`) |

2편 `1-4-sql-queries-and-joins` — 9블록 전부 통과 (깨끗한 상태 기준):

| 블록 | 본문 주장 | 실제 결과 |
|------|-----------|-----------|
| 준비 블록 | 성공 | 성공 |
| WHERE + ORDER BY | "박서연(3학년), 김지현(2학년) 순 2행" | 정확히 일치 |
| INNER JOIN | "5행" | 5행 |
| LEFT JOIN 비교 | "행 수가 같습니다" | 5행 (동일) |
| GROUP BY + HAVING | "3행" | 3행 — 김지현 91.5 / 박서연 75.5 / 이민준 72 |
| 서브쿼리 (전체 평균) | 전체 평균 초과만 | 81.2 초과 → 95 · 91 · 88 3행 |
| 해보기1 LEFT JOIN | "그대로 5행" | 5행 |
| 해보기2 과목별 집계 | "세 과목 한 줄씩" | 3행 |
| 해보기3 수학 서브쿼리 | "평균 약 73.3 → 88점만 남음" | 73.333…, 김지현 88점 1행 |
| DROP SCHEMA | 진도 데이터와 무관 | `practice` 잔여 0, `public.progress` 1행 그대로 |

**찾은 결함 → Gaps G-04-1.** 1편을 하고 정리 SQL을 건너뛴 채 2편으로 넘어가면 2편 준비 블록이
실패한다. 1편이 만든 `practice.enrollments`에는 `score` 열이 없는데 2편의
`CREATE TABLE IF NOT EXISTS`가 기존 표를 그대로 두고 지나가기 때문이다.
실제 에러: `ERROR: 42703: column "score" of relation "enrollments" does not exist`

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

**기계로 확인 가능한 부분은 자동 실행됨 (Playwright, 아이패드 뷰포트 820×1180 세로 / 1180×820 가로):**

5편 전부 아래 항목 통과:

| 검사 | 결과 |
|------|------|
| 페이지 가로 넘침 (세로·가로 모드) | 5편 모두 0px |
| 본문 요소가 뷰포트 밖으로 삐져나옴 | 0건 |
| `<pre>`의 `data-theme` 누락 | 0건 (총 34블록) |
| `<pre>` 가로 스크롤 미설정 | 0건 |
| `<details>` 안 raw 마크다운 누출 | 0건 |
| `<summary>` 터치 높이 < 44px | 0건 |
| `<details>` 전부 펼친 상태에서 넘침 | 0px |
| 콘솔 에러 | 0건 |
| 브랜딩 하드룰 ("KANT") 노출 | 0건 |
| 다크모드 대비 — 본문 12.72:1 / 제목 18.72:1 / 표 18.72:1 / 코드 7.60:1 / summary 10.06:1 | 전부 WCAG AA(4.5:1) 통과 |

**자동 검사에서 새로 잡힌 시각 결함 1건 → Gaps G-04-2.** 코드 블록의 복사 버튼(44×44,
`position: absolute`, 항상 표시)이 첫 줄 텍스트를 덮는다. Step 1 전체 34개 코드 블록 중
`1-4-sql-queries-and-joins`의 첫 블록 하나가 해당된다 (첫 줄 폭 714px > 버튼 앞 여유 655px,
59px 가림). 세로·가로 모드 모두 동일. 코드 블록에 가로 스크롤이 있어 내용에 도달은 가능하다.
증거: `.planning/ui-reviews/04-uat/copy-button-overlap-portrait-light.png`

**남은 것은 사람 판단뿐이다** — 아래 5편을 아이패드에서 훑어보고, 파일럿과 같은 수준으로
읽히는지만 봐 주세요. 결함 사냥은 위에서 끝났습니다.

expected: 파일럿에서 승인한 것과 같은 수준으로 읽히고, 새로운 시각 결함이 없다.
result: pass
reported: "네"
automated_subchecks: pass (시각·구조·접근성 10항목, 5편 전부)
note: 사람 판단(읽힘·톤) 통과. 같은 훑어보기 중 자동 검사가 잡은 복사 버튼 겹침은 G-04-2로 별도 추적.

## Summary

total: 2
passed: 1
issues: 1
pending: 0
skipped: 0
blocked: 0
gaps_open: 2   # G-04-1 (major, 테스트 1), G-04-2 (cosmetic, 테스트 2 자동 검사)

## Gaps

- gap_id: G-04-1
  truth: "SQL 레슨 두 편의 모든 SQL 블록이 본문 설명대로 실행된다 — 레슨을 순서대로 따라가는 학습자 기준"
  status: failed
  reason: |
    자동 실행으로 확인. 1편(1-4-relational-db-basics)의 마지막 정리 블록
    'DROP SCHEMA IF EXISTS practice CASCADE;'는 본문 170행에서 "실습이 끝나면 ... 치워둡니다"라는
    권유 톤으로만 제시된다. 이를 건너뛰고 2편(1-4-sql-queries-and-joins)의 준비 블록을 실행하면
    'ERROR: 42703: column "score" of relation "enrollments" does not exist'로 실패한다.
    1편이 만든 practice.enrollments에 score 열이 없는데 2편의 CREATE TABLE IF NOT EXISTS가
    기존 표를 건드리지 않고 넘어가기 때문. 2편 본문 52행은 오히려
    "IF NOT EXISTS를 쓰기 때문에 두 번 실행해도 안전합니다"라고 안심시켜
    학습자가 원인을 짐작할 단서조차 없다.
  severity: major
  test: 1
  root_cause: |
    2편 준비 블록의 practice.enrollments는 score 열을 포함하지만 CREATE TABLE IF NOT EXISTS로
    선언돼 있다. 1편이 이미 score 없는 동명 표를 만들어 둔 상태면 이 문장이 아무 일도 하지 않고
    지나가고, 바로 뒤 INSERT가 없는 열을 참조해 42703으로 실패한다.
    IF NOT EXISTS는 "표 이름"만 보고 "표 모양"은 보지 않는다 — 본문 52행의
    "두 번 실행해도 안전합니다"는 이 차이를 놓친 서술이다.
    Supabase MCP로 실제 재현 확인함 (1편 7블록 실행 → 2편 준비 블록 실행 → 42703).
  artifacts:
    - path: "src/content/lessons/step-1/1-4-sql-queries-and-joins.mdx"
      issue: "52행 '두 번 실행해도 안전합니다' — 1편 잔여 스키마가 있으면 거짓. 준비 블록이 기존 enrollments의 score 열 부재를 처리하지 않음"
    - path: "src/content/lessons/step-1/1-4-relational-db-basics.mdx"
      issue: "170행 정리 SQL이 권유 톤 — 2편으로 넘어가기 전 필수 단계임이 드러나지 않음"
  missing:
    - "2편 준비 블록이 1편 잔여 스키마와 충돌하지 않게 만들기 (준비 블록 첫 줄에 DROP SCHEMA IF EXISTS practice CASCADE; 를 두고 이유를 한 줄로 설명하는 방식 등)"
    - "또는 1편 정리 SQL을 '다음 레슨으로 가기 전에 반드시 실행'으로 격상"
    - "2편 52행 '두 번 실행해도 안전합니다' 문장을 실제 동작에 맞게 수정"
  debug_session: ""

- gap_id: G-04-2
  truth: "레슨 코드 블록의 코드가 가려지지 않고 전부 보인다"
  status: failed
  reason: |
    Playwright 자동 검사로 발견. 코드 블록 우상단 복사 버튼(44×44, position: absolute,
    opacity 1로 항상 표시)이 코드 첫 줄 위에 겹친다. 첫 줄이 버튼 앞 여유 폭(655px)보다
    길면 그만큼 글자가 가려진다.
    Step 1 전체 34개 코드 블록 중 1건 해당:
    1-4-sql-queries-and-joins 첫 블록 — 첫 줄 폭 714px, 59px(약 44px 가시 영역) 가려짐.
    가려지는 내용: "-- Supabase 대시보드 → SQL 에디터에서 실행합니다. 앞 레슨을 안 했어도
    이 블록 하나로 준비가 [끝납니]다." 의 끝부분.
    아이패드 세로(820×1180)·가로(1180×820) 양쪽 동일. 코드 블록에 가로 스크롤이 있어
    내용 도달은 가능하므로 치명적이지는 않다.
    파일럿이 잡아낸 것과 같은 계열의 결함 — 모든 구조 게이트(check-lesson-structure.mjs 포함)를
    통과하고도 화면에서만 드러난다.
  severity: cosmetic
  test: 2
  root_cause: |
    rehype-pretty-code의 복사 버튼이 pre 안에 position: absolute + opacity 1로 항상 떠 있는데,
    코드 첫 줄에는 버튼 폭만큼의 우측 여유가 확보돼 있지 않다. 그래서 첫 줄 길이가
    "버튼 왼쪽 모서리까지의 거리"(측정값 655px)를 넘는 순간 그만큼 글자가 버튼 밑으로 들어간다.
    첫 줄에만 생기는 문제라 블록 대부분은 무사하고, Step 1의 34개 블록 중 1개만 걸린다.
    구조 검사(check-lesson-structure.mjs)는 렌더 좌표를 보지 않으므로 이 계열은 원리상 못 잡는다.
  artifacts:
    - path: "src/content/lessons/step-1/1-4-sql-queries-and-joins.mdx"
      issue: "첫 SQL 블록의 첫 줄 주석이 655px를 넘김 — 복사 버튼에 가림"
    - path: "src/app/globals.css"
      issue: "복사 버튼이 코드 위에 겹치는 구조 (.prose pre button.rehype-pretty-copy) — 첫 줄 우측 패딩 확보 없음"
  missing:
    - "즉시 수정: 해당 주석을 두 줄로 나누거나 버튼 앞 여유 폭 안으로 줄이기"
    - "근본 수정(Phase 06 site-wide-design-polish 후보): 코드 블록 첫 줄에 버튼 폭만큼 우측 패딩을 주거나, 버튼을 hover/focus 시에만 표시"
  evidence: ".planning/ui-reviews/04-uat/copy-button-overlap-portrait-light.png"
  debug_session: ""
