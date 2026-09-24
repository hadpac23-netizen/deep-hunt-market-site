const fs=require("fs"),assert=require("node:assert/strict");
const C=require("./boom-dragon-control-plane.js");
const managers=JSON.parse(fs.readFileSync("boom-manager-registry.json","utf8"));
const fusion=JSON.parse(fs.readFileSync("boom-dragon-fusion-registry.json","utf8"));

const runtime={
  managers:managers.managers,
  workers:[{id:"w1",manager_id:"pricing-profit"}],
  workerReports:[{worker_id:"w1",manager_id:"pricing-profit",evidence_count:2}],
  reports:[{manager_id:"pricing-profit",evidence_count:1}],
  commands:[
    {id:"c1",title:"Check profit",target_manager_id:"pricing-profit",status:"running",action_class:"OBSERVE",priority:3,evidence_count:1,created_at:"2026-09-24T10:00:00Z"},
    {id:"c2",title:"Deploy",target_manager_id:"release-control",status:"waiting_owner",action_class:"OWNER_APPROVAL",priority:5,evidence_count:3,created_at:"2026-09-24T10:05:00Z"},
    {id:"c3",title:"Repair",target_manager_id:"repair-engineering",status:"failed",action_class:"STAGE_FIX",retry_count:1,created_at:"2026-09-24T10:10:00Z"}
  ]
};
const s=C.compileSnapshot(runtime,managers,fusion);
assert.equal(s.schema,"BOOM_CONTROL_PLANE_V1");
assert.equal(s.mode,"SHADOW_ONLY");
assert.equal(s.execution_enabled,false);
assert.equal(s.one_runtime_client,true);
assert.equal(s.derived_queue,true);
assert.equal(s.unmapped_managers.length,0);
assert.equal(s.readiness.routing,"READY");
assert.equal(s.readiness.execution,"OFF");
assert.equal(s.queue.waiting_owner,1);
assert.equal(s.queue.blocked,1);

const profit=s.runs.find(x=>x.run_id==="c1");
assert.equal(profit.brain,"commerce_truth_brain");
assert.equal(profit.evidence.total,4);
assert.equal(profit.evidence.verified,false);
assert.equal(profit.lease.execution_enabled,false);

const deploy=s.runs.find(x=>x.run_id==="c2");
assert.equal(deploy.brain,"learning_governance_brain");
assert.equal(deploy.owner_gate.required,true);
assert.equal(deploy.owner_gate.approved,false);
assert.equal(deploy.execution_mode,"SHADOW_ONLY");

const failed=s.runs.find(x=>x.run_id==="c3");
assert.equal(failed.retry.decision,"PROPOSE_RETRY");
assert.equal(failed.retry.circuit_breaker,"CLOSED_SHADOW");
assert.equal(failed.handoff.schema,"BOOM_HANDOFF_V1");

console.log("DRAGON Control Plane V1 tests: PASS");