---
phase: 03-schedule-and-today
plan: 02
subsystem: content
tags: [velite, mdx-frontmatter, manifest-gate, korean-content, schedule-input]

# Dependency graph
requires:
  - phase: 03-schedule-and-today (Plan 01)
    provides: today.ts/schedule.ts/schedule-data.ts pure modules that consume estimatedMinutes as their pace input
provides:
  - "35개 레슨 estimatedMinutes가 D-31 기준(총합 4,200분, 분포 150×20/90×10/60×5)으로 하향 확정"
  - "check-manifest.mjs 13개 불변식 게이트 — 총합 등식 검사(Invariant 6), 분포 검사(Invariant 12), (depth, isProject) 파생 규칙 검사(Invariant 13)"
  - "ROADMAP.md/PROJECT.md/REQUIREMENTS.md의 페이스 기준 문구가 D-35(하루 3시간 이내)로 일치"
affects: [03-schedule-and-today (Plan 03: 페이스 판정 computePace가 이 estimatedMinutes를 입력으로 소비), 03-schedule-and-today (Plan 04: 일정표 페이지가 갱신된 분/시간 표기를 렌더)]

# Actuals (#2632)
actuals:
  tokens: 12000
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "estimatedMinutes 목표값은 원본 수치가 아니라 (depth, 소속 모듈 isProject) 두 축에서 파생 계산 — 순차 치환 시 값 공간이 겹쳐 이중 적용되는 사고를 원천 차단"
    - "check-manifest.mjs는 계속 modules.ts를 독립 정규식 재파싱 — curriculum-helpers.ts를 import하지 않는 기존 관례 유지, isProject 추출도 같은 [^}]*? 경계 방식"

