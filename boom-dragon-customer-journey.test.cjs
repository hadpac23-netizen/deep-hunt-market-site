const assert=require("node:assert/strict");
const Journey=require("./boom-dragon-customer-journey.js");

const now=Date.parse("2026-09-24T12:00:00Z");
const full=Journey.normalizeFull({
  generated_at:"2026-09-24T11:00:00Z",window_days:7,
  source:"server",
  stages:{sessions:20,product_views:10,engagement:3,saves:2,likes:1,cart:5,checkout:4,buyer:2,repeat:1},
  purchase_truth:{confirmed_orders:3,confirmed_buyers:2,repeat_buyers:1,test_orders_excluded:8,legacy_metric_orders:8,test_contamination_detected:true,confirmation_rule:"server"},
  freshness:{latest_activity_day:"2026-09-24"}
},{now});
assert.equal(full.status,"READY");
assert.equal(full.stages.buyer,2);
assert.equal(full.stages.repeat,1);
assert.equal(full.purchase_truth.test_orders_excluded,8);
assert.equal(full.purchase_truth.test_contamination_detected,true);

const fallback=Journey.normalizeMission({
  generated_at:"2026-09-24T11:00:00Z",
  snapshot:{history:[
    {day:"2026-09-24",unique_sessions:5,product_views:3,likes:1,saves:1,add_to_cart:2,checkout_starts:1,orders:8}
  ]}
},{now,days:7});
assert.equal(fallback.stages.views,3);
assert.equal(fallback.stages.buyer,null);
assert.equal(fallback.purchase_truth.buyer_ready,false);
assert.equal(fallback.purchase_truth.legacy_metric_orders,8);

console.log("DRAGON Customer Journey adapter tests: PASS");