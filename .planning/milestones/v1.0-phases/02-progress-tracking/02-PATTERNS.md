# Phase 2: 진도 체크와 진행률 - Pattern Map

**Mapped:** 2026-08-24
**Files analyzed:** 12
**Analogs found:** 8 / 12 (4 are genuinely new patterns for this codebase — no analog exists yet, RESEARCH.md Code Examples are the fallback)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `src/lib/supabase/admin.ts` | config/service (client factory) | request-response | — (no Supabase client exists yet) | none — use RESEARCH.md Pattern 2 code example |
| `src/lib/auth.ts` | utility (auth gate) | request-response | — (no cookie/auth helper exists yet) | none — use RESEARCH.md Pattern 1 code example |
| `src/lib/progress.ts` | utility (pure aggregation) | transform | `src/content/curriculum-helpers.ts` | role-match (pure query/aggregation helpers, same file family) |
| `src/app/unlock/route.ts` | route (Route Handler) | request-response | — (no Route Handler exists yet) | none — use RESEARCH.md diagram + Next.js docs pattern |
| `src/app/lesson/[lessonId]/actions.ts` | controller (Server Action) | CRUD (toggle) | `src/app/lesson/[lessonId]/page.tsx` (sibling file, same route segment conventions) | partial — no existing Server Action file to copy CRUD/error-handling from; combine with RESEARCH.md Pattern 3 |
| `src/app/lesson/[lessonId]/page.tsx` (modify) | controller (Server Component page) | request-response | itself (existing file, extend in place) | exact |
| `src/app/step/[stepId]/page.tsx` (modify) | controller (Server Component page) | request-response | itself (existing file, extend in place) | exact |
| `src/app/page.tsx` (modify) | controller (Server Component page) | request-response | itself (existing file, extend in place) | exact |
| `src/components/complete-button.tsx` | component (client island) | event-driven (optimistic toggle) | `src/components/site-nav.tsx` (only existing client-side interactive island) | role-match |
| `src/components/progress-summary.tsx` | component (server-renderable display) | transform (display of aggregated data) | `src/components/step-card.tsx` | role-match (card-style summary block, same token system) |
| `src/components/progress-badge.tsx` | component (small display badge) | transform | `src/components/depth-badge.tsx` | exact (badge-with-map-of-classes pattern) |
| `src/components/step-card.tsx` (modify) | component | transform | itself (existing file, extend `progressPercent` prop) | exact |
| `src/components/module-accordion.tsx` (modify) | component | transform | itself (existing file, add per-lesson complete indicator) | exact |

## Pattern Assignments

### `src/lib/progress.ts` (utility, transform)

**Analog:** `src/content/curriculum-helpers.ts`

