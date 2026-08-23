---
phase: 01-deployed-curriculum-skeleton
plan: 03
subsystem: content
tags: [velite, curriculum-manifest, mdx, typescript, invariant-gate]

# Dependency graph
requires:
  - phase: 01-deployed-curriculum-skeleton (Plan 01)
    provides: "Velite lessons 컬렉션 스키마(title/stepId/moduleId/order/depth/estimatedMinutes/slug/hasContent/code), 파일럿 레슨 1"
provides:
  - "3 Step 메타 + 19 모듈 정적 데이터 (src/content/modules.ts: steps, modules exports)"
  - "매니페스트 조회·전역 정렬·인접 레슨 계산 헬퍼 7종 (src/content/curriculum-helpers.ts) — Plan 04의 브레드크럼/이전-다음 버튼 입력"
  - "35행 확정 커리큘럼 매니페스트 (파일럿 1 + 신규 34개 메타데이터 행)"
  - "의존성 0 매니페스트 불변식 검증 게이트 (scripts/check-manifest.mjs, 11종)"
affects: ["01-04", "01-05", "01-06"]

actuals:
  tokens: 9320
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "modules.ts는 소거 가능한 TypeScript(interface/type/as const/일반 export)만 사용 — check-manifest.mjs가 정규식으로 id 리터럴을 추출하는 계약 유지"
    - "전역 정렬 키 (stepId, module.order, lesson.order) 3단 — 조합이 유일해 동률 없음, curriculum-helpers.ts와 check-manifest.mjs가 동일 규칙을 각자 구현"
    - "고아 레슨(모듈 미매칭)은 조용히 건너뛰지 않고 예외를 던져 빌드 실패로 드러남"
    - "34개 메타데이터 행은 표 데이터를 JSON으로 옮긴 뒤 일회성 생성 스크립트(스크래치패드, 저장소에 미포함)로 일괄 작성 — 파일마다 손으로 다른 판단을 내리지 않음"

key-files:
  created:
    - src/content/modules.ts
    - src/content/curriculum-helpers.ts
    - scripts/check-manifest.mjs
    - src/content/lessons/step-1/1-1-course-orientation.mdx
    - src/content/lessons/step-1/1-1-dev-environment-setup.mdx
    - src/content/lessons/step-1/1-2-git-branch-and-pr.mdx
    - src/content/lessons/step-1/1-2-generative-ai-basics.mdx
    - src/content/lessons/step-1/1-3-python-functions-and-io.mdx
    - src/content/lessons/step-1/1-4-relational-db-basics.mdx
    - src/content/lessons/step-1/1-4-sql-queries-and-joins.mdx
    - src/content/lessons/step-1/1-5-ml-model-types.mdx
    - src/content/lessons/step-1/1-5-ml-metrics-and-pipeline.mdx
    - src/content/lessons/step-2/2-1-postgres-and-supabase.mdx
    - src/content/lessons/step-2/2-1-ai-data-modeling.mdx
    - src/content/lessons/step-2/2-2-html-css-js.mdx
    - src/content/lessons/step-2/2-2-browser-and-ui.mdx
    - src/content/lessons/step-2/2-3-typescript-setup.mdx
    - src/content/lessons/step-2/2-3-react-components.mdx
    - src/content/lessons/step-2/2-4-project-ai-shop-frontend.mdx
    - src/content/lessons/step-2/2-5-express-rest-api.mdx
    - src/content/lessons/step-2/2-5-auth-and-prisma.mdx
    - src/content/lessons/step-2/2-6-project-ai-shop-backend.mdx
    - src/content/lessons/step-2/2-7-prompt-patterns.mdx
    - src/content/lessons/step-2/2-7-promptops.mdx
    - src/content/lessons/step-3/3-1-vector-search-basics.mdx
    - src/content/lessons/step-3/3-1-hybrid-search-reranking.mdx
    - src/content/lessons/step-3/3-2-project-rag-agent.mdx
    - src/content/lessons/step-3/3-3-peft-lora-qlora.mdx
    - src/content/lessons/step-3/3-3-tuning-evaluation.mdx
    - src/content/lessons/step-3/3-4-multi-agent-structure.mdx
    - src/content/lessons/step-3/3-4-webhook-schedule-hitl.mdx
    - src/content/lessons/step-3/3-4-n8n-langgraph.mdx
    - src/content/lessons/step-3/3-5-project-orchestration.mdx
    - src/content/lessons/step-3/3-6-prompt-versioning-eval.mdx
    - src/content/lessons/step-3/3-6-monitoring-governance.mdx
    - src/content/lessons/step-3/3-6-structured-output-canary.mdx
    - src/content/lessons/step-3/3-7-project-ax-launch.mdx
  modified: []

