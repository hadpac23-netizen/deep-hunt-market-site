const fs=require("node:fs");
const assert=require("node:assert");
const html=fs.readFileSync("boom-growth-os.html","utf8");
const js=fs.readFileSync("boom-growth-os.js","utf8");

for(const token of [
  "F50 · DEEP HUNT RESEARCH ENGINE",
  'id="bg-f50-state"',
  'id="bg-f50-stats"',
  'id="bg-f50-gates"',
  'id="bg-f50-current"',
  'boom-f50-evidence-engine.js?v=f50e1',
  'boom-f50-prior-art.js?v=f50pa1',
  'boom-f50-market-economics.js?v=f50me1',
  'boom-f50-red-team.js?v=f50rt1',
  'boom-f50-memory.js?v=f50mem1',
  'boom-f50-memory-adapter.js?v=f50ma1',
  'boom-f50-research-core.js?v=f50r2',
  'boom-f50-funnel.js?v=f50f2',
  'boom-f50-engine.js?v=f50x2',
  'boom-f50-current-research.js?v=f50c2'
]) assert(html.includes(token),"F50 Studio HTML missing: "+token);

for(const token of [
  "const F50Evidence=window.BoomF50EvidenceEngine",
  "const F50PriorArt=window.BoomF50PriorArt",
  "const F50Economics=window.BoomF50MarketEconomics",
  "const F50RedTeam=window.BoomF50RedTeam",
  "const F50Memory=window.BoomF50Memory",
  "const F50MemoryAdapter=window.BoomF50MemoryAdapter",
  "const F50Core=window.BoomF50ResearchCore",
  "const F50Funnel=window.BoomF50Funnel",
  "const F50Engine=window.BoomF50Engine",
  '["F50-04","Prior-Art + Patent Attack","BoomF50PriorArt","PANEL"]',
  '["F50-05","Market / Economics","BoomF50MarketEconomics","PANEL"]',
  '["F50-06","Red Team","BoomF50RedTeam","PANEL"]',
  '["F50-07","Research Memory","BoomF50Memory","PANEL"]',
  "function renderF50(data={})",
  "renderF50(data)",
  'client.from("f50_research_memory")',
  'client.from("f50_research_runs")',
  'client.from("f50_candidates")'
]) assert(js.includes(token),"F50 Studio JS missing: "+token);

assert(js.includes("winner_claim_allowed:F50Current.winner_claim_allowed===true"));
assert(js.includes("execute_actions:false"));
console.log("boom_f50_studio_contract=PASS");