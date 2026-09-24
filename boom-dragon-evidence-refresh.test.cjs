const assert=require("node:assert/strict");
const Refresh=require("./boom-dragon-evidence-refresh.js");
const now=Date.parse("2026-09-24T11:00:00Z");
const x=Refresh.normalize({
  observed_at:"2026-09-24T10:58:31Z",
  product_catalog:{rows:117,availability_verified:117,in_stock:76,latest_source_fresh:"2026-09-13T14:01:43Z",latest_stock_check:"2026-09-13T14:01:43Z"},
  customer_journey_daily:[
    {day:"2026-09-21",unique_sessions:0,product_views:0,add_to_cart:0,checkout_starts:0},
    {day:"2026-09-20",unique_sessions:9,product_views:9,add_to_cart:7,checkout_starts:22}
  ],
  runtime_controls:[
    {key:"hunt_payment_live",enabled:false},
    {key:"hunt_payplus_callback_accept_paid",enabled:false}
  ],
  attribution_summary:{confirmed:0},
  finance_summary:{rows:0,real_rows:0,profit_rows:0},
  content_summary:{creative_drafts:96,distribution_drafts:96,published:0},
  launch_gates:[{gate_key:"deployment_sync",status:"FAIL",blocks_real_money:true}],
  security_advisor:{observed_at:"2026-09-24T10:57:20Z",warn_findings:9,info_findings:2}
},{now});
assert.equal(x.observation_fresh,true);
assert.equal(x.product.source_stale,true);
assert.equal(x.journey.source_stale,true);
assert.equal(x.safety.payment_live_enabled,false);
assert.equal(x.safety.callback_paid_enabled,false);
assert.equal(x.commerce.profit_rows,0);
assert.equal(x.security.status,"PARTIAL");
assert.equal(x.production_effect,false);
assert.equal(x.source_data_mutated,false);
assert.ok(x.confidence_support>0);
console.log("DRAGON Evidence Refresh tests: PASS");