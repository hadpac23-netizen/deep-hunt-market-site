const assert=require("node:assert");
const C=require("./boom-profit-feed-control-tower.js");

const passport={
  product_key:"CJ:1",
  truth:{
    safe_category:true,
    price:{verified:true},
    source_fresh:true,
    availability:{exportable:true},
    merchant_identity_ready:true,
    shipping_policy_ready:true,
    returns_policy_ready:true
  },
  channels:{google_free_listings:{connected:true}}
};
const econ={
  sale_price_per_unit:9.99,
  customer_shipping_amount:7.5,
  supplier_cost_per_unit:4.33,
  supplier_shipping_cost:7.5,
  payment_reserve:.70,
  refund_reserve:.87,
  platform_cost:0,
  contribution_before_coupon:4.09,
  min_required_contribution:4,
  max_safe_cac:.09,
  max_safe_coupon_amount:.09,
  inputs_verified:true,
  profit_gate_status:"PASS"
};
const e=C.economics(econ);
assert.strictEqual(e.verified,true);
assert.strictEqual(e.contribution_math_matches,true);
assert.strictEqual(e.gross_receipts,17.49);
assert.strictEqual(Number(e.known_outflows.toFixed(2)),13.40);

const prepare=C.evaluate({
  passport,
  econ,
  feedInput:{export_ready:true,blockers:[]},
  measurement:{attribution_ready:false,server_event_id_persisted:false,owner_paid_approval:false}
});
assert.strictEqual(prepare.external_state,"PROMOTE_CANDIDATE");
assert.strictEqual(prepare.paid_state,"HOLD");
assert(prepare.paid_reasons.includes("attribution_not_ready"));
assert(prepare.paid_reasons.includes("server_event_id_persistence_missing"));
assert(prepare.paid_reasons.includes("owner_paid_approval_required"));
assert.strictEqual(prepare.scale_state,"HOLD");

const blocked=C.evaluate({
  passport:{...passport,truth:{...passport.truth,source_fresh:false,availability:{exportable:false}}},
  econ,
  feedInput:{export_ready:false,blockers:["source_freshness_not_verified","feed_safe_availability_missing"]},
  measurement:{}
});
assert.strictEqual(blocked.external_state,"HOLD");
assert.strictEqual(blocked.kill_switch.recommended,true);
assert.strictEqual(blocked.kill_switch.execute,false);

const scale=C.evaluate({
  passport,
  econ,
  feedInput:{export_ready:true,blockers:[]},
  measurement:{attribution_ready:true,server_event_id_persisted:true,owner_paid_approval:true},
  performance:{confirmed_conversions:30,actual_cac:.05,observed_net_contribution_after_acquisition:2.1,refund_rate:.04,chargeback_rate:.002}
});
assert.strictEqual(scale.paid_state,"TEST_CANDIDATE");
assert.strictEqual(scale.scale_state,"SCALE_CANDIDATE");

const unsafe=C.evaluate({
  passport:{...passport,truth:{...passport.truth,safe_category:false}},
  econ,
  feedInput:{export_ready:true,blockers:[]},
  measurement:{attribution_ready:true,server_event_id_persisted:true,owner_paid_approval:true}
});
assert.strictEqual(unsafe.onsite_state,"STOP");
assert.strictEqual(unsafe.external_state,"STOP");
assert.strictEqual(unsafe.kill_switch.scope,"ALL");

const summary=C.summarize([prepare,blocked,scale,unsafe]);
assert.strictEqual(summary.total,4);
assert.strictEqual(summary.execute_actions,false);
assert.strictEqual(summary.verified_economics,4);
assert.deepStrictEqual(summary.safe_cac_range,{min:.09,max:.09});
console.log("boom_profit_feed_control_tower=PASS",JSON.stringify(summary));
