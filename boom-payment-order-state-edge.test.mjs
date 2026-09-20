import assert from "node:assert/strict";
import {transitionAllowed,assertTransition,liveFulfillmentBlockers,sandboxFulfillmentBlockers}
  from "./supabase/functions/_shared/hunt-payment-order-state.mjs";

assert.equal(transitionAllowed("payment","created","pending"),true);
assert.equal(transitionAllowed("payment","paid","pending"),false);
assert.equal(transitionAllowed("order","processing","shipped"),true);
assert.equal(transitionAllowed("order","shipped","processing"),false);
assert.equal(transitionAllowed("fulfillment","processing","failed"),true);
assert.doesNotThrow(()=>assertTransition("order","shipped","shipped"));
assert.throws(()=>assertTransition("order","shipped","processing"),/INVALID_ORDER_TRANSITION/);

assert.deepEqual(liveFulfillmentBlockers({
  payment_mode:"live",payment_status:"paid",commerce_truth:"PASS",shipping_complete:true,owner_gate:true
}),[]);
assert(liveFulfillmentBlockers({
  payment_mode:"sandbox",payment_status:"paid",commerce_truth:"PASS",shipping_complete:true,owner_gate:true
}).includes("LIVE_PAYMENT_SESSION_REQUIRED"));
assert.deepEqual(sandboxFulfillmentBlockers({
  sandbox_control:true,is_test:true,provider_sandbox:true
}),[]);

const fs=await import("node:fs");
const orchestrator=fs.readFileSync("supabase/functions/hunt-order-orchestrator/index.ts","utf8");
for(const needle of [
  'assertTransition("order",orderStatus,"exception")',
  'assertTransition("order",orderStatus,"shipped")',
  'assertTransition("fulfillment",sessionFulfillmentStatus,"failed")',
  'assertTransition("fulfillment",sessionFulfillmentStatus,"shipped")',
  "liveFulfillmentBlockers",
  "sandboxFulfillmentBlockers"
]) assert(orchestrator.includes(needle),"orchestrator missing "+needle);
assert(!orchestrator.includes('["paid","succeeded","completed"]'),"live payment gate must use canonical DB paid state only");
console.log("BOOM edge payment/order state: PASS — server-side transition guards match launch policy");