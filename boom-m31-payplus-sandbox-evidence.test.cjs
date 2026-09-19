const fs=require("node:fs");
const assert=require("node:assert");

const html=fs.readFileSync("boom-growth-os.html","utf8");
const studio=fs.readFileSync("boom-growth-os.js","utf8");
const receipt=fs.readFileSync("boom-payplus-sandbox-evidence.js","utf8");
const harness=fs.readFileSync("supabase/functions/hunt-payplus-sandbox-evidence/index.ts","utf8");

for(const token of [
  "M31 · PAYPLUS SANDBOX EVIDENCE",
  'id="bg-payplus-sandbox-state"',
  'id="bg-payplus-sandbox-stats"',
  'id="bg-payplus-sandbox-proof"',
  'id="bg-payplus-sandbox-blockers"',
  'boom-payplus-sandbox-evidence.js?v=m31'
]) assert(html.includes(token),"M31 Studio surface missing: "+token);

for(const token of [
  "const PayPlusSandbox=window.BoomPayPlusSandboxEvidence",
  "payPlusSandbox=PayPlusSandbox?.evaluate?.()",
  '"M31","PayPlus Sandbox Evidence","BoomPayPlusSandboxEvidence","PANEL"',
  'domain:"payplus_sandbox_evidence"',
  "renderPayPlusSandbox(data)"
]) assert(studio.includes(token),"M31 Studio integration missing: "+token);

for(const token of [
  "harness_version:2",
  "staging_only:true",
  "one_time_token_required:true",
  "runtime_control_enabled:false",
  "runtime_control_owner_approved:false",
  "token_invalidated:true",
  "payplus_api_key_configured:false",
  "payplus_secret_key_configured:false",
  "payplus_payment_page_uid_configured:false",
  "payment_link_created:false",
  "sandbox_sessions_created:0",
  "sandbox_success_proven:false",
  "sandbox_reject_proven:false",
  "status_observations:0",
  "accepted_paid_observations:0",
  "hunt_payment_live:false",
  "hunt_payplus_callback_accept_paid:false"
]) assert(receipt.includes(token),"M31 receipt missing: "+token);

for(const token of [
  "restapidev.payplus.co.il",
  'mode:"sandbox"',
  'send_failure_callback:true',
  'accepted_paid:false',
  'supplier_order_live:false',
  'M31_SANDBOX_EVIDENCE_DISABLED',
  'PAYPLUS_SANDBOX_CONFIG_MISSING'
]) assert(harness.includes(token),"M31 harness missing: "+token);

assert(!harness.includes("https://restapi.payplus.co.il/api/v1.0/PaymentPages/generateLink"));
assert(!harness.includes("hunt_payment_live"));
assert(!harness.includes("hunt_payplus_callback_accept_paid"));

console.log("boom_m31_payplus_sandbox_evidence_contract=PASS");