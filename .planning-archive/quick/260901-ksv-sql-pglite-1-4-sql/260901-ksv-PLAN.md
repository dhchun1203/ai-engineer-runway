---
phase: quick-260901-ksv
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/pglite-runtime.ts
  - src/components/run-sql.tsx
  - src/components/mdx-content.tsx
  - src/content/lessons/step-1/1-4-sql-queries-and-joins.mdx
  - src/app/globals.css
  - scripts/e2e-sql-run.mjs
autonomous: false
requirements:
  - SQL-PILOT-1
estimate:
  tokens: 72000
  raw_tokens: 45000
  tasks: 3
  confidence: med
must_haves:
  truths:
    - "레슨을 열고 [실행]을 누르기 전에는 PGlite가 로드되지 않는다 — cdn.jsdelivr.net 요청 0건, package.json 불변(npm 의존성 0)."
    - "셋업 블록 [실행] → practice 스키마·표가 만들어지고 '실행 완료' 상태 메시지가 뜬다."
    - "쿼리 블록 [실행] → 결과가 HTML 표(컬럼 헤더 + 행)로 렌더된다. 셋업이 같은 인스턴스에 지속되어 쿼리 블록이 그 표를 참조한다(module-scope singleton)."
    - "잘못된 SQL 또는 셋업 전 쿼리 → Postgres 에러 메시지가 출력 영역에 그대로 표시된다."
    - "버튼 터치 타깃 44px 이상, 표는 가로 스크롤(overflow-x-auto), 라이트/다크 모두 크림 패널 위에서 정상 대비."
    - "RunSQL 편집기의 SQL은 브라우저 안 임시 in-memory PGlite에서만 실행된다 — 실제 Supabase DB·진도 데이터와 완전히 격리."
  artifacts:
    - src/lib/pglite-runtime.ts
    - src/components/run-sql.tsx
    - scripts/e2e-sql-run.mjs
    - "src/components/mdx-content.tsx (RunSQL 매핑)"
    - "src/content/lessons/step-1/1-4-sql-queries-and-joins.mdx (블록 <RunSQL> 래핑)"
    - "src/app/globals.css (출력 표 .prose 스코프 오버라이드)"
  key_links:
    - "mdx-content.tsx defaultComponents의 RunSQL 매핑 — 없으면 MDX의 <RunSQL> 태그가 렌더되지 않는다."
    - "velite build --clean 재생성 — .velite 캐시가 stale하면 새 태그가 dev에 안 뜬다."
    - "dynamic import의 정적 분석 우회(간접 import) — 번들 0바이트/실행 전 미로드 계약의 핵심."
    - "module-scope singleton PGlite 인스턴스 — 셋업 → 쿼리 지속의 핵심(Pyodide 블록별 격리와 반대)."
---

<objective>
1-4-sql-queries-and-joins 레슨의 "실무 예제" SQL 블록을 브라우저 안에서 직접 실행하게 만든다. 이미 배포·아이패드 승인된 Python(Pyodide) 파일럿을 그대로 미러링하되, 런타임은 PGlite(WASM Postgres)로 바꾸고 두 가지를 달리 한다: (1) 블록마다 격리가 아니라 **페이지 단위 단일 인스턴스**로 지속(셋업 한 번 → 쿼리 여러 번), (2) 출력은 stdout 텍스트가 아니라 **결과 HTML 표**.

Purpose: 아이패드가 주 기기인 학습자가 SQL 예제를 "읽고 → 그 자리에서 실행 → 결과 표 확인"까지 페이지를 떠나지 않고 할 수 있게 한다. 이번엔 SQL 레슨 1편만 실증하는 파일럿이고, 나머지 SQL 레슨 3편은 승인 후 확장이다.

Output: pglite-runtime.ts(지연 로드 런타임) + run-sql.tsx(실행 UI + 표 렌더) + mdx-content.tsx 매핑 + 레슨 MDX 래핑 + globals.css 출력 표 오버라이드 + e2e-sql-run.mjs 게이트. 아이패드 실기기 UAT는 사용자 체크포인트로 기록.
</objective>

