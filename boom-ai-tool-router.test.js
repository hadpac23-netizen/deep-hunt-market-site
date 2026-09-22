const fs=require("fs"),vm=require("vm"),assert=require("assert");
const files={
 "boom-ai-tool-router.json":JSON.parse(fs.readFileSync("boom-ai-tool-router.json","utf8")),
 "boom-tool-registry.json":JSON.parse(fs.readFileSync("boom-tool-registry.json","utf8"))
};
const src=fs.readFileSync("boom-ai-tool-router.js","utf8");
const ctx={window:{},fetch:async p=>({ok:true,json:async()=>files[p]})};vm.createContext(ctx);vm.runInContext(src,ctx);
(async()=>{
 const R=ctx.window.BoomAIToolRouter;const st=await R.ready();
 assert.equal(st.mode,"PLAN_ONLY");assert.equal(st.authority,"NONE");
 const plan=await R.plan("workflow_execution",[
  {tool_id:"n8n",quality:.9,cost:.8,speed:.9,privacy:.8,readiness:.1,require_active:true}
 ]);
 assert.equal(plan.ok,true);assert.equal(plan.dispatch,false);assert.equal(plan.selected,null);
 assert.equal(plan.fallback,"boom_runtime_only");
 const research=await R.plan("research",[
  {tool_id:"f60t_signal_tools",quality:.8,cost:.8,speed:.7,privacy:.8,readiness:1,require_active:true}
 ]);
 assert.equal(research.selected.tool_id,"f60t_signal_tools");
 console.log("BOOM AI tool router: PASS — plan-only scoring, inactive tools filtered, no execution authority");
})().catch(e=>{console.error(e);process.exit(1);});