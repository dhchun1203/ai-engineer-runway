# Project Research Summary

**Project:** AI Engineer Course Pre-Study Tracker (Sept 2026 start)
**Domain:** Personal curriculum-based learning tracker, single-user, deadline-driven
**Researched:** 2026-08-24
**Confidence:** MEDIUM-HIGH

## Executive Summary

Personal learning tracker for pre-study before 2026-09-30 course deadline. Real bottleneck: ~100+ hours writing 35 Korean lessons with code examples. Recommendation: minimal platform (Next.js 16 + Supabase + static MDX) in 2-3 weeks, protecting runway for content authoring. Critical risk: platform scope creep.

Use Velite (not Contentlayer). Anonymous Supabase auth with RLS. Static lesson pages with per-request progress. Deploy to Vercel early (Phase 1) to catch environment issues before content sprint.

## Key Findings

### Recommended Stack

Next.js 16 App Router + React 19 + TypeScript 5 on Vercel. Supabase for progress state only. Content as MDX files.

**Core:** Next.js 16.3.2 (App Router), React 19.2.8, TypeScript 5.x, Supabase (Postgres + anonymous auth), Velite 0.4.0 (NOT Contentlayer - unmaintained), rehype-pretty-code + Shiki, Tailwind 4.3.3 + typography plugin, Pretendard font, Vercel

### Expected Features

**Must have:** Lesson content, curriculum structure (Step > Module > Lesson), complete toggle, progress bars, study schedule, today view, live URL

**Should have:** Countdown, depth badges, code copy button, auto-rebalancing

**Defer:** Multi-user auth, quiz engine, video, gamification, PWA, CMS

### Architecture Approach

Two-layer: static content (MDX + TypeScript manifest) + mutable state (Supabase progress table).

**Components:** Curriculum manifest (content/curriculum.ts), Lesson MDX files, Supabase progress table (RLS enabled), Server Components + Actions, Progress aggregation (lib/progress.ts), Schedule model (content/schedule.ts)

### Critical Pitfalls

1. **Platform-building crowding content (KILLER):** Easy to polish instead of write lessons. Avoid: timebox platform 3-4 days, write 1-2 real lessons early, majority to content.

2. **Over-engineered auth:** Single user doesn't need complex OAuth/password reset. Avoid: use one seeded user or skip auth. Gate with middleware cookie instead.

3. **RLS misconfiguration:** Default is OFF (security risk). Avoid: enable on every table, use auth.uid() = user_id pattern.

4. **Contentlayer rabbit hole:** Unmaintained, incompatible Next.js 14+. Avoid: use Velite or next-mdx-remote, build components after real lessons.

5. **Progress double source of truth:** localStorage + Supabase drift apart. Avoid: Supabase is truth, localStorage is temporary cache only.

6. **Schedule scope creep:** Balloons to interactive calendar. Avoid: ship static list with today highlighted, no drag-drop for v1.

7. **Korean typography:** Fonts larger, text breaks mid-word without word-break: keep-all. Avoid: load only needed weights, apply word-break globally.

## Roadmap Implications

### Phase 1: Foundation (3-4 days)
Curriculum manifest, Supabase setup, static rendering validated, Vercel deployed with real data, base layout.

### Phase 2: Progress (3-4 days)
markComplete() action, completion badges, progress bars, dashboard, optimistic UI.

### Phase 3: Content (3-4 weeks)
All 35 Korean lessons. This is bulk of timeline and where deadline pressure matters.

### Phase 4: Schedule (2-3 days)
Derive schedule from finalized curriculum. Schedule page, today section, on-track indicator.

### Phase 5: Polish (1-2 days if time allows)
Countdown, badges, code copy, auto-rebalancing.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Official npm/docs verified |
| Features | MEDIUM | Converges across four categories |
| Architecture | HIGH | Official docs backed |
| Pitfalls | MEDIUM | Community-validated |

**Overall: MEDIUM-HIGH**

## Gaps to Address

1. Content format validation: Test 2 real source lessons before Phase 3
2. Lesson time estimation: Phase 4 validates estimated vs actual time
3. Code example scope: Phase 1-2 fixtures establish pattern
4. Step 3 depth guideline: Define concrete rubric before Phase 3
5. Multi-language highlighting: Phase 1 tests all 7 languages

## Sources

**Primary (HIGH):** npm registry, Next.js docs, Supabase docs, Tailwind docs
**Secondary (MEDIUM):** LMS/roadmap.sh/freeCodeCamp/Notion patterns, Contentlayer community, Korean font practices
**Tertiary (LOW):** Web search, general engineering practices

---

*Research completed: 2026-08-24*
*Ready for roadmap: YES*
