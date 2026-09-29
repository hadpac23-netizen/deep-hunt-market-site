const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const src=fs.readFileSync(path.resolve(__dirname,"../supabase/functions/hunt-storefront/index.ts"),"utf8");

test("CJ PDP distinguishes missing inventory evidence from zero stock",()=>{
  assert.match(src,/const hasInventoryEvidence = inventories\.length > 0/);
  assert.match(src,/stock_truth: hasInventoryEvidence \? "PRODUCT_DETAIL_INVENTORY" : "EXACT_VARIANT_QUOTE_REQUIRED"/);
  assert.match(src,/stock_quantity: hasInventoryEvidence \? stockTotal : null/);
  assert.match(src,/availability_verified: hasInventoryEvidence \? stockTotal > 0 : false/);
  assert.match(src,/stock_check_required: !hasInventoryEvidence \|\| stockTotal <= 0/);
});
