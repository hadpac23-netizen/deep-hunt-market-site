const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");

const variantSrc=fs.readFileSync(path.resolve(__dirname,"../supabase/functions/hunt-eprolo-variant-country-audit-shadow/index.ts"),"utf8");
const productSrc=fs.readFileSync(path.resolve(__dirname,"../supabase/functions/hunt-eprolo-product-country-variants-audit-shadow/index.ts"),"utf8");

for(const src of [variantSrc,productSrc]){
  test("EPROLO final-profit gate requires exact-variant COO and landed-cost truth",()=>{
    assert.match(src,/customs_truth_v1/);
    assert.match(src,/variants\[variantId\]/);
    assert.match(src,/country_of_origin_verified/);
    assert.match(src,/landed_cost_verified/);
    assert.match(src,/destination_tax_duty_verified/);
    assert.match(src,/duty_tax_usd/);
    assert.match(src,/country_of_origin_verified&&customs\.destination_tax_duty_verified/);
    assert.match(src,/COUNTRY_OF_ORIGIN_NOT_VERIFIED/);
    assert.match(src,/DESTINATION_TAX_NOT_VERIFIED/);
  });
}
