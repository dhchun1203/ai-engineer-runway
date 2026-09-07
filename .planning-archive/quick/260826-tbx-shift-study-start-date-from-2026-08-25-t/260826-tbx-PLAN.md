---
task_id: 260826-tbx
description: 학습 시작일을 2026-08-28로 옮기고 35개 레슨을 8/28~9/28(32일, 토요일 3일만 2레슨)에 배정한다
mode: quick
created: 2026-08-26
phase: quick-260826-tbx
plan: 01
type: execute
wave: 1
depends_on: []
autonomous: true
requirements: [SCHED-01, SCHED-02]
files_modified:
  - src/lib/schedule.ts
  - src/lib/schedule-data.ts
  - src/app/page.tsx
  - src/app/schedule/page.tsx
  - src/components/schedule-table.tsx
  - src/components/today-lesson-card.tsx
  - scripts/check-schedule.mjs
  - scripts/check-pace.mjs
  - scripts/e2e-today.mjs
  - .planning/REQUIREMENTS.md

estimate:
  tokens: 90000
  raw_tokens: 45000
  tasks: 3
  confidence: low

must_haves:
  truths:
    - "일정의 첫 레슨이 2026-08-28에, 35번째(마지막) 레슨이 2026-09-28에 배정된다."
    - "2026-09-29는 레슨이 없는 복습·버퍼일로 남는다."
    - "35개 레슨 전부가 정확히 한 번씩 배정된다 — 누락도 중복도 없다."
    - "2026-08-29 · 2026-09-05 · 2026-09-12 정확히 세 날짜만 레슨 2개를 갖고, 나머지 29일은 1개씩이다."
    - "2026-08-28 이전 날짜와 2026-09-29 이후 날짜는 일정에 존재하지 않는다."
    - "/schedule이 33개 날짜·36개 행을 렌더하고 React 중복 key 경고를 내지 않는다."
    - "레슨 2개인 날의 홈 '오늘의 학습'이 두 레슨을 모두 보여주고, '내일'은 다음 날짜의 첫 레슨을 가리킨다."
    - "이미 Supabase에 기록된 완료 레슨은 날짜 재배정 후에도 그대로 완료로 집계된다."
  artifacts:
    - src/lib/schedule.ts (SCHEDULE_START, DOUBLE_LESSON_DATES, scheduleTotalDays, buildSchedule, rowsForDate, firstRowAfter)
    - scripts/check-schedule.mjs (새 불변식 케이스)
    - scripts/e2e-today.mjs (s6/s7 시나리오 + 상수 중복 제거)
    - scripts/check-pace.mjs (중복 날짜 케이스)
  key_links:
    - "schedule.ts의 SCHEDULE_START/DOUBLE_LESSON_DATES → schedule-data.ts → /와 /schedule (단일 진입점 유지)"
    - "e2e-today.mjs가 SCHEDULE_START/DOUBLE_LESSON_DATES를 재선언하지 않고 schedule.ts에서 로드 (상수 드리프트 차단)"
    - "schedule-table.tsx의 행 key와 오늘 행 앵커 id — 같은 날짜 2행이 만드는 유일성 붕괴 지점"
    - "page.tsx의 '오늘 행' 조회와 '내일 행' 조회 — 인덱스 +1 산술이 깨지는 지점"
---

<objective>
사전학습 시작일을 2026-08-25 → **2026-08-28**로 옮기고, 35개 레슨을 8/28~9/28 사이 32일에
배정한다. 토요일 **8/29 · 9/5 · 9/12** 세 날만 레슨 2개를 갖고, 9/29는 기존대로 복습·버퍼일로
남긴다.

Purpose: 시작일만 옮기면 마지막 레슨이 **2026-10-01**(개강일 9/30 이후)로 밀려 "개강 전 완주"
라는 프로젝트 핵심 가치가 깨진다. 8/28~9/29는 33일뿐이고 9/29를 버퍼로 남기면 학습일이 32일
이라, 35레슨을 담으려면 정확히 3일이 2레슨을 져야 한다. 그 3일을 토요일로, 그리고 앞쪽 2주에
몰아 두면 밀린 3일치가 초반에 청산되고 개강 직전 2.5주는 하루 1레슨의 평탄한 속도로 남는다.

Output: `schedule.ts`의 순수 계산 + 표현층의 "한 날짜 2행" 대응 + 이를 증명하는 게이트 케이스.
</objective>

