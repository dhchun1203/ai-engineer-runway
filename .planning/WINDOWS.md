---
schema_version: 1
open_count: 1
waived_count: 0
fixed_count: 0
total_count: 1
last_updated: 2026-08-24T08:25:20.047Z
---

# Broken Windows Ledger

> Cross-phase defect register. With `workflow.windows_enforce` enabled, `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 02 | unrun-verify | src/components/complete-button.tsx |  | Task 3 human-check (완료 애니메이션 체감·다음 레슨 강조·reduced-motion·iPad 히트영역) — workflow.human_verify_mode=end-of-phase로 지금 실행되지 않음, /gsd-verify-work의 end-of-phase UAT에서 harvest 예정 | open |  | 2026-08-24T08:25:20.047Z |  |

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
  }
]
````
