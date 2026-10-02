const test=require("node:test");
const assert=require("node:assert/strict");
const crypto=require("node:crypto");

test("PayPlus callback signature accepts the documented HMAC contract",async()=>{
  const mod=await import("../supabase/functions/hunt-payplus-callback/payplus-auth.mjs");
  const body={transaction_uid:"tx-1",payment_request_uid:"req-1",amount:1};
  const secret="unit-test-secret";
  const hash=crypto.createHmac("sha256",secret).update(JSON.stringify(body)).digest("base64");
  const result=await mod.verifyPayPlusCallbackHeaders({
    userAgent:"PayPlus",hash,body,secretKey:secret
  });
  assert.equal(result.valid,true);
  assert.equal(result.reason,"PAYPLUS_SIGNATURE_VALID");
});

test("PayPlus callback rejects spoofed or incomplete signatures",async()=>{
  const mod=await import("../supabase/functions/hunt-payplus-callback/payplus-auth.mjs");
  const body={payment_request_uid:"req-1"};
  assert.equal((await mod.verifyPayPlusCallbackHeaders({
    userAgent:"Browser",hash:"x",body,secretKey:"s"
  })).valid,false);
  assert.equal((await mod.verifyPayPlusCallbackHeaders({
    userAgent:"PayPlus",hash:"",body,secretKey:"s"
  })).reason,"PAYPLUS_HASH_MISSING");
  assert.equal((await mod.verifyPayPlusCallbackHeaders({
    userAgent:"PayPlus",hash:"x",body:null,secretKey:"s"
  })).reason,"PAYPLUS_SIGNED_BODY_REQUIRED");
});

test("constant-time comparator handles equal and unequal strings",async()=>{
  const mod=await import("../supabase/functions/hunt-payplus-callback/payplus-auth.mjs");
  assert.equal(mod.constantTimeEqual("abc","abc"),true);
  assert.equal(mod.constantTimeEqual("abc","abd"),false);
  assert.equal(mod.constantTimeEqual("abc","abcx"),false);
});

test("callbacks for expired, missing-expiry and withdrawn sessions cannot enter evidence verification",async()=>{
  const {callbackSessionWindow}=await import("../supabase/functions/hunt-payplus-callback/payplus-auth.mjs");
  const now=Date.parse("2026-10-02T19:00:00Z");
  const future={status:"pending",expires_at:"2026-10-02T19:01:00Z"};
  assert.equal(callbackSessionWindow(future,now).valid,true);
  for(const expiry of ["2026-10-02T18:59:59Z","2026-10-02T19:00:00Z"]){
    assert.equal(callbackSessionWindow({...future,expires_at:expiry},now).reason,"PAYMENT_SESSION_EXPIRED");
  }
  for(const expiry of [null,undefined,"",true,"invalid"]){
    assert.equal(callbackSessionWindow({...future,expires_at:expiry},now).reason,"PAYMENT_SESSION_EXPIRY_UNVERIFIED");
  }
  for(const status of ["expired","cancelled","canceled","failed"]){
    assert.equal(callbackSessionWindow({...future,status},now).reason,"PAYMENT_SESSION_INACTIVE");
  }
});
