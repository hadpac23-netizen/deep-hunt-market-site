const fs=require("node:fs");
const assert=require("node:assert/strict");
const html=fs.readFileSync("f60t-oauth-callback.html","utf8");
const js=fs.readFileSync("f60t-oauth-callback.js","utf8");

for(const token of [
  'meta name="robots" content="noindex,nofollow"',
  "f60t-oauth-callback.js?v=1",
  "Back to BOOM Studio"
]) assert(html.includes(token),"OAuth callback HTML missing: "+token);

for(const token of [
  'params.get("code")',
  'params.get("state")',
  'action:"exchange",code,state',
  'Authorization:"Bearer "+session.access_token',
  'location.replace("boom-growth-os.html?f60t_oauth=connected")'
]) assert(js.includes(token),"OAuth callback JS missing: "+token);

assert(!js.includes("access_token:"));
assert(!js.includes("refresh_token"));
assert(!js.includes("provider:"));
console.log("boom_f60t_oauth_callback=PASS");