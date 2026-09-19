const fs=require("node:fs");
const assert=require("node:assert/strict");
const sql=fs.readFileSync("supabase/migrations/20260919180208_f60t_near_realtime_world_watch.sql","utf8");

for(const token of [
  "'LICENSE_REVIEW'::text",
  "'cloudflare_radar'",
  "'Cloudflare Radar'",
  "CC BY-NC 4.0",
  "cron.unschedule('f60t-snapshot-hourly')",
  "f60t-snapshot-10m",
  "'*/10 * * * *'",
  "F60T_10M_CRON"
]) assert(sql.includes(token),"near realtime migration missing: "+token);

assert(!sql.includes("CLOUDFLARE_RADAR_API_TOKEN"));
console.log("boom_f60t_near_realtime_schema=PASS");