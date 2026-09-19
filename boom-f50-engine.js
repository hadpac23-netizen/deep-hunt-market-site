(() => {
  "use strict";

  const VERSION="2026-09-19-f50-engine1";
  const TOKEN="F50-DEEP-HUNT-CONTINUE";

  function dependencies(){
    const evidence=typeof window!=="undefined"?window.BoomF50EvidenceEngine:require("./boom-f50-evidence-engine.js");
    const core=typeof window!=="undefined"?window.BoomF50ResearchCore:require("./boom-f50-research-core.js");
    const funnel=typeof window!=="undefined"?window.BoomF50Funnel:require("./boom-f50-funnel.js");
    return {evidence,core,funnel};
  }

  function run(input={}){
    const token=String(input.token||"").trim();
    if(token!==TOKEN){
      return Object.freeze({
        version:VERSION,state:"HOLD",result:"ZERO",
        reason:"f50_protocol_token_required",
        winner:null,execute_actions:false,owner_gate:"REVIEW_REQUIRED"
      });
    }
    const {evidence,core,funnel}=dependencies();
    if(!evidence?.inspectCandidate||!core?.killOrKeep||!funnel?.run){
      return Object.freeze({
        version:VERSION,state:"HOLD",result:"ZERO",
        reason:"f50_runtime_dependency_missing",
        winner:null,execute_actions:false,owner_gate:"REVIEW_REQUIRED"
      });
    }
    const research=funnel.run(input.candidates||[],core,evidence);
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
      intermediate_candidates_exposed:false,
      paid_spend:false,
      external_publish:false,
      payment_activation:false,
      supplier_order:false,
      execute_actions:false,
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  const api=Object.freeze({VERSION,TOKEN,run});
  if(typeof window!=="undefined")window.BoomF50Engine=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();