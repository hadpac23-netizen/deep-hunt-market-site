const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");

const variantSrc=fs.readFileSync(path.resolve(__dirname,"../supabase/functions/hunt-eprolo-variant-country-audit-shadow/index.ts"),"utf8");
const productSrc=fs.readFileSync(path.resolve(__dirname,"../supabase/functions/hunt-eprolo-product-country-variants-audit-shadow/index.ts"),"utf8");

for(const src of [variantSrc,productSrc]){
  test("EPROLO final-profit gate requires exact-variant COO and landed-cost truth",()=>{
    assert.match(src,/finalProfitTruth/);
  });
}

require("./final-profit-truth.test.js");
