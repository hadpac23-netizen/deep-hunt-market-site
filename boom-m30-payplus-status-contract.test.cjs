const fs=require("node:fs");
const assert=require("node:assert");

const callback=fs.readFileSync("supabase/functions/hunt-payplus-callback/index.ts","utf8");
const mapper=fs.readFileSync("supabase/functions/hunt-payplus-callback/payplus-status-map.mjs","utf8");
const sql=fs.readFileSync("docs/BOOM-M30-PAYPLUS-STATUS-OBSERVATIONS-SQL-PROPOSAL.sql","utf8");

for(const token of [
  'verifyPayPlusCallbackHeaders',
  'verifyWithPayPlus(session,payload)',
  'classifyPayPlusStatus',
  'hunt_payplus_status_observations',
  'accepted_paid:false',
  'PROVIDER_STATUS_MAPPING_REQUIRES_SANDBOX_PROOF'
]) assert(callback.includes(token),"M30 callback contract missing: "+token);

for(const token of [
  '0:"CARD_CHECK_J2"',
  '1:"CHARGE_J4"',
  '2:"APPROVAL_J5"',
  '4:"REFUND_J4"',
  'CHARGE_CANDIDATE_SANDBOX_PROOF_REQUIRED',
  'APPROVAL_NOT_PAID',
  'REFUND_CANDIDATE_SANDBOX_PROOF_REQUIRED',
  'UNKNOWN_HOLD',
  'accepted_paid:false',
  'paid_state_write_allowed:false'
]) assert(mapper.includes(token),"M30 mapper contract missing: "+token);

for(const token of [
  "create table if not exists public.hunt_payplus_status_observations",
  "accepted_paid boolean not null default false",
  "check (accepted_paid = false)",
  "enable row level security",
  "revoke all on table public.hunt_payplus_status_observations from public, anon, authenticated",
  'using (false)',
  'with check (false)'
]) assert(sql.includes(token),"M30 observation SQL missing: "+token);

assert(!sql.includes("card_number"));
assert(!sql.includes("customer_email"));
assert(!sql.includes("shipping_snapshot"));
console.log("boom_m30_payplus_status_contract=PASS");