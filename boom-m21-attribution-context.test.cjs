const fs=require("node:fs");
const assert=require("node:assert");

const html=fs.readFileSync("boom-growth-os.html","utf8");
const studio=fs.readFileSync("boom-growth-os.js","utf8");
const analytics=fs.readFileSync("analytics.js","utf8");
const checkout=fs.readFileSync("checkout.js","utf8");
const payment=fs.readFileSync("supabase/functions/hunt-payment-session/index.ts","utf8");
const readiness=fs.readFileSync("boom-attribution-context-readiness.js","utf8");

for(const token of [
  "M21 · ATTRIBUTION CONTEXT",
  'id="bg-attribution-context-state"',
  'id="bg-attribution-context-checks"',
  'id="bg-attribution-context-blockers"',
  'boom-attribution-context-readiness.js?v=m21'
]) assert(html.includes(token),"M21 Studio surface missing: "+token);

for(const token of [
  "const AttributionContext=window.BoomAttributionContextReadiness",
  "live_server_session_snapshot:false",
  "server_purchase_linkage:false",
  "provider_click_validation:false",
  'domain:"campaign_touchpoint_context"',
  "renderAttributionContext(data)"
]) assert(studio.includes(token),"M21 Studio guard missing: "+token);

for(const token of [
  'const attributionKey = "hunt_attribution_context_v1"',
  "ATTRIBUTION_KEYS",
  "utm_source","utm_medium","utm_campaign","utm_content","utm_term",
  "gclid","fbclid","ttclid","msclkid",
  "if(!consentGranted||!pendingAttribution)",
  "sessionStorage.setItem(attributionKey",
  "sessionStorage.removeItem(attributionKey)",
  "attributionContext: readAttributionContext"
]) assert(analytics.includes(token),"M21 browser context missing: "+token);

assert(!analytics.includes("document.referrer"),"M21 must not persist raw referrer");
assert(!/ATTRIBUTION_KEYS[^;]*(email|phone|address)/.test(analytics),"M21 attribution key allowlist must not contain personal contact fields");
assert(checkout.includes("attribution: window.HuntAnalytics?.attributionContext?.() || null"),"Checkout must carry consented attribution context");

for(const token of [
  "function normalizeAttribution",
  "ATTR_KEYS",
  'source:"hunt_web_consent_context"',
  "verified:false",
  "attribution:attributionSnapshot",
  'attribution_status:attributionSnapshot?"browser_context_unverified":"none"',
  "commerce_snapshot"
]) assert(payment.includes(token),"M21 server snapshot preview missing: "+token);

assert(!/ATTR_KEYS[^;]*(email|phone|address)/.test(payment),"M21 server attribution allowlist must not include personal contact fields");

for(const token of [
  "LOCAL_PREVIEW",
  "live_attribution_context_ready:liveAttributionContext",
  "conversion_claim_allowed:false",
  "paid_launch:false",
  "paid_spend:false",
  "execute_actions:false"
]) assert(readiness.includes(token),"M21 readiness contract missing: "+token);

console.log("boom_m21_attribution_context_contract=PASS");