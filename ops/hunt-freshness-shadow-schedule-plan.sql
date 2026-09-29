-- HUNT Freshness Shadow schedule plan v2
-- PLANNED ONLY. DO NOT APPLY.
-- Preconditions before activation:
--   1) deploy hunt-freshness-shadow-runner + patched hunt-eprolo-country-shadow together
--   2) configure HUNT_FRESHNESS_SHADOW_SECRET and SUPABASE_DB_POOLER_URL
--   3) verify load test / no CONNECT_TIMEOUT regression
--   4) confirm provider/API rate limits
--   5) Owner Gate for scheduled shadow writes
--
-- Target policy from private.hunt_supplier_refresh_policy:
--   stock refresh 30m, price 60m, shipping 60m, stale 90m.
--
-- Proposed conservative initial cadence (IL only):
--   CJ:     batch 10 every 3 minutes, 7 rotating offsets -> full 63 pool <= 21m.
--   EPROLO: batch 10 every 3 minutes, 27 rotating offsets -> full 261 core <= 81m.
--   Stagger CJ and EPROLO by 90 seconds / separate cron slots to avoid concurrent bursts.
--
-- Rotation concept (not scheduled here):
--   CJ offset      = ((run_index % 7)  * 10)
--   EPROLO offset  = ((run_index % 27) * 10)
--
-- Safety:
--   persist=false during smoke/load testing.
--   persist=true only writes hunt_product_observations + private.hunt_ops_exceptions.
--   never changes sellable, catalog visibility, payment, supplier order, or Production.
--   any RETRY/HOLD stays fail-closed.
--
-- Supabase guidance:
--   use pg_cron + pg_net for scheduled Edge Functions;
--   keep call credentials in Vault;
--   avoid too many concurrent jobs / inspect cron.job_run_details and DB connections.

select
  'PLANNED_DISABLED' as state,
  false as cron_enabled,
  'IL' as initial_country,
  10 as batch_size,
  3 as interval_minutes,
  7 as cj_rotation_slots,
  27 as eprolo_rotation_slots,
  false as production_effect;
