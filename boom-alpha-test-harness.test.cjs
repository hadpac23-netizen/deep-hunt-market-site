const assert=require("node:assert");
const H=require("./boom-alpha-test-harness.js");

assert(H.enginesReady(),"A8 engines must be available");
const all=H.runAll();
assert.equal(all.mode,"A8_ALPHA_TEST_HARNESS");
assert.equal(all.total,4);
assert.equal(all.passed,4);
assert.equal(all.harness_pass,true);
assert.equal(all.production_ready,false);
assert.equal(all.owner_gate,"OWNER_REVIEW_REQUIRED");
assert.equal(all.invariants.production_changed,false);
assert.equal(all.invariants.execution_allowed,false);
assert.equal(all.invariants.supplier_calls,0);
assert.equal(all.invariants.ai_provider_calls,0);
assert.equal(all.invariants.spend_authorized,false);
assert.equal(all.invariants.publishing_authorized,false);

const happy=all.scenarios.find(x=>x.id==="happy_path");
assert(happy.actual_ready,"Happy path should reach Owner review readiness");
assert.equal(happy.blocked.length,0);
assert(happy.stages.every(x=>x.pass),"Happy path A1-A6 must pass");

const truth=all.scenarios.find(x=>x.id==="truth_block");
assert.equal(truth.actual_ready,false);
assert(truth.blocked.includes("A1"),"Truth failure must block A1");

const privacy=all.scenarios.find(x=>x.id==="privacy_block");
assert.equal(privacy.actual_ready,false);
assert(privacy.blocked.includes("A5"),"Privacy failure must block A5");

const creative=all.scenarios.find(x=>x.id==="creative_proof_block");
assert.equal(creative.actual_ready,false);
assert(creative.blocked.includes("A6"),"Creative proof failure must block A6");

console.log("boom_alpha_test_harness=PASS 4/4");
