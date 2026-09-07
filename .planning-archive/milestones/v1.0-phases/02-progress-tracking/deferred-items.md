# Phase 02 — Deferred Items

Out-of-scope discoveries found during execution, logged per the executor's deviation
rules (scope boundary: pre-existing issues unrelated to the current task are not
auto-fixed, only logged).

## Found during 02-01 Task 2

- **`npm run lint` reports 2 pre-existing errors + 1 warning in Phase 1 files, unrelated to this plan's changes:**
  - `src/components/lesson-nav.tsx:10` — `@next/next/no-assign-module-variable` (assigns to `module`)
  - `src/components/lesson-nav.tsx:4` — `StepId` defined but never used (warning)
  - `src/components/theme-toggle.tsx:15` — `react-hooks/set-state-in-effect` (setState called synchronously inside `useEffect`)
  - Both files were committed in Phase 1 (`76d4824`, `8ebc068`) and have no uncommitted changes from this plan. Confirmed out of scope: `npx eslint src/lib/supabase/admin.ts src/lib/progress-store.ts scripts/check-progress-gates.mjs` (all files created/modified by 02-01 Task 2) passes clean with zero errors/warnings.
  - Not fixed here per scope boundary. A future phase touching either file should resolve these.
