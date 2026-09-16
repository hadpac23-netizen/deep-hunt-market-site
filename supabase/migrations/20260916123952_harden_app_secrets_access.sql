-- Defense-in-depth hardening for server-only secret storage.
-- QA only until explicitly approved for Production.
-- BOOM Edge Functions use SUPABASE_SERVICE_ROLE_KEY and keep service_role access.

revoke all privileges on table public.app_secrets from anon;
revoke all privileges on table public.app_secrets from authenticated;

-- Preserve server-side access explicitly.
grant select, insert, update, delete on table public.app_secrets to service_role;
