const fs=require("fs");
const vm=require("vm");
const assert=require("assert");
const control=JSON.parse(fs.readFileSync("boom-automation-control-plane.json","utf8"));
const gateway=JSON.parse(fs.readFileSync("boom-tool-gateway.json","utf8"));
const source=fs.readFileSync("boom-automation-runtime.js","utf8");

const events=[];
const context={
  console,
  crypto:{randomUUID:(()=>{let n=0;return()=>String(++n).padStart(4,"0")})()},
  CustomEvent:function(type,init){this.type=type;this.detail=init?.detail;},
  fetch:async path=>({ok:true,json:async()=>String(path).includes("tool-gateway")?gateway:control}),
  dispatchEvent:e=>{events.push(e);return true;}
};
context.window=context;
context.globalThis=context;
vm.createContext(context);
vm.runInContext(source,context,{filename:"boom-automation-runtime.js"});

(async()=>{
  const rt=context.BoomAutomationRuntime;
  const ready=await rt.ready();
  assert.equal(ready.mode,"SHADOW");

  const creative=await rt.createRun("creative_publish",{missionId:"m-creative"});
  assert.equal(creative.state,"READY");
  const blockedCreative=await rt.simulate(creative.run_id);
  assert.equal(blockedCreative.state,"BLOCKED");
  assert(blockedCreative.blockers.includes("PRODUCT_TRUTH_LIVE_REQUIRED"));
  assert(blockedCreative.blockers.includes("EXACT_REFERENCES_LOCKED_REQUIRED"));
  assert(blockedCreative.blockers.includes("PROOF_CLAIMS_BOUNDARY_REQUIRED"));
  await rt.updateRunInput(creative.run_id,{
    product_truth_live:true,
    exact_references_locked:true,
    proof_claims_boundary_reviewed:true
  });
  const waiting=await rt.simulate(creative.run_id);
  assert.equal(waiting.state,"WAITING_OWNER");
  assert.equal(waiting.material_action_suppressed,true);
  const approved=await rt.ownerDecision(creative.run_id,true);
  assert.equal(approved.state,"SUCCEEDED");
  assert.equal(approved.material_action_suppressed,true);

  const shelf=await rt.createRun("shelf_coverage_17x1000",{missionId:"m-shelf"});
  const shelfDone=await rt.simulate(shelf.run_id);
  assert.equal(shelfDone.state,"SUCCEEDED");

  const publish=await rt.authorizeTool("publish.external",{ownerApproved:true});
  assert.equal(publish.ok,false);
  assert.equal(publish.reason,"SHADOW_BLOCKED");

  const read=await rt.authorizeTool("catalog.verified_counts.read");
  assert.equal(read.ok,true);
  assert.equal(read.material,false);

  const customer=await rt.createRun("customer_lifecycle");
  let live=await rt.simulate(customer.run_id);
  assert.equal(live.state,"BLOCKED");
  await rt.updateRunInput(customer.run_id,{
    identity_policy_ready:true,
    privacy_consent_ready:true,
    event_source_verified:true
  });
  live=await rt.simulate(customer.run_id);
  assert.equal(live.state,"WAITING_OWNER");

  assert(events.some(e=>e.detail?.event==="automation.run.created"));
  console.log("BOOM automation runtime: PASS — evidence preflight, owner gate, material suppression and tool allowlist verified");
})().catch(e=>{console.error(e);process.exit(1);});
