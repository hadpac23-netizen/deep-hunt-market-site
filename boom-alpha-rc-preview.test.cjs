const assert=require("node:assert");
const Preview=require("./boom-alpha-rc-preview.js");

const stages=["A1","A2","A3","A4","A5","A6","A7","A8"].map(id=>({id,pass:true}));
const pack={
  mode:"A9_OWNER_ALPHA_EVIDENCE_PACK",
  owner_review_ready:true,
  release_gate:"ALPHA_OWNER_REVIEW_READY",
  production_ready:false,
  alpha_activation_authorized:false,
  evidence_fingerprint:"A9-TEST1234",
  boundaries:{payments_activated:false,order_routing_activated:false},
  stages
};
const harness={harness_pass:true,passed:4,total:4};

const rc=Preview.build({evidencePack:pack,harness});
assert.equal(rc.mode,"A10_ALPHA_RC_PREVIEW");
assert.equal(rc.preview_ready,true);
assert.equal(rc.visibility,"OWNER_PRIVATE_STUDIO");
assert.equal(rc.devices.length,4);
assert.equal(rc.journey.length,6);
assert(rc.journey.every(x=>x.ready));
assert.equal(rc.checkout_mode,"SIMULATION_ONLY");
assert.equal(rc.current_storefront_fallback,true);
assert.equal(rc.production_ready,false);
assert.equal(rc.production_changed,false);
assert.equal(rc.alpha_activation_authorized,false);
assert.equal(Preview.verify(rc).valid,true);

const blockedPack={...pack,owner_review_ready:false};
const blocked=Preview.build({evidencePack:blockedPack,harness});
assert.equal(blocked.preview_ready,false);
assert(blocked.blockers.includes("A9_EVIDENCE_NOT_READY"));

const missingStagePack={...pack,stages:stages.map(x=>x.id==="A5"?{...x,pass:false}:x)};
const missing=Preview.build({evidencePack:missingStagePack,harness});
assert.equal(missing.preview_ready,false);
assert(missing.journey.find(x=>x.id==="stylist").missing.includes("A5"));

const tampered=Preview.verify({...rc,payments_activated:true});
assert.equal(tampered.valid,false);
assert(tampered.issues.includes("PAYMENTS_MUST_BE_OFF"));

console.log("boom_alpha_rc_preview=PASS");
