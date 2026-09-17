const fs=require("node:fs");
const assert=require("node:assert");

const html=fs.readFileSync("boom-ai-studio.html","utf8");
const css=fs.readFileSync("boom-ai-studio.css","utf8");
const js=fs.readFileSync("boom-ai-studio.js","utf8");

assert(html.includes('id="login-screen"'),"auth gate missing");
assert(html.includes('id="login-form"'),"login form missing");
assert(js.includes("signInWithPassword"),"password auth missing");
assert(js.includes('select("is_admin")'),"admin check missing");

assert(html.includes('data-manager-id="boom-meta-f35"'),"Meta-F35 node missing");
assert(html.includes('data-manager-id="boom-super-agent"'),"Super Agent node missing");
assert(js.includes("toolNodes"),"department/tool nodes missing");

assert(js.includes("hunt_boom_agent_commands"),"command data source missing");
assert(js.includes("hunt_boom_improvement_cycles"),"cycle data source missing");
assert(js.includes("hunt_boom_evals"),"eval data source missing");
assert(js.includes("hunt_boom_learning_items"),"learning data source missing");

assert(html.includes('id="trace-summary"'),"trace summary missing");
for(const type of ["command","event","worker","cycle","eval"]){
  assert(html.includes('data-trace-type="'+type+'"'),"trace filter missing: "+type);
  assert(js.includes('type:"'+type+'"'),"trace row mapping missing: "+type);
}
assert(js.includes("state.traceType"),"trace filter state missing");
assert(js.includes("trace-evidence"),"trace evidence rendering missing");
assert(css.includes(".trace-summary"),"trace summary styling missing");
assert(css.includes(".trace-filter.active"),"active trace filter styling missing");

assert(html.includes('id="attention-focus"'),"attention focus control missing");
assert(html.includes('id="attention-count"'),"attention count missing");
assert(js.includes("function attentionReports()"),"attention severity selector missing");
assert(js.includes("function focusAttention()"),"attention focus action missing");
assert(js.includes("performance.now()"),"attention focus latency measurement missing");
assert(js.includes('["critical","blocked","watch"]'),"attention severity filter missing");
assert(css.includes(".node.attention-focus"),"attention node highlight missing");

assert(html.includes("provider not enabled yet"),"truthful model connector state missing");
assert(js.includes("provider not enabled yet"),"model inspector truth state missing");

assert(css.includes("@media(max-width:900px)"),"mobile breakpoint missing");
assert(css.includes(".canvas-wrap"),"canvas layout missing");

assert(js.includes("postgres_changes"),"realtime subscriptions missing");
assert(js.includes("hunt-boom-chat"),"BOOM chat function missing");

console.log("boom_ai_studio_tests=PASS");

assert(html.includes('data-tab="brand-factory"'),"Brand Factory tab missing");
assert(html.includes('id="brand-brief"'),"Brand Factory product truth form missing");
assert(html.includes('data-brand-stage="red_team"'),"Brand Factory Red Team stage missing");
assert(html.includes('data-brand-stage="owner_gate"'),"Brand Factory Owner Gate missing");
assert(js.includes("function buildBrandPrompt"),"Brand Factory prompt builder missing");
assert(js.includes("Never invent product claims"),"Brand Factory truth rule missing");
assert(js.includes("DRAFT_REVIEW"),"Brand Factory draft owner gate missing");
assert(js.includes('mode:"chat"'),"Brand Factory must stay analysis-only chat mode");
assert(css.includes(".brand-factory-layout"),"Brand Factory layout styling missing");

assert(html.includes('id="brand-verify"'),"Brand Factory HUNT verify button missing");
assert(html.includes('id="brand-item-id"'),"Brand Factory HUNT item id missing");
assert(html.includes('id="brand-variant-id"'),"Brand Factory variant id missing");
assert(js.includes("function verifyBrandProduct"),"Brand Factory live verification missing");
assert(js.includes('/hunt-storefront'),"Brand Factory storefront recheck missing");
assert(js.includes('/hunt-cj-quote'),"Brand Factory CJ quote recheck missing");
assert(js.includes("stock_verified"),"Brand Factory stock gate missing");
assert(js.includes("shipping_verified"),"Brand Factory shipping gate missing");

assert(js.includes("product_gross_margin_pct"),"Brand Factory product margin model missing");
assert(js.includes("contribution_if_shipping_subsidized"),"Brand Factory shipping subsidy scenario missing");
assert(js.includes("customer_total_before_tax"),"Brand Factory customer total missing");
