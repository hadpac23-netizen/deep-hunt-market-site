(() => {
  "use strict";

  const VERSION="2026-09-19-v1";
  const TYPES=new Set(["fixed_bundle","mix_match_bundle","complementary_addon","buy_more_save_more","threshold_reward","free_shipping_threshold","category_event","new_customer","repeat_customer","win_back"]);
  const n=v=>Number.isFinite(Number(v))?Number(v):null;
  const clean=(v,max=200)=>String(v??"").replace(/\s+/g," ").trim().slice(0,max);
  const uniq=a=>[...new Set((Array.isArray(a)?a:[]).filter(Boolean))];

  function economics(input={}){
    const fields=["revenue","landed_cost","shipping_subsidy","payment_fees","returns_allowance","affiliate_cost","discount_cost","tax_cost","margin_floor"];
    const values={}; const blockers=[];
    for(const key of fields){
      const v=n(input[key]);
      values[key]=v;
      if(v===null||v<0)blockers.push(key+"_missing");
    }
    if(blockers.length)return Object.freeze({ready:false,blockers:Object.freeze(blockers),contribution:null,margin_rate:null,passes_floor:false});
    const contribution=values.revenue-values.landed_cost-values.shipping_subsidy-values.payment_fees-values.returns_allowance-values.affiliate_cost-values.discount_cost-values.tax_cost;
    const marginRate=values.revenue>0?contribution/values.revenue:null;
    const passes=contribution>=values.margin_floor;
    return Object.freeze({
      ready:true,
      ...values,
      contribution:Number(contribution.toFixed(6)),
      margin_rate:marginRate===null?null:Number(marginRate.toFixed(6)),
      passes_floor:passes,
      blockers:Object.freeze(passes?[]:["margin_floor_failed"])
    });
  }

  function experiment(input={}){
    const blockers=[];
    for(const [key,max] of [["hypothesis",300],["audience",200],["control",200],["primary_metric",100],["margin_guardrail",160],["refund_guardrail",160],["stop_rule",240],["rollback",240]]){
      if(!clean(input[key],max))blockers.push(key+"_missing");
    }
    return Object.freeze({ready:blockers.length===0,blockers:Object.freeze(blockers)});
  }

  function audienceTruth(type,ctx={}){
    const blockers=[];
    if(type==="new_customer"&&ctx.new_customer_verified!==true)blockers.push("new_customer_status_not_verified");
    if(type==="repeat_customer"&&ctx.real_purchase_history_verified!==true)blockers.push("repeat_customer_history_not_verified");
    if(type==="win_back"){
      if(ctx.real_purchase_history_verified!==true)blockers.push("win_back_history_not_verified");
      if(ctx.real_inactivity_verified!==true)blockers.push("win_back_inactivity_not_verified");
    }
    return blockers;
  }

  function evaluate({promotion={},economics_input={},experiment_input={},context={}}={}){
    const blockers=[];
    const type=clean(promotion.type,60);
    if(!TYPES.has(type))blockers.push("promotion_type_invalid");
    if(context.availability_verified!==true)blockers.push("availability_not_verified");
    const starts=Date.parse(String(promotion.starts_at||""));
    const ends=Date.parse(String(promotion.ends_at||""));
    if(!Number.isFinite(starts))blockers.push("start_time_missing");
    if(!Number.isFinite(ends))blockers.push("end_time_missing");
    if(Number.isFinite(starts)&&Number.isFinite(ends)&&ends<=starts)blockers.push("promotion_window_invalid");
    if(promotion.countdown_resets===true)blockers.push("resetting_countdown_forbidden");
    if(promotion.fake_original_price===true)blockers.push("fabricated_original_price_forbidden");
    if(promotion.preselected_paid_extra===true)blockers.push("preselected_paid_extra_forbidden");
    if(context.final_price_clear!==true)blockers.push("final_price_clarity_missing");
    blockers.push(...audienceTruth(type,context));

    const econ=economics(economics_input);
    const exp=experiment(experiment_input);
    blockers.push(...econ.blockers,...exp.blockers);

    let state="HOLD";
    const nonOwner=uniq(blockers.filter(x=>x!=="owner_activation_required"));
    if(nonOwner.length===0&&econ.passes_floor)state="OWNER_REVIEW";
    else if(nonOwner.length<=4)state="PREPARE";

    return Object.freeze({
      state,
      type,
      economics:econ,
      experiment:exp,
      blockers:Object.freeze(uniq(blockers)),
      promotion_activate:false,
      external_publish:false,
      checkout_application:false,
      execute:false,
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  function summarize(rows=[]){
    const list=Array.isArray(rows)?rows:[];
    return Object.freeze({
      total:list.length,
      owner_review:list.filter(x=>x.state==="OWNER_REVIEW").length,
      prepare:list.filter(x=>x.state==="PREPARE").length,
      hold:list.filter(x=>x.state==="HOLD").length,
      activated:0,
      external_publish:false,
      checkout_application:false,
      execute_actions:false,
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  const api=Object.freeze({VERSION,TYPES,economics,experiment,evaluate,summarize});
  if(typeof window!=="undefined")window.HuntPromotionEngine=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();