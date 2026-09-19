const fs=require("node:fs");
const assert=require("node:assert");

const html=fs.readFileSync("boom-growth-os.html","utf8");
const js=fs.readFileSync("boom-growth-os.js","utf8");
const gateway=fs.readFileSync("boom-agentic-commerce-gateway.js","utf8");
const agent=fs.readFileSync("boom-growth-agent.js","utf8");

for(const token of [
  'id="bg-agentic-gateway-state"',
  'id="bg-agentic-gateway-stats"',
  'id="bg-agentic-gateway-capabilities"',
  'id="bg-agentic-gateway-blockers"',
  'boom-agentic-commerce-gateway.js?v=m09'
]) assert(html.includes(token),"M09 UI/load missing: "+token);

for(const token of [
  "agenticGateway","renderAgenticGateway",
  'protocol_version:"2026-04-08"',
  "merchant_identity_ready:identityReady",
  "cart_endpoint_ready:false",
  "native_checkout_endpoints_ready:false",
  "payment_handler_ready:false",
  "real_money_owner_approved:false",
  "public_well_known_profile_ready:false"
]) assert(js.includes(token),"M09 Growth runtime missing: "+token);

for(const token of [
  "validateDiscovery","validateCart","validateCheckout","buildManifest",
  "DISCOVERY_PREPARE","CART_PREPARE","CHECKOUT_PREPARE","OWNER_REVIEW",
  "merchant_center_not_ready","ucp_program_approval_missing",
  "cart_endpoint_not_ready","continue_url_not_ready","ucp_auth_not_ready",
  "native_checkout_endpoints_not_ready","payment_handler_not_ready",
  "m2m_bearer_auth_not_ready","order_creation_not_ready","order_status_webhook_not_ready",
  "well_known_publish:false","cart_endpoint_enabled:false","native_checkout_enabled:false",
  "payment_enabled:false","order_sync_enabled:false","execute:false"
]) assert(gateway.includes(token),"M09 gateway guard missing: "+token);

assert(agent.includes("const gateway=data.agenticGateway||{}"),"M08 must consume M09 gateway readiness");
assert(agent.includes("M09 gateway capability gates are not ready"),"M08 agentic lane must fail closed through M09");
assert(!/fetch\s*\(|XMLHttpRequest|\.insert\s*\(|\.update\s*\(|\.delete\s*\(/.test(gateway),"M09 validator must not expose or execute live gateway actions");
console.log("boom_m09_agentic_gateway_contract=PASS");
