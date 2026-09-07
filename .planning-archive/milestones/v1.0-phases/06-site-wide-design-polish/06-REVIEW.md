---
phase: 06-site-wide-design-polish
reviewed: 2026-08-26T00:00:00Z
depth: standard
files_reviewed: 29
files_reviewed_list:
  - package.json
  - scripts/check-design-tokens.mjs
  - scripts/e2e-mobile-overflow.mjs
  - scripts/e2e-typography.mjs
  - src/app/about/page.tsx
  - src/app/curriculum/page.tsx
  - src/app/globals.css
  - "src/app/lesson/[lessonId]/page.tsx"
  - src/app/not-found.tsx
  - src/app/page.tsx
  - src/app/schedule/page.tsx
  - "src/app/step/[stepId]/page.tsx"
  - src/app/unlock/done/page.tsx
  - src/components/behind-lessons-list.tsx
  - src/components/complete-button.tsx
  - src/components/dday-countdown.tsx
  - src/components/depth-badge.tsx
  - src/components/estimated-time.tsx
  - src/components/lesson-nav.tsx
  - src/components/mdx-content.tsx
  - src/components/module-accordion.tsx
  - src/components/pace-status.tsx
  - src/components/progress-badge.tsx
  - src/components/progress-error.tsx
  - src/components/progress-summary.tsx
  - src/components/schedule-table.tsx
  - src/components/section-tape.tsx
  - src/components/site-nav.tsx
  - src/components/step-card.tsx
  - src/components/today-lesson-card.tsx
findings:
  critical: 1
  warning: 4
  info: 2
  total: 7
status: issues_found
---

# Phase 6: Code Review Report — site-wide-design-polish

**Reviewed:** 2026-08-26
**Depth:** standard
**Files Reviewed:** 29
**Status:** issues_found

## Summary

The bulk of the diff (about 20 files) is exactly what the phase summary claims: a mechanical
swap of arbitrary-bracket Tailwind typography classes (`text-[Npx] leading-[N]`) for the
`text-display/heading/subhead/body/label` semantic tokens established in 06-01, plus a handful
of `card-interactive` hover-class additions. Those substitutions are self-consistent and match
the D-R4K-4 scale everywhere they were applied — no typos, no mismatched size/weight pairs found.

The genuinely new code — `section-tape.tsx`, the `mdx-content.tsx` table wrapper, the
`globals.css` token/selector changes, and the two new Playwright gates — is where the real
findings are. The most significant one is a stale-measurement bug in Section Tape that only
surfaces on client-side navigation between two lesson pages (the primary "다음 레슨" pager flow),
a scenario the plan's own verification never exercised (it only loaded one lesson URL via a
fresh `page.goto`). There is also a documented-but-still-real false-affordance hover issue on
`TodayLessonCard`, a latent false-negative gap in the new arbitrary-value static gate, an
accessible-name gap on Section Tape's placeholder/idle cells, and a coverage gap in the new
runtime typography gate (it only ever measures one route).

## Critical Issues

### CR-01: Section Tape does not reliably re-measure when navigating between two lesson pages

**File:** `src/components/section-tape.tsx:71-138`, `src/app/lesson/[lessonId]/page.tsx:20,62`

**Issue:**
`SectionTape`'s only measurement `useEffect` depends solely on `articleId`:

```tsx
useEffect(() => {
  const container = document.getElementById(articleId);
  ...
  const resizeObserver = new ResizeObserver(() => { measure(); updateCurrent(); });
  resizeObserver.observe(container);
  ...
}, [articleId]);
```

`articleId` is always the literal constant `LESSON_ARTICLE_ID = "lesson-article"`
(`src/app/lesson/[lessonId]/page.tsx:20`) — it is the same string on every single lesson route,
not derived from the lesson slug. `<SectionTape>` is also mounted with no `key` prop
(`src/app/lesson/[lessonId]/page.tsx:62`).

