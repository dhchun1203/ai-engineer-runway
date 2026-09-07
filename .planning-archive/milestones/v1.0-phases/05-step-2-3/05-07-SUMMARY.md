---
phase: 05-step-2-3
plan: 07
subsystem: infra
tags: [velite, manifest-gate, ci-invariant, vercel-deploy, e2e]

# Dependency graph
requires:
  - phase: 05-step-2-3 (Wave 2, Plan 02~06)
    provides: "Step 2 나머지 10편의 hasContent:true 전환 (2-1/2-2/2-3/2-5/2-6/2-7 모듈)"
provides:
  - "`EXPECTED_HAS_CONTENT_COUNT`/`EXPECTED_HAS_CONTENT_SLUGS`를 실측(23)으로 맞춘 check-manifest.mjs"
  - "green 상태의 전 게이트(build/manifest/brand/lesson-structure)"
  - "Step 2 12편 프로덕션 배포 및 200 확인"
affects: [05-step-2-3 Plan 08~12 (Step 3 배치, green 매니페스트에서 시작), 05-step-2-3 Plan 13 (최종 35 수렴)]

# Actuals (#2632)
actuals:
  tokens: 408
  tasks: 2
  commits: 1

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "게이트 기대 상수는 항상 `npm run build` 이후 `.velite/lessons.json` 실측에서만 도출한다 — 빌드 전에는 스크립트가 스테일 아티팩트를 조용히 검증한다 (check-manifest.mjs가 소스가 아니라 빌드 산출물을 읽는다는 사실이 함정)"
    - "`rehype-pretty-code`/Shiki 출력은 `language-*` CSS 클래스가 아니라 `data-language=\"<lang>\"` 속성을 남긴다 — 향후 하이라이팅 검증은 이 속성으로 한다"

key-files:
  created: []
  modified:
    - scripts/check-manifest.mjs

key-decisions:
  - "EXPECTED_HAS_CONTENT_COUNT를 CONTEXT.md D-78 원문 수치(24)가 아니라 npm run build 직후 .velite/lessons.json 실측(23)으로 확정 — 원문과 실측이 다시 한 번 불일치했고(Open Question 1, Wave 1에 이은 두 번째 사례), 실측을 우선했다"
  - "EXPECTED_HAS_CONTENT_SLUGS를 Step 1/2/3 그룹 주석으로 재정리 — 기존 항목을 지우지 않고 Wave 2 신규 10개 slug만 추가"

patterns-established: []

requirements-completed: [CONT-05]

coverage:
  - id: D1
    description: "check-manifest.mjs의 Invariant 10 기대 상수(개수+slug 배열)를 빌드 실측값 23과 정확히 일치시킴"
    requirement: "CONT-05"
    verification:
      - kind: unit
        ref: "node scripts/check-manifest.mjs (13개 불변식 전체 통과, Invariant 10 포함)"
        status: pass
      - kind: unit
        ref: "node -e count-check (EXPECTED_HAS_CONTENT_COUNT === .velite/lessons.json 실측 개수)"
        status: pass
      - kind: unit
        ref: "node -e slug-check (EXPECTED_HAS_CONTENT_SLUGS 정렬 후 실측 slug 집합과 JSON.stringify 완전 일치)"
        status: pass
    human_judgment: false
  - id: D2
    description: "전 게이트(build/check-manifest/check-brand/check-lesson-structure) green 복귀"
    requirement: "CONT-05"
    verification:
      - kind: unit
        ref: "npm run build && node scripts/check-manifest.mjs && node scripts/check-brand.mjs && node scripts/check-lesson-structure.mjs — 4개 명령 모두 exit 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "Step 2 12편 로컬(next start) 및 프로덕션 URL 전수 200 + 정답 보기 포함 + 콘텐츠 준비 중 부재"
    requirement: "CONT-05"
    verification:
      - kind: e2e
        ref: "next start -p 3100 + fetch 12개 /lesson/{slug} — 로컬 12/12 200, 정답 보기 포함, 빈 상태 문자열 없음"
        status: pass
      - kind: e2e
        ref: "https://ai-engineer-runway.vercel.app/lesson/{slug} 12개 — 프로덕션 12/12 200, 정답 보기 포함, 빈 상태 문자열 없음"
        status: pass
    human_judgment: false
  - id: D4
    description: "오늘의 학습 루프(e2e-today)와 진행률(e2e-progress) e2e가 커진 매니페스트(23개 hasContent)에서도 통과"
    requirement: "CONT-05"
    verification:
      - kind: e2e
        ref: "node --env-file=.env.local scripts/e2e-today.mjs — t1~t8, s1~s5 전체 시나리오 통과"
        status: pass
      - kind: e2e
        ref: "node --env-file=.env.local scripts/e2e-progress.mjs — i1~i5, a~f, g1~g5, h1~h4 전체 시나리오 통과"
        status: pass
    human_judgment: false
  - id: D5
    description: "2-1 모듈 두 레슨(2-1-postgres-and-supabase, 2-1-ai-data-modeling)의 연습 SQL이 실제 Supabase SQL 에디터에서 오류 없이 실행됨"
    human_judgment: true
    rationale: "자격증명이 필요한 실제 Supabase SQL 에디터 실행 확인은 실행자가 자동화할 수 없다 (플랜의 <human-check> 항목, human_verify_mode: end-of-phase 정책에 따라 phase 종료 시 확인 예정). 이 Plan은 아직 이 항목을 검증하지 않았다."

