---
phase: 04-step-1
plan: 05
subsystem: content
tags: [mdx, sql, postgresql, supabase, velite, shiki, eli5]

# Dependency graph
requires:
  - phase: 04-step-1
    plan: 01
    provides: "eli5 × 6단 집필 표준의 실증판(`1-3-python-variables-and-types.mdx`), `scripts/check-lesson-structure.mjs` 게이트, `.prose details/summary` CSS"
provides:
  - "`1-4-relational-db-basics` — 테이블·행·열·기본키·외래키·스키마를 다루는 eli5 레슨, `practice` 스키마 자급자족 SQL 예제"
  - "`1-4-sql-queries-and-joins` — SELECT·JOIN·집계(GROUP BY/HAVING)·서브쿼리 네 주제를 다루는 eli5 레슨, 문자열 결합 쿼리 경고 포함"
  - "`sql` 코드펜스 하이라이팅 실제 빌드 산출물에서 재확인(2개 레슨 각각 25/27개 색 스팬, 4/5개 색상)"
affects: ["04-step-1 Plan 07 (종단 게이트 — check-manifest.mjs 상수 갱신)"]

actuals:
  tokens: 3205
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "SQL 안전 계약: 모든 예제 테이블에 `practice.` 접두사, `CREATE SCHEMA IF NOT EXISTS practice;`로 시작, 마지막에 `DROP SCHEMA IF EXISTS practice CASCADE;` 정리 문장"
    - "Task 2는 앞 레슨을 건너뛴 학습자를 위해 `CREATE TABLE IF NOT EXISTS`로 스키마·테이블·INSERT를 자체 준비 블록에 다시 포함(자급자족)"
    - "한글 컬럼 별칭(`AS 학생`, `AS 평균점수`)을 ORDER BY에서 그대로 참조 — PostgreSQL의 UTF8 인코딩 식별자 규칙상 유효"

key-files:
  created: []
  modified:
    - src/content/lessons/step-1/1-4-relational-db-basics.mdx
    - src/content/lessons/step-1/1-4-sql-queries-and-joins.mdx

key-decisions:
  - "두 레슨 모두 `practice` 스키마 밖(특히 `public.progress`)을 참조하는 SQL 문을 0건으로 유지 — T-04-02 완화, `(FROM|INTO|UPDATE|JOIN|TABLE|SCHEMA|DELETE FROM)\\s+public\\.` 정규식 0건 확인"
  - "Task 1의 실무 예제에 간단한 JOIN 확인 쿼리를 포함했지만 JOIN 개념 자체는 가르치지 않음(단순히 넣은 데이터가 이어졌는지 확인하는 용도) — Task 2가 JOIN을 본격적으로 다루는 유일한 레슨이라는 역할 분리를 유지"
  - "Task 2 준비 블록은 `INSERT`까지 재실행 시 새 행이 추가될 수 있음을 명시적으로 안내하고, 스키마·테이블만 `IF NOT EXISTS`로 멱등하게 처리 — INSERT까지 멱등하게 만들려면 복잡한 `ON CONFLICT` 로직이 필요해 eli5 톤을 해치므로 채택하지 않음"

requirements-completed: [CONT-02, CONT-03]

duration: "약 1세션(개발환경 npm ci 포함)"
completed: 2026-08-25
status: complete
---

# Phase 4 Plan 5: 1-4 SQL & 데이터베이스 기초 2편 Summary

**모듈 1-4(SQL & 데이터베이스 기초) 2편을 eli5 × 6단 표준으로 집필 — 학생/과목/수강 3-테이블 예제로 관계형 구조를 가르치고, SELECT·JOIN·집계·서브쿼리 네 주제를 모두 다루며, 두 레슨 모두 `practice` 스키마 안에서만 자급자족으로 실행된다.**

## Performance

- **Tasks:** 2/2 완료 (둘 다 `type="auto"`, 체크포인트 없음)
- **Commits:** 2 (Task별 1개씩)
- **Files modified:** 2 (`1-4-relational-db-basics.mdx`, `1-4-sql-queries-and-joins.mdx`)

## Accomplishments

