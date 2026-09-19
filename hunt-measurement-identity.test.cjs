const fs=require("node:fs");
const assert=require("node:assert");
const src=fs.readFileSync("analytics.js","utf8");

for(const token of [
  "measurementEventId",
  "emitMeasurementEnvelope",
  'event_id: clean(params.event_id || "",160)',
  'new CustomEvent("hunt:measurement-envelope"',
  'eventName==="purchase"&&transactionId',
  'confirmed !== true',
  'hunt_order_state: "confirmed_real_order"',
  "emitMeasurementEnvelope(event, params)"
]) assert(src.includes(token),"M03 analytics contract missing: "+token);

assert(src.includes("const eventId = clean(params.event_id || measurementEventId(event, params), 160)"),"Canonical event id must be created once in dataLayerPush");
assert(src.includes("...canonicalParams"),"Canonical params must carry event_id across destinations");
assert(!/email\s*:\s*params|phone\s*:\s*params|address\s*:\s*params/.test(src),"M03 analytics must not add raw PII");
console.log("hunt_measurement_identity=PASS");
