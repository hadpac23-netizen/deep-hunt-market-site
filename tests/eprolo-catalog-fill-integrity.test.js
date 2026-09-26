import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const src=fs.readFileSync("supabase/functions/hunt-eprolo-catalog-fill-readonly/index.ts","utf8");

test("EPROLO catalog fill merges source_payload instead of replacing it",()=>{
  assert.match(src,/source_payload=coalesce\(public\.hunt_shelf_candidates\.source_payload,'\{\}'::jsonb\)\|\|excluded\.source_payload/);
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