`LessonPager` (`src/components/lesson-nav.tsx:64-68`) navigates between two `/lesson/[lessonId]`
instances via a plain `next/link` `<Link>` — a client-side transition, not a full document
reload. Because the `<SectionTape>` element stays at the same position in the same parent tree
across that transition, with an unchanged `articleId` prop and no `key`, React has no signal to
unmount/remount it or to re-run the mount effect. The effect's `[articleId]` dependency array
therefore does **not** re-fire when the user clicks "다음 레슨"/"이전 레슨" — this is exactly
the "stale closure over measured values" failure mode the phase brief called out.

The only thing that can correct the stale state afterward is the *already-attached*
`ResizeObserver` on the (also likely-preserved) `#lesson-article` container noticing that its
box size changed once the new lesson's MDX content replaces the old — which is a coincidental
side effect, not a designed contract:
- If the new lesson happens to render at a different total height than the old one (the common
  case), the observer eventually fires `measure()`/`updateCurrent()` again — but for one or more
  frames after navigation, the tape shows the **previous lesson's** section titles/count, colored
  with the **new** lesson's Step color (`stepId` is a normal prop and *does* update immediately),
  producing a visibly inconsistent tape.
- If the new lesson coincidentally renders at the *same* `scrollHeight` as the old one, the
  `ResizeObserver` never fires at all, and the tape keeps showing the wrong lesson's section
  titles/count indefinitely (until some unrelated resize, e.g. a `<details>` toggle or a
  viewport rotation, happens to trigger it).
- Clicking a tape cell immediately after navigating calls `headingRefs.current[index]`
  (`section-tape.tsx:155-159`), which still holds the **old** lesson's `HTMLElement` references.
  Once React swaps in the new lesson's DOM, those old nodes are detached; `scrollIntoView()` on a
  detached node is a silent no-op, so the click does nothing until the observer catches up.

This was never caught because the plan's only verification loaded a single lesson URL directly
(`06-06-SUMMARY.md` D4: "Throwaway Playwright script ... against
`/lesson/1-1-course-orientation`" — one route, via `page.goto`, which is always a fresh
navigation). No test exercised the pager's client-side lesson→lesson transition.

**Fix:** Key the effect (and/or the component) off something that actually changes per lesson,
not the page-scoped container id. Simplest fix — force a remount on lesson change:

```tsx
// lesson/[lessonId]/page.tsx
<SectionTape key={lesson.slug} articleId={LESSON_ARTICLE_ID} stepId={lesson.stepId as StepId} />
```

Alternatively, thread the lesson slug into `SectionTape`'s props and add it to the effect's
dependency array so `measure()`/`updateCurrent()` and the `ResizeObserver`/scroll-listener setup
are deliberately re-run on every lesson change, not left to an incidental height-change side
effect.

## Warnings

### WR-01: `card-interactive` hover on TodayLessonCard implies the whole card is clickable when only the small CTA link is

**File:** `src/components/today-lesson-card.tsx:76-81`