<execution_context>
@$HOME/.claude/gsd-core/workflows/execute-plan.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
@src/lib/schedule.ts
@src/lib/schedule-data.ts
@src/lib/pace.ts
@src/components/schedule-table.tsx
@src/app/page.tsx
@src/app/schedule/page.tsx
@src/components/today-lesson-card.tsx
@scripts/check-schedule.mjs
@scripts/e2e-today.mjs
</context>

<design_decisions>
착수 전에 이미 조사해서 확정한 사항이다. 실행자는 이 결정을 뒤집지 말고 그대로 구현한다.

**DD-1. `ScheduleRow`는 레슨 1개당 1행을 유지하고, 두 행이 같은 `date`를 갖도록 허용한다.**
(대안이었던 `lessonSlug: string | null` → `lessonSlugs: string[]` 모델 변경은 채택하지 않는다.)

근거 — 코드를 직접 읽고 확인한 것:
- `pace.ts:37`의 `pastRows`는 `r.date < todayStr`로 **필터만** 하고 행마다 분을 더한다.
  "날짜당 1행"을 어디서도 전제하지 않으므로 중복 날짜에 대해 이미 올바르게 동작한다.
  (Task 3에서 이 주장을 게이트 케이스로 증명한다 — 읽어서 그럴 것 같다에 머물지 않는다.)
- `progress-store.ts`는 `lesson_id`(= 레슨 slug)만 키로 쓰고 날짜를 저장하지 않는다.
  따라서 날짜 재배정이 이미 저장된 완료 기록을 무효화할 수 없다.
- 총 행 수가 **36행 그대로**다(35레슨 + 버퍼 1). `e2e-today.mjs`의 s1/s2가 어설션하는
  `data-schedule-ui="row"` 36건이 수정 없이 유지된다.
- 파손 지점이 표현층 3곳(React key, 주차 묶기, 오늘 행 조회)으로 국한된다. 모델을 바꾸면
  `pace.ts`·`progress` 계열·게이트 2종까지 전부 열어야 한다.

**DD-2. 2레슨 날짜는 `schedule.ts`가 내보내는 상수로 표현하고, `buildSchedule`에 인자로 넘긴다.**
`export const DOUBLE_LESSON_DATES = ['2026-08-29', '2026-09-05', '2026-09-12'] as const`.

