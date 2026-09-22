const fs=require("fs"),assert=require("assert");
const m=JSON.parse(fs.readFileSync("evidence/HUNT-EPROLO-GLOBAL-PRODUCT-MARKET-MATRIX-2026-09-23.json","utf8"));
assert.equal(m.version,"HUNT-EPROLO-GLOBAL-PRODUCT-MARKET-MATRIX-V1");
assert.equal(m.mode,"GLOBAL_SHADOW");
assert.equal(m.provider,"EPROLO");
assert.equal(m.production_effect,false);
assert.equal(m.products_checked,4);
assert.equal(m.markets_checked,33);
assert.equal(m.possible_product_market_pairs,132);
assert.equal(m.shipping_shadow_product_market_pairs,115);
assert.equal(m.policy_mapped_shadow_pairs,72);
assert.equal(m.policy_hold_shadow_pairs,43);
assert.equal(m.countries_represented,32);
assert.equal(m.live_product_market_pairs,0);
assert.deepEqual(m.product_pass_counts,{
  "19374567":32,
  "24539904":30,
  "26556212":22,
  "26921252":31
});
const pairs=m.products.reduce((n,p)=>n+p.shipping_shadow_markets.length,0);
assert.equal(pairs,115);
assert(m.products.every(p=>new Set(p.shipping_shadow_markets).size===p.shipping_shadow_markets.length));
assert(!m.products.some(p=>p.market_truth?.SA?.live_eligible===true));
console.log("PASS boom-eprolo-global-product-market-matrix");
