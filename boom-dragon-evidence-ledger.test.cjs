const assert=require("node:assert/strict");
const L=require("./boom-dragon-evidence-ledger.js");
const state=L.prepare({runs:[
  {run_id:"1",status:"RUNNING",action_class:"OBSERVE",brain:"commerce_truth_brain",manager_id:"pricing-profit",evidence:{total:3,verified:false}},
  {run_id:"2",status:"COMPLETED",action_class:"PROPOSE",brain:"growth_brain",manager_id:"marketing-growth",evidence:{total:0,verified:false}}
]});
assert.equal(state.table,"boom_evidence");
assert.equal(state.persistence_enabled,false);
assert.equal(state.rows.length,1);
assert.equal(state.rows[0].confidence,"MEDIUM");
assert.equal(state.rows[0].persistence_state,"PREPARED_NOT_PERSISTED");
assert.equal(state.counts.verified,0);
console.log("DRAGON Evidence Ledger adapter tests: PASS");