(() => {
  "use strict";
  if (window.BoomAutomationRuntime?.version) return;

  const version="BOOM-AUTOMATION-RUNTIME-V1";
  const runs=new Map();
  const maxRetries=2;
  let contract=null;
  let gateway=null;
  let readyPromise=null;

  const transitions={
    DRAFT:["READY","CANCELLED"],
    READY:["RUNNING","CANCELLED"],
    RUNNING:["WAITING_OWNER","RETRY_WAIT","SUCCEEDED","FAILED","QUARANTINED","CANCELLED"],
    WAITING_OWNER:["RUNNING","SUCCEEDED","CANCELLED","QUARANTINED"],
    RETRY_WAIT:["RUNNING","QUARANTINED","CANCELLED"],
    FAILED:["RETRY_WAIT","QUARANTINED","CANCELLED"],
    SUCCEEDED:[],QUARANTINED:[],CANCELLED:[]
  };

  function makeId(prefix){
    const raw=globalThis.crypto?.randomUUID?.()||Math.random().toString(36).slice(2)+Date.now().toString(36);
    return prefix+"-"+raw;
  }
  function clone(value){return JSON.parse(JSON.stringify(value));}
  function event(name,run,detail={}){
    const payload={event:name,run_id:run?.run_id||"",workflow_id:run?.workflow_id||"",correlation_id:run?.correlation_id||"",state:run?.state||"",detail,ts:Date.now()};
    try{window.dispatchEvent?.(new CustomEvent("boom:automation",{detail:payload}));}catch{}
    return payload;
  }
  async function json(path){
    const res=await fetch(path,{cache:"no-store"});
    if(!res.ok)throw new Error(path+" unavailable");
    return res.json();
  }
  async function ready(){
    if(readyPromise)return readyPromise;
    readyPromise=(async()=>{
      [contract,gateway]=await Promise.all([json("boom-automation-control-plane.json"),json("boom-tool-gateway.json")]);
      return {version,mode:contract.mode,contract_version:contract.version,gateway_version:gateway.version};
    })();
    return readyPromise;
  }

  async function persistRunEvent(run,eventName,detail={},ensureApproval=false){
    const ledger=window.BoomAutomationLedger;
    if(!ledger)return;
    try{
      await ledger.upsertRun(run);
      await ledger.appendEvent(run,eventName,detail);
      if(ensureApproval===true)await ledger.ensureApproval(run);
    }catch(error){
      event("automation.ledger.error",run,{reason:String(error?.code||error?.message||"LEDGER_WRITE_FAILED")});
    }
  }

  function workflowById(id){
    return contract?.workflows?.find(x=>x.id===id)||null;
  }
  function step(run,to,reason){
    const allowed=transitions[run.state]||[];
    if(!allowed.includes(to))throw Object.assign(new Error("INVALID_AUTOMATION_TRANSITION"),{code:"INVALID_AUTOMATION_TRANSITION"});
    run.state=to;
    run.updated_at=Date.now();
    run.history.push({state:to,reason:String(reason||""),ts:run.updated_at});
    event("automation.run."+to.toLowerCase(),run,{reason:String(reason||"")});
    return run;
  }
  async function createRun(workflowId,{missionId="",input={}}={}){
    await ready();
    const workflow=workflowById(workflowId);
    if(!workflow)throw Object.assign(new Error("WORKFLOW_NOT_FOUND"),{code:"WORKFLOW_NOT_FOUND"});
    const run={
      mission_id:String(missionId||makeId("mission")),
      workflow_id:workflow.id,
      run_id:makeId("run"),
      correlation_id:makeId("corr"),
      mode:"SHADOW",
      state:"READY",
      owner:workflow.owner,
      stages:workflow.stages.map(name=>({name,status:"PENDING"})),
      retries:0,
      owner_decision:null,
      material_action:workflow.material_action,
      material_action_suppressed:true,
      input:clone(input),
      history:[{state:"READY",reason:"created",ts:Date.now()}],
      created_at:Date.now(),
      updated_at:Date.now()
    };
    runs.set(run.run_id,run);
    event("automation.run.created",run);
    await persistRunEvent(run,"automation.run.created",{reason:"created"});
    return clone(run);
  }
  async function simulate(runId){
    await ready();
    const run=runs.get(String(runId));
    if(!run)throw Object.assign(new Error("RUN_NOT_FOUND"),{code:"RUN_NOT_FOUND"});
    if(run.state==="READY"||run.state==="RETRY_WAIT")step(run,"RUNNING","shadow_simulation");
    if(run.state!=="RUNNING")throw Object.assign(new Error("RUN_NOT_EXECUTABLE"),{code:"RUN_NOT_EXECUTABLE"});
    for(const stage of run.stages){
      stage.status="SIMULATED";
      stage.ts=Date.now();
    }
    const workflow=workflowById(run.workflow_id);
    if(workflow?.final_owner_gate===true){
      step(run,"WAITING_OWNER","material_action_requires_owner");
      event("automation.run.waiting_owner",run,{material_action:workflow.material_action});
      await persistRunEvent(run,"automation.run.waiting_owner",{material_action:workflow.material_action},true);
    }else{
      step(run,"SUCCEEDED","shadow_complete_no_external_action");
      await persistRunEvent(run,"automation.run.succeeded",{reason:"shadow_complete_no_external_action"});
    }
    return clone(run);
  }
  async function ownerDecision(runId,approved,{reason=""}={}){
    await ready();
    const run=runs.get(String(runId));
    if(!run)throw Object.assign(new Error("RUN_NOT_FOUND"),{code:"RUN_NOT_FOUND"});
    if(run.state!=="WAITING_OWNER")throw Object.assign(new Error("OWNER_GATE_NOT_WAITING"),{code:"OWNER_GATE_NOT_WAITING"});
    run.owner_decision={approved:approved===true,reason:String(reason||""),ts:Date.now()};
    event(approved?"automation.owner.approved":"automation.owner.rejected",run,{reason:String(reason||"")});
    const ledger=window.BoomAutomationLedger;
    try{await ledger?.recordOwnerDecision?.(run,approved===true,String(reason||""));}catch(error){
      event("automation.ledger.error",run,{reason:String(error?.code||error?.message||"APPROVAL_WRITE_FAILED")});
    }
    if(approved===true){
      // SHADOW never executes the material action. Approval closes the simulation only.
      step(run,"SUCCEEDED","owner_approved_shadow_action_suppressed");
      await persistRunEvent(run,"automation.owner.approved",{reason:String(reason||"")});
    }else{
      step(run,"CANCELLED","owner_rejected");
      await persistRunEvent(run,"automation.owner.rejected",{reason:String(reason||"")});
    }
    return clone(run);
  }
  async function fail(runId,code="ACTION_FAILED"){
    await ready();
    const run=runs.get(String(runId));
    if(!run)throw Object.assign(new Error("RUN_NOT_FOUND"),{code:"RUN_NOT_FOUND"});
    if(run.state!=="RUNNING")throw Object.assign(new Error("RUN_NOT_RUNNING"),{code:"RUN_NOT_RUNNING"});
    step(run,"FAILED",String(code||"ACTION_FAILED"));
    await persistRunEvent(run,"automation.run.failed",{reason:String(code||"ACTION_FAILED")});
    return clone(run);
  }
  async function retry(runId){
    await ready();
    const run=runs.get(String(runId));
    if(!run)throw Object.assign(new Error("RUN_NOT_FOUND"),{code:"RUN_NOT_FOUND"});
    if(run.state!=="FAILED")throw Object.assign(new Error("RUN_NOT_FAILED"),{code:"RUN_NOT_FAILED"});
    run.retries+=1;
    if(run.retries>maxRetries){
      step(run,"QUARANTINED","retry_budget_exhausted");
      await persistRunEvent(run,"automation.run.quarantined",{reason:"retry_budget_exhausted"});
      return clone(run);
    }
    step(run,"RETRY_WAIT","bounded_retry");
    await persistRunEvent(run,"automation.run.retry_wait",{reason:"bounded_retry"});
    return clone(run);
  }

  async function dispatchAdapter(runId,payload={}){
    await ready();
    const run=runs.get(String(runId));
    if(!run)throw Object.assign(new Error("RUN_NOT_FOUND"),{code:"RUN_NOT_FOUND"});
    if(run.workflow_id!=="shelf_coverage_17x1000"){
      throw Object.assign(new Error("WORKFLOW_NOT_ALLOWLISTED"),{code:"WORKFLOW_NOT_ALLOWLISTED"});
    }
    if(!["READY","RUNNING","RETRY_WAIT"].includes(run.state)){
      throw Object.assign(new Error("RUN_NOT_DISPATCHABLE"),{code:"RUN_NOT_DISPATCHABLE"});
    }
    if(run.state==="READY"||run.state==="RETRY_WAIT")step(run,"RUNNING","n8n_shadow_dispatch");
    const adapter=window.BoomN8nAdapter;
    if(!adapter?.dispatchShadow){
      await persistRunEvent(run,"automation.n8n.unavailable",{reason:"N8N_ADAPTER_UNAVAILABLE"});
      throw Object.assign(new Error("N8N_ADAPTER_UNAVAILABLE"),{code:"N8N_ADAPTER_UNAVAILABLE"});
    }
    try{
      const result=await adapter.dispatchShadow(clone(run),payload);
      run.adapter_result={
        adapter:"n8n",
        state:String(result?.state||"DISPATCHED_SHADOW"),
        received_at:Date.now()
      };
      await persistRunEvent(run,"automation.n8n.dispatched",{state:run.adapter_result.state});
      return {run:clone(run),adapter_result:clone(result||{})};
    }catch(error){
      const code=String(error?.code||error?.message||"N8N_DISPATCH_FAILED");
      step(run,"FAILED",code);
      await persistRunEvent(run,"automation.n8n.dispatch_failed",{reason:code});
      throw error;
    }
  }

  async function authorizeTool(toolId,{ownerApproved=false}={}){
    await ready();
    const tool=gateway.tools.find(x=>x.id===String(toolId));
    if(!tool)return {ok:false,reason:"TOOL_NOT_ALLOWLISTED",tool_id:String(toolId)};
    if(contract.mode==="SHADOW"&&tool.shadow_allowed!==true)return {ok:false,reason:"SHADOW_BLOCKED",tool_id:tool.id,owner_gate:tool.owner_gate===true};
    if(tool.owner_gate===true&&ownerApproved!==true)return {ok:false,reason:"OWNER_GATE_REQUIRED",tool_id:tool.id,owner_gate:true};
    return {ok:true,tool_id:tool.id,class:tool.class,owner:tool.owner,material:tool.material===true};
  }
  function getRun(runId){const run=runs.get(String(runId));return run?clone(run):null;}
  function listRuns(){return [...runs.values()].map(clone);}

  window.BoomAutomationRuntime={version,ready,createRun,simulate,dispatchAdapter,ownerDecision,fail,retry,authorizeTool,getRun,listRuns};
})();