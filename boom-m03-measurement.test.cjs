const fs=require("node:fs");
const assert=require("node:assert");

const html=fs.readFileSync("boom-growth-os.html","utf8");
const js=fs.readFileSync("boom-growth-os.js","utf8");
const analytics=fs.readFileSync("analytics.js","utf8");
const hub=fs.readFileSync("boom-measurement-hub.js","utf8");

for(const token of [
  'id="bg-measurement-state"',
  'id="bg-measurement-stats"',
  'id="bg-measurement-destinations"',
  'id="bg-measurement-gaps"',
  'analytics-config.js?v=analytics1',
  'boom-measurement-hub.js?v=m03'
]) assert(html.includes(token),"M03 Growth UI missing: "+token);

assert(html.indexOf("analytics-config.js?v=analytics1")<html.indexOf("boom-measurement-hub.js?v=m03"),"Analytics config must load before Measurement Hub");

for(const token of [
  "measurementReadiness",
  "renderMeasurementHub",
  "server_event_id_persisted:false",
  "google_ads_data_manager_connected:false",
  "meta_capi_connected:false",
  "tiktok_events_api_connected:false",
  "pinterest_conversions_api_connected:false",
  "EXTERNAL SEND OFF"
]) assert(js.includes(token),"M03 Growth runtime missing: "+token);

for(const token of [
  "measurementEventId",
  "emitMeasurementEnvelope",
  "hunt:measurement-envelope",
  "event_id",
  "confirmed_real_order"
]) assert(analytics.includes(token),"M03 analytics runtime missing: "+token);

for(const token of [
  "destinationReadiness",
  "server_event_id_persistence_missing",
  "meta_capi",
  "tiktok_events_api",
  "pinterest_conversions_api",
  "user_data_enabled:false",
  "send_enabled:false"
]) assert(hub.includes(token),"M03 hub guard missing: "+token);

assert(!/email\s*:\s*params|phone\s*:\s*params|address\s*:\s*params/.test(analytics),"Analytics must not add raw PII");
assert(!/fetch\s*\(|XMLHttpRequest/.test(hub),"Measurement Hub control core must not send network requests");
console.log("boom_m03_measurement_contract=PASS");
