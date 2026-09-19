const fs=require("node:fs");
const assert=require("node:assert/strict");
const code=fs.readFileSync("supabase/functions/hunt-f60t-oauth/index.ts","utf8");

for(const token of [
  'createSupabaseContext(req,{auth:"user"})',
  "ADMIN_REQUIRED",
  "DEFAULT_CALLBACK",
  "f60t-oauth-callback.html",
  "PINTEREST_CLIENT_ID",
  "PINTEREST_CLIENT_SECRET",
  "GOOGLE_OAUTH_CLIENT_ID",
  "GOOGLE_OAUTH_CLIENT_SECRET",
  "https://www.pinterest.com/oauth/",
  "https://api.pinterest.com/v5/oauth/token",
  "https://accounts.google.com/o/oauth2/v2/auth",
  "https://oauth2.googleapis.com/token",
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/yt-analytics.readonly",
  "discoverPinterestAccount",
  "https://api.pinterest.com/v5/ad_accounts?page_size=25",
  "discoverYoutubeChannel",
  "https://www.googleapis.com/youtube/v3/channels?",
  "account_discovery_status",
  "vault.create_secret",
  "vault.update_secret",
  "f60t_oauth_states",
  "f60t_oauth_connections",
  '.eq("state_hash",stateHash)',
  '.eq("created_by",uid)',
  "const provider=clean(stateRow.provider,30).toLowerCase()",
  "secrets_exposed:false"
]) assert(code.includes(token),"F60T OAuth missing: "+token);

assert(!code.includes('.eq("provider",provider)'));
assert(!/PINTEREST_CLIENT_SECRET\s*=\s*["'][^"']+["']/.test(code));
assert(!/GOOGLE_OAUTH_CLIENT_SECRET\s*=\s*["'][^"']+["']/.test(code));
assert(!code.includes("console.log(accessToken"));
console.log("hunt_f60t_oauth_contract=PASS");