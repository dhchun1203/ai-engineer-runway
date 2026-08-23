# Pitfalls Research

**Domain:** Personal curriculum/learning-tracker site (Next.js + Supabase + Vercel), single user, hard external deadline (2026-09-30), content-heavy (~35 Korean lessons with code)
**Researched:** 2026-08-24
**Confidence:** MEDIUM — core software-engineering pitfalls (RLS, auth, state sync, MDX tooling) are well-established and cross-checked against current docs/community sources; the deadline-management pitfalls are inferred from project shape and general project-management pattern-matching (well-established but not citation-backed for this specific project).

## Critical Pitfalls

### Pitfall 1: Building the platform instead of writing the curriculum (the #1 deadline killer)

**What goes wrong:**
The project's real bottleneck is ~35 Korean-language lessons with working code examples across 3 curriculum steps — that is 60–100+ hours of writing/example-authoring work by itself. Because building the site (routing, DB schema, auth, progress UI, a calendar) is more comfortable and more "measurable" than writing prose, developers routinely spend 2–3 of the available 5 weeks polishing the platform (dark mode, animations, a fancy dashboard, an admin CMS to edit content) before writing a single real lesson. By the time content-writing starts, there isn't enough runway left before 9/30, and the site ships nearly empty or the "study before the course starts" goal is missed entirely.

**Why it happens:**
Engineering work has clear done/not-done states and dopamine-friendly visible progress (a working button, a nice-looking page). Writing 35 lessons of accurate, well-explained content is open-ended, harder to estimate, and doesn't feel like "real progress" the same way. Scope also creeps naturally: "just add a calendar," "just add a small CMS so I don't hand-edit MDX," "just add nice progress rings."

**How to avoid:**
- Timebox platform-building explicitly (e.g., "3–4 days max for MVP shell") before the roadmap moves to content phases.
- Treat the site as a "dumb" content renderer + checkbox + counter for v1 — no CMS, no drag-and-drop scheduling, no fancy dashboards.
- Sequence phases so content-authoring phases (writing the 35 lessons) occupy the majority of the 5-week window, not the platform phases.
- Write 1–2 real lessons *early*, during/right after the platform MVP, to validate the content format works before committing to it for all 35.

**Warning signs:**
- End of week 1 and zero real lesson content has been written (only scaffolding/lorem-ipsum content exists).
- Roadmap has more phases dedicated to "features" (calendar, admin UI, theming) than to "write Step N content."
- Time spent tweaking UI polish (colors, spacing, animations) before all lessons have even placeholder text.

**Phase to address:**
Phase 1 (MVP platform shell) must be scoped minimally and time-boxed; content-authoring should be its own explicit phase(s) that the roadmap protects the majority of calendar time for.

---

### Pitfall 2: Over-engineered auth for a single user

**What goes wrong:**
Teams build full multi-provider OAuth, signup/password-reset flows, email verification, or role-based access control for a site that will only ever have one user (the project owner). This burns days on auth edge cases (session refresh, email templates, forgot-password UX) that have zero payoff for a personal tool.

**Why it happens:**
Supabase Auth's docs and tutorials default to "real app" patterns (signup, login, magic link, OAuth providers) because that's what most Supabase users need. It's easy to copy the standard flow without asking whether it's the right size for a 1-person tool.

