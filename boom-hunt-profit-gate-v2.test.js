const assert=require("assert");
const {PROFILE_NAME,DEFAULTS,targetRetail,evaluateProfit}=require("./boom-hunt-profit-gate-v2.js");

assert.equal(PROFILE_NAME,"HUNT-CJ-2026-v1");
assert.equal(DEFAULTS.payment_reserve_rate,.04);
assert.equal(DEFAULTS.refund_reserve_rate,.05);
assert.equal(DEFAULTS.min_profit_usd,4);
assert.equal(DEFAULTS.target_product_margin,.35);
assert.equal(DEFAULTS.min_margin_rate,.20);

const target=targetRetail(7.63);
assert(target.target_retail_usd>=13.99);
assert(target.projected_product_contribution_usd>=4);
assert(target.projected_product_margin>=.35);
assert.equal(target.min_margin_rate,.20);

const cj=evaluateProfit({
  supplier_cost_usd:7.63,
  retail_price_usd:13.99,
  market_validation_pass:true,
  supplier_shipping_usd:6.61,
  customer_shipping_grossup_usd:7.26
});
assert.equal(cj.status,"PROFIT_PASS");
assert.equal(cj.final_profit_verified,false);
assert.equal(cj.minimum_margin_met,true);

const belowTargetButAboveMinimum=evaluateProfit({
  supplier_cost_usd:4,
  retail_price_usd:11,
  market_validation_pass:true,
  supplier_shipping_usd:5,
  customer_shipping_grossup_usd:5.5
});
assert.notEqual(belowTargetButAboveMinimum.status,"PROFIT_BLOCK");
assert.equal(belowTargetButAboveMinimum.minimum_margin_met,true);

const unknownShip=evaluateProfit({supplier_cost_usd:7.63,market_validation_pass:true});
assert.equal(unknownShip.status,"PROFIT_REVIEW");
assert.equal(unknownShip.reason,"DESTINATION_SHIPPING_NOT_VERIFIED");

const unknownMarket=evaluateProfit({supplier_cost_usd:7.63});
assert.equal(unknownMarket.status,"PROFIT_REVIEW");
assert.equal(unknownMarket.reason,"MARKET_VALIDATION_UNKNOWN");

console.log("PASS boom-hunt-profit-gate-v2");
