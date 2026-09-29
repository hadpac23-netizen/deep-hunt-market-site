import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const src=fs.readFileSync("supabase/functions/hunt-eprolo-catalog-fill-readonly/index.ts","utf8");

test("EPROLO catalog fill preserves established exact-variant truth on refill",()=>{
  assert.match(src,/image_url=case[\s\S]*then public\.hunt_shelf_candidates\.image_url/);
  assert.match(src,/nullif\(public\.hunt_shelf_candidates\.source_payload->>'variant_id',''\) is not null/);
  assert.match(src,/source_payload=case[\s\S]*jsonb_set\([\s\S]*'\{last_refill\}'/);
  assert.match(src,/supplier_cost=case[\s\S]*then public\.hunt_shelf_candidates\.supplier_cost/);
  assert.match(src,/verified_inventory=case[\s\S]*then public\.hunt_shelf_candidates\.verified_inventory/);
  assert.doesNotMatch(src,/verified_inventory=greatest\(/);
  assert.doesNotMatch(src,/warehouse_inventory=greatest\(/);
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
