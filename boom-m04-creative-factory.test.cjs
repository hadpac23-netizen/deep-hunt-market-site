const fs=require("node:fs");
const assert=require("node:assert");
const html=fs.readFileSync("boom-growth-os.html","utf8");
const js=fs.readFileSync("boom-growth-os.js","utf8");
const firewall=fs.readFileSync("boom-claim-firewall.js","utf8");
const factory=fs.readFileSync("boom-creative-factory.js","utf8");

for(const token of [
  'id="bg-creative-state"',
  'id="bg-creative-stats"',
  'id="bg-creative-output"',
  'id="bg-creative-blockers"',
  'boom-claim-firewall.js?v=m04',
  'boom-creative-factory.js?v=m04'
]) assert(html.includes(token),"M04 UI/load contract missing: "+token);

assert(html.indexOf("boom-claim-firewall.js?v=m04")<html.indexOf("boom-creative-factory.js?v=m04"),"Claim Firewall must load before Creative Factory");
assert(html.indexOf("boom-creative-factory.js?v=m04")<html.indexOf("boom-growth-os.js"),"Creative Factory must load before Growth OS");

for(const token of [
  "creativeBatch",
  "creativeTopBlockers",
  "renderCreativeFactory",
  "claim_firewall?.pass===true",
  "ClaimFirewall",
  "CreativeFactory"
]) assert(js.includes(token),"M04 Growth runtime missing: "+token);

for(const token of [
  "waterproof_claim",
  "universal_fit_claim",
  "delivery_promise",
  "free_shipping_claim",
  "scarcity_claim",
  "popularity_claim",
  "medical_claim",
  "discount_claim",
  "publish_ready:false"
]) assert(firewall.includes(token),"Claim Firewall guard missing: "+token);

for(const token of [
  "verified_facts",
  "verified_creative_fact_missing",
  'channel:"google_asset"',
  'channel:"meta_reels"',
  'channel:"tiktok"',
  'channel:"pinterest"',
  "approved product-linked media",
  "external_publish:false",
  'owner_gate:"REVIEW_REQUIRED"'
]) assert(factory.includes(token),"Creative Factory contract missing: "+token);

assert(!/fetch\s*\(|XMLHttpRequest|\.insert\s*\(|\.update\s*\(|\.delete\s*\(/.test(factory),"Creative Factory must not publish or mutate external systems");
assert(!/fetch\s*\(|XMLHttpRequest/.test(firewall),"Claim Firewall must be local/pure");
console.log("boom_m04_creative_factory_contract=PASS");
