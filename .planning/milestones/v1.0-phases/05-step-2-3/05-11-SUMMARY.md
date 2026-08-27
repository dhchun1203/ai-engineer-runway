---
phase: 05-step-2-3
plan: 11
subsystem: content
tags: [mdx, velite, curriculum, project-guide, korean-content]

requires:
  - phase: 05-step-2-3
    provides: "6단 헤딩 + 프로젝트 가이드 형식(D-66) 확정, 2-4/2-6 승인된 실물"
provides:
  - "3-5-project-orchestration.mdx: [Project 4] AI 업무 자동화 준비 가이드, hasContent: true"
  - "3-7-project-ax-launch.mdx: [Project 5] AX 서비스 런칭 준비 가이드, hasContent: true (CONT-05 완성)"
affects: [05-13, curriculum-content]

actuals:
  tokens: 4500
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "프로젝트 준비 가이드: 6단 헤딩 원문 유지 + ④를 사전 준비 체크리스트 표로, ⑥ 핵심 정리를 준비 완료 판정 체크박스로 재해석(D-66)"

key-files:
  created: []
  modified:
    - src/content/lessons/step-3/3-5-project-orchestration.mdx
    - src/content/lessons/step-3/3-7-project-ax-launch.mdx

key-decisions:
  - "3-4 세 편(멀티에이전트·웹훅/HITL·n8n/LangGraph)이 이 wave에서 아직 스텁이라, 복습 포인터 slug는 유지하되 본문 용어(트리거·승인 대기·감사로그·롤백)는 커리큘럼 원문과 05-CONTEXT.md 기준으로 직접 정함 — Plan 13의 사람 확인에서 3-4 완성본과 용어 불일치 여부 재확인 필요"
  - "3-7의 복습 포인터에 2-7-prompt-patterns·3-6-monitoring-governance를 포함했으나 acceptance_criteria grep 대상은 아님 — 두 slug 모두 실존 파일과 일치 확인됨"

requirements-completed: [CONT-05]

coverage:
  - id: D1
    description: "3-5-project-orchestration이 프로젝트 준비 가이드 형식으로 렌더한다 — ④가 체크리스트 표, ⑥이 준비 완료 체크박스"
    requirement: CONT-05
    verification:
      - kind: other
        ref: "node scripts/check-lesson-structure.mjs (25개 레슨, 7개 검사 통과)"
        status: pass
      - kind: other
        ref: "curl http://localhost:3000/lesson/3-5-project-orchestration -> 200"
        status: pass
    human_judgment: false
  - id: D2
    description: "3-7-project-ax-launch이 프로젝트 준비 가이드 형식으로 렌더한다 — 같은 단별 매핑, CONT-05 완성"
    requirement: CONT-05
    verification:
      - kind: other
        ref: "node scripts/check-lesson-structure.mjs (25개 레슨, 7개 검사 통과)"
        status: pass
      - kind: other
        ref: "curl http://localhost:3000/lesson/3-7-project-ax-launch -> 200"
        status: pass
    human_judgment: false
  - id: D3
    description: "두 편 모두 '재현 아님' 경계를 지킨다 — 완성 구현 코드·완성 스키마·단계별 튜토리얼 없음, 60분 가이드가 200~520시간 팀 프로젝트를 앞질러 풀지 않음"
    requirement: CONT-05
    verification: []
    human_judgment: true
    rationale: "내용 경계(D-67 '재현 아님')는 자동 검증 불가 — 자동 게이트(④ 절 실행 코드 펜스 0건, 해보기 '구현해'/'함수를 작성' 0건)가 방어하지만 최종 판정은 Plan 01 체크포인트 항목 5와 같은 사람 검토가 필요. Plan 13이 Phase 5 마감 시점에 이 판단을 확인한다"

duration: 45min
completed: 2026-08-26
status: complete
---

# Phase 5 Plan 11: 프로젝트 준비 가이드 4·5편 (오케스트레이션·AX 런칭) Summary

**`3-5-project-orchestration`과 `3-7-project-ax-launch` 프로젝트 준비 가이드 작성 완료 — 커리큘럼 실습 프로젝트 5종 준비 가이드 전체 완성(CONT-05)**

## Performance

- **Duration:** 45min
- **Started:** 2026-08-26T00:00:00Z (worktree setup 포함)
- **Completed:** 2026-08-26
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- `3-5-project-orchestration.mdx`: [Project 4] AI 업무 자동화 준비 가이드. ④ 사전 준비 체크리스트(자동화 대상 업무, 외부 도구 3개 계정, 트리거 방식, 승인자, 감사로그 항목)는 실행 코드 0건. ⑥ 핵심 정리가 5개 준비 완료 체크박스. 복습 포인터가 `3-4-multi-agent-structure`·`3-4-webhook-schedule-hitl`·`3-4-n8n-langgraph`를 가리킴. 롤백 7회, 감사로그 8회 언급으로 커리큘럼 §3-5 둘째 불릿 범위를 실제로 채움.
- `3-7-project-ax-launch.mdx`: [Project 5] AX 서비스 런칭 준비 가이드. ④ 체크리스트가 배포·관측·정책·데모·포트폴리오 다섯 축을 모두 덮음(커리큘럼 §3-7 세 불릿 반영). ⑥이 5개 준비 완료 체크박스. 복습 포인터가 앞선 네 프로젝트(`2-4`, `2-6`, `3-2`, `3-5`)와 관련 개념 레슨(`2-7-prompt-patterns`, `3-6-monitoring-governance`)을 가리켜 커리큘럼 전체의 도착점 역할을 함. 마지막 문단에서 프로젝트 준비 가이드 5종 완성을 명시.
- 두 편 모두 `hasContent: false → true` 한 줄만 프론트매터 변경, 나머지 7개 필드는 그대로 유지.
- 프로젝트 가이드 5편 중 4·5번째가 완성되어 CONT-05가 충족됨(3편 — `2-4`, `2-6` — 은 앞선 Plan에서 이미 완료, 5번째 `3-2`는 같은 wave의 sibling Plan 05-08이 작성 중).

