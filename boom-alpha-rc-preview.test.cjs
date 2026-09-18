const assert=require("node:assert");
const Preview=require("./boom-alpha-rc-preview.js");
const Evidence=require("./boom-alpha-evidence-pack.js");

const integrationStages=["A1","A2","A3","A4","A5","A6"].map(id=>({id,name:id,pass:true,evidence:id+" PASS"}));
const harness={harness_pass:true,passed:4,total:4};
const pack=Evidence.build({integrationStages,harness,generatedAt:"2026-09-18T10:00:00.000Z"});

const rc=Preview.build({evidencePack:pack,harness});
assert.equal(rc.mode,"A10_ALPHA_RC_PREVIEW");
assert.equal(rc.preview_ready,true);
assert.equal(rc.visibility,"OWNER_PRIVATE_STUDIO");
assert.equal(rc.evidence_integrity_valid,true);
assert.equal(rc.evidence_integrity_issues.length,0);
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

const forgedStage=JSON.parse(JSON.stringify(pack));
forgedStage.stages[0].evidence="forged";
const forgedStagePreview=Preview.build({evidencePack:forgedStage,harness});
assert.equal(forgedStagePreview.preview_ready,false);
assert.equal(forgedStagePreview.evidence_integrity_valid,false);
assert(forgedStagePreview.blockers.includes("A9_EVIDENCE_NOT_READY"));

const forgedPass=JSON.parse(JSON.stringify(pack));
forgedPass.stages[0].pass=false;
forgedPass.owner_review_ready=true;
forgedPass.release_gate="ALPHA_OWNER_REVIEW_READY";
const forgedPassPreview=Preview.build({evidencePack:forgedPass,harness});
assert.equal(forgedPassPreview.preview_ready,false);
assert.equal(forgedPassPreview.evidence_integrity_valid,false);

const forgedBlockers=JSON.parse(JSON.stringify(pack));
forgedBlockers.blockers=[{id:"A1",name:"forged",evidence:"forged"}];
assert.equal(Preview.build({evidencePack:forgedBlockers,harness}).preview_ready,false);

const forgedReady=JSON.parse(JSON.stringify(pack));
forgedReady.owner_review_ready=false;
assert.equal(Preview.build({evidencePack:forgedReady,harness}).preview_ready,false);

const forgedGate=JSON.parse(JSON.stringify(pack));
forgedGate.release_gate="BLOCKED_EVIDENCE_REQUIRED";
assert.equal(Preview.build({evidencePack:forgedGate,harness}).preview_ready,false);

const forgedOwnerGate=JSON.parse(JSON.stringify(pack));
forgedOwnerGate.owner_gate="BYPASS";
assert.equal(Preview.build({evidencePack:forgedOwnerGate,harness}).preview_ready,false);

const forgedFingerprint=JSON.parse(JSON.stringify(pack));
forgedFingerprint.evidence_fingerprint="A9-DEADBEEF";
assert.equal(Preview.build({evidencePack:forgedFingerprint,harness}).preview_ready,false);

const tampered=Preview.verify({...rc,payments_activated:true});
assert.equal(tampered.valid,false);
assert(tampered.issues.includes("PAYMENTS_MUST_BE_OFF"));

console.log("boom_alpha_rc_preview=PASS");
