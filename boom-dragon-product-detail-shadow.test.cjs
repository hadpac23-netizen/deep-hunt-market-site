const assert=require("node:assert/strict");
const D=require("./boom-dragon-product-detail-shadow.js");
const product={
  provider:"CJdropshipping",item_id:"p1",title:"Test",
  variants:[
    {variant_id:"v1",availability_verified:true,stock_quantity:5,retail_price_verified:true,profit_gate_status:"PASS",price_amount:2,retail_price_amount:7.99,projected_product_profit:4.2,projected_product_margin:.52},
    {variant_id:"v2",availability_verified:true,stock_quantity:20,retail_price_verified:true,profit_gate_status:"PASS",price_amount:3,retail_price_amount:8.99}
  ]
};
const v=D.selectVariant(product);
assert.equal(v.variant_id,"v2");
const x=D.summarize(product,v,{
  stock_verified:true,stock_available:true,shipping_verified:true,
  shipping_options:[{name:"CJPacket",price_usd:4.2,aging:"6-10 days"}]
},"US");
assert.equal(x.status,"DETAIL_SAMPLE_VERIFIED");
assert.equal(x.detail_truth_ready,true);
assert.equal(x.portfolio_truth_ready,false);
assert.equal(x.shipping_verified,true);
assert.equal(x.profit_gate_status,"PASS");
assert.equal(x.production_effect,false);
assert.equal(x.decision_effect,"PRIORITY_DETAIL_EVIDENCE");
console.log("DRAGON Product Detail Shadow tests: PASS");