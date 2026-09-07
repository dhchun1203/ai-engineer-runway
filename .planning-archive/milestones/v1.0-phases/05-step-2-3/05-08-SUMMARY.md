---
phase: 05-step-2-3
plan: 08
subsystem: content
tags: [mdx, velite, step-3, rag, hybrid-search, project-guide]

# Dependency graph
requires:
  - phase: 05-step-2-3
    provides: "Plan 01 approved 3-form skeleton (심화·개요·프로젝트 가이드) + structure gate L1~L7 + Step 3 depth calibration precedent (3-1-vector-search-basics)"
provides:
  - "Locked Step 3 depth bar, re-confirmed on a second (post-trim) pilot — '이제 맞다' approval covers all 12 remaining Step 3 lessons, not just the original pilot"
  - "3-1-hybrid-search-reranking.mdx — overview lesson at the approved depth (definitions + analogy, one read-only snippet, judgement-style 해보기, no tuning/weighting/threshold guidance)"
  - "3-2-project-rag-agent.mdx — 3rd of 5 프로젝트 준비 가이드 (CONT-05), checklist-table format, zero solved architecture"
affects: [05-09, 05-10, 05-11, 05-12, 05-13]

# Actuals (#2632)
actuals:
  tokens: 3837
  tasks: 3
  commits: 4

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Depth-cut vocabulary: 'trade-off/tuning reasoning' (how to choose a value, what breaks at a wrong setting, when X beats Y) is the cut line; 'definition + one analogy' and 'name it as a team decision point' is the keep line — applied consistently across the re-trimmed pilot and both new lessons"
    - "실무 팁 section for overview lessons now reads as 'these are decisions a team makes, recognize the term' rather than operational how-to — replaces the original pilot's tuning-bullet style"
    - "프로젝트 가이드 ④ section carries zero code fences by construction (not just zero disallowed-language fences) — avoids the 'reads like a tutorial' failure mode entirely rather than relying only on the language-allowlist gate"

key-files:
  modified:
    - src/content/lessons/step-3/3-1-vector-search-basics.mdx
    - src/content/lessons/step-3/3-1-hybrid-search-reranking.mdx
    - src/content/lessons/step-3/3-2-project-rag-agent.mdx

key-decisions:
  - "Step 3 depth bar re-approved post-trim ('이제 맞다', 2026-08-26) — the trimmed 3-1-vector-search-basics.mdx is now the reference standard for all 12 remaining Step 3 lessons, superseding the pre-trim pilot that 05-01's checkpoint had only conditionally approved"
  - "Ordering: depth-trim + redeploy + human verification happened BEFORE this plan's own two tasks, inserted as Task 0 ahead of the plan's Task 1/2 — prevents the 2 lessons in this plan (and by extension the 10 in 05-09~05-12, written in parallel) from inheriting a depth the user had already flagged as too deep"
  - "check-manifest.mjs intentionally skipped this wave per orchestrator instruction — hasContent flips push the measured count past the Wave-2 constant (23); Plan 05-13 reconciles from a fresh measurement after the wave merges. Constant left untouched."
  - "No push in this run — 05-13 owns the Step 3 deploy after all parallel lessons land"

patterns-established:
  - "'실무 팁' for Step 3 overview lessons: name the decision point (top-k, rerank count, chunk size, model choice) and that it's team-decided, never a rule for how to decide"
  - "프로젝트 준비 가이드 ④ 실무 예제: pure preparation-checklist table, no code fence at all (stricter than the language-allowlist gate requires)"

requirements-completed: [CONT-05]

