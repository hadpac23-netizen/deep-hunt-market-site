const fs=require("node:fs");
const assert=require("node:assert/strict");
const analytics=fs.readFileSync("analytics.js","utf8");
const signal=fs.readFileSync("supabase/functions/hunt-commerce-signal/index.ts","utf8");

for(const token of [
  "function crowdSignalContext()",
  "Intl.DateTimeFormat().resolvedOptions().timeZone",
  "attribution_source",
  "attribution_medium",
  "timezone:crowd.timezone"
]) assert(analytics.includes(token),"analytics missing: "+token);

for(const token of [
  "timezone:clean(body?.timezone,80)",
  "attribution_source:clean(body?.attribution_source,80)",
  "attribution_medium:clean(body?.attribution_medium,80)"
]) assert(signal.includes(token),"commerce signal missing: "+token);

assert(!analytics.includes("navigator.geolocation"));
assert(!analytics.includes("document.referrer"));
assert(!analytics.includes("latitude"));
assert(!analytics.includes("longitude"));
assert(!signal.includes("metadata.ip"));
console.log("boom_f60t_analytics_signal=PASS");