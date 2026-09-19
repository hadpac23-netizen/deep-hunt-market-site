const fs=require("node:fs");
const assert=require("node:assert/strict");
const sql=fs.readFileSync("supabase/migrations/20260919165607_f60t_external_platform_connectors.sql","utf8");
for(const token of [
  "create table if not exists public.f60t_external_signal_runs",
  "enable row level security",
  "revoke all on table public.f60t_external_signal_runs from anon",
  "grant select on table public.f60t_external_signal_runs to authenticated",
  'create policy "Admins read F60T external runs"',
  "youtube_analytics",
  "AVAILABLE_NOT_CONNECTED",
  "Official YouTube Analytics API",
  "TikTok Display API"
]) assert(sql.includes(token),"external connector migration missing: "+token);
console.log("boom_f60t_external_schema=PASS");