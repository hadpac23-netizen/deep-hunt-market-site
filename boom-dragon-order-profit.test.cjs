const assert=require("node:assert/strict");
const Profit=require("./boom-dragon-order-profit.js");

const preview=Profit.normalizePreview({
  status:"QUOTE_PROFIT_PREVIEW",currency:"USD",
  revenue_amount:30,supplier_product_cost:12,supplier_shipping_cost:5,
  payment_fee_reserve:1,refund_reserve:1,platform_fee:1,
  contribution_amount:10,contribution_margin_rate:.3333,fees_are_reserves:true
});
assert.equal(preview.realized,false);
assert.equal(preview.status,"QUOTE_PROFIT_PREVIEW");
assert.equal(preview.contribution_amount,10);

const provisional=Profit.evaluateActualOrder({
  order_id:"o1",payment_status:"paid",fulfillment_status:"delivered",
  revenue_amount:30,supplier_product_cost:12,supplier_shipping_cost:5,
  payment_fee_amount:1,platform_fee_amount:1,refund_amount:0
});
assert.equal(provisional.status,"FULFILLED_PROVISIONAL");
assert.equal(provisional.realized,false);
assert.equal(provisional.net_profit_amount,null);
assert.equal(provisional.contribution_amount,11);

const final=Profit.evaluateActualOrder({
  order_id:"o1",payment_status:"paid",fulfillment_status:"delivered",
  revenue_amount:30,supplier_product_cost:12,supplier_shipping_cost:5,
  payment_fee_amount:1,platform_fee_amount:1,refund_amount:0,
  tax_cost_amount:1,chargeback_amount:0,marketing_cost_amount:2,
  financial_finalized:true,costs_complete:true
});
assert.equal(final.status,"REALIZED_FINAL");
assert.equal(final.realized,true);
assert.equal(final.net_profit_amount,8);

const blocked=Profit.evaluateActualOrder({order_id:"o2",payment_status:"pending"});
assert.equal(blocked.realized,false);
assert.ok(blocked.issues.includes("PAYMENT_NOT_CONFIRMED"));

console.log("DRAGON Order Profit tests: PASS");