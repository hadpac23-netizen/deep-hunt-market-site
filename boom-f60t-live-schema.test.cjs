const fs=require("node:fs");
const assert=require("node:assert/strict");
const sql=fs.readFileSync("supabase/migrations/20260919164610_f60t_live_signals_hourly_profit.sql","utf8");
for(const token of [
  "create table if not exists public.f60t_signal_sources",
  "create table if not exists public.f60t_crowd_signal_snapshots",
  "create table if not exists public.f60t_agent_signal_events",
  "create table if not exists public.f60t_hourly_profit_ledger",
  "enable row level security",
  "revoke all on table public.f60t_hourly_profit_ledger from anon",
  "revoke all on table public.f60t_hourly_profit_ledger from authenticated",
  "grant select on table public.f60t_hourly_profit_ledger to authenticated",
  'create policy "Admins read F60T hourly profit"',
  "google_trends_alpha",
  "pinterest_trends",
  "PENDING_PROTOCOL_TRAFFIC"
]) assert(sql.includes(token),"F60T migration missing: "+token);
console.log("boom_f60t_live_schema=PASS");