const fs=require("node:fs");
const assert=require("node:assert");

const html=fs.readFileSync("boom-growth-os.html","utf8");
const js=fs.readFileSync("boom-growth-os.js","utf8");
const creator=fs.readFileSync("boom-creator-os.js","utf8");

for(const token of [
  'id="bg-creator-state"',
  'id="bg-creator-stats"',
  'id="bg-creator-readiness"',
  'id="bg-creator-blockers"',
  'boom-creator-os.js?v=m07'
]) assert(html.includes(token),"M07 UI/load missing: "+token);

for(const token of [
  "creatorSnapshot","creatorSystem","renderCreatorOS",
  'client.from("hunt_distribution_drafts").select("id",{count:"exact",head:true}).ilike("channel","%creator%")',
  'client.from("merchant_conversion_events").select("id",{count:"exact",head:true})',
  'client.from("hunt_partner_matrix").select("id",{count:"exact",head:true}).not("media_rights_verified_at","is",null)',
  "creator_registry_ready:false","rights_ledger_ready:false",
  "attribution_registry_ready:false","economics_ledger_ready:false",
  "publish_enabled:false","payout_enabled:false"
]) assert(js.includes(token),"M07 Growth runtime missing: "+token);

for(const token of [
  "RIGHTS_HOLD","ECONOMICS_HOLD","ATTRIBUTION_HOLD","OWNER_HOLD",
  "TEST_CANDIDATE","SCALE_CANDIDATE",
  "usage_rights_not_verified","rights_expired","channel_not_licensed","country_not_licensed",
  "paid_media_rights_missing","edit_remix_rights_missing",
  "creator_commission_amount","affiliate_commission_amount","coupon_cost","content_fee",
  "refund_reserve","chargeback_reserve","support_cost",
  "creator_attribution_key_missing","event_id_persistence_missing",
  "confirmed_conversion_source_missing","referral_identity_missing",
  "performance_claims_allowed","commission_claims_allowed",
  "publish:false","payout:false","execute:false",
  'owner_gate:"REVIEW_REQUIRED"'
]) assert(creator.includes(token),"M07 creator guard missing: "+token);

for(const forbidden of ["race","religion","sexual_orientation","political","health_condition"]){
  assert(!creator.includes(forbidden),"Creator OS must not profile sensitive trait: "+forbidden);
}
assert(!/fetch\s*\(|XMLHttpRequest|\.insert\s*\(|\.update\s*\(|\.delete\s*\(/.test(creator),"Creator OS core must not publish, pay, or mutate external systems");
console.log("boom_m07_creator_os_contract=PASS");
