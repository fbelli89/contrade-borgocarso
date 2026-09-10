-- Esegui questo file nel SQL Editor di Supabase se il database è già configurato.
create table if not exists public.tournament_settings (
  id boolean primary key default true check (id),
  champion text check (champion in ('nord', 'sud', 'centro-storico', 'palazzoni'))
);

alter table public.tournament_settings enable row level security;

create policy "Vincitore pubblico" on public.tournament_settings for select using (true);
create policy "Solo amministratori impostano il vincitore" on public.tournament_settings for insert
  to authenticated with check (public.is_tournament_admin());
create policy "Solo amministratori aggiornano il vincitore" on public.tournament_settings for update
  to authenticated using (public.is_tournament_admin())
  with check (public.is_tournament_admin());

alter publication supabase_realtime add table public.tournament_settings;