- `1-4-relational-db-basics`: 테이블/행/열/기본키/외래키/스키마 6개 용어를 엑셀 비유·"학생 → 수강 → 과목" 흐름으로 설명, `practice` 스키마 안에 3개 테이블(학생·과목·수강)을 만들고 데이터를 넣고 조회하는 완결 예제, 해보기 3개(추가 테이블 생성/자기 데이터 삽입/FK 위반 에러 확인)
- `1-4-sql-queries-and-joins`: SELECT+WHERE+ORDER BY, INNER/LEFT JOIN 비교, GROUP BY+집계 함수+HAVING, 서브쿼리 네 주제를 각각 실행 가능한 SQL 펜스로 제공, 해보기 3개(JOIN 종류 변경/GROUP BY 기준 변경/서브쿼리 직접 작성), 실무 팁에 문자열 결합 쿼리 경고(T-04-03) 포함
- 두 레슨 모두 마지막에 `practice` 스키마를 통째로 지우는 정리 SQL 제공 — 몇 번이든 처음부터 다시 실습 가능
- 빌드 산출물에서 `sql` 펜스가 실제로 색상 하이라이팅됨을 재확인(Task 1: 색 스팬 25개/4색, Task 2: 27개/5색) — 단색 폴백 아님
- `node scripts/check-lesson-structure.mjs`, `node scripts/check-brand.mjs`, `npm run build` 세 게이트 모두 통과

## Task Commits

1. **Task 1: 1-4-relational-db-basics** — `ec5faac` (feat) — 본문 신규 작성, `hasContent: false → true`, 다른 7개 프론트매터 필드 불변
2. **Task 2: 1-4-sql-queries-and-joins** — `d18586e` (feat) — 본문 신규 작성, `hasContent: false → true`, 다른 7개 프론트매터 필드 불변

**Plan metadata:** 이 문서(SUMMARY.md) 커밋은 오케스트레이터가 별도로 처리(이 실행자는 STATE.md/ROADMAP.md를 건드리지 않음).

## Files Created/Modified

- `src/content/lessons/step-1/1-4-relational-db-basics.mdx` — 본문 전면 신규 작성(스텁 → 6단 구조), 프론트매터 `hasContent` 1줄만 변경
- `src/content/lessons/step-1/1-4-sql-queries-and-joins.mdx` — 본문 전면 신규 작성(스텁 → 6단 구조), 프론트매터 `hasContent` 1줄만 변경

## Decisions Made

- **SQL 안전 계약을 예외 없이 준수** — 모든 `CREATE`/`INSERT`/`SELECT`/`DROP`이 `practice.` 접두사를 가진 테이블 또는 `practice` 스키마 자체를 대상으로 하며, 사이트 진도 테이블(`public.progress`)은 SQL 문의 대상이 된 적이 없다. `(FROM|INTO|UPDATE|JOIN|TABLE|SCHEMA|DELETE FROM)\s+public\.` 정규식으로 0건 확인.
- **Task 1의 확인용 JOIN 쿼리는 "개념 가르치기"가 아니라 "데이터가 잘 들어갔는지 확인"용으로만 사용** — JOIN 자체의 종류·의미론은 Task 2에서 처음 가르친다는 역할 분리를 유지했다.
- **Task 2 준비 블록은 스키마·테이블만 멱등(`IF NOT EXISTS`)** — `INSERT`까지 완전히 멱등하게 만들려면 `ON CONFLICT` 로직이 필요해 eli5 톤에 맞지 않다고 판단, 대신 "처음 한 번만 실행하세요"라는 산문 안내로 대체했다.
- **한글 컬럼 별칭을 `ORDER BY`에서 그대로 참조** — PostgreSQL은 UTF8 인코딩에서 멀티바이트 문자를 식별자 문자로 인정하므로(`scan.l`의 `ident_start`/`ident_cont` 정의), `AS 평균점수` 뒤에 `ORDER BY 평균점수`처럼 인용부호 없이 써도 유효하다.

## Deviations from Plan

None — plan executed exactly as written. `npm ci`로 fresh worktree의 `node_modules`를 설치한 것은 계획 편차가 아니라 병렬 executor worktree의 정상적인 준비 단계였다(Wave 2 공통 규칙에 명시된 "npm ci may be needed" 그대로).

