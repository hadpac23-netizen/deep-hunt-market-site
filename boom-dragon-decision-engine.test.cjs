const assert=require("node:assert/strict");
const Engine=require("./boom-dragon-decision-engine.js");

const launch=[
  {gate_key:"deployment_sync",status:"FAIL",blocks_real_money:true,next_action:"Fix deploy sync",updated_at:"2026-09-24T09:00:00Z"},
  {gate_key:"catalog_structure",status:"PASS",blocks_real_money:false,updated_at:"2026-09-24T09:00:00Z"}
];

const hold=Engine.assess({
  product:{status:"PREP",stale:true,generated_at:"2026-09-14T00:00:00Z"},
  journey:{status:"STALE",stale:true,mode:"SERVER_TRUTH",purchase_truth:{buyer_ready:true}},
  profit:null,
  content:{status:"PREP",counts:{creative_drafts:96},readiness:{winner_eligible:false}},
  launch_gates:launch
});
assert.equal(hold.status,"HOLD");
assert.equal(hold.hard_gates.blocked,true);
assert.equal(hold.next_action.target,"deployment_sync");
assert.equal(hold.execution_mode,"SHADOW_ONLY");
assert.equal(hold.persisted,false);
assert.notEqual(hold.readiness_score,hold.confidence);

const ready=Engine.assess({
  product:{status:"READY",stale:false,live:true,generated_at:new Date().toISOString()},
  journey:{status:"READY",stale:false,mode:"SERVER_TRUTH",purchase_truth:{buyer_ready:true},generated_at:new Date().toISOString()},
  profit:{status:"REALIZED_FINAL",realized:true},
  content:{status:"LEARNING_READY",readiness:{winner_eligible:true},generated_at:new Date().toISOString()},
  launch_gates:[
    {gate_key:"a",status:"PASS",blocks_real_money:true,updated_at:new Date().toISOString()},
    {gate_key:"b",status:"PASS",blocks_real_money:false,updated_at:new Date().toISOString()}
  ]
});
assert.equal(ready.status,"READY");
assert.equal(ready.readiness_score,100);
assert.equal(ready.owner_gate_required,true);
assert.equal(ready.next_action.action_class,"OWNER_REVIEW");

const record=Engine.prepareDecisionRecord(hold);
assert.equal(record.owner_approval_required,false);
assert.equal(record.result.execution_mode,"SHADOW_ONLY");
assert.equal(record.result.persisted,false);

console.log("DRAGON Decision Engine tests: PASS");