**Imports pattern** (lines 4-5):
```typescript
import { lessons, type Lesson } from '#site/content';
import { modules, steps, type Module, type Step, type StepId } from './modules';
```
Apply the same convention for `progress.ts`: import curriculum helpers by relative path, not by `#site/content` directly (progress.ts should depend on `curriculum-helpers.ts`'s public functions, not reach into Velite manifest itself) — per RESEARCH.md Code Examples:
```typescript
import { getModulesByStep, getLessonsByModule, getOrderedLessons } from '@/content/curriculum-helpers';
import type { StepId } from '@/content/modules';
```

**Core transform pattern** (curriculum-helpers.ts lines 36-46, exact function shapes to mirror):
```typescript
export function getModulesByStep(stepId: StepId): Module[] {
  return modules.filter((m) => m.stepId === stepId).sort((a, b) => a.order - b.order);
}

export function getLessonsByModule(moduleId: string): Lesson[] {
  return lessons.filter((l) => l.moduleId === moduleId).sort((a, b) => a.order - b.order);
}
```
Style to copy: small named exported pure functions, one responsibility each, no classes, filter+sort/reduce composition, explicit return types. `progress.ts` should follow this exact style (see RESEARCH.md Code Examples `aggregate`/`overallProgress`/`stepProgress`/`moduleProgress` — already drafted there, keep as-is).

**Error handling pattern** (curriculum-helpers.ts lines 7-16):
```typescript
function findModule(moduleId: string): Module {
  const found = modules.find((m) => m.id === moduleId);
  if (!found) {
    throw new Error(
      `curriculum-helpers: lesson references unknown moduleId "${moduleId}" — no matching entry in src/content/modules.ts`,
    );
  }
  return found;
}
```
Convention: throw descriptive `Error` with the module/file name prefix and the invalid value, rather than silently returning `undefined`/empty — reserve silent `undefined` returns (see `getLessonBySlug`, `getStep`) for lookups the caller is expected to null-check (e.g. `notFound()` triggers). `progress.ts` has no equivalent invalid-input case since it operates on already-validated `Set<string>` + lesson arrays — no throwing needed there.

---

### `src/lib/auth.ts` (utility, request-response) — NO ANALOG

No cookie/auth helper exists in this codebase yet. Use RESEARCH.md Pattern 1 code example verbatim as the starting point:
```typescript
import { cookies } from 'next/headers';

const UNLOCK_COOKIE = 'unlock_key';

export async function hasUnlockCookie(): Promise<boolean> {
  const store = await cookies();
  return store.get(UNLOCK_COOKIE)?.value === process.env.UNLOCK_SECRET;
}
```
Match existing project conventions: single-purpose named export function (same shape as `curriculum-helpers.ts` exports), no default export, no class wrapper.

---

### `src/lib/supabase/admin.ts` (config/service) — NO ANALOG

No Supabase client exists yet. Use RESEARCH.md Pattern 2 code example verbatim:
```typescript
import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
```
Add `import 'server-only';` at the top per RESEARCH.md Security Domain guidance (prevents accidental client-bundle inclusion) — this is a new convention not seen elsewhere in the codebase but explicitly required by RESEARCH.md.

---

### `src/app/lesson/[lessonId]/actions.ts` (controller, CRUD) — PARTIAL ANALOG

**Analog:** `src/app/lesson/[lessonId]/page.tsx` (sibling in same route segment — for file-location/co-location convention only, not for CRUD logic)

**Co-location pattern** (page.tsx lines 1-15, import/param convention to mirror):
```typescript
import { getLessonBySlug, getOrderedLessons, getAdjacentLessons } from "@/content/curriculum-helpers";
...
export function generateStaticParams() {
  return getOrderedLessons().map((lesson) => ({ lessonId: lesson.slug }));
}
```
Convention: helpers imported from `@/content/curriculum-helpers` via `@/` alias (not relative `../../`), consistent across all route files.

**Core CRUD + auth-gate + error-handling pattern** — no existing Server Action in repo; use RESEARCH.md Pattern 3 code example verbatim as the base:
```typescript
'use server';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { hasUnlockCookie } from '@/lib/auth';

export async function toggleLessonComplete(lessonId: string, currentlyDone: boolean) {
  if (!(await hasUnlockCookie())) {
    throw new Error('unauthorized');
  }

  if (currentlyDone) {
    const { error } = await supabaseAdmin.from('progress').delete().eq('lesson_id', lessonId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabaseAdmin
      .from('progress')
      .upsert({ lesson_id: lessonId, completed_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/lesson/${lessonId}`);
  revalidatePath('/step/[stepId]', 'page');
  revalidatePath('/');
}
```
**Additional required validation (V5, RESEARCH.md Security Domain):** validate `lessonId` against `getLessonBySlug(lessonId)` from `curriculum-helpers.ts` before touching the DB — reuse the existing lookup function rather than writing new validation logic:
```typescript
import { getLessonBySlug } from '@/content/curriculum-helpers';
// ...
if (!getLessonBySlug(lessonId)) throw new Error('invalid lesson');
```

---

### `src/app/lesson/[lessonId]/page.tsx` (modify, controller)

**Analog:** itself — extend in place, do not restructure.

**Existing structure to extend** (full file, lines 17-55): keep `generateStaticParams` (RESEARCH.md confirms it's safe alongside `force-dynamic`), add `export const dynamic = 'force-dynamic';` near the top, call `hasUnlockCookie()` unconditionally (Pitfall 4 — no early return before the call), and insert `<CompleteButton>` right above `<LessonPager>`:
```typescript
export const dynamic = 'force-dynamic';

