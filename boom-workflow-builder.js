(() => {
  "use strict";
  if(window.BoomWorkflowBuilder?.version)return;
  const version="BOOM-WORKFLOW-BUILDER-V1";
  let skills=null,templates=null,contract=null,readyPromise=null;
  async function load(path){
    const r=await fetch(path,{cache:"no-store"});
    if(!r.ok)throw new Error(path+" unavailable");
    return r.json();
  }
  async function ready(){
    if(readyPromise)return readyPromise;
    readyPromise=Promise.all([
      load("boom-operational-skills.json"),
      load("boom-workflow-templates.json"),
      load("boom-workflow-builder-contract.json")
    ]).then(([s,t,c])=>{skills=s;templates=t;contract=c;return {version,mode:c.mode,skills:s.skills.length,templates:t.templates.length};});
    return readyPromise;
  }
  function cleanContext(input={}){
    const out={};
    for(const [k,v] of Object.entries(input||{})){
      if(/token|secret|password|credential|email|phone|address/i.test(k))continue;
      if(v===null||["string","number","boolean"].includes(typeof v))out[k]=v;
    }
    return out;
  }
  async function compile(templateId,{missionContext={},approvedOverrides={}}={}){
    await ready();
    const template=templates.templates.find(x=>x.id===String(templateId));
    if(!template)return {ok:false,reason:"TEMPLATE_NOT_FOUND"};
    const byId=new Map(skills.skills.map(x=>[x.id,x]));
    const ordered=[];
    for(const id of template.skills||[]){
      const skill=byId.get(id);
      if(!skill)return {ok:false,reason:"SKILL_NOT_FOUND",skill_id:id};
      ordered.push({
        skill_id:skill.id,
        owner:skill.owner,
        tools:[...(skill.tools||[])],
        material:skill.material===true,
        owner_gate:skill.owner_gate===true
      });
    }
    const material=template.material===true||ordered.some(x=>x.material);
    return {
      ok:true,
      dispatch:false,
      mode:"SHADOW",
      authority:"NONE",
      workflow_plan_id:"plan-"+String(template.id)+"-"+Date.now(),
      template_id:template.id,
      title:template.title,
      owner:template.owner,
      mission_context:cleanContext(missionContext),
      approved_overrides:cleanContext(approvedOverrides),
      ordered_skills:ordered,
      tool_dependencies:[...new Set(ordered.flatMap(x=>x.tools))],
      gates:material?["OWNER_GATE"]:[],
      final_action:template.final_action,
      material_action_suppressed:true
    };
  }
  window.BoomWorkflowBuilder={version,ready,compile};
})();