key-decisions:
  - "모듈 title은 curriculum.md의 `### N-M.` 헤더 원문을 그대로 사용 — [Project N] 태그가 붙은 5개 모듈도 태그를 포함한 원문 그대로 옮기고, isProject 불리언이 별도로 프로젝트 여부를 신호"
  - "34개 레슨 메타데이터 행은 표 데이터를 JSON으로 옮긴 뒤 스크래치패드의 일회성 생성 스크립트로 일괄 작성 — 저장소에는 결과 MDX만 커밋, 생성 스크립트 자체는 커밋 대상이 아님(플랜이 요구한 산출물이 아님)"
  - "check-manifest.mjs의 모듈 order 조회는 modules.ts 소스를 별도 정규식 패스로 재파싱 — curriculum-helpers.ts는 런타임에 import로 modules를 참조하지만, 게이트 스크립트는 Velite 빌드와 무관하게 독립 실행 가능해야 하므로 동일 로직을 파일 파싱으로 재구현(의존성 0 요구사항)"

requirements-completed: [CONT-01, CONT-04]

coverage:
  - id: D1
    description: "빌드 후 매니페스트가 정확히 3 Step, 19 모듈, 35 레슨을 공급한다"
    requirement: CONT-01
    verification:
      - kind: unit
        ref: "node scripts/check-manifest.mjs (Invariant 1, 2) — 35 lessons / 19 modules 확인, 실행 완료 exit 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "35개 레슨 전부에 깊이 배지 값과 예상 소요시간이 확정되어 있고, Step 3는 예외 없이 개요, Step 1·2는 예외 없이 심화다"
    requirement: CONT-04
    verification:
      - kind: unit
        ref: "node scripts/check-manifest.mjs (Invariant 3, 4, 5) + Velite s.enum(['심화','개요'])/s.number().min(1) 스키마 자체가 빌드 시점 차단"
        status: pass
    human_judgment: false
  - id: D3
    description: "35개 레슨 예상 소요시간 총합이 7,200~10,800분 범위(Phase 3 일정 배분 입력 제약)"
    verification:
      - kind: unit
        ref: "node scripts/check-manifest.mjs (Invariant 6) — 실측 총합 7,860분, 실행 완료 exit 0"
        status: pass
    human_judgment: false
  - id: D4
    description: "(moduleId, order) 전역 유일, slug 전역 유일, moduleId 집합이 modules.ts와 정확히 일치(고아 없음)"
    verification:
      - kind: unit
        ref: "node scripts/check-manifest.mjs (Invariant 7, 8, 9), 실행 완료 exit 0"
        status: pass
    human_judgment: false
  - id: D5
    description: "hasContent=true 레슨이 정확히 1개(파일럿 1)이고, (stepId, 모듈 order, 레슨 order) 3단 정렬의 첫/마지막이 각각 1-1-course-orientation / 3-7-project-ax-launch"
    verification:
      - kind: unit
        ref: "node scripts/check-manifest.mjs (Invariant 10, 11), 실행 완료 exit 0"
        status: pass
    human_judgment: false
  - id: D6
    description: "금지 브랜드 문자열이 src/content 전체에 0건"
    requirement: "PROJECT.md HARD RULE (D-02)"
    verification:
      - kind: other
        ref: "grep -rIil 'kant' src/content | wc -l → 0"
        status: pass
    human_judgment: false

duration: 약 20분
completed: 2026-08-24
status: complete
---

# Phase 1 Plan 3: 커리큘럼 매니페스트 확정 Summary

**19개 모듈 정적 데이터와 조회·정렬 헬퍼를 만들고, 커리큘럼 원문에서 파생한 34개 레슨 메타데이터 행으로 35행 매니페스트를 완성한 뒤, 그 불변식 11종을 의존성 0 스크립트로 고정했다.**

## Performance

- **Tasks:** 2/2 완료
- **Files created:** 37 (modules.ts, curriculum-helpers.ts, check-manifest.mjs, MDX 34개)
- **Duration:** 약 20분

