const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");

test("callback verifies signature and re-queries PayPlus before accepting evidence",()=>{
  const src=read("supabase/functions/hunt-payplus-callback/index.ts");
  assert.match(src,/verifyPayPlusCallbackHeaders/);
  assert.match(src,/verifyWithPayPlus\(session,payload\)/);
  assert.match(src,/PaymentPages\/ipn-full/);
  assert.match(src,/PAYPLUS_MORE_INFO_MISMATCH/);
  assert.match(src,/PAYPLUS_AMOUNT_MISMATCH/);
  assert.match(src,/PAYPLUS_CURRENCY_MISMATCH/);
  assert.match(src,/PAYPLUS_REQUEST_UID_MISMATCH/);
});

test("callback remains kill-switch gated and cannot write paid state",()=>{
  const src=read("supabase/functions/hunt-payplus-callback/index.ts");
  assert.match(src,/runtimeControl\("hunt_payplus_callback_accept_paid"\)/);
  assert.match(src,/PAID_ACCEPTANCE_KILL_SWITCH_OFF/);
  assert.match(src,/PROVIDER_STATUS_MAPPING_REQUIRES_SANDBOX_PROOF/);
  assert.doesNotMatch(src,/status\s*:\s*["']paid["']/i);
  assert.doesNotMatch(src,/paid_at\s*:/i);
  assert.doesNotMatch(src,/accepted_paid\s*:\s*true/i);
});

test("callback replay evidence is idempotent",()=>{
  const src=read("supabase/functions/hunt-payplus-callback/index.ts");
  assert.match(src,/onConflict:"payment_session_id,provider_event_id"/);
  assert.match(src,/onConflict:"provider,provider_event_id"/);
  assert.match(src,/ignoreDuplicates:true/);
});

test("sandbox evidence is sandbox-only and control-gated",()=>{
  const src=read("supabase/functions/hunt-payplus-sandbox-evidence/index.ts");
  assert.match(src,/hunt_payplus_sandbox_evidence/);
  assert.match(src,/restapidev\.payplus\.co\.il/);
  assert.match(src,/mode:"sandbox"/);
  assert.match(src,/accepted_paid:false/);
  assert.match(src,/payment_live:false/);
  assert.match(src,/supplier_order_live:false/);
  assert.doesNotMatch(src,/restapi\.payplus\.co\.il\/api\/v1\.0\/PaymentPages\/generateLink/);
});


test("sandbox evidence disables orphaned PayPlus links after persistence failure",()=>{
  const src=read("supabase/functions/hunt-payplus-sandbox-evidence/index.ts");
  assert.match(src,/PaymentPages\/Disable\//);
  assert.match(src,/disableLink\(link\.requestUid\)/);
  assert.match(src,/M31_SANDBOX_SESSION_UPDATE_FAILED_DISABLE_FAILED/);
});

test("sandbox evidence refuses success when evidence event storage fails",()=>{
  const src=read("supabase/functions/hunt-payplus-sandbox-evidence/index.ts");
  assert.match(src,/const \{error:eventError\}=await sb\.from\("hunt_payment_events"\)\.insert/);
  assert.match(src,/if\(eventError\)/);
  assert.match(src,/M31_SANDBOX_EVIDENCE_EVENT_STORE_FAILED/);
  assert.match(src,/provider_redirect_url:null/);
});
