const assert=require("node:assert");
const L=require("./boom-lifecycle-brain.js");
const now=Date.parse("2026-09-19T12:00:00Z");
const infra={consent_registry_ready:true,send_history_ready:true,frequency_cap_ledger_ready:true,channel_connected:true,channel_send_enabled:true};

const saved=L.evaluate({
  trigger:"saved_reminder",channel:"email",now,
  context:{user_identified:true,product_truth_ready:true,price_verified:true,safe_category:true,signal_at:"2026-09-17T10:00:00Z",...infra},
  consent:{marketing:{email:true}},history:[]
});
assert.strictEqual(saved.eligible,true);
assert.strictEqual(saved.mode,"SEND_CANDIDATE");
assert.strictEqual(saved.send_enabled,false);
assert.strictEqual(saved.external_send,false);
assert.strictEqual(saved.execute,false);
assert.strictEqual(saved.message.subject,"Still saved on HUNT");

const noConsent=L.evaluate({
  trigger:"saved_reminder",channel:"email",now,
  context:{user_identified:true,product_truth_ready:true,price_verified:true,safe_category:true,signal_at:"2026-09-17T10:00:00Z",...infra},
  consent:{marketing:{email:false}}
});
assert(noConsent.blockers.includes("marketing_opt_in_required"));

const noChannel=L.evaluate({
  trigger:"saved_reminder",channel:"email",now,
  context:{user_identified:true,product_truth_ready:true,price_verified:true,safe_category:true,signal_at:"2026-09-17T10:00:00Z",...infra,channel_connected:false,channel_send_enabled:false},
  consent:{marketing:{email:true}}
});
assert(noChannel.blockers.includes("email_not_connected"));
assert(noChannel.blockers.includes("email_send_disabled"));

const testOrder=L.evaluate({
  trigger:"order_update",channel:"email",now,
  context:{user_identified:true,is_test_order:true,real_order_confirmed:false,order_status:"shipped",event_id:"order-event-test",...infra},
  consent:{transactional:{email:true}}
});
assert.strictEqual(testOrder.eligible,false);
assert(testOrder.blockers.includes("test_order_suppressed"));

const stock=L.evaluate({
  trigger:"back_in_stock",channel:"push",now,
  context:{user_identified:true,product_truth_ready:true,price_verified:true,safe_category:true,variant_stock_verified:false,...infra},
  consent:{marketing:{push:true}}
});
assert(stock.blockers.includes("variant_stock_not_verified"));

const capped=L.evaluate({
  trigger:"cart_reminder",channel:"email",now,
  context:{user_identified:true,product_truth_ready:true,price_verified:true,safe_category:true,signal_at:"2026-09-18T01:00:00Z",...infra},
  consent:{marketing:{email:true}},
  history:[
    {trigger:"cart_reminder",channel:"email",marketing:true,sent_at:"2026-09-19T08:00:00Z"},
    {trigger:"saved_reminder",channel:"email",marketing:true,sent_at:"2026-09-18T08:00:00Z"}
  ]
});
assert(capped.blockers.includes("cooldown_active"));
assert(capped.blockers.includes("marketing_daily_cap_reached"));
assert(capped.blockers.includes("marketing_weekly_cap_reached"));

const tracking=L.evaluate({
  trigger:"tracking_update",channel:"email",now,
  context:{user_identified:true,is_test_order:false,real_order_confirmed:true,tracking_changed:true,tracking_status:"In transit",event_id:"track-event-1",order_reference:"HUNT-1",...infra},
  consent:{transactional:{email:true}},
  history:[{trigger:"tracking_update",channel:"email",event_id:"track-event-1",sent_at:"2026-09-19T11:00:00Z"}]
});
assert.strictEqual(tracking.eligible,false);
assert(tracking.blockers.includes("service_event_already_sent"));

const trackingFresh=L.evaluate({
  trigger:"tracking_update",channel:"email",now,
  context:{user_identified:true,is_test_order:false,real_order_confirmed:true,tracking_changed:true,tracking_status:"In transit",event_id:"track-event-2",order_reference:"HUNT-1",...infra},
  consent:{transactional:{email:true}},
  history:[]
});
assert.strictEqual(trackingFresh.eligible,true);
assert.strictEqual(trackingFresh.message.subject,"Tracking update");

const complement=L.evaluate({
  trigger:"complementary_followup",channel:"email",now,
  context:{user_identified:true,is_test_order:false,real_order_confirmed:true,delivered:true,complement_truth_ready:true,delivered_at:"2026-09-10T10:00:00Z",...infra},
  consent:{marketing:{email:true}}
});
assert.strictEqual(complement.eligible,true);

const plan=L.plan([
  {trigger:"saved_reminder",channels:["email","in_app"],context:{user_identified:true,product_truth_ready:true,price_verified:true,safe_category:true,signal_at:"2026-09-17T10:00:00Z",...infra},consent:{marketing:{email:true},in_app:true}},
  {trigger:"order_update",channels:["email"],context:{user_identified:true,is_test_order:true,real_order_confirmed:false,order_status:"created",event_id:"test-order",...infra},consent:{transactional:{email:true}}}
],{now});
assert.strictEqual(plan.total,3);
assert.strictEqual(plan.eligible,2);
assert.strictEqual(plan.hold,1);
assert.strictEqual(plan.sends_executed,0);
assert.strictEqual(plan.execute_actions,false);
assert.strictEqual(plan.external_send,false);
assert.strictEqual(L.VERSION,"2026-09-19-v2");
console.log("boom_lifecycle_brain=PASS",JSON.stringify({eligible:plan.eligible,hold:plan.hold,top_blockers:plan.top_blockers}));