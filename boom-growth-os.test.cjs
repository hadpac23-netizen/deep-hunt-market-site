const assert = require("node:assert/strict");
const Core = require("./boom-growth-os-core.js");

{
  const f = Core.funnel({unique_sessions:100,product_views:80,add_to_cart:8,checkout_starts:4,orders:2});
  assert.equal(f.productViewToCartPct, 10);
  assert.equal(f.cartToCheckoutPct, 50);
  assert.equal(f.checkoutToOrderPct, 50);
}

{
  const s = Core.scoreDeal({
    deal_score:76,
    inputs_verified:true,
    profit_gate_status:"PASS",
    truth_status:"verified",
    max_safe_cac:8,
    contribution_before_coupon:14,
    status:"owner_review"
  });
  assert.equal(s.eligibleForPromotion, true);
  assert.ok(s.score >= 70);
}

{
  const s = Core.scoreDeal({
    deal_score:90,
    inputs_verified:false,
    profit_gate_status:"FAIL",
    truth_status:"review",
    max_safe_cac:0,
    contribution_before_coupon:-1,
    status:"owner_review"
  });
  assert.equal(s.eligibleForPromotion, false);
  assert.ok(s.blockers.length >= 3);
}

{
  const milestones = Core.profitMilestones(20);
  assert.equal(milestones.find(x => x.target === 10000).minimumOrdersAtContribution, 500);
}

{
  const plan = Core.buildPlan({
    snapshot:{today:{unique_sessions:2,product_views:5,add_to_cart:0,checkout_starts:0,orders:0}},
    launchSummary:{soft_launch_status:"PASS",real_money_status:"HOLD",paid_marketing_status:"HOLD"},
    economics:[
      {inputs_verified:true,profit_gate_status:"PASS",contribution_before_coupon:12},
      {inputs_verified:true,profit_gate_status:"PASS",contribution_before_coupon:18},
      {inputs_verified:true,profit_gate_status:"PASS",contribution_before_coupon:15}
    ],
    deals:[]
  });
  assert.equal(plan.bottleneck.code, "TRAFFIC");
  assert.equal(plan.avgVerifiedContribution, 15);
}

{
  const exp = Core.recommendExperiment([
    {title:"Paid locked", paid:true, owner_approval_status:"required", status:"ready"},
    {title:"Organic product SEO", paid:false, owner_approval_status:"not_required", status:"ready"}
  ]);
  assert.equal(exp.title, "Organic product SEO");
}

{
  const focus = Core.radarFocus([
    {title:"Low value", priority:2, user_value:2, complexity:5, status:"scouted"},
    {title:"High value", priority:5, user_value:5, complexity:2, status:"prototype"}
  ]);
  assert.equal(focus.title, "High value");
}

console.log("BOOM Growth OS core tests: PASS");
