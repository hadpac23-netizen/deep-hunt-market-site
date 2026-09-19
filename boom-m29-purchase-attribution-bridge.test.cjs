const fs=require("node:fs");
const assert=require("node:assert");

const html=fs.readFileSync("boom-growth-os.html","utf8");
const studio=fs.readFileSync("boom-growth-os.js","utf8");
const bridge=fs.readFileSync("boom-purchase-attribution-bridge.js","utf8");
const sql=fs.readFileSync("supabase/migrations/20260919143150_purchase_attribution_bridge.sql","utf8");

for(const token of [
  "M29 · PURCHASE ATTRIBUTION BRIDGE",
  'id="bg-purchase-bridge-state"',
  'id="bg-purchase-bridge-stats"',
  'id="bg-purchase-bridge-proof"',
  'id="bg-purchase-bridge-profit"',
  'boom-purchase-attribution-bridge.js?v=m29'
]) assert(html.includes(token),"M29 Studio surface missing: "+token);

for(const token of [
  "const PurchaseBridge=window.BoomPurchaseAttributionBridge",
  "purchaseAttributionBridge=PurchaseBridge?.evaluate?.()",
  '"M29","Purchase Attribution Bridge","BoomPurchaseAttributionBridge","PANEL"',
  'domain:"purchase_attribution_bridge"',
  'domain:"profit_evidence"',
  "renderPurchaseAttributionBridge(data)"
]) assert(studio.includes(token),"M29 Studio integration missing: "+token);

for(const token of [
  'migration_version:"20260919143150"',
  "security_invoker:true",
  "public_read_blocked:true",
  "total_sessions:23",
  "provider_payment_confirmed:0",
  "server_confirmed_purchases:0",
  "campaign_context_present:3",
  "provider_click_validated:0",
  "finance_ledger_rows:0",
  "profit_evidence_ready:0",
  "conversion_claim_allowed:0",
  "provider_status_mapping_ready:false",
  "payment_live_enabled:false",
  "payplus_callback_accept_paid:false"
]) assert(bridge.includes(token),"M29 receipt missing: "+token);

for(const token of [
  "with (security_invoker = true)",
  "payment_confirmed",
  "callback_verified_paid",
  "provider_paid_confirmed",
  "o.is_test = false",
  "a.provider_validation_status = 'VERIFIED'",
  "f.is_test = false",
  "f.settlement_status in ('locked','settled')",
  "revoke all on table public.hunt_purchase_attribution_bridge from public, anon, authenticated",
  "grant select on table public.hunt_purchase_attribution_bridge to service_role"
]) assert(sql.includes(token),"M29 SQL contract missing: "+token);

assert(!sql.includes("update public.hunt_payment_sessions"),"M29 must not mark payment sessions");
assert(!sql.includes("insert into public.hunt_orders"),"M29 must not create orders");
assert(!sql.includes("update public.hunt_attribution_ledger"),"M29 must remain read-only");

console.log("boom_m29_purchase_attribution_bridge_contract=PASS");