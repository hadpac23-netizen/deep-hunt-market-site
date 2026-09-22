const fs=require("fs"),vm=require("vm"),assert=require("assert");
const contract=JSON.parse(fs.readFileSync("boom-product-profit-ledger-contract.json","utf8"));
assert.equal(contract.schema_change_required,false);
assert.equal(contract.current_state,"EXPECTED_ONLY");
assert(/Never convert expected contribution into realized profit/.test(contract.no_fake_rule));
assert(contract.exclusions.includes("test orders"));
const src=fs.readFileSync("boom-product-profit-ledger-adapter.js","utf8");
const expectedRows=[{provider:"CJ",item_id:"1",variant_id:"v1",destination_country:"US",quantity:1,currency:"USD",sale_price_per_unit:"20",supplier_cost_per_unit:"5",customer_shipping_amount:"0",supplier_shipping_cost:"4",payment_reserve:"1",refund_reserve:"1",platform_cost:"1",contribution_before_coupon:"8",contribution_margin:"0.4",max_safe_cac:"5",profit_gate_status:"PASS",inputs_verified:true,calculated_at:"2026-09-20"}];
function query(table){
 const q={
   select(){return q},eq(k,v){q.eqv=[k,v];return q},order(){return q},limit(){
     const data=table==="hunt_unit_economics"?expectedRows:[];
     return Promise.resolve({data,error:null});
   }
 };return q;
}
const client={from:table=>query(table)};
const ctx={window:{BoomRuntime:{adminReady:async()=>({ok:true}),getSupabaseClient:()=>client}}};
vm.createContext(ctx);vm.runInContext(src,ctx);
(async()=>{
 const snap=await ctx.window.BoomProductProfitLedger.snapshot();
 assert.equal(snap.expected.length,1);
 assert.equal(snap.expected[0].state,"EXPECTED_ONLY");
 assert.equal(snap.expected[0].realized_profit,null);
 assert.equal(snap.realized.state,"UNKNOWN_NO_REAL_FINANCE_ROWS");
 assert.equal(snap.mission_target_eligible_realized_profit,0);
 assert.equal(snap.test_orders_excluded,true);
 console.log("BOOM Product Profit Ledger: PASS — expected/realized separated, test orders excluded, no parallel schema");
})().catch(e=>{console.error(e);process.exit(1)});