# Phase 02: User Setup Required

**Generated:** 2026-08-24
**Phase:** 02-progress-tracking
**Status:** Partially Complete

Local development is fully configured and verified working end-to-end against the live
database. One item remains for production (Vercel) deploys of this phase's features to work.

## Environment Variables

| Status | Variable | Source | Add to |
|--------|----------|--------|--------|
| [x] | `SUPABASE_URL` | Supabase Dashboard → Project Settings → Data API → Project URL | `.env.local` (done — verified via `scripts/check-supabase-progress.mjs`) |
| [x] | `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API Keys → `service_role` (secret) | `.env.local` (done — verified) |
| [x] | `SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API Keys → `anon`/`publishable` | `.env.local` (done — verified, RLS default-deny confirmed) |
| [x] | `UNLOCK_SECRET` | Generated locally via `openssl rand -hex 24` | `.env.local` (done) |
| [ ] | `SUPABASE_URL` | Same value as above | Vercel → `ai-engineer-runway` → Settings → Environment Variables (Production + Preview) |
| [ ] | `SUPABASE_SERVICE_ROLE_KEY` | Same value as above | Vercel → `ai-engineer-runway` → Settings → Environment Variables (Production + Preview) |
| [ ] | `SUPABASE_ANON_KEY` | Same value as above | Vercel → `ai-engineer-runway` → Settings → Environment Variables (Production + Preview) |
| [ ] | `UNLOCK_SECRET` | Same value as above | Vercel → `ai-engineer-runway` → Settings → Environment Variables (Production + Preview) |

## Account Setup

- [x] **Supabase project** — an existing project (`ai-news-briefing`, ref `wxqteqiuihrgtxmztauc`) is reused for this phase rather than a new dedicated project (free-tier constraint). The `public.progress` table lives alongside that project's unrelated `public.subscribers` and `public.search_articles` tables — those are untouched by this phase and must stay that way.

## Dashboard Configuration

- [ ] **Register the 4 env vars in Vercel** (Production + Preview environments)
  - Location: https://vercel.com → `ai-engineer-runway` → Settings → Environment Variables
  - Values: same as local `.env.local`
  - Why this matters: without this, the deployed site's Server Actions/Server Components will throw the descriptive `src/lib/supabase/admin.ts` startup errors ("SUPABASE_URL 환경 변수가 비어 있습니다" / "SUPABASE_SERVICE_ROLE_KEY 환경 변수가 비어 있습니다") on every request that touches progress data, once 02-02 wires the first Server Action/page into this layer.
  - Not required to complete 02-01 itself (this plan's own verification runs entirely against `.env.local`), but should be done before 02-02's tracer is deployed/verified in production.

## Verification

Local (already passing as of this plan's completion):

```bash
node --env-file=.env.local scripts/check-supabase-progress.mjs
node scripts/check-progress-gates.mjs
```

Expected: both exit 0. (Confirmed in this session.)

After Vercel env vars are registered, verify with:

```bash
vercel env ls
```

Expected: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `UNLOCK_SECRET` each listed for Production and Preview.

---

**Once the Vercel env vars are registered:** Mark status as "Complete" at top of file.
