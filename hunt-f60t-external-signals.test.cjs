const fs=require("node:fs");
const assert=require("node:assert/strict");
const code=fs.readFileSync("supabase/functions/hunt-f60t-external-signals/index.ts","utf8");

for(const token of [
  'createSupabaseContext(req,{auth:["user","none"]})',
  "ADMIN_OR_CRON_REQUIRED",
  "x-f60t-cron-secret",
  "f60t_cron_auth",
  "resolveAccessToken",
  "refreshPinterest",
  "refreshYoutube",
  "vault.decrypted_secrets",
  "vault.create_secret",
  "vault.update_secret",
  "PINTEREST_ACCESS_TOKEN",
  "PINTEREST_AD_ACCOUNT_ID",
  "YOUTUBE_OAUTH_ACCESS_TOKEN",
  "https://api.pinterest.com/v5/trends/keywords/",
  "/audience_insights?audience_insight_type=",
  "https://youtubeanalytics.googleapis.com/v2/reports?",
  "DEMAND_TREND_NOT_PURCHASE_INTENT",
  "AUDIENCE_AFFINITY_NOT_PURCHASE_INTENT",
  "CHANNEL_VIEWERSHIP_NOT_PURCHASE_INTENT",
  "f60t_external_signal_runs",
  "f60t_crowd_signal_snapshots",
  "sync_available",
  "secrets_exposed:false",
  "paid_spend:false",
  "external_publish:false"
]) assert(code.includes(token),"external signals function missing: "+token);

assert(!/PINTEREST_ACCESS_TOKEN\s*=\s*["'][^"']+["']/.test(code));
assert(!/YOUTUBE_OAUTH_ACCESS_TOKEN\s*=\s*["'][^"']+["']/.test(code));
assert(!code.includes("console.log(access"));
console.log("hunt_f60t_external_signals_contract=PASS");