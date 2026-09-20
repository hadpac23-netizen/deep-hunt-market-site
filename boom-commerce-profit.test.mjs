import assert from "node:assert/strict";
import {evaluateCommerceProfit} from "./supabase/functions/_shared/hunt-commerce-profit.mjs";

const profile={
  payment_rate:.04,
  refund_reserve_rate:.05,
  platform_variable_rate:0,
  platform_fixed_per_order:0,
  min_contribution_per_unit:4,
  min_margin_rate:.20
};

let r=evaluateCommerceProfit(profile,{
  quantity:1,
  sale_price_per_unit:7.99,
  supplier_cost_per_unit:2.85,
  customer_shipping_amount:4.20,
  supplier_shipping_cost:4.20
});
assert.equal(r.profit_gate_status,"PASS");
assert.equal(r.contribution_before_coupon,4.04);
assert.equal(r.min_required_contribution,4);

r=evaluateCommerceProfit(profile,{
  quantity:1,
  sale_price_per_unit:9.99,
  supplier_cost_per_unit:4.33,
  customer_shipping_amount:7.50,
  supplier_shipping_cost:7.50
});
assert.equal(r.profit_gate_status,"PASS");
assert.equal(r.contribution_before_coupon,4.09);

r=evaluateCommerceProfit(profile,{
  quantity:1,
  sale_price_per_unit:5,
  supplier_cost_per_unit:4,
  customer_shipping_amount:5,
  supplier_shipping_cost:5
});
assert.notEqual(r.profit_gate_status,"PASS");
console.log("BOOM commerce profit kernel: PASS — live landed-cost margin gate is deterministic");