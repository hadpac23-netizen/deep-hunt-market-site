create policy "deny client access to f60t cron auth"
on public.f60t_cron_auth
for all
to anon, authenticated
using (false)
with check (false);

create policy "deny client access to f60t oauth states"
on public.f60t_oauth_states
for all
to anon, authenticated
using (false)
with check (false);
