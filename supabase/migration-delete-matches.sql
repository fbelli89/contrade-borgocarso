-- Esegui questa sola migrazione se hai già configurato il database.
create or replace function public.is_tournament_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.admin_users where id = auth.uid());
$$;

revoke all on function public.is_tournament_admin() from public;
grant execute on function public.is_tournament_admin() to authenticated;

drop policy if exists "Solo amministratori eliminano" on public.matches;
create policy "Solo amministratori eliminano"
on public.matches
for delete
to authenticated
using (public.is_tournament_admin());
