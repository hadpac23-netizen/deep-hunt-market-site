const fs=require("fs"),assert=require("node:assert/strict");
const C=require("./boom-dragon-control-plane.js");
const managers=JSON.parse(fs.readFileSync("boom-manager-registry.json","utf8"));
const fusion=JSON.parse(fs.readFileSync("boom-dragon-fusion-registry.json","utf8"));
const studio=fs.readFileSync("boom-ai-studio.js","utf8");
const html=fs.readFileSync("boom-ai-studio.html","utf8");
const preview=fs.readFileSync("dragon-core-preview.html","utf8");
const core=fs.readFileSync("boom-dragon-core.js","utf8");

const a=studio.indexOf("function publishControlPlaneRuntimeSnapshot()");
const b=studio.indexOf("async function loadAll()",a);
assert(a>=0&&b>a);
const helper=studio.slice(a,b);
assert(!helper.includes("instruction:"));
assert(!helper.includes("body:"));
assert(!/token|secret|password/i.test(helper));
assert(helper.includes("one_runtime_client:true"));
assert(helper.includes('boom:studio-runtime-snapshot'));

const ids=[...(managers.managers||[]),...(managers.departments||[])].map(x=>x.id);
assert.equal(ids.filter(id=>C.brainForManager(id)==="UNMAPPED").length,0);

const runtime={
  workers:[],
  workerReports:[],
  reports:[],
  commands:[
    {id:"run-1",target_manager_id:"release-control",status:"waiting_owner",action_class:"OWNER_APPROVAL",evidence_count:2},
    {id:"run-2",target_manager_id:"repair-engineering",status:"failed",action_class:"STAGE_FIX",retry_count:1}
  ]
};
const state=C.compileSnapshot(runtime,managers,fusion);
assert.equal(state.mode,"SHADOW_ONLY");
assert.equal(state.execution_enabled,false);
assert.equal(state.one_runtime_client,true);
assert.equal(state.derived_queue,true);
assert.equal(state.runs[0].owner_gate.required,true);
assert.equal(state.runs[0].owner_gate.approved,false);
assert.equal(state.runs[1].retry.decision,"PROPOSE_RETRY");
assert.equal(state.runs[1].retry.circuit_breaker,"CLOSED_SHADOW");
assert.equal(state.runs[1].handoff.schema,"BOOM_HANDOFF_V1");
assert.equal(state.runs[1].permissions.execution_enabled,false);

assert(html.includes("boom-dragon-control-plane.js"));
assert(html.includes("boom-dragon-control-plane-ui.js"));
assert(preview.includes("boom-dragon-control-plane-ui.js"));
assert(core.includes('["Control Plane","Derived runs · routing · leases · handoff","SHADOW"]'));
assert.equal(fusion.control_plane_v1.status,"SHADOW_CONNECTED");
assert.equal(fusion.control_plane_v1.execution_enabled,false);
assert.equal(fusion.control_plane_v1.second_runtime_client_created,false);

console.log("BOOM DRAGON Control Plane integration regression: PASS");