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
