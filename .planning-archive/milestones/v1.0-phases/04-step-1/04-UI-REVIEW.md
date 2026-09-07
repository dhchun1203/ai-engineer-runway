# Phase 04 (step-1) — UI Review

**Audited:** 2026-08-25
**Baseline:** Abstract 6-pillar standards (no UI-SPEC.md for content phase)
**Audit method:** Two passes — (1) code-only subagent audit, (2) live browser audit via Playwright against `next dev` at iPad viewports (768×1024 portrait, 1024×768 landscape), light + dark
**Screenshots:** `.planning/ui-reviews/04-ui-review/`

> **Why this file was revised.** The first pass was code-only (no dev server) and scored 23/24. The live pass contradicted several of its conclusions — most importantly, it found that the code-block copy button is non-functional on every lesson page. Grep-based verification of the type scale also missed sizes and weights injected by `@tailwindcss/typography` at runtime. Scores below reflect the live evidence.

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 3/4 | Korean-first, KANT-clean across all 10 lessons (verified in rendered HTML); but `심화` badge is on 100% of Step-1 lessons, so it carries no information |
| 2. Visuals | 3/4 | Clear hierarchy; but literal backtick glyphs around all 58 inline-code spans, doubled arrow+chevron in pager, and ~55% empty canvas on the landing page |
| 3. Color | 4/4 | 18 tokens, zero hardcoded colors; measured contrast ≥9.85:1 on every sampled pair in **both** themes |
| 4. Typography | 2/4 | Runtime shows **6** sizes and **3** weights, not the 4×2 the code claims — `prose` defaults override the design system, incl. 12.25px text |
| 5. Spacing | 4/4 | Zero horizontal overflow at 768px and 1024px; `min-height` resolves to 52px; copy buttons measure exactly 44×44 |
| 6. Experience Design | 1/4 | **Copy button is dead on every code block** (9 React errors/page); no `<main>` landmark; locked state offers no completion or unlock affordance at all |

**Overall: 17/24**

---

## Top 3 Priority Fixes

1. **[Critical] The code-block copy button does nothing, on every lesson page.**
   `transformerCopyButton` (`velite.config.ts:8`) emits an inline `onclick="…"` **string**. Velite's compiled MDX is rendered as React elements, and React refuses to attach string event handlers — it logs `Expected onClick listener to be a function, instead got a value of string type` once per code block (9 errors on `1-4-sql-queries-and-joins`) and installs its internal `noop`. Measured directly: clicking the button writes nothing to the clipboard and never toggles the `rehype-pretty-copy` "copied" class.
   **Fix:** replace the transformer with a real client component (`"use client"` wrapper reading `navigator.clipboard.writeText` from the `data` attribute), or render that subtree via `dangerouslySetInnerHTML` so the browser — not React — binds the handler. Then re-check that the console is clean.
   **Why it matters:** every lesson is built around "copy this into the Supabase SQL editor / your terminal." On iPad, manually selecting multi-line code in a scrollable `<pre>` is exactly the friction the button existed to remove.

2. **[High] The `심화` badge is meaningless in Step 1 and semantically wrong.**
   All 10 Step-1 lessons carry `depth: "심화"` in frontmatter (`grep -h '^depth:' src/content/lessons/step-1/*.mdx` → `10 depth: "심화"`). Steps 2–3 are mixed (13 `개요` / 22 `심화`), so the badge does discriminate elsewhere — Step 1 is the outlier. A badge identical on 100% of rows on `/step/1`, the `오늘의 학습` card, and the schedule table is pure visual noise. It is also plainly wrong on `과정 운영 방식과 학습 준비` (course orientation), which the landing page currently labels 심화.
   **Fix:** re-classify the Step-1 lessons — orientation/environment-setup/DB-basics read as `개요`; or drop the badge for Step 1 entirely.

