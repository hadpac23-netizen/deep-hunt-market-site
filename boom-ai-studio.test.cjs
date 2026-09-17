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

assert(html.includes("Live model routing from BOOM control plane"),"live model connector copy missing");
assert(js.includes("hunt_boom_model_routes"),"model route data source missing");
assert(js.includes("אין Groq במסלול הפעיל"),"no-Groq model truth state missing");

assert(css.includes("@media(max-width:900px)"),"mobile breakpoint missing");
assert(css.includes(".canvas-wrap"),"canvas layout missing");

assert(js.includes("postgres_changes"),"realtime subscriptions missing");
assert(js.includes("hunt-boom-chat"),"BOOM chat function missing");


assert(html.includes('data-tab="connections"'),"connections tab missing");
assert(html.includes('id="connection-list"'),"connection center missing");
assert(js.includes("loadAuthConnections"),"auth connection live status loader missing");
for(const provider of ["Google","GitHub","Apple","Facebook","TikTok","Instagram Pro"]){assert(js.includes('label:"'+provider+'"'),"connection lane missing: "+provider)}
assert(css.includes(".connection-grid"),"connection center styling missing");

assert(js.includes("zszlnahjqmwozwubetkm.supabase.co/auth/v1/callback"),"OAuth callback not surfaced");
assert(js.includes("custom:tiktok"),"TikTok custom provider identifier missing");
assert(js.includes("hunt-auth-provider-status"),"Connection Center runtime provider status missing");
assert(js.includes("ready:custom.tiktok===true"),"TikTok readiness is not runtime-backed");
assert(js.includes("ready:custom.instagram===true"),"Instagram readiness is not runtime-backed");
assert(css.includes(".connection-callback"),"connection callback styling missing");

console.log("boom_ai_studio_tests=PASS");
