const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const src=fs.readFileSync(path.resolve(__dirname,"../supabase/functions/hunt-eprolo-country-shadow/index.ts"),"utf8");

test("EPROLO country shadow is internal-only while safe runtime is quarantined",()=>{
  assert.match(src,/HUNT_EPROLO_INTERNAL_TOKEN/);
  assert.match(src,/x-hunt-internal-token/);
  assert.match(src,/EPROLO_COUNTRY_SHADOW_QUARANTINED_PENDING_SAFE_RUNTIME/);
  assert.match(src,/status:\"HOLD\"/);
  assert.match(src,/readiness_status:\"HOLD\"/);
});

test("EPROLO quarantine exposes no supplier economics and never claims final profit",()=>{
  assert.match(src,/supplier_economics_exposed:false/);
  assert.match(src,/destination_tax_verified:false/);
  assert.match(src,/final_profit_verified:false/);
  assert.match(src,/production_effect:false/);
  assert.doesNotMatch(src,/vault\.decrypted_secrets/);
  assert.doesNotMatch(src,/HUNT_DB_POOLER_URL/);
  assert.doesNotMatch(src,/supplier_cost_usd/);
});

test("EPROLO quarantine remains read-only and validates request shape",()=>{
  assert.match(src,/req\.method!==\"GET\"/);
  assert.match(src,/item_id required/);
  assert.match(src,/country must be ISO alpha-2/);
  assert.doesNotMatch(src,/fetch\(.*openapi\.eprolo/);
});
