const assert=require("node:assert");
const B=require("./boom-sales-advertising-brain.js");

const product={
  title:"Verified shoe",description:"Useful details",image_url:"https://example.com/a.jpg",
  retail_price_verified:true,profit_gate_status:"PASS",availability_verified:true,category:"shoes"
};
const econ={inputs_verified:true,max_safe_cac:8};
const ctx={
  shipping_clarity_ready:true,returns_clarity_ready:true,mobile_readability_ready:true,
  attribution_ready:true,holdout_ready:true,landing_page_measurement_ready:true,
  owner_paid_approval:false,objective:"contribution_value"
};
const candidate=B.planCandidate({
  product,economics:econ,context:ctx,
  audience_input:{shopping_intents:["running shoes"],categories:["shoes"],health:"blocked"}
});
assert(candidate.blockers.includes("sensitive_targeting_rejected"));
assert(candidate.blockers.includes("owner_paid_approval_required"));
assert.strictEqual(candidate.paid_launch,false);
assert.strictEqual(candidate.execute,false);

const cleanCandidate=B.planCandidate({
  product,economics:econ,context:ctx,
  audience_input:{shopping_intents:["running shoes"],categories:["shoes"]}
});
assert.strictEqual(cleanCandidate.state,"OWNER_REVIEW");
assert.strictEqual(cleanCandidate.max_safe_cac,8);
assert.strictEqual(cleanCandidate.spend_authorized,false);
assert.strictEqual(B.VERSION,"2026-09-19-v1");
console.log("boom_sales_advertising_brain=PASS");