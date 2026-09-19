const fs=require("node:fs");
const assert=require("node:assert");

const sql=fs.readFileSync("docs/BOOM-M28-CAMPAIGN-ATTRIBUTION-LEDGER-SQL-PROPOSAL.sql","utf8");
const validator=fs.readFileSync("boom-provider-click-validation.js","utf8");
const ledger=fs.readFileSync("boom-campaign-attribution-ledger.js","utf8");
const html=fs.readFileSync("boom-growth-os.html","utf8");
const studio=fs.readFileSync("boom-growth-os.js","utf8");
const migration=fs.readFileSync("supabase/migrations/20260919142109_campaign_attribution_ledger.sql","utf8");
const hardening=fs.readFileSync("supabase/migrations/20260919142135_harden_campaign_attribution_ledger_rls.sql","utf8");

for(const token of [
  "M28 · CAMPAIGN ATTRIBUTION LEDGER",
  'id="bg-attribution-ledger-state"',
  'id="bg-attribution-ledger-stats"',
  'id="bg-attribution-ledger-proof"',
  'id="bg-attribution-ledger-provider"',
  'boom-provider-click-validation.js?v=m28',
  'boom-campaign-attribution-ledger.js?v=m28'
]) assert(html.includes(token),"M28 Studio surface missing: "+token);

for(const token of [
  "const CampaignLedger=window.BoomCampaignAttributionLedger",
  "const ProviderClick=window.BoomProviderClickValidation",
  "provider_click_validation:providerClickValidation.provider_click_validation===true",
  'domain:"campaign_attribution_ledger"',
  'domain:"provider_click_validation"',
  '"M28","Campaign Attribution Ledger","BoomCampaignAttributionLedger","PANEL"',
  '"M28","Provider Click Validation","BoomProviderClickValidation","CONNECTED"',
  "renderCampaignAttributionLedger(data)"
]) assert(studio.includes(token),"M28 Studio integration missing: "+token);

for(const token of [
  "create table if not exists public.hunt_attribution_ledger",
  "payment_session_id uuid not null unique",
  "enable row level security",
  "revoke all on table public.hunt_attribution_ledger from public, anon, authenticated",
  "grant select, insert, update, delete on table public.hunt_attribution_ledger to service_role",
  "click_id_digest",
  "extensions.digest(click_value,'sha256')",
  "PENDING_PROVIDER_VALIDATION",
  "AMBIGUOUS_PROVIDER_CLICK_IDS",
  "conversion_claim_allowed boolean not null default false",
  "security invoker",
  "revoke all on function public.hunt_capture_attribution_ledger() from public, anon, authenticated",
  "after insert on public.hunt_payment_sessions",
  "on conflict (payment_session_id) do nothing"
]) {
  assert(sql.includes(token),"M28 SQL contract missing: "+token);
  assert(migration.includes(token),"M28 canonical migration missing: "+token);
}

assert(!sql.includes("raw_click_id"),"M28 ledger must not define raw click-id storage");
assert(!sql.includes("customer_email"),"M28 ledger must not copy customer email");
assert(!sql.includes("shipping_snapshot"),"M28 ledger must not copy shipping PII");
assert(hardening.includes('to anon, authenticated'));
assert(hardening.includes('using (false)'));
assert(hardening.includes('with check (false)'));

for(const token of [
  'gclid:"GOOGLE_ADS"',
  'fbclid:"META"',
  'ttclid:"TIKTOK_ADS"',
  'msclkid:"MICROSOFT_ADS"',
  "official_api_verified===true",
  "raw_click_id_exposed:false",
  "conversion_claim_allowed:false"
]) assert(validator.includes(token),"M28 validator contract missing: "+token);

for(const token of [
  'migration_version:"20260919142109"',
  'hardening_migration_version:"20260919142135"',
  'proof_payment_session_id:"04173c44-da56-4363-aa7e-f6a9d77887a8"',
  "total_rows:23",
  "with_click_digest:3",
  "pending_provider_validation:3",
  "provider_verified:0",
  'proof_click_provider:"GOOGLE_ADS"',
  'proof_click_id_type:"gclid"',
  "proof_digest_length:64",
  "proof_digest_equals_raw:false",
  "payment_live_enabled:false",
  "payplus_callback_accept_paid:false",
  "provider_click_validation:verified>0",
  "paid_attribution_ready:false",
  "payments_live:false",
  "paid_spend:false",
  "execute_actions:false"
]) assert(ledger.includes(token),"M28 ledger runtime contract missing: "+token);

console.log("boom_m28_campaign_attribution_ledger_contract=PASS");