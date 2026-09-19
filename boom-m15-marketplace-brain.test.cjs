const fs=require("node:fs");
const assert=require("node:assert");
const html=fs.readFileSync("boom-growth-os.html","utf8");
const js=fs.readFileSync("boom-growth-os.js","utf8");
const brain=fs.readFileSync("hunt-marketplace-brain.js","utf8");

for(const token of [
"M15 · MARKETPLACE BRAIN",
'id="bg-marketplace-state"',
'id="bg-marketplace-stats"',
'id="bg-marketplace-readiness"',
'id="bg-marketplace-workflows"',
'hunt-marketplace-brain.js?v=m15'
]) assert(html.includes(token),"M15 Studio surface missing: "+token);

for(const token of [
"function marketplaceReadiness",
"function renderMarketplace",
"marketplace_snapshot_adapter_ready:false",
"seller_api_secret_hashing_ready:false",
"attribution_registry_ready:false",
"payout_controls_ready:false"
]) assert(js.includes(token),"M15 Studio guard missing: "+token);

for(const token of [
"sellerQuality","productEligibility","systemReadiness",
"publication_before_review_forbidden",
"auto_approve_merchants:false","auto_approve_products:false",
"publish_products:false","merchant_payouts:false","execute_actions:false"
]) assert(brain.includes(token),"M15 contract missing: "+token);

assert(!/fetch\s*\(|XMLHttpRequest/.test(brain),"M15 brain must remain local-only");
console.log("boom_m15_marketplace_brain_contract=PASS");