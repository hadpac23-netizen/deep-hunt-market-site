const fs=require("fs");
const vm=require("vm");
const assert=require("assert");
const source=fs.readFileSync("boom-automation-ledger-adapter.js","utf8");

const calls=[];
function query(table){
  const chain={
    upsert(payload,opts){calls.push(["upsert",table,payload,opts]);return chain;},
    insert(payload){calls.push(["insert",table,payload]);return Promise.resolve({data:null,error:null});},
    update(payload){calls.push(["update",table,payload]);return chain;},
    select(cols){calls.push(["select",table,cols]);return chain;},
    maybeSingle(){return Promise.resolve({data:{ok:true},error:null});},
    eq(k,v){calls.push(["eq",table,k,v]);return chain;},
    order(){return chain;},
    limit(){return Promise.resolve({data:[],error:null});}
  };
  return chain;
}
const db={from:query};
const context={
  console,
  window:{
    BoomRuntime:{
      adminReady:async()=>({ok:true}),
      getSupabaseClient:()=>db
    }
  }
};
vm.createContext(context);
vm.runInContext(source,context,{filename:"boom-automation-ledger-adapter.js"});

(async()=>{
  const ledger=context.window.BoomAutomationLedger;
  const run={
    mission_id:"m1",workflow_id:"creative_publish",run_id:"r1",correlation_id:"c1",
    owner:"growth_brain",mode:"SHADOW",state:"WAITING_OWNER",retries:0,
    stages:[{name:"visual_qa",status:"SIMULATED"}],owner_decision:null,
    material_action:"external_publish",material_action_suppressed:true,final_owner_gate:true,
    updated_at:Date.now(),
    input:{email:"must-not-leak@example.com",token:"secret",safe:"ok"}
  };
  await ledger.upsertRun(run);
  await ledger.appendEvent(run,"automation.run.waiting_owner",{reason:"gate"});
  await ledger.ensureApproval(run);
  await ledger.recordOwnerDecision(run,true,"approved for shadow close");

  const serialized=JSON.stringify(calls);
  assert(!serialized.includes("must-not-leak@example.com"));
  assert(!serialized.includes('"secret"'));
  assert(serialized.includes("hunt_boom_team_runs"));
  assert(serialized.includes("hunt_boom_events"));
  assert(serialized.includes("hunt_boom_decisions"));
  assert(serialized.includes("material_action_suppressed"));
  console.log("BOOM durable ledger adapter: PASS — existing tables reused, PII/secrets stripped, approval queue mapped");
})().catch(e=>{console.error(e);process.exit(1);});
