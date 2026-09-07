---
phase: quick-260901-ksv
plan: 01
subsystem: content-interactive
tags: [pglite, wasm, sql, mdx, velite, e2e, playwright]

requires:
  - phase: quick-260901-iqk
    provides: "브라우저 안 코드 실행 패턴(RunPython/pyodide-runtime.ts/mdx-content.tsx 매핑/e2e-code-run.mjs 골격) — 이번 플랜이 그대로 미러링"
provides:
  - "PGlite(WASM Postgres) 지연 로드 런타임(pglite-runtime.ts), package.json 불변, 실행 전 0바이트"
  - "RunSQL 컴포넌트 — 실행/고쳐 보기/원래대로 + statement별 결과 HTML 표/DDL·DML 상태 메시지 렌더"
  - "1-4-sql-queries-and-joins 레슨 실무 예제(셋업+쿼리 4개+해보기 정답 3개)가 페이지 안에서 바로 실행됨"
  - "e2e-sql-run.mjs 게이트(포트 3217, 판정 5건) — 0바이트 계약/셋업 성공/지속 인스턴스 증명/터치 타깃/Postgres 에러 원문"
affects: [SQL 레슨 나머지 3편 확장 시, 코드 실행 파일럿 계열 전반]

actuals:
  tokens: 8878
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "지속 단일 인스턴스(module-scope singleton) — Pyodide의 '블록마다 새 네임스페이스'와 정반대. SQL 레슨은 셋업 한 번 → 쿼리 여러 번이 실제 워크플로라 인스턴스를 재사용·지속해야 셋업 후 쿼리가 동작한다."
    - "간접 dynamic import(new Function('u','return import(u)'))로 번들러 정적 분석을 우회 — 실행 전 0바이트 계약을 Turbopack 아래서도 지킨다."

key-files:
  created:
    - src/lib/pglite-runtime.ts
    - src/components/run-sql.tsx
    - scripts/e2e-sql-run.mjs
  modified:
    - src/components/mdx-content.tsx
    - src/content/lessons/step-1/1-4-sql-queries-and-joins.mdx
    - src/app/globals.css

key-decisions:
  - "PGlite 버전을 0.5.8로 고정, CDN URL을 https://cdn.jsdelivr.net/npm/@electric-sql/pglite@0.5.8/+esm로 고정(latest 금지) — 배포 후 내용이 조용히 바뀌지 않게 함(T-KSV-01 완화, curl -sI 200 확인됨)"
  - "출력 표를 run-sql.tsx가 직접 그림(mdx-content.tsx의 TableWrapper 재사용 안 함) — MDX 컴파일 표가 아니라 런타임 결과 표라 별도 렌더 경로가 필요, 대신 같은 overflow-x-auto 원칙을 그대로 적용"
  - "teardown DROP SCHEMA 블록(5. 실무 팁)은 <RunSQL>로 감싸지 않음 — 실행하면 이후 쿼리 재실행에 다시 셋업이 필요해져 인터랙티브 실행 대상으로 부적합(계획 명시)"

patterns-established:
  - "RunSQL/pglite-runtime.ts는 RunPython/pyodide-runtime.ts의 '재사용 아님, 복제' 원칙을 그대로 이어감 — 저장소의 코드 실행 파일럿 계열 전체가 공유 모듈 없이 골격만 복제하는 컨벤션"

requirements-completed: [SQL-PILOT-1]

