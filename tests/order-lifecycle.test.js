const test=require("node:test");
const assert=require("node:assert/strict");

test("order lifecycle allows normal forward progress and explicit exception recovery",async()=>{
  const mod=await import("../supabase/functions/_shared/order-lifecycle.mjs");
  for(const [from,to] of [
    ["placed","processing"],
    ["processing","shipped"],
    ["shipped","out_for_delivery"],
    ["out_for_delivery","delivered"],
    ["delivered","returned"],
    ["returned","refunded"],
    ["processing","exception"],
    ["exception","processing"],
    ["exception","refunded"]
  ]) assert.equal(mod.assertTransition("order",from,to),true);
});

test("order lifecycle rejects impossible jumps",async()=>{
  const mod=await import("../supabase/functions/_shared/order-lifecycle.mjs");
  assert.throws(()=>mod.assertTransition("order","placed","delivered"),/ORDER_TRANSITION_INVALID/);
  assert.throws(()=>mod.assertTransition("order","refunded","processing"),/ORDER_TRANSITION_INVALID/);
  assert.throws(()=>mod.assertTransition("fulfillment","queued","shipped"),/FULFILLMENT_TRANSITION_INVALID/);
  assert.throws(()=>mod.assertTransition("payment","prelaunch","paid"),/PAYMENT_TRANSITION_INVALID/);
});

test("fulfillment supports hold/failure and controlled retry",async()=>{
  const mod=await import("../supabase/functions/_shared/order-lifecycle.mjs");
  for(const [from,to] of [
    ["queued","processing"],
    ["processing","submitted"],
    ["submitted","shipped"],
    ["shipped","delivered"],
    ["processing","failed"],
    ["failed","processing"],
    ["processing","hold"],
    ["hold","processing"]
  ]) assert.equal(mod.assertTransition("fulfillment",from,to),true);
});

test("refund eligibility requires paid payment, refundable order, bounded amount and same currency",async()=>{
  const mod=await import("../supabase/functions/_shared/order-lifecycle.mjs");
  const ok=mod.refundEligibility({
    payment_status:"paid",order_status:"delivered",
    total_amount:100,refund_amount:25,currency:"USD",refund_currency:"USD"
  });
  assert.equal(ok.eligible,true);
  assert.deepEqual(ok.blockers,[]);

  const bad=mod.refundEligibility({
    payment_status:"pending",order_status:"placed",
    total_amount:100,refund_amount:150,currency:"USD",refund_currency:"EUR"
  });
  assert.equal(bad.eligible,false);
  assert.ok(bad.blockers.includes("PAYMENT_NOT_PAID"));
  assert.ok(bad.blockers.includes("ORDER_STATUS_NOT_REFUNDABLE"));
  assert.ok(bad.blockers.includes("REFUND_EXCEEDS_PAYMENT"));
  assert.ok(bad.blockers.includes("REFUND_CURRENCY_MISMATCH"));
});
