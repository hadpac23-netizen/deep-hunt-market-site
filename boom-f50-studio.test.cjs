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
  'boom-f50-research-core.js?v=f50r1',
  'boom-f50-funnel.js?v=f50f1',
  'boom-f50-current-research.js?v=f50c1'
]) assert(html.includes(token),"F50 Studio HTML missing: "+token);

for(const token of [
  "const F50Evidence=window.BoomF50EvidenceEngine",
  "const F50Core=window.BoomF50ResearchCore",
  "const F50Funnel=window.BoomF50Funnel",
  "const F50Engine=window.BoomF50Engine",
  "const F50Current=window.BoomF50CurrentResearch?.RECEIPT||{}",
  'state:F50Evidence&&F50Core&&F50Funnel?"CORE_READY":"HOLD"',
  '["F50","Evidence Engine","BoomF50EvidenceEngine","PANEL"]',
  '["F50","Research Core","BoomF50ResearchCore","PANEL"]',
  '["F50","Candidate Funnel","BoomF50Funnel","PANEL"]',
  '["F50","Orchestrator","BoomF50Engine","PANEL"]',
  "function renderF50(data={})",
  "renderF50(data)"
]) assert(js.includes(token),"F50 Studio JS missing: "+token);

assert(js.includes("winner_claim_allowed:F50Current.winner_claim_allowed===true"));
assert(js.includes("execute_actions:false"));
console.log("boom_f50_studio_contract=PASS");