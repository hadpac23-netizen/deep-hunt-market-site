const fs=require("fs"),assert=require("assert");
const src=fs.readFileSync("supabase/functions/hunt-customer-journey-snapshot/index.ts","utf8");
for(const x of [
  "hunt_daily_owner_metrics","hunt_orders","hunt_attribution_ledger",
  "conversion_claim_allowed","purchase_confirmed_at","is_test===false",
  "test_orders_excluded","test_contamination_detected","repeat_buyers"
])assert(src.includes(x),x+" missing");
assert(src.includes("Admin access required"));
assert(src.includes("Test orders never count as Buyer or Repeat."));
console.log("HUNT customer journey snapshot contract: PASS");