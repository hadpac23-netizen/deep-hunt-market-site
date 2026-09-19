const assert=require("node:assert");
const M=require("./boom-payplus-sandbox-evidence.js");
const r=M.evaluate();

assert.strictEqual(r.state,"HARNESS_READY_CONFIG_BLOCKED");
assert.strictEqual(r.harness_safe,true);
assert.strictEqual(r.config_ready,false);
assert.strictEqual(r.sandbox_success_proven,false);
assert.strictEqual(r.sandbox_reject_proven,false);
assert.strictEqual(r.provider_status_mapping_ready,false);
assert.strictEqual(r.payment_link_created,false);
assert.strictEqual(r.accepted_paid,false);
assert.strictEqual(r.payments_live,false);
assert.strictEqual(r.execute_actions,false);
assert.strictEqual(r.receipt.sandbox_sessions_created,0);
assert.strictEqual(r.receipt.status_observations,0);

console.log("boom_payplus_sandbox_evidence=PASS");