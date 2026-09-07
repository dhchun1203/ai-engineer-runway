# Phase 1: 배포된 커리큘럼 뼈대 - Research

**Researched:** 2026-08-24
**Domain:** Next.js App Router content site (MDX curriculum + static generation), Korean/iPad-first UX, Vercel CI/CD — no database layer in this phase
**Confidence:** MEDIUM-HIGH (stack versions and library APIs verified via npm registry + Context7 official docs; curriculum-derivation and content-shape findings verified directly against `.planning/curriculum.md`; deployment/UX specifics partly web-sourced, tagged accordingly)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** 사이트명은 **AI Engineer Runway** — 헤더 로고, 브라우저 탭 `<title>`, OG 태그에 사용 — Reversibility: costly
- **D-02:** 웹에 공개되는 어떤 표면에도 "KANT" 언급 금지 (HARD RULE) — 과정명은 항상 "AI Engineer 교육과정" — Reversibility: one-way
- **D-03:** 차분한 딥블루/청록 계열 베이스 — 장시간 학습에 편안한 톤, 진행률·완료 상태가 눈에 띄는 포인트 컬러
- **D-04:** Step 1/2/3에 각기 다른 상징 색(accent) 부여 — 카드·배지·진행률 바에 적용
- **D-05:** 다크모드: 시스템 설정 자동 + 수동 토글
- **D-06:** 한국어 타이포그래피: Pretendard + `word-break: keep-all` (UX-03)
- **D-07:** 커리큘럼 탐색은 대시보드 카드 → 드릴다운: 홈에 Step 카드 3장(진행률 표시 자리 포함) → Step 페이지에서 모듈 아코디언 → 레슨 목록 → 레슨 페이지
- **D-08:** 레슨 페이지 이동: 상단 브레드크럼(Step > 모듈) + 본문 끝 큰 이전/다음 레슨 버튼 (터치 타깃 44px+)
- **D-09:** 글로벌 내비 4항목: 오늘의 학습 · 커리큘럼 · 일정표 · 소개(Making-of) — Phase 1에서는 커리큘럼·소개만 활성, 오늘/일정은 자리만 잡고 "준비 중" 비활성 표시
- **D-10:** 모든 레슨은 6단 구성 표준 템플릿: ① 학습 목표 → ② 왜 배우나 → ③ 개념 설명(비유 포함) → ④ 실무 예제 → ⑤ 실무 팁 → ⑥ 핵심 정리·스스로 점검 — Reversibility: costly
- **D-11:** 파일럿 레슨 2개: Step 1 "Python 변수·자료형" + Step 2 "React 컴포넌트"
- **D-12:** 실무 예제는 복사해서 돌아가는 완결 코드 + 실행 방법 명시 — 읽기 전용 스니펫 금지
- **D-13:** 깊이 배지(심화/개요)와 예상 소요시간은 커리큘럼 매니페스트 메타데이터로 전 레슨에 확정 (CONT-04, Phase 3 일정 배분의 입력값)
- **D-14:** GitHub 저장소 **공개** — 비밀값은 env로 분리
- **D-15:** 저장소·Vercel 프로젝트명 `ai-engineer-runway` — Reversibility: costly
- **D-16:** GitHub 연동 자동 배포 — main 푸시마다 프로덕션 배포, PR 프리뷰 활성

### Claude's Discretion

- 딥블루/청록 팔레트의 구체 색값, Step별 accent 색 선정, 타이포 스케일, 카드/배지 디테일
- Velite 스키마 설계, 매니페스트 파일 구조, 라우팅 세그먼트 구성
- Making-of 페이지 레이아웃 (docs/making-of.md 내용을 렌더링, 단계별 타임라인 형태 권장)
- 레슨별 예상 소요시간 수치 산정 (커리큘럼 시간 배분 200h/336h/520h과 깊이 방침 기반)

### Deferred Ideas (OUT OF SCOPE)

- 진도 저장·진행률 실데이터 — Phase 2
- 오늘의 학습·일정표·D-day on-track 계산 — Phase 3
- 레슨 검색/필터, 레슨 노트, PWA — v2 (REQUIREMENTS.md)

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CONT-01 | Step → 모듈 → 레슨 3단 구조 탐색 (3 Steps, 19 모듈) | Curriculum Manifest Derivation section below gives the verified 19-module → 35-lesson breakdown to populate the tree; Architecture Patterns gives the Velite + static `modules.ts` structure to render it. |
| CONT-04 | Step 1·2 핵심=심화, Step 3=개요 콘텐츠, 레슨마다 깊이 배지 | Curriculum Manifest Derivation table assigns `depth` per lesson from `.planning/curriculum.md`'s own depth policy line; Code Examples show the Velite `s.enum` schema field. |
| CONT-06 | 코드 블록 복사 버튼 | Code Examples: `rehype-pretty-code` + `transformerCopyButton` (built-in, no hand-rolled clipboard code). |
| PLAT-01 | Vercel 배포, URL 접속 가능 | Environment Availability + Architecture Patterns: Vercel GitHub integration, zero-config once repo is imported. |
| PLAT-03 | Making-of 소개 페이지, 이후 갱신 구조 | Architecture Patterns: render `docs/making-of.md` via the same MDX pipeline as lessons; recommended as a Velite `page` (non-lesson) collection or a plain MDX import. |
| UX-01 | iPad Safari 최적화, 터치 타깃 44px+, 세로/가로 모드 | Common Pitfalls (Pitfall 7) + Code Examples: Tailwind spacing tokens for 44px targets, viewport meta, orientation-safe layout. |
| UX-02 | 폰·데스크톱 반응형 | Standard Stack: Tailwind v4 responsive utilities — same system covers all breakpoints, no separate library. |
| UX-03 | 한국어 타이포그래피(Pretendard, keep-all), 코드 블록 가로 스크롤 | Code Examples: `next/font/local` Pretendard setup + global `word-break: keep-all` + `pre { overflow-x: auto }` from rehype-pretty-code's own documented CSS. |