# Metrics
duration: 25min
completed: 2026-08-26
status: complete
---

# Phase 05 Plan 07: Step 2 배치 마감 — 매니페스트 실측 갱신 + 프로덕션 배포 Summary

**`check-manifest.mjs`의 Invariant 10 상수를 13→23으로 실측 갱신하고, Step 2 신규 10편을 포함한 12편 전체를 프로덕션에 배포해 200 확인, 오늘의 학습·진행률 e2e까지 통과시켜 Wave 2를 마감**

## Performance

- **Duration:** 25 min
- **Started:** 2026-08-25 (Wave 2 병합 직후, HEAD `e83b086`)
- **Completed:** 2026-08-26T00:40:00+09:00 (KST)
- **Tasks:** 2
- **Files modified:** 1 (`scripts/check-manifest.mjs`)

## Accomplishments
- `npm run build` 직후 `.velite/lessons.json`을 실측해 `hasContent: true` 레슨이 **23개**임을 확정 — CONTEXT.md D-78 원문의 "Wave 2 종료 24"와 다시 한 번 불일치(Wave 1의 13 vs 14 불일치에 이은 두 번째 사례). 실측 우선 원칙을 그대로 적용.
- `EXPECTED_HAS_CONTENT_COUNT`를 13→23, `EXPECTED_HAS_CONTENT_SLUGS`에 Step 2 신규 10개(`2-1-postgres-and-supabase`, `2-1-ai-data-modeling`, `2-2-html-css-js`, `2-2-browser-and-ui`, `2-3-typescript-setup`, `2-5-express-rest-api`, `2-5-auth-and-prisma`, `2-6-project-ai-shop-backend`, `2-7-prompt-patterns`, `2-7-promptops`)를 추가하고 Step 1/2/3 그룹 주석으로 정리.
- Wave 2 동안 의도적으로 red였던 Invariant 10을 포함해 13개 불변식 전부 green으로 복귀. `check-brand.mjs`(86개 파일, 0 위반), `check-lesson-structure.mjs`(23개 레슨, 7개 검사) 모두 green.
- Step 2 12편을 `next start` 로컬에서 전수 200 확인 후 `git push origin master`로 배포. Vercel 배포 완료 후 프로덕션 12편 전수 200 + `정답 보기` 포함 + `콘텐츠 준비 중` 부재 확인.
- `node --env-file=.env.local scripts/e2e-today.mjs`와 `scripts/e2e-progress.mjs` 모두 커진 매니페스트(23개 hasContent)에서 전 시나리오 통과 — 오늘의 학습 루프와 진행률 집계가 깨지지 않음을 확인.

## Task Commits

1. **Task 1: 매니페스트 Invariant 10 상수 실측 갱신 + 전체 게이트 green 복귀** - `b77e7b1` (fix)
2. **Task 2: Step 2 배치 프로덕션 배포 + 전체 레슨 도달 확인 + 오늘의 학습 루프 확인** - 코드 변경 없음(Task 1의 커밋을 `git push origin master`로 배포만 수행), 별도 커밋 없음

**Plan metadata:** (final commit below)

## Files Created/Modified
- `scripts/check-manifest.mjs` - `EXPECTED_HAS_CONTENT_COUNT` 13→23, `EXPECTED_HAS_CONTENT_SLUGS` +10 slug, 이력 주석 1줄 추가. `EXPECTED_TOTAL_MINUTES`·`EXPECTED_MINUTES_DISTRIBUTION`·`EXPECTED_PROJECT_MODULE_COUNT`와 190행 이후 검사 로직은 변경 없음 (diff로 확인됨).

