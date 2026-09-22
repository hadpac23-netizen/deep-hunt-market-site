const fs=require("fs"),assert=require("assert");
const json=p=>JSON.parse(fs.readFileSync(p,"utf8"));
const brains=json("boom-brain-registry.json");
const skills=json("boom-operational-skills.json");
const templates=json("boom-workflow-templates.json");
const router=json("boom-ai-tool-router.json");
const creative=json("boom-creative-factory-contract.json");
const repair=json("boom-build-repair-factory-contract.json");
const tools=json("boom-tool-registry.json");
const owners=new Set(brains.primary_brains.map(x=>x.id));
const skillIds=new Set(skills.skills.map(x=>x.id));

assert.equal(skills.skills.length,16);
assert.equal(templates.templates.length,16);
assert.equal(new Set(skills.skills.map(x=>x.id)).size,16);
assert.equal(new Set(templates.templates.map(x=>x.id)).size,16);

for(const s of skills.skills){
  assert(owners.has(s.owner),"unknown skill owner "+s.owner);
  if(s.material===true)assert.equal(s.owner_gate,true,"material skill must require Owner Gate: "+s.id);
  for(const tool of s.tools||[])assert(tools.runtime_tools.some(x=>x.id===tool),"unknown skill tool "+tool);
}
for(const t of templates.templates){
  assert(owners.has(t.owner),"unknown template owner "+t.owner);
  for(const id of t.skills||[])assert(skillIds.has(id),"unknown template skill "+id);
  if(t.material===true)assert(/owner/i.test(t.final_action),"material template must end at owner decision: "+t.id);
}
assert.equal(router.mode,"PLAN_ONLY");
assert.equal(router.authority,"NONE");
assert.equal(creative.mode,"SHADOW");
assert(creative.hard_rules.some(x=>/Owner Gate/i.test(x)));
assert.equal(repair.mode,"SHADOW");
assert(repair.hard_rules.some(x=>/Never patch Production directly/i.test(x)));
assert(tools.runtime_tools.some(x=>x.id==="workflow_builder"&&x.authority==="NONE"));
assert(tools.runtime_tools.some(x=>x.id==="ai_tool_router"&&x.authority==="NONE"));
console.log("BOOM AI operating factory: PASS — 16 skills, 16 templates, canonical owners, material Owner Gates, plan-only router");