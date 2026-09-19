const fs=require("node:fs");
const assert=require("node:assert");
const html=fs.readFileSync("boom-growth-os.html","utf8");
const js=fs.readFileSync("boom-growth-os.js","utf8");
const ledger=fs.readFileSync("boom-evidence-ledger.js","utf8");

for(const token of [
"M17 · EVIDENCE LEDGER",
'id="bg-evidence-state"',
'id="bg-evidence-stats"',
'id="bg-evidence-verified"',
'id="bg-evidence-gaps"',
'boom-evidence-ledger.js?v=m17'
]) assert(html.includes(token),"M17 Studio surface missing: "+token);

for(const token of [
"function evidenceLedger",
"function renderEvidenceLedger",
'hunt_unit_economics',
'hunt_catalog_products',
'hunt_marketing_experiments',
'marketplace_snapshot',
'paid_attribution',
'STATIC_AUDIT',
'STRUCTURAL'
]) assert(js.includes(token),"M17 Studio evidence map missing: "+token);

for(const token of [
'DIRECT_DB','OWNER_FUNCTION','VERIFIED_WEBHOOK','SIGNED_PROVIDER',
'state="STRUCTURAL"','state="VERIFIED"','state="STALE"',
'usable_for_decision:state==="VERIFIED"',
'execute_actions:false','external_publish:false'
]) assert(ledger.includes(token),"M17 ledger contract missing: "+token);

assert(!/fetch\s*\(|XMLHttpRequest/.test(ledger),"M17 ledger must not retrieve or mutate external systems");
console.log("boom_m17_evidence_ledger_contract=PASS");