## Decisions Made
- **실측 23 vs CONTEXT.md D-78 원문 24 — 불일치, 실측 채택.** `npm run build` 후 `.velite/lessons.json`을 직접 읽어 개수와 slug 목록을 뽑았고, 이 값(23)만을 상수 근거로 삼았다. D-78 원문의 손계산(24)은 채택하지 않았다 — 이는 05-01-SUMMARY.md가 Wave 1에서 이미 예견한(RESEARCH Open Question 1) 산수 재검증 패턴이 Wave 2에서도 반복된 것이다.
- **`check-manifest.mjs`는 빌드 산출물(`.velite/lessons.json`)을 읽지, 소스 파일을 직접 읽지 않는다.** 이 세션 시작 전 오케스트레이터가 직접 확인해 알려준 함정(Trap 1)대로, 빌드 없이 이 스크립트를 돌리면 스테일 아티팩트를 조용히 검증한다. 이 Plan에서는 상수를 고치기 전 매번 `npm run build`를 먼저 실행해 이 문제를 피했다.
- **하이라이팅 언어 클래스 검증 패턴을 `data-language="..."`로 통일.** 이 Plan 자체는 `language-*` grep을 쓰는 검증 로직을 포함하지 않았지만(Task 1/2 acceptance criteria 어디에도 없음), Wave 2의 두 executor(05-03, 05-06)가 독립적으로 발견한 함정을 SUMMARY에 기록해 Plan 13이 반복하지 않도록 남긴다.

## Deviations from Plan

None — plan executed exactly as written. Task 1과 Task 2의 acceptance criteria를 모두 자동 검증으로 충족했다.

## Issues Encountered
None. 두 가지 알려진 함정(빌드 산출물 vs 소스, `language-*` vs `data-language`)은 오케스트레이터가 세션 시작 전에 미리 알려준 대로 회피했으며 이번 실행에서 새로 재현되지 않았다.

## User Setup Required

None - no external service configuration required. `.env.local`이 이미 존재해 e2e 스크립트가 자격증명 없이 건너뛸 필요가 없었다.

## Known Stubs

None from this plan — 이 Plan은 레슨 본문을 새로 쓰거나 고치지 않았고(`git diff --name-only`에 `src/content/lessons/` 없음 확인), 매니페스트 상수와 배포만 다뤘다.

## Backstop / 미완료 항목 (phase 종료 시 확인 필요)

- **2-1 모듈 SQL 실제 실행 확인 (human-check, 미실행).** `2-1-postgres-and-supabase`, `2-1-ai-data-modeling`의 연습 SQL을 실제 Supabase SQL 에디터에 붙여넣어 오류 없이 실행되는지 확인하는 항목은 자격증명이 필요해 이 실행자가 자동화할 수 없다. 플랜의 `human_verify_mode: end-of-phase` 정책에 따라 phase 종료 시 한 번에 확인해야 한다. **아직 확인되지 않았다** — Plan 13 또는 phase 종료 UAT에서 반드시 수행할 것.

## Next Phase Readiness

- Wave 2가 완전히 마감됐다 — 매니페스트 상수 실측 갱신, 4개 게이트 green, Step 2 12편 프로덕션 배포·200 확인, e2e 두 종 통과.
- **실측 23개, D-78 원문(24)과 불일치 — 기록 완료.** Plan 13이 최종 35에서 같은 대조를 반복할 때 이 두 번째 불일치 사례를 참고할 것.
- Step 3 배치(Plan 08~12)가 green 매니페스트 상태에서 착수 가능. 남은 전환 편수: 35 - 23 = **12편** (Step 3 나머지).
- Plan 13이 반영해야 할 최종 예상값: `EXPECTED_HAS_CONTENT_COUNT = 35`(전체), slug 배열은 D-78 재량대로 "매니페스트 전체 슬러그와 동일" 형태로 단순화 가능.
- 미완료 backstop 항목(2-1 SQL 실제 실행)은 위 섹션에 명시했다 — phase 종료 전에 반드시 해소.

---
*Phase: 05-step-2-3*
*Completed: 2026-08-26*

## Self-Check: PASSED
- FOUND: scripts/check-manifest.mjs
- FOUND: commit b77e7b1
- FOUND: .planning/phases/05-step-2-3/05-07-SUMMARY.md
