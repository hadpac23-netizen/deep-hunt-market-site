const fs=require("fs"),vm=require("vm"),assert=require("assert");
const c=JSON.parse(fs.readFileSync("boom-cj-retail-price-gate-v2-contract.json","utf8"));
assert.equal(c.authority,"NONE");
assert(/reserve_denominator - target_product_margin/.test(c.formula.corrected_margin_floor));
const src=fs.readFileSync("boom-cj-retail-price-gate-v2.js","utf8");
const ctx={window:{},Math,Number};vm.createContext(ctx);vm.runInContext(src,ctx);
const P=ctx.window.HuntCjRetailPriceGateV2;
for(const cost of [0.6,6.8,7.79,9.95,13.6,19.57,24.54]){
  const r=P.price(cost);
  assert(r);
  assert.equal(r.profit_gate_status,"PASS");
  assert(r.projected_product_profit>=4);
  assert(r.projected_product_margin>=0.35);
}
assert.equal(P.price(7.79).retail_price_amount,13.99);
assert.equal(P.price(19.57).retail_price_amount,34.99);
assert.equal(P.price(24.54).retail_price_amount,43.99);
console.log("HUNT CJ Retail Price Gate V2: PASS — generated retail price satisfies its own post-reserve profit and margin gates");