</phase_requirements>

## Summary

Phase 1 is a **content-shell + deployment** phase with **no database** — Supabase is explicitly out of scope until Phase 2 (`PLAT-02`/`TRACK-*`). The three technical pillars are: (1) a Velite-validated MDX content pipeline for the curriculum, (2) a Next.js 16 App Router static-generation shell that renders the Step → Module → Lesson tree, and (3) Vercel deployment wired to a new public GitHub repo (`ai-engineer-runway`) with automatic production + PR-preview deploys. All library choices were already locked by project-level research (`.planning/research/STACK.md`, `ARCHITECTURE.md`, `PITFALLS.md`) — this phase research narrows that to Phase-1-specific implementation detail, verifies exact API shapes via Context7, and derives the concrete curriculum manifest content the planner needs (a gap the project-level research did not fill).

The single biggest planning input this research adds beyond the existing project research: **`.planning/curriculum.md`'s own module bullet-structure decomposes into exactly 35 lessons across the 19 modules** (30 regular lessons, one per bullet-group, + 5 project-overview lessons per `CONT-05`), which matches the "35+ 레슨" figure already referenced in `D-10`. This gives the planner a verified, ready-to-use lesson list (titles + module mapping + depth) to seed the full navigable tree in Phase 1, even though only 2 of the 35 lessons (the pilots) get real MDX bodies this phase — the other 33 render as "콘텐츠 준비 중" placeholder entries.

**Primary recommendation:** Build the curriculum as two static TypeScript sources (`modules.ts` hand-authored from `curriculum.md`, `lessons` as a Velite collection validated by Zod) + MDX files only for the 2 pilot lessons; wire `next.config.ts` to run Velite via the documented top-level-await pattern (not the webpack plugin, which breaks under Turbopack); use `rehype-pretty-code`'s built-in `transformerCopyButton` for CONT-06 instead of hand-rolling clipboard logic; connect the GitHub repo to Vercel via the dashboard (not the CLI, which isn't installed locally) for zero-config `git push` → production and PR → preview deploys.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Step/Module/Lesson 트리 탐색 (CONT-01) | Frontend Server (SSG) | Browser/Client | Tree structure resolved at build time from the manifest via `generateStaticParams`; accordion open/close state is client-side interactivity only |
| 레슨 MDX 렌더링 | Frontend Server (SSG) | — | Velite compiles MDX at build time; no runtime MDX parsing |
| 코드 하이라이팅 (Shiki) | Frontend Server (build-time) | CDN/Static | Highlighting happens once during `velite build`/`next build`; ships as static HTML with no highlighter JS in the client bundle |
| 코드 복사 버튼 (CONT-06) | Browser/Client | — | `transformerCopyButton` injects a small client-side script (`navigator.clipboard.writeText`) — the only genuinely interactive DOM in a code block |
| 깊이 배지 · 예상 소요시간 (CONT-04, D-13) | Frontend Server (build-time) | — | Pure metadata read from the manifest, no per-request computation, no DB |
| 다크모드 토글 (D-05) | Browser/Client | — | `localStorage` + `matchMedia` + a `.dark` class on `<html>`; must run before paint (inline script) to avoid FOUC |
| 반응형/터치 타깃 (UX-01/UX-02) | Browser/Client | — | CSS breakpoints and `min-h-11`/`min-w-11` (44px) utility application; no server logic |
| Making-of 페이지 (PLAT-03) | Frontend Server (SSG) | — | Same MDX pipeline as lessons, sourced from `docs/making-of.md`; re-render on every commit that updates it |
| Vercel 배포/CI (PLAT-01, D-16) | CDN/Static (Vercel platform) | — | Build + edge hosting; GitHub integration triggers builds, no custom CI script needed |

## Standard Stack

