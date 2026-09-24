(() => {
"use strict";

const MATERIAL_CLASSES=new Set([
  "OWNER_APPROVAL","PRODUCTION_DEPLOY","PUBLISH","PAYMENT","PAID_CAMPAIGN",
  "LIVE_PRICE_CHANGE","SUPPLIER_COMMITMENT","SUPPLIER_LIVE_ORDER","PERMISSION_CHANGE"
]);
const ACTIVE_STATUSES=new Set(["queued","accepted","running","waiting_owner"]);
const TERMINAL_STATUSES=new Set(["completed","done","closed","failed","killed","cancelled"]);
const clean=v=>String(v??"").trim();
const n=v=>Number.isFinite(Number(v))?Number(v):0;
const freezeArray=a=>Object.freeze((a||[]).map(x=>typeof x==="object"&&x?Object.freeze({...x}):x));

function brainForManager(id=""){
  id=clean(id);
  if(!id)return "UNMAPPED";
  if(id==="boom-executive"||id==="boom-super-agent"||id==="boom-meta-f35")return "boom_orchestrator";
  if(id.startsWith("dept-")||id.startsWith("supplier-")||[
    "category-orchestrator","inventory-truth","sale-readiness","pricing-profit",
    "supplier-shipping","country-localization","supplier-hypersku"
  ].includes(id))return "commerce_truth_brain";
  if(["decision-intelligence","f35-research"].includes(id))return "intelligence_brain";
  if(["creative-brand-factory"].includes(id)||id.startsWith("f50"))return "innovation_brain";
  if([
    "feedback-intelligence","memory-continuity","hunt-worlds-flow",
    "boom-stylist","boom-mirror","merchandising-ux","dynamic-merchandising"
  ].includes(id))return "experience_brain";
  if([
    "marketing-growth","sales-conversion","share-referral","sales-director",
    "daily-10k-mission","f35-acquisition"
  ].includes(id)||id.startsWith("f60"))return "growth_brain";
  if([
    "checkout-payment","returns-care","integration-connections","site-reliability",
    "finance-reconciliation"
  ].includes(id))return "operations_brain";
  if([
    "repair-engineering","trust-compliance","analytics-truth","security-access",
    "release-control","experimentation-learning","knowledge-freshness"
  ].includes(id))return "learning_governance_brain";
  return "UNMAPPED";
}

function normalizeStatus(v){
  const s=clean(v).toLowerCase();
  if(["queued","pending"].includes(s))return "QUEUED";
  if(["accepted"].includes(s))return "ACCEPTED";
  if(["running","working"].includes(s))return "RUNNING";
  if(["waiting_owner","owner_gate","approval_required"].includes(s))return "WAITING_OWNER";
  if(["completed","done","closed","passed"].includes(s))return "COMPLETED";
  if(["failed","critical","killed"].includes(s))return "FAILED";
  if(["blocked","hold"].includes(s))return "BLOCKED";
  if(["cancelled","canceled"].includes(s))return "CANCELLED";
  return s?s.toUpperCase():"UNKNOWN";
}

function managerById(registry={},id=""){
  return (registry.managers||[]).find(x=>x.id===id) ||
    (registry.departments||[]).find(x=>x.id===id) || null;
}

function toolClassPolicy(controlPolicy={},toolClass=""){
  const id=clean(toolClass);
  if(!id)return null;
  return (controlPolicy.tool_classes||[]).find(x=>x.id===id)||null;
}
function permissionsFor(manager={},brain="UNMAPPED",controlPolicy={}){
  const declared=Array.isArray(manager.can_auto)?manager.can_auto.map(clean).filter(Boolean):[];
  const ownerGate=Array.isArray(manager.owner_gate)?manager.owner_gate.map(clean).filter(Boolean):[];
  const grants=Array.isArray(controlPolicy?.brain_grants?.[brain])?controlPolicy.brain_grants[brain]:[];
  return Object.freeze({
    declared_action_classes:freezeArray(declared),
    owner_gate_classes:freezeArray(ownerGate),
    tool_classes:freezeArray(grants),
    execution_enabled:false,
    mode:"SHADOW_ONLY",
    tool_scope:grants.length?"CANONICAL_SHADOW":"UNMAPPED_BY_TOOL",
    rule:"Declared manager permissions are preserved; tool classes are preparation/read grants only while Control Plane is SHADOW_ONLY."
  });
}

function requiresOwnerGate(command={},manager={},controlPolicy={}){
  const action=clean(command.action_class).toUpperCase();
  const toolClass=clean(command.tool_class);
  const toolPolicy=toolClassPolicy(controlPolicy,toolClass);
  if(command.owner_approval_required===true)return true;
  if(MATERIAL_CLASSES.has(action))return true;
  if((manager.owner_gate||[]).map(x=>clean(x).toUpperCase()).includes(action))return true;
  if(toolPolicy?.owner_gate===true)return true;
  return false;
}

function evidenceSummary(command={},ctx={}){
  const workerReports=(ctx.workerReports||[]).filter(x=>
    clean(x.manager_id)===clean(command.target_manager_id) ||
    (command.worker_id&&clean(x.worker_id)===clean(command.worker_id))
  );
  const managerReports=(ctx.reports||[]).filter(x=>clean(x.manager_id)===clean(command.target_manager_id));
  const direct=n(command.evidence_count);
  const worker=workerReports.reduce((a,x)=>a+n(x.evidence_count),0);
  const report=managerReports.reduce((a,x)=>a+n(x.evidence_count),0);
  const total=direct+worker+report;
  return Object.freeze({
    direct_evidence:direct,
    worker_evidence:worker,
    manager_report_evidence:report,
    total,
    state:total>0?"EVIDENCE_PRESENT":"EVIDENCE_MISSING",
    verified:false,
    rule:"Evidence present is not the same as verified."
  });
}

function leaseFor(command={},manager={},permissions={},now=Date.now()){
  const status=normalizeStatus(command.status);
  const activeStatus=["QUEUED","ACCEPTED","RUNNING","WAITING_OWNER"].includes(status);
  const expiresAt=command.expires_at||null;
  const expiresMs=expiresAt?Date.parse(String(expiresAt)):NaN;
  const expiryKnown=Number.isFinite(expiresMs);
  const expired=activeStatus&&expiryKnown&&expiresMs<=now;
  const leaseState=!activeStatus?"INACTIVE":!expiryKnown?"MISSING_EXPIRY":expired?"EXPIRED":"VALID";
  return Object.freeze({
    lease_id:"shadow-lease:"+clean(command.id||"unknown"),
    holder:clean(command.target_manager_id)||"UNMAPPED",
    brain:brainForManager(command.target_manager_id),
    active:activeStatus&&!expired,
    state:leaseState,
    started_at:command.started_at||command.created_at||null,
    expires_at:expiresAt,
    remaining_seconds:activeStatus&&expiryKnown?Math.max(0,Math.floor((expiresMs-now)/1000)):null,
    duration_policy:"COMMAND_EXPIRES_AT_AUTHORITATIVE",
    renewal_policy:"PROPOSE_ONLY_NO_AUTO_RENEWAL",
    renewal_decision:expired?"RENEWAL_REVIEW_REQUIRED":leaseState==="VALID"?"NO_RENEWAL_NEEDED":"NO_RENEWAL",
    recurrence_count:Number(command.repeat_count||0),
    allowed_action_classes:permissions.declared_action_classes,
    execution_enabled:false,
    mode:"SHADOW_LEASE"
  });
}

function retryPolicy(command={}){
  const status=normalizeStatus(command.status);
  const retryKnown=Number.isFinite(Number(command.retry_attempts));
  const retryAttempts=retryKnown?Number(command.retry_attempts):null;
  const recurrenceCount=Number(command.repeat_count||0);
  if(status==="WAITING_OWNER")return Object.freeze({decision:"NO_RETRY_OWNER_GATE",retry_attempts:retryAttempts,retry_attempts_known:retryKnown,recurrence_count:recurrenceCount,max_retries:2,circuit_breaker:"HOLD"});
  if(status==="BLOCKED")return Object.freeze({decision:"ESCALATE_BLOCKED",retry_attempts:retryAttempts,retry_attempts_known:retryKnown,recurrence_count:recurrenceCount,max_retries:2,circuit_breaker:"HOLD"});
  if(status==="FAILED"&&!retryKnown)return Object.freeze({decision:"RETRY_COUNT_UNKNOWN_REVIEW",retry_attempts:null,retry_attempts_known:false,recurrence_count:recurrenceCount,max_retries:2,circuit_breaker:"HOLD_SHADOW"});
  if(status==="FAILED"&&retryAttempts<2)return Object.freeze({decision:"PROPOSE_RETRY",retry_attempts:retryAttempts,retry_attempts_known:true,recurrence_count:recurrenceCount,max_retries:2,circuit_breaker:"CLOSED_SHADOW"});
  if(status==="FAILED")return Object.freeze({decision:"ESCALATE_AFTER_RETRIES",retry_attempts:retryAttempts,retry_attempts_known:true,recurrence_count:recurrenceCount,max_retries:2,circuit_breaker:"OPEN_SHADOW"});
  return Object.freeze({decision:"NO_RETRY_NEEDED",retry_attempts:retryAttempts,retry_attempts_known:retryKnown,recurrence_count:recurrenceCount,max_retries:2,circuit_breaker:"CLOSED_SHADOW"});
}

function handoffFor(run){
  return Object.freeze({
    schema:"BOOM_HANDOFF_V1",
    run_id:run.run_id,
    mission_id:run.mission_id,
    parent_run_id:run.parent_run_id,
    context:Object.freeze({brain:run.brain,manager_id:run.manager_id,worker_id:run.worker_id||null}),
    goal:run.title||"Existing BOOM command",
    evidence:Object.freeze({count:run.evidence.total,state:run.evidence.state,verified:run.evidence.verified}),
    assumptions:Object.freeze([]),
    unknowns:Object.freeze([
      ...(run.evidence.total===0?["EVIDENCE_MISSING"]:[]),
      ...(run.permissions.tool_scope==="UNMAPPED_BY_TOOL"?["TOOL_SCOPE_UNMAPPED"]:[]),
      ...(run.lease.duration_policy==="NOT_CONFIGURED"?["LEASE_DURATION_UNCONFIGURED"]:[])
    ]),
    decision_state:run.status,
    required_output:"VERIFIED_RESULT_OR_EXPLICIT_BLOCKER",
    owner_constraints:Object.freeze([
      "NO_PRODUCTION_WITHOUT_OWNER_APPROVAL",
      "NO_REAL_PAYMENT_WITHOUT_OWNER_APPROVAL",
      "NO_PAID_CAMPAIGN_WITHOUT_OWNER_APPROVAL",
      "NO_SUPPLIER_COMMITMENT_WITHOUT_OWNER_APPROVAL"
    ])
  });
}

function compileRun(command={},ctx={}){
  const manager=managerById(ctx.managerRegistry||{},command.target_manager_id)||{
    id:clean(command.target_manager_id),can_auto:[],owner_gate:[]
  };
  const brain=brainForManager(command.target_manager_id);
  const permissions=permissionsFor(manager,brain,ctx.controlPolicy||{});
  const ownerGate=requiresOwnerGate(command,manager,ctx.controlPolicy||{});
  const evidence=evidenceSummary(command,ctx);
  const status=normalizeStatus(command.status);
  const run={
    schema:"BOOM_CONTROL_RUN_V1",
    run_id:clean(command.id)||("legacy:"+clean(command.created_at)||"unknown"),
    mission_id:clean(command.mission_id)||("command:"+clean(command.id||"unknown")),
    parent_run_id:clean(command.parent_run_id)||null,
    title:clean(command.title)||"BOOM Command",
    manager_id:clean(command.target_manager_id)||"UNMAPPED",
    worker_id:clean(command.target_worker_id||command.worker_id)||null,
    brain,
    status,
    priority:n(command.priority)||3,
    action_class:clean(command.action_class||"OBSERVE").toUpperCase(),
    tool_class:clean(command.tool_class)||null,
    created_at:command.created_at||null,
    updated_at:command.updated_at||null,
    started_at:command.started_at||null,
    completed_at:command.completed_at||null,
    permissions,
    lease:null,
    evidence,
    owner_gate:Object.freeze({
      required:ownerGate,
      state:ownerGate?(status==="WAITING_OWNER"?"WAITING_OWNER":"REQUIRED"):"NOT_REQUIRED",
      approved:false,
      execution_enabled:false
    }),
    recurrence_count:Number(command.repeat_count||0),
    retry:retryPolicy(command),
    budget:Object.freeze({
      status:clean(ctx.controlPolicy?.budget_policy?.status)||"UNSPECIFIED",
      external_spend_usd:ctx.controlPolicy?.budget_policy?.external_spend_usd??null,
      paid_browser_usd:ctx.controlPolicy?.budget_policy?.paid_browser_usd??null,
      paid_media_usd:ctx.controlPolicy?.budget_policy?.paid_media_usd??null,
      paid_generation_usd:ctx.controlPolicy?.budget_policy?.paid_generation_usd??null,
      execution_enabled:false
    }),
    execution_mode:"SHADOW_ONLY",
    persisted_by_control_plane:false
  };
  run.lease=leaseFor(command,manager,permissions,Number(ctx.now||Date.now()));
  run.handoff=handoffFor(run);
  return Object.freeze(run);
}

function compileSnapshot(runtime={},managerRegistry={},fusionRegistry={}){
  const commands=Array.isArray(runtime.commands)?runtime.commands:[];
  const controlPolicy=arguments.length>3&&arguments[3]?arguments[3]:{};
  const ctx={
    managerRegistry,
    controlPolicy,
    now:Number(runtime.now||Date.now()),
    workerReports:Array.isArray(runtime.workerReports)?runtime.workerReports:[],
    reports:Array.isArray(runtime.reports)?runtime.reports:[]
  };
  const runs=commands.map(c=>compileRun(c,ctx));
  const allManagers=[
    ...(managerRegistry.managers||[]),
    ...(managerRegistry.departments||[])
  ];
  const unmappedManagers=allManagers.filter(m=>brainForManager(m.id)==="UNMAPPED").map(m=>m.id);
  const queue={
    queued:runs.filter(x=>x.status==="QUEUED").length,
    running:runs.filter(x=>["ACCEPTED","RUNNING"].includes(x.status)).length,
    waiting_owner:runs.filter(x=>x.status==="WAITING_OWNER"||x.owner_gate.required).length,
    blocked:runs.filter(x=>["BLOCKED","FAILED"].includes(x.status)).length,
    completed:runs.filter(x=>x.status==="COMPLETED").length
  };
  const active=runs.filter(x=>["QUEUED","ACCEPTED","RUNNING","WAITING_OWNER"].includes(x.status));
  const evidenceRuns=runs.filter(x=>x.evidence.total>0).length;
  const schedule=(managerRegistry.managers||[]).filter(x=>x.schedule).map(x=>Object.freeze({
    manager_id:x.id,
    brain:brainForManager(x.id),
    schedule:x.schedule,
    status:"DECLARED_NOT_ACTIVATED_BY_CONTROL_PLANE",
    note:clean(x.schedule_note)
  }));
  const state=Object.freeze({
    schema:"BOOM_CONTROL_PLANE_V1",
    generated_at:new Date().toISOString(),
    mode:"SHADOW_ONLY",
    execution_enabled:false,
    source:"existing BOOM Studio runtime + manager registry + fusion registry",
    one_runtime_client:true,
    derived_queue:true,
    persisted_by_control_plane:false,
    counts:Object.freeze({
      managers:allManagers.length,
      runs:runs.length,
      active_runs:active.length,
      workers:Array.isArray(runtime.workers)?runtime.workers.length:0,
      evidence_runs:evidenceRuns,
      waiting_owner:queue.waiting_owner,
      scheduled_managers:schedule.length
    }),
    queue:Object.freeze(queue),
    runs:freezeArray(runs),
    schedules:freezeArray(schedule),
    unmapped_managers:freezeArray(unmappedManagers),
    canonical_brains:freezeArray((fusionRegistry.brains||[]).map(x=>x.id)),
    policy:Object.freeze({
      schema:controlPolicy.schema||null,
      tool_classes:Number((controlPolicy.tool_classes||[]).length),
      budget_status:controlPolicy?.budget_policy?.status||"UNSPECIFIED",
      external_spend_usd:controlPolicy?.budget_policy?.external_spend_usd??null,
      execution_enabled:false
    }),
    gaps:freezeArray([
      ...(unmappedManagers.length?["UNMAPPED_MANAGERS"] : []),
      ...((controlPolicy.tool_classes||[]).length?[]:["TOOL_PERMISSION_MAP_NOT_CANONICAL"]),
      ...(runs.some(x=>x.lease.state==="MISSING_EXPIRY")?["LEASE_EXPIRY_MISSING"]:[]),
      ...(controlPolicy?.budget_policy?.status?[]:["MISSION_BUDGETS_NOT_WIRED"]),
      "RETRY_ENGINE_SHADOW_ONLY",
      "EVIDENCE_LEDGER_DERIVED_NOT_PERSISTED",
      "SCHEDULER_NOT_OWNED_BY_CONTROL_PLANE"
    ]),
    readiness:Object.freeze({
      routing:unmappedManagers.length===0?"READY":"REVIEW",
      run_envelope:"READY",
      derived_queue:"READY",
      permissions:(controlPolicy.tool_classes||[]).length?"READY_SHADOW":"PARTIAL",
      leases:runs.some(x=>x.lease.state==="MISSING_EXPIRY")?"PARTIAL":"READY_SHADOW",
      retry:"SHADOW",
      handoff:"READY",
      evidence:"PARTIAL",
      owner_gate:"READY",
      scheduler:schedule.length?"INVENTORIED":"PARTIAL",
      budgets:controlPolicy?.budget_policy?.status||"PREP",
      execution:"OFF"
    })
  });
  return state;
}

async function loadContracts(){
  const [m,f,p]=await Promise.all([
    fetch("boom-manager-registry.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw new Error("MANAGER_REGISTRY_HTTP_"+r.status);return r.json()}),
    fetch("boom-dragon-fusion-registry.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw new Error("FUSION_REGISTRY_HTTP_"+r.status);return r.json()}),
    fetch("boom-dragon-control-policy.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw new Error("CONTROL_POLICY_HTTP_"+r.status);return r.json()})
  ]);
  return {managerRegistry:m,fusionRegistry:f,controlPolicy:p};
}

let contracts=null;
async function evaluate(runtime=window.BOOM_STUDIO_RUNTIME_SNAPSHOT||{}){
  try{
    if(!contracts)contracts=await loadContracts();
    const state=compileSnapshot(runtime,contracts.managerRegistry,contracts.fusionRegistry,contracts.controlPolicy);
    window.DRAGON_CONTROL_PLANE_STATE=state;
    window.dispatchEvent(new CustomEvent("dragon:control-plane",{detail:state}));
    return state;
  }catch(error){
    const blocked=Object.freeze({
      schema:"BOOM_CONTROL_PLANE_V1",mode:"SHADOW_ONLY",execution_enabled:false,
      status:"BLOCKED",error:String(error?.message||error)
    });
    window.DRAGON_CONTROL_PLANE_STATE=blocked;
    window.dispatchEvent(new CustomEvent("dragon:control-plane",{detail:blocked}));
    return blocked;
  }
}

const api=Object.freeze({
  brainForManager,normalizeStatus,toolClassPolicy,permissionsFor,requiresOwnerGate,
  evidenceSummary,leaseFor,retryPolicy,handoffFor,compileRun,compileSnapshot,
  loadContracts,evaluate,MATERIAL_CLASSES
});
if(typeof window!=="undefined"){
  window.DragonControlPlane=api;
  window.addEventListener("boom:studio-runtime-snapshot",e=>evaluate(e.detail||{}));
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(()=>evaluate(),300));
  else setTimeout(()=>evaluate(),300);
}
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();