3. **[High] `@tailwindcss/typography` silently breaks the 4-size / 2-weight design system.**
   Measured on a rendered lesson: sizes `{28, 24, 20, 16, 14, 12.25}px` and weights `{400, 600, 700}`. The first pass verified this by grepping `.tsx` — which cannot see what `prose` injects. Two concrete defects: prose `h2` renders at **24px/700**, not the intended 20px/600; and inline `<code>` inside a `<td>` compounds relative `em` sizing down to **12.25px** (8 occurrences), well under a readable floor for Hangul on an iPad.
   **Fix:** pin `prose` headings to the token scale and set `:where(code)` to an absolute size so it cannot compound inside tables.

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)

**Verified strengths (live):**
- **Brand rule holds.** All 10 Step-1 lesson routes fetched and scanned in rendered HTML: `200` + zero `kant` matches (case-insensitive). The landing page reads "AI Engineer 교육과정 사전학습 · 2026-09-30 개강". No violations anywhere.
- All UI chrome is Korean (`오늘의 학습`, `커리큘럼`, `일정표`, `소개`, `레슨 시작하기`, `정답 보기`, `이전/다음 레슨`) with technical terms left in English where that is the correct term.
- Lesson structure is consistent across all 10 files: `학습 목표 / 왜 배우나 / 개념 설명 / 실무 예제 / 실무 팁 / 핵심 정리 및 스스로 점검`.
- Empty state on an unwritten lesson is descriptive and routes the reader somewhere useful, not a bare "Coming soon".
- `정답 보기` is action-oriented, not "클릭하여 펼치기".

**Issue — badge conveys nothing (see Priority Fix 2).** `depth: "심화"` on 10/10 Step-1 lessons. On `/step/1` both visible lessons show an identical `심화` chip; on `/` the single orientation card shows `심화`.

**Issue — locked state says nothing about progress.** On a lesson page without the unlock cookie, `document.body.innerText` contains **no** match for `완료|잠금|해제|unlock`. The learner is given no words at all about the completion/progress feature. See Pillar 6.

---

### Pillar 2: Visuals (3/4)

**Verified strengths (live):**
- Hierarchy reads correctly at iPad portrait: page title dominates, breadcrumb (`Step 1 > SQL & 데이터베이스 기초`) orients without competing, badges sit as quiet metadata.
- Dark-mode code blocks render full Shiki highlighting (SQL keywords, strings, numbers all distinctly colored) — see `lesson-sql-dark-code.png`. The first pass's worry about a washed-out palette does not reproduce for SQL or Python.
- Step cards on `/curriculum` use a left accent rail per step (blue/purple/orange) — a cheap, effective identity cue.
- Active nav item is underlined in accent teal.

