const fs=require("fs");
const vm=require("vm");
const assert=require("assert");
const contract=JSON.parse(fs.readFileSync("boom-n8n-adapter-contract.json","utf8"));
const source=fs.readFileSync("boom-n8n-shadow-adapter.js","utf8");
const context={console,fetch:async()=>({ok:true,json:async()=>contract})};
context.window=context;
vm.createContext(context);
vm.runInContext(source,context,{filename:"boom-n8n-shadow-adapter.js"});

(async()=>{
  const a=context.BoomN8nShadowAdapter;
  const state=await a.ready();
  assert.equal(state.mode,"SHADOW");
  assert.equal(state.connected,false);
  assert.equal(state.authority,"NONE");

  const run={mission_id:"m1",workflow_id:"shelf_coverage_17x1000",run_id:"r1",correlation_id:"c1"};
  const plan=await a.planDispatch(run);
  assert.equal(plan.ok,true);
  assert.equal(plan.dispatch,false);
  assert.equal(plan.reason,"SHADOW_PLAN_ONLY");
  assert.equal(plan.envelope.mode,"SHADOW");

  const blocked=await a.planDispatch(run,{capability:"external_publish"});
  assert.equal(blocked.ok,false);
  assert.equal(blocked.reason,"CAPABILITY_BLOCKED");

  const wrong=await a.planDispatch({...run,workflow_id:"creative_publish"});
  assert.equal(wrong.ok,false);
  assert.equal(wrong.reason,"WORKFLOW_NOT_ALLOWLISTED");

  console.log("BOOM n8n shadow adapter: PASS — plan-only, one read-only workflow, blocked material capabilities");
})().catch(e=>{console.error(e);process.exit(1);});
