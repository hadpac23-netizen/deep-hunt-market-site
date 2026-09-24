const assert=require("node:assert/strict");
const R=require("./boom-dragon-product-live-refresh.js");

const x=R.summarize({
  generated_at:"2026-09-24T11:10:00Z",
  production_effect:false,
  pages:[{page:1,rows:200,kept:180}],
  products:[
    {provider:"CJdropshipping",item_id:"a",title:"A",image_url:"https://x/a.jpg",supplier_cost:2.5},
    {provider:"CJdropshipping",item_id:"b",title:"B",image_url:"https://x/b.jpg",supplier_cost:3.1}
  ]
},{now:Date.parse("2026-09-24T11:11:00Z")});

assert.equal(x.status,"DISCOVERY_FRESH");
assert.equal(x.production_effect,false);
assert.equal(x.source_data_mutated,false);
assert.equal(x.discovery_fresh,true);
assert.equal(x.detail_truth_ready,false);
assert.equal(x.products_seen,2);
assert.equal(x.source_rows_seen,200);
assert.equal(x.safe_products_kept,180);
assert.ok(x.detail_requirements.includes("DESTINATION_SHIPPING"));
assert.ok(x.detail_requirements.includes("FRESH_DETAIL_QUOTE"));
assert.equal(x.decision_effect,"DISCOVERY_ONLY");

console.log("DRAGON CJ Product Live Refresh tests: PASS");