-- HUNT Freshness Shadow schedule plan
-- DO NOT APPLY until the function is deployed, HUNT_FRESHNESS_SHADOW_SECRET is configured,
-- load is validated, and Owner Gate approves scheduled shadow writes.
--
-- Supabase docs: schedule Edge Functions with pg_cron + pg_net and keep auth tokens in Vault.
-- The intended cadence matches private.hunt_supplier_refresh_policy:
--   stock: 30m; price/shipping: 60m; stale: 90m.
--
-- Initial rollout:
--   1) IL only
--   2) batch_size 10
--   3) CJ and EPROLO offset rotation
--   4) never overlap jobs
--   5) inspect cron.job_run_details and DB connections before increasing cadence.
--
-- No active cron is created by this file.
select
  'PLANNED_DISABLED' as state,
  'hunt-freshness-shadow-runner' as function_name,
  10 as initial_batch_size,
  'IL' as initial_country,
  false as cron_enabled,
  false as production_effect;
