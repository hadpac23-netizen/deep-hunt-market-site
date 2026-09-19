const fs=require("node:fs");
const assert=require("node:assert");
const s=fs.readFileSync("supabase/functions/hunt-payplus-sandbox-evidence/index.ts","utf8");

for(const token of [
  '"https://restapidev.payplus.co.il/api/v1.0/PaymentPages/generateLink"',
  '.eq("key","hunt_payplus_sandbox_evidence")',
  'mode:"sandbox"',
  'status:"created"',
  'currency:"ILS"',
  'const amount=1',
  'send_failure_callback:true',
  'allowed_charge_methods:["credit-card"]',
  'refURL_callback:BASE+"/functions/v1/hunt-payplus-callback"',
  'accepted_paid:false',
  'supplier_order_live:false'
]) assert(s.includes(token),"M31 harness missing: "+token);

assert(!s.includes("https://restapi.payplus.co.il/api/v1.0/PaymentPages/generateLink"));
assert(!s.includes("hunt_payment_live"));
assert(!s.includes("hunt_payplus_callback_accept_paid"));
console.log("boom_m31_sandbox_harness_contract=PASS");