<execution_context>
@$HOME/.claude/gsd-core/workflows/execute-plan.md
@$HOME/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.claude/CLAUDE.md

# 미러링 대상 — 이 구조를 그대로 따른다(재사용 아님, 복제)
@src/lib/pyodide-runtime.ts
@src/components/run-python.tsx
@src/components/mdx-content.tsx
@scripts/e2e-code-run.mjs

# 편집 대상
@src/content/lessons/step-1/1-4-sql-queries-and-joins.mdx
@src/app/globals.css
</context>

<tasks>

<task type="auto">
  <name>Task 1: PGlite 지연 로드 런타임 (src/lib/pglite-runtime.ts)</name>
  <files>src/lib/pglite-runtime.ts</files>
  <read_first>src/lib/pyodide-runtime.ts — 이 파일의 골격(버전 상수 고정, 최소 타입 선언, 전용 LoadError 클래스, module-scope Promise 캐시 + 실패 시 캐시 비움, 단일 진입 함수)을 그대로 복제한다. 차이는 (a) script 주입이 아니라 dynamic import(ESM), (b) 블록별 새 네임스페이스가 아니라 지속 단일 인스턴스, (c) 출력이 텍스트가 아니라 결과 객체.</read_first>
  <action>
PGlite를 CDN ESM으로 지연 로드하는 런타임 모듈을 만든다. package.json은 절대 건드리지 않는다 — @electric-sql/pglite는 npm 의존성이 아니고 정적 import도 쓰지 않는다.

버전은 고정한다(pyodide-runtime.ts의 PYODIDE_VERSION 전례): 상수 `PGLITE_VERSION = '0.5.8'`, CDN URL `https://cdn.jsdelivr.net/npm/@electric-sql/pglite@0.5.8/+esm`. 실행자는 dynamic import 시점에 이 URL이 200을 주고 named export `PGlite`를 노출하는지 최종 확인한다(200 확인됨; 정확한 서브패스가 다르면 `/dist/index.js` 형태로 대체). 이동 표적(`latest`) 금지 — 배포 후 내용이 조용히 바뀌면 사이트가 고장 난다.

번들러 정적 분석을 우회한다(실행 전 0바이트 계약의 핵심): 지정자를 빌드 타임에 분석 불가능하게 만들기 위해 간접 dynamic import를 쓴다 — `const dynamicImport = new Function('u', 'return import(u)')` 형태로 URL을 변수로 넘겨 import한다. Next 16(Turbopack)에서 이 지정자가 번들 그래프에 들어가면 실행 전 0바이트가 깨진다. 간접 import가 실패하는 환경 대비로 매직 코멘트(`/* webpackIgnore: true */`, `/* turbopackIgnore: true */`)도 병기할 수 있으나, 간접 import를 1순위로 한다.

PGlite의 공식 타입 선언이 이 저장소엔 없으므로(패키지 미설치), 이 모듈이 실제로 쓰는 표면만 최소로 선언한다(pyodide-runtime.ts의 최소 interface 선언 전례): 생성자 `new PGlite()`, `waitReady: Promise<void>`, `exec(sql: string): Promise<Array<PGliteResults>>` — 여기서 PGliteResults는 `{ rows: Array<Record<string, unknown>>; fields: Array<{ name: string; dataTypeID: number }>; affectedRows?: number }`. exec는 여러 statement를 순서대로 실행하고 statement별 결과 배열을 돌려준다(셋업 블록의 여러 DDL/DML, JOIN 비교 블록의 SELECT 2개를 한 번에 처리하는 핵심).

전용 에러 클래스 `PGliteLoadError extends Error`(PyodideLoadError 전례) — CDN/로드 실패와 SQL 실행 실패를 run-sql.tsx가 instanceof로 갈라 다른 문구를 내게 한다.

module-scope 단일 인스턴스 + Promise 캐시: `let pglitePromise: Promise<PGliteInterface> | null = null`. `getPglite()`가 없으면 한 번만 `new PGlite()` 후 `await db.waitReady`까지 마치고 캐시한다. **Pyodide와 정반대로 인스턴스를 재사용하고 지속한다** — SQL 레슨은 "셋업 한 번 → 쿼리 여러 번"이 실제 워크플로이고 레슨 본문이 그렇게 쓰여 있어(셋업 블록이 스키마를 만들고 쿼리 블록들이 그 표를 참조), 지속 인스턴스라야 셋업 후 쿼리가 동작한다. 실패한 Promise는 캐시에서 비워 재시도 가능하게 한다(pyodide-runtime의 catch로 null 복원 전례).

