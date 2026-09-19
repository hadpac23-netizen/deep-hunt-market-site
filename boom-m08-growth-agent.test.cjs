const fs=require("node:fs");
const assert=require("node:assert");

const html=fs.readFileSync("boom-growth-os.html","utf8");
const js=fs.readFileSync("boom-growth-os.js","utf8");
const agent=fs.readFileSync("boom-growth-agent.js","utf8");

for(const token of [
  'id="bg-growth-agent-state"',
  'id="bg-growth-agent-stats"',
  'id="bg-growth-agent-primary"',
  'id="bg-growth-agent-lanes"',
  'boom-growth-agent.js?v=m08'
]) assert(html.includes(token),"M08 UI/load missing: "+token);

for(const token of [
  "renderGrowthAgent","GrowthAgent?.decide",
  "paid_attribution_ready:false",
  "server_event_id_persisted:false",
  "owner_paid_approval:false",
  "incrementality_ready:false",
  "post_acquisition_profit_ready:false",
  '["Growth Agent", growthDecision?.primary_move?.state || "HOLD"]'
]) assert(js.includes(token),"M08 Growth runtime missing: "+token);

for(const token of [
  "FIX_LAUNCH_GATE","VERIFY_ECONOMICS","ENRICH_PRODUCT_TRUTH",
  "RUN_OWNED_TEST","TEST_EXTERNAL_DISCOVERY","TEST_PAID","COLLECT_EVIDENCE",
  "owned","external_discovery","paid","lifecycle","creator","agentic",
  "incrementality_ready","post_acquisition_profit_ready",
  "recommendations_only:true","external_publish:false","paid_spend:false",
  "lifecycle_send:false","creator_publish:false","creator_payout:false",
  "execute_actions:false",'owner_gate:"REVIEW_REQUIRED"'
]) assert(agent.includes(token),"M08 agent guard missing: "+token);

assert(!/fetch\s*\(|XMLHttpRequest|\.insert\s*\(|\.update\s*\(|\.delete\s*\(/.test(agent),"Growth Agent must not execute network or mutation actions");
console.log("boom_m08_growth_agent_contract=PASS");