> Supabase/`@supabase/ssr`/`@supabase/supabase-js` are **deliberately excluded** from this phase's stack — `PLAT-02`/`TRACK-*` (progress storage) is Phase 2 scope per CONTEXT.md `<deferred>`. Do not install Supabase packages in Phase 1.

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next` | 16.3.2 | Framework, App Router, SSG | [VERIFIED: npm registry — `npm view next version` → `16.3.2`] Already locked by project STACK.md; `peerDependencies` confirm `react: ^19.0.0`. |
| `react` / `react-dom` | 19.2.8 | UI runtime | [VERIFIED: npm registry] Required peer of `next@16`. |
| `typescript` | ^5.6 (not `typescript@7`) | Type safety | [VERIFIED: npm registry — `5.6+` current 5.x line] Avoid the `typescript@7` native-compiler line — untested against this ecosystem's tooling. |
| `tailwindcss` + `@tailwindcss/postcss` | 4.3.3 | Styling | [VERIFIED: npm registry, both `4.3.3`] Same major/minor required — v4 moved the PostCSS plugin to a separate package. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `velite` | 0.4.0 | MDX/frontmatter validation + typed JSON build output | [VERIFIED: npm registry `0.4.0`; confirmed via Context7 `/zce/velite` docs this session] Use for the `lessons` collection — Zod-validated frontmatter catches missing `estimatedMinutes`/`depth` at build time. |
| `rehype-pretty-code` | 0.14.5 | Syntax highlighting + built-in copy button | [VERIFIED: npm registry `0.14.5`; peer `shiki: ^1‖^2‖^3‖^4` confirmed via `npm view rehype-pretty-code peerDependencies`] Ships `transformerCopyButton` — covers CONT-06 with zero hand-rolled clipboard code. |
| `shiki` | 4.4.3 | Syntax highlighter engine | [VERIFIED: npm registry `4.4.3`, satisfies `rehype-pretty-code`'s peer range] |
| `@tailwindcss/typography` | 0.5.20 | `prose` classes for lesson body text | [VERIFIED: npm registry] Apply to the MDX content wrapper only — do not hand-style headings/paragraphs. |
| Pretendard (self-hosted `.woff2`, via `next/font/local`) | latest variable build | Korean UI/body font | [CITED: github.com/orioncactus/pretendard] Not an npm package — vendor the variable-font `.woff2` into `public/fonts/`. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Velite | `next-mdx-remote` + `gray-matter` | Lighter but loses compile-time schema validation — riskier for a manifest with 35 lessons that must all have `depth`/`estimatedMinutes` set correctly (D-13). |
| `rehype-pretty-code`'s `transformerCopyButton` | Hand-rolled `<CopyButton>` client component reading `pre.textContent` | Rejected — reinvents what the library already ships; violates Don't Hand-Roll below. |
| Vercel dashboard Git integration | `vercel` CLI + `vercel --prod` | CLI not installed locally ([VERIFIED: `command -v vercel` → not found, this session]); dashboard import is genuinely zero-config and satisfies D-16 (auto deploy + PR preview) without any extra tooling. |

**Installation:**
```bash
npx create-next-app@latest --typescript --app --tailwind --eslint
npm install velite rehype-pretty-code shiki
npm install -D @tailwindcss/typography
# no Supabase packages this phase
```

**Version verification:** confirmed 2026-08-24 via `npm view <pkg> version` for all rows above — matches `.planning/research/STACK.md` exactly (that file was researched the same day), so no drift.

**Node/tooling requirement:** [VERIFIED: `npm view next engines` → `{ node: '>=20.9.0' }`] Local environment has Node `v24.13.0` ([VERIFIED: `node --version`, this session]) — satisfies the requirement.

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|--------------|---------|-------------|
| `next` | npm | package name registered 2011-07-11 (first version `0.1.0`) [VERIFIED: `npm view next time --json`] | 53.1M/wk | github.com/vercel/next.js | SUS (heuristic: "too-new") | **False-positive** — the `package-legitimacy check` heuristic flags recency of the *latest published version* (2026-08-21), not package age; 53M weekly downloads + a 15-year-old registry entry + official Vercel org repo make this unambiguously legitimate. Approved, but planner should still add one `checkpoint:human-verify` before `npm install next` per protocol. |
| `react` | npm | long-established | 170.2M/wk | github.com/react/react | OK | Approved |
| `react-dom` | npm | long-established | 159.7M/wk | github.com/react/react | OK | Approved |
| `typescript` | npm | long-established | 269.3M/wk | github.com/microsoft/TypeScript | OK | Approved |
| `velite` | npm | established | 74.7k/wk | github.com/zce/velite | OK | Approved |
| `rehype-pretty-code` | npm | established (664k/wk is not a "new" package's download count) | 664.3k/wk | github.com/rehype-pretty/rehype-pretty-code | SUS ("too-new") | **False-positive**, same latest-version-recency cause as `next`. Approved; add `checkpoint:human-verify` before install. |
| `shiki` | npm | established | 20.9M/wk | github.com/shikijs/shiki | SUS ("too-new") | **False-positive**, same cause. Approved; add `checkpoint:human-verify` before install. |
| `tailwindcss` | npm | established | 125.2M/wk | github.com/tailwindlabs/tailwindcss | OK | Approved |
| `@tailwindcss/postcss` | npm | established | 33.8M/wk | github.com/tailwindlabs/tailwindcss | OK | Approved |
| `@tailwindcss/typography` | npm | established | 22.7M/wk | github.com/tailwindlabs/tailwindcss-typography | OK | Approved |

No `postinstall` scripts detected on any of the above ([VERIFIED: `package-legitimacy check` output, `"postinstall": null` for every package]).

**Packages removed due to [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** `next`, `rehype-pretty-code`, `shiki` — all three are heuristic false-positives (the checker's "too-new" signal reads the latest version's *publish date*, not the package's registry age; each has an official, enormously-downloaded, long-history GitHub org repo). Per protocol the planner must still gate each `npm install` behind a `checkpoint:human-verify` task, even though this research is confident they are safe.

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                 Content Layer (git-tracked, build-time)          │
├─────────────────────────────────────────────────────────────────┤
│ content/modules.ts        (19 modules, hand-authored from        │
│                             curriculum.md: stepId, moduleId,      │
│                             title, order, accent)                │
│ content/lessons/**/*.mdx  (35 lesson frontmatter entries via      │
│                             Velite; only 2 pilot files have a     │
│                             real MDX body, 33 are metadata-only   │
│                             stub entries rendered as "준비 중")   │
│ docs/making-of.md         (Making-of source, rendered via the     │
│                             same MDX pipeline)                    │
└──────────────────────────┬────────────────────────────────────────┘
                            │ velite build (top-level await in
                            │ next.config.ts, runs before dev/build)
┌──────────────────────────▼────────────────────────────────────────┐
│                Next.js 16 App Router (static generation)           │
├──────────────────────────────────────────────────────────────────┤
│  /                     Home: 3 Step cards (progress slot, 0%)     │
│  /step/[stepId]        Module accordion → lesson list             │
│  /lesson/[lessonId]    Pilot: full MDX render + copy buttons       │
│                         Non-pilot: "콘텐츠 준비 중" placeholder    │
│  /about (Making-of)    Renders docs/making-of.md as MDX, timeline │
│  layout.tsx            Global nav (4 items, 2 active), dark-mode  │
│                         inline script, Pretendard font              │
└──────────────────────────┬────────────────────────────────────────┘
                            │ git push → GitHub → Vercel build hook
┌──────────────────────────▼────────────────────────────────────────┐
│                Vercel (GitHub integration, D-16)                   │
├──────────────────────────────────────────────────────────────────┤
│  push to main   → production deploy → ai-engineer-runway.vercel.app│
│  PR opened      → preview deploy → unique URL + PR comment         │
└─────────────────────────────────────────────────────────────────┘
```

