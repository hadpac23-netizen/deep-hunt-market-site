const assert=require("node:assert");
const C=require("./boom-creator-os.js");
const future="2026-12-31T00:00:00Z";
const baseRights={
  usage_rights_verified:true,content_asset_verified:true,
  allowed_channels:["tiktok","instagram"],allowed_countries:["US","DE"],
  expires_at:future,paid_media_allowed:true,edit_remix_allowed:true
};
const passport={truth:{safe_category:true},creative_inputs:{no_claim_generation:true}};
const econ={
  inputs_verified:true,confirmed_revenue:100,
  product_contribution_before_creator_costs:40,
  creator_commission_amount:8,affiliate_commission_amount:0,coupon_cost:2,
  platform_fee:1,content_fee:4,refund_reserve:2,chargeback_reserve:1,support_cost:1
};
const attrib={
  attribution_key:"creator:tiktok:abc",
  event_id_persistence_ready:true,
  confirmed_conversion_source_ready:true,
  click_or_referral_identity_ready:true,
  confirmed_conversions:25
};
const scale=C.evaluate({
  creator:{creator_id:"c1",platform:"tiktok"},passport,rights_input:baseRights,economics_input:econ,attribution_input:attrib,
  context:{channel:"tiktok",country:"US",paid_media:true,claim_firewall_pass:true,owner_approved:true,min_scale_conversions:20,now_ms:Date.parse("2026-09-19T12:00:00Z")},
  performance:{observed_net_contribution_after_creator_costs:20,refund_rate:.04,chargeback_rate:.003}
});
assert.strictEqual(scale.state,"SCALE_CANDIDATE");
assert.strictEqual(scale.economics.total_creator_cost,19);
assert.strictEqual(scale.economics.net_contribution_after_creator_costs,21);
assert.strictEqual(scale.performance_claims_allowed,true);
assert.strictEqual(scale.publish,false);
assert.strictEqual(scale.payout,false);

const rightsHold=C.evaluate({
  creator:{creator_id:"c2",platform:"instagram"},passport,
  rights_input:{...baseRights,allowed_countries:["DE"]},
  economics_input:econ,attribution_input:attrib,
  context:{channel:"instagram",country:"US",paid_media:true,claim_firewall_pass:true,owner_approved:true,now_ms:Date.parse("2026-09-19T12:00:00Z")}
});
assert.strictEqual(rightsHold.state,"RIGHTS_HOLD");
assert(rightsHold.rights.blockers.includes("country_not_licensed"));

const econHold=C.evaluate({
  creator:{creator_id:"c3",platform:"tiktok"},passport,rights_input:baseRights,
  economics_input:{...econ,chargeback_reserve:null},attribution_input:attrib,
  context:{channel:"tiktok",country:"US",claim_firewall_pass:true,owner_approved:true,now_ms:Date.parse("2026-09-19T12:00:00Z")}
});
assert.strictEqual(econHold.state,"ECONOMICS_HOLD");

const attribHold=C.evaluate({
  creator:{creator_id:"c4",platform:"tiktok"},passport,rights_input:baseRights,economics_input:econ,
  attribution_input:{...attrib,event_id_persistence_ready:false,confirmed_conversions:0},
  context:{channel:"tiktok",country:"US",claim_firewall_pass:true,owner_approved:true,now_ms:Date.parse("2026-09-19T12:00:00Z")}
});
assert.strictEqual(attribHold.state,"ATTRIBUTION_HOLD");
assert.strictEqual(attribHold.performance_claims_allowed,false);
assert.strictEqual(attribHold.commission_claims_allowed,false);

const ownerHold=C.evaluate({
  creator:{creator_id:"c5",platform:"tiktok"},passport,rights_input:baseRights,economics_input:econ,attribution_input:attrib,
  context:{channel:"tiktok",country:"US",claim_firewall_pass:true,owner_approved:false,now_ms:Date.parse("2026-09-19T12:00:00Z")}
});
assert.strictEqual(ownerHold.state,"OWNER_HOLD");

const system=C.systemReadiness({
  creator_registry_ready:false,
  rights_ledger_ready:false,
  attribution_registry_ready:false,
  economics_ledger_ready:false,
  claim_firewall_ready:true,
  event_id_persistence_ready:false,
  confirmed_conversion_source_ready:false,
  creator_registry_count:0,
  rights_verified_count:0,
  confirmed_creator_conversions:0
});
assert.strictEqual(system.state,"HOLD");
assert(system.blockers.includes("creator_registry_missing"));
assert(system.blockers.includes("creator_rights_ledger_missing"));
assert(system.blockers.includes("event_id_persistence_missing"));
assert.strictEqual(system.publish_actions,0);
assert.strictEqual(system.payouts,0);

const summary=C.summarize([scale,rightsHold,econHold,attribHold,ownerHold]);
assert.strictEqual(summary.total,5);
assert.strictEqual(summary.publish_actions,0);
assert.strictEqual(summary.payouts,0);
assert.strictEqual(summary.execute_actions,false);
console.log("boom_creator_os=PASS",JSON.stringify(summary));