## Accomplishments

- `src/content/modules.ts`: `Step`/`Module` 타입 + `steps`(3개, courseHours 200/336/520) + `modules`(19개, `isProject: true` 5개 — `2-4`/`2-6`/`3-2`/`3-5`/`3-7`) — 소거 가능한 TypeScript만 사용해 `check-manifest.mjs`의 정규식 파싱 계약을 지킴
- `src/content/curriculum-helpers.ts`: `getStep`/`getModulesByStep`/`getLessonsByModule`/`getOrderedLessons`/`getLessonBySlug`/`getAdjacentLessons`/`getLessonCounts` 7개 export — 전역 정렬 키 (stepId, 모듈 order, 레슨 order) 3단, 고아 레슨은 예외로 빌드 실패
- 34개 비-파일럿 레슨 MDX 메타데이터 행 생성 — Step별 파일 수 10/12/13, 본문은 UI-SPEC Copywriting Contract의 Empty state 문장 1줄
- `scripts/check-manifest.mjs`: `.velite/lessons.json` + `modules.ts`를 입력으로 11개 불변식(레슨 수, 모듈 id 유일성, depth 정책, 시간 총합 범위, moduleId 집합 일치, (moduleId,order)/slug 유일성, hasContent 기대값, 정렬 첫/마지막 앵커)을 검증하는 의존성 0 게이트, 입력 파일 부재 시 즉시 비정상 종료 확인
- `npm run build` + `node scripts/check-manifest.mjs` 모두 통과, `estimatedMinutes` 총합 7,860분(7,200~10,800 범위 내), `src/content` 전체 금지 브랜드 문자열 0건 확인

## Task Commits

Each task was committed atomically:

1. **Task 1: 19개 모듈 정의와 커리큘럼 조회·정렬 헬퍼** - `69bcc76` (feat)
2. **Task 2: 34개 레슨 매니페스트 행 생성과 불변식 검증 게이트** - `c5fdec3` (feat)

## Files Created/Modified

- `src/content/modules.ts` - `Step`/`Module` 타입, `steps`(3), `modules`(19) 정적 데이터
- `src/content/curriculum-helpers.ts` - 매니페스트 조회·전역 정렬·인접 레슨 계산 헬퍼 7종
- `scripts/check-manifest.mjs` - 매니페스트 불변식 11종 자동 검증 (의존성 0)
- `src/content/lessons/step-1/*.mdx` (9개 신규) - Step 1 비-파일럿 레슨 메타데이터
- `src/content/lessons/step-2/*.mdx` (11개 신규) - Step 2 비-파일럿 레슨 메타데이터 (React 컴포넌트 파일럿 2는 Plan 06에서 본문 작성 예정, 이 Plan에서는 다른 33개와 동일하게 `hasContent: false`)
- `src/content/lessons/step-3/*.mdx` (13개 신규) - Step 3 비-파일럿 레슨 메타데이터

## Decisions Made

- 모듈 `title`은 `.planning/curriculum.md`의 `### N-M.` 헤더 원문을 그대로 사용 — `[Project N]` 태그가 붙은 5개 모듈도 태그 포함 원문 그대로 옮기고, 별도의 `isProject` 불리언이 프로젝트 여부를 신호
- 34개 레슨 메타데이터 행은 PLAN의 확정 표를 JSON으로 옮긴 뒤 스크래치패드의 일회성 생성 스크립트로 일괄 작성 — 결과 MDX 34개만 저장소에 커밋, 생성 스크립트 자체는 PLAN이 요구한 산출물이 아니므로 커밋 대상에서 제외
- `check-manifest.mjs`는 `curriculum-helpers.ts`를 import하지 않고 `modules.ts` 소스를 별도 정규식 패스로 재파싱 — Velite 빌드 산출물과 TypeScript 컴파일에 의존하지 않는 순수 Node 스크립트로 만들어 "의존성 0" 요구사항을 지킴(런타임 로직과 검증 로직이 별도 구현이므로 두 곳이 어긋나면 게이트가 잡아냄)
- `2-3-react-components.mdx`(파일럿 2 예정)도 이번 Plan에서는 다른 33개 파일과 동일하게 `hasContent: false` 메타데이터 행으로 생성 — PLAN 지시대로 Plan 06이 D-10 6단 구성 실콘텐츠로 채우고 그때 `hasContent: true`로 승격, `check-manifest.mjs`의 `EXPECTED_HAS_CONTENT_COUNT` 상수도 그때 2로 갱신 필요(스크립트 상단에 기대값 상수로 미리 노출해 둠)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] modules.ts 주석의 "enum" 리터럴이 자기 자신의 검증 게이트를 오탐시킴**
- **Found during:** Task 1 verify (`grep -cE '\benum\b' src/content/modules.ts` 기대값 0)
- **Issue:** "enum/네임스페이스/생성자 파라미터 프로퍼티를 쓰지 않는다"라는 설명 주석에 쓰인 단어 "enum"이 검증 정규식(`\benum\b`)에 그대로 매칭되어, 실제 TypeScript `enum` 키워드는 전혀 없음에도 불변식 카운트가 1로 잡힘
- **Fix:** 주석 문구를 "소거 가능한 TypeScript 구문만 사용한다(네임스페이스, 생성자 파라미터 프로퍼티 금지)"로 바꿔 "enum"이라는 리터럴 단어 없이 동일한 의미를 전달하도록 수정
- **Files modified:** `src/content/modules.ts`
- **Commit:** `69bcc76` (수정 후 커밋 — 별도 수정 커밋 없이 최초 커밋에 반영)