**Issue — literal backtick glyphs around every inline code span.** `prose code::before/after { content: "`" }` is the untouched `@tailwindcss/typography` default, and the project never overrides it. Inline code also has a fully transparent background (`rgba(0,0,0,0)`), so backticks are the *only* delimiter. 58 spans on one lesson page. This is worst in Korean prose, where the glyphs crowd Hangul:
> 조건문(\`if\`/\`elif\`/\`else\`)은 조건에 따라 다른 코드를 실행하는 갈림길이다

**Fix:** drop the `::before/::after` content and give inline code a subtle token-based background chip + horizontal padding.

**Issue — pager shows two direction glyphs per button.** Each pager link contains a Lucide chevron SVG *and* a literal arrow character in the label:
`<svg class="lucide lucide-chevron-left">…</svg>← 이전 레슨` and `다음 레슨 →<svg class="lucide lucide-chevron-right">…</svg>`.
Renders as `‹ ← 이전 레슨` / `다음 레슨 → ›`. **Fix:** keep one — drop the literal `←`/`→` from the label string.

**Issue — landing page wastes the iPad canvas.** At 768×1024 the `오늘의 학습` page ends around y≈450 with roughly 55% of the viewport empty. This is the site's most-visited screen and it currently carries one small card, no progress summary, and no orientation. `/curriculum` has the same shape (~40% empty). Worth a look in the follow-on design pass.

---

### Pillar 3: Color (4/4)

**Verified by measurement (live), both themes.** Contrast ratios computed from `getComputedStyle`, walking up to the first non-transparent background:

| Element | Light | Dark |
|---|---|---|
| body text | — | 12.72:1 |
| headings (h2) | 16.96:1 | 18.72:1 |
| inline code | 16.96:1 | 18.72:1 |
| table cell | 9.85:1 | 12.72:1 |
| badge / breadcrumb | 15.10:1 | 15.66:1 |

Every sampled pair clears WCAG AAA. Dark surface is `rgb(11,18,32)`; light is `rgb(248,250,252)`.

- 18 tokens in `@theme`; no hardcoded hex or `rgb()` outside comments.
- Accent teal is used for exactly the interactive/statusful things (active nav, D-day, `정답 보기`, primary CTA) — restrained.
- Dark mode is complete: the theme toggle flips cleanly with no unstyled or light-only surface observed on any page visited.

**No issues found.** This is the strongest pillar and the first pass's 4/4 holds up under measurement.

---

### Pillar 4: Typography (2/4)

**The 4×2 claim does not survive rendering.** Measured over all visible elements on `/lesson/1-4-sql-queries-and-joins`:

```
sizes:   14px ×816   16px ×77   20px ×8   24px ×6   28px ×1   12.25px ×8
weights: 400 ×825    600 ×85    700 ×6
families: pretendard ×155   ui-monospace ×761
```

- **24px/700 headings.** The six `h2`s (`1. 학습 목표` … `6. 핵심 정리 및 스스로 점검`) render at 24px weight 700 — the `prose` default — not the 20px/600 the token system defines. So the design system's heading step is not actually in effect inside lesson content, which is most of the site.
- **12.25px text.** Inline `<code>` inside `<td>` lands at 12.25px (14px × 0.875 relative `em` compounding). Eight occurrences in the `SELECT`/`FROM`/`WHERE` reference table — precisely the content a learner scans most carefully. Too small for Hangul-adjacent reading on an iPad.
- **What is correct:** Pretendard loads and applies to UI text; `ui-monospace` is correctly forced for `pre`/`code` so Pretendard never leaks into code; body line-height 1.6 suits the Korean/English mix.

**Fix:** override `prose` `h1..h4` to the token sizes/weights, and set inline `code` to an absolute `font-size` (e.g. `0.9375rem`) so nesting cannot shrink it further.

---

### Pillar 5: Spacing (4/4)

**Verified by measurement (live).** This pillar's first-pass "deferred / needs a real browser" items were all resolved, and all passed:

- **`min-height` on code blocks resolves to 52px** (`3.25rem`) on all 9 `<pre>` elements — the 1-line-block collapse the plan worried about does not occur.
- **Copy buttons measure exactly 44×44** on every code block. The overlap flagged during UAT does not reproduce at 768px: right padding (`3.5rem`) reserves the gutter and the button sits clear of the first line.
- **Zero horizontal page overflow** at both 768×1024 and 1024×768: `documentElement.scrollWidth - clientWidth === 0`, and a full-tree scan for elements extending past the viewport returned an empty list.
- **Zero touch targets under 44px.** A sweep of every `a, button, summary, input, [role=button], [tabindex]` on the lesson page returned no element below the threshold.
- Container is `mx-auto max-w-3xl px-4 sm:px-6 lg:px-8`; measured content width 705px at 768px viewport — comfortable measure for Korean body text.

**Latent risk (not a current defect):** markdown tables render with `overflow-x: visible` on their wrapper. Every current table fits (`scrollWidth === clientWidth`), so nothing is clipped today — but one wider table in a future lesson will push the whole page horizontally. Wrapping tables in an `overflow-x: auto` container now is cheap insurance.

---

### Pillar 6: Experience Design (1/4)

**Issue — [Critical] the copy button is non-functional.** Full detail in Priority Fix 1. Evidence, measured in the page:
```
button.rehype-pretty-copy →
  React props onClick  : "string"      ← React refuses to bind
  btn.onclick          : noop$1() {}   ← React's no-op stub
  hasAttribute(onclick): false         ← nothing for the browser to bind either
  click() → clipboard written: null, class unchanged (no "copied" feedback)
```
Console on `/lesson/1-4-sql-queries-and-joins`: 9 errors, one per code block. The button looks perfectly interactive — correct `aria-label="Copy code"`, 44×44, hover affordance — which makes the failure worse than an absent button: the learner taps, gets no feedback, and cannot tell whether the copy succeeded.

**Issue — no `<main>` landmark on lesson pages.** `document.querySelectorAll('main').length === 0` on `/lesson/*` (there is one `<article>` and one `<h1>`). `/step/1` *does* render `<main>`, so this is an inconsistency, not a global choice. It costs VoiceOver users the "skip to main content" rotor jump — relevant on long lesson pages.

**Issue — the locked state is a dead end.** Without the unlock cookie, a lesson page renders no completion control, no progress badge, and — verified above — no text mentioning completion or unlocking anywhere on the page. The header nav has no unlock entry point either. The core loop this project exists for (완료 체크 → 진행률) is invisible and unreachable to anyone who has not already been told the URL. **Fix:** show a disabled/locked completion affordance with one line of copy pointing at the unlock route.

**Verified strengths (live):**
- `<details>/<summary>` practice reveals work; `정답 보기` summaries are ≥44px and keyboard-operable.
- Theme toggle works instantly in both directions with a correct Korean `aria-label` (`다크 모드로 전환`).
- Pager links resolve to the correct adjacent lesson slugs.
- All 10 Step-1 lesson routes return 200 — no broken content route.
- `prefers-reduced-motion: reduce` is respected for the completion animations.

---

## Still Unverified

- **E2E progress loop against real Supabase** (`scripts/e2e-progress.mjs`, `scripts/e2e-today.mjs`) — not run here; the audit ran against `next dev` in the locked/no-cookie state, so no completion write was exercised. ROADMAP SC4 remains untested.
- **Real iPad Safari.** All measurements above come from Playwright's Chromium at iPad viewport sizes. Layout and contrast numbers will hold; Safari-specific behavior (momentum scroll inside `<pre>`, `navigator.clipboard` under Safari's user-gesture rules) still needs the physical device — and note that the clipboard defect in Fix 1 is engine-independent, so fixing it does not depend on that check.

---

## Files Audited

**Live routes:** `/`, `/curriculum`, `/step/1`, `/lesson/1-3-python-variables-and-types`, `/lesson/1-4-sql-queries-and-joins`, plus HTTP+brand checks on all 10 Step-1 lesson routes.

**Source:** `velite.config.ts` · `src/app/globals.css` · `src/app/lesson/[lessonId]/page.tsx` · `src/app/step/[stepId]/page.tsx` · `src/content/modules.ts` · `src/components/{depth-badge,module-accordion,complete-button,today-lesson-card,schedule-table}.tsx` · all 10 `src/content/lessons/step-1/*.mdx`

**Screenshots:** `.planning/ui-reviews/04-ui-review/` — `step1-portrait.png`, `lesson-sql-portrait.png`, `lesson-sql-dark-code.png`, `lesson-bottom-portrait.png`, `curriculum-portrait.png`, `today-portrait.png`

---

## Summary

The foundations are genuinely strong: color is measurably excellent in both themes, spacing and touch targets pass every iPad check the plans deferred as unverifiable, and the brand rule holds across all 10 lessons. Those are real results, confirmed against a running app rather than inferred from source.

What the code-only pass could not see is where the problems are. One shipped interaction is broken outright — the copy button, on every code block of every lesson, in a course whose exercises are built around copying code. Two more are systemic rather than cosmetic: the `prose` plugin quietly overrides the type scale the project defined for itself, and the `심화` badge marks every Step-1 lesson identically, including the orientation lesson.

**Recommendation:** fix the copy button before replicating this lesson template to Steps 2–3 — the defect would propagate to every future lesson. The typography override and badge classification are natural inputs to the `frontend-design` pass that follows.

---

*UI Review completed: 2026-08-25*
*Audit method: code-only subagent pass, corrected by live Playwright pass at iPad viewports (light + dark)*
*Baseline: Abstract 6-pillar standards*
