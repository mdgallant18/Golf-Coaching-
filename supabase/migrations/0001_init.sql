-- Golf Coaching: core schema (profiles + sessions) with RLS
-- Run this in the Supabase SQL editor, or via `supabase db push`.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles
-- One row per auth.users row. role determines coach vs player. Players may
-- optionally belong to a coach (coach_id -> another profile with role='coach').
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('coach', 'player')),
  full_name text not null,
  coach_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint coach_has_no_coach check (role = 'player' or coach_id is null)
);

create index if not exists profiles_coach_id_idx on public.profiles (coach_id);

alter table public.profiles enable row level security;

-- Every authenticated user can read their own profile row.
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

-- Coach profiles are publicly readable to any signed-in user so the signup
-- flow can populate a "pick your coach" dropdown.
create policy "profiles_select_coaches"
  on public.profiles for select
  to authenticated
  using (role = 'coach');

-- A coach can read the profile rows of the players assigned to them.
create policy "profiles_select_own_players"
  on public.profiles for select
  to authenticated
  using (
    role = 'player'
    and coach_id = auth.uid()
  );

-- Users provision their own profile row right after auth.signUp().
create policy "profiles_insert_self"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

-- Users may update their own row (e.g. change display name or pick a coach).
create policy "profiles_update_self"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- sessions
-- Append-only log of every reflection: round, tournament, technical practice,
-- or performance practice. Regardless of type, each session rolls up into one
-- of the five shared buckets and stores the full AI recap + raw answers.
-- ---------------------------------------------------------------------------
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.profiles (id) on delete cascade,
  session_type text not null check (
    session_type in ('round', 'tournament', 'technical_practice', 'performance_practice')
  ),
  bucket text not null check (
    bucket in ('driving', 'approach_scoring', 'short_game_putting', 'mental_game', 'course_strategy')
  ),
  summary text not null,
  recap text not null default '',
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists sessions_player_id_idx on public.sessions (player_id);
create index if not exists sessions_bucket_idx on public.sessions (bucket);
create index if not exists sessions_created_at_idx on public.sessions (created_at desc);

alter table public.sessions enable row level security;

-- Players see and create only their own sessions.
create policy "sessions_select_own"
  on public.sessions for select
  to authenticated
  using (player_id = auth.uid());

create policy "sessions_insert_own"
  on public.sessions for insert
  to authenticated
  with check (
    player_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'player'
    )
  );

-- Coaches see every session belonging to their own players.
create policy "sessions_select_by_coach"
  on public.sessions for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = sessions.player_id and p.coach_id = auth.uid()
    )
  );
