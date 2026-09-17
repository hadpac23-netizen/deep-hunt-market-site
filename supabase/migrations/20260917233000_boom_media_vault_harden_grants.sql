-- BOOM Media Vault explicit least-privilege Data API hardening.
-- Applied after the initial vault migration because this project retains legacy default table privileges.

revoke insert, update, delete, truncate, references, trigger
on table public.boom_media_assets
from anon, authenticated;

revoke delete, truncate, references, trigger
on table public.boom_media_assets
from service_role;

grant select
on table public.boom_media_assets
to authenticated;

grant select, insert, update
on table public.boom_media_assets
to service_role;
