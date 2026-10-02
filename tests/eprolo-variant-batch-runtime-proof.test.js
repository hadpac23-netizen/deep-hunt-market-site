const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const src=fs.readFileSync(path.resolve(__dirname,"../supabase/functions/hunt-eprolo-variant-country-audit-shadow/index.ts"),"utf8");

test("EPROLO variant audit supports bounded canonical batch proof",()=>{
  assert.match(src,/Math\.min\(25/);
  assert.match(src,/mode:"BATCH_SHADOW_READONLY"/);
  assert.match(src,/canonical_core_total:core\.length/);
  assert.match(src,/workerPool\(slice,3/);
  assert.match(src,/writes:false/);
  assert.match(src,/production_effect:false/);
});

test("batch proof uses current retail and exact variant final economics",()=>{
  assert.match(src,/current_retail_usd:retail/);
  assert.match(src,/final_profit_verified:finalProfit/);
  assert.match(src,/variantIdOf\(x\)===variantId/);
  assert.match(src,/reason:truth\.reason/);
  assert.match(src,/FRESH_FINAL_PASS/);
  assert.doesNotMatch(src,/list\.length===1\?list\[0\]/);
});
