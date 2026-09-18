const assert=require("node:assert/strict");
const B=require("./boom-b13-master-prompt.js");

const watch=B.createWatchPlan({
  product:{provider:"CJdropshipping",item_id:"p1",variant_id:"v1"},
  country:"IL"
});
assert.equal(watch.ready,true);
assert.equal(watch.live_notifications,false);
assert(watch.fields.includes("shipping"));

const style=B.createWatchPlan({
  scope:"look",
  items:[
    {provider:"CJdropshipping",item_id:"a"},
    {provider:"CJdropshipping",item_id:"b"}
  ],
  country:"DE"
});
assert.equal(style.ready,true);
assert(style.fields.includes("total_look_cost"));

const changes=B.meaningfulChanges(
  {price:20,stock:"in",sizes:["M","L"],shipping:"CJPacket"},
  {price:18,stock:"in",sizes:["S","M","L"],shipping:"CJPacket"}
);
assert.equal(changes.meaningful,true);
assert(changes.changes.some(x=>x.field==="price"));
assert(changes.changes.some(x=>x.field==="sizes"));

const decon=B.createLookDeconstructionPlan({
  source_ref:"owner-upload-1",
  components:[
    {category:"dress",descriptor:"black evening dress",confidence:.93},
    {category:"bag",descriptor:"small shoulder bag",confidence:.82}
  ],
  country:"IL"
});
assert.equal(decon.ready,true);
assert.equal(decon.provider_execution,false);
assert.equal(decon.verified_product_matches_required,true);

for(const action of B.CUSTOMER_ACTIONS)assert.equal(B.customerControl(action,{target:"women"}).valid,true);
assert.equal(B.customerControl("reset_taste").effect.reset,true);
assert.equal(B.customerControl("less_like_this",{target:"tech"}).effect.signal,-1);

const post=B.postPurchasePlan({
  country:"IL",
  orders:[{id:"o1",verified:true,status:"delivered",items:[
    {provider:"CJdropshipping",item_id:"d1",category:"women-dresses"}
  ]}]
});
assert.equal(post.ready,true);
assert(post.complement_categories.includes("women-shoes"));
assert.equal(post.requires_live_product_truth,true);

const badReferral=B.referralDecision({
  referrer_id:"u1",customer_id:"u1",conversion_verified:true,reward_rule_verified:true
});
assert.equal(badReferral.reward_eligible,false);
assert(badReferral.blockers.includes("SELF_REFERRAL_BLOCKED"));

const goodReferral=B.referralDecision({
  referrer_id:"u1",customer_id:"u2",conversion_verified:true,reward_rule_verified:true
});
assert.equal(goodReferral.reward_eligible,true);
assert.equal(goodReferral.points_issued,0);

const group=B.shopTogetherFoundation({participants:["u1","u2"],look_id:"look-1"});
assert.equal(group.ready,true);
assert.equal(group.shared_cart_supported,false);
assert.equal(group.payment_authority,"individual_checkout_only");

assert.equal(B.coverage().length,7);
console.log("boom_b13_master_prompt=PASS");
