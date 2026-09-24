const assert=require("node:assert/strict");
const Engine=require("./boom-dragon-decision-engine.js");
const Live=require("./boom-dragon-product-live-refresh.js");
const Detail=require("./boom-dragon-product-detail-shadow.js");

const base={
  product:{status:"PREP",stale:true,live:false,generated_at:"2026-09-13T14:00:00Z",blockers:["SNAPSHOT_STALE"]},
  journey:{status:"READY",stale:false,mode:"SERVER_TRUTH",purchase_truth:{buyer_ready:true},generated_at:"2026-09-24T11:00:00Z"},
  profit:{status:"REALIZED_FINAL",realized:true},
  content:{status:"LEARNING_READY",readiness:{winner_eligible:true},generated_at:"2026-09-24T11:00:00Z"},
  launch_gates:[{gate_key:"catalog_structure",title:"Catalog",status:"PASS",blocks_real_money:false,updated_at:"2026-09-24T11:00:00Z"}]
};

const stale=Engine.assess(base);
const discovery=Live.summarize({
  generated_at:"2026-09-24T11:10:00Z",production_effect:false,
  pages:[{page:1,rows:200,kept:180}],
  products:[{provider:"CJdropshipping",item_id:"p1",title:"A",image_url:"https://x/a.jpg",supplier_cost:2}]
},{now:Date.parse("2026-09-24T11:11:00Z")});
const discovered=Engine.assess({...base,product_live_refresh:discovery});

const variant=Detail.selectVariant({
  provider:"CJdropshipping",item_id:"p1",title:"A",
  variants:[{variant_id:"v1",availability_verified:true,stock_quantity:15,retail_price_verified:true,profit_gate_status:"PASS",price_amount:2,retail_price_amount:7.99}]
});
const detail=Detail.summarize(
  {provider:"CJdropshipping",item_id:"p1",title:"A"},
  variant,
  {stock_verified:true,stock_available:true,shipping_verified:true,shipping_options:[{name:"CJPacket",price_usd:4.2,aging:"6-10 days"}]},
  "US"
);
const detailed=Engine.assess({...base,product_live_refresh:discovery,product_detail_shadow:detail});

assert(stale.unknowns.includes("PRODUCT_TRUTH_STALE"));
assert(discovered.unknowns.includes("PRODUCT_DETAIL_TRUTH_STALE"));
assert(detailed.unknowns.includes("PRODUCT_PORTFOLIO_DETAIL_COVERAGE_LOW"));
assert([stale,discovered,detailed].every(x=>x.status==="HOLD"));
assert.equal(stale.readiness_score,discovered.readiness_score);
assert.equal(discovered.readiness_score,detailed.readiness_score);
assert.equal(detail.detail_truth_ready,true);
assert.equal(detail.portfolio_truth_ready,false);

console.log("DRAGON Product Truth staged refresh regression: PASS");