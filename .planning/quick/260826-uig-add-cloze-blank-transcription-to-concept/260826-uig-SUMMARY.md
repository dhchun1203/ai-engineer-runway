---
phase: quick-260826-uig
plan: "01"
subsystem: content
tags: [remark, mdx, velite, react, supabase, cloze, transcription, ipad]

requires:
  - phase: 05-content-step-2-3
    provides: 35 authored lessons with a "## 3. 개념 설명" section per lesson
provides:
  - Build-time remark plugin that extracts one cloze blank per qualifying
    paragraph in each lesson's "## 3. 개념 설명" section, from author emphasis
    already present in the .mdx (never modifying the .mdx itself)
  - Blur/Enter-judged blank input component (never per-keystroke), with
    "정답 보기" reveal and NFC-normalized comparison
  - Supabase-backed cross-device persistence of filled blanks, isolated from
    the existing progress/complete-toggle table and code path
affects: [content, lesson-reading-screen, supabase-schema]

actuals:
  tokens: 20194
  tasks: 3
  commits: 3

tech-stack:
  added:
    - unist-util-visit (devDependency, remark tree traversal)
    - mdast-util-to-string (devDependency, plain-text extraction from mdast nodes)
    - unified / remark-parse / remark-mdx (devDependency, gate's own fixture harness)
  patterns:
    - "Build-time content transformation via a remark plugin that never
      writes back to source files — extraction, not modification"
    - "Shared normalizeAnswer() pure function between build-time (hash) and
      runtime (judging) to prevent the two from drifting apart"
    - "answer_hash column as a content-drift guard: a stored record is only
      honored when its hash matches the current blank's hash, so a later
      content edit silently invalidates stale records instead of mislabeling"

key-files:
  created:
    - src/lib/cloze-key.ts
    - src/lib/remark-cloze-blanks.ts
    - src/components/cloze-blank.tsx
    - src/components/cloze-provider.tsx
    - src/lib/cloze-store.ts
    - supabase/migrations/20260826090000_create_cloze.sql
    - scripts/e2e-cloze.mjs
    - scripts/check-supabase-cloze.mjs
  modified:
    - velite.config.ts
    - src/components/mdx-content.tsx
    - src/app/globals.css
    - src/app/lesson/[lessonId]/actions.ts
    - src/app/lesson/[lessonId]/page.tsx
    - tsconfig.json
    - package.json / package-lock.json
    - .planning/REQUIREMENTS.md

key-decisions:
  - "MIN_BLANK_LESSON_COUNT set to 29 (not the plan's assumed 32) — the 5
    CONT-05 project-guide lessons plus 1-1-dev-environment-setup render
    '## 3. 개념 설명' as a code diagram + table only, with zero qualifying
    paragraphs. Verified structural, not a plugin bug (100% consistent
    across the 6 lessons); DD-4 correctly excludes table cells."
  - "tsconfig.json: added allowImportingTsExtensions so cloze-key.ts.ts's
    relative .ts-extension import (required for Node's native type-stripping
    to load it directly in gates) type-checks under next build."
  - "e2e-cloze.mjs's own waitForServerReady requires an exact 200, not the
    other gates' '<500 = ready' — Turbopack's listener can accept
    connections before the router finishes on-demand compiling, which
    otherwise reads as 'ready' during a transient startup 404."

patterns-established:
  - "Broken-fixture self-test (s3 in e2e-cloze.mjs): a gate's own pure
    judge functions are fed deliberately-invalid input and must report a
    violation, or the whole gate fails — proves the gate can fail before
    trusting it to pass."

requirements-completed: [CONT-07, TRACK-05]

coverage:
  - id: D1
    description: "35 lessons build; 29/35 render >=1 cloze blank in the concept section, 6 render plain prose (project-guide format has no qualifying paragraphs)"
    requirement: CONT-07
    verification:
      - kind: e2e
        ref: "scripts/e2e-cloze.mjs s1 (coverage assertion against .velite/lessons.json)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Judgment happens once on blur/Enter with NFC normalization, never per keystroke; wrong answer never blocks progress; 정답 보기 reveals the answer"
    requirement: CONT-07
    verification:
      - kind: e2e
        ref: "scripts/e2e-cloze.mjs s6 (typing-only stays empty, blur judges correct), s7 (wrong answer -> incorrect, tab not trapped), s8 (NFD input judged correct)"
        status: pass
    human_judgment: false
  - id: D3
    description: "No horizontal overflow at 375px with a blank focused and filled, on both the primary lesson and the lesson with the longest answer; 44px touch target"
    requirement: CONT-07
    verification:
      - kind: e2e
        ref: "scripts/e2e-cloze.mjs s5, s9-1, s9-2"
        status: pass
    human_judgment: false
  - id: D4
    description: "Filled blanks persist to Supabase and survive a reload; anon key cannot read or write cloze_answer; progress table and complete-toggle code have zero diff"
    requirement: TRACK-05
    verification:
      - kind: e2e
        ref: "scripts/check-supabase-cloze.mjs (8-step live DB round trip), scripts/e2e-cloze.mjs s10 (browser save -> reload -> still correct -> cleanup)"
        status: pass
    human_judgment: false
  - id: D5
    description: "iPad real-device verification (touch target accuracy, on-screen keyboard overflow, no flicker during Hangul composition, 정답 보기 tappability)"
    requirement: CONT-07
    verification: []
    human_judgment: true
    rationale: "Requires a physical iPad Safari session — no automated proxy for touch-target accuracy or IME composition flicker on real hardware. This is exactly the Task 4 checkpoint."

duration: ~65min
completed: 2026-08-26
status: complete
---

# Quick Task 260826-uig: Cloze Blank Transcription for Concept Sections Summary

**Build-time remark plugin extracts existing emphasis into blur-judged cloze blanks across 29/35 lessons, with Supabase-backed cross-device persistence isolated from the progress table.**

## Performance

- **Duration:** ~65 min
- **Tasks:** 3 of 4 (Task 4 is a `checkpoint:human-verify` — not self-approved, see below)
- **Files modified:** 16 (excluding package-lock.json)

## Accomplishments

- `remark-cloze-blanks.ts` walks each lesson's `## 3. 개념 설명` section at build
  time and replaces one author-emphasized term per paragraph (first `**strong**`,
  else first `` `inlineCode` ``, else the first `용어(gloss)` parenthetical) with
  a `ClozeBlank` element — the `.mdx` source is never touched. A broken paragraph
  never breaks the build (per-paragraph try/catch fallback to plain text).
- `cloze-blank.tsx` judges the answer once, on blur or Enter, never per
  keystroke — the exact defense against the Hangul-composition-flicker family
  of bug this project already shipped once (Phase 6 gap G-06-9). Comparison
  runs through a single shared `normalizeAnswer()` (NFC + whitespace collapse)
  used by both the build-time hasher and the runtime judge, so they cannot
  silently diverge.
- Wrong answers never block progress and never trap focus; "정답 보기" always
  reveals the answer and leaves the input editable.
- Supabase `cloze_answer` table (RLS on, zero policies — same default-deny
  design as `progress`) stores filled blanks keyed by `answer_hash`, so a
  later lesson-content edit that shifts terms or indices silently invalidates
  the stale record instead of ever mislabeling a different term as correct.
- `progress` table, the complete-toggle Server Action, and lesson `.mdx` files
  all have zero diff — this feature is fully additive and optional.
- Two new gates (`e2e-cloze.mjs`, 26 scenarios; `check-supabase-cloze.mjs`,
  8 steps against the live DB) plus all 14 pre-existing gates and
  `check-design-tokens.mjs --strict` / `check-brand.mjs` pass.

## Task Commits

1. **Task 1: 빌드타임 빈칸 추출부터 화면 판정까지 (tracer, no storage)** - `4867637` (feat)
2. **Task 2: 신규 게이트 e2e-cloze.mjs** - `038d81e` (test)
3. **Task 3: Supabase 저장** - `dbdee3b` (feat)

Per DD-11, the Task 1 + Task 2 commits alone already form a working,
independently deployable feature — filled blanks just don't persist across
reloads until Task 3's commit lands on top.

## Files Created/Modified

- `src/lib/cloze-key.ts` - `normalizeAnswer()`, the single normalization function shared by plugin and component
- `src/lib/remark-cloze-blanks.ts` - build-time blank extraction plugin
- `src/components/cloze-blank.tsx` - blur/Enter-judged input island, consumes `ClozeProvider` context when present
- `src/components/cloze-provider.tsx` - lessonId + stored-records context, renders no DOM
- `src/lib/cloze-store.ts` - sole data-access layer for `cloze_answer`
- `supabase/migrations/20260826090000_create_cloze.sql` - matches the table already applied live via the management API
- `scripts/e2e-cloze.mjs` - new runtime gate (port 3215), 26 scenarios (s1-s10)
- `scripts/check-supabase-cloze.mjs` - new DB round-trip gate (8 steps)
- `velite.config.ts` - registers the remark plugin via relative import (esbuild-bundled config, `@/` alias does not resolve there)
- `src/components/mdx-content.tsx` - registers `ClozeBlank` in `defaultComponents`
- `src/app/globals.css` - blank styling (44px touch target, `calc()`-based width capped at 100%, accent/badge-neutral state colors)
- `src/app/lesson/[lessonId]/actions.ts` - adds `recordClozeAnswer` alongside the untouched `toggleLessonComplete`
- `src/app/lesson/[lessonId]/page.tsx` - reads cloze answers when unlocked, wraps `#lesson-article` in `ClozeProvider`
- `tsconfig.json` - `allowImportingTsExtensions: true` (see Deviations)
- `.planning/REQUIREMENTS.md` - adds CONT-07, TRACK-05 (unchecked — Task 4 checkpoint still pending)

## Decisions Made

- **MIN_BLANK_LESSON_COUNT = 29, not 32.** Measured and verified structural:
  the 5 CONT-05 project-guide lessons (`2-4-project-ai-shop-frontend`,
  `2-6-project-ai-shop-backend`, `3-2-project-rag-agent`,
  `3-5-project-orchestration`, `3-7-project-ax-launch`) plus
  `1-1-dev-environment-setup` render `## 3. 개념 설명` as a code diagram + table
  only — zero direct-child paragraphs qualify under DD-4's rules (tables are
  explicitly out of scope). This is 100% consistent across all 6 lessons, not
  a coverage bug. Following this project's established "실측 우선" convention
  (STATE.md has this pattern repeated verbatim for several other constants),
  the gate asserts the true structural ceiling.
