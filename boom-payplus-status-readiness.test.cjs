const assert=require("node:assert");
const P=require("./boom-payplus-status-readiness.js");

const r=P.evaluate();
assert.strictEqual(r.state,"CALLBACK_HARDENED");
assert.strictEqual(r.callback_hardened,true);
assert.strictEqual(r.sandbox_success_proven,false);
assert.strictEqual(r.sandbox_reject_proven,false);
assert.strictEqual(r.provider_status_mapping_ready,false);
assert.strictEqual(r.accepted_paid,false);
assert.strictEqual(r.payments_live,false);
assert.strictEqual(r.execute_actions,false);
assert.strictEqual(r.receipt.callback_version,9);
assert.strictEqual(r.receipt.fake_callback_http_status,401);
assert.strictEqual(r.receipt.observation_migration_version,"20260919144610");

console.log("boom_payplus_status_readiness=PASS");