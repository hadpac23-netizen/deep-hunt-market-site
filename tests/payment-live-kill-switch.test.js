const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const src=fs.readFileSync(path.resolve(__dirname,"../supabase/functions/hunt-payment-session/index.ts"),"utf8");

test("live PayPlus mode is gated by hunt_payment_live runtime control",()=>{
  assert.match(src,/runtimeControl\(ctx,"hunt_payment_live"\)/);
  assert.match(src,/data\?\.enabled===true&&data\?\.owner_approved===true/);
  assert.match(src,/requestedMode==="live"&&liveApproved/);
  assert.match(src,/PAYMENT_LIVE_KILL_SWITCH_OFF/);
});

test("provider session uses the server-approved mode, not raw environment mode",()=>{
  assert.match(src,/createPayPlusSession\(sessionId:string,pricing:any,mode:string\)/);
  assert.match(src,/createPayPlusSession\(inserted\.id,pricing,initialMode\)/);
  assert.doesNotMatch(src,/const mode=clean\(Deno\.env\.get\("HUNT_PAYMENT_MODE"\)\).*createPayPlusSession/s);
});

test("sandbox may remain isolated from the live kill switch",()=>{
  assert.match(src,/configured&&requestedMode==="sandbox"\s*\? "sandbox"/);
  assert.match(src,/mode==="live"\s*\?\s*"https:\/\/restapi\.payplus\.co\.il\/api\/v1\.0"/);
  assert.match(src,/"https:\/\/restapidev\.payplus\.co\.il\/api\/v1\.0"/);
});
