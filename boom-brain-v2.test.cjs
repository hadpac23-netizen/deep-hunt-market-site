const fs=require("fs");
const assert=require("assert");
const cp=require("child_process");

cp.execFileSync("npx",["--yes","esbuild","supabase/functions/hunt-boom-chat/boom-context.ts","--bundle","--platform=node","--format=cjs","--outfile=/tmp/boom-brain-v2-context.cjs"],{stdio:"ignore"});
const c=require("/tmp/boom-brain-v2-context.cjs");

const now=Date.parse("2026-09-16T14:00:00Z");
const items=[
  {source_ref:"trusted-owner",content:"owner rule",trust_score:1,relevance_score:1,freshness_score:1,token_cost:100,quarantined:false},
  {source_ref:"quarantined",content:"bad",trust_score:1,relevance_score:1,freshness_score:1,token_cost:10,quarantined:true},
  {source_ref:"expired",content:"old",trust_score:1,relevance_score:1,freshness_score:1,token_cost:10,expires_at:"2026-09-15T00:00:00Z"},
  {source_ref:"low-trust",content:"weak",trust_score:.5,relevance_score:1,freshness_score:1,token_cost:10},
  {source_ref:"fresh-project",content:"fresh",trust_score:.8,relevance_score:.9,freshness_score:.95,token_cost:120}
];
const g=c.selectGovernedContext(items,220,now);
assert.deepEqual(g.selected.map(x=>x.source_ref),["trusted-owner","fresh-project"]);
assert.equal(g.used_tokens,220);
assert.equal(g.dropped,0);
assert.equal(c.memoryEligible(items[1],now),false);
assert.equal(c.memoryEligible(items[2],now),false);
assert.equal(c.memoryEligible(items[3],now),false);
assert.equal(c.canProposeWithPolicy(null),false);
assert.equal(c.canProposeWithPolicy({enabled:true,permission_level:"observe"}),false);
assert.equal(c.canProposeWithPolicy({enabled:true,permission_level:"propose"}),true);
assert.equal(c.canProposeWithPolicy({enabled:true,permission_level:"execute"}),true);

const edge=fs.readFileSync("supabase/functions/hunt-boom-chat/index.ts","utf8");
assert(edge.includes("CAPABILITY_POLICY_BLOCKED"),"capability hard block missing");
assert(edge.includes("selectGovernedContext(contextCandidates,2600)"),"context governor not wired");
assert(edge.includes("trust_score,provenance,expires_at,quarantined"),"memory firewall fields missing");
assert(edge.includes("context_governor:ctx.context_governor"),"context telemetry missing");

const sql=fs.readFileSync("supabase/migrations/20260916141108_add_boom_brain_v2_substrate.sql","utf8");
for(const name of [
  "hunt_boom_context_items","hunt_boom_capability_policies","hunt_boom_redteam_cases",
  "hunt_boom_redteam_runs","hunt_boom_replay_runs","hunt_boom_eval_suites",
  "hunt_boom_eval_cases_v2","hunt_boom_eval_runs_v2","hunt_boom_model_routes",
  "hunt_boom_mcp_registry","hunt_boom_team_runs"
]) assert(sql.includes(name),"missing Brain v2 table: "+name);
for(const key of [
  "brain-v2-context-governor","brain-v2-memory-firewall","brain-v2-capability-firewall",
  "brain-v2-redteam-lab","brain-v2-replay-eval-lab","brain-v2-model-chess",
  "brain-v2-mcp-gateway","brain-v2-parallel-teams"
]) assert(sql.includes(key),"missing curriculum item: "+key);
assert((sql.match(/prompt-injection|memory-poison|fake-completion|permission-escalation|stale-context|malicious-tool/g)||[]).length>=6,"red-team seed cases missing");
console.log("BOOM Brain v2 runtime test: PASS");