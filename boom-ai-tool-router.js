(() => {
  "use strict";
  if(window.BoomAIToolRouter?.version)return;
  const version="BOOM-AI-TOOL-ROUTER-V1";
  let policy=null,tools=null,readyPromise=null;
  async function load(path){
    const r=await fetch(path,{cache:"no-store"});
    if(!r.ok)throw new Error(path+" unavailable");
    return r.json();
  }
  async function ready(){
    if(readyPromise)return readyPromise;
    readyPromise=Promise.all([load("boom-ai-tool-router.json"),load("boom-tool-registry.json")])
      .then(([p,t])=>{policy=p;tools=t;return {version,mode:p.mode,authority:p.authority,tool_count:t.runtime_tools.length};});
    return readyPromise;
  }
  function normalizeScore(v){const n=Number(v);return Number.isFinite(n)?Math.max(0,Math.min(1,n)):0;}
  async function plan(task,candidates=[]){
    await ready();
    const route=policy.routes.find(x=>x.task===String(task));
    if(!route)return {ok:false,reason:"TASK_NOT_ROUTABLE"};
    const registry=new Map((tools.runtime_tools||[]).map(x=>[x.id,x]));
    const dims=Object.fromEntries((policy.dimensions||[]).map(x=>[x.id,Number(x.weight)||0]));
    const eligible=[];
    for(const c of Array.isArray(candidates)?candidates:[]){
      const tool=registry.get(c.tool_id);
      if(!tool||tool.authority!=="NONE")continue;
      if(/NOT_DEPLOYED|NOT_CONNECTED/.test(String(tool.status||""))&&c.require_active===true)continue;
      const score=
        normalizeScore(c.quality)*dims.quality+
        normalizeScore(c.cost)*dims.cost+
        normalizeScore(c.speed)*dims.speed+
        normalizeScore(c.privacy)*dims.privacy+
        normalizeScore(c.readiness)*dims.readiness;
      eligible.push({tool_id:c.tool_id,status:tool.status,score:Number(score.toFixed(4))});
    }
    eligible.sort((a,b)=>b.score-a.score||a.tool_id.localeCompare(b.tool_id));
    return {
      ok:true,
      dispatch:false,
      authority:"NONE",
      task:String(task),
      preferred_classes:route.preferred_classes,
      selected:eligible[0]||null,
      ranked:eligible,
      fallback:eligible.length?null:route.fallback
    };
  }
  window.BoomAIToolRouter={version,ready,plan};
})();