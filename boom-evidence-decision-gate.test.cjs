const assert=require("node:assert");
const G=require("./boom-evidence-decision-gate.js");

const decision={
  primary_move:{code:"TEST_PAID",state:"TEST_CANDIDATE",why:"ready",next:"test"},
  lanes:{
    owned:{state:"TEST_CANDIDATE",reason:"owned",next:"run"},
    paid:{state:"TEST_CANDIDATE",reason:"paid",next:"run"},
    creator:{state:"PREPARE",reason:"prepare",next:"prepare"}
  },
  diagnostics:{can_scale:true},
  recommendations_only:true
};
const evidence={usable_domains:["product_source_freshness","verified_unit_economics","experiment_registry"],verified:3,missing:1,structural:0,stale:0};
const gated=G.apply(decision,evidence);
assert.strictEqual(gated.lanes.owned.state,"TEST_CANDIDATE");
assert.strictEqual(gated.lanes.paid.state,"EVIDENCE_HOLD");
assert.deepStrictEqual(gated.lanes.paid.evidence_missing,["paid_attribution"]);
assert.strictEqual(gated.primary_move.code,"COLLECT_EVIDENCE");
assert.strictEqual(gated.primary_move.state,"EVIDENCE_HOLD");
assert.strictEqual(gated.diagnostics.can_scale,false);
assert.strictEqual(gated.execute_actions,false);

const full={...evidence,usable_domains:[...evidence.usable_domains,"paid_attribution"]};
const pass=G.apply(decision,full);
assert.strictEqual(pass.lanes.paid.state,"TEST_CANDIDATE");
assert.strictEqual(pass.primary_move.code,"TEST_PAID");
assert.strictEqual(pass.diagnostics.can_scale,true);
console.log("boom_evidence_decision_gate=PASS");