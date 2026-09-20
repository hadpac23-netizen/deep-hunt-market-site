const fs=require("fs");
const assert=require("assert");
const c=JSON.parse(fs.readFileSync("boom-commerce-handoff-contract.json","utf8"));
const actions=JSON.parse(fs.readFileSync("boom-action-contract.json","utf8"));
const checkoutAction=actions.actions.find(x=>x.action_id==="checkout.quote.verify");
assert.equal(checkoutAction.owner,"operations_brain");
assert.equal(checkoutAction.decision_owner,"commerce_truth_brain");
assert.equal(checkoutAction.hard_gate,"COMMERCE_TRUTH_PASS");
assert.equal(c.handoff.trigger_owner,"operations_brain");
assert.equal(c.handoff.decision_owner,"commerce_truth_brain");
assert.equal(c.handoff.execution_owner,"operations_brain");
assert.equal(c.handoff.required_status,"PASS");
const profit=c.stages.find(x=>x.id==="profit_recheck");
const payment=c.stages.find(x=>x.id==="payment_session");
const supplier=c.stages.find(x=>x.id==="supplier_order");
assert.equal(profit.owner,"commerce_truth_brain");
assert.equal(profit.fail_closed,true);
assert(payment.requires.includes("COMMERCE_TRUTH_PASS"));
assert(supplier.requires.includes("PAYMENT_CONFIRMED"));
assert(supplier.requires.includes("OWNER_GATE"));
assert.equal(supplier.autonomous_budget,0);

const paymentSrc=fs.readFileSync("supabase/functions/hunt-payment-session/index.ts","utf8");
for(const needle of [
  "evaluateCommerceProfit",
  "PROFIT_RECHECK_FAILED",
  "commerce_snapshot",
  'decision_owner:"commerce_truth_brain"',
  'execution_owner:"operations_brain"',
  'from("hunt_unit_economics").insert(economicsRows)'
]) assert(paymentSrc.includes(needle),"payment session missing "+needle);

const previewSrc=fs.readFileSync("supabase/functions/hunt-order-preview/index.ts","utf8");
const orderSrc=fs.readFileSync("supabase/functions/hunt-order-orchestrator/index.ts","utf8");
for(const [label,src] of [["order preview",previewSrc],["order orchestrator",orderSrc]]){
  for(const needle of [
    "COMMERCE_TRUTH_NOT_PASSED",
    "COMMERCE_DECISION_OWNER_INVALID",
    "COMMERCE_EVIDENCE_STALE",
    "LINE_PROFIT_GATE_NOT_PASSED"
  ]) assert(src.includes(needle),label+" missing "+needle);
}
assert(orderSrc.includes("LIVE_PAYMENT_SESSION_REQUIRED"));
assert(orderSrc.includes("PAYMENT_NOT_CONFIRMED"));
console.log("BOOM commerce handoff: PASS — Commerce Truth gates payment and supplier execution");