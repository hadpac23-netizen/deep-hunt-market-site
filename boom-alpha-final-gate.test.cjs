const assert=require("node:assert");
const Gate=require("./boom-alpha-final-gate.js");

const qa={
  rc_qa_pass:true,a12_eligible:true,passed:31,total:31,
  groups:[
    {pass:true},{pass:true},{pass:true},{pass:true},{pass:true},{pass:true},{pass:true}
  ]
};
const preview={
  preview_ready:true,
  production_ready:false,
  payments_activated:false,
  order_routing_activated:false,
  journey:[{ready:true},{ready:true},{ready:true},{ready:true},{ready:true},{ready:true}],
  devices:[{width:390},{width:768},{width:1280},{width:1440}]
};
const evidencePack={
  owner_review_ready:true,
  release_gate:"ALPHA_OWNER_REVIEW_READY",
  production_ready:false,
  evidence_fingerprint:"A9-TEST1234"
};

const gate=Gate.build({qa,preview,evidencePack});
assert.equal(gate.mode,"A12_FINAL_OWNER_GO_NO_GO_GATE");
assert.equal(gate.final_gate_ready,true);
assert.equal(gate.decision_status,Gate.DECISIONS.PENDING);
assert.equal(gate.owner_decision_required,true);
assert(gate.allowed_decisions.includes(Gate.DECISIONS.GO));
assert(gate.allowed_decisions.includes(Gate.DECISIONS.NO_GO));
assert.equal(gate.merge_authorized,false);
assert.equal(gate.production_activation_authorized,false);
assert.equal(Gate.verifyBoundaries(gate).valid,true);

const go=Gate.recordDecision(gate,Gate.DECISIONS.GO);
assert.equal(go.decision_recorded,true);
assert.equal(go.decision_status,Gate.DECISIONS.GO);
assert.equal(go.merge_authorized,false);
assert.equal(go.private_alpha_activation_authorized,false);
assert.equal(go.production_activation_authorized,false);
assert.equal(go.payments_activated,false);
assert.equal(go.order_routing_activated,false);
assert.equal(Gate.verifyBoundaries(go).valid,true);

const noGo=Gate.recordDecision(gate,Gate.DECISIONS.NO_GO);
assert.equal(noGo.decision_recorded,true);
assert.equal(noGo.decision_status,Gate.DECISIONS.NO_GO);
assert.equal(noGo.merge_authorized,false);

const blocked=Gate.build({qa:{...qa,rc_qa_pass:false,a12_eligible:false,passed:30},preview,evidencePack});
assert.equal(blocked.final_gate_ready,false);
assert(!blocked.allowed_decisions.includes(Gate.DECISIONS.GO));
assert(blocked.allowed_decisions.includes(Gate.DECISIONS.NO_GO));
assert(blocked.blockers.includes("A11_RC_QA_NOT_PASSED"));

const invalid=Gate.recordDecision(blocked,Gate.DECISIONS.GO);
assert.equal(invalid.decision_recorded,false);
assert.equal(invalid.decision_status,Gate.DECISIONS.PENDING);
assert.equal(invalid.decision_error,"DECISION_NOT_ALLOWED");

const tampered=Gate.verifyBoundaries({...gate,production_activation_authorized:true});
assert.equal(tampered.valid,false);
assert(tampered.issues.includes("PRODUCTION_ACTIVATION_MUST_BE_FALSE"));

console.log("boom_alpha_final_gate=PASS");
