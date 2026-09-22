const fs=require("fs"),assert=require("assert");
const e=JSON.parse(fs.readFileSync("evidence/HUNT-CJ-GAP-FILL-VERIFIED-2026-09-23.json","utf8"));
assert.equal(e.version,"HUNT-CJ-GAP-FILL-VERIFIED-V2");
assert.equal(e.provider,"CJdropshipping");
assert.equal(e.mode,"READ_ONLY_SHADOW");
assert.equal(e.summary.products_checked,36);
assert.equal(e.summary.categories_filled,36);
assert.equal(e.summary.products_verified_4_of_4,36);
assert.deepEqual(e.summary.market_pass_counts,{IL:36,DE:36,US:36,SG:36});
assert(e.summary.product_contribution_shadow_min_usd>=4);
assert(e.summary.product_contribution_shadow_max_usd>e.summary.product_contribution_shadow_min_usd);
assert.equal(e.summary.final_profit_verified_products,0);
assert.equal(e.summary.checkout_live,0);
assert.equal(e.summary.fulfillment_live,0);
assert.equal(e.summary.production_effect,false);
assert.equal(e.results.length,36);
assert.equal(new Set(e.results.map(x=>x.department+"/"+x.category)).size,36);
for(const p of e.results){
  assert.equal(p.status,"MARKET_QUOTES_VERIFIED");
  for(const cc of ["IL","DE","US","SG"]){
    assert.equal(p.markets[cc].state,"STOCK_SHIPPING_VERIFIED");
    assert.equal(p.markets[cc].final_profit_verified,false);
  }
}
console.log("PASS boom-cj-gap-fill-verified-v2");
