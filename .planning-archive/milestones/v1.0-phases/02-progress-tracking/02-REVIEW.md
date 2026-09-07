---
phase: 02-progress-tracking
reviewed: 2026-08-24T00:00:00Z
depth: standard
files_reviewed: 24
files_reviewed_list:
  - .env.example
  - package.json
  - scripts/check-progress-gates.mjs
  - scripts/check-progress-math.mjs
  - scripts/check-supabase-progress.mjs
  - scripts/e2e-progress.mjs
  - src/app/globals.css
  - src/app/lesson/[lessonId]/actions.ts
  - src/app/lesson/[lessonId]/page.tsx
  - src/app/page.tsx
  - src/app/step/[stepId]/page.tsx
  - src/app/unlock/done/page.tsx
  - src/app/unlock/route.ts
  - src/components/complete-button.tsx
  - src/components/module-accordion.tsx
  - src/components/progress-badge.tsx
  - src/components/progress-error.tsx
  - src/components/progress-summary.tsx
  - src/components/step-card.tsx
  - src/lib/auth.ts
  - src/lib/progress-math.ts
  - src/lib/progress-store.ts
  - src/lib/progress.ts
  - src/lib/supabase/admin.ts
  - src/lib/unlock-secret.ts
  - supabase/migrations/20260824120000_create_progress.sql
findings:
  critical: 0
  warning: 2
  info: 3
  total: 5
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-08-24T00:00:00Z
**Depth:** standard
**Files Reviewed:** 24 (of 26 listed — see note below)
**Status:** issues_found

## Summary

Reviewed the progress-tracking phase: the cookie-based unlock gate (`unlock-secret.ts`, `auth.ts`, `unlock/route.ts`), the Supabase data-access layer (`admin.ts`, `progress-store.ts`), the pure aggregation layer (`progress-math.ts`, `progress.ts`), the gated pages (`page.tsx`, `step/[stepId]/page.tsx`, `lesson/[lessonId]/page.tsx`), the optimistic-UI completion control (`complete-button.tsx`), the RLS-default-deny migration, and the static/e2e gate scripts.

This is a carefully implemented phase. The authorization ordering in `actions.ts` (cookie check → lesson existence check → write) is correct and gate-enforced (`check-progress-gates.mjs` G4), the `isValidUnlockValue` guard correctly prevents the classic "both sides undefined" bypass, RLS-with-zero-policies is intentional and confirmed by `check-supabase-progress.mjs`, and the `useOptimistic`/prop-convergence pattern in `complete-button.tsx` was traced in detail and is implemented correctly (no state-desync bug found). No BLOCKER-level correctness or security defects were found in the files reviewed.

Two WARNING-level robustness issues and three INFO-level items are listed below. `.env.example` could not be read directly — the sandbox's file-access policy denies reads of any `.env*` path, including the example file (this is an environment protection, not a code defect). Its content-shape was instead verified indirectly via `scripts/check-progress-gates.mjs` gates G6 (no value > 40 chars, no `eyJ`-prefixed JWT-looking value) and G7 (`.gitignore` ignores `.env*` except `.env.example`), and G3 (no `NEXT_PUBLIC_SUPABASE`/`NEXT_PUBLIC_UNLOCK` prefixes anywhere in `src/`, `scripts/`, or `.env.example`). This file is listed as "reviewed" in the frontmatter for scope-tracking purposes but its content was not directly inspected by this reviewer.

## Warnings

### WR-01: `killServerTree` does not kill the full process tree on non-Windows platforms

