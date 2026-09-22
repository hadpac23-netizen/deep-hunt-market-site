const fs=require("fs"),vm=require("vm"),assert=require("assert");
const contract=JSON.parse(fs.readFileSync("boom-hourly-profit-loop-contract.json","utf8"));
assert(/exact verification_status='VERIFIED'/.test(contract.verification_rule));
assert.equal(contract.source_truth.exact_verified_rows,0);
const src=fs.readFileSync("boom-hourly-profit-loop.js","utf8");
const rows=[
 {hour_start:"2026-09-22T10:00:00Z",currency:"USD",verified_net_profit:"9999",verification_status:"UNVERIFIED",confirmed_real_orders:0,settled_real_orders:0},
 {hour_start:"2026-09-22T09:00:00Z",currency:"USD",verified_net_profit:"2000",verification_status:"VERIFIED",confirmed_real_orders:2,settled_real_orders:1}
];
function q(){const z={select(){return z},gte(){return z},order(){return z},limit(){return Promise.resolve({data:rows,error:null})}};return z}
const ctx={window:{BoomRuntime:{adminReady:async()=>({ok:true}),getSupabaseClient:()=>({from:()=>q()})}},Date};
vm.createContext(ctx);vm.runInContext(src,ctx);
(async()=>{
 const H=ctx.window.BoomHourlyProfitLoop;
 assert.equal(H.exactVerified(rows[0]),false);
 assert.equal(H.exactVerified(rows[1]),true);
 const run=await H.run();
 assert.equal(run.snapshot.exact_verified_rows,1);
 assert.equal(run.diagnosis.verified_net_profit_per_hour,2000);
 assert.equal(run.diagnosis.target_gap,8000);
 assert.equal(run.dispatch,false);
 const blocked=H.diagnose({latest_row:rows[0],latest_verified:null});
 assert.equal(blocked.status,"BLOCKED_UNVERIFIED");
 assert.equal(blocked.verified_net_profit_per_hour,null);
 console.log("BOOM Hourly Profit Loop: PASS — exact VERIFIED only, UNVERIFIED rejected, target gap and proposals are SHADOW");
})().catch(e=>{console.error(e);process.exit(1)});