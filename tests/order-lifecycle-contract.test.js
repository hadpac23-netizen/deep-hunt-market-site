const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");

test("orchestrator accepts normalized checkout shipping snapshot and legacy keys",()=>{
  const src=read("supabase/functions/hunt-order-orchestrator/index.ts");
  for(const token of [
    "raw.shippingCustomerName||raw.customer_name",
    "raw.shippingAddress||raw.address1",
    "raw.shippingCity||raw.city",
    "raw.shippingProvince||raw.province",
    "raw.shippingZip||raw.postal_code",
    "raw.shippingPhone||raw.phone",
    "raw.shippingCountryCode||raw.country_code||sessionCountry"
  ]) assert.match(src,new RegExp(token.replace(/[.*+?^$()|[\]{}\\]/g,"\\$&")));
});

test("orchestrator propagates supplier failure into fulfillment/order/session exception states",()=>{
  const src=read("supabase/functions/hunt-order-orchestrator/index.ts");
  assert.match(src,/status:"failed"/);
  assert.match(src,/status:"exception"/);
  assert.match(src,/fulfillment_status:"failed"/);
  assert.match(src,/sandbox_create_failed/);
  assert.match(src,/SANDBOX_RETRY_LIMIT_REACHED/);
});

test("orchestrator enforces lifecycle transitions before writes",()=>{
  const src=read("supabase/functions/hunt-order-orchestrator/index.ts");
  assert.match(src,/assertTransition\("fulfillment"/);
  assert.match(src,/assertTransition\("order"/);
});

test("refund preview has no provider execution or state mutation",()=>{
  const src=read("supabase/functions/hunt-refund-preview/index.ts");
  assert.match(src,/refundEligibility/);
  assert.match(src,/REFUND_PROVIDER_EXECUTION_DISABLED/);
  assert.match(src,/refund_live:false/);
  assert.match(src,/ready_for_live_refund:false/);
  assert.doesNotMatch(src,/restapi.*payplus/i);
  assert.doesNotMatch(src,/\.update\(/);
  assert.doesNotMatch(src,/\.insert\(/);
  assert.doesNotMatch(src,/\.upsert\(/);
});


test("CJ reconciliation accepts only an exact HUNT order-number match",()=>{
  const src=read("supabase/functions/hunt-order-orchestrator/index.ts");
  assert.match(src,/return exact\|\|null;/);
  assert.doesNotMatch(src,/list\.length===1\?list\[0\]:null/);
});

test("CJ calls have timeouts and stale sandbox submissions can recover",()=>{
  const src=read("supabase/functions/hunt-order-orchestrator/index.ts");
  assert.match(src,/CJ_FETCH_TIMEOUT_MS=12000/);
  assert.match(src,/AbortSignal\.timeout\(CJ_FETCH_TIMEOUT_MS\)/);
  assert.match(src,/SANDBOX_SUBMIT_STALE_MS/);
  assert.match(src,/currentSupplierStatus==="sandbox_submitting"/);
  assert.match(src,/cjGetOrderByStoreNumber\(supplierCode\)/);
  assert.match(src,/STALE_SANDBOX_SUBMIT_REOPENED/);
  assert.match(src,/FULFILLMENT_RECONCILE_STORE_FAILED/);
});

test("failed sandbox retry reopens exception order before shipping",()=>{
  const src=read("supabase/functions/hunt-order-orchestrator/index.ts");
  assert.match(src,/reopenOrderIfException/);
  assert.match(src,/assertTransition\("order","exception","processing"\)/);
  assert.match(src,/\.eq\("status","exception"\)/);
  assert.match(src,/order=await reopenOrderIfException\(ctx,order\)/);
  assert.match(src,/order=\{\.\.\.order,status:"exception"\}/);
});