## Task Commits

Each task was committed atomically:

1. **Task 1: `3-5-project-orchestration` 집필** - `c225009` (feat)
2. **Task 2: `3-7-project-ax-launch` 집필 (CONT-05 완성)** - `b973819` (feat)

_이 SUMMARY와 함께 커밋되는 plan 메타데이터 커밋은 orchestrator가 wave 병합 후 처리한다 — 이 executor는 STATE.md/ROADMAP.md를 갱신하지 않는다._

## Files Created/Modified

- `src/content/lessons/step-3/3-5-project-orchestration.mdx` - [Project 4] 준비 가이드 본문 신규, `hasContent: true`
- `src/content/lessons/step-3/3-7-project-ax-launch.mdx` - [Project 5] 준비 가이드 본문 신규, `hasContent: true`

## Decisions Made

- 3-4 세 편(같은 wave의 Plan 10이 병렬 집필)이 이 워크트리에서는 아직 스텁 상태였음. 복습 포인터 slug는 Phase 1에서 확정된 불변값이라 그대로 사용했고, 본문에서 언급하는 용어(트리거·승인 대기·감사로그·롤백·에이전트)는 커리큘럼 원문(`.planning/curriculum.md` §3-4)과 `05-CONTEXT.md`를 기준으로 직접 정함. 3-4 완성본과의 용어 일치 여부는 Plan 13의 사람 확인에서 재확인이 필요.
- `3-7`의 복습 포인터에 계획서가 명시한 4개 프로젝트 slug(`2-4`, `2-6`, `3-2`, `3-5`) 외에 `2-7-prompt-patterns`·`3-6-monitoring-governance`도 추가로 언급함(구조화 출력·관측 개념의 출처를 명확히 하기 위함). 두 slug 모두 실제 파일이 존재함을 확인했다.

## Deviations from Plan

None - plan executed exactly as written. 두 파일 모두 계획서의 단별 매핑(D-66)·"재현 아님" 경계(D-67)·해보기 형식(D-68)·단어 표/해보기 개수 규칙(D-69)을 그대로 따름.

## Issues Encountered

- **Task 2 acceptance criterion "프로젝트 가이드 5편이 전부 hasContent: true"** — `node -e` 검사 결과 `3-2-project-rag-agent`가 이 워크트리에서는 여전히 `hasContent: false`(missing)로 나옴. 원인은 이 criterion이 sibling Plan 05-08(같은 wave 4, 별도 워크트리에서 `3-2-project-rag-agent` 작성 중)의 산출물이 merge된 이후 상태를 전제하기 때문. Plan 05-11 자체는 정상 완료됐고, 이 5편 전체 존재 확인은 계획서가 명시한 대로 Plan 13(Phase 5 마감, 실측 재조정)이 wave 병합 후 다시 수행해야 함. `estimatedMinutes: 60` 일치 검사는 5편 모두 통과(3-2 스텁도 프론트매터의 `estimatedMinutes: 60`은 이미 확정값이라 존재).
- `next start` 백그라운드 프로세스가 curl 이후 종료 신호를 냈으나, 두 URL 모두 curl 요청 시점에 200을 반환한 것으로 확인되어 렌더링 자체는 문제 없음.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 프로젝트 준비 가이드 5편(`2-4`, `2-6`, `3-2`, `3-5`, `3-7`) 중 이 Plan이 담당한 2편(`3-5`, `3-7`)이 완성됨 — CONT-05는 5편 전체가 wave 병합 후 존재해야 최종 충족.
- `node scripts/check-manifest.mjs`는 이 wave 동안 의도적으로 red — Plan 13이 wave 4 병합 후 실측으로 상수를 되돌린다. 이 Plan은 그 상수를 손대지 않았다.
- Plan 13이 확인해야 할 것: (1) 프로젝트 가이드 5편 `hasContent: true` 여부, (2) 3-4 세 편과의 용어 일치 여부, (3) 이 Plan의 두 편이 "재현 아님" 경계를 지켰는지에 대한 사람 판정(D3 coverage item).

---
*Phase: 05-step-2-3*
*Completed: 2026-08-26*

## Self-Check: PASSED

- FOUND: src/content/lessons/step-3/3-5-project-orchestration.mdx
- FOUND: src/content/lessons/step-3/3-7-project-ax-launch.mdx
- FOUND: c225009
- FOUND: b973819
