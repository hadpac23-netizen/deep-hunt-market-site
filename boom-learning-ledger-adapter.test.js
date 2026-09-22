const fs=require("fs"),vm=require("vm"),assert=require("assert");
const src=fs.readFileSync("boom-learning-ledger-adapter.js","utf8"),calls=[];
const chain={upsert(row,opts){calls.push({row,opts});return this;},select(){return this;},maybeSingle(){return Promise.resolve({data:{status:"testing",eval_required:true},error:null});}};
const db={from:t=>{assert.equal(t,"hunt_boom_learning_items");return chain;}};
const ctx={window:{BoomRuntime:{adminReady:async()=>({ok:true}),getSupabaseClient:()=>db}}};
vm.createContext(ctx);vm.runInContext(src,ctx);
(async()=>{
 const run={workflow_id:"analytics_learning_loop",run_id:"r1",correlation_id:"c1",mission_id:"m1"};
 const out=await ctx.window.BoomLearningLedger.propose(run,{title:"Test",principle:"Evidence principle",hunt_application:"Test in HUNT",confidence:.6,metadata:{email:"drop@example.com",safe:"ok"}});
 assert.equal(out.status,"testing");
 const row=calls[0].row;assert.equal(row.behavior_rule,null);assert.equal(row.eval_required,true);assert.equal(row.status,"testing");
 assert(!JSON.stringify(row).includes("drop@example.com"));
 console.log("Learning ledger: PASS — candidate stored as testing, no behavior auto-adoption");
})().catch(e=>{console.error(e);process.exit(1);});