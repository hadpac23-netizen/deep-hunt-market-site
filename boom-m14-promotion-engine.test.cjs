const fs=require("node:fs");
const assert=require("node:assert");
const html=fs.readFileSync("boom-growth-os.html","utf8");
const js=fs.readFileSync("boom-growth-os.js","utf8");
const engine=fs.readFileSync("hunt-promotion-engine.js","utf8");

for(const token of [
"M14 · PROMOTION ENGINE",
'id="bg-promotion-engine-state"',
'id="bg-promotion-engine-stats"',
'id="bg-promotion-engine-candidates"',
'id="bg-promotion-engine-blockers"',
'hunt-promotion-engine.js?v=m14'
]) assert(html.includes(token),"M14 Studio surface missing: "+token);

for(const token of [
"function promotionEngineReadiness",
"function renderPromotionEngine",
"affiliate_cost:null",
"tax_cost:null",
"availability_verified:false"
]) assert(js.includes(token),"M14 Studio guard missing: "+token);

for(const token of [
"margin_floor_failed","resetting_countdown_forbidden",
"fabricated_original_price_forbidden","preselected_paid_extra_forbidden",
"promotion_activate:false","external_publish:false",
"checkout_application:false","execute:false","activated:0"
]) assert(engine.includes(token),"M14 engine contract missing: "+token);

assert(!/fetch\s*\(|XMLHttpRequest/.test(engine),"M14 must remain local-only");
console.log("boom_m14_promotion_engine_contract=PASS");