단일 진입점 `runSql(sql: string): Promise<{ results: PGliteResults[]; error: string | null }>`: getPglite() 실패는 PGliteLoadError로 throw(런타임 로드 실패). `db.exec(sql)` 성공 시 `{ results, error: null }`. Postgres 예외(relation does not exist, syntax error 등)는 삼키지 않고 message 원문을 `{ results: [], error: message }`로 돌려준다 — 셋업 전 쿼리/오타 SQL의 진짜 Postgres 에러를 교육적으로 그대로 보여주기 위함.
  </action>
  <verify>
    <automated>npx tsc --noEmit</automated>
  </verify>
  <done>pglite-runtime.ts가 타입 통과. package.json 불변(git diff package.json 비어 있음). 정적 import 문 0개, 정적 분석 불가능한 간접 dynamic import로 CDN ESM을 지연 로드. runSql/getPglite/PGliteLoadError export.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: RunSQL 컴포넌트 + MDX 매핑 + 레슨 블록 래핑 + 출력 표 스타일</name>
  <files>src/components/run-sql.tsx, src/components/mdx-content.tsx, src/content/lessons/step-1/1-4-sql-queries-and-joins.mdx, src/app/globals.css</files>
  <read_first>src/components/run-python.tsx(UI 골격·상태·버튼·extractSourceCode를 그대로 복제), src/content/lessons/step-1/1-3-python-variables-and-types.mdx(레슨 안에서 코드 블록을 <RunPython>으로 감싸는 정확한 MDX 문법 — 이걸 <RunSQL>로 미러링), src/app/globals.css 1620~1692(출력/편집기 스타일)·1387~1412(.prose table 규칙)·1674~1679(.prose 스코프로 typography 기본 pre 배경을 이기는 오버라이드 패턴).</read_first>
  <action>
**run-sql.tsx** — run-python.tsx를 복제하되 출력 렌더만 바꾼다. 'use client'. extractSourceCode([data-line] textContent 이어붙이기)를 그대로 재사용. staticBlockRef, status 상태(idle/loading/running/done/error-load/error-run), 실행/고쳐 보기/원래대로 버튼, `.btn`·`.btn-action`·`.tap-feedback`·`.code-editor` 클래스, [data-print-hide] 래퍼를 그대로 쓴다. 최상위 래퍼는 `data-run-sql`(RunPython의 data-run-python 대응), 실행 버튼은 `data-run`, 출력 패널은 `.panel` + `data-run-output`. 상태 문구는 SQL용 한국어로("SQL 실행 환경을 준비하는 중이에요…", "처음 실행은 SQL 환경을 내려받느라 시간이 걸려요" 등). 로드 실패 문구·다시 시도 버튼은 RunPython과 동일 구조(PGliteLoadError instanceof 분기). 로드 에러 문구는 "SQL 실행 환경을 불러오지 못했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요."

출력 렌더(Python과 다른 핵심): runSql이 돌려준 `results` 배열을 **순서대로** 렌더한다. 각 result에 대해 — fields.length > 0 이면 결과 HTML 표를 그린다(thead에 fields[].name 컬럼 헤더, tbody에 rows 각 행; 셀 값은 String(value), null은 muted "NULL"로 표시). fields.length === 0(DDL/DML: CREATE/INSERT/DROP)이면 표 대신 상태 메시지 한 줄(예: affectedRows가 있으면 "실행 완료 (N행 영향)", 없으면 "실행 완료"). 여러 statement가 있으면 각 result를 순서대로 표/메시지로 이어 보여준다(JOIN 비교 블록의 SELECT 2개 → 표 2개). 표는 아이패드 가로 스크롤을 위해 각 표를 `overflow-x-auto` div로 감싼다(mdx-content.tsx TableWrapper와 같은 원칙). error(Postgres 예외)일 때는 표 없이 `.code-output-text .code-output-error` pre에 message 원문을 그대로 출력(RunPython의 error-run 경로와 같은 상자).

