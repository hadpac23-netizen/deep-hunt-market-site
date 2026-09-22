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
    READY:["RUNNING","BLOCKED","CANCELLED"],
    RUNNING:["WAITING_OWNER","BLOCKED","RETRY_WAIT","SUCCEEDED","FAILED","QUARANTINED","CANCELLED"],
    BLOCKED:["READY","CANCELLED"],
    WAITING_OWNER:["RUNNING","SUCCEEDED","CANCELLED","QUARANTINED"],
    RETRY_WAIT:["RUNNING","BLOCKED","QUARANTINED","CANCELLED"],
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
  async function createRun(workflowId,{missionId="",input={},parentRunId="",parentCorrelationId=""}={}){
    await ready();
    const workflow=workflowById(workflowId);
    if(!workflow)throw Object.assign(new Error("WORKFLOW_NOT_FOUND"),{code:"WORKFLOW_NOT_FOUND"});
    const run={
      mission_id:String(missionId||makeId("mission")),
      workflow_id:workflow.id,
      run_id:makeId("run"),
      correlation_id:makeId("corr"),
      parent_run_id:String(parentRunId||""),
      parent_correlation_id:String(parentCorrelationId||""),
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

  function preflight(run){
    const workflow=String(run?.workflow_id||"");
    const input=run?.input&&typeof run.input==="object"?run.input:{};
    const blockers=[];
    if(workflow==="creative_publish"){
      if(input.product_truth_live!==true)blockers.push("PRODUCT_TRUTH_LIVE_REQUIRED");
      if(input.exact_references_locked!==true)blockers.push("EXACT_REFERENCES_LOCKED_REQUIRED");
      if(input.proof_claims_boundary_reviewed!==true)blockers.push("PROOF_CLAIMS_BOUNDARY_REQUIRED");
    }
    if(workflow==="supplier_product_intake"){
      if(input.partner_identity_verified!==true)blockers.push("PARTNER_IDENTITY_REQUIRED");
      if(input.official_api_or_feed_verified!==true)blockers.push("OFFICIAL_API_OR_FEED_REQUIRED");
      if(input.terms_verified!==true)blockers.push("TERMS_VERIFICATION_REQUIRED");
      if(input.media_rights_verified!==true)blockers.push("MEDIA_RIGHTS_REQUIRED");
    }
    if(workflow==="customer_lifecycle"){
      if(input.identity_policy_ready!==true)blockers.push("IDENTITY_POLICY_REQUIRED");
      if(input.privacy_consent_ready!==true)blockers.push("PRIVACY_CONSENT_REQUIRED");
      if(input.event_source_verified!==true)blockers.push("EVENT_SOURCE_VERIFICATION_REQUIRED");
    }
    if(workflow==="analytics_learning_loop"){
      if(input.evidence_quality_pass!==true)blockers.push("EVIDENCE_QUALITY_REQUIRED");
      if(input.provenance_verified!==true)blockers.push("PROVENANCE_REQUIRED");
      if(input.baseline_available!==true)blockers.push("BASELINE_REQUIRED");
    }
    return {ok:blockers.length===0,blockers};
  }
  async function updateRunInput(runId,patch={}){
    await ready();
    const run=runs.get(String(runId));
    if(!run)throw Object.assign(new Error("RUN_NOT_FOUND"),{code:"RUN_NOT_FOUND"});
    const clean={};
    for(const [k,v] of Object.entries(patch||{})){
      if(/token|secret|password|credential|email|phone|address/i.test(k))continue;
      if(v===null||["string","number","boolean"].includes(typeof v))clean[k]=v;
    }
    run.input={...(run.input||{}),...clean};
    run.updated_at=Date.now();
    if(run.state==="BLOCKED"){
      const check=preflight(run);
      run.blockers=check.blockers;
      if(check.ok)step(run,"READY","evidence_updated");
    }
    await persistRunEvent(run,"automation.run.evidence_updated",{blocker_count:(run.blockers||[]).length});
    return clone(run);
  }

  async function simulate(runId){
    await ready();
    const run=runs.get(String(runId));
    if(!run)throw Object.assign(new Error("RUN_NOT_FOUND"),{code:"RUN_NOT_FOUND"});
    if(run.state==="READY"||run.state==="RETRY_WAIT"){
      const check=preflight(run);
      run.blockers=check.blockers;
      if(!check.ok){
        step(run,"BLOCKED","evidence_preflight");
        await persistRunEvent(run,"automation.run.blocked",{blocker_count:check.blockers.length,blockers:check.blockers.join(",")});
        return clone(run);
      }
      step(run,"RUNNING","shadow_simulation");
    }
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
    await routeFailureToIncident(run,String(code||"ACTION_FAILED"));
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


  async function routeFailureToIncident(failedRun,failureCode="ACTION_FAILED"){
    if(!failedRun||String(failedRun.workflow_id||"")==="incident_repair")return null;
    for(const existing of runs.values()){
      if(existing.workflow_id==="incident_repair"&&existing.parent_run_id===failedRun.run_id)return clone(existing);
    }
    const incident=await createRun("incident_repair",{
      missionId:failedRun.mission_id,
      parentRunId:failedRun.run_id,
      parentCorrelationId:failedRun.correlation_id,
      input:{
        failed_workflow_id:failedRun.workflow_id,
        failed_run_id:failedRun.run_id,
        failure_code:String(failureCode||"ACTION_FAILED")
      }
    });
    const stored=runs.get(incident.run_id);
    const ledger=window.BoomAutomationLedger;
    try{
      await ledger?.appendIncidentEvent?.(stored,"incident.detected",{
        severity:"warning",
        title:"Automation failure routed to Incident & Repair",
        failed_workflow_id:failedRun.workflow_id,
        failure_code:String(failureCode||"ACTION_FAILED")
      });
    }catch(error){
      event("automation.ledger.error",stored,{reason:String(error?.code||error?.message||"INCIDENT_EVENT_WRITE_FAILED")});
    }
    event("automation.incident.created",stored,{parent_run_id:failedRun.run_id,failure_code:String(failureCode||"ACTION_FAILED")});
    return clone(stored);
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
      await routeFailureToIncident(run,code);
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

  window.BoomAutomationRuntime={version,ready,createRun,preflight,updateRunInput,simulate,dispatchAdapter,routeFailureToIncident,ownerDecision,fail,retry,authorizeTool,getRun,listRuns};
})();