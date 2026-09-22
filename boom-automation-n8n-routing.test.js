const fs=require("fs");
const vm=require("vm");
const assert=require("assert");
const control=JSON.parse(fs.readFileSync("boom-automation-control-plane.json","utf8"));
const gateway=JSON.parse(fs.readFileSync("boom-tool-gateway.json","utf8"));
const source=fs.readFileSync("boom-automation-runtime.js","utf8");
const events=[];
const persisted=[];
const mockLedger={
  upsertRun:async r=>{persisted.push(["run",r.run_id,r.state]);},
  appendEvent:async(r,e,d)=>{persisted.push(["event",e,d]);},
  ensureApproval:async()=>null,
  recordOwnerDecision:async()=>null
};
const mockN8n={
  dispatchShadow:async(run,payload)=>({ok:true,state:"DISPATCHED_SHADOW",run_id:run.run_id,echo:payload})
};
const win={BoomAutomationLedger:mockLedger,BoomN8nAdapter:mockN8n,dispatchEvent:e=>{events.push(e);return true;}};
function CustomEvent(type,init){this.type=type;this.detail=init?.detail;}
const fetchFn=async path=>({ok:true,json:async()=>String(path).includes("tool-gateway")?gateway:control});
const globalThisMock={crypto:{randomUUID:(()=>{let n=0;return()=>String(++n)})()}};
new Function("window","CustomEvent","fetch","globalThis","console",source)(win,CustomEvent,fetchFn,globalThisMock,console);
(async()=>{
  const rt=win.BoomAutomationRuntime;
  await rt.ready();
  const shelf=await rt.createRun("shelf_coverage_17x1000",{missionId:"m-shelf"});
  const sent=await rt.dispatchAdapter(shelf.run_id,{audit_reason:"test"});
  assert.equal(sent.adapter_result.state,"DISPATCHED_SHADOW");
  assert.equal(sent.run.state,"RUNNING");
  const creative=await rt.createRun("creative_publish",{missionId:"m-creative"});
  let blocked=false;
  try{await rt.dispatchAdapter(creative.run_id,{})}catch(e){blocked=e.code==="WORKFLOW_NOT_ALLOWLISTED";}
  assert(blocked,"material workflow must never dispatch to n8n v1");
  assert(persisted.some(x=>x[0]==="event"&&x[1]==="automation.n8n.dispatched"));
  console.log("BOOM n8n routing: PASS — shelf only, material workflow blocked");
})().catch(e=>{console.error(e);process.exit(1);});
