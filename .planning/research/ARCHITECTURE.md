# Architecture Research

**Domain:** Content-heavy curriculum/learning site with progress tracking (personal, single-user)
**Researched:** 2026-08-24
**Confidence:** HIGH (Next.js/Supabase patterns are official, current docs) / MEDIUM (curriculum-site-specific conventions synthesized from common practice, not a single canonical source)

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Content Layer (build-time)                   │
├──────────────────────────────────────────────────────────────────────┤
│  content/step-1/module-x/lesson-y.mdx   (MDX files, git-versioned)   │
│  content/curriculum.ts                  (steps → modules → lessons   │
│                                           manifest: ids, titles,      │
│                                           order, estimated hours)     │
│  content/schedule.ts                    (date → lessonId[] mapping)  │
└───────────────────────────┬────────────────────────────────────────┘
                            │ imported at build time
┌───────────────────────────▼────────────────────────────────────────┐
│                     Next.js App Router (Vercel)                     │
├──────────────────────────────────────────────────────────────────────┤
│  Static/SSG pages          Server Components        Server Actions   │
│  /step/[stepId]            fetch progress from       markLessonDone  │
│  /lesson/[lessonId]        Supabase per-request      updateProgress  │
│  (generateStaticParams     to overlay onto static    (mutations,     │
│   from curriculum.ts)      content shell             'use server')   │
│                                                                        │
│  Client Components (islands): complete-button, progress ring,        │
│  schedule calendar — optimistic UI, localStorage fallback            │
└───────────────────────────┬────────────────────────────────────────┘
                            │ Supabase JS client (browser: anon key via
                            │ Server Action; server: service/anon key
                            │ via @supabase/ssr)
┌───────────────────────────▼────────────────────────────────────────┐
│                          Supabase (Postgres)                         │
├──────────────────────────────────────────────────────────────────────┤
│  progress table: lesson_id (PK), completed_at, user_id (constant)    │
│  (curriculum structure and lesson content are NOT in the DB —        │
│   they live in the content layer above; DB stores only *state*)      │
└──────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|-------------------------|
| Curriculum manifest (`content/curriculum.ts`) | Single source of truth for structure: Step → Module → Lesson hierarchy, ids, order, titles, estimated hours | Plain TypeScript object/array, hand-authored, imported everywhere (pages, schedule generator, progress aggregation) |
| Lesson content files (`content/**/*.mdx`) | Actual teaching content: concept explanation + code examples | MDX files, one per lesson, referenced by the lesson's id from the manifest |
| Schedule model (`content/schedule.ts` or generated) | Maps calendar dates (8/25–9/29) to ordered lesson ids | Small function/table: `date → lessonId[]`, derived from curriculum manifest + daily hour budget, not stored in DB (deterministic, recomputable) |
| Progress store (Supabase `progress` table) | Durable record of which lessons are completed and when | Single table keyed by `lesson_id`, no real auth — single implicit user |
| Route Handlers / Server Actions | Mutation boundary: write completion state to Supabase | Server Actions (`'use server'`) for form-like completion toggles; Route Handler only if a non-Next.js client (e.g., a script) needs the same endpoint |
| Server Components (lesson/step pages) | Merge static content (MDX) with live progress data per request | `async function Page()` reads MDX statically-imported content + queries Supabase for progress rows, renders merged view |
| Client Components (islands) | Interactive bits: complete button, progress bar/ring, schedule view | `'use client'`, call Server Action, apply optimistic update via `useOptimistic`/local state, fall back to `localStorage` if Supabase call fails |
| Progress aggregation | Compute per-Step/per-Module completion % from raw completed lesson ids | Pure function: `(curriculumManifest, completedLessonIds) => aggregates`, run in Server Component, no DB-side aggregation needed at this scale |

## Recommended Project Structure