coverage:
  - id: D1
    description: "PGlite 지연 로드 런타임 — package.json 불변, 정적 import 0개, 간접 dynamic import로 CDN ESM 지연 로드"
    requirement: "SQL-PILOT-1"
    verification:
      - kind: other
        ref: "npx tsc --noEmit (pglite-runtime.ts 관련 에러 0건) + git diff package.json 빈 결과 확인"
        status: pass
    human_judgment: false
  - id: D2
    description: "RunSQL 컴포넌트 — 실행/고쳐 보기/원래대로, statement별 결과 표 또는 DDL/DML 상태 메시지, Postgres 에러 원문 표시"
    requirement: "SQL-PILOT-1"
    verification:
      - kind: e2e
        ref: "node --env-file=.env.local scripts/e2e-sql-run.mjs (A2/A3/A5)"
        status: pass
    human_judgment: false
  - id: D3
    description: "1-4-sql-queries-and-joins 레슨 실무 예제(셋업+조회+JOIN+집계+서브쿼리+해보기 정답 3개, 8개 블록) <RunSQL> 래핑"
    requirement: "SQL-PILOT-1"
    verification:
      - kind: other
        ref: "node node_modules/velite/bin/velite.js build --clean 후 .velite/lessons.json 컴파일 코드에서 RunSQL 호출 8건 확인"
        status: pass
      - kind: other
        ref: "node scripts/check-lesson-structure.mjs"
        status: pass
    human_judgment: false
  - id: D4
    description: "실행 전 0바이트 계약(cdn.jsdelivr.net 요청 0건) + 터치 타깃 44px 이상"
    requirement: "SQL-PILOT-1"
    verification:
      - kind: e2e
        ref: "node --env-file=.env.local scripts/e2e-sql-run.mjs (A1/A4)"
        status: pass
    human_judgment: false
  - id: D5
    description: "출력 표가 라이트/다크 모드 모두 크림 패널 위에서 정상 대비 — 아이패드 실기기 실측"
    human_judgment: true
    rationale: "iPad Safari 실기기의 WASM 메모리·터치·시각 대비는 실행자가 자동화할 수 없다(제약사항 명시). 정적 게이트(check-design-tokens)와 내장 브라우저 라이트/다크 스냅샷으로 코드 수준 대비는 확인했으나, 실기기 렌더링·메모리 압박·전기용량 터치 반응은 사용자 확인이 필요하다."

duration: 약 20분(3커밋 15:10~15:15 KST, 파일 읽기·검증 포함 세션 전체 약 25분)
completed: 2026-09-01
status: complete
---

# Phase quick-260901-ksv Plan 01: SQL(PGlite) 브라우저 실행 파일럿 Summary

**1-4-sql-queries-and-joins 레슨에 PGlite(WASM Postgres) 지연 로드 런타임 + RunSQL 컴포넌트를 붙여 셋업→쿼리 지속 실행과 결과 HTML 표 렌더링을 구현, e2e-sql-run.mjs 5/5 통과(기존 e2e-code-run 회귀 없음)**

## Performance

- **Duration:** 약 20분 (실제 코드/커밋 구간), 세션 전체(읽기·검증 포함) 약 25분
- **Started:** 2026-09-01T15:05:00+09:00 (추정, 최초 파일 읽기 시작)
- **Completed:** 2026-09-01T15:20:00+09:00
- **Tasks:** 3/3 자동화 태스크 완료 (Task 4는 체크포인트, 아래 참고)
- **Files modified:** 6 (신규 3, 수정 3)

## Accomplishments

- **pglite-runtime.ts**: `@electric-sql/pglite@0.5.8`을 CDN ESM에서 간접 dynamic import(`new Function('u','return import(u)')`)로 지연 로드. package.json 불변, 정적 import 0개. module-scope 단일 인스턴스 + Promise 캐시로 셋업→쿼리가 같은 PGlite 인스턴스에서 지속(Pyodide의 "블록마다 새 네임스페이스"와 정반대). Postgres 예외는 삼키지 않고 message 원문을 그대로 돌려준다.
- **run-sql.tsx**: run-python.tsx 골격을 그대로 복제(실행/고쳐 보기/원래대로, `.btn`/`.btn-action`/`.code-editor` 클래스, `data-print-hide`). 출력만 다르다 — `runSql`이 돌려준 결과 배열을 순서대로 렌더해, `fields.length > 0`이면 HTML 표(`overflow-x-auto`로 감쌈), 0이면 "실행 완료 (N행 영향)" 상태 메시지. 여러 statement(JOIN 비교 블록의 SELECT 2개)는 표/메시지가 순서대로 이어서 뜬다.
- **mdx-content.tsx**: `defaultComponents`에 `RunSQL` 매핑 추가.
- **1-4-sql-queries-and-joins.mdx**: "4. 실무 예제"의 셋업 블록 + 조회 + JOIN 비교(SELECT 2개) + 집계 + 서브쿼리 + "해보기" 정답 3개(`<details>` 안) 총 8개 SQL 블록을 `<RunSQL>`로 래핑. "5. 실무 팁"의 teardown `DROP SCHEMA` 블록은 계획대로 제외(실행하면 이후 재실행에 다시 셋업이 필요해짐). 섹션 도입부에 "먼저 셋업을 누르라"는 안내 문장 추가(길이 게이트(L7, 200자) 위반을 피하기 위해 별도 문단으로 분리).
- **globals.css**: `.prose [data-run-output] table`에 `margin: 0` — @tailwindcss/typography 기본 표 상하 여백이 패널 안에서 과한 것을 제거. 리터럴 색·임의값 0.
- **e2e-sql-run.mjs**: e2e-code-run.mjs 골격 복제, 포트 3217. 판정 5건 — A1(0바이트 계약) / A2(셋업 성공) / A3(쿼리 표 렌더 + 셋업 데이터 결정적 셀 "박서연"·"김지현" — 지속 인스턴스 증명) / A4(터치 타깃 44px+) / A5(존재하지 않는 표 SQL → "does not exist" 원문 표시). **실제 실행 5/5 통과.**