### Curriculum Manifest — Full 35-Lesson Derivation

[VERIFIED: `.planning/curriculum.md`, read this session] `curriculum.md` states the depth policy explicitly: *"콘텐츠 깊이 방침: Step 1·Step 2 핵심 = 심화 / Step 3 = 개념·용어 중심 훑기."* (line 5). Every one of the 19 modules lists its content as 2–3 bullet sub-topics, e.g. module 1-3 reads *"변수, 자료형, 조건문, 반복문"* / *"함수, 예외 처리, 파일 입출력"* (2 bullets), and module 3-4 reads *"여러 AI가 함께 일하는 구조 설계"* / *"Webhook, 스케줄, HITL 설계"* / *"n8n, LangGraph 기반 자동화 실습"* (3 bullets).

**Recommended derivation rule** (Claude's Discretion per CONTEXT.md — this is the recommendation, not yet a locked decision): treat each bullet sub-topic in a **non-project module** as one lesson; collapse each of the **5 project modules** (`2-4`, `2-6`, `3-2`, `3-5`, `3-7` — tagged `[Project N]` in `curriculum.md`) into a **single overview/prep lesson**, per `CONT-05`'s "실습 프로젝트 5종은 개요·사전 준비 가이드 레슨으로 제공된다 (재현 아님)".

Counting under this rule against the verbatim `curriculum.md` bullets:
- Step 1 (5 non-project modules, 2 bullets each) → 10 lessons, depth = 심화
- Step 2 non-project modules (`2-1,2-2,2-3,2-5,2-7`, 2 bullets each) → 10 lessons, depth = 심화
- Step 2 project modules (`2-4,2-6`) → 2 overview lessons, depth = 심화
- Step 3 non-project modules (`3-1,3-3` 2 bullets each; `3-4,3-6` 3 bullets each) → 10 lessons, depth = 개요
- Step 3 project modules (`3-2,3-5,3-7`) → 3 overview lessons, depth = 개요

**Total = 10 + 10 + 2 + 10 + 3 = 35 lessons.** This exactly matches the "35+ 레슨" figure already referenced in `D-10`'s rationale, confirming the derivation rule is consistent with the decision already locked by the user. The 2 pilot lessons (D-11: Step 1 "Python 변수·자료형" = module `1-3` bullet 1; Step 2 "React 컴포넌트" = module `2-3` bullet 2) are two specific rows in this 35-row table.

**Planner action implied:** Phase 1 must populate all 35 rows in the manifest (title, moduleId, depth, estimatedMinutes) so `CONT-01`'s "전체 레슨 목록" and `D-13`'s "전 레슨에 확정" metadata are satisfied — but only write MDX bodies for the 2 pilot rows. The other 33 lesson pages render a "콘텐츠 준비 중" state (still a real route, still counted in progress math for Phase 2/3) rather than 404ing.

### Recommended Project Structure
```
src/
├── content/
│   ├── modules.ts            # 19 modules, hand-authored from curriculum.md
│   ├── curriculum-helpers.ts # lessonId -> module/step lookups, next/prev
│   └── lessons/
│       ├── step-1/1-3-variables-and-types.mdx    # pilot (real content)
│       ├── step-2/2-3-react-components.mdx        # pilot (real content)
│       └── ...                                    # 33 metadata-only stubs
├── velite.config.ts            # lessons collection schema (Zod via `s`)
├── app/
│   ├── layout.tsx               # nav, dark-mode inline script, Pretendard
│   ├── page.tsx                 # dashboard: 3 Step cards
│   ├── step/[stepId]/page.tsx   # module accordion + lesson list
│   ├── lesson/[lessonId]/page.tsx  # MDX render or placeholder
│   ├── about/page.tsx           # Making-of, renders docs/making-of.md
│   └── globals.css              # Tailwind import, dark-variant, keep-all
├── components/
│   ├── mdx-content.tsx          # Velite MDXContent runtime component
│   ├── step-card.tsx
│   ├── depth-badge.tsx
│   └── theme-toggle.tsx
└── lib/
    └── fonts.ts                  # next/font/local Pretendard setup
```

### Pattern 1: Velite + Turbopack-safe config integration

**What:** Run Velite's `build()` from a top-level-await guard in `next.config.ts`, not the `VeliteWebpackPlugin`.
**When to use:** Always for this project — Next.js 16 defaults dev to Turbopack, and [VERIFIED: Context7 `/zce/velite` docs, this session] Velite's own docs recommend the top-level-await approach specifically *"when Turbopack is enabled, as the `VeliteWebpackPlugin` may not function correctly."*
**Example:**
```typescript
// Source: Context7 /zce/velite (docs/guide/with-nextjs.md)
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

### Pattern 2: Velite lesson schema with depth badge + estimated minutes

**What:** `s.enum` for the `depth` badge and `s.number` for `estimatedMinutes`, both required fields — matches `D-13`.
**Example:**
```typescript
// velite.config.ts — Source: Context7 /zce/velite (docs/guide/define-collections.md), adapted
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

### Pattern 3: MDX runtime rendering (Velite output → React)

**What:** Velite compiles MDX to a function-body string at build time; a small runtime component turns it back into a React component.
**Example:**
```tsx
// Source: Context7 /zce/velite (docs/guide/using-mdx.md)
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

### Pattern 4: Syntax highlighting + built-in copy button (CONT-06)

**What:** `rehype-pretty-code`'s `transformerCopyButton` — do not hand-roll a `<CopyButton>` component.
**Example:**
```typescript
// Source: Context7 /rehype-pretty/rehype-pretty-code (llms.txt), this session
import rehypePrettyCode from 'rehype-pretty-code'
import { transformerCopyButton } from '@rehype-pretty/transformers'

const options = {
  theme: { dark: 'github-dark-dimmed', light: 'github-light' },
  transformers: [
    transformerCopyButton({ visibility: 'always', feedbackDuration: 3_000 })
  ]
}
// output: <figure><pre><code data-theme="...">...<button class="rehype-pretty-copy">…</button></code></pre></figure>
```
```css
/* Source: Context7 rehype-pretty-code docs — required for CONT-06 + UX-03 (가로 스크롤) */
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
**Note:** `transformerCopyButton` needs `visibility: 'always'` (not `'hover'`) for this project — iPad Safari has no hover state, so a hover-only copy button would be unreachable on the primary device (UX-01).

### Pattern 5: Tailwind v4 manual dark mode (D-05)

**What:** Override the `dark` variant to a class selector, toggle via `localStorage` + `matchMedia`, run inline before paint to avoid flash-of-wrong-theme.
**Example:**
```css
/* Source: Context7 /websites/tailwindcss (docs/dark-mode.mdx), this session */
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));
```
```html
<!-- Source: same doc — place inline in <head>, before hydration -->
<script>
  document.documentElement.classList.toggle(
    "dark",
    localStorage.theme === "dark" ||
      (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)
  );
</script>
```

### Pattern 6: Pretendard via next/font/local (UX-03, Pitfall 7)

**What:** Self-hosted variable font, single weight-range import, not the full static weight set.
**Example:**
```typescript
// Source: Context7 /vercel/next.js (docs/app/api-reference/components/font.mdx), this session
import localFont from 'next/font/local'

const pretendard = localFont({
  src: '../public/fonts/PretendardVariable.woff2',
  variable: '--font-pretendard',
  weight: '45 920', // variable font axis range, not 9 discrete files
  display: 'swap'
})
```
```css
/* global keep-all rule — UX-03 */
body { word-break: keep-all; overflow-wrap: break-word; }
code, pre { font-family: var(--font-mono, ui-monospace, monospace); } /* don't inherit Korean body font into code */
```

### Anti-Patterns to Avoid

- **Hand-rolling MDX loading with `next-mdx-remote` + custom frontmatter parsing:** Velite already does schema-validated frontmatter + compiled MDX in one step — building a parallel loader duplicates work and loses the compile-time `depth`/`estimatedMinutes` validation that `D-13` depends on.
- **Using `VeliteWebpackPlugin` in `next.config.ts`:** Breaks silently under Turbopack (Next.js 16's default dev bundler) — use the top-level-await pattern (Pattern 1) instead.
- **`visibility: 'hover'` on the copy button:** No hover state on iPad Safari — the primary device (UX-01) would never see the button. Use `'always'`.
- **404 for the 33 non-pilot lesson slugs:** Breaks CONT-01's "전체 레슨 목록…탐색" requirement — every lesson in the 35-row manifest needs a real route, even if it renders a placeholder body.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| Code block copy-to-clipboard | Custom `<CopyButton>` reading `pre.textContent`, managing its own "✓ copied" state | `rehype-pretty-code`'s `transformerCopyButton` | Already handles clipboard API, per-block wiring, and feedback timing — CONT-06 is fully covered by config, zero component code. |
| MDX frontmatter parsing/validation | `gray-matter` + manual field checks | Velite `s.object()` schema | Catches a missing `estimatedMinutes` or wrong `depth` enum value at `next build` time, not at runtime on a live lesson page — critical when authoring 35 manifest rows under deadline pressure. |
| Syntax highlighting | `react-syntax-highlighter` (client-side) | `rehype-pretty-code` + Shiki (build-time) | Ships zero highlighter JS to the browser; matters for iPad load performance (UX-01/UX-02). |
| Korean font subsetting/self-hosting | Manual `@font-face` + custom subsetting pipeline | `next/font/local` with the Pretendard variable-font build | `next/font` handles self-hosting, preloading, and `font-display` automatically; only decision left is which weight range to load. |
| Dark mode state management | Custom React context + `useEffect` theme provider | Tailwind v4 `@custom-variant dark` + a single inline `<script>` + CSS class | Avoids a hydration-mismatch flash (FOUC) that a React-only theme provider commonly introduces on first paint. |
| CI/CD pipeline for deploys | Custom GitHub Actions workflow calling `vercel deploy` | Vercel's native GitHub integration (dashboard import) | [CITED: vercel.com/docs/git] Zero-config: push→production, PR→preview, comment posting, cleanup on branch delete — a hand-rolled Action would reimplement all of this for no benefit. |

**Key insight:** Every "hand-roll" temptation in this phase (copy button, frontmatter parsing, highlighting, font loading, dark mode, CI) already has a library-level solution that project-level PITFALLS.md independently flagged as a deadline risk if custom-built (Pitfall 4: "MDX pipeline rabbit hole"). This phase research confirms the same conclusion at the implementation-API level, not just the architecture level.

## Common Pitfalls

### Pitfall 1: Velite + Turbopack silent breakage
**What goes wrong:** `VeliteWebpackPlugin` is wired into `next.config.ts` (the pattern shown in older Velite tutorials); Next.js 16 dev defaults to Turbopack, so the plugin either errors or silently never runs, and `.velite/` output goes stale.
**Why it happens:** Most Velite+Next.js tutorials predate Next.js's Turbopack-by-default dev mode.
**How to avoid:** Use the top-level-await pattern in `next.config.ts` (Pattern 1 above) — this is Velite's own currently-documented recommendation for Turbopack projects [VERIFIED: Context7 `/zce/velite`, this session].
**Warning signs:** Editing a lesson `.mdx` file doesn't show up on `next dev` refresh; `.velite/` directory timestamp doesn't update after a content edit.

### Pitfall 2: Incomplete curriculum manifest breaks CONT-01's "전체" requirement
**What goes wrong:** Only the 2 pilot lessons get manifest rows (since only they have real content), so `/step/[stepId]` pages show 2 lessons total instead of the full 35-lesson structure — technically passes "탐색할 수 있다" for the 2 pilots but fails "전체 레슨 목록을 탐색" for Success Criterion #1.
**How to avoid:** Populate all 35 manifest rows (see Curriculum Manifest derivation above) with `hasContent: false` for the 33 non-pilot rows; render those lesson pages as a real, linkable "콘텐츠 준비 중" state, not a 404 or missing route.
**Warning signs:** `generateStaticParams()` returns only 2 paths instead of 35.

### Pitfall 3: Copy button unreachable on iPad (hover-only visibility)
**What goes wrong:** `transformerCopyButton({ visibility: 'hover' })` (the library's own example default) never appears on a touch device with no `:hover` state — CONT-06 silently fails on the project's primary device.
**How to avoid:** Set `visibility: 'always'` (Pattern 4). Verify by testing on an actual iPad Safari session, not just desktop Chrome dev tools' mobile emulation (emulation still fires hover events on tap in some configurations, masking the bug).
**Warning signs:** Copy button visible in desktop browser testing but reports of "no copy button" from real iPad use.

### Pitfall 4: Korean typography breaks on real content, not placeholder text
**What goes wrong:** [Project-level PITFALLS.md, Pitfall 7] `word-break: keep-all` and the code/body font pairing look fine with short placeholder strings but visibly break (mid-syllable wraps, tofu glyphs, font mismatch) only once a full-length Korean lesson with inline English/code terms is pasted in.
**How to avoid:** Test UX-03 with the actual pilot lesson content (D-11's "Python 변수·자료형" full body), not lorem ipsum, before considering the layout done.
**Warning signs:** Mobile view shows a Korean word split mid-character; code terms inline with Korean prose look visually mismatched.

### Pitfall 5: Vercel project name / GitHub repo name mismatch with D-15
**What goes wrong:** Creating the Vercel project via "Import" before the GitHub repo exists (or naming it something Vercel auto-suggests, e.g. `aiengineercourse`) locks in a URL slug that isn't `ai-engineer-runway`, which `D-15` marks costly-to-change (link/OG cache impact).
**How to avoid:** Create the GitHub repo named `ai-engineer-runway` first ([VERIFIED: `gh` CLI is available locally, `gh version 2.97.0`]), push the initial scaffold, then import into Vercel — the project name field is editable at import time; set it explicitly to `ai-engineer-runway` rather than accepting Vercel's auto-generated suggestion.
**Warning signs:** Production URL is `aiengineercourse.vercel.app` or similar instead of `ai-engineer-runway.vercel.app`.

### Pitfall 6: Platform polish crowding out this phase's actual scope
**What goes wrong:** [Project-level PITFALLS.md, Pitfall 1 — directly applicable here as the first executed phase] Because Phase 1 is genuinely the most "fun" engineering phase (routing, styling, dark mode, accent colors), it's tempting to over-invest in visual polish beyond what D-03/D-04's "차분한" baseline needs, eating into the 4 weeks reserved for content-authoring phases (4–5).
**How to avoid:** Treat D-03/D-04's exact color values and D-05's toggle UI as "good enough on first pass" — `ui_phase: true` in config.json means a dedicated UI-SPEC pass is available later if visual polish is genuinely needed; Phase 1's job is a working, navigable, correctly-structured shell, not a finished visual identity.
**Warning signs:** Time spent tuning exact hex values or animating the module accordion before all 35 manifest rows exist and both pilot lessons render correctly.

## Code Examples

Verified patterns from official sources (see full versions in Architecture Patterns above):
- Velite + Turbopack-safe `next.config.ts` — Pattern 1
- Lesson Zod schema with `depth` enum + `estimatedMinutes` — Pattern 2
- MDX runtime render component — Pattern 3
- `rehype-pretty-code` + `transformerCopyButton` config — Pattern 4
- Tailwind v4 manual dark mode + FOUC-safe inline toggle script — Pattern 5
- `next/font/local` Pretendard variable-font setup — Pattern 6

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|----------------|
| A1 | Exact deep-blue/teal hex values, per-Step accent colors, and typography scale (D-03/D-04 discretion) — no specific values were verified against any design-system source this session | Architectural discretion, not yet in RESEARCH.md as concrete values | Low — cosmetic, easily adjusted later; `ui_phase: true` provides a dedicated pass if needed |
| A2 | The 35-lesson derivation rule (1 lesson per non-project bullet, 1 overview lesson per project module) is a **recommendation**, not a locked decision — CONTEXT.md marks manifest structure as Claude's Discretion | Curriculum Manifest Derivation | Medium — if the user actually wants each project module's bullets split into separate lessons instead of one overview lesson, the manifest row count and lesson IDs would change, affecting Phase 3's schedule derivation which consumes this list |
| A3 | Vercel's GitHub integration behavior (push→prod, PR→preview, auto-cleanup) is sourced from WebSearch, not Vercel's own docs directly fetched this session | Don't Hand-Roll / Architecture Patterns | Low — this is extremely well-established, default Vercel behavior; low likelihood of being wrong, but not independently verified via `vercel.com/docs` this session |
| A4 | Pretendard's exact npm-absent vendoring path (`github.com/orioncactus/pretendard` release asset) was not re-verified this session — carried over from project-level STACK.md | Standard Stack | Low — well-known repo, unlikely to have moved; verify the release asset URL still resolves before the font-loading task executes |

## Open Questions

1. **Should the 33 non-pilot lessons get a manifest row now, or does Phase 1 only need the 2 pilots + 19 modules?**
   - What we know: Success Criterion #1 says "전체 레슨 목록을 탐색" (explore the full lesson list); D-13 says depth badge + estimated minutes are "전 레슨에 확정" (fixed for all lessons) in Phase 1; Phase 3's schedule derivation needs every lesson's `estimatedMinutes` as input.
   - What's unclear: Whether "전 레슨" in D-13 was written with the derived 35-lesson granularity in mind, or assumes something coarser (e.g., per-module only, deferring the sub-lesson split to Phase 4/5's content-authoring phases).
   - Recommendation: Plan for the full 35-row manifest in Phase 1 (Curriculum Manifest Derivation section above) — it's a low-cost metadata task (titles + numbers, no prose) and de-risks Phase 3 by having the schedule-input data ready early, matching the project's own "deploy/scaffold early" risk-mitigation pattern already used for Vercel (D-16, Pitfall 8 in project PITFALLS.md).

2. **Exact `estimatedMinutes` values per lesson**
   - What we know: Total curriculum hours are 200h/336h/520h across Steps 1/2/3 (`.planning/curriculum.md` line 1); CONTEXT.md marks per-lesson time estimation as Claude's Discretion.
   - What's unclear: No stated per-lesson-vs-per-module time ratio; the 1,056h total is the *actual course* duration, not the *sight-reading pre-study* duration — this site's lessons are meant to be read once in ~5 weeks, not to replicate the full course hours.
   - Recommendation: Derive pre-study `estimatedMinutes` independently from the course-hour figures (e.g., a flat 심화=90min/개요=30min baseline, adjusted per lesson by the content author during Phase 4/5), not a proportional split of 200h/336h/520h — flag this explicitly for the planner to confirm with the user rather than silently deriving from course hours.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|--------------|-----------|---------|----------|
| Node.js | Next.js 16 build/dev | Yes | v24.13.0 [VERIFIED: `node --version`] | — (exceeds `next`'s `>=20.9.0` requirement) |
| npm | Package install | Yes | 11.6.2 [VERIFIED: `npm --version`] | — |
| git | Version control, GitHub push | Yes | 2.52.0 [VERIFIED: `git --version`] | — |
| GitHub CLI (`gh`) | Creating the public `ai-engineer-runway` repo (D-15) | Yes | 2.97.0 [VERIFIED: `gh --version`] | — |
| Vercel CLI | Local env var pull / preview deploys | No [VERIFIED: `command -v vercel` → not found] | — | Use the Vercel dashboard for project import and env var management instead of the CLI — fully viable per D-16 (dashboard-based GitHub integration is the documented zero-config path anyway) |
| Git remote | Pushing to GitHub | Not yet configured [VERIFIED: `git remote -v` → empty output] | — | Planner must include a task to create the GitHub repo (`gh repo create ai-engineer-runway --public`) and set the remote before any Vercel import step |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** Vercel CLI — use the dashboard import flow instead (this is in fact the recommended path per Don't Hand-Roll, not a degraded fallback).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — greenfield repo, no `package.json` exists yet |
| Config file | none — see Wave 0 |
| Quick run command | `npm run build` (Next.js build + Velite schema validation acts as the fastest automated correctness check for this content-only phase) |
| Full suite command | `npm run build && npx playwright test` (if Playwright is added in Wave 0 for the iPad-viewport UAT checks) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|--------------------|-------------|
| CONT-01 | 3 Step/19 모듈/전체 레슨 탐색 가능 | build+smoke | `npm run build` (fails if `generateStaticParams` errors or a manifest row is malformed) | ❌ Wave 0 |
| CONT-04 | 깊이 배지 표시, Step3=개요 | unit (schema) | Velite build fails on missing/invalid `depth` enum value — enforced by `s.enum(['심화','개요'])` | ❌ Wave 0 (schema itself is the test) |
| CONT-06 | 코드 블록 복사 버튼 존재 | manual/UAT | Visual check: `<button class="rehype-pretty-copy">` present in rendered HTML on both pilot lessons | ❌ Wave 0 |
| UX-01 | iPad Safari 44px 터치 타깃, 세로/가로 | manual-only, justified | Real-device or Safari Responsive Design Mode check — no automated a11y-target-size checker configured yet | N/A — manual UAT is appropriate here per project's "1인용, 짧은 기간" scale |
| UX-03 | keep-all 줄바꿈, 가로 스크롤 코드 블록 | manual-only, justified | Visual check with real pilot lesson Korean text (Pitfall 4) | N/A |

### Sampling Rate
- **Per task commit:** `npm run build` (catches Velite schema errors + Next.js type errors early — cheap and fast for a static-content phase)
- **Per wave merge:** `npm run build` + manual click-through of both pilot lessons on an iPad (or Safari responsive mode) in light/dark, portrait/landscape
- **Phase gate:** Live Vercel URL confirmed working (Pitfall 8 from project PITFALLS.md: deploy-early is itself a phase acceptance criterion, not just a nice-to-have)

### Wave 0 Gaps
- [ ] `package.json` + Next.js scaffold — none exists yet (fully greenfield)
- [ ] No automated visual/responsive test tooling configured — acceptable given `human_verify_mode: "end-of-phase"` in config.json; manual UAT script should explicitly cover iPad portrait+landscape, light+dark, and both pilot lessons' code blocks

## Security Domain

> `security_enforcement: true`, `security_asvs_level: 1` in config.json.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|----------------|---------|--------------------|
| V2 Authentication | No | No auth in this phase — Phase 1 has no user accounts, no Supabase (deferred to Phase 2) |
| V3 Session Management | No | No sessions in this phase |
| V4 Access Control | No | Site is fully public read-only content this phase; D-14 explicitly makes the repo public too |
| V5 Input Validation | Partial — build-time only | Velite's Zod schema (`s.object()`) validates all lesson frontmatter at build time; there is no runtime user input in this phase (no forms, no query params driving data fetches beyond static route params resolved via `generateStaticParams`) |
| V6 Cryptography | No | No secrets/crypto operations in this phase |
| V14 Configuration | Yes | Environment variables (`NEXT_PUBLIC_*` if any are introduced) must never carry secrets in this phase — there should be none needed at all, since there's no Supabase/API key usage yet |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|-----------------------|
| Public repo (D-14) accidentally exposing a future secret in git history | Information Disclosure | No secrets exist in Phase 1's scope (no DB, no API keys) — the risk surfaces starting Phase 2 (Supabase keys); ensure `.env.local` is in `.gitignore` from the very first commit even though nothing sensitive exists yet, so the habit is established before Phase 2 introduces real secrets |
| Untrusted MDX content executing arbitrary code at build time | Tampering | Not applicable — all MDX content is authored by the single project owner and lives in the same repo; no user-submitted or remotely-fetched MDX source in this phase (Anti-Pattern warning already present in project ARCHITECTURE.md against DB/CMS-sourced content) |
| Vercel preview URLs (D-16) being indexable/crawlable, leaking pre-launch content or the making-of process page to search engines | Information Disclosure | Low severity for this project (content isn't confidential, D-14 already makes the repo/code public) — optional: add `noindex` meta tag to preview deployments if desired, not a blocking requirement for this phase |

## Sources

### Primary (HIGH confidence)
- npm registry (`npm view <pkg> version` / `peerDependencies` / `engines` / `time`) — direct version, compatibility, and package-age verification for `next`, `react`, `react-dom`, `typescript`, `velite`, `rehype-pretty-code`, `shiki`, `tailwindcss`, `@tailwindcss/postcss`, `@tailwindcss/typography` — all confirmed this session.
- `gsd-tools query package-legitimacy check --ecosystem npm` — verdicts for all 11 candidate packages, this session.
- `.planning/curriculum.md` — read directly this session; source of the verified 35-lesson derivation.

### Secondary (MEDIUM confidence)
- Context7 `/zce/velite` — Next.js/Turbopack integration pattern, collection schema syntax, MDX compile+render pattern — fetched this session.
- Context7 `/rehype-pretty/rehype-pretty-code` — `transformerCopyButton` API, CSS data-attribute contract, dual-theme setup — fetched this session.
- Context7 `/websites/tailwindcss` — v4 manual dark mode (`@custom-variant`), toggle script pattern — fetched this session.
- Context7 `/vercel/next.js` — `next/font/local` API (variable font, weight range, multi-file src) — fetched this session.
- `.planning/research/STACK.md`, `ARCHITECTURE.md`, `PITFALLS.md` — project-level research from 2026-08-24 (same day), reused and narrowed for Phase 1 scope.

### Tertiary (LOW confidence)
- WebSearch: "Vercel GitHub integration automatic production deploy PR preview deployments" — corroborates well-known, default Vercel behavior; not independently re-verified against `vercel.com/docs/git` directly this session.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every version verified directly against the npm registry this session, matching already-locked project research
- Architecture: HIGH — Velite/rehype-pretty-code/Tailwind/next-font APIs verified via Context7 this session; curriculum derivation verified directly against `.planning/curriculum.md`
- Pitfalls: MEDIUM-HIGH — Turbopack/Velite and copy-button-visibility pitfalls are directly sourced from official docs this session; Korean typography and deployment-drift pitfalls are carried over from project-level PITFALLS.md (already MEDIUM confidence there)

**Research date:** 2026-08-24
**Valid until:** 2026-09-23 (30 days — stable stack, but re-verify `next`/`shiki`/`rehype-pretty-code` versions if planning is delayed, given their frequent release cadence noted in the legitimacy audit)