coverage:
  - id: D1
    description: "3-1-vector-search-basics.mdx trimmed to the shallower Step 3 depth per checkpoint item 2 answer (c) — chunk-size tuning trade-off, metadata storage-timing tip, and embedding-model-swap operating tip removed from 개념/실무팁 sections while definitions, the one snippet, and all 3 judgement 해보기 stayed intact"
    requirement: "CONT-04"
    verification:
      - kind: manual_procedural
        ref: "Task 0 checkpoint — user response '이제 맞다' confirming production URL https://ai-engineer-runway.vercel.app/lesson/3-1-vector-search-basics"
        status: pass
    human_judgment: true
    rationale: "Depth adequacy is not automatable — the user judged the trimmed pilot directly against the production page and approved it as the standard for the remaining 12 Step 3 lessons"
  - id: D2
    description: "3-1-hybrid-search-reranking.mdx — hybrid search (BM25 + vector) and re-ranking overview lesson, 8 subheadings, 3 judgement 해보기, one typescript read-only snippet, no tuning/weighting/threshold prescriptions"
    requirement: "CONT-05"
    verification:
      - kind: unit
        ref: "node scripts/check-lesson-structure.mjs (25 lessons, 7 checks, includes L7 paragraph-length)"
        status: pass
      - kind: unit
        ref: "node scripts/check-brand.mjs (86 files, 0 violations)"
        status: pass
      - kind: other
        ref: "grep verification of acceptance criteria: 6 headings in order, 3 해보기, 5 answer blocks, 1 typescript fence <=30 lines, 0 npm/npx/실행 안내 strings, 0 forbidden 학습목표 verbs, 0 kant/sk-ant- strings"
        status: pass
    human_judgment: false
  - id: D3
    description: "3-2-project-rag-agent.mdx — 3rd of 5 프로젝트 준비 가이드, checklist-table ④ (zero code fences), checkbox ⑥, review pointers to 3-1-vector-search-basics / 3-1-hybrid-search-reranking / 2-7-prompt-patterns by slug, no solved RAG architecture"
    requirement: "CONT-05"
    verification:
      - kind: unit
        ref: "node scripts/check-lesson-structure.mjs (25 lessons, 7 checks)"
        status: pass
      - kind: unit
        ref: "node scripts/check-brand.mjs (86 files, 0 violations)"
        status: pass
      - kind: other
        ref: "grep verification: 6 headings, 3 해보기, 5 answer blocks, 5 readiness checkboxes, 0 code fences in section 4, all 3 review-pointer slugs present, 0 '구현해'/'함수를 작성' strings"
        status: pass
    human_judgment: false

duration: "Task 0 ~25min active editing + checkpoint wait for user approval + Task 1-2 ~20min active authoring (post-approval)"
completed: 2026-08-26
status: complete
---

# Phase 5 Plan 8: Step 3 depth re-approval + hybrid search/RAG project guide Summary

**Re-trims and re-approves the Step 3 depth pilot ('이제 맞다'), then writes the hybrid-search/re-ranking overview and the 3rd RAG-agent 프로젝트 준비 가이드 to that bar — locking the depth standard for the 10 sibling lessons being written in parallel**

## Performance

- **Duration:** Task 0 ~25min (00:2x–00:49 KST) + checkpoint wait for human depth verification + Task 1–2 ~20min (post-approval, 01:0x–01:13 KST)
- **Started:** 2026-08-25 (session start, exact pre-Task-0 timestamp not machine-recorded)
- **Completed:** 2026-08-26T01:13:45+09:00 (last task commit)
- **Tasks:** 3 (Task 0 inserted depth-trim, Task 1 hybrid-search lesson, Task 2 RAG project guide)
- **Files modified:** 3

## Accomplishments

- Re-trimmed `3-1-vector-search-basics.mdx` per the (c) checkpoint verdict ("too deep, cut further") — removed chunk-size tuning trade-off, metadata storage-timing tip, embedding-model-swap operating tip; kept every definition, the one read-only snippet, and all 3 judgement-style 해보기 untouched
- Deployed the trim to production and got explicit re-approval ("이제 맞다") — this is now the locked depth reference for all 12 remaining Step 3 lessons, not just this plan's 2
- Wrote `3-1-hybrid-search-reranking.mdx` (8 subheadings, 3 judgement 해보기, one 20-line typescript snippet) applying the same depth discipline: top-k and rerank-candidate-count are named as team decisions, never as rules to follow
- Wrote `3-2-project-rag-agent.mdx`, the 3rd of 5 프로젝트 준비 가이드, matching the `2-4-project-ai-shop-frontend.mdx` reference format exactly — checklist table in ④ with zero code fences, readiness checkboxes in ⑥, review pointers to 3 specific prior-lesson slugs
- All three files pass `check-lesson-structure.mjs` (25 lessons now, 7 checks including L7 paragraph length) and `check-brand.mjs` (0 violations across 86 files)

## Task Commits

1. **Task 0: Trim `3-1-vector-search-basics.mdx` to shallower depth (D-62 (c))** - `3443e3e` (fix) — pushed and deployed for the checkpoint, approved before this plan's own tasks began
2. **Task 1: Write `3-1-hybrid-search-reranking.mdx`** - `d41231f` (feat)
3. **Task 2: Write `3-2-project-rag-agent.mdx`** - `ae3b5e9` (feat)

**Plan metadata:** (this commit — `docs(05-08): complete hybrid-search + RAG project guide plan`)

_Note: 3 execution commits + 1 metadata commit = 4 total. No push for Tasks 1–2 — per orchestrator instruction, Plan 05-13 owns the Step 3 deploy after all parallel wave lessons (05-09~05-12) land._