export default async function LessonPage(props: PageProps<"/lesson/[lessonId]">) {
  const { lessonId } = await props.params;
  const lesson = getLessonBySlug(lessonId);
  if (!lesson) notFound();

  const unlocked = await hasUnlockCookie();
  const isDone = unlocked ? await getCompletionStatus(lesson.slug) : null;

  return (
    <article>
      {/* existing content unchanged */}
      {unlocked && <CompleteButton lessonId={lesson.slug} initialDone={isDone} />}
      <LessonPager prev={prev} next={next} />
    </article>
  );
}
```
D-21 placement: `<CompleteButton>` goes immediately before `<LessonPager prev={prev} next={next} />` (existing line 52), not after.

---

### `src/app/step/[stepId]/page.tsx` (modify, controller)

**Analog:** itself. Extend `generateStaticParams`/data flow exactly as `page.tsx` above: add `dynamic = 'force-dynamic'`, call `hasUnlockCookie()` + fetch completed set, pass per-module `completed/total` counts into `<ModuleAccordion>` as new props (module.tsx currently takes `module`, `stepId`, `defaultOpen` — add `completedSlugs: Set<string>` or similar, following the existing prop-drilling style already used for `stepId`).

---

### `src/app/page.tsx` (modify, controller)

**Analog:** itself.

**Existing structure** (full file, lines 1-20): minimal Server Component, no data fetching yet. Add `dynamic = 'force-dynamic'`, call `hasUnlockCookie()` unconditionally at top, conditionally render `<ProgressSummary>` above the `<section>` grid of `<StepCard>`s, and pass real `progressPercent` per step into `<StepCard step={step} progressPercent={...} />` (replacing the current internal `progressPercent = 0` hardcode in `step-card.tsx`).

---

### `src/components/complete-button.tsx` (component, event-driven) — PARTIAL ANALOG

**Analog:** `src/components/site-nav.tsx` — only existing client-island component (for `'use client'` directive placement and file-level convention); RESEARCH.md Code Examples has the full concrete implementation for the optimistic-toggle logic itself since no analog for `useOptimistic` + Server Action calling exists in this codebase.

Use RESEARCH.md's `complete-button.tsx` example verbatim as the base implementation, adjusting styling to match existing Tailwind token conventions seen in `lesson-nav.tsx` (`min-h-11`, `rounded-lg`, `text-[16px] font-normal leading-[1.6]`, `dark:` pairs):
```typescript
'use client';
import { useOptimistic, useTransition, useState } from 'react';
import { toggleLessonComplete } from '@/app/lesson/[lessonId]/actions';

