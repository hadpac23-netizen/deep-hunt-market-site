const fs=require("node:fs");
const assert=require("node:assert");
const html=fs.readFileSync("boom-growth-os.html","utf8");
const js=fs.readFileSync("boom-growth-os.js","utf8");
const gate=fs.readFileSync("boom-evidence-decision-gate.js","utf8");

for(const token of [
"M18 · EVIDENCE DECISION GATE",
'id="bg-decision-gate-state"',
'id="bg-decision-gate-stats"',
'id="bg-decision-gate-primary"',
'id="bg-decision-gate-lanes"',
'boom-evidence-decision-gate.js?v=m18'
]) assert(html.includes(token),"M18 Studio surface missing: "+token);

for(const token of [
"function renderDecisionGate",
"const rawGrowthDecision=GrowthAgent",
"const decisionEvidence=evidenceLedger(data)",
"BoomEvidenceDecisionGate",
"renderGrowthAgent(growthDecision)",
"renderDecisionGate(rawGrowthDecision,growthDecision,decisionEvidence)"
]) assert(js.includes(token),"M18 integration missing: "+token);

for(const token of [
"TEST_CANDIDATE",
"EVIDENCE_HOLD",
"COLLECT_EVIDENCE",
"paid_attribution",
"verified_unit_economics",
"product_source_freshness",
"experiment_registry",
"can_scale:Boolean",
"execute_actions:false"
]) assert(gate.includes(token),"M18 contract missing: "+token);

assert(!gate.includes('state:"TEST_CANDIDATE",reason:"Evidence'),"M18 must not invent a new positive test state");
assert(!/fetch\s*\(|XMLHttpRequest/.test(gate),"M18 must remain local-only");
console.log("boom_m18_evidence_decision_gate_contract=PASS");