```
src/
├── content/
│   ├── curriculum.ts        # Step/Module/Lesson manifest (structure + metadata)
│   ├── schedule.ts          # date -> lessonId[] schedule derivation
│   └── lessons/
│       ├── step-1/
│       │   └── module-x/
│       │       └── lesson-y.mdx
│       ├── step-2/
│       └── step-3/
├── app/
│   ├── page.tsx              # Dashboard: overall progress, today's schedule
│   ├── step/[stepId]/
│   │   └── page.tsx           # Module list + per-module progress (Server Component)
│   ├── lesson/[lessonId]/
│   │   ├── page.tsx           # Static MDX render + progress overlay (SSG + per-request Supabase read)
│   │   └── actions.ts          # 'use server' markComplete/markIncomplete
│   ├── schedule/
│   │   └── page.tsx           # Calendar/list view of schedule.ts + completion status
│   └── layout.tsx
├── lib/
│   ├── supabase/
│   │   ├── server.ts          # createServerClient (Server Components/Actions)
│   │   └── client.ts          # createBrowserClient (client islands)
│   ├── progress.ts            # aggregation functions (per-module/per-step %)
│   └── curriculum-helpers.ts  # lookups: lessonId -> module/step, ordering, next/prev lesson
└── components/
    ├── complete-button.tsx    # 'use client', optimistic + localStorage fallback
    ├── progress-bar.tsx
    └── schedule-calendar.tsx
```

### Structure Rationale

- **`content/` separate from `app/`:** Curriculum structure and lesson text are content, not application code. Keeping them in plain `.ts`/`.mdx` files (not the database) means content edits are git-tracked, reviewable, and require no DB migration or admin UI — appropriate for a single-author, single-user site with a 5-week deadline.
- **`lib/supabase/{server,client}.ts` split:** Mirrors the official `@supabase/ssr` pattern (`createServerClient` vs `createBrowserClient`) — Server Components/Actions read cookies via `next/headers`; client islands use the browser singleton. Prevents accidentally leaking a server-only client into client bundles.
- **`actions.ts` colocated with `lesson/[lessonId]/`:** Server Actions for progress mutations live next to the page that uses them, keeping the mutation boundary explicit and easy to find per feature rather than a global `api/` layer.
- **`lib/progress.ts` and `lib/curriculum-helpers.ts` as pure functions:** All aggregation (completion %, next/prev lesson, schedule status) is computed from the curriculum manifest + a raw list of completed lesson ids — no aggregate columns or triggers needed in Postgres at this scale (dozens to low hundreds of lessons, one user).

## Architectural Patterns

### Pattern 1: Static Shell + Per-Request Progress Overlay

**What:** Lesson/Step pages are generated via `generateStaticParams` from the curriculum manifest so content (MDX) is fast and cacheable; the same Server Component then does a lightweight Supabase read at request time to overlay completion state (checkmarks, progress %) on top of the static shell.
**When to use:** Any page where content is static/rare-to-change but a small amount of per-request state must be shown (completion badges, progress bars).
**Trade-offs:** Simpler than fully dynamic rendering (content still benefits from static optimization); however Next.js treats a page with a request-time data read as dynamic unless wrapped carefully (e.g., static content statically rendered, progress read in a small dynamic child component with `Suspense`, using Partial Prerendering-style composition) — for a 1-user site this nuance matters less than for scale, so a plain dynamic Server Component read per page load is acceptable and far simpler to build correctly in a short timeline.

**Example:**
```typescript
// app/lesson/[lessonId]/page.tsx
export async function generateStaticParams() {
  return curriculum.allLessonIds().map((id) => ({ lessonId: id }));
}

export default async function LessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const { default: LessonContent } = await import(`@/content/lessons/${lessonId}.mdx`);
  const isDone = await getCompletion(lessonId); // Supabase read, per-request

  return (
    <article>
      <LessonContent />
      <CompleteButton lessonId={lessonId} initialDone={isDone} />
    </article>
  );
}
```

### Pattern 2: Server Actions as the Sole Mutation Boundary

**What:** All writes to the `progress` table go through `'use server'` functions colocated with the pages that trigger them, never directly from the browser Supabase client.
**When to use:** Any state change (mark complete/incomplete). Even for a single-user app, routing mutations through a Server Action keeps the Supabase service/anon key usage server-side and centralizes validation (e.g., reject invalid lesson ids) in one place.
**Trade-offs:** Server Actions are queued/sequential per Next.js docs — irrelevant here since mutations are rare, deliberate user clicks, not high-frequency writes. A Route Handler (`app/api/.../route.ts`) is only needed if something outside a Next.js form/action needs to call the same mutation (unlikely for this project) — default to Server Actions.

