const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {pathToFileURL}=require("node:url");
const root=path.resolve(__dirname,"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");

let security;
test.before(async()=>{
  security=await import(pathToFileURL(path.join(root,"supabase/functions/_shared/hunt-session-security.mjs")).href);
});

test("RT09 rejects fractional, zero, negative, overflow and non-numeric quantities",()=>{
  assert.equal(security.requireIntegerQuantity(1),1);
  assert.equal(security.requireIntegerQuantity("5"),5);
  for(const bad of [1.7,0,-1,6,"abc",NaN,Infinity]){
    assert.throws(()=>security.requireIntegerQuantity(bad),/INVALID_QUANTITY/);
  }
});

test("RT01 rejects expired, stale-mode, disabled-live and changed-price session reuse",()=>{
  const base={mode:"live",status:"pending",expires_at:"2099-01-01T00:00:00Z",provider_redirect_url:"https://pay.example/test"};
  assert.equal(security.sessionReuseState(base,{expectedMode:"live",liveApproved:true,now:0}).ok,true);
  assert.equal(security.sessionReuseState({...base,expires_at:"2000-01-01T00:00:00Z"},{expectedMode:"live",liveApproved:true}).reason,"SESSION_EXPIRED");
  assert.equal(security.sessionReuseState(base,{expectedMode:"live",liveApproved:false}).reason,"PAYMENT_LIVE_KILL_SWITCH_OFF");
  assert.equal(security.sessionReuseState(base,{expectedMode:"prelaunch",liveApproved:false}).reason,"SESSION_MODE_STALE");
  const a={country_code:"IL",currency:"USD",product_amount:10,shipping_amount:2,total_amount:12};
  assert.equal(security.pricingSnapshotMatches(a,{...a,total_amount:12}),true);
  assert.equal(security.pricingSnapshotMatches(a,{...a,total_amount:13}),false);
});

test("RT02 guest ownership uses a server proof rather than idempotency alone",async()=>{
  const token="guest-proof-example";
  const hash=await security.sha256Hex(token);
  assert.equal(await security.guestOwnerProofMatches(token,hash),true);
  assert.equal(await security.guestOwnerProofMatches("other",hash),false);
  assert.equal(await security.guestOwnerProofMatches("",hash),false);
});

test("payment-session enforces owner proof, price snapshot and reuse state before reuse",()=>{
  const src=read("supabase/functions/hunt-payment-session/index.ts");
  assert.match(src,/guest_owner_token_hash/);
  assert.match(src,/SIGNED_IN_SESSION_AUTH_REQUIRED/);
  assert.match(src,/SESSION_OWNER_PROOF_REQUIRED/);
  assert.match(src,/pricingSnapshotMatches\(existing,pricing\)/);
  assert.match(src,/sessionReuseState\(existing,\{expectedMode:initialMode,liveApproved\}\)/);
  assert.match(src,/x\.unit_retail_amount,x\.shipping_amount,x\.currency/);
});

test("order preview requires signed-in ownership or the guest server proof",()=>{
  const src=read("supabase/functions/hunt-order-preview/index.ts");
  assert.match(src,/if\(!userSub\)return json\(req,\{ok:false,error:"SIGNED_IN_SESSION_AUTH_REQUIRED"\},403\)/);
  assert.match(src,/guestOwnerProofMatches\(body\?\.session_owner_token,session\.guest_owner_token_hash\)/);
  assert.match(src,/SESSION_OWNER_PROOF_REQUIRED/);
});

test("checkout carries guest ownership proof only in request bodies",()=>{
  const src=read("checkout.js");
  assert.match(src,/let lastSessionOwnerToken = ""/);
  assert.match(src,/session_owner_token:sessionOwnerToken\|\|undefined/);
  assert.match(src,/lastSessionOwnerToken = String\(data\.session_owner_token \|\| ""\)/);
  assert.doesNotMatch(src,/URLSearchParams[^\n]*session_owner_token/);
});
