const fs=require("node:fs");
const assert=require("node:assert");

const html=fs.readFileSync("boom-growth-os.html","utf8");
const studio=fs.readFileSync("boom-growth-os.js","utf8");
const adapter=fs.readFileSync("hunt-server-purchase-proof-adapter.js","utf8");
const callback=fs.readFileSync("supabase/functions/hunt-payplus-callback/index.ts","utf8");

for(const token of [
  "M22 · SERVER PURCHASE PROOF",
  'id="bg-server-purchase-state"',
  'id="bg-server-purchase-stats"',
  'id="bg-server-purchase-proof"',
  'id="bg-server-purchase-linkage"',
  'hunt-server-purchase-proof-adapter.js?v=m22'
]) assert(html.includes(token),"M22 Studio surface missing: "+token);

for(const token of [
  "const PurchaseProofAdapter=window.HuntServerPurchaseProofAdapter",
  "await PurchaseProofAdapter.load(client)",
  "server_purchase_confirmation:serverPurchaseProof.server_purchase_confirmation===true",
  "campaign_touchpoint_persistence:serverPurchaseProof.live_campaign_context_persisted===true",
  "purchase_touchpoint_linkage:serverPurchaseProof.purchase_touchpoint_linkage===true",
  'domain:"server_purchase_proof"',
  "renderServerPurchaseProof(data)"
]) assert(studio.includes(token),"M22 Studio proof integration missing: "+token);

for(const token of [
  "hunt_payment_sessions",
  "hunt_orders",
  "hunt_payment_events",
  "payment_confirmed",
  "callback_verified_paid",
  "provider_paid_confirmed",
  "paid_at",
  "is_test===false",
  "server_purchase_confirmation:confirmedReal.length>0",
  "purchase_touchpoint_linkage:linkedWithContext.length>0",
  "read_only:true",
  "writes:0",
  "execute_actions:false"
]) assert(adapter.includes(token),"M22 adapter contract missing: "+token);

for(const forbidden of [".insert(", ".update(", ".delete(", ".upsert(", ".rpc(", "fetch("])
  assert(!adapter.includes(forbidden),"M22 proof adapter must be read-only: "+forbidden);

assert(callback.includes("accepted_paid:false"),"Current callback must remain fail-closed until paid status mapping is proven");
assert(!callback.includes("paid_at:new Date"),"M22 must not silently turn the current callback into a paid-state writer");

console.log("boom_m22_server_purchase_proof_contract=PASS");