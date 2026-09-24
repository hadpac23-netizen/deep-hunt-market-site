const fs=require("fs"),assert=require("node:assert/strict");
const C=require("./boom-dragon-control-plane.js");
const S=require("./boom-dragon-scheduler.js");
const E=require("./boom-dragon-evidence-ledger.js");

const managers=JSON.parse(fs.readFileSync("boom-manager-registry.json","utf8"));
const fusion=JSON.parse(fs.readFileSync("boom-dragon-fusion-registry.json","utf8"));
const policy=JSON.parse(fs.readFileSync("boom-dragon-control-policy.json","utf8"));
const scheduler=JSON.parse(fs.readFileSync("boom-dragon-scheduler-policy.json","utf8"));
const runtimeEvidence=JSON.parse(fs.readFileSync("dragon-control-runtime-evidence.json","utf8"));

const now=Date.parse("2026-09-24T11:31:05.433851Z");
const state=C.compileSnapshot({
  now,
  workers:[],workerReports:[],reports:[],
  commands:[
    {id:"valid",target_manager_id:"marketing-growth",status:"queued",action_class:"PROPOSE",repeat_count:140,expires_at:"2026-09-24T17:30:00Z"},
    {id:"expired",target_manager_id:"pricing-profit",status:"running",action_class:"OBSERVE",expires_at:"2026-09-24T10:00:00Z"},
    {id:"owner",target_manager_id:"release-control",status:"waiting_owner",action_class:"OWNER_APPROVAL",expires_at:"2026-09-24T17:30:00Z"},
    {id:"retry",target_manager_id:"repair-engineering",status:"failed",action_class:"STAGE_FIX",retry_attempts:1,repeat_count:8,expires_at:"2026-09-24T17:30:00Z"},
    {id:"unknown",target_manager_id:"repair-engineering",status:"failed",action_class:"STAGE_FIX",repeat_count:412,expires_at:"2026-09-24T17:30:00Z"},
    {id:"supplier",target_manager_id:"supplier-cj",status:"queued",action_class:"PROPOSE",expires_at:"2026-09-24T17:30:00Z"},
    {id:"acq",target_manager_id:"f35-acquisition",status:"queued",action_class:"PROPOSE",expires_at:"2026-09-24T17:30:00Z"}
  ]
},managers,fusion,policy,scheduler,runtimeEvidence);

const by=id=>state.runs.find(x=>x.run_id===id);
assert.equal(by("valid").lease.state,"VALID");
assert.equal(by("valid").retry.retry_attempts,null);
assert.equal(by("valid").retry.recurrence_count,140);
assert.equal(by("expired").retry.decision,"HOLD_LEASE_EXPIRED");
assert.equal(by("owner").retry.decision,"NO_RETRY_OWNER_GATE");
assert.equal(by("retry").retry.decision,"PROPOSE_RETRY");
assert.equal(by("unknown").retry.decision,"RETRY_COUNT_UNKNOWN_REVIEW");
assert.equal(by("supplier").brain,"commerce_truth_brain");
assert.equal(by("acq").brain,"growth_brain");

assert.equal(state.readiness.leases,"READY_SHADOW");
assert.equal(state.readiness.retry,"READY_SHADOW");
assert.equal(state.readiness.scheduler,"OWNER_ASSIGNED_SHADOW");
assert.equal(state.readiness.evidence,"PREPARED_PERSISTENCE_OFF");
assert.equal(state.readiness.execution,"OFF");
assert.equal(state.runtime_evidence.open_commands,9);
assert.equal(state.runtime_evidence.lease_valid,9);
assert.equal(state.runtime_evidence.planning_backlog_role,"PLANNING_BACKLOG_ONLY");

const schedule=S.compile(managers,scheduler);
assert.equal(schedule.canonical_owner,"boom_orchestrator");
assert.equal(schedule.activation_enabled,false);
assert(schedule.tasks.some(x=>x.id==="f60t-hourly"));

const ledger=E.prepare(state);
assert.equal(ledger.table,"boom_evidence");
assert.equal(ledger.persistence_enabled,false);

console.log("DRAGON final Control Plane shadow regression: PASS");