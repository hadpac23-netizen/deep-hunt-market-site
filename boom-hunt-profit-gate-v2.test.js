const assert=require("assert");
const {targetRetail,evaluateProfit}=require("./boom-hunt-profit-gate-v2.js");

const p=targetRetail(7.63);
assert(p);
assert(p.target_retail_usd>=13.99);
assert(p.projected_product_contribution_usd>=4);
assert(p.projected_product_margin>=.35);

const cj=evaluateProfit({
  supplier_cost_usd:7.63,
  retail_price_usd:13.99,
  market_validation_pass:true,
  supplier_shipping_usd:6.61,
  customer_shipping_grossup_usd:7.26
});
assert.equal(cj.status,"PROFIT_PASS");
assert.equal(cj.reason,"PROJECTED_DESTINATION_CONTRIBUTION_PASS");
assert(Math.abs(cj.projected_order_contribution_usd-5.1)<.02);
assert.equal(cj.final_profit_verified,false);

const unknownShip=evaluateProfit({
  supplier_cost_usd:7.63,
  market_validation_pass:true
});
assert.equal(unknownShip.status,"PROFIT_REVIEW");
assert.equal(unknownShip.reason,"DESTINATION_SHIPPING_NOT_VERIFIED");

const unknownMarket=evaluateProfit({supplier_cost_usd:7.63});
assert.equal(unknownMarket.status,"PROFIT_REVIEW");
assert.equal(unknownMarket.reason,"MARKET_VALIDATION_UNKNOWN");

const badPrice=evaluateProfit({
  supplier_cost_usd:20,
  retail_price_usd:21,
  market_validation_pass:true,
  supplier_shipping_usd:5,
  customer_shipping_usd:5.5
});
assert.equal(badPrice.status,"PROFIT_BLOCK");
assert.equal(badPrice.reason,"PRODUCT_MARGIN_OR_CONTRIBUTION_BELOW_FLOOR");

console.log("PASS boom-hunt-profit-gate-v2");
