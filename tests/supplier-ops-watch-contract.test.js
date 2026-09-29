const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const src=fs.readFileSync(path.join(root,"supabase/functions/hunt-supplier-ops-watch-shadow/index.ts"),"utf8");
const sql=fs.readFileSync(path.join(root,"ops/hunt-live-ops-health.sql"),"utf8");

test("supplier watcher is limited to CJ and EPROLO and remains shadow-only",()=>{
  assert.match(src,/\["CJdropshipping","EPROLO"\]/);
  assert.match(src,/mode:"SHADOW_WATCH"/);
  assert.match(src,/payment_changed:false/);
  assert.match(src,/supplier_order_changed:false/);
  assert.match(src,/catalog_visibility_changed:false/);
  assert.match(src,/production_effect:false/);
});

test("supplier watcher opens stale and stuck-order exceptions",()=>{
  assert.match(src,/SUPPLIER_DATA_STALE/);
  assert.match(src,/ORDER_STUCK_OVER_30M/);
  assert.match(src,/stale_after_minutes/);
  assert.match(src,/hunt_ops_exceptions/);
});

test("canonical ops health measures freshness profit exceptions and stuck fulfillment",()=>{
  assert.match(sql,/fresh_variant_markets/);
  assert.match(sql,/stale_variant_markets/);
  assert.match(sql,/verified_profit_pass/);
  assert.match(sql,/open_exceptions/);
  assert.match(sql,/stuck_fulfillment_over_30m/);
  assert.match(sql,/CJdropshipping','EPROLO/);
});


test("watcher resolves only stale-data exceptions and never unrelated tax or profit exceptions",()=>{
  assert.match(src,/eq\("reason_code","SUPPLIER_DATA_STALE"\)/);
  assert.doesNotMatch(src,/\.upsert\(/);
  assert.match(src,/EXCEPTION_INSERT_FAILED/);
  assert.match(src,/EXCEPTION_UPDATE_FAILED/);
});
