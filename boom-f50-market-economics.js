(() => {
  "use strict";
  const VERSION="2026-09-19-f50-me2";
  const n=v=>Number.isFinite(Number(v))?Number(v):null;
  const clean=(v,max=600)=>String(v??"").replace(/\s+/g," ").trim().slice(0,max);

  function evaluate(candidate={}){
    const e=candidate.economics||{};
    const marketRows=(Array.isArray(candidate.market_evidence)?candidate.market_evidence:[]).filter(row=>row?.verified===true&&clean(row?.source_ref||row?.ref,1000));
    const economicsRefs=[...new Set((Array.isArray(e.evidence_refs)?e.evidence_refs:[]).map(x=>clean(x,1000)).filter(Boolean))];
    const revenue=n(e.revenue_per_unit);
    const variable=n(e.variable_cost_per_unit);
    const loss=n(e.expected_loss_per_unit)??0;
    const acquisition=n(e.acquisition_cost_per_unit)??0;
    const target=n(e.target_net_profit);
    const capacity=n(e.reachable_units_per_period);
    const blockers=[];
    if(e.inputs_verified!==true)blockers.push("economics_inputs_unverified");
    if(economicsRefs.length<2)blockers.push("economics_evidence_refs_insufficient");
    if(revenue===null||revenue<=0)blockers.push("unit_revenue_missing");
    if(variable===null||variable<0)blockers.push("variable_cost_missing");
    if(target===null||target<=0)blockers.push("target_profit_missing");
    if(capacity===null||capacity<=0)blockers.push("reachable_capacity_missing");
    if(marketRows.length<2)blockers.push("market_evidence_insufficient");
    let contribution=null,requiredUnits=null,theoreticalProfit=null;
    if(revenue!==null&&variable!==null){
      contribution=revenue-variable-loss-acquisition;
      if(!(contribution>0))blockers.push("non_positive_unit_contribution");
      if(contribution>0&&target!==null)requiredUnits=Math.ceil(target/contribution);
      if(contribution>0&&capacity!==null)theoreticalProfit=contribution*capacity;
    }
    if(requiredUnits!==null&&capacity!==null&&requiredUnits>capacity)blockers.push("target_exceeds_evidence_backed_capacity");
    const state=blockers.includes("non_positive_unit_contribution")||blockers.includes("target_exceeds_evidence_backed_capacity")?"KILL":blockers.length?"HOLD":"PASS";
    return Object.freeze({
      version:VERSION,state,
      economics_ready:state==="PASS",
      revenue_per_unit:revenue,
      variable_cost_per_unit:variable,
      expected_loss_per_unit:loss,
      acquisition_cost_per_unit:acquisition,
      contribution_per_unit:contribution,
      target_net_profit:target,
      required_units:requiredUnits,
      reachable_units_per_period:capacity,
      theoretical_profit_at_capacity:theoreticalProfit,
      market_evidence_count:marketRows.length,
      economics_evidence_count:economicsRefs.length,
      period:clean(e.period,80),
      route_is_theoretical:true,
      profit_guarantee:false,
      blockers:Object.freeze(blockers),
      execute_actions:false
    });
  }

  const api=Object.freeze({VERSION,evaluate});
  if(typeof window!=="undefined")window.BoomF50MarketEconomics=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();