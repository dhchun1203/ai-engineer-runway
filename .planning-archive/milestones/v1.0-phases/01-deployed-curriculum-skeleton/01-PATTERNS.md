# Phase 1: 배포된 커리큘럼 뼈대 - Pattern Map

**Mapped:** 2026-08-24
**Files analyzed:** 22
**Analogs found:** 0 / 22 (codebase analogs) — **all patterns grounded in RESEARCH.md verified sources instead**

## Codebase Status (read first)

This is a **fully greenfield repository**. Confirmed via directory listing: the project root contains only `.claude/` (project config), `.planning/` (GSD artifacts), `docs/making-of.md`, and `.git/`. There is no `package.json`, no `src/`, no prior Next.js/React/TypeScript code of any kind.

**Consequence for the planner:** there are no internal codebase analogs to copy from for Phase 1. Every pattern below is instead grounded in `01-RESEARCH.md`'s verified code excerpts (sourced from Context7 official docs for Velite, rehype-pretty-code, Tailwind v4, and next/font — see RESEARCH.md `## Sources`) and in `.claude/CLAUDE.md`'s locked stack/version table. Treat RESEARCH.md's "Code Examples" section (Patterns 1-6) as the canonical analog source for this phase. Later phases (2+) will have real internal analogs once this phase lands.

## File Classification

| New File | Role | Data Flow | Analog Source | Match Quality |
|----------|------|-----------|----------------|----------------|
| `package.json` | config | — | none (greenfield) | RESEARCH.md `## Standard Stack` install block |
| `next.config.ts` | config | build-time transform | none (greenfield) | RESEARCH.md Pattern 1 (Velite/Turbopack) |
| `velite.config.ts` | config/model | transform (MDX→JSON) | none (greenfield) | RESEARCH.md Pattern 2 |
| `postcss.config.mjs` | config | build-time transform | none (greenfield) | RESEARCH.md Standard Stack (`@tailwindcss/postcss`) |
| `src/content/modules.ts` | model | static data | none (greenfield) | RESEARCH.md "Curriculum Manifest Derivation" + `.planning/curriculum.md` |
| `src/content/curriculum-helpers.ts` | utility | transform (lookup/next-prev) | none (greenfield) | RESEARCH.md Recommended Project Structure |
| `src/content/lessons/step-1/1-3-variables-and-types.mdx` | content/model | file-I/O (build-time read) | none (greenfield) | RESEARCH.md Pattern 2 schema + D-10 6단 템플릿 |
| `src/content/lessons/step-2/2-3-react-components.mdx` | content/model | file-I/O (build-time read) | same as above (sibling pilot) | pilot self-analog |
| `src/content/lessons/**/*.mdx` (33 stub lessons) | content/model | file-I/O (build-time read) | pilot MDX files above | role-match (metadata-only variant) |
| `src/app/layout.tsx` | component (root layout) | request-response (SSG) | none (greenfield) | RESEARCH.md Pattern 5 (dark mode script) + Recommended Project Structure |
| `src/app/page.tsx` | component (page) | request-response (SSG) | none (greenfield) | RESEARCH.md Architecture Diagram `/` route description |
| `src/app/step/[stepId]/page.tsx` | component (page) | request-response (SSG, `generateStaticParams`) | none (greenfield) | RESEARCH.md Architecture Diagram + Pitfall 2 |
| `src/app/lesson/[lessonId]/page.tsx` | component (page) | request-response (SSG, `generateStaticParams`) | none (greenfield) | RESEARCH.md Pitfall 2 (35 static paths) + Pattern 3 |
| `src/app/about/page.tsx` | component (page) | file-I/O (reads `docs/making-of.md`) | `docs/making-of.md` (existing content source) | content-source match, no component analog |
| `src/app/globals.css` | config/style | — | none (greenfield) | RESEARCH.md Pattern 4 (highlight CSS) + Pattern 5 (dark variant) + Pattern 6 (keep-all) |
| `src/components/mdx-content.tsx` | component (runtime renderer) | transform (code string → React) | none (greenfield) | RESEARCH.md Pattern 3 (verbatim) |
| `src/components/step-card.tsx` | component | request-response (presentational) | none (greenfield) | CONTEXT.md D-07, D-03/D-04 (accent colors, 0% progress slot) |
| `src/components/depth-badge.tsx` | component | request-response (presentational) | none (greenfield) | RESEARCH.md Pattern 2 `depth` enum (CONT-04) |
| `src/components/theme-toggle.tsx` | component | event-driven (client interactivity) | none (greenfield) | RESEARCH.md Pattern 5 (localStorage + matchMedia) |
| `src/lib/fonts.ts` | utility/config | — | none (greenfield) | RESEARCH.md Pattern 6 (verbatim) |
| `.gitignore` | config | — | none (greenfield) | Security Domain: `.env.local` must be ignored from first commit |
| `README.md` (optional) | doc | — | none (greenfield) | D-14 public repo — portfolio surface, no KANT mentions (HARD RULE) |
| GitHub repo + Vercel project | infra | event-driven (git push → deploy) | none (greenfield) | RESEARCH.md Pitfall 5, D-15/D-16 |

