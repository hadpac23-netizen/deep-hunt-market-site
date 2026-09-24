const assert=require("node:assert/strict");
const Adapter=require("./boom-dragon-product-truth.js");

const now=new Date("2026-09-24T10:00:00Z").getTime();

const fresh=Adapter.deriveSnapshot({
  generated_at:"2026-09-24T09:00:00Z",
  catalog_total:6107,
  readiness:{QUOTE_VERIFIED:57,DETAIL_RECHECK_REQUIRED:100},
  provider_catalog:{CJdropshipping:5000},
  quote_verified:{count:57}
},{
  generated_at:"2026-09-24T09:10:00Z",
  priority_cj_verified:{total:20,policy:"TEST",shelves:{jeans:4}}
},{now,maxAgeMs:24*60*60*1000});
assert.equal(fresh.status,"READY");
assert.equal(fresh.stale,false);
assert.equal(fresh.catalog_total,6107);
assert.equal(fresh.quote_verified_count,57);
assert.equal(fresh.priority_verified.total,20);

const stale=Adapter.deriveSnapshot({
  generated_at:"2026-09-13T19:27:41Z",
  catalog_total:6107,
  readiness:{QUOTE_VERIFIED:1}
},{
  generated_at:"2026-09-14T18:42:41Z"
},{now,maxAgeMs:24*60*60*1000});
assert.equal(stale.status,"PREP");
assert.equal(stale.stale,true);
assert.ok(stale.blockers.includes("SNAPSHOT_STALE"));

const good=Adapter.evaluateProduct({
  provider:"CJdropshipping",
  item_id:"cj-1",
  variant_id:"v-1",
  title:"Verified",
  images:["https://example.com/a.jpg"],
  destination_country:"US",
  country_supported:true,
  stock:5,
  stock_checked_at:"2026-09-24T09:30:00Z",
  source_checked_at:"2026-09-24T09:30:00Z",
  supplier_cost:10,
  shipping_method:"tracked",
  shipping_cost:4,
  landed_cost:14,
  retail_price:24
},{now});
assert.equal(good.eligible,true);
assert.equal(good.truth_status,"LIVE_VERIFIED");

console.log("DRAGON Product Truth adapter tests: PASS");