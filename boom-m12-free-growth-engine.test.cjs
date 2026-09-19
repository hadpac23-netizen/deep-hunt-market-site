const fs=require("node:fs");
const assert=require("node:assert");
const html=fs.readFileSync("boom-growth-os.html","utf8");
const js=fs.readFileSync("boom-growth-os.js","utf8");
const engine=fs.readFileSync("boom-free-growth-engine.js","utf8");

for(const token of [
"M12 · FREE GROWTH ENGINE",
'id="bg-free-growth-state"',
'id="bg-free-growth-stats"',
'id="bg-free-growth-primary"',
'id="bg-free-growth-channels"',
'boom-free-growth-engine.js?v=m12'
]) assert(html.includes(token),"M12 Studio surface missing: "+token);

for(const token of [
"function renderFreeGrowth",
"renderFreeGrowth(plan,data,marketing,seoScore)",
"search_console_ready:false",
"shipping_truth_ready:false",
"earned_attribution_ready:false"
]) assert(js.includes(token),"M12 Studio guard missing: "+token);

for(const token of [
"technical_seo","google_free_listings","organic_short_form",
"referral_sharing","country_localization","earned_creators_communities",
"paid_spend:false","external_publish:false","external_send:false","execute_actions:false"
]) assert(engine.includes(token),"M12 engine contract missing: "+token);

assert(!/fetch\s*\(|XMLHttpRequest/.test(engine),"M12 must remain local-only");
console.log("boom_m12_free_growth_contract=PASS");