---
schema_version: 1
open_count: 4
waived_count: 0
fixed_count: 1
total_count: 5
last_updated: 2026-08-25T16:33:39.522Z
---

# Broken Windows Ledger

> Cross-phase defect register. With `workflow.windows_enforce` enabled, `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 02 | unrun-verify | src/components/complete-button.tsx |  | Task 3 human-check (완료 애니메이션 체감·다음 레슨 강조·reduced-motion·iPad 히트영역) — workflow.human_verify_mode=end-of-phase로 지금 실행되지 않음, /gsd-verify-work의 end-of-phase UAT에서 harvest 예정 | open |  | 2026-08-24T08:25:20.047Z |  |
| 2 | 02 | unrun-verify | src/app/step/[stepId]/page.tsx |  | 02-03 Task 3 human-check (Step 헤더/모듈 배지 육안 확인, iPad 44px 히트영역, 시크릿창 마커 0건) — workflow.human_verify_mode=end-of-phase에 따라 미실행, /gsd-verify-work end-of-phase UAT에서 harvest 예정 | open |  | 2026-08-24T08:42:45.349Z |  |
| 3 | 02 | unrun-verify | src/app/page.tsx |  | 02-04 Task 3 human-check A-D (기기 전환, 진행률 표시, 외부인 차단, 아이패드 경험 — 12개 항목) — workflow.human_verify_mode=end-of-phase에 따라 미실행, /gsd-verify-work end-of-phase UAT에서 harvest 예정 | open |  | 2026-08-24T09:41:06.787Z |  |
| 4 | 03 | unrun-verify | scripts/e2e-today.mjs |  | t8(과거 배정 미완료 -> behind + 밀린 레슨 목록 실제 화면 왕복)이 실행일(2026-08-25, 사전학습 첫날)에 어제까지 배정분이 없어 스킵됨 -- 과거 배정분이 쌓이는 날 재실행 필요 | fixed |  | 2026-08-24T15:22:31.715Z | 2026-08-25T16:33:39.522Z |
| 5 | 05 | lint-warning | src/components/theme-toggle.tsx | 15 | Pre-existing Phase 1 react-hooks/set-state-in-effect + no-assign-module-variable lint errors surfaced by Plan 05-13's npm run lint gate (theme-toggle.tsx, lesson-nav.tsx) - not caused by Phase 5, out of scope, logged in deferred-items.md | open |  | 2026-08-25T16:31:11.078Z |  |

````json
[
  {
    "id": 1,
    "kind": "unrun-verify",
    "phase": "02",
    "file": "src/components/complete-button.tsx",
    "line": null,
    "description": "Task 3 human-check (완료 애니메이션 체감·다음 레슨 강조·reduced-motion·iPad 히트영역) — workflow.human_verify_mode=end-of-phase로 지금 실행되지 않음, /gsd-verify-work의 end-of-phase UAT에서 harvest 예정",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-24T08:25:20.047Z",
    "resolved_at": null
  },
  {
    "id": 2,
    "kind": "unrun-verify",
    "phase": "02",
    "file": "src/app/step/[stepId]/page.tsx",
    "line": null,
    "description": "02-03 Task 3 human-check (Step 헤더/모듈 배지 육안 확인, iPad 44px 히트영역, 시크릿창 마커 0건) — workflow.human_verify_mode=end-of-phase에 따라 미실행, /gsd-verify-work end-of-phase UAT에서 harvest 예정",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-24T08:42:45.349Z",
    "resolved_at": null
  },
  {
    "id": 3,
    "kind": "unrun-verify",
    "phase": "02",
    "file": "src/app/page.tsx",
    "line": null,
    "description": "02-04 Task 3 human-check A-D (기기 전환, 진행률 표시, 외부인 차단, 아이패드 경험 — 12개 항목) — workflow.human_verify_mode=end-of-phase에 따라 미실행, /gsd-verify-work end-of-phase UAT에서 harvest 예정",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-24T09:41:06.787Z",
    "resolved_at": null
  },
  {
    "id": 4,
    "kind": "unrun-verify",
    "phase": "03",
    "file": "scripts/e2e-today.mjs",
    "line": null,
    "description": "t8(과거 배정 미완료 -> behind + 밀린 레슨 목록 실제 화면 왕복)이 실행일(2026-08-25, 사전학습 첫날)에 어제까지 배정분이 없어 스킵됨 -- 과거 배정분이 쌓이는 날 재실행 필요",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-08-24T15:22:31.715Z",
    "resolved_at": "2026-08-25T16:33:39.522Z"
  },
  {
    "id": 5,
    "kind": "lint-warning",
    "phase": "05",
    "file": "src/components/theme-toggle.tsx",
    "line": 15,
    "description": "Pre-existing Phase 1 react-hooks/set-state-in-effect + no-assign-module-variable lint errors surfaced by Plan 05-13's npm run lint gate (theme-toggle.tsx, lesson-nav.tsx) - not caused by Phase 5, out of scope, logged in deferred-items.md",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-25T16:31:11.078Z",
    "resolved_at": null
  }
]
````
