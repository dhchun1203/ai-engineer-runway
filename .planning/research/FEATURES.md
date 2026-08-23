# Feature Research

**Domain:** Personal curriculum/learning-tracker site (course content + progress tracking + study schedule), single-user, deadline-driven (course starts 2026-09-30)
**Researched:** 2026-08-24
**Confidence:** MEDIUM (patterns are well-established and cross-corroborated across LMS/roadmap.sh/freeCodeCamp/Notion/study-planner categories; individual web sources are LOW-confidence uncurated search results, but convergence across 4 independent categories raises overall confidence to MEDIUM)

## Feature Landscape

### Table Stakes (Users Expect These)

Features the site fails its purpose without. All four are explicitly named in PROJECT.md's Active requirements — this list maps them to what "done" looks like based on how LMS-lite and roadmap.sh-style products implement them.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Lesson content pages (concept explanation + practical code example) | This IS the product — without content there's nothing to track. LMS and freeCodeCamp both pair a short concept explanation with a runnable/copyable code example per lesson. | MEDIUM | Content authoring (writing 3 Steps worth of lessons) is the real bottleneck, not the rendering. Use MDX or Markdown-in-DB so content authoring doesn't require redeploys for every lesson. |
| Curriculum structure: Step → Module → Lesson hierarchy | roadmap.sh and freeCodeCamp both anchor tracking to a fixed tree (roadmap nodes / curriculum modules). Without a stable hierarchy, progress % and schedule mapping have nothing to attach to. | LOW-MEDIUM | Model as Step > Module > Lesson (3 levels). Curriculum content (Step 1/2/3, 200h/336h/520h) already exists as source material — this is a data-modeling task, not a design decision. |
| Per-lesson "mark complete" toggle | Universal LMS pattern — a checkmark appears next to a lesson when done. This is the atomic unit every other feature (progress bars, schedule) is built on. | LOW | Simple boolean per (user, lesson) row in Supabase. Since it's single-user, no need for per-user scoping logic beyond a fixed user id or none at all. |
| Per-section (module/Step) progress bars | Both LMS dashboards and roadmap.sh surface completion % at the aggregate level, not just per-lesson — this is what makes "am I on track" answerable at a glance. | LOW | Pure derived/computed value: count(completed lessons)/count(total lessons) per module and per Step. No new storage beyond the completion toggle above. |
| Study schedule mapping calendar days → lessons (2026-08-25 to 09-29, 4-6h/day) | Explicitly required by PROJECT.md. Study-planner apps (Structured, StudyTodo, RelePlanner) universally start from "log the deadline, generate a day-by-day plan from content + available time." | MEDIUM | Needs: (1) an estimated-duration field per lesson to distribute hours across days, (2) a generated or hand-authored day→lesson(s) mapping, (3) a calendar/list view showing "today's lessons" and whether they're done. Depends on curriculum structure + duration estimates existing first. |
| "Where am I today" view (today's assigned lessons + completion state) | The single most-used screen in every study-planner reviewed — daily view answers "what do I do right now," which matters more day-to-day than the overall roadmap view. | LOW | Combines schedule mapping + completion state; no new data needed if the two above exist. Should be the default/landing view given the deadline pressure. |
| Deployed, URL-accessible site (Vercel) | Explicit requirement — "accessible anywhere" only works if it's actually deployed, not local-only. | LOW | Vercel deploy of Next.js is close to zero-config; treat as a very early phase (not a late "launch" phase) so the live URL exists to test against throughout. |

### Differentiators (Competitive Advantage)

Not required for the site to function, but each aligns with Core Value ("확실히 다질 수 있도록" — make sure the fundamentals are solid before the course starts) and is cheap enough to be worth including if time allows.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Schedule auto-rebalancing when a day is missed/skipped | Real self-study rarely goes exactly to plan (sick day, busy day); auto-shifting remaining lessons forward keeps the deadline realistic instead of the schedule silently going stale. | MEDIUM | Only worth it if the 5-week schedule is model-generated rather than hand-authored; skip if schedule is a static hand-placed table. |
| Content-depth signaling (심화 vs 개념 훑기 badge) matching PROJECT.md's stated depth split (Step 1/2 core = deep, Step 3 = light overview) | Helps the learner self-calibrate how much time to spend per lesson, directly reflecting a documented Key Decision. | LOW | A simple tag/badge on lesson metadata ("심화"/"개요"); no separate feature build, just a data field surfaced in the UI. |
| Overall countdown / "days until 9/30" + "on track / behind" indicator | Turns the deadline from an abstract date into a constant visible pressure gauge, reinforcing the site's actual purpose (get ready in time). | LOW | Derived from today's date vs. schedule completion state — no new storage. |
| Code example "copy" button / syntax highlighting per language (Python, SQL, TS, etc.) | Practical code examples across ~7 different stack technologies benefit from correct highlighting and easy copy for actually trying things out. | LOW | Standard MDX + a highlighter (e.g., shiki/rehype-pretty-code) — well-trodden Next.js pattern, not a design risk. |
| Simple search/filter across lessons (e.g., jump to "React" or "SQL" content) | Useful once 3 Steps of content exist and the learner wants to jump around instead of following the schedule linearly. | LOW-MEDIUM | Only valuable once there's enough content to make browsing painful; defer until content volume justifies it. |
| Notes field per lesson (personal annotations) | Common in Notion-style study dashboards; lets the learner capture their own clarifications next to the material. | LOW | Optional textarea persisted per lesson; nice-to-have, not core to the stated Core Value. |

### Anti-Features (Commonly Requested, Often Problematic)

Things that look appealing for a "learning platform" but actively work against a 1-person, 5-week, deadline-bound build.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|------------------|-------------|
| Multi-user auth, roles, sharing/social features | "Real" LMS/course platforms have accounts, cohorts, leaderboards | Explicitly out of scope per PROJECT.md; adds auth complexity, RLS policy design, and testing surface for a product with exactly one user | Skip auth entirely, or use the absolute minimum (single hardcoded user / simple passcode) purely to gate the Supabase write path from the public internet |
| Quiz engine / auto-graded assessments | LMS platforms track "assessment completion" as a first-class signal alongside content completion | Explicitly out of scope per PROJECT.md ("퀴즈 채점 시스템... 기간 제약"); building a grading engine is a multi-week feature on its own | Self-report completion only (the per-lesson complete button is the "assessment") |
| Video lecture hosting/playback | Common LMS table-stake | Explicitly out of scope; video production + hosting/streaming infra is disproportionate to a 5-week solo build | Text + code content only, as already decided |
| Gamification (badges, streaks, leaderboards, points) | Appears in nearly every LMS feature list as an engagement driver | Engagement mechanics exist to motivate a population of many disengaged learners; for a single highly-motivated learner racing a fixed deadline, this is pure decoration that consumes build time without addressing the actual risk (running out of time before 9/30) | The countdown/on-track indicator (see Differentiators) gives equivalent motivational signal for near-zero cost |
| Spaced-repetition / flashcard review engine | Study-planner apps (Synapse, StudyTodo, RelePlanner) treat this as a core feature | Adds a whole review-scheduling subsystem (forgetting-curve math, review-session generation) on top of the already-required linear schedule; the pre-study window is one-pass coverage before a course starts, not long-term retention training | If retention matters later, revisit after the course starts — not before 9/30 |
| Reproducing the curriculum's 5 full practical projects | Feels like "real" preparation | Explicitly out of scope per PROJECT.md ("사전학습 목적을 벗어남"); each project is itself many hours of the actual course, not pre-study material | Provide only an overview/prep-guide per project (pointers, prerequisites, nothing to build) |
| Calendar sync (Google/Apple/Outlook) for the schedule | Common in mainstream study-planner apps | Requires OAuth integration + external API surface for a schedule that only needs to be viewed inside the site itself by one person | An in-site calendar/list view is sufficient; the learner opens the site directly rather than needing it to appear in an external calendar |
| Rich admin/CMS UI for editing curriculum content | "Feels" like a real platform needs a content-management backend | Content is authored once by the same person who's building the site; a CMS UI is pure overhead when editing MDX/Markdown files directly (or a simple DB seed script) is faster and requires zero UI build time | Author content as MDX files or a seed script into Supabase; skip building an editor UI |
| Mobile app / PWA offline mode | "Access anywhere" sounds like it implies native/offline | PROJECT.md's "어디서든 접속" is satisfied by a responsive web deploy on Vercel; offline sync adds a whole data-consistency dimension | Responsive web only; if genuinely needed later, a basic PWA manifest is a low-cost add-on, but true offline-first sync is not worth it here |

## Feature Dependencies

```
Curriculum structure (Step > Module > Lesson data model)
    └──requires──> [nothing — foundational]

Lesson content pages
    └──requires──> Curriculum structure

Per-lesson complete toggle
    └──requires──> Curriculum structure (needs lesson IDs to attach completion state to)

Per-section progress bars
    └──requires──> Per-lesson complete toggle
                       └──requires──> Curriculum structure

Study schedule (day → lesson mapping)
    └──requires──> Curriculum structure
    └──requires──> Lesson duration estimates (new small data field)

"Today's lessons" / daily view
    └──requires──> Study schedule
    └──requires──> Per-lesson complete toggle

Countdown / on-track indicator ──enhances──> "Today's lessons" view (uses schedule + completion state, no new storage)

Content-depth badge (심화/개요) ──enhances──> Lesson content pages (metadata field, no dependency)

Schedule auto-rebalancing ──enhances──> Study schedule (only meaningful once schedule + completion exist)

Deployed Vercel URL
    └──requires──> [nothing — should be stood up early, in parallel with data model work, not last]

Quiz engine ──conflicts── with Timeline constraint (explicitly out of scope)
Multi-user auth ──conflicts── with 1인 사용 constraint (explicitly out of scope)
```

### Dependency Notes

- **Everything downstream requires Curriculum structure first.** The Step > Module > Lesson hierarchy is the single foundational data model — progress bars, the schedule, and content pages all attach to it. This should be the very first roadmap phase, ahead of any UI polish.
- **Progress bars require the complete toggle, which requires the curriculum structure.** This is a strict 3-step chain: model the tree → let lessons be marked done → derive percentages. No shortcuts — building progress bars before the toggle exists means nothing to compute.
- **The study schedule requires lesson duration estimates, a new small field not implied by the other features.** Without an estimated-hours value per lesson, there's no way to distribute lessons across the fixed 4-6h/day, 5-week window. This should be flagged explicitly when planning the schedule phase — it's an easy thing to forget until the mapping algorithm needs an input.
- **Deployed Vercel URL should NOT be treated as a final "launch" phase.** Because the constraint is speed (limited build time before 9/30), standing up the deploy pipeline early lets every subsequent phase be verified against the real URL instead of local-only, catching Vercel-specific issues (env vars, Supabase connection from serverless functions) before they compound.
- **Anti-features conflict directly with the Constraints section of PROJECT.md** (multi-user auth conflicts with "1인 사용," quiz engine and video conflict with the Out of Scope list) — these aren't just low-priority, they're actively excluded and should not reappear as "nice to have" scope creep during planning.

## MVP Definition

### Launch With (v1)

Minimum viable product — these are exactly the four Active requirements in PROJECT.md, decomposed into buildable units. Nothing here is optional for the site to serve its purpose.

- [ ] Step > Module > Lesson data model populated with all 3 Steps of curriculum content — without this nothing else has anything to attach to
- [ ] Lesson content pages (concept explanation + practical code example per lesson) — this is the actual value the learner consumes
- [ ] Per-lesson complete button persisting to Supabase — the atomic tracking unit
- [ ] Per-module and per-Step progress bars (derived from completion state) — answers "how far along am I"
- [ ] Study schedule (8/25–9/29, 4-6h/day) mapping calendar days to lessons, with a "today's lessons" view — answers "what do I do right now"
- [ ] Deployed on Vercel with a working URL — required for "access anywhere"

### Add After Validation (v1.x)

Add once the core loop (read → complete → see progress → follow schedule) is proven to work day-to-day, and only if build time remains before 9/30.

- [ ] Countdown / on-track-vs-behind indicator — trigger: once the schedule view exists and there's spare time before deadline
- [ ] Content-depth badge (심화/개요) on lesson pages — trigger: cheap to add once lesson metadata schema exists
- [ ] Code copy button / improved syntax highlighting — trigger: once real code examples are being authored and copy-paste friction is noticed
- [ ] Schedule auto-rebalancing on missed days — trigger: only if the hand/generated schedule turns out to need frequent manual edits during actual use

### Future Consideration (v2+)

Defer past 9/30 — either explicitly out of scope, or irrelevant to the pre-study goal.

- [ ] Notes field per lesson — defer: not core to Core Value, adds UI+storage for marginal benefit
- [ ] Search/filter across lessons — defer: only useful once content volume makes linear navigation painful, and the schedule already provides a path through content
- [ ] Any multi-user/auth system, quiz engine, video hosting, spaced-repetition engine, full project reproductions, calendar sync, CMS editor UI, offline PWA — defer indefinitely: explicitly out of scope per PROJECT.md or actively counterproductive per the Anti-Features analysis above

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Curriculum data model (Step/Module/Lesson) | HIGH | MEDIUM | P1 |
| Lesson content pages | HIGH | MEDIUM | P1 |
| Per-lesson complete toggle | HIGH | LOW | P1 |
| Per-section progress bars | HIGH | LOW | P1 |
| Study schedule (day→lesson mapping) | HIGH | MEDIUM | P1 |
| Today's lessons view | HIGH | LOW | P1 |
| Vercel deploy | HIGH | LOW | P1 |
| Countdown / on-track indicator | MEDIUM | LOW | P2 |
| Content-depth badge | MEDIUM | LOW | P2 |
| Code copy/highlighting | MEDIUM | LOW | P2 |
| Schedule auto-rebalancing | MEDIUM | MEDIUM | P2 |
| Notes per lesson | LOW | LOW | P3 |
| Search/filter | LOW | MEDIUM | P3 |
| Multi-user/auth, quizzes, video, spaced repetition, full project reproductions | N/A (excluded) | HIGH | Excluded |

**Priority key:**
- P1: Must have for launch (= PROJECT.md's Active requirements)
- P2: Should have, add when possible before 9/30
- P3: Nice to have, only if time genuinely remains

## Competitor Feature Analysis

| Feature | roadmap.sh | freeCodeCamp | LMS-lite (generic) | Notion study dashboard | Our Approach |
|---------|-----------|--------------|---------------------|------------------------|--------------|
| Structure | Visual node-graph roadmap, topics markable done/in-progress/skipped | Linear curriculum tree with certifications | Course > Module > Lesson tree | Freeform databases (courses, tasks, notes) linked by relation | Step > Module > Lesson tree, matching curriculum's own structure exactly (simplest fit for 1 user, 1 curriculum) |
| Completion tracking | Per-topic status (done/in-progress/skipped), persisted per account | Per-lesson checkbox + certificate progress | Per-lesson checkmark, often unlocks next lesson | Manual checkbox/status property per item | Simple per-lesson boolean; no unlock-gating needed since it's self-paced by one trusted user |
| Progress visualization | Colored node states on the graph itself | Progress bar per certification/module | Dashboard with completion % per course/module | Progress bar/rollup formulas across linked databases | Per-Step and per-Module progress bars computed from lesson completion counts |
| Schedule/deadline | None built-in (self-paced, no fixed end date) | None built-in (self-paced) | Rare; mostly cohort-based due dates, not personal pacing | Calendar view + manual deadline properties | Built-in schedule mapping calendar days to lessons — this is the feature none of the competitors need, because none of them have a single fixed external deadline (course start 9/30) the way this project does |
| Content format | Links out to external resources, doesn't host content | Hosts full interactive lessons + code challenges in-browser | Hosts video/text/quizzes | Notes/links curated manually by the user | Hosts concept explanation + code example directly (like freeCodeCamp), since content must match this specific curriculum exactly and external resources won't map 1:1 |
| Engagement mechanics | None beyond status coloring | Certifications, streak counters | Badges, leaderboards, points | None (personal use) | Deliberately excluded (see Anti-Features) — a fixed deadline is the motivator, not gamification |

## Sources

- [LMS Tools and Features: What to Look for in a Modern Platform | Thinkific](https://www.thinkific.com/blog/lms-tools-and-features-what-to-look-for-in-a-modern-platform/) — LOW confidence (uncurated web search)
- [Essential LMS Features: What Every Learning Platform Needs in 2026 | D2L](https://www.d2l.com/blog/lms-features/) — LOW confidence
- [10 LMS features for tracking training completion | Absorb LMS](https://www.absorblms.com/resources/articles/10-lms-features-for-tracking-training-completion) — LOW confidence
- [Course Tracker – Simple WordPress Lesson Progress & LMS Navigation](https://wordpress.org/plugins/course-tracker/) — LOW confidence
- [roadmap.sh: Developer Learning, Progress Tracking & Guides](https://mcpmarket.com/server/roadmap-sh) — LOW confidence
- [roadmap.sh — The Developer's GPS for Learning Tech](https://jorgecensi.com/blog/2026/03/14/roadmap-sh) — LOW confidence
- [Roadmap - freeCodeCampOS](https://opensource.freecodecamp.org/freeCodeCampOS/roadmap.html) — LOW confidence
- [Study Planner: Free Apps and Templates for Students in 2026 | Tasksboard](https://tasksboard.com/blog/study-planner-guide) — LOW confidence
- [Study Planner App: What to Look For and the Best Options in 2026 | CuFlow](https://cuflow.ai/blog/study-planner-app) — LOW confidence
- [Apps For Planning Study | FlashRecall Blog](https://flashrecall.app/blog/apps-for-planning-study) — LOW confidence
- [Ultimate Study Dashboard Template | Notion Marketplace](https://www.notion.com/templates/student-academics-tracker) — LOW confidence
- [Notion Dashboards for Students: Features to Look For](https://www.osdashboardhq.com/blog/notion-dashboards-features-to-look-for-students/) — LOW confidence
- [Feature Creep: What It Is and How to Prevent It | CPO Club](https://cpoclub.com/product-management/feature-creep/) — LOW confidence
- [🦸 The Solo-Founder Playbook: Zero to Hero | DEV Community](https://dev.to/truongpx396/the-solo-founder-playbook-zero-hero-3j7d) — LOW confidence

**Note on confidence:** Individual sources are uncurated web search results (LOW confidence per source hierarchy). Overall domain-pattern confidence is rated MEDIUM because the same structural pattern (hierarchy → completion toggle → derived progress %) appears independently across four distinct product categories (LMS platforms, roadmap.sh/freeCodeCamp, Notion study templates, dedicated study-planner apps), and these patterns also align directly with the explicit requirements already stated in PROJECT.md.

---
*Feature research for: Personal curriculum-based learning site (pre-study tracker for Kant AI Engineer course, 2026-09-30 start)*
*Researched: 2026-08-24*
