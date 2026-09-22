const fs=require("fs"),vm=require("vm"),assert=require("assert");
const contract=JSON.parse(fs.readFileSync("boom-first-real-order-proof-contract.json","utf8"));
assert.equal(contract.authority,"NONE");
assert(contract.hard_rules.some(x=>/Never enable payment acceptance/.test(x)));
assert(contract.hard_rules.some(x=>/Never count is_test=true/.test(x)));
const src=fs.readFileSync("boom-first-real-order-proof.js","utf8");
const ctx={window:{}};vm.createContext(ctx);vm.runInContext(src,ctx);
const P=ctx.window.BoomFirstRealOrderProof;
let r=P.evaluate({payment_control:{enabled:false,owner_approved:false}});
assert.equal(r.blocker,"PAYMENT_ACCEPTANCE_KILL_SWITCH_OFF");
const base={
 payment_control:{enabled:true,owner_approved:true},
 order:{id:"o1",is_test:false},
 finance:{id:"f1",order_id:"o1",is_test:false,currency:"USD",contribution_locked:40,available_profit:25,settlement_status:"settled"},
 bridge:{payment_session_id:"p1",paid_at:"2026-09-22T10:10:00Z",order_id:"o1",provider_payment_confirmation:true,server_purchase_confirmation:true,real_order_linked:true,finance_ledger_present:true,finance_is_test:false,profit_evidence_ready:true},
 hourly:{hour_start:"2026-09-22T10:00:00Z",currency:"USD",verified_net_profit:25,confirmed_real_orders:1,settled_real_orders:1,verification_status:"UNVERIFIED",evidence:{source_finance_ledger_ids:["f1"]}}
};
r=P.evaluate(base);assert.equal(r.blocker,"NO_EXACT_VERIFIED_HOURLY_ROW");
r=P.evaluate({...base,hourly:{...base.hourly,verification_status:"VERIFIED",evidence:{source_finance_ledger_ids:[]}}});
assert.equal(r.blocker,"HOURLY_EVIDENCE_LINK_MISSING");
r=P.evaluate({...base,hourly:{...base.hourly,verification_status:"VERIFIED"}});
assert.equal(r.state,"PROVEN");assert.equal(r.verified_net_profit_per_hour,25);assert.equal(r.target_gap,9975);assert.equal(r.material_action_authorized,false);
const testOrder=P.evaluate({...base,order:{id:"o1",is_test:true}});
assert.equal(testOrder.blocker,"NO_REAL_ORDER");
console.log("BOOM First Real Order Proof: PASS — kill switch, real-order, finance, settlement, exact hourly evidence and target gap enforced");