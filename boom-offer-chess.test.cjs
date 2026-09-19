const assert=require("node:assert");
const O=require("./boom-offer-chess.js");

const base={
  currency:"USD",
  sale_price_per_unit:9.99,
  customer_shipping_amount:7.5,
  supplier_shipping_cost:7.5,
  contribution_before_coupon:4.09,
  min_required_contribution:4,
  max_safe_coupon_amount:.09,
  max_safe_coupon_rate:.0086,
  max_safe_cac:.09,
  inputs_verified:true,
  profit_gate_status:"PASS"
};

const tiny=O.evaluate({econ:base,control:{onsite_state:"ACTIVE"},context:{shipping_verified:true}});
assert.strictEqual(tiny.state,"READY");
assert.strictEqual(tiny.recommendation,"NO_OFFER","Tiny safe coupon should not become a marketing gimmick");
assert.strictEqual(tiny.application_enabled,false);

const coupon=O.evaluate({
  econ:{...base,sale_price_per_unit:5.99,contribution_before_coupon:4.51,max_safe_coupon_amount:.51,max_safe_coupon_rate:.0846,max_safe_cac:.51},
  control:{onsite_state:"ACTIVE"},
  context:{shipping_verified:true}
});
assert.strictEqual(coupon.recommendation,"SAFE_COUPON_CANDIDATE");
assert.strictEqual(coupon.selected.max_discount_amount,.51);
assert(coupon.verified_claims.includes("discount"));

const shipping=O.evaluate({
  econ:{...base,customer_shipping_amount:1,contribution_before_coupon:6,min_required_contribution:4,max_safe_coupon_amount:2,max_safe_coupon_rate:.2,max_safe_cac:2},
  control:{onsite_state:"ACTIVE"},
  context:{shipping_verified:true}
});
assert.strictEqual(shipping.recommendation,"SHIPPING_SUPPORT_CANDIDATE");
assert(shipping.verified_claims.includes("free shipping"));

const bundle=O.evaluate({
  econ:{...base,contribution_before_coupon:7,min_required_contribution:4,max_safe_coupon_amount:3,max_safe_coupon_rate:.3,max_safe_cac:3},
  control:{onsite_state:"ACTIVE"},
  context:{shipping_verified:true,bundle_preview_verified:true,bundle_discount_amount:2}
});
assert.strictEqual(bundle.recommendation,"BUNDLE_CANDIDATE");

const stopped=O.evaluate({econ:base,control:{onsite_state:"STOP"},context:{shipping_verified:true}});
assert.strictEqual(stopped.state,"HOLD");
assert.strictEqual(stopped.recommendation,"HOLD");
assert(stopped.blockers.includes("control_tower_stop"));

const mismatch=O.evaluate({
  econ:{...base,max_safe_coupon_amount:2},
  control:{onsite_state:"ACTIVE"},
  context:{shipping_verified:true}
});
assert.strictEqual(mismatch.state,"HOLD");
assert(mismatch.blockers.includes("coupon_math_mismatch"));

const summary=O.summarize([tiny,coupon,shipping,bundle,stopped]);
assert.deepStrictEqual({
  total:summary.total,hold:summary.hold,no_offer:summary.no_offer,coupon:summary.coupon_candidate,shipping:summary.shipping_candidate,bundle:summary.bundle_candidate
},{total:5,hold:1,no_offer:1,coupon:1,shipping:1,bundle:1});
assert.strictEqual(summary.application_enabled,false);

console.log("boom_offer_chess=PASS",JSON.stringify(summary));