- **`recordClozeAnswer` does not swallow storage errors** — mirrors
  `toggleLessonComplete`'s pattern (D-28) so the client can show its quiet
  "(저장 안 됨)" indicator. Only the input-shape validation guards (malformed
  index/hash/status — defense against a forged request, never hit by a real
  client) return silently.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] tsconfig.json needed `allowImportingTsExtensions`**
- **Found during:** Task 1 build verification
- **Issue:** `remark-cloze-blanks.ts` imports `cloze-key.ts` with an explicit
  `.ts` extension (required so Node's native type-stripping — used by the
  gate's `pathToFileURL` dynamic import — can resolve the relative import).
  `next build`'s TypeScript check rejected this with TS5097 until the flag
  was enabled.
- **Fix:** Added `"allowImportingTsExtensions": true` to `tsconfig.json`
  (safe with `noEmit: true` already set).
- **Files modified:** `tsconfig.json`
- **Verification:** `npm run build` (via env wrapper) succeeds
- **Committed in:** `4867637`

**2. [Rule 1 - Bug] e2e-cloze.mjs's own `waitForServerReady` false-positive**
- **Found during:** Task 2 first gate run
- **Issue:** The existing gates' `<500 = ready` polling condition let the
  gate proceed while Turbopack's dev server had accepted the TCP connection
  but not yet finished on-demand-compiling routes, causing a transient 404
  on `/` itself that read as "ready" — every subsequent page request then
  404'd for the rest of the run.
- **Fix:** Changed this gate's own readiness check to require an exact `200`
  status. Isolated to `e2e-cloze.mjs`; the existing gates were not touched.
- **Files modified:** `scripts/e2e-cloze.mjs`
- **Verification:** Re-ran the gate 3x with fresh server spawns, no recurrence
- **Committed in:** `038d81e`

**3. [Rule 1 - Bug] s3a false-positive-guard fixture didn't actually strip blanks**
- **Found during:** Task 2, writing the meta-test itself
- **Issue:** First attempt built the "broken" fixture by stripping the
  literal string `"ClozeBlank"` from compiled lesson code, but
  `extractClozeBlanks()` matches on the `answer:"...",index:"...",hash:"..."`
  attribute triple, not that identifier — the fixture was a no-op and the
  guard trivially "passed" for the wrong reason.
- **Fix:** Strip the actual attribute-triple regex pattern instead, which
  correctly simulates zero-blank lesson data.
- **Files modified:** `scripts/e2e-cloze.mjs`
- **Verification:** s3a now genuinely fails when the guard function is
  reverted to a no-op, confirming the meta-test has teeth
- **Committed in:** `038d81e`

---

**Total deviations:** 3 auto-fixed (1 blocking, 2 bugs)
**Impact on plan:** All three were necessary for correctness of the gate/build
itself; none touch application behavior described in the plan's design
decisions. No scope creep.

## Issues Encountered

- `MDXContent` (`src/components/mdx-content.tsx`) calls `useMemo` without a
  `'use client'` directive, yet renders correctly under Next.js 16 / React 19
  in both dev and production build — pre-existing code from an earlier phase,
  unmodified by this plan's `files_modified` list, and out of this task's
  scope to investigate further. Flagged here only because it looked
  surprising during review; build, dev server, and Playwright interaction
  tests all confirmed it works as-is.

## User Setup Required

None for Tasks 1-3 — the `cloze_answer` table was already created live by
the orchestrator before this plan started. Task 4's checkpoint covers the
one remaining manual step (real iPad Safari verification) and deployment.

## Next Phase Readiness

- Tasks 1-3 committed, all gates green, `progress` table and lesson `.mdx`
  content untouched — ready for the Task 4 checkpoint (real iPad verification)
  and `git push` to deploy.
- `.planning/REQUIREMENTS.md` CONT-07/TRACK-05 checkboxes intentionally left
  unchecked pending Task 4 approval — the orchestrator should check them off
  after the checkpoint resolves.

## Threat Flags

None beyond what the plan's own `<threat_model>` already covers (T-uig-01
through T-uig-08, all mitigated as designed — see plan file).

---
*Quick task: 260826-uig*
*Completed: 2026-08-26*
