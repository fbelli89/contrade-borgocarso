-- Esegui questa migrazione per poter eliminare marcatori inseriti per errore.
drop policy if exists "Solo amministratori eliminano marcatori" on public.goals;
create policy "Solo amministratori eliminano marcatori"
on public.goals
for delete
to authenticated
using (public.is_tournament_admin());