**Example:**
```typescript
// app/lesson/[lessonId]/actions.ts
'use server';
import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';

export async function markComplete(lessonId: string) {
  const supabase = createServerClient();
  const { error } = await supabase
    .from('progress')
    .upsert({ lesson_id: lessonId, completed_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
  revalidatePath(`/lesson/${lessonId}`);
  revalidatePath('/'); // dashboard aggregate
}
```

### Pattern 3: Optimistic Client Update with localStorage Fallback

**What:** The complete-button client component flips its visual state immediately on click (optimistic), calls the Server Action, and if the network/Supabase call fails, writes the pending change to `localStorage` and retries on next load/online event, rather than losing the click.
**When to use:** Any mutation triggered from a client island where network reliability isn't guaranteed (mobile, flaky wifi) and losing a "mark complete" click would be frustrating for a personal learner tracking their own progress.
**Trade-offs:** Adds a small amount of client-side complexity (a pending-writes queue) for meaningfully better resilience; for a personal project, a simpler version (`useOptimistic` + toast-on-failure without a durable localStorage queue) is a reasonable and faster-to-build alternative — treat the localStorage queue as a nice-to-have, not a blocker for MVP.

## Data Flow

### Request Flow (viewing a lesson)

```
[User navigates to /lesson/x]
    ↓
[Next.js Server Component: page.tsx]
    ↓                                  ↓
[import MDX content, statically]  [Supabase query: SELECT completed_at
    resolved at build time]        FROM progress WHERE lesson_id = x]
    ↓                                  ↓
[Merge into rendered HTML: content + completion badge]
    ↓
[Sent to browser; CompleteButton hydrates with initialDone]
```

### Mutation Flow (marking a lesson complete)

```
[User clicks "Complete"]
    ↓
[Client component: optimistic UI update (instant visual feedback)]
    ↓
[Server Action: markComplete(lessonId)]
    ↓
[Supabase upsert into progress table]
    ↓                                  ↓ (on error)
[revalidatePath() refreshes          [localStorage pending-write queue,
 dashboard + lesson page cache]        retry banner / background retry]
```

### Progress Aggregation Flow (dashboard / step page)

```
[Server Component loads]
    ↓
[Supabase: SELECT lesson_id FROM progress]  (single query, all rows —
    ↓                                         table is small: 1 user, ~dozens
[curriculum.ts manifest: full lesson list     to low hundreds of lessons)
 with step/module membership]
    ↓
[lib/progress.ts: pure JS aggregation —
 group completed lesson ids by module/step,
 compute % per group and overall]
    ↓
[Render progress bars per Step/Module + overall %]
```

### Schedule Flow

```
[schedule.ts: deterministic function]
  (curriculum manifest + date range 8/25–9/29 + daily hour budget)
    ↓
  produces: { date: string, lessonIds: string[] }[]
    ↓
[/schedule page: Server Component]
    ↓
  cross-references completed lesson ids (from Supabase) against
  each day's planned lessons → shows "on track / behind" per day
```

## Scaling Considerations

This is a single-user, ~5-week personal project. Traditional multi-user scaling tables do not apply. The relevant "scale" axis is content volume and session frequency, not concurrent users.

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Current (1 user, ~50-150 lessons, daily use for 5 weeks) | Exactly the architecture above: static content + one small Supabase table, no caching layer, no CDN tuning needed beyond Vercel defaults |
| If content grows much larger (500+ lessons) or authoring becomes frequent | Still no need for a CMS or DB-backed content — consider splitting `curriculum.ts` into per-step manifest files for editability, but keep content as files |
| If multi-user is ever added later (explicitly out of scope now) | Would require real auth (Supabase Auth), `user_id` foreign key on `progress` with RLS policies scoped per user — deliberately deferred; do not build this now |

### Scaling Priorities

1. **Not a concern for this project:** concurrent load, query performance at scale — a single user hitting a table with at most a few hundred rows will never stress Supabase's free tier.
2. **Actual risk to manage:** authoring time for ~100+ lessons of MDX content within the 5-week window — this is a content-authoring bottleneck, not a technical scaling bottleneck. Architecture should optimize for "fast to add a lesson" (a manifest entry + one MDX file) over any runtime concern.

## Anti-Patterns

### Anti-Pattern 1: Storing Curriculum Structure and Lesson Text in Supabase

