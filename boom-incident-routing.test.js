const fs=require("fs");
const vm=require("vm");
const assert=require("assert");
const control=JSON.parse(fs.readFileSync("boom-automation-control-plane.json","utf8"));
const gateway=JSON.parse(fs.readFileSync("boom-tool-gateway.json","utf8"));
const source=fs.readFileSync("boom-automation-runtime.js","utf8");
const persisted=[];
const ledger={
  upsertRun:async r=>persisted.push(["run",r.workflow_id,r.run_id,r.parent_run_id||""]),
  appendEvent:async(r,e)=>persisted.push(["event",e,r.run_id]),
  appendIncidentEvent:async(r,e,d)=>persisted.push(["incident",e,r.run_id,d.failed_workflow_id]),
  ensureApproval:async()=>null,recordOwnerDecision:async()=>null
};
const win={BoomAutomationLedger:ledger,dispatchEvent:()=>true};
function CustomEvent(type,init){this.type=type;this.detail=init?.detail;}
const fetchFn=async p=>({ok:true,json:async()=>String(p).includes("tool-gateway")?gateway:control});
const g={crypto:{randomUUID:(()=>{let n=0;return()=>String(++n)})()}};
new Function("window","CustomEvent","fetch","globalThis","console",source)(win,CustomEvent,fetchFn,g,console);
(async()=>{
  const rt=win.BoomAutomationRuntime;await rt.ready();
  const run=await rt.createRun("shelf_coverage_17x1000",{missionId:"m1"});
  await rt.fail(run.run_id,"TEST_FAILURE").catch(()=>{});
  const incidents=rt.listRuns().filter(x=>x.workflow_id==="incident_repair");
  assert.equal(incidents.length,1);
  assert.equal(incidents[0].parent_run_id,run.run_id);
  assert.equal(incidents[0].state,"READY");
  await rt.routeFailureToIncident(rt.getRun(run.run_id),"TEST_FAILURE");
  assert.equal(rt.listRuns().filter(x=>x.workflow_id==="incident_repair").length,1,"duplicate incident created");
  assert(persisted.some(x=>x[0]==="incident"&&x[1]==="incident.detected"));
  console.log("BOOM incident routing: PASS — failure creates one linked READY incident, no auto-patch");
})().catch(e=>{console.error(e);process.exit(1);});