**임의값 금지(check-design-tokens 규칙 c)**: h-[44px]/bg-slate-100 류 arbitrary Tailwind 클래스나 기본 팔레트 색 유틸리티를 쓰지 않는다. 색·크기는 globals.css 클래스(.panel/.btn-action/.code-output-text 등)와 기존 토큰 조합으로만.

**mdx-content.tsx** — defaultComponents에 `RunSQL: RunSQL as ComponentType` 매핑을 추가하고 상단에서 import한다(RunPython 매핑 바로 옆). 이 매핑이 없으면 MDX의 <RunSQL> 태그가 렌더되지 않는다.

**레슨 MDX 래핑** — src/content/lessons/step-1/1-4-sql-queries-and-joins.mdx "4. 실무 예제" 섹션에서 다음 sql 코드 블록을 각각 <RunSQL>…</RunSQL>로 감싼다(1-3 레슨의 <RunPython> 래핑 문법을 그대로 미러링): 셋업 블록(197~237), 조회(241~247), JOIN 비교(251~265, SELECT 2개), 집계(269~277), 서브쿼리(281~289), 그리고 "해보기" 3개의 정답 sql 블록(300~306, 319~325, 338~348 — <details> 안이라도 래핑 가능, 셋업 데이터에 의존하는 자족 쿼리라 실행 가치 있음). **제외**: "5. 실무 팁"의 teardown DROP 블록(361~365)은 감싸지 않는다 — 실행하면 practice 스키마가 지워져 이후 쿼리 재실행에 다시 셋업이 필요해지므로 인터랙티브 실행 대상으로 부적합. 또 섹션 도입부(라인 195 안내문 근처)에 한 줄 추가: 먼저 셋업 블록의 실행을 누른 뒤 아래 쿼리를 실행하라는 것, 셋업 전에 쿼리를 누르면 표가 아직 없다는 Postgres 에러가 난다는 것을 한국어로 안내(CLAUDE.md 브랜딩 HARD RULE의 금지 교육기관명을 문안에 절대 쓰지 않는다).

**globals.css** — 출력 패널 안 결과 표가 라이트 모드에서 어둡게 뜨거나 prose 기본 여백으로 어긋나지 않도록 `.prose` 스코프 오버라이드를 추가한다(방금 .code-output-text에서 고친 패턴, 1674~1679 근처). 최소한: 출력 영역(data-run-output) 안 table의 prose 기본 상하 margin을 0으로, 표 배경이 .panel 크림 위에서 정상 대비가 되게(.prose table/thead th 규칙은 이미 토큰 기반이라 대개 그대로 OK — 실측 후 필요한 부분만). 색 리터럴·임의값 없이 기존 토큰만. 이 블록에도 금지 교육기관명 주석을 넣지 않는다.
  </action>
  <verify>
    <automated>node node_modules/velite/bin/velite.js build --clean && node scripts/check-design-tokens.mjs && node scripts/check-brand.mjs && node scripts/check-lesson-structure.mjs && npm run lint</automated>
  </verify>
  <done>velite --clean 재생성 성공, .velite/lessons.json의 1-4 레슨 컴파일 코드에 RunSQL이 들어감. check-design-tokens(임의값·리터럴 색 0), check-brand(금지 브랜드 문자열 0), check-lesson-structure, lint 전부 통과. mdx-content.tsx defaultComponents에 RunSQL 매핑 존재.</done>
</task>

<task type="auto">
  <name>Task 3: e2e-sql-run.mjs 게이트 신설 + 회귀 확인</name>
  <files>scripts/e2e-sql-run.mjs</files>
  <read_first>scripts/e2e-code-run.mjs — 이 파일의 골격을 그대로 복제한다(환경 변수 선검증, assertLessonExists, FatalError, waitForServerReady, killServerTree, next dev spawn, 위반 누적 후 일괄 보고, 0 아닌 종료 코드). 저장소 게이트 원칙: 공유 모듈로 빼지 않고 복제.</read_first>
  <action>
