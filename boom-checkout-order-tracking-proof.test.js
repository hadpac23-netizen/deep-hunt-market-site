const fs=require("fs"),vm=require("vm"),assert=require("assert");
const c=JSON.parse(fs.readFileSync("boom-checkout-order-tracking-proof-contract.json","utf8"));
assert.equal(c.authority,"NONE");
assert(/tracking_number/.test(c.pass_rule));
assert(c.hard_rules.some(x=>/Never count a test order as a real sale/.test(x)));
const src=fs.readFileSync("boom-checkout-order-tracking-proof.js","utf8");
const ctx={window:{}};vm.createContext(ctx);vm.runInContext(src,ctx);
const P=ctx.window.BoomCheckoutOrderTrackingProof;
let r=P.evaluate({
 stats:{bound_sessions:8,user_bound_orders:8,dry_run_pass:1,test_orders:8,fulfillment_rows:8,supplier_order_rows:0,tracking_rows:0,shipped_event_rows:0},
 rls:{session:true,order:true,events:true,fulfillment:true},
 code:{stable_identity:true,transient_retry:true,reconcile:true}
});
assert.equal(r.blocker,"SUPPLIER_ORDER_CREATED");
assert.equal(r.live_readiness_implied,false);
r=P.evaluate({
 stats:{bound_sessions:8,user_bound_orders:8,dry_run_pass:1,test_orders:8,fulfillment_rows:8,supplier_order_rows:1,tracking_rows:1,shipped_event_rows:1},
 rls:{session:true,order:true,events:true,fulfillment:true},
 code:{stable_identity:true,transient_retry:true,reconcile:true}
});
assert.equal(r.state,"E2E_PASS");assert.equal(r.material_action_authorized,false);
console.log("BOOM Checkout/Order/Tracking Proof: PASS — account binding, supplier order, persisted tracking, shipped event and retry identity all required");