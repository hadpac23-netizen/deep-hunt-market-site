const fs=require("fs"),assert=require("assert");
const e=JSON.parse(fs.readFileSync("evidence/HUNT-CJ-GAP-FILL-VERIFIED-2026-09-23.json","utf8"));
assert.equal(e.version,"HUNT-CJ-GAP-FILL-VERIFIED-V2");
assert.equal(e.provider,"CJdropshipping");
assert.equal(e.mode,"READ_ONLY_SHADOW");
assert.equal(e.summary.products_checked,39);
assert.equal(e.summary.categories_filled,37);
assert.equal(e.summary.products_verified_4_of_4,39);
assert.deepEqual(e.summary.market_pass_counts,{IL:39,DE:39,US:39,SG:39});
assert(e.summary.product_contribution_shadow_min_usd>=4);
assert(e.summary.product_contribution_shadow_max_usd>e.summary.product_contribution_shadow_min_usd);
assert.equal(e.summary.final_profit_verified_products,0);
assert.equal(e.summary.checkout_live,0);
assert.equal(e.summary.fulfillment_live,0);
assert.equal(e.summary.production_effect,false);
assert.equal(e.results.length,39);
assert.equal(new Set(e.results.map(x=>x.department+"/"+x.category)).size,37);
const laundry=e.results.find(x=>x.department==="home"&&x.category==="laundry");
assert(laundry,"Laundry must be filled by verified CJ truth");
assert.equal(laundry.id,"2411110427421627400");
for(const p of e.results){
  assert.equal(p.status,"MARKET_QUOTES_VERIFIED");
  for(const cc of ["IL","DE","US","SG"]){
    assert.equal(p.markets[cc].state,"STOCK_SHIPPING_VERIFIED");
    assert.equal(p.markets[cc].final_profit_verified,false);
  }
}
console.log("PASS boom-cj-gap-fill-verified-v2");
