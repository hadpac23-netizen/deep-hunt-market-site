const fs=require("node:fs");
const assert=require("node:assert");
const preview=fs.readFileSync("supabase/functions/hunt-commerce-signal/index.ts","utf8");
const analytics=fs.readFileSync("analytics.js","utf8");
const readiness=fs.readFileSync("boom-paid-attribution-readiness.js","utf8");

const html=fs.readFileSync("boom-growth-os.html","utf8");
const studio=fs.readFileSync("boom-growth-os.js","utf8");
for(const token of [
  "M20 · PAID ATTRIBUTION READINESS",
  'id="bg-paid-attribution-state"',
  'id="bg-paid-attribution-checks"',
  'id="bg-paid-attribution-blockers"',
  'boom-paid-attribution-readiness.js?v=m20'
]) assert(html.includes(token),"M20 Studio surface missing: "+token);
for(const token of [
  "const PaidAttribution=window.BoomPaidAttributionReadiness",
  "live_event_id_persistence:liveActivation.live_event_id_persistence===true",
  "durable_server_dedup:durableEventIdentity.durable_ready===true",
  "server_purchase_confirmation:serverPurchaseProof.server_purchase_confirmation===true",
  "campaign_touchpoint_persistence:serverPurchaseProof.live_campaign_context_persisted===true",
  "purchase_touchpoint_linkage:serverPurchaseProof.purchase_touchpoint_linkage===true",
  "provider_click_validation:providerClickValidation.provider_click_validation===true",
  'domain:"paid_attribution"',
  "renderPaidAttribution(data)"
]) assert(studio.includes(token),"M20 Studio guard missing: "+token);

for(const token of [
  "LIVE SOURCE-OF-TRUTH",
  "event_id:eventId",
  "event_id_persisted:Boolean(eventId)",
  "durable_cross_worker_dedup:false",
  "paid_attribution:false",
  'Deno.env.get("SUPABASE_SECRET_KEYS")',
  'Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")'
]) assert(preview.includes(token),"M20 preview contract missing: "+token);

assert(!preview.includes('"hunt_purchase"'),"M20 preview must not trust browser purchase as paid attribution");
assert(analytics.includes("event_id: clean(params.event_id || \"\",160)"),"Browser first-party signal must carry event_id");
assert(analytics.includes('if(eventName==="purchase"&&transactionId)return "hunt_purchase_"+transactionId;'),"Purchase event identity must remain deterministic");
assert(!analytics.match(/page_view:[\s\S]*purchase:\s*"hunt_purchase"/),"Browser first-party event map must not silently add purchase");

for(const token of [
  "live_event_id_persistence",
  "durable_server_dedup",
  "server_purchase_confirmation",
  "campaign_touchpoint_persistence",
  "purchase_touchpoint_linkage",
  "provider_click_validation",
  "paid_attribution_ready:attributionCore",
  "paid_destination_send:false",
  "paid_launch:false",
  "paid_spend:false",
  "execute_actions:false"
]) assert(readiness.includes(token),"M20 readiness contract missing: "+token);

console.log("boom_m20_paid_attribution_contract=PASS");