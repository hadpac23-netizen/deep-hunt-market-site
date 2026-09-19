const fs=require("node:fs");
const assert=require("node:assert/strict");
const sql=fs.readFileSync("supabase/migrations/20260919172159_f60t_oauth_hourly_scheduler.sql","utf8");
for(const token of [
  "create table if not exists public.f60t_oauth_connections",
  "create table if not exists public.f60t_oauth_states",
  "create table if not exists public.f60t_cron_auth",
  "vault.create_secret",
  "digest(v_secret,'sha256')",
  "Admins read F60T OAuth connections",
  "revoke all on table public.f60t_cron_auth from authenticated",
  "f60t-external-signals-hourly",
  "'0 * * * *'",
  "f60t-snapshot-hourly",
  "'10 * * * *'",
  "x-f60t-cron-secret",
  "sync_available"
]) assert(sql.includes(token),"OAuth/cron migration missing: "+token);
assert(!/x-f60t-cron-secret['"\s,:]+[a-f0-9]{40,}/i.test(sql));
console.log("boom_f60t_oauth_cron_schema=PASS");