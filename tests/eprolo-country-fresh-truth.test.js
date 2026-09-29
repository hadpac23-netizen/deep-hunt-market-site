const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const src=fs.readFileSync(path.resolve(__dirname,"../supabase/functions/hunt-eprolo-country-shadow/index.ts"),"utf8");

test("EPROLO exact variant cost and stock come from the official fresh API response",()=>{
  assert.match(src,/get_product_shiping_fees\.html/);
  assert.match(src,/EXACT_VARIANT_NOT_RETURNED/);
  assert.match(src,/const cost=Number\(exact\?\.cost\)/);
  assert.match(src,/const stock=Math\.max\(0,Number\(exact\?\.inventory_quantity\|\|0\)\)/);
  assert.match(src,/fresh_variant_truth:true/);
  assert.match(src,/source_checked_at:new Date\(\)\.toISOString\(\)/);
});

test("EPROLO fresh truth fails closed on API, stock, cost and shipping failures",()=>{
  assert.match(src,/UPSTREAM_UNAVAILABLE/);
  assert.match(src,/EXACT_VARIANT_ZERO_INVENTORY/);
  assert.match(src,/NO_VARIANT_COST/);
  assert.match(src,/NO_VERIFIED_SHIPPING/);
  assert.match(src,/production_effect:false/);
});


test("EPROLO country truth reuses DB client and prefers transaction pooler",()=>{
  assert.match(src,/SUPABASE_DB_POOLER_URL/);
  assert.match(src,/let sqlClientInstance/);
  assert.match(src,/if\(sqlClientInstance\)return sqlClientInstance/);
  assert.match(src,/connect_timeout:10/);
  assert.match(src,/max_lifetime:600/);
  assert.doesNotMatch(src,/await sql\.end\(/);
  assert.doesNotMatch(src,/connect_timeout:8,idle_timeout:2,max_lifetime:30/);
});
