const fs=require("fs"),assert=require("assert");
const src=fs.readFileSync("supabase/functions/hunt-content-feedback-snapshot/index.ts","utf8");
for(const x of [
  "hunt_creative_drafts","hunt_distribution_drafts","hunt_attribution_ledger",
  "hunt_order_finance_ledger","hunt_boom_learning_items",
  "creative:<creative_uuid>","winner_eligible","revenue_only_winner:false",
  "browser_purchase_winner:false","NO_SETTLED_PROFIT_EVIDENCE"
])assert(src.includes(x),x+" missing");
assert(src.includes("Admin access required"));
assert(src.includes("is_test===false"));
console.log("HUNT content feedback snapshot contract: PASS");