## Task Commits

각 태스크는 원자적으로 커밋되었다:

1. **Task 1: PGlite 지연 로드 런타임** - `04ddab6` (feat)
2. **Task 2: RunSQL 컴포넌트 + MDX 매핑 + 레슨 블록 래핑 + 출력 표 스타일** - `d087df5` (feat)
3. **Task 3: e2e-sql-run.mjs 게이트 신설 + 회귀 확인** - `0227741` (test)

_Task 4(체크포인트)는 iPad 실기기 UAT — 아래 "Next Phase Readiness" 참고, 자동 진행하지 않고 대기 상태로 둠._

## Files Created/Modified

- `src/lib/pglite-runtime.ts` (신규) - PGlite 지연 로드 런타임, module-scope 단일 인스턴스 + Promise 캐시
- `src/components/run-sql.tsx` (신규) - 실행 UI + statement별 결과 표/상태 메시지 렌더
- `scripts/e2e-sql-run.mjs` (신규) - 5건 판정 e2e 게이트(포트 3217)
- `src/components/mdx-content.tsx` (수정) - `RunSQL` defaultComponents 매핑 추가
- `src/content/lessons/step-1/1-4-sql-queries-and-joins.mdx` (수정) - 실무 예제 8개 SQL 블록 `<RunSQL>` 래핑 + 안내 문단
- `src/app/globals.css` (수정) - `[data-run-output] table` prose 여백 오버라이드

## Decisions Made

- PGlite 버전 `0.5.8` 고정, CDN URL 이동 표적(`latest`) 금지 — 배포 후 콘텐츠가 조용히 바뀌지 않게 함. `curl -sI`로 200·`x-jsd-version: 0.5.8` 확인 완료.
- 출력 결과 표는 mdx-content.tsx의 `TableWrapper`(MDX 자체 표용)를 재사용하지 않고 run-sql.tsx가 직접 렌더 — 런타임 결과는 MDX 컴파일 트리 밖의 데이터라 별도 렌더 경로가 필요했음. 다만 같은 "가로 스크롤 래퍼" 원칙은 그대로 따름.
- teardown DROP SCHEMA 블록은 계획대로 `<RunSQL>` 밖에 남겨둠 — 실행하면 이후 쿼리 재실행마다 다시 셋업이 필요해져 인터랙티브 실행 대상으로 부적합.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] 섹션 도입부 안내 문장이 L7(문단 200자) 게이트를 초과**
- **Found during:** Task 2 (레슨 MDX 래핑) 검증 단계 (`node scripts/check-lesson-structure.mjs`)
- **Issue:** 계획이 요구한 "셋업 먼저 실행하라" 안내 문장을 기존 문단에 이어 붙였더니 228자로 200자 상한(L7)을 넘김
- **Fix:** 한 문단을 두 문단으로 분리(기존 셋업 설명 + 신규 실행 안내) — 내용은 그대로, 문단 경계만 추가
- **Files modified:** src/content/lessons/step-1/1-4-sql-queries-and-joins.mdx
- **Verification:** `node scripts/check-lesson-structure.mjs` 재실행 → 35개 레슨 7개 검사 전부 통과
- **Committed in:** d087df5 (Task 2 커밋에 포함)