## Pattern Assignments

### `next.config.ts` (config, build-time transform)

**Source:** RESEARCH.md Pattern 1, verbatim from Context7 `/zce/velite` docs (Velite's own documented Turbopack-safe integration).

```typescript
import type { NextConfig } from 'next'

const isDev = process.argv.indexOf('dev') !== -1
const isBuild = process.argv.indexOf('build') !== -1
if (!process.env.VELITE_STARTED && (isDev || isBuild)) {
  process.env.VELITE_STARTED = '1'
  import('velite').then(m => m.build({ watch: isDev, clean: !isDev }))
}

const nextConfig: NextConfig = { /* config options here */ }
export default nextConfig
```

**Do not use** `VeliteWebpackPlugin` — breaks silently under Turbopack (Next 16's default dev bundler). See RESEARCH.md Pitfall 1 / Anti-Patterns.

---

### `velite.config.ts` (config/model, transform)

**Source:** RESEARCH.md Pattern 2, adapted from Context7 `/zce/velite` docs, extended with D-13's required fields (`depth`, `estimatedMinutes`).

```typescript
import { defineConfig, s } from 'velite'

export default defineConfig({
  collections: {
    lessons: {
      name: 'Lesson',
      pattern: 'content/lessons/**/*.mdx',
      schema: s.object({
        title: s.string(),
        stepId: s.number().min(1).max(3),
        moduleId: s.string(),           // e.g. "1-3", cross-checked against modules.ts
        order: s.number(),
        depth: s.enum(['심화', '개요']), // CONT-04 depth badge
        estimatedMinutes: s.number().min(1), // D-13, Phase 3 input
        slug: s.slug('lessons'),
        hasContent: s.boolean().default(true), // false for the 33 placeholder rows
        code: s.mdx()
      })
    }
  }
})
```

**Key constraint (Pitfall 2):** All 35 manifest rows must exist (2 pilots + 33 stubs with `hasContent: false`), not just the 2 pilot lessons — `generateStaticParams()` returning only 2 paths breaks CONT-01's "전체 레슨 목록" requirement.

---

### `src/components/mdx-content.tsx` (component, transform)

**Source:** RESEARCH.md Pattern 3, verbatim from Context7 `/zce/velite` docs — this is the only correct way to turn Velite's compiled `code` string back into a React component; do not hand-roll an alternative MDX loader.

```tsx
import * as runtime from 'react/jsx-runtime'

const useMDXComponent = (code: string) => {
  const fn = new Function(code)
  return fn({ ...runtime }).default
}

export const MDXContent = ({ code, components }: { code: string; components?: Record<string, React.ComponentType> }) => {
  const Component = useMDXComponent(code)
  return <Component components={components} />
}
```

**Applies to:** `src/app/lesson/[lessonId]/page.tsx` (pilot lessons) and `src/app/about/page.tsx` (Making-of MDX render) — both consume this same runtime component.

---

### Syntax highlighting + copy button config (rehype-pretty-code, feeds into `next.config.ts` or MDX pipeline options)

**Source:** RESEARCH.md Pattern 4, from Context7 `/rehype-pretty/rehype-pretty-code` docs (`llms.txt`).

```typescript
import rehypePrettyCode from 'rehype-pretty-code'
import { transformerCopyButton } from '@rehype-pretty/transformers'

const options = {
  theme: { dark: 'github-dark-dimmed', light: 'github-light' },
  transformers: [
    transformerCopyButton({ visibility: 'always', feedbackDuration: 3_000 })
  ]
}
```

**Critical:** `visibility: 'always'`, NOT `'hover'` — iPad Safari has no hover state (UX-01). This is Pitfall 3 in RESEARCH.md. Applies to CONT-06 across all lesson MDX rendering.

**Companion CSS** (for `src/app/globals.css`, satisfies CONT-06 + UX-03 가로 스크롤):
```css
pre { overflow-x: auto; padding: 1rem 0; }
code[data-theme*=" "], code[data-theme*=" "] span {
  color: var(--shiki-light);
  background-color: var(--shiki-light-bg);
}
@media (prefers-color-scheme: dark) {
  code[data-theme*=" "], code[data-theme*=" "] span {
    color: var(--shiki-dark);
    background-color: var(--shiki-dark-bg);
  }
}
```

---

### `src/app/globals.css` dark mode variant + `src/components/theme-toggle.tsx` (style config + client component, event-driven)

**Source:** RESEARCH.md Pattern 5, from Context7 `/websites/tailwindcss` docs (dark-mode.mdx) — satisfies D-05.

```css
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));
```

Inline script placed in `<head>` of `src/app/layout.tsx`, **before hydration**, to avoid flash-of-wrong-theme:
```html
<script>
  document.documentElement.classList.toggle(
    "dark",
    localStorage.theme === "dark" ||
      (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)
  );
</script>
```

**Do not** build a React context/`useEffect` theme provider for this — causes hydration-mismatch FOUC (RESEARCH.md Don't Hand-Roll table). `theme-toggle.tsx` should be a small client component that reads/writes the same `localStorage.theme` key and toggles the `.dark` class directly.

---

### `src/lib/fonts.ts` (utility/config)

**Source:** RESEARCH.md Pattern 6, verbatim from Context7 `/vercel/next.js` docs (`next/font/local` API reference).

```typescript
import localFont from 'next/font/local'

const pretendard = localFont({
  src: '../public/fonts/PretendardVariable.woff2',
  variable: '--font-pretendard',
  weight: '45 920', // variable font axis range, not 9 discrete files
  display: 'swap'
})
```

**Companion CSS** (`src/app/globals.css`, satisfies UX-03 D-06):
```css
body { word-break: keep-all; overflow-wrap: break-word; }
code, pre { font-family: var(--font-mono, ui-monospace, monospace); } /* don't inherit Korean body font into code */
```

**Pitfall 4 warning:** verify this against the actual pilot lesson body text (not lorem ipsum) before considering it done — keep-all + code/body font pairing can look fine on short placeholder strings but break on full-length Korean prose with inline code terms.

---

### `src/app/step/[stepId]/page.tsx` and `src/app/lesson/[lessonId]/page.tsx` (page components, SSG request-response)

**No direct code analog exists** (greenfield) — ground these in the Architecture Diagram + curriculum manifest derivation from RESEARCH.md:

- `generateStaticParams()` must return all 3 stepIds and all 35 lessonIds (not just the 2 pilots) — Pitfall 2.
- Lesson page branches on the Velite-generated `hasContent` boolean: pilot lessons render via `MDXContent`; the 33 stub lessons render a "콘텐츠 준비 중" placeholder body, still as a real linkable route (not a 404) — Anti-Patterns section, Pitfall 2.
- Step page renders a module accordion (client-side open/close state only, per Architectural Responsibility Map — tree structure itself is resolved at build time) → lesson list per module.

---

### `src/app/page.tsx` (home dashboard) and `src/components/step-card.tsx`

**No code analog exists.** Ground in CONTEXT.md decisions:
- D-07: 3 Step cards on home, drill-down navigation model (홈 → Step → 모듈 아코디언 → 레슨 목록 → 레슨).
- Progress display slot: render at 0% in Phase 1 (Phase 2 wires real Supabase data) — Specific Idea in CONTEXT.md `<specifics>`.
- D-04: each Step card carries its own accent color (Step 1/2/3 differentiated), applied consistently to depth badges and progress bars later.

---

### `src/components/depth-badge.tsx`

**Source:** driven directly by the Velite schema's `depth: s.enum(['심화', '개요'])` field (Pattern 2 above) and CONT-04's requirement that Step 3 lessons show `개요` while Step 1/2 core lessons show `심화`. No code analog — presentational component reading manifest metadata only, no client logic needed (server-renderable).

---

### `src/app/about/page.tsx` (Making-of page)

**Analog:** `docs/making-of.md` (existing file, read this session — see excerpt below) is the *content source*, not a code pattern. Render it through the same `MDXContent` pipeline as lessons (Pattern 3), or via Velite as a `pages` collection / plain markdown import (Claude's discretion per CONTEXT.md).

Excerpt confirming structure to preserve when rendering (`docs/making-of.md` lines 1-24):
```
# Making-of: 이 사이트가 만들어진 과정
## 프로젝트 한눈에 보기
## 단계별 기록
### 1단계 — 기획 & 자료 수집 ✅ (2026-08-24)
### 2단계 — 도메인 리서치 ✅ (2026-08-24)
```
CONTEXT.md recommends a step-by-step timeline layout matching this document's existing `### N단계 — ...` heading structure. **HARD RULE reminder:** when rendering this file publicly, verify no "KANT" mention leaks through (D-02) — scan the full file before wiring the render, not just the excerpt above.

---

## Shared Patterns

### Velite MDX pipeline (applies to all lesson files + Making-of page)
**Source:** RESEARCH.md Patterns 1-3 (config, schema, runtime renderer above). Every MDX-consuming file in this phase (pilot lessons, stub lessons, Making-of) funnels through this same three-part pipeline: `next.config.ts` top-level-await build → `velite.config.ts` schema → `MDXContent` runtime component.

### Dark mode (applies to `layout.tsx`, `globals.css`, `theme-toggle.tsx`)
**Source:** RESEARCH.md Pattern 5. Single source of truth: `localStorage.theme` + `.dark` class on `<html>`, toggled by inline pre-hydration script and by the client `theme-toggle.tsx` component. No React context.

### 44px touch targets (applies to all interactive components: nav, buttons, accordion headers, prev/next lesson buttons)
**Source:** UX-01 requirement + RESEARCH.md Pitfall 3 rationale (no hover on iPad Safari). Use Tailwind `min-h-11`/`min-w-11` (44px) utilities on every tappable element; verify with real iPad Safari, not just desktop emulation.

### Korean typography (applies to `globals.css`, `fonts.ts`, all prose-rendering components)
**Source:** RESEARCH.md Pattern 6 + D-06. `word-break: keep-all` globally on `body`, Pretendard via `next/font/local` for body text, monospace fallback for `code`/`pre` (do not inherit Korean font into code blocks).

### KANT brand-name exclusion (applies to ALL public-facing files: layout metadata, page titles, OG tags, MDX content, Making-of render, code comments visible in copy-paste examples)
**Source:** `.claude/CLAUDE.md` HARD RULE + CONTEXT.md D-02. Always "AI Engineer 교육과정", never the institution name. This is a cross-cutting content-review concern, not a code pattern — flag for manual review at phase gate.

## No Analog Found

All 22 files listed above have **no internal codebase analog** (confirmed greenfield repo — no `src/`, no `package.json`). Patterns are instead sourced from RESEARCH.md's Context7-verified code excerpts and CONTEXT.md's locked decisions, as detailed per-file above. This is expected and correct for a Phase 1 scaffold; the planner should cite RESEARCH.md Pattern 1-6 directly rather than expect a "copy from existing file X" instruction for any Phase 1 file.

## Metadata

**Analog search scope:** Full repository root (`C:/Users/dhchu/dev/aiEngineerCourse`) — confirmed via `ls` and `find` that only `.claude/`, `.git/`, `.planning/`, `docs/making-of.md` exist; no application source tree.
**Files scanned:** 4 top-level entries (directory listing), 1 content file read (`docs/making-of.md`, lines 1-40)
**Pattern extraction date:** 2026-08-24
