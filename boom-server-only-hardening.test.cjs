const fs=require("fs");
const assert=require("assert");

const sql=fs.readFileSync(
  "supabase/migrations/20260916124429_harden_server_only_tables.sql","utf8"
);
const tables=[
  "app_secrets",
  "hunt_deal_partner_outreach",
  "hunt_deal_partner_requests",
  "hunt_partner_candidates",
  "hunt_shelf_coverage",
  "merchant_checkout_integrations",
  "merchant_checkout_variants"
];

for(const table of tables){
  assert(sql.includes("public."+table),"missing "+table);
  assert(new RegExp("revoke all privileges on table public\\."+table+" from anon;","i").test(sql));
  assert(new RegExp("revoke all privileges on table public\\."+table+" from authenticated;","i").test(sql));
}
assert.equal((sql.match(/create policy "Server-only direct client deny"/g)||[]).length,7);
assert(!/grant\s+.+\s+to\s+(anon|authenticated)/i.test(sql));

console.log("BOOM server-only hardening test: PASS");
