const fs=require("node:fs");
const assert=require("node:assert");

const html=fs.readFileSync("boom-growth-os.html","utf8");
const studio=fs.readFileSync("boom-growth-os.js","utf8");
const receipt=fs.readFileSync("boom-live-attribution-context.js","utf8");

for(const token of [
  "M26 · LIVE ATTRIBUTION CONTEXT",
  'id="bg-live-attribution-state"',
  'id="bg-live-attribution-stats"',
  'id="bg-live-attribution-proof"',
  'id="bg-live-attribution-boundary"',
  'boom-live-attribution-context.js?v=m26'
]) assert(html.includes(token),"M26 Studio surface missing: "+token);

for(const token of [
  "const LiveAttribution=window.BoomLiveAttributionContext",
  "liveAttribution=LiveAttribution?.evaluate?.()",
  '"M26","Live Attribution Context","BoomLiveAttributionContext","PANEL"',
  "function renderLiveAttribution",
  "renderLiveAttribution(data)"
]) assert(studio.includes(token),"M26 Studio integration missing: "+token);

for(const token of [
  'edge_function_version:13',
  "commerce_gate_preserved:true",
  "payment_live_gate_preserved:true",
  "consent_required:true",
  "attribution_pii_excluded:true",
  "prelaunch_probe_payment_ready:false",
  'prelaunch_probe_mode:"prelaunch"',
  'attribution_status:"browser_context_unverified"',
  "attribution_verified:false",
  'payment_event_type:"prelaunch_session_created"',
  "payment_live_enabled:false",
  "payplus_callback_accept_paid:false",
  "frontend_live_verified:false",
  "conversion_claim_allowed:false"
]) assert(receipt.includes(token),"M26 receipt missing: "+token);

console.log("boom_m26_live_attribution_studio_contract=PASS");