---

**Total deviations:** 1 auto-fixed (Rule 1)
**Impact on plan:** 코드/데이터 산출물은 계획과 완전히 일치. 주석 문구 하나가 자체 검증 정규식과 우연히 충돌한 것을 실행 중 발견해 즉시 수정.

## Issues Encountered

없음 — Task 1의 `npm run build` + 모듈 카운트/export 확인, Task 2의 `npm run build` + `check-manifest.mjs` + 인라인 JS 체크 + Step별 파일 수 + 브랜드 문자열 스캔이 모두 계획된 `<verify>` 그대로 통과함. 입력 파일(`.velite/lessons.json`) 부재 시 게이트가 비정상 종료하는지도 별도로 확인(요구사항 10의 "파일이 없어서 0건이 통과로 둔갑하지 않는다" 조건).

## Known Stubs

- **34개 레슨 본문**: `src/content/lessons/step-{1,2,3}/*.mdx` 중 파일럿 1(`1-3-python-variables-and-types`)을 제외한 34개는 `hasContent: false`이며 본문이 UI-SPEC Copywriting Contract의 Empty state 한 줄뿐이다. 이는 PLAN이 명시적으로 의도한 상태다(D-10/D-11에 따라 파일럿 2편만 본 Phase에서 실콘텐츠 작성 대상이며, 나머지는 Phase 4·5·Plan 06의 범위). 라우트는 실제로 존재하므로 404가 아니다(RESEARCH Pitfall 2 충족).
- **`2-3-react-components.mdx`(파일럿 2)**: 이번 Plan에서는 다른 33개와 동일하게 `hasContent: false`로 생성 — Plan 06이 본문을 채우고 `check-manifest.mjs`의 `EXPECTED_HAS_CONTENT_COUNT`/`EXPECTED_HAS_CONTENT_SLUGS`도 그때 갱신해야 한다(스크립트 상단 주석에 명시해 둠).

## User Setup Required

없음 - 외부 서비스 설정 불필요.

## Next Phase Readiness

- Plan 04(Step/모듈/레슨 라우트 UI)가 `src/content/modules.ts`의 `steps`/`modules`와 `curriculum-helpers.ts`의 7개 조회 함수를 그대로 소비할 수 있음 — 특히 `getAdjacentLessons`는 이전/다음 레슨 버튼(D-08)의 직접 입력
- Phase 3의 일정 배분이 소비할 `estimatedMinutes` 데이터가 총합 제약(7,200~10,800분)을 만족한 상태로 준비됨
- `scripts/check-manifest.mjs`가 이후 모든 Plan의 회귀 게이트로 재사용 가능 — 매니페스트가 깨지면 `npm run build` 직후 바로 드러남
- 블로킹 항목 없음

---
*Phase: 01-deployed-curriculum-skeleton*
*Completed: 2026-08-24*

## Self-Check: PASSED

- FOUND: src/content/modules.ts
- FOUND: src/content/curriculum-helpers.ts
- FOUND: scripts/check-manifest.mjs
- FOUND commit: 69bcc76
- FOUND commit: c5fdec3
- Step MDX counts confirmed on disk: 10 / 12 / 13
