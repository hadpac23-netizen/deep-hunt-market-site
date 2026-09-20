const fs=require("fs");
const path=require("path");
const assert=require("assert");

const migration=fs.readFileSync("supabase/migrations/20260920084547_harden_hunt_payment_order_grants.sql","utf8");
for(const table of [
  "hunt_payment_sessions","hunt_payment_events","hunt_orders","hunt_order_events",
  "hunt_fulfillment_orders","hunt_order_pipeline_runs","hunt_unit_economics",
  "hunt_payplus_status_observations"
]){
  assert(migration.includes("revoke all privileges on table public."+table+" from anon, authenticated"),
    "missing least-privilege revoke for "+table);
}
for(const table of [
  "hunt_payment_sessions","hunt_payment_events","hunt_orders","hunt_order_events",
  "hunt_fulfillment_orders","hunt_order_pipeline_runs","hunt_unit_economics"
]){
  assert(migration.includes("grant select on table public."+table+" to authenticated"),
    "missing authenticated SELECT restore for "+table);
}
assert(!migration.includes("grant insert on table public.hunt_payment_sessions"));
assert(!migration.includes("grant update on table public.hunt_orders"));
assert(!migration.includes("grant select on table public.hunt_payplus_status_observations"));

const sensitive=/from\(["']hunt_(payment_sessions|payment_events|orders|order_events|fulfillment_orders|order_pipeline_runs|unit_economics|payplus_status_observations)["']\)\.(insert|update|delete|upsert)/;
for(const file of fs.readdirSync(".").filter(x=>x.endsWith(".js"))){
  if(file.endsWith(".test.js"))continue;
  const src=fs.readFileSync(file,"utf8");
  assert(!sensitive.test(src),file+" contains a direct browser write to payment/order state");
}
console.log("BOOM payment DB security: PASS — client writes absent and least-privilege grant migration is source-tracked");