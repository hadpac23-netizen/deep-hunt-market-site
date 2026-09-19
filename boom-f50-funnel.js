(() => {
  "use strict";

  const VERSION="2026-09-19-f50-f1";
  const clean=(v,max=400)=>String(v??"").replace(/\s+/g," ").trim().slice(0,max);

  function generationSignal(c={}){
    let n=0;
    if(clean(c.hidden_problem||c.problem))n++;
    if(clean(c.mechanism))n++;
    if(clean(c.payer))n++;
    if(clean(c.economic_primitive))n++;
    if(Array.isArray(c.methods))n+=Math.min(20,new Set(c.methods).size)/20;
    return n;
  }

  function attackSignal(c={},inspection={}){
    let n=0;
    n+=Number(inspection.evidence?.usable_count||0)*2;
    n+=Number(inspection.evidence?.independent_count||0);
    if(clean(c.prior_art_conclusion))n+=3;
    if(clean(c.scale_math))n+=2;
    if(clean(c.moat))n+=2;
    if(Array.isArray(c.red_team))n+=Math.min(5,c.red_team.length);
    if(String(c.big_tech_copy_risk||"").toUpperCase()==="LOW")n+=3;
    if(c.mechanism_novelty===true)n+=3;
    return n;
  }

  function run(candidates=[],core,evidenceEngine){
    const input=(Array.isArray(candidates)?candidates:[]).slice(0,50);
    const generated=input
      .map(candidate=>({candidate,generation_signal:generationSignal(candidate)}))
      .filter(x=>x.generation_signal>=4)
      .sort((a,b)=>b.generation_signal-a.generation_signal||clean(a.candidate.id).localeCompare(clean(b.candidate.id)));
    const top10=generated.slice(0,10).map(x=>{
      const inspection=core?.inspect?core.inspect(x.candidate,evidenceEngine):{ready:false,blockers:["research_core_unavailable"],evidence:{}};
      return {...x,inspection,attack_signal:attackSignal(x.candidate,inspection)};
    }).sort((a,b)=>b.attack_signal-a.attack_signal||clean(a.candidate.id).localeCompare(clean(b.candidate.id)));

    const top3=top10.slice(0,3);
    const keeps=top3.filter(x=>core?.killOrKeep?.(x.candidate,evidenceEngine)?.decision==="KEEP");
    let state="ZERO";
    let winner=null;
    let reason="no_candidate_survived_all_f50_gates";
    if(keeps.length===1){
      state="WINNER";
      winner=keeps[0].candidate;
      reason="exactly_one_candidate_survived_all_f50_gates";
    }else if(keeps.length>1){
      state="ZERO";
      reason="multiple_survivors_require_more_attack";
    }

    return Object.freeze({
      version:VERSION,
      input_count:input.length,
      generated_count:generated.length,
      stage_10:Object.freeze(top10.map(x=>clean(x.candidate.id,120))),
      stage_3:Object.freeze(top3.map(x=>clean(x.candidate.id,120))),
      survivor_count:keeps.length,
      result:state,
      reason,
      winner:winner?Object.freeze({
        id:clean(winner.id,120),
        title:clean(winner.title,200),
        mechanism:clean(winner.mechanism,600),
        economic_primitive:clean(winner.economic_primitive,80),
        payer:clean(winner.payer,300)
      }):null,
      medium_ideas_exposed:false,
      execute_actions:false,
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  const api=Object.freeze({VERSION,generationSignal,attackSignal,run});
  if(typeof window!=="undefined")window.BoomF50Funnel=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();