# Golf Coaching

A PWA for junior golfers (ages 12-18) to log post-round and post-practice
reflections and get back an AI-generated coaching recap in the "Floridian
Signature" voice — warm, direct, strengths before weaknesses, coaching a
competitor rather than grading a student.

Stack: React + Vite (installable PWA) · Supabase (auth + Postgres) · Anthropic
API (Claude Sonnet 5) called from a Supabase Edge Function so the API key
never reaches the browser.

## Status

**Phase 1 (this commit): project scaffold, database schema, and auth.**
Players and coaches can sign up, pick a role, and (for players) pick a coach.
Session logging, the recap flows, and the history views are the next phase.

## 1. Create a Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql).
   It creates `profiles` and `sessions` with row-level security so:
   - players can only see their own sessions,
   - coaches can see every session belonging to their own players,
   - anyone signed in can see the list of coaches (for the signup dropdown).
3. In **Project Settings → API**, copy the Project URL and the `anon` public key.

## 2. Configure the app

```bash
cp .env.example .env
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

By default Supabase requires email confirmation for new accounts. For local
testing, either confirm via the email Supabase sends, or turn off "Confirm
email" under **Authentication → Providers → Email** in the dashboard.

## 3. Deploy the recap Edge Function

The recap generator lives in [`supabase/functions/generate-recap`](./supabase/functions/generate-recap)
and calls the Anthropic API server-side. It isn't wired into the UI yet
(that lands with the session-logging phase), but you can deploy and test it
now:

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase functions deploy generate-recap
```

## Project structure

```
src/
  auth/          AuthContext (session + profile) and route guards
  lib/           Supabase client + generated Database types
  pages/         Login, signup, complete-profile, player/coach home
  types/         Shared domain types (SessionType, Bucket, Profile, ...)
supabase/
  migrations/    SQL schema + RLS policies
  functions/     Edge Functions (generate-recap)
```

## Data model

- **profiles** — one row per user. `role` is `'coach'` or `'player'`; players
  optionally have a `coach_id` pointing at a coach's profile.
- **sessions** — one row per logged session (round, tournament, technical
  practice, or performance practice). Every session stores its `session_type`,
  its shared `bucket` (Driving / Approach & Scoring / Short Game & Putting /
  Mental Game / Course Strategy), a one-line `summary`, the full `recap` text,
  and the raw quick-tap `answers` as JSON.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — typecheck and build for production
- `npm run lint` — run Oxlint
- `npm run preview` — preview the production build locally
