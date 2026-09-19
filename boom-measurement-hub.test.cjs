const assert=require("node:assert");
const Hub=require("./boom-measurement-hub.js");

const safe=Hub.safeParams({
  email:"secret@example.com",
  phone:"+10000000000",
  item_id:"abc",
  items:[{item_id:"abc",item_name:"Case",item_brand:"CJ",quantity:2}],
  value:19.99,
  currency:"USD"
});
assert.strictEqual(safe.email,undefined);
assert.strictEqual(safe.phone,undefined);
assert.strictEqual(safe.item_id,"abc");
assert.strictEqual(safe.items.length,1);

const purchase={
  event_id:"purchase:order-1",
  event_name:"purchase",
  event_time_ms:Date.now(),
  source:"hunt_web",
  params:{transaction_id:"order-1",value:19.99,currency:"USD",hunt_order_state:"confirmed_real_order",items:[]}
};
assert.strictEqual(Hub.validateEnvelope(purchase).valid,true);
const bad=Hub.validateEnvelope({...purchase,event_id:"",params:{...purchase.params,hunt_order_state:"preview"}});
assert(bad.blockers.includes("event_id_missing"));
assert(bad.blockers.includes("purchase_not_confirmed"));

const readiness=Hub.destinationReadiness({
  consent_granted:true,
  ga4_configured:true,
  first_party_configured:true,
  server_event_id_persisted:false,
  google_ads_data_manager_connected:false,
  meta_capi_connected:false,
  tiktok_events_api_connected:false,
  pinterest_conversions_api_connected:false
});
assert.strictEqual(readiness.ga4.state,"ACTIVE");
assert.strictEqual(readiness.first_party.state,"PARTIAL");
assert(readiness.first_party.blockers.includes("server_event_id_persistence_missing"));
assert.strictEqual(readiness.tiktok_events_api.state,"LOCKED");
assert.strictEqual(readiness.tiktok_events_api.user_data_enabled,false);
assert.strictEqual(readiness.tiktok_events_api.send_enabled,false);
const summary=Hub.summarize(readiness);
assert.strictEqual(summary.active,1);
assert.strictEqual(summary.external_send_enabled,false);
console.log("boom_measurement_hub=PASS",JSON.stringify(summary));