export function CompleteButton({ lessonId, initialDone }: { lessonId: string; initialDone: boolean }) {
  // ...see RESEARCH.md Code Examples for full body
}
```
**Button touch-target/style convention** to match (from `lesson-nav.tsx` `PagerButton`, lines 27-49): `min-h-11`, `rounded-lg`, `border`, `dark:border-...-dark` pairing, icon + label flex row.

---

### `src/components/progress-badge.tsx` (component, transform)

**Analog:** `src/components/depth-badge.tsx`

**Full pattern** (lines 1-33) — copy this shape exactly, badge = small pure function taking primitive props, returning one `<span>` with a Tailwind class computed from a lookup map, no state, no client directive:
```typescript
export function DepthBadge({ depth, stepId }: { depth: "심화" | "개요"; stepId: StepId }) {
  const colorClasses = depth === "심화" ? STEP_ACCENT_CLASSES[stepId] : NEUTRAL_CLASSES;
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[14px] font-semibold leading-[1.4] ${colorClasses}`}>
      {depth}
    </span>
  );
}
```
For `progress-badge.tsx`: `{ completed, total, percent }: { completed: number; total: number; percent: number }` props, render `완료 {completed}/{total} · {percent}%` (D-26 exact copy format) in the same `<span>` badge shape. Reuse `NEUTRAL_CLASSES` constant style or `bg-badge-neutral-bg` tokens directly — no new color system needed since D-26 doesn't call for Step-accent coloring on this badge specifically (confirm during planning if Step accent is desired to match `STEP_ACCENT_CLASSES` for consistency with `module-accordion.tsx` header tinting).

---

### `src/components/progress-summary.tsx` (component, transform)

**Analog:** `src/components/step-card.tsx`

**Card/progress-bar pattern** (lines 12-47, especially the progress bar block lines 33-45):
```typescript
<div
  className="mt-1 h-2 w-full overflow-hidden rounded-full bg-badge-neutral-bg dark:bg-badge-neutral-bg-dark"
  role="progressbar"
  aria-valuenow={progressPercent}
  aria-valuemin={0}
  aria-valuemax={100}
>
  <div
    className="h-full rounded-full bg-accent dark:bg-accent-dark"
    style={{ width: `${progressPercent}%` }}
  />
</div>
<span className="text-[14px] font-normal leading-[1.4]">{progressPercent}% 완료</span>
```
Copy this exact progress-bar markup/a11y-attrs into `progress-summary.tsx` for the overall percent, plus D-27's '이어서 학습하기' CTA styled like the existing `Link`-as-card pattern (`step-card.tsx` lines 19-22: `flex min-h-11 ... rounded-lg ... bg-surface dark:bg-surface-dark`).

---

### `src/components/step-card.tsx` (modify)

**Analog:** itself. Replace the hardcoded line:
```typescript
// Phase 1은 진행률 바를 실제 컴포넌트로 렌더하되 값은 항상 0 — Phase 2가 Supabase 진도 데이터를 이 자리에 연결한다.
const progressPercent = 0;
```
with a new `progressPercent` prop (computed by the caller via `lib/progress.ts`'s `stepProgress()`), keeping the rest of the component (progress bar markup, `aria-*` attrs) unchanged. Remove the now-stale Phase 1 comment.

---

### `src/components/module-accordion.tsx` (modify)

**Analog:** itself. Existing per-lesson `<li>` block (lines 44-62) already renders `DepthBadge`/`EstimatedTime` as trailing badges in a `<span className="flex shrink-0 items-center gap-2">` — add a completed-checkmark indicator into that same trailing badge row (D-24), and add a "톤 다운" style (e.g. `opacity-60` or muted text color) conditionally to the `<li>` or inner `<span>` when the lesson is completed, following the existing conditional-class pattern used in `lesson-nav.tsx`'s `PagerButton` (`isPrev ? ... : ...` ternaries building className strings).

---

## Shared Patterns

### Server-only auth gate (D-17/D-18/D-20, Pitfall 1 & 4)
**Source:** RESEARCH.md Pattern 1 (`src/lib/auth.ts` — new file, no existing analog)
**Apply to:** `src/app/page.tsx`, `src/app/step/[stepId]/page.tsx`, `src/app/lesson/[lessonId]/page.tsx`, `src/app/lesson/[lessonId]/actions.ts`
```typescript
const unlocked = await hasUnlockCookie(); // called unconditionally, no early return before it
```
Every one of these 4 files must call `hasUnlockCookie()` — Server Actions re-verify independently of page-level gating (never rely on "button not rendered" as the only protection).

### Tailwind design tokens (Phase 1 convention, unchanged)
**Source:** `src/components/step-card.tsx`, `src/components/depth-badge.tsx`, `src/components/lesson-nav.tsx`
**Apply to:** all new components (`complete-button.tsx`, `progress-summary.tsx`, `progress-badge.tsx`)
```
min-h-11 (44px+ touch target), rounded-lg, bg-surface dark:bg-surface-dark,
bg-badge-neutral-bg dark:bg-badge-neutral-bg-dark, bg-accent dark:bg-accent-dark,
text-[14px]/text-[16px]/text-[20px]/text-[28px] with matching leading-[...] values
```

### Pure aggregation functions, no classes (Phase 1 convention)
**Source:** `src/content/curriculum-helpers.ts`
**Apply to:** `src/lib/progress.ts`
Named exported functions, filter/sort/reduce composition, explicit return types, throw descriptive `Error` only for genuinely-invalid internal references (not for expected-empty lookups).

### Server Action self-revalidation (RESEARCH.md Pattern 3)
**Source:** RESEARCH.md Code Examples (no existing analog — first Server Action in repo)
**Apply to:** `src/app/lesson/[lessonId]/actions.ts`
```typescript
revalidatePath(`/lesson/${lessonId}`);
revalidatePath('/step/[stepId]', 'page');
revalidatePath('/');
```

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/lib/supabase/admin.ts` | config/service | request-response | No Supabase integration exists in the codebase yet — use RESEARCH.md Pattern 2 example |
| `src/lib/auth.ts` | utility | request-response | No cookie/auth helper exists yet — use RESEARCH.md Pattern 1 example |
| `src/app/unlock/route.ts` | route | request-response | No Route Handler exists anywhere in the repo yet — build from RESEARCH.md architecture diagram + Next.js `route.ts` conventions (GET, `NextResponse.redirect`, `cookies().set()`) |
| `src/app/lesson/[lessonId]/actions.ts` (CRUD/error-handling body) | controller | CRUD | No Server Action exists in the repo — base on RESEARCH.md Pattern 3, combined with co-location convention from sibling `page.tsx` |

## Metadata

**Analog search scope:** `src/components/`, `src/app/`, `src/content/`, `src/lib/` (does not yet exist)
**Files scanned:** `step-card.tsx`, `module-accordion.tsx`, `lesson-nav.tsx`, `depth-badge.tsx`, `site-nav.tsx`, `curriculum-helpers.ts`, `src/app/page.tsx`, `src/app/lesson/[lessonId]/page.tsx`, `src/app/step/[stepId]/page.tsx`
**Pattern extraction date:** 2026-08-24
