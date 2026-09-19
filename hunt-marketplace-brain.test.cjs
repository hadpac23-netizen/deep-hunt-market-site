const assert=require("node:assert");
const M=require("./hunt-marketplace-brain.js");

const store={id:"s1",status:"approved",kyc_status:"verified",website_url:"https://shop.example.com"};
const good=M.productEligibility({
  external_id:"p1",title:"Product",status:"approved",safety_status:"passed",
  category_supported:true,product_url:"https://shop.example.com/p/1",currency:"USD",price_amount:20
},store);
assert.strictEqual(good.eligible,true);
assert.strictEqual(good.publish,false);

const bad=M.productEligibility({
  external_id:"p2",title:"Bad",status:"pending_review",safety_status:"passed",
  category_supported:true,product_url:"http://evil.example/p",publish_requested:true
},store);
assert(bad.blockers.includes("product_not_approved"));
assert(bad.blockers.includes("product_url_not_https"));
assert(bad.blockers.includes("publication_before_review_forbidden"));

const readiness=M.systemReadiness({
  marketplace_snapshot_adapter_ready:false,
  merchant_registry_ready:true,store_review_workflow_ready:true,product_review_workflow_ready:true,
  program_gate_ready:true,seller_api_secret_hashing_ready:false,seller_api_revocation_ready:false,
  seller_api_rate_limit_ready:false,attribution_registry_ready:false,payout_controls_ready:false
});
assert.strictEqual(readiness.state,"HOLD");
assert.strictEqual(readiness.auto_approve_merchants,false);
assert.strictEqual(readiness.merchant_payouts,false);
assert.strictEqual(M.VERSION,"2026-09-19-v1");
console.log("hunt_marketplace_brain=PASS");