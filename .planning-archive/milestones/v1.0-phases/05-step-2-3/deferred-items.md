# Deferred Items — Phase 05-step-2-3

Out-of-scope discoveries logged during execution, per the executor's scope-boundary rule
("only auto-fix issues directly caused by the current task's changes"). Not fixed here.

## Plan 05-13, Task 2 — pre-existing `npm run lint` failures (Phase 1 origin, unrelated files)

**Found during:** Task 2's required verify chain (`npm run build && ... && npm run lint`).

**Issue:** `npm run lint` fails with 2 errors + 1 warning, all in files this plan never touches:
- `src/components/theme-toggle.tsx:15` — `react-hooks/set-state-in-effect`: `setIsDark(...)` called
  synchronously inside a `useEffect` body.
- `src/components/lesson-nav.tsx:10` — `@next/next/no-assign-module-variable`: assigns to a
  variable named `module`.
- `src/components/lesson-nav.tsx:4` — unused `StepId` import (warning only).

**Origin:** both files date to Phase 1 commits `76d4824` (`feat(01-05)`) and `8ebc068`
(`feat(01-04)`) and have not been modified since. No prior Phase 4 or Phase 5 SUMMARY records
running `npm run lint` as a gate — this is the first time it has been run as part of this
phase's verification, and it surfaces pre-existing Phase 1 debt, not a regression introduced
by Plan 05-13 or any other Phase 5 plan.

**Not fixed:** per scope-boundary rule, these are out of scope for Plan 05-13's Task 2 (empty-state
copy / UI-SPEC / Making-of). Fixing them would touch component files with no relationship to this
task's `files_modified` list.

**Note:** `npm run lint` is not part of the `<deploy_gate>` the orchestrator specified for this
plan (build / check-lesson-structure / check-manifest / check-brand / next-start-curl only), so
this does not block Step 3's production deploy.

**Recommended follow-up:** a small, standalone Phase 6 (or backlog) task to fix both files —
low risk, no behavior change expected (move `setIsDark` init to `useState(() => ...)` lazy
initializer or an `if` guard before calling `setState`; rename the `module` local variable).
