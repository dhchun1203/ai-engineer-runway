---
phase: 01-deployed-curriculum-skeleton
reviewed: 2026-08-24T12:00:00Z
depth: standard
files_reviewed: 36
files_reviewed_list:
  - AGENTS.md
  - CLAUDE.md
  - README.md
  - docs/making-of.md
  - eslint.config.mjs
  - next.config.ts
  - package.json
  - postcss.config.mjs
  - scripts/check-brand.mjs
  - scripts/check-manifest.mjs
  - src/app/about/page.tsx
  - src/app/globals.css
  - src/app/layout.tsx
  - src/app/lesson/[lessonId]/page.tsx
  - src/app/not-found.tsx
  - src/app/page.tsx
  - src/app/step/[stepId]/page.tsx
  - src/components/depth-badge.tsx
  - src/components/estimated-time.tsx
  - src/components/lesson-nav.tsx
  - src/components/mdx-content.tsx
  - src/components/module-accordion.tsx
  - src/components/site-nav.tsx
  - src/components/step-card.tsx
  - src/components/theme-toggle.tsx
  - src/content/curriculum-helpers.ts
  - src/content/modules.ts
  - src/lib/fonts.ts
  - tsconfig.json
  - velite.config.ts
  - src/content/lessons/step-1/1-3-python-variables-and-types.mdx
  - src/content/lessons/step-2/2-3-react-components.mdx
  - src/content/lessons/step-1/1-1-course-orientation.mdx
  - src/content/lessons/step-2/2-6-project-ai-shop-backend.mdx
  - src/content/lessons/step-3/3-7-project-ax-launch.mdx
  - src/content/lessons/step-1/1-2-git-branch-and-pr.mdx
findings:
  critical: 0
  warning: 6
  info: 5
  total: 11
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-08-24T12:00:00Z
**Depth:** standard
**Files Reviewed:** 36
**Status:** issues_found

## Summary

Reviewed the Phase 1 "deployed curriculum skeleton": Next.js 16 App Router shell, Velite MDX pipeline, curriculum manifest, two fully-written pilot lessons, 33 metadata-only stub lessons (4 spot-checked), and the two Node-based content gate scripts (`check-brand.mjs`, `check-manifest.mjs`).

No security vulnerabilities, crashes, or data-loss risks were found — this is a static, single-user, no-backend-yet content site, and the code is generally careful (fail-fast helpers in `curriculum-helpers.ts`, a hardcoded and well-commented brand gate, Zod-validated frontmatter). `tsc --noEmit` is clean.

However, running the project's own `npm run lint` (eslint over `src` + `scripts`) surfaces two real errors (not just warnings) that the source review confirms are genuine: a Next.js-flagged `module` variable shadow in `lesson-nav.tsx`, and a React-hooks rule violation in `theme-toggle.tsx`. Both were present in the reviewed code and are not artifacts of a stale lint config. Additionally, the two gate scripts (`check-brand.mjs`, `check-manifest.mjs`) are sound in their own logic and both currently pass against the repo — but neither is wired into `package.json` scripts or any CI workflow, so the "HARD RULE" brand gate described in `CLAUDE.md` is not actually enforced anywhere in the build/deploy path yet. Several places silently degrade (blank breadcrumb text, blank About page) instead of failing loudly, inconsistent with the fail-fast pattern the codebase otherwise uses.

## Warnings

### WR-01: `module` variable assignment triggers a real ESLint error (breaks `npm run lint`)

**File:** `src/components/lesson-nav.tsx:10`
**Issue:** `const module = modules.find((m) => m.id === lesson.moduleId);` reassigns the identifier `module`, which `eslint-config-next`'s `@next/next/no-assign-module-variable` rule flags as an **error** (confirmed by running `npx eslint src scripts`, not just a hypothetical lint rule). This means the project's own `npm run lint` script currently fails. Next.js documents this pattern as unsafe because `module` is a reserved CommonJS binding that certain bundler/module-wrapping transforms rely on.
**Fix:**
```tsx
const moduleInfo = modules.find((m) => m.id === lesson.moduleId);
// ...
{moduleInfo?.title ?? ""}
```

### WR-02: `setState` called synchronously in `useEffect` triggers a real ESLint error

