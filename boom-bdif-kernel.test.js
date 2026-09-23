const assert=require("node:assert/strict");
const fs=require("node:fs");
const bdif=require("./boom-bdif-kernel.js");

const decision=JSON.parse(fs.readFileSync("boom-bdif-decision-contract.json","utf8"));
const truth=JSON.parse(fs.readFileSync("boom-bdif-truth-contract.json","utf8"));
const ledger=JSON.parse(fs.readFileSync("boom-bdif-ledger-map.json","utf8"));
const router=JSON.parse(fs.readFileSync("boom-bdif-model-router-map.json","utf8"));
const existingRouter=JSON.parse(fs.readFileSync("boom-ai-tool-router.json","utf8"));

assert.deepEqual(decision.statuses,["PASS","REVIEW","REJECT","UNKNOWN","ESCALATE"]);
assert.deepEqual(Object.keys(truth.states),["VERIFIED","PROVISIONAL","STALE","CONFLICTED","UNKNOWN"]);
assert.equal(ledger.schema_change_required,false);
assert.equal(router.router_reuse,"boom-ai-tool-router.json");
assert.equal(existingRouter.mode,"PLAN_ONLY");

const verified=(value,ref)=>({truth_state:"VERIFIED",value,evidence_refs:[ref]});
const baseFacts={
  product_identity:verified("p1","product"),
  exact_variant:verified("v1","variant"),
  stock:verified({quantity:10},"stock"),
  shipping:verified({supported:true,cost:5},"shipping"),
  destination_supported:verified(true,"country")
};

let r=bdif.evaluateHuntProductGate({
  decision_id:"d1",
  facts:{...baseFacts,shipping:{truth_state:"UNKNOWN",value:null,evidence_refs:[]}},
  require_economics:false
});
assert.equal(r.selected,"UNKNOWN");
assert(r.reasons.includes("EVIDENCE_UNKNOWN"));

r=bdif.evaluateHuntProductGate({
  decision_id:"d2",
  facts:{...baseFacts,stock:verified({quantity:0},"stock0")},
  require_economics:false
});
assert.equal(r.selected,"REJECT");
assert(r.reasons.includes("FULFILLMENT_FAIL"));

r=bdif.evaluateHuntProductGate({
  decision_id:"d3",
  facts:baseFacts,
  require_economics:true,
  economics:{inputs_verified:true,contribution_margin:0.2,margin_floor:0.3,evidence_refs:["econ"]}
});
assert.equal(r.selected,"REJECT");
assert(r.reasons.includes("MARGIN_FAIL"));

r=bdif.evaluateHuntProductGate({
  decision_id:"d4",
  facts:baseFacts,
  require_economics:true,
  economics:{inputs_verified:true,contribution_margin:0.35,margin_floor:0.3,evidence_refs:["econ"]}
});
assert.equal(r.selected,"PASS");
assert(r.evidence_refs.includes("econ"));

assert.equal(bdif.ownerGateRequired("production_deploy"),true);
assert.equal(bdif.ownerGateRequired("payment_activation"),true);
assert.equal(bdif.ownerGateRequired("read_only_truth_check"),false);

const j1={selected:"PASS",options:{PASS:0.8,REVIEW:0.2},evidence_refs:["j1"]};
const j2={selected:"REJECT",options:{REJECT:0.7,REVIEW:0.3},evidence_refs:["j2"]};
r=bdif.aggregateJudges([j1,j2],{decision_id:"mj1",risk:"HIGH",truth_quality:"VERIFIED"});
assert.equal(r.selected,"ESCALATE");
assert(r.reasons.includes("JUDGE_DISAGREEMENT"));

const j3={selected:"PASS",options:{PASS:0.7,REVIEW:0.3},evidence_refs:["j3"]};
r=bdif.aggregateJudges([j1,j3],{decision_id:"mj2",risk:"MEDIUM",truth_quality:"VERIFIED"});
assert.equal(r.selected,"PASS");
assert.equal(r.confidence_basis,"MULTI_JUDGE");
assert(Math.abs(r.options.PASS-0.75)<1e-12);

const perfect=[
  {actual:"PASS",options:{PASS:1}},
  {actual:"REJECT",options:{REJECT:1}}
];
assert.equal(bdif.brierScore(perfect),0);
assert.equal(bdif.expectedCalibrationError(perfect),0);

const sim=bdif.simulateUnitEconomics({
  revenue:10,supplier_cost:4,shipping_cost:2,payment_fees:1,
  return_cost:0,marketing_cost:0,other_variable_cost:0,evidence_refs:["base"]
},[
  {name:"EXPECTED",adjustments:{}},
  {name:"PESSIMISTIC",adjustments:{shipping_cost_pct:0.2}}
]);
assert.equal(sim.state,"SIMULATION");
assert.equal(sim.realized_profit,false);
assert.equal(sim.scenarios[0].contribution,3);
assert(Math.abs(sim.scenarios[1].contribution-2.6)<1e-12);

const unknownSim=bdif.simulateUnitEconomics({revenue:10},[]);
assert.equal(unknownSim.state,"UNKNOWN");
assert.equal(unknownSim.reason,"SIMULATION_INPUT_MISSING");

console.log("BDIF Decision Kernel: PASS");