key-files:
  created: []
  modified:
    - src/content/lessons/step-1/*.mdx (10개)
    - src/content/lessons/step-2/*.mdx (16개)
    - src/content/lessons/step-3/*.mdx (14개, 실제로는 총 35개 파일)
    - scripts/check-manifest.mjs
    - .planning/ROADMAP.md
    - .planning/PROJECT.md
    - .planning/REQUIREMENTS.md

key-decisions:
  - "estimatedMinutes 파생 규칙: 프로젝트 모듈(2-4/2-6/3-2/3-5/3-7)이면 깊이 무관 60분, 심화·비프로젝트는 150분, 개요·비프로젝트는 90분 — 원본 수치(270/180/150/120) 기반 순차 치환 대신 이 두 축에서 매번 재계산"
  - "check-manifest.mjs Invariant 6을 7200~10800 밴드 검사에서 4200 등식 검사로 교체 — 이후 레슨이 추가되거나 값이 손대지면 밴드 안에서 조용히 통과하는 경로를 없앰"
  - "PROJECT.md Key Decisions 표의 일정표 설계 행에 'D-35로 하향 조정됨' 근거를 병기해 이전 가정이 왜 바뀌었는지 흔적을 남김"

patterns-established:
  - "파생 규칙 상시 검증(Invariant 13)은 개수만 맞고 레슨별 배정이 뒤바뀐 경우까지 잡는 상위 불변식 — 향후 레슨 콘텐츠 집필(Phase 4~5) 중 실수로 값을 바꿔도 즉시 게이트가 걸림"

requirements-completed: [SCHED-03]

coverage:
  - id: D1
    description: "35개 레슨의 estimatedMinutes 총합이 정확히 4,200분(70시간)이고 분포가 150×20/90×10/60×5다"
    requirement: "SCHED-03"
    verification:
      - kind: unit
        ref: "node scripts/check-manifest.mjs (Invariant 6, 12)"
        status: pass
      - kind: other
        ref: "node -e 총합/분포 어설션 (Task 1 automated verify) — 4200, {60:5,90:10,150:20}"
        status: pass
    human_judgment: false
  - id: D2
    description: "각 레슨의 estimatedMinutes가 (depth, 소속 모듈 isProject) 파생 규칙과 정확히 일치한다 — 프로젝트 모듈 60, 심화·비프로젝트 150, 개요·비프로젝트 90"
    requirement: "SCHED-03"
    verification:
      - kind: unit
        ref: "node scripts/check-manifest.mjs (Invariant 13)"
        status: pass
      - kind: other
        ref: "mutation test: 1-1-course-orientation.mdx를 200분으로 임시 변경 → Invariant 6/12/13 동시 실패 확인 후 원복, 재검증 통과"
        status: pass
    human_judgment: false
  - id: D3
    description: "프론트매터 일괄 수정 전후로 title/stepId/moduleId/order/depth/slug/hasContent 값이 35개 레슨 모두에서 동일하고, 본문이 한 글자도 바뀌지 않았다"
    requirement: "SCHED-03"
    verification:
      - kind: other
        ref: "git diff --numstat -- src/content/lessons — 파일당 1 insertion/1 deletion(estimatedMinutes 한 줄)만 확인, 35/35 일치"
        status: pass
    human_judgment: false
  - id: D4
    description: "Velite 재빌드 후 레슨 페이지에 렌더되는 소요시간 문자열이 갱신값이다 — 심화 일반 레슨은 '약 2.5시간', 프로젝트 준비 가이드는 '약 1시간'"
    requirement: "SCHED-03"
    verification:
      - kind: other
        ref: "formatEstimatedTime(150) === '약 2.5시간', formatEstimatedTime(60) === '약 1시간' (estimated-time.tsx 재계산 로직에 .velite/lessons.json 실측값 대입)"
        status: pass
    human_judgment: false
  - id: D5
    description: "check-manifest.mjs가 13개 불변식(총합·분포·파생 규칙 포함)을 상시 검사하고, 임의 변형 시 exit 1로 실패한다"
    verification:
      - kind: unit
        ref: "node scripts/check-manifest.mjs — 성공 출력 '13 invariants passed'"
        status: pass
    human_judgment: false
  - id: D6
    description: "ROADMAP.md/PROJECT.md/REQUIREMENTS.md의 페이스 기준 문구에 '하루 4~6시간'이 남아 있지 않고 D-35 기준으로 갱신됐다"
    verification:
      - kind: unit
        ref: "node -e 4~6시간 grep 검사 (Task 3 automated verify) — 3개 파일 모두 0건"
        status: pass
      - kind: unit
        ref: "node scripts/check-brand.mjs — 79개 파일 위반 없음"
        status: pass
    human_judgment: false
  - id: D7
    description: "하루 1레슨 배정에서 어떤 날의 소요시간도 150분(2.5시간)을 넘지 않아 D-35의 '하루 3시간 이내'를 만족한다"
    verification:
      - kind: other
        ref: "node -e .velite/lessons.json의 estimatedMinutes 최댓값 확인 — 150 (초과 없음)"
        status: pass
    human_judgment: false
  - id: D8
    description: "전체 검증 체인(build, check-manifest, check-schedule, check-progress-math, check-progress-gates, check-brand, e2e-today)이 무회귀로 통과한다"
    verification:
      - kind: e2e
        ref: "node --env-file=.env.local scripts/e2e-today.mjs — 5/5 시나리오 통과"
        status: pass
      - kind: unit
        ref: "check-schedule.mjs(18케이스), check-progress-math.mjs(11케이스), check-progress-gates.mjs — 전부 통과"
        status: pass
    human_judgment: false

# Metrics
duration: ~15min
completed: 2026-08-25
status: complete
---

# Phase 3 Plan 2: 레슨 소요시간 하향과 매니페스트 게이트 강화 Summary

**35개 레슨의 예상 소요시간을 (depth, isProject) 파생 규칙으로 재계산해 총합 4,200분/분포 150×20·90×10·60×5로 하향하고, check-manifest.mjs에 그 규칙을 상시 검증하는 3개 불변식을 추가, 계획 문서 3종의 페이스 기준 문구를 D-35에 맞춰 갱신했다**

## Performance

- **Duration:** ~15min
- **Completed:** 2026-08-25
- **Tasks:** 3/3
- **Files modified:** 39 (35 mdx + check-manifest.mjs + ROADMAP.md + PROJECT.md + REQUIREMENTS.md)

## Accomplishments
- 35개 레슨 프론트매터의 `estimatedMinutes`가 원본 수치(270/180/150/120)가 아니라 (depth, 소속 모듈 isProject) 두 축에서 파생 계산되어 총합 4,200분(70시간), 분포 150×20/90×10/60×5로 하향됐다
- `check-manifest.mjs`가 Invariant 6(총합 정확히 4200 등식), Invariant 12(분포 정확히 일치), Invariant 13((depth, isProject) 파생 규칙 상시 검증) 세 층을 추가해 13개 불변식 게이트가 됐다 — 실제 임의 변형(mutation) 테스트로 세 불변식이 동시에 실패함을 확인한 뒤 원복
- `ROADMAP.md`/`PROJECT.md`/`REQUIREMENTS.md`의 페이스 기준 문구가 "하루 4~6시간"에서 "하루 3시간 이내(하루 1레슨, 평균 약 2시간)"로 통일되어 D-35와 일치한다
- 프론트매터 일괄 편집이 `estimatedMinutes` 한 줄에만 좁게 겨냥되어(T-03-06 완화) 35개 레슨 모두 title/stepId/moduleId/order/depth/slug/hasContent와 본문이 변경 전과 동일함을 `git diff --numstat`으로 확인
- `npm run build` 재빌드 후 `.velite/lessons.json`이 갱신값을 반영하고, `formatEstimatedTime()`이 새 분 값으로 "약 2.5시간"/"약 1시간" 문자열을 정확히 재계산함을 확인
- 전체 검증 체인(build, check-manifest, check-schedule, check-progress-math, check-progress-gates, check-brand, e2e-today 5시나리오)이 무회귀로 통과

## Task Commits

Each task was committed atomically:

1. **Task 1: 35개 레슨 예상 소요시간 하향 (D-31)** - `eb74e04` (feat)
2. **Task 2: 매니페스트 게이트에 총합·분포·파생 규칙 불변식 추가** - `42b8c4c` (feat)
3. **Task 3: D-35 페이스 기준 문구를 계획 문서 3종에 반영** - `7ee930b` (docs)

**Plan metadata:** (this commit, following SUMMARY.md creation)

## Files Created/Modified
- `src/content/lessons/step-1/*.mdx` (10개) - `estimatedMinutes` 270 → 150 (모두 심화·비프로젝트)
- `src/content/lessons/step-2/*.mdx` (16개) - `estimatedMinutes` 270 → 150(비프로젝트) 또는 150 → 60(프로젝트 2-4/2-6)
- `src/content/lessons/step-3/*.mdx` (14개) - `estimatedMinutes` 180 → 90(비프로젝트) 또는 120 → 60(프로젝트 3-2/3-5/3-7)
- `scripts/check-manifest.mjs` - Invariant 6 등식 교체 + Invariant 12(분포)·13(파생 규칙) 신설, isProject 추출 정규식 패스 추가
- `.planning/ROADMAP.md` - Phase 3 Success Criteria 1번 페이스 표현 갱신
- `.planning/PROJECT.md` - 요구사항 체크리스트/가정 절/Key Decisions 표 3곳 갱신
- `.planning/REQUIREMENTS.md` - SCHED-01 본문 페이스 표현 갱신

## Decisions Made
- estimatedMinutes 목표값은 순차 치환이 아니라 (depth, isProject) 파생 계산으로 산출 — 270→150과 150→60이 같은 값 공간을 공유해 순차 치환이 구조적으로 위험함을 RESEARCH/PATTERNS가 이미 지적했고, 이 Plan은 그 지적대로 실행함
- check-manifest.mjs의 Invariant 6을 밴드 검사에서 등식 검사로 좁혀 이후 값 드리프트가 밴드 안에서 조용히 통과하는 경로를 제거
- PROJECT.md Key Decisions 표에 "D-35로 하향 조정됨" 문구를 남겨 이전 "하루 4~6시간" 가정이 사용자 결정으로 대체됐다는 이력을 보존

## Deviations from Plan

### Auto-fixed Issues

None - 모든 태스크가 Rule 1~4 개입 없이 계획대로 실행됨.

---

**Total deviations:** 0 auto-fixed
**Impact on plan:** 없음 — 계획된 편집·게이트 확장·문서 갱신이 그대로 실행되고 전부 통과함.

### Note: Acceptance-criteria arithmetic mismatch (non-blocking)

Task 3의 acceptance criteria는 "각 파일의 변경 줄 수가 5줄 이하"를 요구하지만, 같은 Task의 `<action>`이 `PROJECT.md`에서 명시적으로 세 군데(요구사항 체크리스트/가정 절/Key Decisions 표) 모두 교체하라고 지시한다. 세 줄을 교체하면 unified diff상 3 insertions + 3 deletions = 6 changed lines가 되어 5줄 기준을 산술적으로 초과한다. 이는 코드 결함이 아니라 계획 문서 자체의 acceptance criteria와 action 지시 사이의 수치 불일치이므로 Rule 1~4로 "고치는" 대신 있는 그대로 기록한다 — PROJECT.md는 여전히 해당 세 문장만 좁게 교체됐고 파일 전체를 재작성하지 않았다(핵심 안전장치는 그대로 충족). ROADMAP.md(2줄)·REQUIREMENTS.md(2줄)는 기준을 만족한다.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Plan 03(페이스 판정)이 소비할 `estimatedMinutes` 입력값이 확정됐다 — `computePace`/`catchUpDays` 계산이 이제 4,200분 총합·150분 상한 기준으로 동작한다
- `check-manifest.mjs`의 13개 불변식이 Phase 4~5 콘텐츠 집필 중 실수로 소요시간 값이 손대지는 것을 상시 차단한다
- 계획 문서 3종의 페이스 기준이 실제 구현·일정과 일치해 Plan 04(일정표 페이지)가 문구 불일치 없이 진행 가능하다

---
*Phase: 03-schedule-and-today*
*Completed: 2026-08-25*