e2e-code-run.mjs를 복제해 e2e-sql-run.mjs를 만든다. 포트는 빈 번호 3217(3210~3216이 이미 선점). LESSON_SLUG = '1-4-sql-queries-and-joins', 라우트 `/lesson/1-4-sql-queries-and-joins`. 셀렉터는 `#lesson-article`, `[data-run-sql]`, `[data-run]`, `[data-run-output]`. 뷰포트 768×1024(아이패드 세로). 첫 실행은 CDN에서 PGlite WASM을 내려받아 느리므로 RUN_TIMEOUT은 2분 이상 유지. 환경 변수 선검증(SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY/UNLOCK_SECRET)과 assertLessonExists(.velite/lessons.json에서 슬러그 확인)를 그대로 가져온다. 어떤 출력에도 쿠키·시크릿을 찍지 않는다.

판정 5건:
- A1 0바이트 계약 — 레슨을 networkidle까지 열었을 때(실행 버튼 누르기 전) cdn.jsdelivr.net 호스트로 나간 요청 0건.
- A2 셋업 성공 — 첫 [data-run-sql]의 [data-run](셋업 블록) 클릭 후 [data-run-output]에 성공 상태 메시지("실행 완료" 계열)가 나타난다(RUN_TIMEOUT 여유).
- A3 쿼리 표 렌더(지속 인스턴스 증명) — 조회 블록의 [data-run] 클릭 후 [data-run-output] 안에 table이 생기고, 셋업 데이터에서만 나올 수 있는 결정적 셀 텍스트가 표에 있다(예: "박서연", "김지현"). 이는 셋업이 같은 인스턴스에 지속돼 practice.students를 참조함을 증명한다.
- A4 터치 타깃 — [data-run-sql] 안 button 전부 높이 44px 이상.
- A5 Postgres 에러 표시 — "고쳐 보기"로 textarea를 존재하지 않는 표를 참조하는 SQL(예: `SELECT * FROM practice.nonexistent_xyz;`)로 교체 후 실행 → 출력 영역에 Postgres 에러 문구(예: "does not exist")가 그대로 보인다.

게이트 작성 후 실제로 실행해 5건 통과를 확인한다. 이어 기존 게이트 회귀 없음을 확인한다(전 파일 스캔 게이트).
  </action>
  <verify>
    <automated>node --env-file=.env.local scripts/e2e-sql-run.mjs && node --env-file=.env.local scripts/e2e-code-run.mjs && node scripts/check-lesson-structure.mjs && node scripts/check-design-tokens.mjs && node scripts/check-brand.mjs</automated>
  </verify>
  <done>e2e-sql-run.mjs 5건 전부 통과. 기존 e2e-code-run(Python 회귀)·check-lesson-structure·check-design-tokens·check-brand 회귀 없음. 포트 3217 사용(충돌 없음).</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>1-4 SQL 레슨(1-4-sql-queries-and-joins) "실무 예제"의 SQL 블록에 브라우저 안 실행 버튼을 붙였다. 셋업 블록을 한 번 실행하면 in-memory Postgres(PGlite, WASM)에 practice 스키마가 만들어지고, 아래 쿼리 블록들을 누르면 결과가 표로 뜬다. 실행 전에는 PGlite를 내려받지 않고(npm 의존성 0), SQL은 실제 Supabase가 아니라 브라우저 안 임시 DB에서만 돈다.</what-built>
  <how-to-verify>
