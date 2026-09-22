const fs=require("fs");
const vm=require("vm");
const assert=require("assert");
const source=fs.readFileSync("boom-n8n-adapter.js","utf8");
const invocations=[];
const db={functions:{invoke:async(name,args)=>{invocations.push([name,args]);return {data:{ok:true,state:"DISPATCHED_SHADOW"},error:null};}}};
const ctx={window:{BoomRuntime:{adminReady:async()=>({ok:true}),getSupabaseClient:()=>db}}};
vm.createContext(ctx);
vm.runInContext(source,ctx,{filename:"boom-n8n-adapter.js"});
(async()=>{
  const a=ctx.window.BoomN8nAdapter;
  assert.equal(a.status().authority,"NONE");
  let blocked=false;
  try{await a.dispatchShadow({workflow_id:"creative_publish",run_id:"r",mission_id:"m",correlation_id:"c"});}catch(e){blocked=e.code==="WORKFLOW_NOT_ALLOWLISTED";}
  assert(blocked,"material workflow must be blocked");
  const ok=await a.dispatchShadow({workflow_id:"shelf_coverage_17x1000",run_id:"r",mission_id:"m",correlation_id:"c"},{department:"women"});
  assert.equal(ok.state,"DISPATCHED_SHADOW");
  assert.equal(invocations[0][0],"boom-automation-gateway");
  assert.equal(invocations.length,1);
  console.log("BOOM n8n adapter: PASS — admin gateway only, first workflow allowlisted, material workflows blocked");
})().catch(e=>{console.error(e);process.exit(1);});
