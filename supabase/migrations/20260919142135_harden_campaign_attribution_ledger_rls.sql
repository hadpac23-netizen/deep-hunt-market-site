drop policy if exists "No public attribution ledger access" on public.hunt_attribution_ledger;
create policy "No public attribution ledger access"
on public.hunt_attribution_ledger
for all
to anon, authenticated
using (false)
with check (false);
