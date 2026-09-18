const assert=require("node:assert/strict");
const fs=require("node:fs");
const {pathToFileURL}=require("node:url");

(async()=>{
  const auth=await import(pathToFileURL(
    require("node:path").resolve("supabase/functions/hunt-payplus-callback/payplus-auth.mjs")
  ));
  const body={payment_request_uid:"req-1",transaction_uid:"tx-1",more_info:"session-1"};
  const secret="sandbox-secret";
  const hash=await auth.hmacSha256Base64(JSON.stringify(body),secret);

  assert.equal((await auth.verifyPayPlusCallbackHeaders({
    userAgent:"PayPlus",hash,body,secretKey:secret
  })).valid,true);

  assert.equal((await auth.verifyPayPlusCallbackHeaders({
    userAgent:"Browser",hash,body,secretKey:secret
  })).reason,"PAYPLUS_USER_AGENT_INVALID");

  assert.equal((await auth.verifyPayPlusCallbackHeaders({
    userAgent:"PayPlus",hash:"bad",body,secretKey:secret
  })).reason,"PAYPLUS_SIGNATURE_INVALID");

  assert.equal((await auth.verifyPayPlusCallbackHeaders({
    userAgent:"PayPlus",hash,body:null,secretKey:secret
  })).reason,"PAYPLUS_SIGNED_BODY_REQUIRED");

  const source=fs.readFileSync("supabase/functions/hunt-payplus-callback/index.ts","utf8");
  assert(source.includes('req.headers.get("hash")'),"PayPlus hash header verification missing");
  assert(source.includes('req.headers.get("user-agent")'),"PayPlus user-agent verification missing");
  assert(source.includes("verifyPayPlusCallbackHeaders"),"PayPlus callback signature gate missing");
  assert(source.includes("verifyWithPayPlus(session,payload)"),"Independent IPN FULL verification must remain");
  assert(!source.includes("console.log(secret"),"Secrets must never be logged");
  console.log("hunt_payplus_callback_auth=PASS");
})().catch(err=>{console.error(err);process.exit(1)});
