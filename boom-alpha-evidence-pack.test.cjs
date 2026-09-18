const assert=require("node:assert");
const Evidence=require("./boom-alpha-evidence-pack.js");

const passStages=["A1","A2","A3","A4","A5","A6"].map(id=>({id,name:id,pass:true,evidence:id+" PASS"}));
const harness={harness_pass:true,passed:4,total:4};

const pack=Evidence.build({integrationStages:passStages,harness,generatedAt:"2026-09-18T08:00:00.000Z"});
assert.equal(pack.mode,"A9_OWNER_ALPHA_EVIDENCE_PACK");
assert.equal(pack.stage_count,8);
assert.equal(pack.owner_review_ready,true);
assert.equal(pack.release_gate,"ALPHA_OWNER_REVIEW_READY");
assert.equal(pack.owner_gate,"OWNER_REVIEW_REQUIRED");
assert.equal(pack.alpha_activation_authorized,false);
assert.equal(pack.production_ready,false);
assert.equal(pack.blockers.length,0);
assert(/^A9-[0-9A-F]{8}$/.test(pack.evidence_fingerprint));
assert.equal(Evidence.verifyBoundaries(pack).valid,true);
assert.equal(Evidence.verifyIntegrity(pack).valid,true);

const same=Evidence.build({integrationStages:passStages,harness,generatedAt:"2026-09-18T09:00:00.000Z"});
assert.equal(same.evidence_fingerprint,pack.evidence_fingerprint,"fingerprint must not depend on generated_at");

const blockedStages=passStages.map(x=>({...x}));
blockedStages[4]={...blockedStages[4],pass:false,evidence:"A5 blocked"};
const blocked=Evidence.build({integrationStages:blockedStages,harness,generatedAt:"2026-09-18T08:00:00.000Z"});
assert.equal(blocked.owner_review_ready,false);
assert.equal(blocked.release_gate,"BLOCKED_EVIDENCE_REQUIRED");
assert(blocked.blockers.some(x=>x.id==="A5"));
assert.notEqual(blocked.evidence_fingerprint,pack.evidence_fingerprint);
assert.equal(Evidence.verifyBoundaries(blocked).valid,true);
assert.equal(Evidence.verifyIntegrity(blocked).valid,true);

const harnessBlocked=Evidence.build({integrationStages:passStages,harness:{harness_pass:false,passed:3,total:4},generatedAt:"2026-09-18T08:00:00.000Z"});
assert.equal(harnessBlocked.owner_review_ready,false);
assert(harnessBlocked.blockers.some(x=>x.id==="A8"));

const tampered={...pack,production_ready:true};
const check=Evidence.verifyBoundaries(tampered);
assert.equal(check.valid,false);
assert(check.issues.includes("PRODUCTION_READY_MUST_BE_FALSE"));

const forgedStage=JSON.parse(JSON.stringify(pack));
forgedStage.stages[0].evidence="forged";
assert.equal(Evidence.verifyBoundaries(forgedStage).valid,true);
assert.equal(Evidence.verifyIntegrity(forgedStage).valid,false);
assert(Evidence.verifyIntegrity(forgedStage).issues.includes("EVIDENCE_FINGERPRINT_MISMATCH"));

const forgedPass=JSON.parse(JSON.stringify(blocked));
forgedPass.stages[0].pass=true;
assert.equal(Evidence.verifyIntegrity(forgedPass).valid,false);

const forgedReady=JSON.parse(JSON.stringify(blocked));
forgedReady.owner_review_ready=true;
assert(Evidence.verifyIntegrity(forgedReady).issues.includes("OWNER_REVIEW_READY_MISMATCH"));

const forgedGate=JSON.parse(JSON.stringify(blocked));
forgedGate.release_gate="ALPHA_OWNER_REVIEW_READY";
assert(Evidence.verifyIntegrity(forgedGate).issues.includes("RELEASE_GATE_MISMATCH"));

const forgedFingerprint=JSON.parse(JSON.stringify(pack));
forgedFingerprint.evidence_fingerprint="A9-DEADBEEF";
assert(Evidence.verifyIntegrity(forgedFingerprint).issues.includes("EVIDENCE_FINGERPRINT_MISMATCH"));

const forgedBlockers=JSON.parse(JSON.stringify(blocked));
forgedBlockers.blockers=[];
assert(Evidence.verifyIntegrity(forgedBlockers).issues.includes("BLOCKERS_MISMATCH"));

console.log("boom_alpha_evidence_pack=PASS");