**How to avoid:**
Pick the simplest option that still lets Supabase attribute rows to "the user" for RLS purposes, and stop there:
- **Simplest (recommended):** One Supabase Auth user (created once via the dashboard or a setup script), signed in via email+password or magic link. No signup UI, no password reset UI — if the session expires, just log back in manually. RLS policies scope to `auth.uid()`.
- **Even simpler alternative:** Skip Supabase Auth entirely; gate the whole site with a single shared-secret cookie set by a Vercel Edge Middleware check against an environment variable. All Supabase writes go through server-side code using the **service role key** (never exposed to the client), so RLS complexity is sidestepped almost entirely (still enable RLS as defense-in-depth, but the app doesn't depend on `auth.uid()`).
- Do not build: signup forms, password reset flows, OAuth provider buttons, invite systems, or role/permission tables.

**Warning signs:**
- Any UI for "forgot password," "sign up," or "invite a user" exists in the plan.
- More than a few hours spent on auth before any lesson content or progress-tracking feature exists.

**Phase to address:**
Phase 1 (foundation/setup) — the auth approach must be decided in one sitting, not iterated on.

---

### Pitfall 3: Supabase RLS misconfiguration (both directions)

**What goes wrong:**
Two opposite failure modes, both common:
1. **Wide open:** RLS is left disabled (Supabase tables default to RLS *off* when created via SQL/dashboard), so the public anon key — which is meant to be embedded in client JS and is trivially extractable from the bundle — grants full read/write access to progress data and any personal notes stored in the DB. In 2025, security researchers found hundreds of production Supabase apps with exactly this exposure.
2. **Locked out of your own app:** RLS is enabled with a policy that's too strict or references the wrong column (e.g., forgetting `auth.uid() = user_id`, or wrapping it incorrectly so it re-evaluates per row and silently fails), and the single user can no longer write their own progress. The common "fix" — disabling RLS to make the error go away — reopens failure mode #1.

**Why it happens:**
RLS is opt-in per table, easy to forget on a newly created table, and Supabase's default dashboard flow doesn't force a policy before the table is usable via the API. Debugging RLS policy failures is non-obvious (silent empty results rather than clear errors), so disabling RLS is the fastest-looking fix under time pressure.

**How to avoid:**
- Enable RLS on every table the moment it's created — make this a checklist item in the migration/setup phase, not an afterthought.
- Write exactly one policy pattern for all progress/schedule tables: `using (auth.uid() = user_id)` for select/insert/update/delete, tied to the single seeded user's ID (or bypass RLS by writing exclusively through server-side code with the service-role key, per Pitfall 2's simpler alternative).
- Never disable RLS as a debugging step. If a policy fails, fix the policy or verify the session/JWT, don't remove the guard.
- Confirm no `NEXT_PUBLIC_`-prefixed environment variable ever holds the Supabase **service role** key — only the anon key may be public.

**Warning signs:**
- A table exists in Supabase with RLS shown as "disabled" in the dashboard table list.
- A policy uses `using (true)` "temporarily to test."
- Progress-save silently does nothing and the fix under consideration is "just turn off RLS for now."

**Phase to address:**
Phase covering Supabase schema/setup — RLS policy per table should be a defined acceptance criterion, verified before the phase is marked done.

---

### Pitfall 4: MDX/content pipeline rabbit hole

**What goes wrong:**
Choosing (or building) an over-engineered content pipeline burns days that should go to writing lessons. Specific traps:
- **Contentlayer** is a commonly recommended MDX content-layer tool, but it stalled and does not support Next.js 14+ — adopting it now is a dead end that will require a mid-project migration.
- `next-mdx-remote` (or `next-mdx-remote/rsc`) does **not** load/parse content from a filesystem source by itself — it only renders MDX strings you hand it, so a separate file-reading/frontmatter-parsing layer is still needed, which people often discover only after wiring half the pipeline.
- Building a custom syntax-highlighting setup (Shiki themes for Python/SQL/TS/JS all at once) or a custom MDX component library (callouts, tabs, code-diff viewers) before writing a single lesson is a classic "infrastructure before content" trap that compounds Pitfall 1.
- Remote/dynamic MDX sources (fetching MDX from a DB or CMS instead of the filesystem) add complexity with no payoff for a single-author, filesystem-editable content set.

**Why it happens:**
Tutorials and star counts point to Contentlayer as "the" answer; nobody notices it's unmaintained until the Next.js version mismatch bites. MDX component libraries feel like they'll "save time later" but are built speculatively before knowing what the 35 lessons actually need.

