const fs=require("node:fs");
const assert=require("node:assert");

const payment=fs.readFileSync("supabase/functions/hunt-payment-session/index.ts","utf8");
const brain=fs.readFileSync("supabase/functions/hunt-payment-session/commerce-brain.ts","utf8");
const analytics=fs.readFileSync("analytics.js","utf8");
const checkout=fs.readFileSync("checkout.js","utf8");

for(const token of [
  'import { assessCommerce, publicCommerceSummary } from "./commerce-brain.ts"',
  "async function activeProfitProfile",
  "const commerceDecision=assessCommerce(profitProfile,finalPricing)",
  'commerceDecision.status==="PASS"',
  '.eq("key","hunt_payment_live")',
  "LIVE_PAYMENT_DISABLED",
  "function normalizeAttribution",
  "const attributionSnapshot=normalizeAttribution(body?.attribution)",
  "attribution:attributionSnapshot",
  "...commerce",
  'attribution_status:attributionSnapshot?"browser_context_unverified":"none"',
  'attribution_version:"2026-09-19-m26-live"'
]) assert(payment.includes(token),"M26 payment-session contract missing: "+token);

for(const token of [
  "utm_source","utm_medium","utm_campaign","utm_content","utm_term",
  "gclid","fbclid","ttclid","msclkid","landing_path","captured_at"
]) assert(payment.includes(token),"M26 allowlist missing: "+token);

assert(!/ATTR_KEYS[^;]*(email|phone|shipping|address)/.test(payment),"Attribution allowlist must exclude PII/shipping fields");
assert(payment.includes('verified:false'),"Browser attribution must remain unverified");
assert(payment.includes('const initialMode=configured&&\n      ["sandbox","live"].includes(requestedMode)&&\n      commerceDecision.status==="PASS"'),"Commerce gate must still guard payment mode");
assert(brain.includes("assessCommerce"),"Synced commerce brain missing");

assert(analytics.includes('const attributionKey = "hunt_attribution_context_v1"'),"Browser attribution context missing");
assert(analytics.includes("if(!consentGranted||!pendingAttribution)"),"Attribution persistence must remain consent-gated");
assert(checkout.includes("attribution: window.HuntAnalytics?.attributionContext?.() || null"),"Checkout attribution payload missing");

console.log("boom_m26_live_attribution_context_contract=PASS");