**File:** `scripts/e2e-progress.mjs:122-137`
**Issue:** The Windows branch correctly uses `taskkill /pid <pid> /T /F` to kill the entire process tree spawned by `next dev`. The POSIX (`else`) branch only calls `child.kill('SIGKILL')`, which signals the immediate child process only. `next dev` (via Next's CLI/Turbopack) can spawn additional worker subprocesses; killing only the parent risks leaving orphaned processes bound to `PORT` after the script exits (e.g. in CI or on repeated local runs), which would then cause subsequent `e2e-progress.mjs` invocations to fail to bind the port or produce misleading "server didn't start" timeouts.
**Fix:**
```js
// spawn with a detached process group so the whole tree can be killed:
const child = spawn(process.execPath, [nextBin, 'dev', '--port', String(PORT), '--hostname', HOST], {
  cwd: ROOT,
  stdio: ['ignore', 'pipe', 'pipe'],
  env: process.env,
  detached: process.platform !== 'win32',
});
...
function killServerTree(child) {
  if (!child || child.exitCode !== null) return;
  if (process.platform === 'win32') {
    try { execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: 'ignore' }); } catch {}
  } else {
    try { process.kill(-child.pid, 'SIGKILL'); } catch {} // negative pid = kill the process group
  }
}
```

### WR-02: `CompleteButton` collapses all Server Action failure causes into one generic, retryable error

**File:** `src/components/complete-button.tsx:28-40`
**Issue:** `toggleLessonComplete` can throw for three distinct reasons: an expired/invalid unlock cookie (`unauthorized`), a lesson id that no longer exists in the manifest (`invalid lesson`), or a transient Supabase write failure. The client's `catch` block treats all three identically — it shows `SAVE_ERROR_MESSAGE` ("저장하지 못했습니다. 다시 시도해주세요.") with a "다시 시도" button that calls `handleToggle` again. For the `unauthorized` case, retrying will deterministically fail forever (the cookie is still invalid), and the message gives the user no indication that the real fix is to revisit the `/unlock?key=...` link. This is a dead-end UX path masquerading as a transient/retryable error.
**Fix:** Re-throw or return a discriminated error from the action (e.g. `{ code: 'unauthorized' | 'invalid_lesson' | 'write_failed' }` via a typed result instead of `throw`), and branch the client message/CTA on `code === 'unauthorized'` to point the user back to re-unlocking rather than offering an infinite-retry button.

## Info

### IN-01: `lucide-react` version range looks inconsistent with the library's actual versioning scheme

**File:** `package.json:14`
**Issue:** `"lucide-react": "^1.33.0"` — `lucide-react` is not part of the stack documented in `.claude/CLAUDE.md`'s technology table, and historically the package has shipped under a `0.x` line (frequent minor bumps, no `1.0` major to date as of this reviewer's knowledge). A `^1.33.0` range is either a typo for something like `^0.4xx.0`, or reflects a real (but undocumented) major version bump. Worth a one-time `npm view lucide-react versions` / `npm ls lucide-react` check to confirm the installed version matches what was intended — an incorrect range risks `npm install` resolving to an unexpected or non-existent version.
**Fix:** Run `npm view lucide-react version` and correct the pinned range if it doesn't match; add the library to the CLAUDE.md stack table for future traceability.

### IN-02: Unchecked type assertion on the `stepId` route param

**File:** `src/app/step/[stepId]/page.tsx:23`
**Issue:** `const stepId = Number(stepIdParam) as StepId;` casts an arbitrary route string to `StepId` (presumably `1 | 2 | 3`) without a runtime guard. Today this is safe only because `getStep(stepId)` returns `undefined` for any value that isn't a recognized step and the page calls `notFound()` immediately after — but the cast happens before that check, so any future code inserted between the cast and the `getStep`/`notFound()` guard (or any other consumer of `stepId` added later) would silently trust an untyped `NaN`/out-of-range value as a valid `StepId`.
**Fix:** Validate before casting, e.g. `const parsed = Number(stepIdParam); const stepId = ([1, 2, 3] as const).includes(parsed as StepId) ? (parsed as StepId) : null; if (stepId === null) notFound();`

### IN-03: `ProgressSummary` shows "학습을 시작해볼까요?" even when there are zero lessons at all

**File:** `src/components/progress-summary.tsx:18-32`
**Issue:** `isEmpty = completed === 0` and `isAllComplete = completed === total && total > 0`. When `total === 0` (no lessons exist in the manifest — an unlikely but possible content state, e.g. a broken Velite build), `isEmpty` is `true` and `isAllComplete` is `false`, so the component renders "학습을 시작해볼까요?" / "완료한 레슨이 아직 없어요." even though there is nothing to start. This is a harmless cosmetic edge case given real content will always have `total > 0`, but it's an unguarded branch.
**Fix:** Add an explicit `total === 0` branch (render nothing, or a distinct "콘텐츠 없음" state) ahead of the `isEmpty`/`isAllComplete` checks.

---

_Reviewed: 2026-08-24T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
