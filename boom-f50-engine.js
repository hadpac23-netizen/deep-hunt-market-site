(() => {
  "use strict";

  const VERSION="2026-09-19-f50-engine2";
  const TOKEN="F50-DEEP-HUNT-CONTINUE";

  function req(name){
    if(typeof window!=="undefined")return window[name];
    const map={
      BoomF50EvidenceEngine:"./boom-f50-evidence-engine.js",
      BoomF50ResearchCore:"./boom-f50-research-core.js",
      BoomF50Funnel:"./boom-f50-funnel.js",
      BoomF50PriorArt:"./boom-f50-prior-art.js",
      BoomF50MarketEconomics:"./boom-f50-market-economics.js",
      BoomF50RedTeam:"./boom-f50-red-team.js",
      BoomF50Memory:"./boom-f50-memory.js",
      BoomF50MemoryAdapter:"./boom-f50-memory-adapter.js"
    };
    return require(map[name]);
  }
  function dependencies(){
    return {
      evidence:req("BoomF50EvidenceEngine"),
      core:req("BoomF50ResearchCore"),
      funnel:req("BoomF50Funnel"),
      priorArt:req("BoomF50PriorArt"),
      economics:req("BoomF50MarketEconomics"),
      redTeam:req("BoomF50RedTeam"),
      memory:req("BoomF50Memory"),
      memoryAdapter:req("BoomF50MemoryAdapter")
    };
  }
  function missingDeps(d){
    return [
      !d.evidence?.inspectCandidate&&"evidence",
      !d.core?.killOrKeep&&"core",
      !d.funnel?.run&&"funnel",
      !d.priorArt?.analyze&&"prior_art",
      !d.economics?.evaluate&&"economics",
      !d.redTeam?.attack&&"red_team",
      !d.memory?.inspect&&"memory"
    ].filter(Boolean);
  }

  function run(input={}){
    const token=String(input.token||"").trim();
    if(token!==TOKEN)return Object.freeze({version:VERSION,state:"HOLD",result:"ZERO",reason:"f50_protocol_token_required",winner:null,execute_actions:false,owner_gate:"REVIEW_REQUIRED"});
    const d=dependencies();
    const missing=missingDeps(d);
    if(missing.length)return Object.freeze({version:VERSION,state:"HOLD",result:"ZERO",reason:"f50_runtime_dependency_missing:"+missing.join(","),winner:null,execute_actions:false,owner_gate:"REVIEW_REQUIRED"});
    const engines={priorArt:d.priorArt,economics:d.economics,redTeam:d.redTeam,memory:d.memory};
    const research=d.funnel.run(input.candidates||[],d.core,d.evidence,engines,input.memory_rows||[]);
    return Object.freeze({
      version:VERSION,
      state:research.result==="WINNER"?"WINNER":"ZERO",
      result:research.result,
      reason:research.reason,
      winner:research.result==="WINNER"?research.winner:null,
      diagnostics:Object.freeze({
        input_count:research.input_count,
        generated_count:research.generated_count,
        stage_10_count:research.stage_10.length,
        stage_3_count:research.stage_3.length,
        survivor_count:research.survivor_count
      }),
      gates:Object.freeze({prior_art:true,market_economics:true,red_team:true,research_memory:true}),
      intermediate_candidates_exposed:false,
      paid_spend:false,external_publish:false,payment_activation:false,supplier_order:false,
      execute_actions:false,owner_gate:"REVIEW_REQUIRED"
    });
  }

  async function runWithMemory(input={},client){
    const d=dependencies();
    const candidates=Array.isArray(input.candidates)?input.candidates:[];
    const fps=candidates.map(c=>d.memory?.fingerprint?.(c)).filter(Boolean);
    const loaded=await d.memoryAdapter?.load?.(client,fps);
    if(!loaded?.ok)return Object.freeze({version:VERSION,state:"HOLD",result:"ZERO",reason:"f50_memory_load_failed",winner:null,execute_actions:false,owner_gate:"REVIEW_REQUIRED"});
    return run({...input,memory_rows:loaded.rows||[]});
  }

  const api=Object.freeze({VERSION,TOKEN,run,runWithMemory});
  if(typeof window!=="undefined")window.BoomF50Engine=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();