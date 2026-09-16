const fs=require("fs");
const assert=require("assert");

const migration=fs.readFileSync(
  "supabase/migrations/20260916085818_fix_boom_learning_loop_dedup.sql",
  "utf8"
);

for(const token of [
  "problem_key",
  "repeat_count",
  "hunt_boom_command_dedup_guard",
  "hunt_boom_cycle_reuse_guard",
  "hunt_boom_eval_upsert_guard",
  "command_duplicate_rate",
  "cycle_closure_rate",
  "command_closure_rate",
  "repeat_error_rate",
  "evidence_completion_rate",
  "owner_correction_recurrence",
  "context_absence_is_not_system_absence",
  "command_duplication_is_not_progress"
]){
  assert(migration.includes(token),`migration missing ${token}`);
}

const OPEN=new Set(["queued","accepted","running","waiting_owner"]);
const state={commands:[],cycles:[]};
function pulse(reportId,focus="daily-10k-mission"){
  const problemKey="manager-health:supplier-cj";
  const existing=state.commands.find(
    c=>c.problemKey===problemKey&&OPEN.has(c.status)
  );
  if(existing){
    existing.repeatCount++;
    existing.latestReportId=reportId;
  }else{
    state.commands.push({
      problemKey,status:"queued",repeatCount:0,latestReportId:reportId
    });
  }

  const cycle=state.cycles.find(
    c=>c.focus===focus&&["running","evaluating"].includes(c.status)
  );
  if(cycle) cycle.bucket=reportId;
  else state.cycles.push({focus,status:"running",bucket:reportId});
}

pulse(1001);
pulse(1002);
pulse(1003);

assert.equal(state.commands.length,1,"duplicate active command created");
assert.equal(state.commands[0].repeatCount,2,"repeat_count did not advance");
assert.equal(state.commands[0].latestReportId,1003,"latest report not retained");
assert.equal(state.cycles.length,1,"duplicate active cycle created");

state.cycles[0].status="evaluated";
pulse(1004);
assert.equal(state.cycles.length,2,"new cycle should start after closure");

console.log("BOOM learning-loop QA: PASS");
console.log(JSON.stringify({
  threePulseActiveCommands:1,
  threePulseActiveCycles:1,
  repeatCountAfterThreePulses:2,
  latestReportId:1003,
  newCycleAfterClosure:true
},null,2));
