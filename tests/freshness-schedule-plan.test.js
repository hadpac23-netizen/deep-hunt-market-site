const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const plan=JSON.parse(fs.readFileSync(path.join(root,"ops/hunt-freshness-schedule-plan.json"),"utf8"));
const runner=fs.readFileSync(path.join(root,"supabase/functions/hunt-freshness-shadow-runner/index.ts"),"utf8");

test("RT04 schedule plan is fail-closed until Owner Gate",()=>{
  assert.equal(plan.enabled,false);
  assert.equal(plan.scope,"SHADOW_ONLY");
  assert.equal(plan.owner_gate_required,true);
  assert.equal(plan.current_live_truth.supplier_freshness_cron_jobs,0);
  assert.equal(plan.current_live_truth.runner_deployed,false);
  assert.equal(plan.current_live_truth.watcher_deployed,false);
});

test("RT04 closure requires two measured rotations and failure recovery",()=>{
  const joined=plan.closure_tests.join(" ");
  assert.match(joined,/Two complete supplier rotations/);
  assert.match(joined,/failure creates HOLD\/exception/);
  assert.match(joined,/Recovery resolves only the matching stale exception/);
});

test("freshness runner uses canonical project pooler secret and remains shadow-only",()=>{
  assert.match(runner,/HUNT_DB_POOLER_URL/);
  assert.doesNotMatch(runner,/SUPABASE_DB_POOLER_URL/);
  assert.match(runner,/production_effect:false/);
  assert.match(runner,/sellable_changed:false/);
  assert.match(runner,/supplier_order_changed:false/);
  assert.match(runner,/payment_changed:false/);
});
