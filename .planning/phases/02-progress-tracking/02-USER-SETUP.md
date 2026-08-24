# Phase 02: User Setup Required

**Generated:** 2026-08-24
**Phase:** 02-progress-tracking
**Status:** Complete

Local development and production (Vercel) are both fully configured and verified working
end-to-end against the live database, including a full round trip through the production
`/unlock` route and the production home page's progress summary (02-04 Task 3 precondition
re-check, confirmed via a read-only production probe on 2026-08-24).

## Environment Variables

| Status | Variable | Source | Add to |
|--------|----------|--------|--------|
| [x] | `SUPABASE_URL` | Supabase Dashboard → Project Settings → Data API → Project URL | `.env.local` (done — verified via `scripts/check-supabase-progress.mjs`) |
| [x] | `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API Keys → `service_role` (secret) | `.env.local` (done — verified) |
| [x] | `SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API Keys → `anon`/`publishable` | `.env.local` (done — verified, RLS default-deny confirmed) |
| [x] | `UNLOCK_SECRET` | Generated locally via `openssl rand -hex 24` | `.env.local` (done) |
| [x] | `SUPABASE_URL` | Same value as above | Vercel → `ai-engineer-runway` → Settings → Environment Variables (Production + Preview) — registered and redeployed, confirmed working (progress summary/step bars render correctly for a valid unlock cookie against production) |
| [x] | `SUPABASE_SERVICE_ROLE_KEY` | Same value as above | Vercel → `ai-engineer-runway` → Settings → Environment Variables (Production + Preview) — registered and redeployed, confirmed working |
| [x] | `SUPABASE_ANON_KEY` | Same value as above | Vercel → `ai-engineer-runway` → Settings → Environment Variables (Production + Preview) — registered and redeployed |
| [x] | `UNLOCK_SECRET` | Same value as above | Vercel → `ai-engineer-runway` → Settings → Environment Variables (Production + Preview) — registered and redeployed, confirmed via production `/unlock?key=...` returning `state=ok` + issuing the HttpOnly cookie |

## Account Setup

- [x] **Supabase project** — an existing project (`ai-news-briefing`, ref `wxqteqiuihrgtxmztauc`) is reused for this phase rather than a new dedicated project (free-tier constraint). The `public.progress` table lives alongside that project's unrelated `public.subscribers` and `public.search_articles` tables — those are untouched by this phase and must stay that way.

## Dashboard Configuration

- [x] **Register the 4 env vars in Vercel** (Production + Preview environments) — done
  - Location: https://vercel.com → `ai-engineer-runway` → Settings → Environment Variables
  - Values: same as local `.env.local`
  - Note (02-04 Task 3): the first attempt hit a stale-deployment issue unrelated to the env vars themselves — `origin/master` was 30 commits behind local (`02-01` through `02-04` Tasks 1-2 had never been pushed), so the "redeploy" just rebuilt the old Phase-1-era commit and `/unlock` 404'd regardless of key. Fixed by `git push origin master`; after that, a second `UNLOCK_SECRET` mismatch surfaced (production value didn't match `.env.local`, likely a copy-paste whitespace issue) and was fixed by re-saving the value in the Vercel dashboard. Both are resolved as of this plan's completion.

## Verification

Local (already passing as of this plan's completion):

```bash
node --env-file=.env.local scripts/check-supabase-progress.mjs
node scripts/check-progress-gates.mjs
```

Expected: both exit 0. (Confirmed.)

Production (confirmed working as of 02-04 Task 3, via a read-only probe — no secrets printed):

```bash
node --env-file=.env.local -e "
fetch('https://ai-engineer-runway.vercel.app/unlock?key=' + encodeURIComponent(process.env.UNLOCK_SECRET), { redirect: 'manual' })
  .then(r => console.log(r.status, r.headers.get('location'), !!r.headers.get('set-cookie')));
"
```

Expected: `307 .../unlock/done?state=ok true` (cookie issued). Confirmed passing.

---

Status: Complete — no outstanding manual setup remains for this phase.
