const assert=require("assert");
const S=require("./boom-payment-order-state.js");

assert.equal(S.allowed("payment","created","pending"),true);
assert.equal(S.allowed("payment","pending","paid"),true);
assert.equal(S.allowed("payment","paid","pending"),false);
assert.equal(S.allowed("order","processing","shipped"),true);
assert.equal(S.allowed("order","shipped","processing"),false);
assert.equal(S.allowed("fulfillment","processing","shipped"),true);
assert.equal(S.allowed("pipeline","tracking_verified","completed"),true);
assert.throws(()=>S.assertTransition("payment","paid","pending"),/INVALID_PAYMENT_TRANSITION/);

let gate=S.liveFulfillmentGate({
  payment_mode:"live",payment_status:"paid",commerce_truth:"PASS",
  shipping_complete:true,owner_gate:true
});
assert.equal(gate.ok,true);

gate=S.liveFulfillmentGate({
  payment_mode:"live",payment_status:"pending",commerce_truth:"PASS",
  shipping_complete:true,owner_gate:true
});
assert.equal(gate.ok,false);
assert(gate.blockers.includes("PAYMENT_NOT_CONFIRMED"));

let sbx=S.sandboxFulfillmentGate({sandbox_control:true,is_test:true,provider_sandbox:true});
assert.equal(sbx.ok,true);
sbx=S.sandboxFulfillmentGate({sandbox_control:true,is_test:false,provider_sandbox:true});
assert.equal(sbx.ok,false);
assert(sbx.blockers.includes("SANDBOX_ORDER_MUST_BE_TEST"));

console.log("BOOM payment/order state: PASS — forward-only transitions and live/sandbox gates enforced");