-- Esegui una volta questo file nell'SQL Editor di Supabase.
-- Conserva un vincitore per ogni edizione del torneo.
create table if not exists public.tournament_editions (
  year integer primary key check (year >= 2026),
  champion text check (champion in ('nord', 'sud', 'centro-storico', 'palazzoni'))
);

-- Porta nell'albo d'oro l'eventuale campione 2026 già salvato.
insert into public.tournament_editions (year, champion)
select 2026, champion from public.tournament_settings where id = true
on conflict (year) do update set champion = excluded.champion;

insert into public.tournament_editions (year)
values (2026)
on conflict (year) do nothing;

alter table public.tournament_editions enable row level security;

create policy "Albo d'oro pubblico" on public.tournament_editions
for select using (true);

create policy "Solo amministratori inseriscono edizioni" on public.tournament_editions
for insert to authenticated with check (public.is_tournament_admin());

create policy "Solo amministratori aggiornano edizioni" on public.tournament_editions
for update to authenticated using (public.is_tournament_admin()) with check (public.is_tournament_admin());

alter publication supabase_realtime add table public.tournament_editions;
