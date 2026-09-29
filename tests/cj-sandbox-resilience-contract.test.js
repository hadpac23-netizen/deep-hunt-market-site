const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const src=fs.readFileSync(path.resolve(__dirname,"../supabase/functions/hunt-order-orchestrator/index.ts"),"utf8");

test("CJ sandbox normalizes Israeli phone numbers to +972",()=>{
  assert.match(src,/if\(country==="IL"\)/);
  assert.match(src,/if\(digits\.startsWith\("972"\)\)return "\+"\+digits/);
  assert.match(src,/return "\+972"\+digits\.slice\(1\)/);
  assert.match(src,/shippingPhone:normalizeShippingPhone\(country,shipping\.shippingPhone\)/);
});

test("CJ server-busy failures are transient, retried, and reconciled",()=>{
  assert.match(src,/code==="1603000"/);
  assert.match(src,/message\.includes\("server is busy"\)/);
  assert.match(src,/message\.includes\("try again later"\)/);
  assert.match(src,/maxAttempts=Math\.max\(1,Math\.min\(5/);
  assert.match(src,/cjGetOrderByStoreNumber\(options\.reconcileOrderNumber\)/);
  assert.match(src,/Reconciled existing CJ order after ambiguous create/);
});

test("stale CJ sandbox submissions recover instead of staying processing forever",()=>{
  assert.match(src,/currentSupplierStatus==="sandbox_submitting"/);
  assert.match(src,/SANDBOX_SUBMIT_STALE_MS/);
  assert.match(src,/STALE_SANDBOX_SUBMIT_REOPENED/);
  assert.match(src,/FULFILLMENT_RECONCILE_STORE_FAILED/);
  assert.match(src,/SANDBOX_RETRY_LIMIT_REACHED/);
});
