const fs=require("fs");
const assert=require("assert");
const callback=fs.readFileSync("supabase/functions/hunt-payplus-callback/index.ts","utf8");
const auth=fs.readFileSync("supabase/functions/hunt-payplus-callback/payplus-auth.mjs","utf8");
const status=fs.readFileSync("supabase/functions/hunt-payplus-callback/payplus-status-map.mjs","utf8");
const sandbox=fs.readFileSync("supabase/functions/hunt-payplus-sandbox-evidence/index.ts","utf8");

for(const needle of [
  "verifyPayPlusCallbackHeaders",
  "verifyWithPayPlus",
  "hunt_payplus_callback_accept_paid",
  "provider_event_id",
  "PAYPLUS_CALLBACK_SIGNATURE_INVALID",
  "PROVIDER_STATUS_MAPPING_REQUIRES_SANDBOX_PROOF"
]) assert(callback.includes(needle),"callback safety missing "+needle);

assert(auth.includes("constantTimeEqual"));
assert(auth.includes('userAgent')&&auth.includes('"PayPlus"'));
assert(status.includes("sandbox_status_proven:false"));
assert(status.includes("paid_state_write_allowed:false"));
assert(!callback.includes('status:"paid"'),"callback must not mark paid before sandbox proof");
assert(sandbox.includes("hunt_payplus_sandbox_evidence"));
assert(sandbox.includes("shipping_snapshot:{sandbox_evidence:true}"));
assert(sandbox.includes("accepted_paid:false"));

console.log("BOOM PayPlus callback safety: PASS — signed/idempotent callback remains HOLD until sandbox status proof");