아이패드 사파리 실기기에서 확인한다(PGlite도 WASM이라 아이패드 메모리·터치 실측 필요 — Python 파일럿과 별개 런타임):
1. 프로덕션 또는 dev 서버에서 `/lesson/1-4-sql-queries-and-joins` 열기. "4. 실무 예제"까지 스크롤.
2. 셋업 블록의 [실행]을 누른다 → 첫 실행은 수 초~십수 초(WASM 다운로드) 후 "실행 완료" 상태가 뜨는지. 앱이 멈추거나 메모리 경고로 탭이 죽지 않는지.
3. 그 아래 조회/JOIN/집계/서브쿼리 블록의 [실행]을 차례로 누른다 → 각각 결과 표가 뜨는지. JOIN 비교 블록은 표 2개가 순서대로 뜨는지. 표가 화면 폭을 넘으면 표만 가로로 스크롤되는지(페이지 전체가 밀리지 않아야).
4. "고쳐 보기"로 SQL을 고쳐 실행 → 반영되는지. 셋업 전에 쿼리 블록을 먼저 눌러 보고(또는 오타 SQL) Postgres 에러가 상자에 뜨는지.
5. 실행/고쳐 보기/원래대로 버튼이 손가락으로 편하게 눌리는지(44px+). 라이트/다크, 세로/가로 모드 모두 표·버튼·출력 상자가 크림 패널 위에서 정상으로 보이는지.
</how-to-verify>
  <resume-signal>"승인" 또는 발견한 문제(어느 단계에서 무엇이)를 구체적으로 알려주세요.</resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| browser → jsDelivr CDN | 브라우저가 실행 시점에 서드파티 CDN에서 PGlite ESM+WASM을 받아 실행한다(Pyodide 파일럿과 같은 경계). |
| RunSQL 편집기 → in-memory PGlite | 사용자가 편집기에 넣은 임의 SQL. **실제 Supabase DB가 아니라 브라우저 안 휘발성 in-memory Postgres에서만 실행** — 진도 테이블·프로덕션 데이터에 도달 불가. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-KSV-01 | Tampering | jsDelivr CDN의 PGlite ESM/WASM | medium | mitigate | 버전 고정(@electric-sql/pglite@0.5.8) — jsDelivr의 버전 경로 세그먼트는 불변이라 배포 후 받는 바이트가 조용히 바뀌지 않는다(pyodide-runtime의 PYODIDE_VERSION 전례, T-IQK-01과 동일 완화). `latest` 금지. |
| T-KSV-02 | Elevation of Privilege | RunSQL 편집기의 임의 SQL | low | accept | in-memory PGlite는 프로세스 밖(실제 Supabase)과 연결이 없다 — 임의 SQL로 프로덕션 데이터에 도달할 수 없다. 편집·실행은 교육 목적의 의도된 기능. RLS·진도 저장 경로에 영향 없음(별 인스턴스). |
| T-KSV-03 | Denial of Service | 아이패드 WASM 메모리 | low | mitigate | 범위를 SQL 레슨 1편·소규모 데이터(학생 3·수강 5행)로 한정. 아이패드 실기기 UAT 체크포인트에서 메모리·탭 안정성 실측(sklearn을 제외했던 파일럿 제약과 같은 이유). |
</threat_model>

<verification>
- 실행 전 0바이트: e2e-sql-run A1(cdn.jsdelivr.net 요청 0건) + `git diff package.json` 비어 있음.
- 지속 인스턴스: e2e-sql-run A2(셋업 성공) → A3(쿼리 표에 셋업 데이터 셀). 두 판정이 같은 페이지에서 순서대로 통과해야 지속 인스턴스가 증명된다.
- 정적 게이트 전부 통과: check-lesson-structure, check-design-tokens(임의값·리터럴 색 0), check-brand(금지 브랜드 문자열 0).
- 회귀 없음: e2e-code-run.mjs(Python 파일럿)이 그대로 통과.
- velite --clean 재생성 후 .velite/lessons.json 1-4 컴파일 코드에 RunSQL 포함.
</verification>

<success_criteria>
- 1-4-sql-queries-and-joins 레슨의 실무 예제 SQL 블록(셋업 + 4 쿼리 + 해보기 3)이 <RunSQL>로 감싸져 페이지 안에서 실행된다.
- 셋업 [실행] → 성공 상태, 쿼리 [실행] → 결과 HTML 표, 잘못된/셋업 전 SQL → Postgres 에러 원문.
- e2e-sql-run.mjs 5건 통과, 기존 게이트 회귀 0.
- package.json 불변(npm 의존성 0), 실행 전 CDN 요청 0.
- 아이패드 실기기 UAT 사용자 승인.
</success_criteria>

<output>
Create `.planning/quick/260901-ksv-sql-pglite-1-4-sql/260901-ksv-SUMMARY.md` when done
</output>
