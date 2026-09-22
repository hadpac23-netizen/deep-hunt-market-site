const fs=require("fs"),vm=require("vm"),assert=require("assert");
const c=JSON.parse(fs.readFileSync("boom-payplus-sandbox-proof-contract.json","utf8"));
assert.equal(c.authority,"NONE");
assert(/Never infer payment success from charge_method=1 alone/.test(c.hard_rules.join(" ")));
assert(c.activation_profiles.paid_acceptance_requires.includes("J4_FAILURE"));
const src=fs.readFileSync("boom-payplus-sandbox-proof.js","utf8");
const ctx={window:{}};vm.createContext(ctx);vm.runInContext(src,ctx);
const P=ctx.window.BoomPayPlusSandboxProof;

let r=P.evaluate({control:{enabled:false,owner_approved:false}});
assert.equal(r.state,"BLOCKED_SANDBOX_CONTROL_OFF");
assert.equal(r.paid_acceptance_ready,false);

const success={environment:"sandbox",charge_method:1,provider_status:"OK",provider_code:"000",mapping_state:"CANDIDATE",signature_verified:true,ipn_full_verified:true,accepted_paid:false};
const fail={environment:"sandbox",charge_method:1,provider_status:"FAILED",provider_code:"123",mapping_state:"CANDIDATE",signature_verified:true,ipn_full_verified:true,accepted_paid:false};
const approved={};
approved[P.fingerprint(success)]="PAID_SUCCESS";
approved[P.fingerprint(fail)]="NOT_PAID";
r=P.evaluate({
 control:{enabled:true,owner_approved:true},
 sessions:[{id:"s1"},{id:"s2"}],
 observations:[success,fail],
 approved_fingerprints:approved,
 events:[{provider_event_id:"e1"},{provider_event_id:"e2"}],
 duplicate_replay_attempted:true,
 duplicate_paid_transition_count:0,
 reference_integrity_proven:true,
 cancel_not_paid_proven:true
});
assert.equal(r.paid_acceptance_ready,true);
assert.equal(r.checkout_launch_ready,true);
assert.equal(r.refund_launch_ready,false);
assert.equal(r.material_action_authorized,false);

const unsafe=P.evaluate({
 control:{enabled:true,owner_approved:true},
 sessions:[{id:"s1"}],
 observations:[success],
 approved_fingerprints:{}
});
assert.equal(unsafe.checks.J4_SUCCESS,false);
assert.equal(unsafe.paid_acceptance_ready,false);

console.log("BOOM PayPlus Sandbox Proof: PASS — charge method alone never proves paid, exact fingerprints + failure/idempotency/integrity required");