**What people do:** Model `steps`, `modules`, `lessons` as Postgres tables with a `content` text/JSON column, and build an admin UI or use the Supabase dashboard to author content.
**Why it's wrong:** For a single author writing all content once (not a multi-editor CMS), this adds a database dependency for something that is naturally version-controlled, diffable, and editable in a code editor. It also couples content edits to DB migrations/round-trips and makes it harder to preview content locally without hitting the network.
**Do this instead:** Keep curriculum structure in a typed TypeScript manifest and lesson content in MDX files under `content/`. Reserve Supabase strictly for *mutable runtime state* (completion status, timestamps) — the thing that genuinely needs a database.

### Anti-Pattern 2: Building Full Multi-User Auth for a Single-User App

**What people do:** Default to Supabase Auth with email/password or magic links "because that's the standard pattern," then add RLS policies scoped by `auth.uid()`.
**Why it's wrong:** Adds real implementation time (auth UI, session handling, RLS policy design, password reset flows) for a project explicitly scoped to one user with a hard external deadline (course starts 2026-09-30). This is exactly the kind of scope creep the project's own constraints warn against.
**Do this instead:** Use the simplest workable identity model: either (a) no `user_id` at all — the `progress` table only ever contains one person's rows, protected by not exposing the anon key's write path publicly (e.g., gate mutations through the Server Action, which is the only write path since the anon key is used server-side within the action, not exposed for arbitrary client writes), or (b) a single hardcoded `user_id` constant if it simplifies future RLS. Skip login screens, password flows, and session UI entirely. If any protection is wanted, a simple shared-secret check (e.g., a basic password gate via middleware, or Vercel deployment protection) is far cheaper than real auth and matches the "최소한의 보호만" constraint.

### Anti-Pattern 3: Aggregating Progress in the Database (Views/Triggers) at This Scale

**What people do:** Create Postgres views, materialized views, or triggers to maintain `module_progress` / `step_progress` summary tables.
**Why it's wrong:** Premature — with one user and at most a few hundred lesson rows, computing percentages in a JS function on every page load is fast (sub-millisecond) and far simpler to change when the curriculum manifest changes (no migration needed to add a module).
**Do this instead:** Fetch the flat list of completed `lesson_id`s once per page, aggregate in `lib/progress.ts` against the curriculum manifest in plain TypeScript.

### Anti-Pattern 4: Making Every Lesson Page Fully Dynamic to "Keep It Simple"

