const assert=require("node:assert");
const O=require("./boom-offer-chess.js");
const rows=[
  {sale_price_per_unit:9.99,customer_shipping_amount:7.5,supplier_shipping_cost:7.5,contribution_before_coupon:4.09,min_required_contribution:4,max_safe_coupon_amount:.09,max_safe_coupon_rate:.0086,max_safe_cac:.09,inputs_verified:true,profit_gate_status:"PASS",currency:"USD"},
  {sale_price_per_unit:7.99,customer_shipping_amount:4.2,supplier_shipping_cost:4.2,contribution_before_coupon:4.04,min_required_contribution:4,max_safe_coupon_amount:.04,max_safe_coupon_rate:.0054,max_safe_cac:.04,inputs_verified:true,profit_gate_status:"PASS",currency:"USD"},
  {sale_price_per_unit:5.99,customer_shipping_amount:4.16,supplier_shipping_cost:4.16,contribution_before_coupon:4.51,min_required_contribution:4,max_safe_coupon_amount:.51,max_safe_coupon_rate:.0846,max_safe_cac:.51,inputs_verified:true,profit_gate_status:"PASS",currency:"USD"}
].map(econ=>O.evaluate({econ,control:{onsite_state:"ACTIVE"},context:{shipping_verified:true}}));
assert.deepStrictEqual(rows.map(x=>x.recommendation),["NO_OFFER","NO_OFFER","SAFE_COUPON_CANDIDATE"]);
const s=O.summarize(rows);
assert.strictEqual(s.no_offer,2);
assert.strictEqual(s.coupon_candidate,1);
assert.deepStrictEqual(s.safe_coupon_range,{min:.51,max:.51});
assert.strictEqual(s.application_enabled,false);
console.log("boom_offer_chess_live_baseline=PASS",JSON.stringify(s));
