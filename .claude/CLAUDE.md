<!-- GSD:project-start source:PROJECT.md -->

## Project

**AI Engineer 사전학습 사이트 (aiEngineerCourse)**

2026-09-30 개강하는 AI Engineer 교육과정(총 1,056시간, Step 1~3)을 수강할 학습자(사용자 본인)를 위한 사전학습 웹 사이트. 커리큘럼 전체를 쉬운 개념 설명 + 실무 적용 예제로 콘텐츠화하고, 레슨별 완료 체크와 섹션별 진행률, 개강 전(~9/29) 학습 일정표를 제공한다. Next.js + Supabase로 구축하고 Vercel에 배포해 어디서든 접속한다.

**Core Value:** 개강 전까지 커리큘럼의 기초를 확실히 다질 수 있도록 — 학습 콘텐츠를 읽고, 완료를 체크하고, 진행률과 일정을 한눈에 확인하는 흐름이 반드시 동작해야 한다.

### Constraints

- **Timeline**: 2026-09-30 개강 전 사이트 완성 + 사전학습 시간 확보 — 구축에 시간을 너무 쓰면 학습 시간이 줄어듦
- **Tech stack**: Next.js(App Router) + Supabase(진도 저장) + Vercel 배포 — 사용자 선택, 커리큘럼 스택과 일치
- **사용자 규모**: 1인 사용 — 복잡한 인증/권한 불필요, 최소한의 보호만
- **언어**: UI/콘텐츠 모두 한국어 (코드·기술 용어는 영어 병기)
- **주 사용 기기**: 아이패드 (iPad Safari) — 태블릿 우선 반응형 레이아웃, 터치 타깃 크기(44px+), 코드 블록 가로 스크롤, 세로/가로 모드 모두 지원. 데스크톱·폰도 동작해야 하나 아이패드 경험이 1순위

<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js (App Router) | 16.3.2 | Framework, routing, rendering | Already decided by user. v16 is current stable on npm (confirmed via registry `dist-tags.latest`). Use the App Router exclusively — Pages Router is legacy and gets no new features. |
| React | 19.2.8 | UI runtime | Ships as Next.js 16's required peer (`react: ^19.0.0`). Needed for Server Components, `use()` hooks, and current MDX renderers. |
| TypeScript | 5.x (avoid the `typescript@7` "Corsa" native-compiler line for now) | Type safety | Next.js's own tooling and most ecosystem libraries (Velite, Contentlayer successors, `@supabase/ssr` types) are validated against TS 5.x. `typescript@7` (Microsoft's native/Go-based compiler rewrite) exists on npm but is a major breaking-change release for tooling compatibility — not worth the risk on a 5-week solo build. Pin `"typescript": "^5.6"`. |
| Supabase (Postgres + Auth) | `@supabase/supabase-js` 2.112.x, `@supabase/ssr` 0.12.4 | Progress-tracking data store + auth | Already decided by user. `@supabase/ssr` is the current, non-deprecated way to wire Supabase auth into Next.js App Router (replaces the retired `auth-helpers-nextjs` package). |
| Tailwind CSS | 4.3.3 | Styling | Utility-first CSS with zero runtime cost, first-class Next.js support, and a mature `@tailwindcss/typography` plugin for long-form lesson prose — the single biggest styling need on a content site. |
| Vercel | — (platform, no version) | Hosting/deploy | Already decided by user. Zero-config Next.js deploys, free tier is enough for a single-user site, git-push-to-deploy fits a 5-week solo timeline. |

