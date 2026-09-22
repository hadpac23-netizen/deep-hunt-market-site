const fs=require("fs"),assert=require("assert");
const c=JSON.parse(fs.readFileSync("boom-customer-lifecycle-contract.json","utf8"));
assert.equal(c.brain,"operations_brain");
assert.equal(c.action_classes.customer_outreach.owner_gate,true);
assert.equal(c.action_classes.refund_or_order_mutation.owner_gate,true);
assert.equal(c.privacy.ledger_pii,"FORBIDDEN");
assert.equal(c.boundaries.outreach,false);
console.log("Customer lifecycle contract: PASS — privacy, read truth, material actions gated");