const fs=require("node:fs");
const assert=require("node:assert");

const html=fs.readFileSync("boom-growth-os.html","utf8");
const js=fs.readFileSync("boom-growth-os.js","utf8");
const passport=fs.readFileSync("boom-commerce-passport.js","utf8");
const marketing=fs.readFileSync("boom-marketing-brain.js","utf8");
const css=fs.readFileSync("boom-growth-os.css","utf8");

assert(html.includes('id="bg-passport-stats"'),"M01 passport stats UI missing");
assert(html.includes('id="bg-passport-channels"'),"M01 channel readiness UI missing");
assert(html.includes('id="bg-passport-blockers"'),"M01 blocker UI missing");
assert(html.indexOf("boom-commerce-passport.js")<html.indexOf("boom-marketing-brain.js"),"Passport core must load before Marketing Brain");

for(const token of [
  'client.from("hunt_catalog_products")',
  'client.from("hunt_business_identity")',
  "passportSummary",
  "passportBlockers",
  "renderPassports",
  "feed_availability_verified: false",
  "variant_availability_feed_ready: false",
  "owner_paid_approval: false",
  "google_free_listings: false",
  "agentic_ucp: false"
]) assert(js.includes(token),"Growth OS M01 contract missing: "+token);

for(const token of [
  "questions_and_answers",
  "related_products",
  "variant_options",
  "document_links",
  "data_ready",
  "discovery_ready",
  "transaction_ready",
  "source_freshness_not_verified",
  "feed_safe_availability_missing",
  "merchant_identity_not_ready",
  "owner_gate"
]) assert(passport.includes(token),"Commerce Passport contract missing: "+token);

for(const token of [
  "google_free_listings",
  "ai_commerce_discovery",
  "agentic",
  "passportSummary",
  "Keep paid media OFF"
]) assert(marketing.includes(token),"Marketing Brain passport contract missing: "+token);

for(const token of [".bg-passport-stats",".bg-passport-layout",".bg-passport-ready",".bg-passport-blocked"]){
  assert(css.includes(token),"Growth OS M01 styling missing: "+token);
}

assert(!/\.insert\s*\(|\.update\s*\(|\.delete\s*\(/.test(js),"Growth OS M01 must remain read-only");
console.log("boom_growth_passport_contract=PASS");