### Content Authoring & Rendering

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Velite | 0.4.0 | Build-time content pipeline: validates MDX/Markdown frontmatter against a Zod schema and generates typed JSON + compiled MDX | Use for the curriculum content itself (Step → Module → Lesson tree). Gives you compile-time errors when a lesson is missing a required field (e.g., `estimatedMinutes`, `stepId`) — valuable when authoring dozens of lessons solo under time pressure. |
| `@mdx-js/react` / Velite's built-in MDX compile | bundled with Velite | Render MDX to React at build time | Velite compiles MDX itself; you only need a small `<MDXContent>` runtime component to render the compiled code. |
| rehype-pretty-code | 0.14.5 | Syntax highlighting plugin for the MDX pipeline | Wraps Shiki as a rehype plugin, highlights at build time (ships zero highlighting JS to the client), supports dual light/dark themes via `data-theme` attributes. |
| Shiki | 4.4.3 | Syntax highlighter engine | Same TextMate-grammar engine VS Code uses — most accurate result for the many code languages this curriculum spans (Python, SQL, TS, React/Next.js, Express, Prisma). Declared as `rehype-pretty-code`'s peer dependency (`^1‖^2‖^3‖^4`), so pin `shiki@^4` alongside it. |

### Progress-Tracking Data Layer

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@supabase/ssr` | 0.12.4 | Cookie-aware Supabase client factory for SSR frameworks | Use `createBrowserClient()` in Client Components (the "완료" checkbox interactions), `createServerClient()` (backed by `next/headers` `cookies()`) in Server Components/Server Actions/Route Handlers, and a `middleware.ts` that refreshes the session on every request. |
| Supabase Anonymous Auth (`signInAnonymously`) | built into `@supabase/supabase-js` 2.x | Establishes a stable `auth.uid()` without any login UI | **Recommended auth pattern for this project** (see rationale below). |
| Postgres Row Level Security (RLS) | Supabase-managed Postgres | Restrict the `lesson_progress` table so only the authenticated (even if anonymous) user can read/write their own rows | Always enable RLS — never ship a public table with RLS disabled, even for a single-user app, because the anon/publishable key is exposed client-side. |

### Styling & Typography

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@tailwindcss/postcss` | 4.3.3 | Tailwind's PostCSS integration (v4 changed the package name) | Required build step — `postcss.config.mjs` plugin, paired with a single `@import "tailwindcss";` in `globals.css`. No `tailwind.config.js` is required by default under v4's CSS-first `@theme` config, which reduces setup overhead. |
| `@tailwindcss/typography` | 0.5.20 | `prose` utility classes for long-form article/lesson content | Apply `prose prose-slate dark:prose-invert` (or a custom `@theme` prose override) directly to the MDX content wrapper instead of hand-styling every heading/paragraph/code-block — the fastest path to readable lesson pages. |
| Pretendard (via `next/font/local`) | latest (self-hosted variable font, not on npm as a first-party package — vendor the `.woff2` from the [orioncactus/pretendard](https://github.com/orioncactus/pretendard) release) | Primary Korean UI/body font | See Korean font section below. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| ESLint (`eslint-config-next`) | Lint | Ships with `create-next-app`; keep default Next.js 16 config, add no extra rulesets given the short timeline. |
| Supabase CLI | Local Postgres + migrations + generated types | Run `supabase init` once, write the `lesson_progress` schema as a migration, then `supabase gen types typescript` to get a typed client — avoids hand-writing DB types for a schema this small. |
| Vercel CLI | Local env var management / preview deploys | `vercel env pull` to sync `NEXT_PUBLIC_SUPABASE_URL` / anon key locally without copy-pasting from the dashboard. |

## Installation

# Core

# Content pipeline

# Supabase

# Styling

# Fonts: no npm install needed for Pretendard — vendor static/variable

# woff2 files into /public/fonts and load via next/font/local

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|--------------------------|
| Velite | Contentlayer / Contentlayer2 | Never for a new project — the original Contentlayer is unmaintained and its own docs site (Fumadocs) dropped support for it. Only relevant if migrating an existing Contentlayer codebase. |
| Velite | Fumadocs (full framework) | Use if this were a public developer-docs site needing built-in search, versioned docs nav, and OpenAPI rendering — those features are overkill for a fixed 3-Step/N-lesson personal curriculum and add a heavier dependency surface than a 5-week solo build should carry. |
| Velite | Plain `next-mdx-remote` + `gray-matter` | Acceptable lighter-weight fallback if Velite's Zod-schema build step feels like unnecessary ceremony; you lose compile-time content validation and generated TypeScript types, so lesson metadata typos (e.g., wrong `stepId`) only surface at runtime. |
| rehype-pretty-code + Shiki | `rehype-prism-plus` (Prism) | Use only if bundle/build-time budget is extremely tight — Prism's grammars are less accurate for TS/React/SQL than Shiki's, which matters when code correctness is part of what's being taught. |
| Supabase anonymous sign-in | Magic link email auth | Use if the site will ever be accessed by someone other than the owner, or if the owner wants an actual account recoverable across a wiped browser/device — magic link survives `signInAnonymously`'s single weakness (losing the anon session = losing progress) at the cost of an email round-trip on every new device. |
| Supabase anonymous sign-in | No-auth, single shared row keyed by a hardcoded UUID, RLS `USING (true)` | Never — this makes the progress table world-writable to anyone who inspects the client bundle for the Supabase URL/anon key (both are always public in a Next.js app). Do not use "convenience" RLS policies. |
| Tailwind v4 | Tailwind v3 | Use v3 only if a chosen dependency (rare at this point) explicitly requires `tailwind.config.js`-based JS config or hasn't published v4-compatible plugin builds — verify before downgrading, since v4 is now the documented default install path. |
| Pretendard | Noto Sans KR only | Use Noto Sans KR alone if you want a single `next/font/google` import with zero manual font-file hosting and don't mind a slightly heavier CJK glyph set and a look less native to macOS/Windows UI conventions. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Pages Router (`pages/`) | Legacy Next.js routing model; no new framework investment goes there, and mixing it with App Router adds complexity with zero benefit for a greenfield project | App Router (`app/`) exclusively |
| `@supabase/auth-helpers-nextjs` | Deprecated package, superseded by `@supabase/ssr` | `@supabase/ssr` (`createBrowserClient` / `createServerClient`) |
| Contentlayer (original) | Unmaintained; ecosystem (Fumadocs) has publicly dropped support for it | Velite, or Content Collections if a heavier headless-CMS-like tool is wanted later |
| Disabling Row Level Security "for simplicity" | The Supabase anon/publishable key is always shipped to the browser in a Next.js app; a table with RLS off is world-readable/writable by anyone who opens devtools | Enable RLS, scope policies to `auth.uid()`, even for a single expected user |
| Client-side-only syntax highlighting (e.g., `react-syntax-highlighter` loaded in a Client Component for every code block) | Ships a highlighting engine + grammar bundle to the browser and re-highlights on every page load, adding JS weight to a content-heavy site that should be mostly static | `rehype-pretty-code` + Shiki at build time — code blocks arrive pre-highlighted as static HTML |
| Google Fonts `Noto_Sans_KR` as the *only* font without a system-font fallback stack | Historically flaky in dev (network fetch failures noted in community reports) and visually heavier/less native-looking for Korean UI text than Pretendard | Pretendard (self-hosted, `next/font/local`) as primary, with `Noto Sans KR`/system sans as fallback in the stack |
| CSS Modules as the primary styling strategy for this project | Would require hand-rolling a typography/prose system for lesson content from scratch, which is exactly what `@tailwindcss/typography` already solves; slower to build under a 5-week deadline | Tailwind CSS + `@tailwindcss/typography` |

## Stack Patterns by Variant

- Use plain static generation (`generateStaticParams`, no `export const revalidate`) for all lesson/module pages.
- Because: content is authored once (via MDX files in the repo) and redeployed through Vercel's normal git push — there is no scenario where lesson content changes without a redeploy, so ISR's "revalidate without redeploy" benefit doesn't apply. Static generation is simpler and faster than ISR here.
- The only genuinely dynamic per-request data is the progress-tracking state (completed lessons, computed percentages) — fetch that in a small Client Component or a Server Component that reads Supabase per-request, layered on top of the statically generated lesson content shell.
- Use Supabase **anonymous sign-in** (`supabase.auth.signInAnonymously()`) triggered once on first visit, persisted via the `@supabase/ssr` cookie-based session.
- Because: it produces a real `auth.uid()` for RLS policies with zero login friction (no email, no password, no magic-link round-trip) — matching the "1인용, 최소 마찰" constraint in PROJECT.md — while still being properly access-controlled (unlike a no-auth/public-RLS approach).
- Known tradeoff: if the browser/device storing the session is wiped, the anonymous identity (and its progress) is lost. Mitigate cheaply by calling `supabase.auth.linkIdentity()` to optionally attach a real email later, without changing the data model.
- Model the curriculum as three nested Velite collections (or one collection with a `stepId`/`moduleId`/`order` schema): Step → Module → Lesson, each lesson an `.mdx` file with frontmatter (`title`, `stepId`, `moduleId`, `order`, `estimatedMinutes`).
- Because: this maps directly onto the "섹션(모듈/Step)별 진행률" requirement in PROJECT.md — progress percentage per Step/Module is just `count(completed lessons in group) / count(lessons in group)`, computed once the Velite-generated JSON manifest is joined against the Supabase `lesson_progress` table.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|------------------|-------|
| `next@16.3.2` | `react@^19.0.0`, `react-dom@^19.0.0` | Confirmed via `next`'s published `peerDependencies` on npm — do not pin React 18. |
| `rehype-pretty-code@0.14.5` | `shiki@^1.0.0‖^2.0.0‖^3.0.0‖^4.0.0` | Confirmed via published `peerDependencies` — installing `shiki@4.x` is safe and current. |
| `@tailwindcss/postcss@4.3.3` | `tailwindcss@4.3.3` (same major/minor line) | Tailwind v4 moved the PostCSS plugin out of the `tailwindcss` package itself; install both, and drop `postcss-import`/`autoprefixer` if present from a v3 setup — v4 handles both automatically. |
| `@supabase/ssr@0.12.4` | `@supabase/supabase-js@2.x` | `@supabase/ssr` wraps `supabase-js` for cookie-aware SSR; keep `supabase-js` on the `2.x` line (currently `2.112.x`) since `@supabase/ssr`'s public API targets it. |
| `typescript@^5.6` | Next.js 16 tooling, Velite, `@supabase/ssr` type generation | Avoid `typescript@7` (the new Go/native-compiled compiler line, currently `7.0.2` on npm) until the wider ecosystem (Next.js plugin, editor tooling) confirms compatibility — too risky to adopt mid-build. |

## Sources

- npm registry (`npm view <pkg> version` / `dist-tags` / `peerDependencies`) — direct, primary-source version and compatibility check for `next`, `react`, `tailwindcss`, `@tailwindcss/postcss`, `@tailwindcss/typography`, `@supabase/supabase-js`, `@supabase/ssr`, `shiki`, `rehype-pretty-code`, `velite`, `next-mdx-remote`, `@next/mdx`, `typescript` — confidence: HIGH (queried the registry directly, no intermediary interpretation).
- Context7 `/vercel/next.js` — App Router `generateStaticParams`/ISR/`revalidate` docs, `pageExtensions` MDX config — confidence: MEDIUM.
- Context7 `/tailwindlabs/tailwindcss.com` — Tailwind v4 Next.js install guide, `@tailwindcss/postcss` setup, v3→v4 upgrade notes — confidence: MEDIUM.
- Context7 `/supabase/ssr` — `createBrowserClient`/`createServerClient`, middleware session-refresh pattern, Server Action cookie pattern — confidence: MEDIUM.
- Context7 `/supabase/auth` — anonymous sign-in (`SignupAnonymously`), magic link endpoint, anonymous-user-upgrade-on-verify behavior — confidence: MEDIUM.
- Web search: "MDX vs Contentlayer vs Velite vs Fumadocs Next.js App Router" (contentlayer.dev, fumadocs.dev, velite.js.org, dub.co/blog/content-collections) — confidence: LOW (unverified web search, single pass, not cross-checked against a second source).
- Web search: "Shiki vs rehype-pretty-code vs Prism syntax highlighting Next.js MDX" — confidence: LOW.
- Web search: "Next.js next/font Korean Pretendard Noto Sans KR" (github.com/orioncactus/pretendard, fontsource.org) — confidence: LOW.

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
