const fs=require("node:fs"),assert=require("node:assert");
const html=fs.readFileSync("boom-growth-os.html","utf8");
const js=fs.readFileSync("boom-growth-os.js","utf8");
const life=fs.readFileSync("boom-lifecycle-brain.js","utf8");

for(const token of [
  'id="bg-lifecycle-state"','id="bg-lifecycle-stats"','id="bg-lifecycle-triggers"',
  'id="bg-lifecycle-blockers"','boom-lifecycle-brain.js?v=m06'
]) assert(html.includes(token),"M06 UI/load missing: "+token);

for(const token of [
  "lifecycleSnapshot","lifecyclePlan","renderLifecycleBrain",
  'client.from("hunt_product_actions").select("id",{count:"exact",head:true}).eq("saved",true)',
  'client.from("hunt_orders").select("id",{count:"exact",head:true}).eq("is_test",false)',
  'client.from("hunt_orders").select("id",{count:"exact",head:true}).eq("is_test",true)',
  "marketing_consent_registry_ready:false","send_history_ready:false",
  "frequency_cap_ledger_ready:false","external_send_enabled:false"
]) assert(js.includes(token),"M06 Growth runtime missing: "+token);

for(const token of [
  "saved_reminder","cart_reminder","back_in_stock","price_verified",
  "order_update","tracking_update","complementary_followup",
  "marketing_daily_cap_reached","marketing_weekly_cap_reached",
  "service_event_already_sent","lifecycle_consent_registry_missing",
  "send_history_missing","frequency_cap_ledger_missing",
  "test_order_suppressed","safeMessage","send_enabled:false",
  "external_send:false",'owner_gate:"REVIEW_REQUIRED"'
]) assert(life.includes(token),"M06 lifecycle guard missing: "+token);

assert(!/fetch\s*\(|XMLHttpRequest|\.insert\s*\(|\.update\s*\(|\.delete\s*\(/.test(life),"Lifecycle Brain must not send or mutate external systems");
console.log("boom_m06_lifecycle_contract=PASS");