**2. [Rule 3 - Blocking] 워크트리에 node_modules·.env.local 부재**
- **Found during:** Task 1 검증(`npx tsc --noEmit`) 및 Task 3 e2e 실행 직전
- **Issue:** git worktree는 node_modules를 공유하지 않고, `.env.local`은 gitignore 대상이라 워크트리에 복사되지 않음 — 둘 다 없으면 tsc/velite/e2e 게이트 실행 자체가 불가능
- **Fix:** `npm ci`로 워크트리에 의존성 설치, 메인 체크아웃의 `.env.local`을 워크트리로 복사(내용 수정 없이 파일만 복사, git에 커밋되지 않음 — gitignore 대상 그대로 유지)
- **Files modified:** 없음(node_modules, .env.local 모두 gitignore 대상, 커밋에 포함되지 않음)
- **Verification:** `npx tsc --noEmit`, `node node_modules/velite/bin/velite.js build --clean`, `node --env-file=.env.local scripts/e2e-sql-run.mjs` 모두 정상 실행 확인
- **Committed in:** 해당 없음(환경 설정, 커밋 대상 아님)

---

**Total deviations:** 2 auto-fixed (1 blocking 콘텐츠 게이트, 1 blocking 환경 설정)
**Impact on plan:** 둘 다 계획 범위 밖의 환경/게이트 이슈였고 코드 로직에는 영향 없음. Scope creep 없음.

## Issues Encountered

없음 — 계획된 3개 자동 태스크 모두 첫 시도에 verify 기준을 충족했다(재시도 없이 통과).

## User Setup Required

None - 외부 서비스 설정 불필요. PGlite는 브라우저 안 in-memory 인스턴스라 Supabase나 다른 인프라와 무관.

## Next Phase Readiness

**Task 4(체크포인트, 미완료 — 실행자가 처리할 수 없음):**

이 플랜은 `type="checkpoint:human-verify" gate="blocking"`인 iPad 실기기 UAT로 끝난다. 실행자(코딩 에이전트)는 실제 iPad Safari에서 터치·WASM 메모리·화면 대비를 확인할 수 없으므로, 자동화 가능한 Task 1~3(런타임·컴포넌트·e2e 게이트)만 완료하고 여기서 멈춘다.

**사용자가 확인해야 할 것** (계획 원문 `<how-to-verify>` 그대로):
1. `/lesson/1-4-sql-queries-and-joins`를 프로덕션 또는 dev에서 열고 "4. 실무 예제"까지 스크롤
2. 셋업 블록 [실행] → 첫 실행은 WASM 다운로드로 수 초~십수 초, "실행 완료" 상태가 뜨는지, 탭이 죽지 않는지
3. 조회/JOIN/집계/서브쿼리 블록을 차례로 실행 → 결과 표가 뜨는지(JOIN 비교는 표 2개), 표만 가로 스크롤되는지
4. "고쳐 보기"로 SQL을 고쳐 실행 → 반영되는지, 셋업 전 쿼리 실행 시 Postgres 에러가 뜨는지
5. 버튼 터치 타깃(44px+), 라이트/다크·세로/가로 모드에서 표·버튼·출력 상자 대비

**승인 시:** SQL 레슨 3편 확장(1-4의 나머지 SQL 레슨들)이 다음 자연스러운 단계 — Python 파일럿(260901-iqk)이 승인 후 확장(260901-etq)으로 이어진 것과 같은 패턴.

**막힘/우려 없음** — 코드 수준 검증(정적 게이트 4종 + e2e 5건 + 회귀 4종)은 전부 통과. 유일한 미지수는 iPad 실기기의 WASM 메모리 압박(threat T-KSV-03, disposition: mitigate — 소규모 데이터셋으로 범위를 좁혀둠)이며, 이는 실기기 UAT 없이는 코드로 증명할 수 없다.

---
*Phase: quick-260901-ksv*
*Completed: 2026-09-01*
