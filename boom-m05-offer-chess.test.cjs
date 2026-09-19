const fs=require("node:fs");
const assert=require("node:assert");
const html=fs.readFileSync("boom-growth-os.html","utf8");
const js=fs.readFileSync("boom-growth-os.js","utf8");
const offer=fs.readFileSync("boom-offer-chess.js","utf8");

for(const token of [
  'id="bg-offer-state"',
  'id="bg-offer-stats"',
  'id="bg-offer-candidates"',
  'id="bg-offer-blockers"',
  'boom-offer-chess.js?v=m05'
]) assert(html.includes(token),"M05 UI/load contract missing: "+token);

for(const token of [
  "offerRows",
  "offerSummary",
  "offerCandidates",
  "offerTopBlockers",
  "renderOfferChess",
  "min_meaningful_coupon_amount:0.50",
  "min_meaningful_coupon_rate:0.05"
]) assert(js.includes(token),"M05 Growth runtime missing: "+token);

for(const token of [
  "NO_OFFER",
  "SAFE_COUPON_CANDIDATE",
  "SHIPPING_SUPPORT_CANDIDATE",
  "BUNDLE_CANDIDATE",
  "coupon_math_mismatch",
  "checkout_revalidation_required:true",
  "application_enabled:false",
  "external_publish:false",
  'owner_gate:"REVIEW_REQUIRED"'
]) assert(offer.includes(token),"Offer Chess guard missing: "+token);

assert(!/fetch\s*\(|XMLHttpRequest|\.insert\s*\(|\.update\s*\(|\.delete\s*\(/.test(offer),"Offer Chess must not apply offers or mutate external systems");
console.log("boom_m05_offer_chess_contract=PASS");
