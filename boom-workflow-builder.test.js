const fs=require("fs"),vm=require("vm"),assert=require("assert");
const files={
  "boom-operational-skills.json":JSON.parse(fs.readFileSync("boom-operational-skills.json","utf8")),
  "boom-workflow-templates.json":JSON.parse(fs.readFileSync("boom-workflow-templates.json","utf8")),
  "boom-workflow-builder-contract.json":JSON.parse(fs.readFileSync("boom-workflow-builder-contract.json","utf8"))
};
const src=fs.readFileSync("boom-workflow-builder.js","utf8");
const ctx={window:{},Date:{now:()=>123},fetch:async p=>({ok:true,json:async()=>files[p]})};vm.createContext(ctx);vm.runInContext(src,ctx);
(async()=>{
 const B=ctx.window.BoomWorkflowBuilder; const st=await B.ready();
 assert.equal(st.skills,16);assert.equal(st.templates,16);
 const p=await B.compile("product_ad_factory",{missionContext:{product_id:"p1",email:"strip-me"}});
 assert.equal(p.ok,true);assert.equal(p.dispatch,false);assert.equal(p.mode,"SHADOW");
 assert.equal(p.material_action_suppressed,true);assert.deepEqual(p.gates,["OWNER_GATE"]);
 assert(!("email" in p.mission_context));
 assert(p.ordered_skills.some(x=>x.skill_id==="create_ad_candidate"));
 console.log("BOOM workflow builder: PASS — templates compile to SHADOW plans, secrets/PII stripped, Owner Gate preserved");
})().catch(e=>{console.error(e);process.exit(1);});