## Known Stubs

None — 두 레슨 모두 완결된 실습 가능 콘텐츠로 작성됐고, 하드코딩된 빈 값이나 미와이어드 데이터 소스가 없다.

## Threat Flags

None — 이 Plan은 새로운 네트워크 엔드포인트·인증 경로·스키마 변경을 도입하지 않았다. 유일한 위험 표면(SQL 예제가 공유 스키마를 건드릴 가능성, T-04-02)은 이미 threat_model에 등록되어 있고 이 실행에서 실증적으로 완화를 확인했다.

## Issues Encountered

- **Fresh worktree에 `node_modules`가 없었다** — `npm ci`로 해결(28초 소요, 523개 패키지). Wave 2 공통 규칙이 이미 예상한 상황.
- **`npm run build`가 `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` 환경변수 없이 `/curriculum` 페이지 데이터 수집 단계에서 실패** — `.env.local` 파일을 만들지 않고(worktree_metadata 규칙 준수) 빌드 명령 앞에 인라인으로 placeholder 값(`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `UNLOCK_SECRET`, `NEXT_PUBLIC_SITE_URL`)을 전달해 해결. 이 값들은 저장소에 기록되지 않았고 이 프로세스 실행에만 존재했다.

## SQL 실행 검증 — 명시적 기록 (flagged_assumptions backstop)

이 worktree 환경에는 브라우저·Supabase 대시보드 접근 권한이 없어, 두 레슨의 SQL을 실제 Supabase SQL 에디터(또는 다른 PostgreSQL 인스턴스)에서 직접 실행해 확인하지 못했다. 대신 다음 방식으로 검증했다:

- 모든 `CREATE TABLE`/`CREATE SCHEMA`/`INSERT`/`SELECT`/`DROP SCHEMA` 문을 표준 PostgreSQL 문법으로 한 줄씩 재검토(괄호 짝, 세미콜론, 예약어 사용, 타입 이름) — 문법 오류 없음을 확인.
- 조인·집계·서브쿼리 쿼리는 준비 데이터(학생 3명, 과목 3개, 수강 5건)를 손으로 대입해 예상 결과 행 수·값을 미리 계산하고, 본문의 "결과 설명" 문장이 그 계산과 일치하는지 대조했다(예: 집계 쿼리의 평균 60점 이상 필터, 서브쿼리의 전체 평균 73.2점 초과 필터).
- 한글 컬럼 별칭을 `ORDER BY`에서 참조하는 부분은 PostgreSQL의 UTF8 식별자 규칙(멀티바이트 문자를 identifier 문자로 인정)을 근거로 유효하다고 판단했다.

**실제 프로덕션 Supabase 프로젝트에서 이 SQL을 한 번 실행해 확인하는 것을 권장한다** — 특히 두 레슨을 처음 사전학습하는 시점에, 학습자 본인이 첫 실습으로 겸해 확인하면 이 부분의 잔여 리스크가 해소된다.

## User Setup Required

None — 외부 서비스 설정 필요 없음. 학습자가 실습할 때는 기존 1-1 레슨에서 만든 Supabase 계정으로 대시보드 SQL 에디터에 접속하면 된다.

## Next Phase Readiness

- Plan 07(종단 게이트)이 `scripts/check-manifest.mjs`의 `EXPECTED_HAS_CONTENT_COUNT`를 2 → 11로 올릴 때 이 두 레슨의 `hasContent: true`가 그 카운트에 포함된다.
- `node scripts/check-manifest.mjs`는 이 Plan에서 의도적으로 실행하지 않았다(Wave 2 공통 규칙 2) — Plan 07 전까지 red 상태가 정상이다.
- 남은 리스크는 위 "SQL 실행 검증" 섹션의 실제 Supabase 실행 미확인 하나뿐이며, 다른 Wave 2 레슨의 위험과 성격이 다르다(콘텐츠 오류가 아니라 실행 환경 접근성 제약).

---
*Phase: 04-step-1*
*Completed: 2026-08-25*

## Self-Check: PASSED

All created files verified present on disk; all three commits (`ec5faac`, `d18586e`, `5e69966`) verified present in git log.
