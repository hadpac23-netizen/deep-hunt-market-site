(() => {
  "use strict";
  if(window.BoomAutomationLedger?.version)return;

  const version="BOOM-AUTOMATION-LEDGER-ADAPTER-V1";
  const runtime=()=>window.BoomRuntime;
  const safeScalar=value=>{
    if(value===null||["string","number","boolean"].includes(typeof value))return value;
    return undefined;
  };
  function sanitize(value,depth=0){
    if(depth>5)return null;
    if(value===null)return null;
    if(Array.isArray(value))return value.slice(0,100).map(v=>sanitize(v,depth+1));
    if(typeof value==="object"){
      const out={};
      for(const [k,v] of Object.entries(value)){
        if(/token|secret|password|credential|email|phone|address/i.test(k))continue;
        if(Array.isArray(v)||v&&typeof v==="object")out[k]=sanitize(v,depth+1);
        else {
          const scalar=safeScalar(v);
          if(scalar!==undefined)out[k]=scalar;
        }
      }
      return out;
    }
    return safeScalar(value);
  }
  async function client(){
    const rt=runtime();
    const ready=await rt?.adminReady?.();
    if(!ready?.ok)throw Object.assign(new Error(ready?.reason||"AUTH_REQUIRED"),{code:ready?.reason||"AUTH_REQUIRED"});
    const db=rt?.getSupabaseClient?.();
    if(!db)throw Object.assign(new Error("LEDGER_UNAVAILABLE"),{code:"LEDGER_UNAVAILABLE"});
    return db;
  }
  function lineage(run){
    return [{
      role:"boom_orchestrator",
      owner:String(run.owner||""),
      mission_id:String(run.mission_id||""),
      workflow_id:String(run.workflow_id||""),
      run_id:String(run.run_id||""),
      correlation_id:String(run.correlation_id||"")
    }];
  }
  function runRow(run){
    return {
      run_key:String(run.run_id||""),
      task:String(run.workflow_id||""),
      members:lineage(run),
      judge_id:"owner_gate",
      run_mode:String(run.mode||"SHADOW").toLowerCase(),
      status:String(run.state||"READY").toLowerCase(),
      candidate_outputs:sanitize(run.stages||[]),
      judge_verdict:sanitize(run.owner_decision||{}),
      evidence:sanitize([{
        mission_id:run.mission_id,
        workflow_id:run.workflow_id,
        run_id:run.run_id,
        correlation_id:run.correlation_id,
        material_action:run.material_action,
        material_action_suppressed:run.material_action_suppressed===true,
        retries:run.retries||0
      }]),
      owner_gate_required:Boolean(run.final_owner_gate||run.owner_gate_required),
      completed_at:["SUCCEEDED","FAILED","QUARANTINED","CANCELLED"].includes(String(run.state||""))?new Date(run.updated_at||Date.now()).toISOString():null
    };
  }
  async function upsertRun(run){
    const db=await client();
    const row=runRow(run);
    const {data,error}=await db.from("hunt_boom_team_runs").upsert(row,{onConflict:"run_key"}).select("id,run_key,status,updated_at").maybeSingle();
    if(error)throw error;
    return data||row;
  }
  async function appendEvent(run,eventName,detail={}){
    const db=await client();
    const row={
      source_manager_id:String(run.owner||"boom_orchestrator"),
      event_type:String(eventName||"automation.run.event"),
      severity:/failed|quarantined|error/i.test(String(eventName))?"error":/waiting_owner|retry/i.test(String(eventName))?"warning":"info",
      entity_type:"automation_run",
      entity_key:String(run.run_id||""),
      title:String(eventName||"automation.run.event"),
      body:String(detail?.reason||"").slice(0,1000)||null,
      payload:sanitize({
        mission_id:run.mission_id,
        workflow_id:run.workflow_id,
        run_id:run.run_id,
        correlation_id:run.correlation_id,
        state:run.state,
        material_action:run.material_action,
        material_action_suppressed:run.material_action_suppressed===true,
        retries:run.retries||0,
        detail
      })
    };
    const {error}=await db.from("hunt_boom_events").insert(row);
    if(error)throw error;
    return true;
  }
  async function ensureApproval(run){
    if(!run.final_owner_gate)return null;
    const db=await client();
    const decisionKey="automation_owner_gate:"+String(run.run_id||"");
    const row={
      decision_key:decisionKey,
      title:"Owner Gate · "+String(run.workflow_id||"automation"),
      decision_type:"AUTOMATION_OWNER_GATE",
      status:"proposed",
      priority:1,
      source_reports:sanitize([{
        mission_id:run.mission_id,
        workflow_id:run.workflow_id,
        run_id:run.run_id,
        correlation_id:run.correlation_id
      }]),
      rationale:"Material workflow reached Owner Gate in SHADOW mode.",
      action_class:"OWNER_GATE",
      owner_approval_required:true,
      proposed_action:sanitize({
        workflow_id:run.workflow_id,
        run_id:run.run_id,
        material_action:run.material_action,
        shadow_mode:true,
        material_action_suppressed:true
      }),
      result:{}
    };
    const {data,error}=await db.from("hunt_boom_decisions").upsert(row,{onConflict:"decision_key"}).select("id,decision_key,status").maybeSingle();
    if(error)throw error;
    return data||row;
  }
  async function recordOwnerDecision(run,approved,reason=""){
    const db=await client();
    const key="automation_owner_gate:"+String(run.run_id||"");
    const status=approved===true?"approved":"rejected";
    const {data,error}=await db.from("hunt_boom_decisions").update({
      status,
      rationale:String(reason||"").slice(0,2000)||"Owner decision recorded in BOOM Studio.",
      result:sanitize({
        approved:approved===true,
        shadow_mode:true,
        material_action_suppressed:true,
        decided_at:new Date().toISOString()
      }),
      updated_at:new Date().toISOString()
    }).eq("decision_key",key).select("id,decision_key,status").maybeSingle();
    if(error)throw error;
    return data;
  }
  async function listRecent(limit=25){
    const db=await client();
    const capped=Math.max(1,Math.min(Number(limit)||25,100));
    const {data,error}=await db.from("hunt_boom_team_runs")
      .select("id,run_key,task,run_mode,status,members,candidate_outputs,judge_verdict,evidence,owner_gate_required,created_at,completed_at")
      .order("created_at",{ascending:false}).limit(capped);
    if(error)throw error;
    return data||[];
  }
  async function listPendingApprovals(limit=25){
    const db=await client();
    const capped=Math.max(1,Math.min(Number(limit)||25,100));
    const {data,error}=await db.from("hunt_boom_decisions")
      .select("id,decision_key,title,decision_type,status,priority,source_reports,rationale,proposed_action,created_at,updated_at")
      .eq("decision_type","AUTOMATION_OWNER_GATE")
      .eq("status","proposed")
      .order("created_at",{ascending:false}).limit(capped);
    if(error)throw error;
    return data||[];
  }

  window.BoomAutomationLedger={version,sanitize,upsertRun,appendEvent,ensureApproval,recordOwnerDecision,listRecent,listPendingApprovals};
})();