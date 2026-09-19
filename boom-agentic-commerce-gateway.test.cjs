const assert=require("node:assert");
const A=require("./boom-agentic-commerce-gateway.js");

const current=A.readiness({
  protocol_version:"2026-04-08",
  service_endpoint:"",
  schema_url:"",
  merchant_identity_ready:false,
  product_feed_ready:false,
  shipping_policy_ready:false,
  returns_policy_ready:false,
  source_freshness_ready:false,
  cart_endpoint_ready:false,
  cart_line_item_validation_ready:false,
  exact_variant_recheck_ready:true,
  continue_url_ready:false,
  ucp_auth_ready:false,
  merchant_center_ready:false,
  ucp_program_approved:false,
  native_checkout_endpoints_ready:false,
  payment_handler_ready:false,
  m2m_bearer_auth_ready:false,
  order_creation_ready:false,
  order_status_webhook_ready:false,
  real_money_owner_approved:false
});
assert.strictEqual(current.state,"HOLD");
assert.strictEqual(current.manifest.capabilities.length,0);
assert.strictEqual(current.manifest.native_checkout_enabled,false);
assert.strictEqual(current.payments_created,0);

const discovery=A.readiness({
  protocol_version:"2026-04-08",
  service_endpoint:"https://hunt.example/ucp/v1",
  schema_url:"https://ucp.dev/2026-04-08/services/shopping/openapi.json",
  merchant_identity_ready:true,
  product_feed_ready:true,
  shipping_policy_ready:true,
  returns_policy_ready:true,
  source_freshness_ready:true,
  cart_endpoint_ready:false,
  cart_line_item_validation_ready:false,
  exact_variant_recheck_ready:true,
  continue_url_ready:false,
  ucp_auth_ready:false
});
assert.strictEqual(discovery.state,"DISCOVERY_PREPARE");
assert.deepStrictEqual(discovery.manifest.capabilities,["discovery"]);
assert.strictEqual(discovery.manifest.profile_publish_ready,false);

const cart=A.readiness({
  protocol_version:"2026-04-08",
  service_endpoint:"https://hunt.example/ucp/v1",
  schema_url:"https://ucp.dev/2026-04-08/services/shopping/openapi.json",
  merchant_identity_ready:true,product_feed_ready:true,shipping_policy_ready:true,returns_policy_ready:true,source_freshness_ready:true,
  cart_endpoint_ready:true,cart_line_item_validation_ready:true,exact_variant_recheck_ready:true,continue_url_ready:true,ucp_auth_ready:true,
  merchant_center_ready:false,ucp_program_approved:false,native_checkout_endpoints_ready:false,payment_handler_ready:false,
  m2m_bearer_auth_ready:false,order_creation_ready:false,order_status_webhook_ready:false,real_money_owner_approved:false
});
assert.strictEqual(cart.state,"CART_PREPARE");
assert.deepStrictEqual(cart.manifest.capabilities,["discovery","cart"]);
assert.strictEqual(cart.manifest.checkout.ready,false);

const checkout=A.readiness({
  protocol_version:"2026-04-08",
  service_endpoint:"https://hunt.example/ucp/v1",
  schema_url:"https://ucp.dev/2026-04-08/services/shopping/openapi.json",
  merchant_identity_ready:true,product_feed_ready:true,shipping_policy_ready:true,returns_policy_ready:true,source_freshness_ready:true,
  cart_endpoint_ready:true,cart_line_item_validation_ready:true,exact_variant_recheck_ready:true,continue_url_ready:true,ucp_auth_ready:true,
  merchant_center_ready:true,ucp_program_approved:true,native_checkout_endpoints_ready:true,payment_handler_ready:true,
  m2m_bearer_auth_ready:true,order_creation_ready:true,order_status_webhook_ready:true,real_money_owner_approved:true,
  public_well_known_profile_ready:true,google_ucp_profile_review_ready:true
});
assert.strictEqual(checkout.state,"OWNER_REVIEW");
assert(checkout.manifest.capabilities.includes("checkout"));
assert.strictEqual(checkout.manifest.profile_publish_ready,true);
assert.strictEqual(checkout.manifest.well_known_publish,false);
assert.strictEqual(checkout.manifest.payment_enabled,false);
assert.strictEqual(checkout.execute_actions,false);

console.log("boom_agentic_commerce_gateway=PASS",JSON.stringify({
  current:current.state,discovery:discovery.state,cart:cart.state,checkout:checkout.state
}));