## Files Created/Modified

- `src/content/lessons/step-3/3-1-vector-search-basics.mdx` - Depth trim (Task 0): removed 3 operational trade-off passages, kept structure/definitions/exercises intact. Frontmatter untouched.
- `src/content/lessons/step-3/3-1-hybrid-search-reranking.mdx` - New body, `hasContent: false → true`. Hybrid search + re-ranking overview at the approved depth.
- `src/content/lessons/step-3/3-2-project-rag-agent.mdx` - New body, `hasContent: false → true`. 3rd of 5 프로젝트 준비 가이드 (CONT-05).

## Decisions Made

- Step 3 depth bar is now anchored to the **trimmed** `3-1-vector-search-basics.mdx`, re-approved post-trim — this supersedes the 05-01 SUMMARY's note that the pre-trim pilot was only conditionally approved pending this exact rework
- Task 0 (the trim) was executed and deployed **before** this plan's own Task 1/2, per explicit orchestrator sequencing — prevents both this plan's lessons and the 10 sibling lessons being written concurrently in other worktrees from locking in a depth the user had already rejected
- `check-manifest.mjs` was not run this wave (intentionally red per Wave 3 plan note) — the constant is reconciled by Plan 05-13 after the full wave merges; this plan does not touch the constant
- No production push for Tasks 1–2 — Plan 05-13 owns the Step 3 batch deploy

## Deviations from Plan

### Scope Deviations (orchestrator-directed, not auto-fixed)

**1. [Inserted Task 0] Depth-trim of `3-1-vector-search-basics.mdx` ahead of this plan's own tasks**

- **Trigger:** The orchestrator's initial dispatch for this plan inserted a mandatory first task not present in `05-08-PLAN.md`: trim the already-shipped Step 3 pilot to a shallower depth, deploy it, and stop for user judgment — because the 05-01 checkpoint had answered "(c) too deep, cut further" on the pilot *after* it was already written, meaning the shipped pilot no longer represented the approved standard the remaining 12 Step 3 lessons (including this plan's 2) were supposed to be written to.
- **Action:** Executed as a blocking-human checkpoint before touching this plan's own files. Removed 5 concrete passages (chunk-size trade-off definition sentence, chunk-size trade-off 핵심정리 bullet, metadata-timing tip, embedding-model-swap tip, a chunk-size-choice heuristic buried in a 해보기 answer). Deployed to production, verified 200 + correct content, and stopped for explicit user re-approval.
- **Outcome:** User approved with "이제 맞다" (2026-08-26). This plan then proceeded to its own Task 1 and Task 2 using the same cut/keep discipline.
- **Files modified:** `src/content/lessons/step-3/3-1-vector-search-basics.mdx`
- **Committed in:** `3443e3e`

---

**Total deviations:** 1 orchestrator-directed insertion (not a Rule 1-4 auto-fix — it was an explicit instruction from the dispatching prompt, executed as a blocking-human checkpoint with no self-approval).
**Impact on plan:** Necessary and load-bearing — without this re-approval, this plan's 2 lessons and the 10 lessons written concurrently by sibling agents in 05-09~05-12 would all have inherited a depth the user had already flagged as excessive, risking 12 lessons of rework.

## Issues Encountered

None beyond the depth-approval checkpoint itself (documented above as Deviation 1, not an issue). Both Task 1 and Task 2 executed on the first pass — no Rule 1-3 auto-fixes were needed; all gates passed on first run.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **Plan 05-13 must reconcile `check-manifest.mjs`'s `EXPECTED_HAS_CONTENT_COUNT`** after this wave (05-08~05-12) fully merges — this plan's 2 `hasContent` flips are part of that eventual recount, currently intentionally red.
- **Plan 05-13 owns the Step 3 production deploy** — this plan did not push Tasks 1–2 to production; only Task 0's trim was pushed (per its own checkpoint requirement to verify on production).
- **Depth bar is now locked and user-verified for the remaining Step 3 batch** — 05-09 through 05-12 (10 lessons) can proceed using `3-1-vector-search-basics.mdx` (post-trim) and this plan's 2 lessons as the concrete reference examples, not the 05-01-era pre-trim version.
- No blockers.

---
*Phase: 05-step-2-3*
*Completed: 2026-08-26*

## Self-Check: PASSED

All 3 files referenced in this SUMMARY exist on disk (`3-1-vector-search-basics.mdx`, `3-1-hybrid-search-reranking.mdx`, `3-2-project-rag-agent.mdx`), and all 3 execution commits (`3443e3e`, `d41231f`, `ae3b5e9`) are present in git history (`git log --oneline` confirms all three hashes).
