const fs=require("fs"),vm=require("vm"),assert=require("assert");
const c=JSON.parse(fs.readFileSync("boom-payment-launch-gate-contract.json","utf8"));
assert.equal(c.authority,"NONE");
assert(c.hard_rules.some(x=>/Never activate a payment route/.test(x)));
assert(c.dependency_rules.some(x=>/Wallet route cannot be more ready/.test(x)));
const src=fs.readFileSync("boom-payment-launch-gate.js","utf8");
const ctx={window:{}};vm.createContext(ctx);vm.runInContext(src,ctx);
const G=ctx.window.BoomPaymentLaunchGate;
const route={route_key:"payplus_card",processor:"payplus",payment_method:"card",display_name:"Card",status:"planned",approval_reference:null,approved_at:null};
let r=G.evaluate({routes:[route],payment_live:{enabled:false,owner_approved:false},provider_evidence:{payplus:{}}});
assert.equal(r.routes[0].state,"PLANNED");
assert.equal(r.routes[0].blocker,"COMMERCIAL_ACCOUNT_APPROVED");
assert.equal(r.summary.live,0);
const readyEvidence={
  account_approved:true,server_credentials_ready:true,sandbox_proven:true,success_callback_proven:true,
  failure_callback_proven:true,idempotency_integrity_proven:true,refund_proven:true,finance_ledger_proven:true,
  settlement_destination_verified:true,country_currency_scope_verified:true,legal_checkout_ready:true,owner_gate_approved:true
};
const approved={...route,status:"ready",approval_reference:"merchant-approval",approved_at:"2026-09-22T00:00:00Z"};
r=G.evaluate({routes:[approved],payment_live:{enabled:false,owner_approved:false},provider_evidence:{payplus:readyEvidence}});
assert.equal(r.routes[0].state,"LIVE_READY_CANDIDATE");
assert.equal(r.routes[0].blocker,"MASTER_PAYMENT_LIVE_OFF");
r=G.evaluate({routes:[approved],payment_live:{enabled:true,owner_approved:true},provider_evidence:{payplus:readyEvidence}});
assert.equal(r.routes[0].state,"LIVE");
assert.equal(r.material_action_authorized,false);
console.log("BOOM Payment Launch Gate: PASS — commercial/account proof, PSP evidence, Owner Gate and master switch required; evaluator has no activation authority");