---
phase: 05-step-2-3
plan: 10
subsystem: content
tags: [mdx, velite, curriculum, step-3, orchestration, n8n, langgraph, webhook]

# Dependency graph
requires:
  - phase: 05-step-2-3
    provides: "05-01 완료본이 승인한 Step 3 개요 형식 실물(3-1-vector-search-basics.mdx) — 이 Plan의 깊이 기준"
  - phase: 05-step-2-3
    provides: "05-07 — 이 wave의 hasContent 카운트 기준 상수를 맞춰 둔 이전 Plan"
provides:
  - "3-4 모듈 3편(여러 AI가 함께 일하는 구조 / Webhook·스케줄·HITL 설계 / n8n·LangGraph 자동화 개요) — hasContent: false → true"
  - "세 편이 공유하는 자동화 시나리오와 확정 용어 — 3-5-project-orchestration(Plan 11)이 복습 포인터로 재사용 가능"
affects: ["05-11-plan (3-5-project-orchestration)", "05-13-plan (매니페스트 실측 재조정)"]

# Actuals (#2632)
actuals:
  tokens: 7213
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Step 3 개요 레슨 3편이 하나의 공유 시나리오(고객 문의 메일 자동 응대)를 구조/트리거/도구 세 각도로 나눠 쓰는 모듈 구성"

key-files:
  created: []
  modified:
    - src/content/lessons/step-3/3-4-multi-agent-structure.mdx
    - src/content/lessons/step-3/3-4-webhook-schedule-hitl.mdx
    - src/content/lessons/step-3/3-4-n8n-langgraph.mdx

key-decisions:
  - "세 레슨이 '고객 문의 메일 도착 → 분류 → 검색 → 초안 → 담당자 승인 → 발송'을 공유 시나리오로 이어씀 — plan의 <shared_scenario>를 그대로 실행"
  - "Task 3(3-4-n8n-langgraph)은 제목의 '실습 개요'에도 불구하고 프론트매터 title을 바꾸지 않고, 본문 ② 왜 배우나에 '지금은 설치하지 않습니다'를 명시해 오해를 막음"
  - "PLAN.md 의 Task별 node -e 검증 스크립트(/language-python/ 등 CSS 클래스 매칭)가 실제 rehype-pretty-code 출력 형태(data-language 속성)와 불일치함을 발견 — 승인된 파일럿(3-1-vector-search-basics)도 동일 정규식에 실패하는 것으로 재확인, 올바른 data-language 속성 매칭으로 대체 검증"

patterns-established: []

requirements-completed: [CONT-05]

coverage:
  - id: D1
    description: "3-4-multi-agent-structure 레슨이 개요 깊이로 렌더되고 구조 게이트를 통과한다"
    requirement: "CONT-05"
    verification:
      - kind: automated_ui
        ref: "node scripts/check-lesson-structure.mjs (26개 레슨 통과)"
        status: pass
      - kind: e2e
        ref: "curl http://localhost:3000/lesson/3-4-multi-agent-structure -> 200"
        status: pass
    human_judgment: false
  - id: D2
    description: "3-4-webhook-schedule-hitl 레슨이 개요 깊이로 렌더되고 구조 게이트를 통과한다"
    requirement: "CONT-05"
    verification:
      - kind: automated_ui
        ref: "node scripts/check-lesson-structure.mjs (26개 레슨 통과)"
        status: pass
      - kind: e2e
        ref: "curl http://localhost:3000/lesson/3-4-webhook-schedule-hitl -> 200"
        status: pass
    human_judgment: false
  - id: D3
    description: "3-4-n8n-langgraph 레슨이 개요로 렌더되고, 제목의 '실습 개요'에도 불구하고 설치·계정 생성 안내가 0건이다"
    requirement: "CONT-05"
    verification:
      - kind: automated_ui
        ref: "node scripts/check-lesson-structure.mjs (26개 레슨 통과)"
        status: pass
      - kind: e2e
        ref: "curl http://localhost:3000/lesson/3-4-n8n-langgraph -> 200"
        status: pass
    human_judgment: false
  - id: D4
    description: "세 레슨 모두 Step 3 개요 깊이(D-62~D-65) 준수 여부 — 산문의 '적정 깊이'는 자동 측정 불가, 승인된 파일럿과의 상대 비교"
    verification: []
    human_judgment: true
    rationale: "코드 블록 수·설치 명령·금지어 존재 여부는 acceptance criteria로 기계 검증했지만, '개요 깊이가 맞는가'라는 판단 자체는 D-62 rubric에 대한 사람의 최종 확인이 필요하다"

