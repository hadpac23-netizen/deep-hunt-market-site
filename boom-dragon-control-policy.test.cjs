const fs=require("fs"),assert=require("node:assert/strict");
const C=require("./boom-dragon-control-plane.js");
const managers=JSON.parse(fs.readFileSync("boom-manager-registry.json","utf8"));
const fusion=JSON.parse(fs.readFileSync("boom-dragon-fusion-registry.json","utf8"));
const policy=JSON.parse(fs.readFileSync("boom-dragon-control-policy.json","utf8"));

const brains=fusion.brains.map(x=>x.id);
assert.equal(brains.length,8);
assert(brains.every(id=>Array.isArray(policy.brain_grants[id])));
assert.equal(policy.budget_policy.external_spend_usd,0);
assert.equal(policy.budget_policy.paid_browser_usd,0);
assert.equal(policy.budget_policy.paid_media_usd,0);
assert.equal(policy.budget_policy.paid_generation_usd,0);

for(const id of [
  "production_deploy","payment_charge","supplier_live_order",
  "campaign_publish","external_message","live_price_change","permission_change"
]){
  const t=policy.tool_classes.find(x=>x.id===id);
  assert(t,id+" missing");
  assert.equal(t.owner_gate,true,id+" must be owner gated");
}

const state=C.compileSnapshot({
  commands:[
    {id:"safe",target_manager_id:"pricing-profit",status:"running",action_class:"OBSERVE",tool_class:"pricing_compute"},
    {id:"deploy",target_manager_id:"release-control",status:"running",action_class:"STAGE_FIX",tool_class:"production_deploy"},
    {id:"charge",target_manager_id:"checkout-payment",status:"accepted",action_class:"PROPOSE",tool_class:"payment_charge"}
  ],
  workerReports:[],reports:[],workers:[]
},managers,fusion,policy);

const safe=state.runs.find(x=>x.run_id==="safe");
const deploy=state.runs.find(x=>x.run_id==="deploy");
const charge=state.runs.find(x=>x.run_id==="charge");
assert(safe.permissions.tool_classes.includes("pricing_compute"));
assert.equal(safe.owner_gate.required,false);
assert.equal(deploy.owner_gate.required,true);
assert.equal(charge.owner_gate.required,true);
assert([safe,deploy,charge].every(x=>x.execution_mode==="SHADOW_ONLY"));
assert.equal(state.readiness.permissions,"READY_SHADOW");
assert.equal(state.readiness.scheduler,"INVENTORIED");
assert.equal(state.readiness.budgets,"ZERO_EXTERNAL_SPEND_DEFAULT");
assert(!state.gaps.includes("TOOL_PERMISSION_MAP_NOT_CANONICAL"));
assert(!state.gaps.includes("MISSION_BUDGETS_NOT_WIRED"));

console.log("DRAGON Control Policy regression: PASS");