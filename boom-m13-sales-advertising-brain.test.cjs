const fs=require("node:fs");
const assert=require("node:assert");
const html=fs.readFileSync("boom-growth-os.html","utf8");
const js=fs.readFileSync("boom-growth-os.js","utf8");
const brain=fs.readFileSync("boom-sales-advertising-brain.js","utf8");

for(const token of [
"M13 · SALES & ADVERTISING BRAIN",
'id="bg-sales-ad-state"',
'id="bg-sales-ad-stats"',
'id="bg-sales-ad-candidates"',
'id="bg-sales-ad-blockers"',
'boom-sales-advertising-brain.js?v=m13'
]) assert(html.includes(token),"M13 Studio surface missing: "+token);

for(const token of [
"function salesAdvertisingReadiness",
"function renderSalesAdvertising",
"owner_paid_approval:false",
"attribution_ready:false",
"holdout_ready:false"
]) assert(js.includes(token),"M13 Studio guard missing: "+token);

for(const token of [
"productReadiness","audience","planCandidate","sensitive_targeting_rejected",
"max_safe_cac","sponsored_label_required:true","paid_launch:false",
"spend_authorized:false","execute:false","spend:0","execute_actions:false"
]) assert(brain.includes(token),"M13 contract missing: "+token);

assert(!/fetch\s*\(|XMLHttpRequest/.test(brain),"M13 must remain local-only");
console.log("boom_m13_sales_advertising_contract=PASS");