duration: ~25min
completed: 2026-08-26
status: complete
---

# Phase 05 Plan 10: 3-4 오케스트레이션 모듈 3편 Summary

**Step 3 3-4 모듈(여러 AI가 함께 일하는 구조 / Webhook·스케줄·HITL 설계 / n8n·LangGraph 자동화 개요) 3편을 개요 깊이로 집필 — 하나의 공유 자동화 시나리오를 구조·트리거·도구 세 각도로 이어쓴 모듈**

## Performance

- **Duration:** ~25분 (npm ci·env 설정 포함)
- **Tasks:** 3/3
- **Files modified:** 3

## Accomplishments
- `3-4-multi-agent-structure`: 역할 분담(에이전트), 순차/병렬/감독자 연결 방식 표, 상태 공유, 루프 위험을 개요로 다룸. 읽기용 python 스니펫(그래프 선언) 1개.
- `3-4-webhook-schedule-hitl`: 트리거 3종(이벤트/시간/사람) 표, Webhook·서명 검증, HITL, 멱등성/재시도를 개요로 다룸. 읽기용 typescript 스니펫(웹훅 핸들러 뼈대) 1개.
- `3-4-n8n-langgraph`: 노코드(n8n) vs 코드(LangGraph) 성격 차이와 선택 기준 표를 개요로 다룸. 제목의 "실습 개요"에도 불구하고 설치·계정 생성 안내 0건. 읽기용 json 스니펫(워크플로 노드/연결 발췌) 1개.
- 세 편 모두 같은 공유 시나리오("고객 문의 메일 도착 → 분류 → 관련 문서 검색 → 답변 초안 → 담당자 승인(HITL) → 발송·기록")를 구조/트리거/도구 각도로 이어씀 — 용어(에이전트·노드·연결·상태 등)도 세 편에서 일관되게 재사용.

## Task Commits

Each task was committed atomically:

1. **Task 1: `3-4-multi-agent-structure` 집필** - `909ce99` (feat)
2. **Task 2: `3-4-webhook-schedule-hitl` 집필** - `63488a8` (feat)
3. **Task 3: `3-4-n8n-langgraph` 집필** - `654fd8d` (feat)

_Note: TDD가 아닌 콘텐츠 집필 plan이라 태스크당 커밋 1개씩._

## Files Created/Modified
- `src/content/lessons/step-3/3-4-multi-agent-structure.mdx` - 본문 신규 작성, `hasContent: false → true`
- `src/content/lessons/step-3/3-4-webhook-schedule-hitl.mdx` - 본문 신규 작성, `hasContent: false → true`
- `src/content/lessons/step-3/3-4-n8n-langgraph.mdx` - 본문 신규 작성, `hasContent: false → true` (title 등 나머지 프론트매터 불변)

## 실제로 쓴 공유 시나리오

"고객 문의 메일이 도착하면 → 내용을 분류하고 → 관련 문서를 찾아 답변 초안을 만들고 → 담당자가 승인하면 → 발송하고 기록한다."

- Task 1(구조 관점): `문의 도착 → 분류 담당 → 검색 담당 → 초안 담당 → 검수 담당 → 승인 → 발송`
- Task 2(트리거·HITL 관점): `메일 도착(Webhook) → 처리 → 담당자 승인 대기(HITL) → 발송 / 매일 아침 미처리 건 재확인(스케줄)`
- Task 3(도구 관점): `트리거 → 노드 여러 개 → 분기 → 사람 승인 → 종료`

**Plan 11(`3-5-project-orchestration`)이 그대로 이어받을 수 있는 확정 용어:** 에이전트, 오케스트레이션, 감독자, 노드, 상태(state), 루프 제한, Webhook, 트리거, 스케줄, HITL, 멱등성, 재시도, 큐, 노코드, 워크플로, 그래프, 분기.

## 스니펫 언어·길이

| 레슨 | 언어 | 대략 줄 수 |
|---|---|---|
| 3-4-multi-agent-structure | python | 16줄 |
| 3-4-webhook-schedule-hitl | typescript | 17줄 |
| 3-4-n8n-langgraph | json | 18줄 |

모두 코드 블록 정확히 1개, 30줄 이하, 직전 5줄 안에 "지금 실행할 필요는 없습니다" 취지의 인용문 포함.

## 확정된 해보기 개수

