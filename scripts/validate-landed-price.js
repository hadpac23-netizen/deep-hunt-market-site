const L=require("../landed-price.js");
function assert(condition,message){if(!condition){console.error("FAIL",message);process.exitCode=1}else console.log("PASS",message)}

const partial=L.calculate({
  product_cost:10,product_cost_verified:true,
  shipping_cost:4,shipping_verified:true,
  country_code:"US",currency:"USD"
});
assert(partial.state==="COST_PARTIAL","verified source+shipping stays partial when fees/tax/margin are unknown");
assert(partial.suggested_retail_price===null,"no retail price is fabricated from incomplete economics");

const ready=L.calculate({
  product_cost:10,product_cost_verified:true,
  shipping_cost:4,shipping_verified:true,
  country_code:"US",currency:"USD",
  supplier_order_fee:0,handling_fee:0,duty_estimate:0,tax_estimate:0,
  payment_fee_rate:0.03,payment_fee_fixed:0.3,target_margin_rate:0.25
});
assert(ready.state==="RETAIL_READY","complete verified economics can become retail-ready");
assert(ready.suggested_retail_price>14,"retail covers known costs");
assert(ready.projected_profit>0,"target margin produces positive projected profit");

const blocked=L.calculate({
  product_cost:10,product_cost_verified:true,
  shipping_cost:null,shipping_verified:false,
  country_code:"IL",currency:"USD"
});
assert(blocked.state==="BLOCKED","missing destination shipping blocks pricing");
