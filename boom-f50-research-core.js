(() => {
  "use strict";

  const VERSION="2026-09-19-f50-r2";
  const METHODS=Object.freeze([
    "first_principles","hidden_problem_mining","extreme_users","weak_signals",
    "contradiction_hunting","invisible_resources","missing_markets","failed_futures",
    "technology_collisions","assumption_delete","mechanism_transfer","future_backcasting",
    "economic_primitive","network_effect","data_moat","big_tech_copy_test",
    "prior_art_attack","red_team","scale_mathematics","one_idea_rule"
  ]);
  const ECONOMIC_PRIMITIVES=new Set([
    "COST_SAVING","NEW_MARKET","RISK_REDUCTION","PRODUCTIVITY",
    "TRANSACTION_FEE","NEW_ASSET","INFRASTRUCTURE","MARGIN_EXPANSION"
  ]);
  const clean=(v,max=1200)=>String(v??"").replace(/\s+/g," ").trim().slice(0,max);

  function inspect(candidate={},evidenceEngine,engines={},memoryRows=[]){
    const blockers=[];
    const coverage=new Set((candidate.methods||[]).map(x=>clean(x,80).toLowerCase()));
    const missingMethods=METHODS.filter(x=>!coverage.has(x));
    const problem=clean(candidate.hidden_problem||candidate.problem,600);
    const mechanism=clean(candidate.mechanism,1000);
    const payer=clean(candidate.payer,300);
    const primitive=clean(candidate.economic_primitive,80).toUpperCase();
    const scale=clean(candidate.scale_math,1000);
    const novelty=clean(candidate.novelty_claim,1000);
    const moat=clean(candidate.moat,1000);
    const copyRisk=clean(candidate.big_tech_copy_risk,40).toUpperCase();

    if(!problem)blockers.push("hidden_problem_missing");
    if(!mechanism)blockers.push("mechanism_missing");
    if(!payer)blockers.push("payer_missing");
    if(!ECONOMIC_PRIMITIVES.has(primitive))blockers.push("economic_primitive_missing");
    if(!scale)blockers.push("scale_math_missing");
    if(!novelty)blockers.push("novelty_claim_missing");
    if(!moat)blockers.push("moat_missing");
    if(["HIGH","TRIVIAL_COPY","BUTTON_FEATURE"].includes(copyRisk))blockers.push("big_tech_copy_test_failed");
    if(missingMethods.length)blockers.push("method_coverage_incomplete");
    if(candidate.ordinary_category===true)blockers.push("ordinary_category_variation");
    if(candidate.legal_feasibility===false)blockers.push("legal_feasibility_failed");
    if(candidate.technical_feasibility===false)blockers.push("technical_feasibility_failed");
    if(candidate.economic_path_plausible===false)blockers.push("economics_failed");

    const evidence=evidenceEngine?.inspectCandidate
      ? evidenceEngine.inspectCandidate(candidate)
      : {evidence_ready:false,blockers:["evidence_engine_unavailable"],usable_count:0,independent_count:0};
    const priorArt=engines.priorArt?.analyze
      ? engines.priorArt.analyze(candidate)
      : {state:"HOLD",prior_art_ready:false,blockers:["prior_art_engine_unavailable"]};
    const economics=engines.economics?.evaluate
      ? engines.economics.evaluate(candidate)
      : {state:"HOLD",economics_ready:false,blockers:["economics_engine_unavailable"]};
    const redTeam=engines.redTeam?.attack
      ? engines.redTeam.attack(candidate)
      : {state:"HOLD",red_team_ready:false,blockers:["red_team_engine_unavailable"]};
    const memory=engines.memory?.inspect
      ? engines.memory.inspect(candidate,memoryRows)
      : {memory_ready:false,blockers:["memory_engine_unavailable"],memory_hit:false};

    if(evidence.evidence_ready!==true)blockers.push(...(evidence.blockers||[]));
    if(priorArt.prior_art_ready!==true)blockers.push(...(priorArt.blockers||["prior_art_not_ready"]));
    if(economics.economics_ready!==true)blockers.push(...(economics.blockers||["economics_not_ready"]));
    if(redTeam.red_team_ready!==true)blockers.push(...(redTeam.blockers||["red_team_not_ready"]));
    if(memory.memory_ready!==true)blockers.push(...(memory.blockers||["memory_not_ready"]));

    return Object.freeze({
      id:clean(candidate.id,120),
      title:clean(candidate.title,200),
      ready:blockers.length===0,
      blockers:Object.freeze([...new Set(blockers)]),
      missing_methods:Object.freeze(missingMethods),
      evidence,prior_art:priorArt,economics,red_team:redTeam,memory,
      execute_actions:false,
      external_publish:false,
      paid_spend:false,
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  function killOrKeep(candidate={},evidenceEngine,engines={},memoryRows=[]){
    const result=inspect(candidate,evidenceEngine,engines,memoryRows);
    return Object.freeze({
      ...result,
      decision:result.ready?"KEEP":"KILL",
      final_claim_allowed:result.ready===true
    });
  }

  const api=Object.freeze({VERSION,METHODS,ECONOMIC_PRIMITIVES,inspect,killOrKeep});
  if(typeof window!=="undefined")window.BoomF50ResearchCore=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();