근거: 게이트가 "정확히 이 3일만 2레슨"이라는 불변식을 어설션할 수 있는 단일 출처가 생긴다.
이 상수는 **어느 날이 2레슨인지**만 말하고 **어느 레슨이 어느 날인지**는 말하지 않는다 —
배정은 여전히 `orderedSlugs` 순서에서만 파생된다(D-32/D-33의 "35개 날짜→레슨 매핑 하드코딩
금지"를 그대로 지킨다).

**DD-3. 홈의 "오늘 행/내일 행" 선택 로직은 `page.tsx` 안에 인라인으로 두지 않고
`schedule.ts`의 순수 함수(`rowsForDate`, `firstRowAfter`)로 올린다.**

근거: 오늘(2026-08-26)은 8/28 이전이라 2레슨 날의 홈 화면을 실제 요청으로 확인할 방법이 없다
(`todayInSeoul()`은 페이지에서 인자 없이 호출되어 주입이 불가능하다). 선택 로직을 순수 모듈로
올리면 `check-schedule.mjs`가 `'2026-08-29'`를 인자로 넣어 2레슨 날의 동작을 **오늘 결정적으로
증명**할 수 있다. 이 함수들은 import가 없으므로 `schedule.ts`의 의존성 0 성질을 깨지 않는다.

**DD-4. `e2e-today.mjs`의 `SCHEDULE_START` 재선언(33행)은 제거하고 `schedule.ts`에서 로드한다.**
알고리즘(`computeScheduleRows`)은 지금처럼 **독립 재구현으로 남긴다** — 같은 함수를 재사용하면
계산이 틀려도 검증이 같이 틀린다는 원래 이유가 유효하다. 상수만 단일 출처로 모은다.

근거: 이 저장소는 방금 같은 위험으로 실제 결함을 겪었다(Phase 6 gap G-06-9 — 테이프 높이
상수가 세 곳에 복제돼 드리프트). `check-schedule.mjs`가 이미 `pathToFileURL(...schedule.ts)`
동적 import로 순수 TS 모듈을 로드하고 있고(Node v24, 타입 스트리핑 기본 활성), `e2e-today.mjs`도
같은 방식을 쓸 수 있다.
</design_decisions>

<constraints>
- `src/lib/schedule.ts`에 `import` 문을 추가하지 않는다. 게이트 스크립트가 이 파일을 트랜스파일러
  없이 직접 로드한다 — import가 하나라도 생기면 `check-schedule.mjs`가 즉시 깨진다.
- 날짜 산술은 전 구간 `Date.UTC(y, m-1, d+i)` + `toISOString().slice(0,10)`만 쓴다.
  로컬 타임존 getter(`getFullYear`/`getMonth`/`getDate`)를 한 번도 쓰지 않는다(Pitfall 1).
- Tailwind 임의값 대괄호(`text-[...]`, `w-[...]` 등)와 리터럴 색·기본 팔레트 색 유틸리티를
  새로 도입하지 않는다 — `check-design-tokens.mjs --strict`가 상시 위반으로 잡는다(D-88/D-96).
- 사용자에게 보이는 어떤 문자열에도 교육기관명을 넣지 않는다 — 항상 "AI Engineer 교육과정".
- Phase 6 산출물(`.planning/phases/06-*`)을 건드리지 않는다. 실기기 iPad UAT 대기 중이다.
- `scripts/check-pace.mjs`의 **기존** 픽스처 날짜 문자열은 바꾸지 않는다. 자기완결 유닛 케이스라
  `SCHEDULE_START`를 읽지 않는다 — 통과 중인 테스트의 날짜를 미관상 맞추는 것은 순수 churn이다.
  새 케이스만 추가한다.
</constraints>

<tasks>

<task type="tracer" tdd="true">
  <name>Task 1: 2레슨 날짜를 아는 순수 일정 모듈 — 데이터 층 끝에서 끝까지</name>
  <files>src/lib/schedule.ts, src/lib/schedule-data.ts, scripts/check-schedule.mjs</files>
  <read_first>src/lib/schedule.ts, src/lib/schedule-data.ts, scripts/check-schedule.mjs</read_first>

  <behavior>
`scripts/check-schedule.mjs`가 아래를 어설션한다. 구현 전에 케이스를 먼저 써서 빨갛게 만든 뒤
구현으로 초록을 만든다. 실제 상수를 쓰는 케이스는 `SCHEDULE_START` / `DOUBLE_LESSON_DATES`를
모듈에서 import해 쓰고, 날짜 리터럴을 케이스 안에 다시 적지 않는다.

상수·산식:
- `SCHEDULE_START` 값이 `'2026-08-28'`이다.
- `DOUBLE_LESSON_DATES`가 `['2026-08-29', '2026-09-05', '2026-09-12']`와 순서까지 일치한다.
- `scheduleTotalDays(35, 3) === 33`.
- `scheduleTotalDays(35, 0) === 36` (2레슨 날이 없으면 종전 산식과 같다).

실제 일정 — `rows = buildSchedule(makeSlugs(35), SCHEDULE_START, scheduleTotalDays(35, DOUBLE_LESSON_DATES.length), DOUBLE_LESSON_DATES)`:
- `rows.length === 36`.
- 서로 다른 날짜 수가 33이다.
- `lessonSlug`가 null이 아닌 행이 35개이고, 그 slug 배열이 입력 `makeSlugs(35)`와 **순서까지**
  deepStrictEqual이다 → 누락·중복·순서 뒤집힘을 한 번에 잡는다.
- 날짜 배열이 비내림차순이다(중복은 허용, 역행은 실패).
- 같은 날짜를 2행 갖는 날짜 목록이 `DOUBLE_LESSON_DATES`와 deepStrictEqual이고, 3행 이상인
  날짜는 0건이다.
- 마지막 레슨 행(`lessonSlug`가 null이 아닌 마지막 행)의 date가 `'2026-09-28'`이다.
- `rows[35]`가 `{ date: '2026-09-29', lessonSlug: null, isBuffer: true }`이다.
- `date < SCHEDULE_START`인 행 0건, `date > '2026-09-29'`인 행 0건.
- `DOUBLE_LESSON_DATES`의 어떤 날짜도 `isBuffer: true` 행을 갖지 않는다.
- 월 경계: `'2026-08-31'`을 갖는 행 다음에 나오는 **서로 다른 첫 날짜**가 `'2026-09-01'`이다.
- `buildSchedule` 호출 후 입력 slug 배열과 doubleDates 배열이 변형되지 않았다.

경계:
- `buildSchedule([], '2026-08-28', 1, [])` → 버퍼 1행만.
- `buildSchedule(makeSlugs(2), '2026-08-28', 2, ['2026-08-28'])` → 8/28에 2행, 8/29는 버퍼 1행.
- `buildSchedule(makeSlugs(1), '2026-08-28', 2, ['2026-08-28'])` → slug가 모자라면 8/28은
  1행만 갖고 예외를 던지지 않는다.
- `doubleDates`에 일정 범위 밖 날짜가 들어와도 예외 없이 무시된다.

선택 헬퍼(2레슨 날의 홈 동작을 오늘 증명하는 케이스):
- `rowsForDate(rows, '2026-08-28').length === 1`.
- `rowsForDate(rows, '2026-08-29').length === 2`이고 두 행의 slug가 서로 다르며 입력 순서상
  연속한 2개다.
- `rowsForDate(rows, '2026-08-01')`은 빈 배열이다.
- `firstRowAfter(rows, '2026-08-29').date === '2026-08-30'` — 같은 날짜의 두 번째 행이 아니라
  **다음 날짜의 첫 행**을 돌려준다.
- `firstRowAfter(rows, '2026-09-28')`가 9/29 버퍼 행이다.
- `firstRowAfter(rows, '2026-09-29')`가 null이다.

`daysUntil`:
- `daysUntil('2026-09-30', SCHEDULE_START) === 33`.
(기존 `todayInSeoul` 자정·연 경계 케이스는 일정과 무관한 타임존 케이스이므로 그대로 둔다.)
  </behavior>

  <action>
`src/lib/schedule.ts`를 고친다 — 파일 상단의 "import 문을 하나도 쓰지 않는다" 규약을 유지한다.

1. `SCHEDULE_START`를 `'2026-08-28'`로 바꾼다. `COURSE_START_DATE`는 그대로 둔다.
2. `DOUBLE_LESSON_DATES`를 새로 내보낸다 — 레슨 2개를 배정할 날짜 3개(8/29·9/5·9/12, 전부
   토요일). 왜 이 3일인지(8/28~9/29 33일 중 9/29를 버퍼로 빼면 학습일 32일 → 35레슨을 담으려면
   정확히 3일이 2레슨, 토요일에·앞쪽 2주에 배치)를 주석으로 남긴다. 이 상수가 날짜→레슨 매핑을
   담지 않는다는 점도 명시한다(DD-2).
3. `scheduleTotalDays(lessonCount, doubleDayCount)`로 시그니처를 넓힌다. 반환값은
   `lessonCount - doubleDayCount + 1`. `doubleDayCount`는 기본값 0으로 둬 인자 1개 호출이
   종전과 같은 결과를 내게 한다.
4. `buildSchedule(orderedSlugs, startDateISO, totalDays, doubleDates = [])`로 넓힌다.
   구현: `doubleDates`를 Set으로 만들고, `totalDays`일을 하루씩 순회하며 그날 배정할 개수를
   정한다(그 날짜가 Set에 있으면 2, 아니면 1). 남은 slug가 있는 만큼만 `orderedSlugs`에서
   앞에서부터 꺼내 행을 만든다. 그날 한 개도 배정하지 못했으면 `lessonSlug: null` /
   `isBuffer: true` 행 하나를 넣는다. 입력 배열은 변형하지 않는다. 날짜 산술 규약은 그대로다.
5. `rowsForDate(rows, dateISO)` — 그 날짜의 행 전부를 순서대로 돌려주는 순수 함수를 추가한다.
6. `firstRowAfter(rows, dateISO)` — `date > dateISO`인 **첫 행**을 돌려주고 없으면 null.
   인덱스 +1 산술을 쓰지 않는 이유(같은 날짜 2행이면 +1이 같은 날의 두 번째 레슨을 가리켜
   "내일"이 오늘이 되어 버린다)를 주석으로 남긴다.

`src/lib/schedule-data.ts`의 `getScheduleRows()`는 `DOUBLE_LESSON_DATES`를 함께 import해
`buildSchedule(slugs, SCHEDULE_START, scheduleTotalDays(slugs.length, DOUBLE_LESSON_DATES.length), DOUBLE_LESSON_DATES)`
로 호출한다. 다른 변경은 없다 — 이 파일이 단일 진입점이라는 성질을 그대로 유지한다.

`scripts/check-schedule.mjs`는 위 behavior 목록의 케이스로 갱신한다. 모듈 import 목록에
`SCHEDULE_START`·`DOUBLE_LESSON_DATES`를 추가하고, 실제 일정 케이스는 그 상수를 인자로 쓴다.
  </action>

  <verify>
    <automated>node scripts/check-schedule.mjs</automated>
    <automated>npx tsc --noEmit</automated>
  </verify>
  <done>
`check-schedule.mjs`가 전 케이스 통과를 출력하고, 실패 케이스 0건이다. 35개 slug가 입력 순서
그대로 정확히 한 번씩 배정되고, 2행 날짜가 정확히 8/29·9/5·9/12 셋이며, 마지막 레슨이 9/28,
9/29가 버퍼 행이다. 타입 체크가 통과한다.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: 같은 날짜 2행을 렌더하는 표현층 — key·주차·오늘·내일</name>
  <files>src/components/schedule-table.tsx, src/app/schedule/page.tsx, src/app/page.tsx, src/components/today-lesson-card.tsx, scripts/e2e-today.mjs</files>
  <read_first>src/components/schedule-table.tsx, src/app/page.tsx, src/app/schedule/page.tsx, src/components/today-lesson-card.tsx, scripts/e2e-today.mjs</read_first>

  <behavior>
`scripts/e2e-today.mjs`에 시나리오 2개를 추가한다. 이 둘이 "2레슨 날이 제대로 렌더된다"를
오늘 날짜와 무관하게 증명한다 — `/schedule`은 오늘이 어디에 있든 전량 렌더되기 때문이다.

- **s6**: 쿠키 없이 `GET /schedule` → 응답 본문에서 일정 행이 담은 날짜 문자열을 모두 뽑아,
  (1) 서로 다른 날짜가 33개, (2) `DOUBLE_LESSON_DATES`의 각 날짜가 정확히 2번 등장,
  (3) 나머지 날짜는 전부 정확히 1번 등장함을 어설션한다. 날짜 추출은 s3이 이미 쓰는 방식대로
  `data-schedule-ui="row"` 마커 이후 구간에서 `\d{4}-\d{2}-\d{2}` 패턴을 읽는다. 개강일 행
  (`2026-09-30`)은 `data-schedule-ui="row"` 마커가 없으므로 집계에서 자연히 빠진다 — 빠지는지
  확인하는 어설션(33개 중 9/30 없음)을 함께 넣는다.
- **s7**: `/schedule`과 `/`를 각각 한 번 요청한 뒤, dev 서버 출력 버퍼(`serverOutput`)에
  React 중복 key 경고(`same key` / `Encountered two children`)가 없음을 어설션한다.
  중복 key 경고는 nit이 아니라 실패로 처리한다.

기존 시나리오는 값을 바꾸지 않고 그대로 통과해야 한다:
- s1/s2 — `data-schedule-ui="row"` 36건(35레슨 + 버퍼 1, 총 행 수는 변하지 않는다).
- s3 — 오늘이 일정 범위 밖(2026-08-26 < 2026-08-28)이면 `data-schedule-ui="today-row"` 0건.
- s5 — 첫 일정 행 링크가 매니페스트 독립 계산 첫 레슨과 일치.
- t1/t7 — 홈 `data-schedule-ui="today-card"` 1건, 쿠키 없을 때 `data-progress-ui` 0건.
- t2 — 오늘이 시작 전이므로 홈에 시작 전 문구가 있어야 한다.
  </behavior>

  <action>
**`scripts/e2e-today.mjs` 먼저** (DD-4 포함):
- 33행의 `SCHEDULE_START` 재선언을 지우고, 파일 상단에서 `schedule.ts`를 top-level await
  동적 import 해 `SCHEDULE_START`와 `DOUBLE_LESSON_DATES`를 가져온다. `check-schedule.mjs`가
  쓰는 `pathToFileURL(path.join(ROOT,'src','lib','schedule.ts')).href` 패턴을 그대로 쓴다.
  상수 재선언 주석은 "상수는 schedule.ts에서 로드하고 알고리즘만 독립 재구현한다"로 갱신한다.
- `computeScheduleRows(orderedSlugs, startDateISO, doubleDates)`를 2레슨 규칙까지 **독립
  재구현**한다. `buildSchedule`을 import하지 않는다 — 같은 함수를 재사용하면 계산이 틀려도
  검증이 같이 틀린다는 이 파일의 원래 설계 이유가 그대로 유효하다. 총 일수는
  `orderedSlugs.length - doubleDates.length + 1`로 스스로 계산한다.
- 호출 지점 4곳(t2, t6, t8, s3)에 `DOUBLE_LESSON_DATES`를 넘긴다.
- s6·s7을 위 behavior 목록대로 추가하고, 시나리오 카운트 표기(`s1/5` → `s1/7` 등)와 마지막 요약
  문구를 실제 개수에 맞춘다.

**`src/components/schedule-table.tsx`**:
- 행 key를 유일하게 만든다. 레슨 행은 `row.lessonSlug`(35개 전역 유일), 버퍼 행은 `row.date`를
  쓴다 — 두 갈래를 하나의 표현식으로 합쳐 넘긴다. 날짜만으로는 유일하지 않다는 이유를 주석에
  남긴다.
- 주차 묶기를 **행 7개 단위가 아니라 서로 다른 날짜 7개 단위**로 바꾼다. 현재
  `rows.slice(i, i+7)`은 "1행 = 1일"을 전제하므로 2레슨 날이 있으면 한 묶음이 6일이 된다.
  행을 순회하며 날짜가 바뀔 때 일수를 세고, 7일을 채웠으면 새 묶음을 연다. 같은 날짜의 두 행은
  절대 다른 주차로 갈라지지 않아야 한다. 33일이면 묶음은 7·7·7·7·5 = 5개가 된다.
- 오늘 행 앵커를 하나로 고정한다. 오늘 날짜의 **첫 행에만** `id="schedule-today"`와
  `data-schedule-ui="today-row"` 마커를 붙이고, 강조 스타일(`TODAY_ROW_CLASS`)은 오늘 날짜의
  모든 행에 준다. 앵커/마커와 강조를 별도 boolean으로 분리해 각 행 컴포넌트에 내린다.
  DOM id 중복과 s3의 마커 1건 어설션이 동시에 깨지는 지점이므로 주석으로 이유를 남긴다.
- 2레슨 날의 두 행은 둘 다 날짜를 그대로 표시한다(그날 레슨이 2개임이 표에서 바로 읽힌다).
  새 클래스·색·임의값 대괄호를 도입하지 않는다.

**`src/app/schedule/page.tsx`**:
- 헤더의 하드코딩 문구를 파생값으로 바꾼다: 시작일은 `SCHEDULE_START`, 종료일은
  `rows[rows.length - 1].date`에서 읽는다. 문구는 하루 1레슨이 기본이고 토요일 3일만 2레슨이라는
  사실을 담는다. 날짜 리터럴을 이 파일에 새로 적지 않는다.

**`src/app/page.tsx`**:
- 오늘 행 조회를 `rowsForDate(rows, today)`로 바꾼다(단수 `find` 제거). 빈 배열이면 종전처럼
  `today < SCHEDULE_START` 여부로 시작 전/범위 밖을 가른다. 비어 있지 않으면 첫 행의
  `isBuffer`로 버퍼/배정을 가른다.
- 오늘 배정 레슨 목록을 만든다 — 오늘 행들의 slug를 `getLessonBySlug`로 조회하고 실패한 것은
  조용히 제외한다(이 파일의 기존 방어적 필터링 원칙 그대로).
- `completedToday`는 오늘 배정 레슨을 **전부** 완료했을 때만 true로 둔다. `completedIds`가
  null이면 종전처럼 null을 유지한다 — 조회 실패/쿠키 없음을 미완료로 오인시키지 않는다.
- 내일 행 조회를 `firstRowAfter(rows, today)`로 바꾼다. `rows.indexOf` + 1 산술을 제거한다.
- 페이스·밀린 레슨 계산은 손대지 않는다. `computePace`는 중복 날짜를 이미 견딘다(Task 3에서
  증명).

**`src/components/today-lesson-card.tsx`**:
- `todayLesson: Lesson | null` 프롭을 오늘 배정 레슨 목록으로 넓힌다(0·1·2개). 나머지 프롭
  (`state`, `completed`, `tomorrow`)의 의미는 유지한다.
- 레슨이 1개일 때의 렌더 결과는 **지금과 픽셀 단위로 같게** 둔다 — 제목 텍스트 + 배지 + 하단
  CTA 1개. Phase 6에서 다듬은 화면을 흔들지 않는다.
- 레슨이 2개일 때만 두 레슨을 각각 한 줄로 나열하고, 각 줄을 해당 레슨 링크로 만든다.
  카드 최상위 `data-schedule-ui="today-card"` 마커는 카드당 1건을 유지한다(t1/t7 어설션).
  하단 CTA는 첫 번째 **미완료** 레슨을 가리키고, 완료 여부를 알 수 없으면 첫 레슨을 가리킨다.
- 시작 전 문구의 하드코딩 날짜를 `SCHEDULE_START`를 넣은 템플릿 문자열로 바꾼다
  (`schedule-table.tsx`가 이미 `@/lib/schedule`에서 `COURSE_START_DATE`를 가져오는 것과 같은
  경계다). 문구에 교육기관명을 넣지 않는다.
  </action>

  <verify>
    <automated>npm run build</automated>
    <automated>node --env-file=.env.local scripts/e2e-today.mjs</automated>
    <automated>node scripts/check-design-tokens.mjs --strict</automated>
  </verify>
  <done>
빌드가 통과하고, `e2e-today.mjs`가 t1~t8 · s1~s7 전부 통과를 출력한다. s6가 33개 날짜 중
8/29·9/5·9/12만 2회 등장함을 확인하고, s7이 dev 서버 출력에서 React 중복 key 경고 0건을
확인한다. 디자인 토큰 게이트가 위반 0건이다.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: 중복 날짜에 대한 페이스 판정 증명 + 게이트 14종 전량 통과</name>
  <files>scripts/check-pace.mjs, .planning/REQUIREMENTS.md</files>
  <read_first>scripts/check-pace.mjs, src/lib/pace.ts</read_first>

  <behavior>
DD-1은 "`pace.ts`가 중복 날짜를 이미 견딘다"에 기대고 있다. 그 주장을 케이스로 못 박는다.
`scripts/check-pace.mjs`에 **새 케이스만** 추가한다(기존 픽스처는 손대지 않는다):

- 같은 날짜 2행이 모두 과거이고 둘 다 미완료 → `behind`, `gapMinutes`가 두 레슨 분의 합,
  `missedSlugs`가 두 slug를 rows 순서대로 담는다.
- 같은 날짜 2행이 모두 과거이고 하나만 완료 → `behind`, `gapMinutes`가 미완료 1건의 분과 같고,
  `missedSlugs`가 그 1건만 담는다(완료한 쪽이 미완료를 가리지 않는다).
- 같은 날짜 2행이 **오늘** 날짜이고 둘 다 미완료 → 어제까지 배정분이 0이므로 `on-track`이고
  `missedSlugs`가 빈 배열이다(오늘 배정분이 밀린 것으로 잡히지 않는다).
- 같은 날짜 2행 중 하나가 오늘·미래 배정인데 미리 완료 → 어제까지 배정분의 미완료를 가리지
  않고 그대로 `behind`로 판정된다(Pitfall 3 실패 모드가 중복 날짜에서도 재현되지 않음).
  </behavior>

  <action>
1. `scripts/check-pace.mjs`에 위 behavior 목록의 케이스 4개를 추가한다. 기존 케이스의 날짜 문자열은
   바꾸지 않는다 — `SCHEDULE_START`를 읽지 않는 자기완결 유닛 픽스처이고, 통과 중인 테스트의
   날짜를 미관상 맞추는 것은 순수 churn이다.

2. `.planning/REQUIREMENTS.md`의 SCHED-01 문장을 새 일정으로 갱신한다 — 기간과 하루 배정 레슨
   수 서술이 코드와 어긋난 채 남지 않게 한다. 다른 요구사항 줄과 상태 표는 건드리지 않는다.

3. 게이트 14종과 빌드를 전량 돌린다. 정적 게이트 8종은 env 없이, 나머지 6종은
   `--env-file=.env.local`로 돌린다. 어느 하나라도 실패하면 그 자리에서 고치고 다시 돌린다 —
   "일정과 무관한 실패"로 넘기지 않는다.

4. 이미 저장된 완료 기록이 살아 있는지 확인한다. `progress` 테이블은 `lesson_id`(레슨 slug)만
   키로 쓰고 날짜를 저장하지 않으므로 날짜 재배정이 기록을 무효화할 수 없다 —
   `check-supabase-progress.mjs`와 `e2e-progress.mjs` 통과가 이 사실의 실행 증거다.
   SUMMARY에 이 근거를 한 줄로 남긴다.
  </action>

  <verify>
    <automated>node scripts/check-pace.mjs</automated>
    <automated>node scripts/check-schedule.mjs</automated>
    <automated>node scripts/check-brand.mjs</automated>
    <automated>node scripts/check-design-tokens.mjs --strict</automated>
    <automated>node scripts/check-lesson-structure.mjs</automated>
    <automated>node scripts/check-manifest.mjs</automated>
    <automated>node scripts/check-progress-gates.mjs</automated>
    <automated>node scripts/check-progress-math.mjs</automated>
    <automated>node --env-file=.env.local scripts/check-supabase-progress.mjs</automated>
    <automated>node --env-file=.env.local scripts/e2e-progress.mjs</automated>
    <automated>node --env-file=.env.local scripts/e2e-today.mjs</automated>
    <automated>node --env-file=.env.local scripts/e2e-typography.mjs</automated>
    <automated>node --env-file=.env.local scripts/e2e-mobile-overflow.mjs</automated>
    <automated>node --env-file=.env.local scripts/e2e-section-tape.mjs</automated>
    <automated>npm run build</automated>
  </verify>
  <done>
게이트 14종이 전부 통과하고 `npm run build`가 통과한다. `check-pace.mjs`의 새 중복 날짜
케이스 4개가 통과해 DD-1의 전제가 추정이 아니라 실행 증거가 된다. REQUIREMENTS.md의
SCHED-01 문장이 새 일정과 일치한다.
  </done>
</task>

</tasks>

<verification>
## 이 태스크가 반드시 증명해야 하는 것

추정으로 넘기지 않는다 — 각 항목 옆이 그것을 증명하는 실행 가능한 검사다.

| 주장 | 증거 |
|------|------|
| 마지막 레슨이 2026-09-28에 배정된다 | `check-schedule.mjs` — 마지막 비-null `lessonSlug` 행의 date 어설션 |
| 2026-09-29가 레슨 없는 버퍼일이다 | `check-schedule.mjs` — `rows[35]` deepStrictEqual |
| 35개 레슨이 전부 정확히 한 번씩 배정된다 | `check-schedule.mjs` — 배정 slug 배열이 입력과 순서까지 deepStrictEqual |
| 정확히 3날짜만 2레슨이고 그 날짜가 8/29·9/5·9/12다 | `check-schedule.mjs` — 2행 날짜 목록이 `DOUBLE_LESSON_DATES`와 deepStrictEqual + 3행 이상 0건 |
| 8/28 이전·9/29 이후 날짜가 없다 | `check-schedule.mjs` — 범위 밖 행 0건 |
| 2레슨 날의 홈이 두 레슨을 잡고 '내일'이 다음 날을 가리킨다 | `check-schedule.mjs` — `rowsForDate('2026-08-29')` 2건, `firstRowAfter('2026-08-29')` = 8/30 |
| `/schedule`이 2레슨 날을 2행으로 렌더한다 | `e2e-today.mjs` s6 — 33개 날짜 중 그 3날만 2회 등장 |
| React 중복 key 경고가 없다 | `e2e-today.mjs` s7 — dev 서버 출력 버퍼 검사(경고 = 실패) |
| 페이스 판정이 중복 날짜에서 정확하다 | `check-pace.mjs` 새 케이스 4개 |
| 이미 저장된 완료 기록이 살아 있다 | `check-supabase-progress.mjs` + `e2e-progress.mjs` 통과 (`progress`는 `lesson_id`만 키로 쓰고 날짜를 저장하지 않는다) |
| 나머지가 깨지지 않았다 | 게이트 14종 + `npm run build` 전량 통과 |
</verification>

<success_criteria>
- `SCHEDULE_START`가 `2026-08-28`이고, 35개 레슨이 8/28~9/28에 배정된다.
- 8/29 · 9/5 · 9/12 세 날만 레슨 2개, 나머지 29일은 1개씩, 9/29는 버퍼일.
- 게이트 14종 + `npm run build` 전량 통과 (신규 시나리오 s6·s7, 신규 pace 케이스 4개 포함).
- `SCHEDULE_START` 값이 저장소에 단 한 곳(`src/lib/schedule.ts`)에만 존재한다 —
  `e2e-today.mjs`의 복제본이 사라진다.
- `src/lib/schedule.ts`에 `import` 문이 0개로 유지된다.
</success_criteria>

<output>
`.planning/quick/260826-tbx-shift-study-start-date-from-2026-08-25-t/SUMMARY.md`를 작성한다.
설계 결정 DD-1~DD-4와 그 근거, 실제 배정 결과(첫 레슨·마지막 레슨·2레슨 날 3개), 게이트 결과를
남긴다.
</output>