**What people do:** Skip `generateStaticParams` entirely and fetch/render everything dynamically per request, including content that never changes at runtime.
**Why it's wrong:** Loses free static-generation performance for content that is genuinely static (the MDX text), and conflates "the whole page must be dynamic" with "one small piece of the page needs live data." For a course-prep site meant to be used daily for 5 weeks, snappy navigation matters for the reading experience.
**Do this instead:** Statically generate content via `generateStaticParams` + build-time MDX import; keep only the progress-read part of the Server Component doing per-request work (it's a single indexed query on a tiny table, so the dynamic cost is negligible even without further optimization).

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Supabase (Postgres) | `@supabase/ssr` package: `createServerClient` in Server Components/Actions (reads/writes via cookies-based session or simply anon key if no auth), `createBrowserClient` only if any client-side direct read is needed (e.g., real-time progress sync across tabs — optional, not required for v1) | Prefer routing all writes through Server Actions rather than direct browser-to-Supabase writes, even without real auth, to keep the write path server-controlled and auditable |
| Vercel | Standard Next.js deployment; environment variables for `SUPABASE_URL` / `SUPABASE_ANON_KEY` (or publishable key) set in Vercel project settings | No special config needed beyond standard Next.js App Router deployment; static lesson pages benefit from Vercel's edge caching |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `content/curriculum.ts` ↔ everything else | Direct TypeScript import (compile-time) | Single source of truth; changing lesson order/ids here cascades to static params, schedule, and progress aggregation — treat as the "schema" of the content domain |
| Server Components ↔ Supabase | Server-side query via `lib/supabase/server.ts`, read-only for page renders | Keep queries minimal: one query per page for progress rows, no N+1 per-lesson queries — fetch all completed ids once and filter in memory using the curriculum manifest |
| Client islands ↔ Server Actions | `'use server'` function import called directly from the client component (Next.js compiles this into an RPC-style POST) | This is the only mutation path; do not also wire client components directly to a Supabase browser client for writes |
| `schedule.ts` ↔ `curriculum.ts` | Direct import; schedule is derived, not independently authored | Avoid hand-authoring a separate schedule data structure that duplicates lesson ids — derive day-by-day assignment programmatically from the manifest + hour budget so reordering the curriculum doesn't require manually re-editing the schedule |

## Suggested Build Order

Dependencies flow from structure → content → static rendering → state → interactivity → polish:

1. **Curriculum manifest (`content/curriculum.ts`)** — Define the Step → Module → Lesson data shape and populate it with real ids/titles/ordering for all 3 Steps. Nothing else can be built without this; it is the schema every other component reads.
2. **Supabase `progress` table + client setup (`lib/supabase/{server,client}.ts`)** — Stand up the table (`lesson_id`, `completed_at`, optional `user_id`) and both client helpers early, even before content is fully authored, so the read/write path can be tested against a couple of placeholder lessons.
3. **Static lesson/step pages with `generateStaticParams`** — Build the Server Component rendering pipeline (MDX import + page shell) using 2-3 real lessons as fixtures, before all content is written. Validates the static-generation pattern end-to-end.
4. **Lesson content authoring (MDX files)** — Once the pipeline works for fixtures, this becomes a content-writing task, parallelizable across Steps, not blocked on further engineering.
5. **Progress read + display (Server Component overlay)** — Wire the per-lesson completion badge and per-step/module aggregation (`lib/progress.ts`) using the Supabase read path from step 2.
6. **Mutation path: Server Action + complete button (client island)** — Add `markComplete`/`markIncomplete` Server Actions and the optimistic client button; this depends on both the DB table (step 2) and the page structure (step 3).
7. **Dashboard page** — Aggregate overall progress across all Steps using the same `lib/progress.ts` functions; purely a composition of steps 1, 2, 5.
8. **Schedule model + schedule page** — Derive the date→lesson mapping from the curriculum manifest and daily hour budget, cross-reference against completion state; naturally last among core features since it depends on the full curriculum manifest being finalized (reordering lessons after the schedule is built would require recomputation, which is fine since it's derived, not hand-authored).
9. **Resilience polish (optimistic UI edge cases, localStorage fallback, error states)** — Nice-to-have layer added once the core read/write loop is proven to work reliably.
10. **Vercel deployment + env var wiring** — Can technically happen as early as step 2 (deploy early, deploy often) but is listed last as a gate: confirm it works with real Supabase credentials before considering the milestone done.

**Key dependency notes for roadmap phasing:**
- Steps 1–3 form a natural "foundation" phase: without the manifest, DB table, and static rendering pattern working together on a couple of fixture lessons, no other work can proceed.
- Step 4 (content authoring) is the single biggest time sink (given ~100+ lessons across 3 Steps) and should be treated as its own phase/track, decoupled from further engineering changes once the pipeline (step 3) is stable — changing the rendering pattern mid-authoring is costly.
- Steps 5–7 (progress display, mutation, dashboard) are tightly coupled and reasonably form one phase — they all touch the same `progress` table and `lib/progress.ts` aggregation.
- Step 8 (schedule) is intentionally sequenced after the curriculum is stable, since the schedule derives from lesson counts/hours that content authoring (step 4) may still be adjusting.

## Sources

- Next.js official docs (via context7 `/vercel/next.js`): MDX dynamic import + `generateStaticParams` pattern, Server Actions vs Route Handlers guidance ("Server Actions are for mutations; Route Handlers for data fetching") — HIGH confidence, official/curated source.
- Supabase SSR official docs (via context7 `/supabase/ssr`): `createServerClient`/`createBrowserClient` patterns, middleware session refresh, Server Action auth pattern — HIGH confidence, official/curated source.
- General content-site/progress-tracking architecture conventions (static content + small mutable state table, optimistic UI, derived schedule) — MEDIUM confidence, synthesized from common Next.js + Supabase practice rather than a single canonical case study; validated against this project's explicit single-user, deadline-constrained context in `.planning/PROJECT.md`.

---
*Architecture research for: Content-heavy curriculum/learning site with progress tracking (Next.js + Supabase + Vercel, single-user)*
*Researched: 2026-08-24*
