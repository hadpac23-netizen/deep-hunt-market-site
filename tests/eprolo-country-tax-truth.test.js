const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const src=fs.readFileSync(path.resolve(__dirname,"../supabase/functions/hunt-eprolo-country-shadow/index.ts"),"utf8");

test("EPROLO destination tax remains explicitly unverified while safe runtime is quarantined",()=>{
  assert.match(src,/destination_tax_verified:false/);
  assert.match(src,/final_profit_verified:false/);
  assert.match(src,/readiness_status:\"HOLD\"/);
  assert.match(src,/EPROLO_COUNTRY_SHADOW_QUARANTINED_PENDING_SAFE_RUNTIME/);
});

test("quarantine cannot expose or infer supplier economics",()=>{
  assert.match(src,/supplier_economics_exposed:false/);
  assert.doesNotMatch(src,/taxesFee|supplier_cost_usd|shadow_retail_floor_usd/);
  assert.match(src,/production_effect:false/);
});