**Issue:** `card-interactive` (and its `:hover` background-color rule in `globals.css:77-83`) is
applied to the outer `<section>`, which is not itself a link or button — only the small
`CTA_CLASS` `<Link>` rendered at the very bottom (`today-lesson-card.tsx:111-115`) is clickable.
Hovering anywhere over the heading/body text (most of the card's surface) triggers the same
"this is clickable" visual feedback as `StepCard`/`ModuleAccordion`/`ScheduleTable`, where the
*entire* hovered element genuinely is the click target. `06-03-SUMMARY.md` documents this as a
conscious trade-off (avoiding a worse regression: putting `card-interactive` on `CTA_CLASS`
itself would gray out the accent CTA button on hover because of selector specificity), but the
trade-off still ships a real UX inconsistency — for desktop/mouse users, most of the card
surface now visually claims to be clickable when it is not. (Low real-world impact on the
primary iPad device, since iOS Safari does not give meaningful `:hover` feedback on tap, but the
site is also required to work correctly on desktop per the project's device-support scope.)

**Fix:** Either scope the hover rule to only the CTA link area (e.g. a dedicated class on the
`<Link>` that changes text/border color instead of background, sidestepping the specificity
conflict noted in 06-03), or make the whole card a single `<Link>`/clickable region like
`StepCard` does, with the visible CTA becoming purely decorative.

### WR-02: `check-design-tokens.mjs` rule (c)'s default-palette-color check has a false-negative gap for opacity/important modifiers

**File:** `scripts/check-design-tokens.mjs:110-112,355-371`

**Issue:** `PALETTE_COLOR_NUMBER_RE` is anchored end-to-end:

```js
const PALETTE_COLOR_NUMBER_RE = new RegExp(
  `^(?:${PALETTE_PREFIXES.join('|')})-(?:${TAILWIND_PALETTE_COLOR_NAMES.join('|')})-\\d{2,3}$`,
);
```

`base` is derived by stripping only the variant prefix (`text.split(':').pop()`), so an
opacity-modified default-palette class such as `bg-red-500/50` or a Tailwind v4
important-suffixed class such as `bg-red-500!` will **not** match `\d{2,3}$` (there are trailing
characters after the digits) and will also not match `PALETTE_ALLOWLIST_TOKENS`'s bare
`text-white` case — so it silently passes both the bracket-arbitrary check (no `[` present) and
the bare-palette check. This is currently unexploited in the reviewed files (no default-palette
color literals were found anywhere in `src/`), but it is exactly the kind of "rule that passes
because it matches nothing" the phase brief asked this review to check for, and this gate is now
`ENFORCE_ARBITRARY_VALUES = true` by default (06-08) — i.e. it is the only thing standing between
future PRs and a silent regression to default-palette colors with an opacity/important suffix.

**Fix:** Strip a trailing `/\d+` and `!` before applying `PALETTE_COLOR_NUMBER_RE`, e.g.
`base.replace(/!$/, '').replace(/\/\d+$/, '')`, so opacity/important variants of a bare palette
color are still caught.

### WR-03: Section Tape's idle/placeholder cells have no accessible name

**File:** `src/components/section-tape.tsx:145-197`

**Issue:** Only the *current* cell renders visible text
(`section-tape.tsx:190-195`); every other cell is a `<button>` with no text content, relying
entirely on `aria-label={section.title || undefined}` (`section-tape.tsx:182`) for its
accessible name. During the pre-hydration placeholder render (`sections === null`, all 6
placeholder entries have `title: ""`) — and permanently in the (admittedly rare) case where
`container.scrollHeight <= 0` at measurement time, which leaves `hasMeasured` false forever
(`section-tape.tsx:86-90`) — `section.title` is the empty string, so `aria-label` evaluates to
`undefined`. Every non-current cell then has literally no accessible name: no visible text, no
`aria-label`. A screen-reader user tabbing through hears an unlabeled "button" repeated up to 6
times with no way to distinguish them.

**Fix:** Give idle cells a fallback accessible name that doesn't depend on measurement having
completed, e.g. `aria-label={section.title || `구간 ${index + 1}`}`, and consider
`aria-current="true"` on the current cell instead of relying purely on visual styling.

### WR-04: `e2e-typography.mjs` only measures one route; the phase's typography migration touched ~20 others

**File:** `scripts/e2e-typography.mjs:46`

**Issue:** `const ROUTES = ['/lesson/1-1-course-orientation'];` — the runtime
`getComputedStyle` gate that actually proves a Tailwind class like `text-heading` renders at the
intended pixel size in a real browser only ever checks the lesson page. This phase's mechanical
migration touched typography classes on the home, curriculum, schedule, step, about, and
unlock/done pages plus `site-nav`, `step-card`, `today-lesson-card`, `module-accordion`,
`schedule-table`, `progress-summary`, `progress-badge`, `dday-countdown`, `depth-badge`,
`estimated-time`, `pace-status`, `behind-lessons-list`, `complete-button`, `progress-error`, and
`not-found` — none of those routes/components are covered by any runtime typography assertion;
they are only checked by the static `check-design-tokens.mjs`, which validates Tailwind
class-name syntax (that `text-heading` was typed correctly) but cannot detect if, say, a
`.prose`-scoped override or specificity conflict caused the *actual rendered* size to differ from
the token's declared value on a page other than `/lesson/...`.

**Fix:** Extend `ROUTES` to include at least one instance of each page type (or reuse
`e2e-mobile-overflow.mjs`'s existing 7-route list), since the infrastructure for multi-route
runtime measurement already exists in the sibling gate.

## Info

### IN-01: `today-lesson-card.tsx` padding/interactive changes are undocumented inline (though covered in the plan summary)

**File:** `src/components/today-lesson-card.tsx:79-81`

**Issue:** The `p-6` → `p-4` padding change and the conditional `card-interactive` addition have
no inline code comment explaining the rationale (unlike nearly every other non-trivial CSS
decision in this phase, which is meticulously commented in `globals.css`/`section-tape.tsx`).
The rationale is only recoverable from `06-03-SUMMARY.md`. Not a functional defect — flagged
purely as a maintainability gap given the codebase's own established documentation convention.

**Fix:** Add a one-line comment near the className referencing the card-contract unification
decision, matching the density of documentation elsewhere in this phase's diff.

### IN-02: Section Tape's `updateCurrent()`/`headingRefs` can briefly point at 2+ real headings while `sections` is still the placeholder, if `scrollHeight` transiently reads `0`

**File:** `src/components/section-tape.tsx:75-90`

**Issue:** `measure()` sets `headingRefs.current = headings` (the real, current-lesson heading
elements) *before* checking `totalHeight <= 0`. If that early-return branch is hit even once
(e.g. a transient layout timing issue where the container briefly reports `0` height), the
placeholder's 6 evenly-sized cells remain on screen but `headingRefs.current` already points at
the real (possibly-fewer-than-6) headings — clicking placeholder cell index 0 or 1 would scroll
to a real heading that doesn't correspond to that cell's (placeholder, unlabeled) position. Low
likelihood in practice since `measure()` runs post-paint in a `useEffect`, but worth a defensive
guard.

**Fix:** Only assign `headingRefs.current = headings` after the `totalHeight <= 0` guard passes
(or clear it back to `[]` on that early-return path) so a click can never target a mismatched
heading while placeholder cells are showing.

---

_Reviewed: 2026-08-26_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

---

## Orchestrator verification of CR-01 (2026-08-26)

CR-01 was reported as **Critical** on the reasoning that `SectionTape`'s measurement
`useEffect` depends only on `articleId` — a page-scoped constant (`"lesson-article"`)
identical across every lesson — and that `<SectionTape>` carries no `key`, so a
client-side pager transition would preserve the component instance and leave the tape
showing the previous lesson's structure.

**The mechanism analysis is correct. The predicted user-visible failure did not
reproduce.** Empirical check (Playwright, Chromium, 768×1024, unlock cookie set):
five consecutive `[data-pager="next"]` hops starting from
`/lesson/1-1-course-orientation`, each compared against a hard reload of the same URL.

| Hop | Lesson | article scrollHeight | after-nav vs fresh-load cell ratios |
|-----|--------|---------------------|--------------------------------------|
| 1 | `1-1-dev-environment-setup` | 4760 | identical |
| 2 | `1-2-git-branch-and-pr` | 6237 | identical |
| 3 | `1-2-generative-ai-basics` | 5710 | identical |
| 4 | `1-3-python-variables-and-types` | 5976 | identical |
| 5 | `1-3-python-functions-and-io` | 6082 | identical |

Result: 0/5 hops stale. Cell `flexGrow` ratios matched a fresh load to four decimal
places on every hop, and a cell click after navigation scrolled correctly (no detached-node
no-op).

**Why:** the `<article id="lesson-article">` element is reconciled in place across the
transition, so the `ResizeObserver` registered on it stays attached; the incoming lesson's
different rendered height fires the observer, which re-runs `measure()` and refreshes
`headingRefs.current`. Starting height was 4302 and no two consecutive lessons in this
content set render at the same height.

**Revised assessment: latent fragility, not a live defect.** Correctness currently rests
on an incidental property of the content (consecutive lessons never rendering at
pixel-identical `scrollHeight`) rather than on the dependency contract. Two lessons that
did collide on height would show a stale tape. The remedy is one line — key the component
per lesson (`<SectionTape key={lesson.slug} … />`) or add the lesson identity to the
effect's dependency array — and does not require re-planning.

CR-01 should be read as Warning-severity for phase-completion purposes. The remaining
findings (WR-01…WR-04, INFO-01…INFO-02) were not independently re-verified here.
