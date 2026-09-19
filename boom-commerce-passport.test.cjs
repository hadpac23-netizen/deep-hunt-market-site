const assert=require("node:assert");
const P=require("./boom-commerce-passport.js");

const baseProduct={
  provider:"CJdropshipping",
  item_id:"sku-1",
  title:"Protective Phone Case",
  description:"Protective phone case with source-provided variant options and product imagery.",
  category:"phone-cases",
  image_url:"https://cdn.example.com/main.jpg",
  gallery:["https://cdn.example.com/main.jpg","https://cdn.example.com/alt.jpg"],
  retail_price_verified:true,
  profit_gate_status:"PASS",
  retail_price_amount:19.99,
  retail_currency:"USD",
  availability_verified:true,
  variant_count:4,
  brand:"Example",
  condition:"new"
};

const common={
  canonical_url:"https://hunt.example/product.html?id=sku-1",
  merchant_identity_ready:true,
  shipping_policy_ready:true,
  returns_policy_ready:true,
  source_fresh:true,
  connected_channels:{
    google_free_listings:true,
    google_ai:true,
    meta_catalog:true,
    tiktok_catalog:true,
    pinterest_catalog:true,
    agentic_ucp:true,
    paid_media:true
  }
};

const recheck=P.build(baseProduct,common);
assert.strictEqual(recheck.truth.price.verified,true);
assert.strictEqual(recheck.truth.availability.exportable,false,"Variant product must not export catalog availability without feed-safe variant evidence");
assert(recheck.channels.google_free_listings.blockers.includes("feed_safe_availability_missing"));
assert.strictEqual(recheck.channels.google_free_listings.discovery_ready,false);

const googleReady=P.build(baseProduct,{
  ...common,
  variant_availability_feed_ready:true,
  questions_and_answers:[
    {question:"What model is this for?",answer:"Use the exact provider option shown on the product page.",verified:true},
    {question:"Is delivery guaranteed?",answer:"Tomorrow.",verified:false}
  ],
  related_products:[{offer_id:"sku-2",relationship:"accessory"}],
  variants:[
    {color:"Black",size:"iPhone 15"},
    {color:"Blue",size:"iPhone 15"}
  ],
  document_links:[{url:"https://cdn.example.com/manual.pdf",label:"Product guide"}]
});
assert.strictEqual(googleReady.channels.google_free_listings.discovery_ready,true);
assert.strictEqual(googleReady.google_merchant_draft.publish_ready,true);
assert.strictEqual(googleReady.conversational.questions_and_answers.length,1,"Only verified Q&A can leave HUNT");
assert.strictEqual(googleReady.google_merchant_draft.conversational.questions_and_answers.length,1);
assert.strictEqual(googleReady.google_merchant_draft.productAttributes.price.amountMicros,"19990000");
assert.strictEqual(googleReady.google_merchant_draft.productAttributes.availability,"IN_STOCK");
assert.deepStrictEqual(googleReady.conversational.variant_options.color,["Black","Blue"]);

const ucp=P.build(baseProduct,{
  ...common,
  variant_availability_feed_ready:true,
  checkout_ready:true,
  payment_ready:false,
  order_ready:false,
  tracking_ready:false
});
assert.strictEqual(ucp.channels.agentic_ucp.discovery_ready,true,"UCP discovery should be separable from transaction readiness");
assert.strictEqual(ucp.channels.agentic_ucp.transaction_ready,false,"UCP transaction must remain blocked while checkout lifecycle is incomplete");
assert(ucp.channels.agentic_ucp.transaction_blockers.includes("payment_not_ready"));
assert(ucp.channels.agentic_ucp.transaction_blockers.includes("order_creation_not_ready"));
assert(ucp.channels.agentic_ucp.transaction_blockers.includes("tracking_not_ready"));

const paid=P.build(baseProduct,{
  ...common,
  variant_availability_feed_ready:true,
  attribution_ready:false,
  owner_paid_approval:false,
  unit_economics:{
    inputs_verified:false,
    profit_gate_status:"HOLD",
    contribution_before_coupon:0
  }
});
assert.strictEqual(paid.channels.paid_media.discovery_ready,false);
assert(paid.channels.paid_media.blockers.includes("verified_unit_economics_missing"));
assert(paid.channels.paid_media.blockers.includes("attribution_not_ready"));
assert(paid.channels.paid_media.blockers.includes("owner_paid_approval_required"));

const paidReady=P.build(baseProduct,{
  ...common,
  variant_availability_feed_ready:true,
  attribution_ready:true,
  owner_paid_approval:true,
  unit_economics:{
    inputs_verified:true,
    profit_gate_status:"PASS",
    contribution_before_coupon:7.5,
    max_safe_cac:3.25,
    max_safe_coupon_amount:2,
    currency:"USD"
  }
});
assert.strictEqual(paidReady.channels.paid_media.discovery_ready,true);
assert.strictEqual(paidReady.economics.max_safe_cac,3.25);

const summary=P.summarize([recheck,googleReady,ucp,paid,paidReady]);
assert.strictEqual(summary.total,5);
assert.strictEqual(summary.price_verified,5);
assert(summary.channels.google_free_listings.ready>=2);

const unsafe=P.build({...baseProduct,title:"Cannabis vape",category:"vape"},common);
assert.strictEqual(unsafe.truth.safe_category,false);
assert(unsafe.channels.organic_social.blockers.includes("restricted_or_unsafe_category"));

assert.strictEqual(P.VERSION,"2026-09-19-v1");
console.log("boom_commerce_passport=PASS",JSON.stringify({
  google_ready:googleReady.channels.google_free_listings.discovery_ready,
  google_ai_depth:googleReady.channels.google_ai.conversational_depth,
  ucp_blockers:ucp.channels.agentic_ucp.blockers,
  paid_blockers:paid.channels.paid_media.blockers,
  summary
}));
