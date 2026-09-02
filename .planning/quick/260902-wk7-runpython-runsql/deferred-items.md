# Deferred Items — quick 260902-wk7

## Pre-existing lint failure in site-nav.tsx (out of scope)

`npm run lint` fails with 2 errors in `src/components/site-nav.tsx` (lines 172, 189):
`react-hooks/set-state-in-effect` — "Calling setState synchronously within an effect
can trigger cascading renders."

Confirmed pre-existing: `git stash` reported "No local changes to save" before any
task edits in this quick task, and the errors reproduce identically against HEAD
before this quick task's commits. Neither `site-nav.tsx` nor any file it depends on
was touched by this plan's tasks (`globals.css`, `trace-editor.tsx`, `run-python.tsx`,
`run-sql.tsx`). Per the executor scope boundary rule, pre-existing failures in
unrelated files are logged here rather than auto-fixed.

`npx tsc --noEmit`, `node scripts/check-brand.mjs`, and
`node scripts/check-design-tokens.mjs` all pass cleanly for the files this plan
touches. Only the full-repo `npm run lint` step surfaces the unrelated site-nav.tsx
failure.
