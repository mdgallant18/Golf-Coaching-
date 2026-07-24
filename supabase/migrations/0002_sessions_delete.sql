-- Allow a player to delete their own sessions, and a coach to delete any
-- session belonging to one of their own players.

create policy "sessions_delete_own"
  on public.sessions for delete
  to authenticated
  using (player_id = auth.uid());

create policy "sessions_delete_by_coach"
  on public.sessions for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = sessions.player_id and p.coach_id = auth.uid()
    )
  );