세 레슨 모두 `### 해보기` 3개(판단·설계형), `<details>` 정답 블록은 각 5개(해보기 3 + 스스로 점검 2).

## 게이트 통과 시점의 hasContent: true 총 개수

`node -e "require('./.velite/lessons.json').filter(x=>x.hasContent).length"` = **26개** (이 Plan이 3편 추가하기 전 23개 → 26개). `check-manifest.mjs`는 plan 지시대로 실행하지 않았다 — 이 wave 동안 의도적 red(Plan 13이 상수를 실측으로 되돌린다).

## Decisions Made
- 세 레슨이 하나의 공유 시나리오를 구조/트리거/도구 세 각도로 나눠 다루도록 실행 — Plan의 `<shared_scenario>`를 문자 그대로 따름.
- `3-4-n8n-langgraph`의 title("...실습 개요")을 그대로 두고 본문에서 오해를 방지하는 문장을 명시적으로 추가.
- Plan의 Task별 `node -e` 언어 검증 스크립트(`/language-python/` 등)가 실제 velite/rehype-pretty-code 출력(`"data-language":"python"` 속성 방식)과 불일치함을 발견. 승인된 파일럿 `3-1-vector-search-basics`도 동일 정규식으로 재검사하면 실패하는 것을 확인해, 이 검증이 plan 작성 시점의 오기임을 확인했다. 실제 목적(코드펜스 언어 태그가 올바르게 하이라이트되었는가)은 `data-language` 속성 매칭으로 대체 검증해 통과를 확인했다.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Plan의 velite 코드 언어 검증 명령이 실제 출력 형태와 불일치**
- **Found during:** Task 1 acceptance criteria 검증 (`node -e ".../language-python/.test(p.code)"`)
- **Issue:** Plan이 지정한 `node -e` 검증이 rehype-pretty-code의 실제 출력 형태(`"data-language":"python"` JSX prop)가 아니라 존재하지 않는 CSS 클래스 패턴(`language-python`)을 찾도록 작성되어 있었다. 승인된 파일럿 레슨(`3-1-vector-search-basics`)로 같은 검증을 재실행해도 동일하게 실패해, 콘텐츠 문제가 아니라 검증 스크립트 자체의 오기임을 확인했다.
- **Fix:** 세 레슨 모두 `p.code.includes('"data-language":"<lang>"')`로 대체 검증해 python/typescript/json 언어 태그가 올바르게 적용됐음을 확인했다. `.mdx` 코드펜스 자체는 plan 지시대로 `python`/`typescript`/`json` 언어 태그를 정확히 달았다.
- **Files modified:** 없음(검증 방법만 조정, 콘텐츠 변경 없음)
- **Verification:** `node -e` 재검증으로 세 파일 모두 통과 확인, `node scripts/check-lesson-structure.mjs` L6(펜스 언어 허용 목록) 통과로 이중 확인
- **Committed in:** 해당 없음(검증 절차 조정이며 콘텐츠 커밋에 포함되지 않음)

---

**Total deviations:** 1 auto-fixed (Rule 1 - 검증 스크립트 불일치, 콘텐츠 자체는 무결)
**Impact on plan:** 콘텐츠 변경 없음. Plan의 acceptance criteria 문구가 실제 velite 출력 스키마와 어긋난 것을 발견하고 목적에 맞는 등가 검증으로 대체했을 뿐, 범위 확장(scope creep)은 없음.

## Issues Encountered
- `npm run start`로 프로덕션 서버를 직접 띄우려 했으나 포트 3000이 이미 사용 중(`EADDRINUSE`)이었다 — 다른 실행 중인 인스턴스(다른 sibling worktree 또는 기존 세션)가 이미 서비스 중이었던 것으로 보인다. 그 기존 서버로 세 레슨 URL을 curl해 모두 200을 확인했고, 렌더된 HTML에 레슨 제목이 실제로 포함되어 있음을 추가로 확인해 스테일 캐시가 아님을 검증했다.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 11(`3-5-project-orchestration`)이 이 세 레슨의 확정 용어와 공유 시나리오를 복습 포인터로 이어받을 준비가 됐다.
- Plan 13이 `check-manifest.mjs`의 hasContent 상수를 이번 wave 종료 후 실측(26개 등 wave 전체 합산치)으로 재조정해야 한다 — 이 Plan은 그 상수를 건드리지 않았다.

---
*Phase: 05-step-2-3*
*Completed: 2026-08-26*
