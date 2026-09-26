import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const src=fs.readFileSync("supabase/functions/hunt-eprolo-catalog-fill-readonly/index.ts","utf8");

test("EPROLO catalog fill preserves evidence identity for protected truth",()=>{
  assert.match(src,/image_url=case[\s\S]*retail_truth_status[\s\S]*product_truth_status[\s\S]*then public\.hunt_shelf_candidates\.image_url/);
  assert.match(src,/source_payload=case[\s\S]*retail_truth_status[\s\S]*product_truth_status[\s\S]*jsonb_set\([\s\S]*'\{last_refill\}'/);
  assert.match(src,/else coalesce\(public\.hunt_shelf_candidates\.source_payload,'\{\}'::jsonb\)\|\|excluded\.source_payload/);
  assert.doesNotMatch(src,/source_payload=excluded\.source_payload/);
});

test("EPROLO catalog fill preserves stronger truth statuses on conflict",()=>{
  assert.match(src,/MARKET5_PROFIT_PASS/);
  assert.match(src,/FULLY_READY/);
  assert.match(src,/MARKET5_READY_STYLE_PHYSICAL_PENDING/);
  assert.match(src,/case[\s\S]*retail_truth_status/);
});

test("EPROLO catalog fill remains shadow-only",()=>{
  assert.match(src,/sellable=false/);
  assert.match(src,/production_effect=false/);
  assert.match(src,/supplier_live_order:"OFF"/);
});