**How to avoid:**
- Use a simple, maintained stack: local `.mdx` files in the repo, `gray-matter` (or Zod-validated frontmatter) for metadata, and `next-mdx-remote/rsc` (or Next.js's built-in `@next/mdx`) for rendering — or **Velite** if type-safe content schemas across 35 files are worth the setup.
- Build only the MDX components actually needed after drafting the first 2–3 real lessons (typically: code block, a simple callout/note box, maybe a "실무 예제" section heading component) — not a speculative full component library.
- Keep content in the filesystem (git-tracked `.mdx` per lesson), not a database or headless CMS — this is the fastest edit loop for a single author and needs no admin UI.

**Warning signs:**
- Contentlayer appears in `package.json`.
- More than half a day spent choosing/wiring the content pipeline before the first real lesson is drafted.
- An MDX component library exists with components that no lesson actually uses yet.

**Phase to address:**
Phase 1 (foundation) for pipeline choice; content-authoring phases should be able to add lessons by just adding `.mdx` files with zero further platform work.

---

### Pitfall 5: Progress state — double source of truth

**What goes wrong:**
Completion state and progress percentages get tracked in two places that drift apart: e.g., `localStorage`/React state for instant UI feedback and Supabase as the "real" store, with no clear reconciliation rule. Symptoms: a lesson shows "완료" on one device/tab but not another; refreshing the page reverts a just-checked lesson because a cached Server Component or `localStorage` value wins over the DB; the progress percentage is computed client-side from a stale cached list of lessons while the DB has since gained/lost rows (e.g., a lesson was renamed or split during content-writing).

**Why it happens:**
Optimistic UI (instant checkbox toggle) is good UX, but if the client trusts its own local cache as ground truth instead of treating it as a temporary overlay that reconciles with the server response, the two stores silently diverge — especially across the multiple curriculum-editing passes that will happen while authoring 35 lessons (lesson IDs/slugs changing invalidates cached progress keyed by old IDs).

**How to avoid:**
- Supabase is the **single** source of truth. `localStorage`/client state may only exist as an optimistic-UI cache that is immediately reconciled with (and overwritten by) the server's response — never read from `localStorage` as authoritative on load.
- Key progress rows by a stable lesson identifier decided once (e.g., a slug set at content-creation time), and never reuse/repurpose that identifier for a different lesson later — if a lesson is deleted/restructured, explicitly migrate or delete its progress row rather than leaving orphaned data.
- Compute "progress %" server-side (or in a single shared function) from the canonical lesson list + canonical completion rows at request time — don't cache a lesson count in the client that can go stale as content is added during the 5-week authoring sprint.
- If using Next.js caching (`fetch` cache, `revalidatePath`/`revalidateTag`, RSC), explicitly invalidate the progress/lesson-list cache on every write — a checked box that "doesn't stick" after navigation is almost always a caching miss, not a DB bug.

**Warning signs:**
- A completion checkbox appears checked, then reverts after navigating away and back.
- Progress % differs between the dashboard and a lesson list page.
- `localStorage.getItem('progress')` or similar exists anywhere and is read without an immediate server round-trip to confirm it.

**Phase to address:**
Phase covering progress-tracking feature — include an explicit UAT step: "toggle completion, hard-refresh, confirm state persists and matches across two different pages showing progress."

---

### Pitfall 6: Scope creep on schedule/calendar features

**What goes wrong:**
The 5-week study schedule (8/25–9/29) balloons from "a simple table/timeline showing which lessons to do which day" into a full interactive calendar: drag-and-drop rescheduling, automatic re-balancing when a day is missed, notifications/reminders, recurring-task logic, timezone handling, etc. This is a classic feature that *looks* essential ("I need to know what to study today") but has effectively unbounded polish potential relative to its actual value for a single user who can just... look at a static list.

**Why it happens:**
A calendar/scheduler feels like "the interesting engineering problem" of the project, and it's tempting to make it "smart" (auto-adjust if behind schedule) because that's a fun problem to solve — again competing with actual content-writing time.

**How to avoid:**
- Ship the schedule as a static, mostly hand-authored mapping (day → lesson IDs) rendered as a simple list/table with a "오늘" highlight and links into lessons — no drag-and-drop, no auto-rebalancing algorithm for v1.
- If "I fell behind, replan" is genuinely needed, make it a single manual action (e.g., a button that shifts all remaining unstarted days forward), not a continuous auto-scheduler.
- Explicitly mark calendar polish (animations, multi-week views, reminders/notifications) as out of scope / backlog, matching the project's own "Out of Scope" pattern (already excludes multi-user/social/quiz features — schedule automation deserves the same treatment).

**Warning signs:**
- Roadmap phase for "schedule" mentions drag-and-drop, notifications, or "smart" rebalancing.
- Time spent on calendar UI exceeds time spent on the schedule *content* (deciding which lessons go on which day).

**Phase to address:**
Whichever phase covers the schedule feature — cap its scope explicitly in the phase's acceptance criteria to "static day→lesson list + today highlight + link to lesson."

---

### Pitfall 7: Korean typography and font issues

**What goes wrong:**
- Loading a full Korean web font (e.g., Pretendard) with all weights and the full Hangul glyph set (thousands of characters) via `next/font/local` bloats the bundle/first-load significantly more than an equivalent Latin font — Korean fonts are large because Hangul has far more glyphs than Latin alphabets, and `next/font`'s automatic self-hosting/optimization is well-proven for Latin fonts but Korean variable-font support and subsetting tooling is less mature/less commonly pre-packaged.
- Long Korean sentences plus inline English/code terms (as required by this project: "코드·기술 용어는 영어 병기") break awkwardly mid-word without `word-break: keep-all` (or equivalent), producing ugly line wraps especially on mobile.
- Code blocks and inline code often default to a Latin-only monospace font, causing Korean prose immediately next to code to visually clash or fall back to a mismatched system font.
- Some Korean fonts subset badly with default `next/font` tooling, leading to missing-glyph "tofu" boxes for less common Hangul characters/symbols if the subset excludes them.

**Why it happens:**
Most Next.js/Vercel documentation and examples are written font-first for Latin text; Korean-specific concerns (glyph count, `keep-all`, subsetting) aren't part of the default happy path and are easy to miss until real Korean content is pasted in.

**How to avoid:**
- Use a well-supported Korean web font (Pretendard is the de facto standard for Korean UI text) loaded via `next/font/local` with only the weights actually used (e.g., regular/medium/bold, not all 9), and prefer the variable-font build to cut requests.
- Apply `word-break: keep-all;` (and `overflow-wrap: break-word` for the rare long unbroken token) globally to Korean prose containers so words don't split mid-syllable-block.
- Set an explicit monospace stack for code blocks that doesn't inherit the Korean body font, and verify the two look intentional side by side rather than accidentally mismatched.
- Test with actual long-form Korean lesson text (not lorem ipsum) early — font/line-wrap issues are invisible until real content of realistic length is rendered.

**Warning signs:**
- Body text uses a default system font stack with no Korean-specific font declared.
- Mobile view shows a single Korean word split across two lines mid-character.
- Bundle/font file size warnings during build for the font subset.

**Phase to address:**
Phase covering base layout/design system — verify with a real, full-length lesson (not placeholder text) before moving on.

---

### Pitfall 8: Deadline erosion via infrastructure churn (Supabase/Vercel environment drift)

**What goes wrong:**
Because this project has natural pauses (build the site, then spend weeks writing content, then come back to deploy/polish), infrastructure-level surprises tend to appear at the worst time:
- A free-tier Supabase project pauses after a period of inactivity (roughly a week with no API activity on the free plan), so returning to the project after a content-writing stretch to find the database paused and needing a manual restore is a realistic risk right before the deadline.
- Environment variables set correctly in local `.env.local` but never mirrored into the Vercel project dashboard, so the app works locally and breaks (or silently uses wrong keys) once deployed — discovered late because deployment wasn't tested until near the end.
- Schema changes made ad hoc (adding/renaming columns directly in the Supabase dashboard SQL editor) without any migration history, so reproducing the schema after a Supabase project reset, or understanding what changed, becomes guesswork under time pressure.

**How to avoid:**
- Deploy to Vercel early (Phase 1), not at the end — verify the production URL works with real Supabase data as soon as the MVP shell exists, so environment-variable and config drift surfaces weeks before the deadline, not the night before.
- If the Supabase project might sit idle for stretches during content-writing weeks, do at least one authenticated read/write (or scheduled ping) before the deadline week to avoid a paused-project surprise; know in advance that a paused free-tier project can be manually resumed from the dashboard, but budget time for it.
- Keep schema changes in versioned SQL migration files (even simple ones, via the Supabase CLI or hand-written migration scripts checked into git) rather than only using the dashboard SQL editor — this makes the schema reproducible and reviewable.

**Warning signs:**
- The site has never been opened at its live Vercel URL, only tested with `next dev`.
- Supabase dashboard SQL editor history is the only record of schema changes.
- No activity against the Supabase project for 7+ days during a content-writing stretch.

**Phase to address:**
Phase 1 should include "deploy to Vercel + confirm production reads/writes against real Supabase" as an explicit acceptance criterion, not deferred to a "deployment phase" at the end.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|-----------------|------------------|
| Skip Supabase Auth, gate site with a single shared-secret middleware cookie | Saves 1–2 days of auth wiring; sidesteps most RLS complexity | None significant for a true single-user tool | Always acceptable here — this is a personal tool, not a product with future multi-user plans |
| Store all lesson content as `.mdx` files in the repo instead of a DB/CMS | Fast, git-versioned, no admin UI needed | Can't edit content from a phone/browser without a code editor + redeploy | Acceptable for the entire project lifetime given single-author, dev-machine-based workflow |
| Static/manual schedule (hand-authored day→lesson mapping) instead of an auto-scheduler | Saves days of "smart" scheduling logic | Manually re-editing the mapping if falling behind | Acceptable always for a 5-week, single-user schedule |
| No automated tests, manual click-through verification only | Faster initial build under deadline pressure | Regressions in progress-save/RLS logic go unnoticed | Acceptable for UI polish; **not** acceptable for the completion-save → progress-% pipeline, which should get at least a manual UAT script re-run after any schema/pipeline change |
| Hardcode the single user's Supabase user ID / auth email in env vars rather than building a "who am I" flow | Saves building a profile/settings feature nobody needs | None | Always acceptable |
| Defer syntax highlighting language support for less-used languages (e.g., LangGraph/n8n config snippets) to plain code blocks | Saves Shiki language-bundle setup time | Slightly less polished code blocks for a handful of lessons | Acceptable for Step 3 (lighter-treatment) lessons; revisit only if it's cheap |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|--------------|------------------|--------------------|
| Supabase | Creating a table and immediately using it via the client API without enabling RLS, exposing it through the public anon key | Enable RLS + write a policy in the same migration/step that creates the table; never ship a table with RLS off |
| Supabase | Putting the **service role** key in a client-exposed env var (`NEXT_PUBLIC_*`) for convenience | Service role key only ever used in server-side code (Server Actions/Route Handlers), never sent to the client |
| Supabase (free tier) | Assuming the project is always warm; being surprised by a paused project after inactivity during a content-writing stretch | Do a periodic authenticated ping, or accept and plan for a manual "resume" step before the deadline week |
| Vercel | Env vars set locally but not added to the Vercel dashboard for Production/Preview, discovered only when deploying near the deadline | Deploy early (Phase 1) and confirm prod env vars match local, before content phases begin |
| MDX pipeline (Contentlayer) | Adopting Contentlayer because tutorials recommend it, hitting a Next.js 14+ incompatibility mid-project | Use `next-mdx-remote`/`@next/mdx` + `gray-matter`, or Velite — both actively maintained |
| next/font (Korean) | Loading the full Pretendard family (all weights, full glyph set) "just in case" | Load only the weights used; prefer the variable-font build; verify bundle size after adding |

## Performance Traps

Given single-user scale, most traditional performance traps (DB indexing at scale, N+1 query storms under load) are irrelevant. The traps that matter here are development-velocity and correctness traps, not runtime-scale traps:

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Full-site rebuild/type-check on every content edit during authoring | Adding/editing one lesson `.mdx` file takes 10–30+ seconds to see rendered, slowing the 35-lesson writing sprint | Use Next.js dev mode with fast refresh for the content-writing phase; avoid heavyweight build-time content processors (e.g., Contentlayer's full recompilation) that don't support fast incremental dev builds | Noticeable as soon as more than a handful of lessons exist and the write→preview loop is used dozens of times per lesson |
| Recomputing progress % client-side from a full lesson list fetched on every navigation | Slight jank/flicker on every page, and drift if lesson count changes mid-project | Compute progress server-side (RSC) from canonical data, cache appropriately with explicit invalidation on writes | Not scale-driven here — becomes visible whenever lesson count changes during authoring |
| Bundling large Shiki/highlighter language sets for every code block regardless of which languages are actually used | Slower build times as more lessons/code blocks are added | Configure the highlighter with only the language grammars actually used (Python, SQL, JS/TS, bash) | Build time creep becomes noticeable past ~20 lessons with code blocks |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| RLS disabled or `using (true)` policy left in "temporarily" | Anyone with the public anon key (visible in browser JS) can read/write progress data | Enable RLS on every table at creation; never use `using (true)` outside of genuinely public read-only content |
| Service role key exposed via `NEXT_PUBLIC_` env var or committed to git | Full database access (bypasses RLS) leaked to anyone who reads the client bundle or repo | Service role key stays server-side only, stored as a non-public Vercel/local env var, never in a public repo |
| Curriculum content (potentially proprietary to the source academy) published fully public and indexable | Possible IP/terms-of-service concern with the course provider if their curriculum text is republished verbatim and crawlable | Treat lesson content as private-by-default (behind the shared-secret/auth gate, `noindex` meta tag, no sitemap submission) rather than a fully public marketing-style site |
| A "skip login for local dev" bypass left active in production via an env flag | Anyone who finds the URL gets full access/write capability to personal data | Ensure any dev-only auth bypass is compiled out or hard-gated by `NODE_ENV !== 'production'`, and verify on the live Vercel URL that the gate is actually enforced |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|------------------|
| Completion checkbox with no immediate visual feedback while the Supabase write is in flight | Feels laggy/unresponsive on slower connections, tempts double-clicking | Optimistic UI update immediately, reconciled with server response; show a brief pending state if the round-trip is slow |
| Progress shown only as a single global percentage with no per-Step/per-Module breakdown | Hard to tell which of the 3 Steps is actually behind schedule | Show progress at Step and Module level (matches the curriculum's own Step 1/2/3 structure), not just one global number |
| Schedule page and lesson pages are disconnected (schedule shows "Day 3: Lesson X" as plain text with no link) | Extra friction navigating from "what should I do today" to actually doing it | Every schedule entry links directly to its lesson; the lesson page also shows which schedule day it belongs to |
| Step 3 content written with the same depth/density as Step 1 despite the project's own decision to keep Step 3 lighter | Wastes scarce writing time on content that will be retaught in-depth after the course starts | Enforce the depth-allocation decision already in PROJECT.md (Step 1/2 deep, Step 3 light concept-only) as a concrete word-count/scope guideline per lesson, not just an intention |

## "Looks Done But Isn't" Checklist

- [ ] **Completion checkbox:** Often only updates local component state — verify it survives a hard refresh and shows correctly from a different page/route that also displays completion status.
- [ ] **Progress percentage:** Often hardcoded against the lesson count at the time it was built — verify it recalculates correctly after adding/removing/renaming a lesson.
- [ ] **RLS policies:** A table "working" in manual testing while logged in doesn't confirm RLS is actually restrictive — verify by attempting an unauthenticated/anon-key-only request against the table and confirming it's denied.
- [ ] **Production deployment:** Working in `next dev` doesn't confirm it works on Vercel — verify the live URL with real Supabase data, not just a local `.env.local`.
- [ ] **Korean line-wrapping:** Looks fine with short placeholder text — verify with an actual full-length paste of real lesson prose plus inline English/code terms.
- [ ] **Schedule↔lesson linkage:** A schedule that "shows dates" isn't the same as one that's actually wired to lesson IDs — verify clicking a schedule entry navigates to the correct, real lesson.
- [ ] **Code block rendering:** Verify each language actually used in lesson examples (Python, SQL, JS/TS, bash, maybe YAML for n8n) renders with correct syntax highlighting, not silently falling back to plain text.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|----------------|------------------|
| RLS left disabled and discovered late | LOW | Enable RLS + add the standard `auth.uid()` policy on the affected table(s); check Supabase logs for any unexpected access in the meantime |
| Contentlayer adopted, then found incompatible | MEDIUM | Content itself (the `.mdx` files) is portable; swap the loader layer to `next-mdx-remote`/Velite, rewriting only the data-fetching glue, not the lesson content |
| Progress data drifted between localStorage and Supabase | LOW | Delete/ignore the localStorage cache, treat Supabase as truth, re-derive UI state from a fresh fetch |
| Discovered platform-building ate 3 of 5 weeks with little content written | HIGH | Ruthlessly cut remaining platform scope (no more features), switch fully to content-writing mode, accept a rougher schedule feature (plain markdown list) to protect remaining time for lesson content |
| Supabase free-tier project paused right before the deadline | LOW–MEDIUM | Resume from the Supabase dashboard (usually a one-click action); budget a buffer day before 9/29 specifically to catch this |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|-------------------|----------------|
| Platform-building crowding out content-writing | All phases — enforced via roadmap phase ordering/time-boxing | Roadmap review: majority of the 5-week timeline allocated to content phases, not feature phases |
| Auth over-complication | Phase 1 (foundation/auth setup) | No signup/password-reset/OAuth UI exists in the plan or codebase |
| Supabase RLS misconfiguration | Phase covering DB schema setup | Every table has RLS enabled; anon-key-only request against a progress table is denied |
| MDX pipeline rabbit hole | Phase 1 (content pipeline choice) | First 2 real lessons render correctly using only the maintained pipeline (no Contentlayer) |
| Progress double source of truth | Phase covering completion/progress feature | UAT: toggle completion, hard refresh, cross-page consistency check passes |
| Schedule/calendar scope creep | Phase covering schedule feature | Schedule feature acceptance criteria capped to static list + today highlight + lesson links (no drag/drop, no auto-rebalance) |
| Korean typography/font issues | Phase covering base layout/design system | Real full-length Korean lesson text renders with correct `keep-all` wrapping and font loads with acceptable bundle size |
| Deployment/environment drift | Phase 1 (deploy early) | Live Vercel URL confirmed working against real Supabase data before content phases start |

## Sources

- [Missing RLS in Supabase Apps: Tables Without Row Level Security Enabled](https://vibeappscanner.com/security-issue/supabase-missing-rls) — web, LOW confidence (single blog source, cross-checked against Supabase's own documented RLS opt-in behavior)
- [Supabase RLS: Common Mistakes, the (select auth.uid()) Trap & CVE-2025-48757 Breakdown](https://vibeappscanner.com/supabase-row-level-security) — web, LOW confidence
- [Disabling RLS in Supabase: what it exposes and the fix](https://www.guardlayer.io/blog/supabase-rls-disabled) — web, LOW confidence
- [Contentlayer FAQ / comparison docs](https://contentlayer.dev/docs/other/faq-e58c2f47) and [Refactoring ContentLayer to Velite](https://www.mikevpeeren.nl/blog/refactoring-contentlayer-to-velite) — web, LOW confidence, corroborated by widely known community reports of Contentlayer being unmaintained
- [Next.js Font Optimization docs](https://nextjs.org/docs/app/getting-started/fonts) and [Custom fonts without compromise using Next.js and next/font (Vercel blog)](https://vercel.com/blog/nextjs-next-font) — official docs, HIGH confidence for `next/font` mechanics; Korean-specific font-size/subsetting claims are LOW confidence (inferred/community, not officially documented)
- General software-project pattern knowledge (auth over-engineering for single-user tools, optimistic-UI/state-sync drift, scope creep on secondary features, deploy-early practice) — HIGH confidence as established engineering practice, not project-specific citation

---
*Pitfalls research for: personal Korean-language curriculum/learning-tracker site (Next.js + Supabase + Vercel), single user, 5-week hard deadline*
*Researched: 2026-08-24*