**File:** `src/components/theme-toggle.tsx:14-16`
**Issue:** `npx eslint src scripts` reports `react-hooks/set-state-in-effect` as an **error** here, not a warning — `npm run lint` fails on this file too. The pattern itself (read `document.documentElement.classList` post-hydration to avoid an SSR mismatch) is intentional and arguably correct given the inline pre-hydration script in `layout.tsx`, but as written it is undocumented and leaves the lint gate red with no explanation for why it's an accepted exception.
**Fix:** Either restructure to avoid the flagged pattern, or explicitly suppress with a reason so the lint gate is green and the intent is discoverable:
```tsx
useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect -- must read
  // documentElement post-hydration; see layout.tsx's pre-hydration inline script.
  setIsDark(document.documentElement.classList.contains("dark"));
}, []);
```

### WR-03: Brand/manifest gate scripts exist but are not wired into any build step or CI

**File:** `scripts/check-brand.mjs`, `scripts/check-manifest.mjs`, `package.json:5-10`
**Issue:** Both scripts' internal logic is sound (verified: both currently pass — `check-brand: 위반 없음 — 60개 파일 검사 완료`, `check-manifest: all 11 invariants passed`). But `package.json`'s `scripts` block only defines `dev`, `build`, `start`, `lint` — neither `check-brand.mjs` nor `check-manifest.mjs` is referenced there, and there is no `.github/workflows/` (or other CI config) that runs them either. `CLAUDE.md` describes the brand check as a "HARD RULE" and the script's own header comment calls it a "상시 게이트" (always-on gate), but nothing in the repo currently runs it automatically before a Vercel deploy (`master` push triggers production deploy per `README.md` with no pre-deploy check). A future lesson MDX file that accidentally includes the forbidden brand string would ship to production undetected.
**Fix:** Wire both into the build pipeline, e.g.:
```json
"scripts": {
  "check:brand": "node scripts/check-brand.mjs",
  "check:manifest": "node scripts/check-manifest.mjs",
  "prebuild": "npm run check:brand && npm run check:manifest",
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint"
}
```
(or add a GitHub Actions workflow that runs both scripts on every push/PR before Vercel's build).

### WR-04: Velite build promise in `next.config.ts` has no error handling

**File:** `next.config.ts:4-8`
**Issue:** `import("velite").then((m) => m.build({ watch: isDev, clean: !isDev }));` has no `.catch()`. If a lesson's frontmatter fails the Zod schema (e.g. `estimatedMinutes` missing, wrong `depth` value), the promise rejects with no handler. Depending on the Node version and process context this can silently no-op or produce an unhandled-rejection warning without failing the `next build`/`next dev` process, meaning stale or incomplete `.velite` output could be used with no clear failure signal at the point of the actual content error.
**Fix:**
```ts
if (!process.env.VELITE_STARTED && (isDev || isBuild)) {
  process.env.VELITE_STARTED = "1";
  import("velite")
    .then((m) => m.build({ watch: isDev, clean: !isDev }))
    .catch((err) => {
      console.error("Velite content build failed:", err);
      process.exit(1);
    });
}
```

### WR-05: Silent fallback on orphan `moduleId` diverges from the codebase's own fail-fast pattern

**File:** `src/components/lesson-nav.tsx:10,19`
**Issue:** `curriculum-helpers.ts`'s `findModule()` explicitly throws a build-time error for a lesson referencing an unknown `moduleId` ("고아 레슨은 조용히 건너뛰지 않고 빌드를 실패시킨다" per its own comment). `LessonBreadcrumb`, however, looks up the module directly against `modules` and falls back to `module?.title ?? ""`, silently rendering an empty breadcrumb segment instead of failing. `check-manifest.mjs`'s Invariant 7 currently prevents this from happening in practice, but the component itself has no such guarantee and is inconsistent with the rest of the codebase's stated philosophy.
**Fix:** Reuse the strict lookup (export `findModule` from `curriculum-helpers.ts` and import it here), or throw locally:
```tsx
const moduleInfo = modules.find((m) => m.id === lesson.moduleId);
if (!moduleInfo) {
  throw new Error(`LessonBreadcrumb: no module found for moduleId "${lesson.moduleId}"`);
}
```

### WR-06: `/about` page silently renders with no content if the Velite `pages` collection is empty

**File:** `src/app/about/page.tsx:15-31`
**Issue:** `const page = pages.find((p) => p.slug === "making-of");` — if `docs/making-of.md` is ever moved, renamed, or fails Velite's schema validation, `page` is `undefined` and the component renders just the `<h1>` fallback ("소개") with no body content and no build/runtime error. Unlike the lesson pipeline (which has `check-manifest.mjs` asserting lesson counts/slugs), there is no equivalent invariant for the single `pages` collection entry, so this failure mode would only be caught by a human noticing a blank About page in production.
**Fix:**
```tsx
const page = pages.find((p) => p.slug === "making-of");
if (!page) {
  throw new Error(
    'AboutPage: "making-of" page not found in Velite pages collection — check docs/making-of.md and the pages pattern in velite.config.ts.',
  );
}
```

## Info

### IN-01: Unused import `StepId` in `lesson-nav.tsx`

**File:** `src/components/lesson-nav.tsx:4`
**Issue:** `import type { StepId } from "@/content/modules";` is never used in the file (confirmed by `eslint`'s `@typescript-eslint/no-unused-vars` warning).
**Fix:** Remove the unused import.

### IN-02: Undocumented empty `catch` block in the pre-hydration theme script

**File:** `src/app/layout.tsx:31-38`
**Issue:** `try { ... } catch (e) {}` in `themeInitScript` silently swallows any error (e.g. `localStorage` unavailable). The behavior is reasonable (degrade to light theme rather than crash the page), but unlike the same pattern in `theme-toggle.tsx:23-25` (which has an explanatory comment), this one has none, so a reviewer/linter can't tell it's intentional versus an oversight.
**Fix:** Add a short comment, e.g. `// localStorage/matchMedia unavailable (private mode, etc.) — fall back to light theme silently.`

### IN-03: `new Function(code)` in `mdx-content.tsx` will trip naive "dangerous eval" scanners

**File:** `src/components/mdx-content.tsx:12`
**Issue:** `const fn = new Function(code);` is functionally equivalent to `eval` and will be flagged by any pattern-based security scan (`eval\(|Function\(`). It is the documented, correct Velite runtime-MDX pattern, and `code` originates exclusively from build-time-compiled local `.mdx` files (not user/request input), so there is no injection vector today. Still, the trust boundary isn't stated next to the risky line itself (it's explained a few lines above in a different comment block).
**Fix:** Add an explicit one-line trust-boundary note directly above line 12, e.g. `// code is build-time output from local .mdx files only — never derived from request/user input.`

### IN-04: Lesson/Step routes don't set `dynamicParams = false`

**File:** `src/app/step/[stepId]/page.tsx:6-8`, `src/app/lesson/[lessonId]/page.tsx:13-15`
**Issue:** Both routes define `generateStaticParams()` but neither exports `export const dynamicParams = false`. Per this project's own documented convention ("plain static generation ... no ISR"), an unlisted param (e.g. `/step/4`, `/lesson/does-not-exist`) will currently be handled via Next's on-demand/dynamic rendering path (correctly resulting in `notFound()`), rather than being excluded from the route space at build time. Functionally harmless today, but it doesn't match the stated all-static-generation intent and could mask future intent to serve arbitrary lesson IDs.
**Fix:** Add `export const dynamicParams = false;` to both files if the intent is truly "only the 35 known lessons / 3 known steps exist," or document the deliberate choice to allow dynamic fallback if not.

### IN-05: `lesson.stepId as StepId` type assertion

**File:** `src/app/lesson/[lessonId]/page.tsx:35`
**Issue:** `<DepthBadge depth={lesson.depth} stepId={lesson.stepId as StepId} />` — Velite's generated `Lesson.stepId` type is `number` (from `s.number().min(1).max(3)`, which Zod does not narrow to a literal union), so the assertion bypasses the type checker. Risk is low in practice (Zod enforces the 1-3 bound at build time, and `check-manifest.mjs` further constrains valid combinations), but if the schema bound is ever loosened, this assertion would silently mask an out-of-range value reaching `STEP_ACCENT_CLASSES[stepId]` in `depth-badge.tsx` / `module-accordion.tsx` (producing `undefined` in a class string rather than a visible error).
**Fix:** Low priority — consider a small runtime-narrowing helper (`asStepId(n: number): StepId`) that throws on out-of-range input, shared across the two call sites that currently cast.

---

_Reviewed: 2026-08-24T12:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
