(() => {
  "use strict";

  const VERSION="2026-09-19-v1";
  const num=v=>Number.isFinite(Number(v))?Number(v):null;
  const upper=v=>String(v??"").trim().toUpperCase();
  const clean=(v,max=160)=>String(v??"").replace(/\s+/g," ").trim().slice(0,max);
  const uniq=arr=>[...new Set((Array.isArray(arr)?arr:[]).filter(Boolean))];

  function economics(e={}){
    const sale=num(e.sale_price_per_unit);
    const customerShipping=num(e.customer_shipping_amount)||0;
    const supplierCost=num(e.supplier_cost_per_unit);
    const supplierShipping=num(e.supplier_shipping_cost);
    const payment=num(e.payment_reserve);
    const refund=num(e.refund_reserve);
    const platform=num(e.platform_cost)||0;
    const contribution=num(e.contribution_before_coupon);
    const minContribution=num(e.min_required_contribution);
    const safeCac=num(e.max_safe_cac);
    const safeCoupon=num(e.max_safe_coupon_amount);

    const required=[sale,supplierCost,supplierShipping,payment,refund,contribution,minContribution,safeCac,safeCoupon];
    const verified=e.inputs_verified===true&&upper(e.profit_gate_status)==="PASS"&&required.every(v=>v!==null);
    const grossReceipts=sale===null?null:Number((sale+customerShipping).toFixed(6));
    const knownOutflows=[supplierCost,supplierShipping,payment,refund,platform].every(v=>v!==null)
      ? Number((supplierCost+supplierShipping+payment+refund+platform).toFixed(6))
      : null;
    const recomputed=grossReceipts!==null&&knownOutflows!==null?Number((grossReceipts-knownOutflows).toFixed(6)):null;
    const matches=contribution!==null&&recomputed!==null?Math.abs(contribution-recomputed)<=0.02:false;

    return Object.freeze({
      verified,
      profit_gate:upper(e.profit_gate_status)||"UNKNOWN",
      sale_price:sale,
      customer_shipping:customerShipping,
      supplier_cost:supplierCost,
      supplier_shipping:supplierShipping,
      payment_reserve:payment,
      refund_reserve:refund,
      platform_cost:platform,
      gross_receipts:grossReceipts,
      known_outflows:knownOutflows,
      contribution_before_acquisition:contribution,
      min_required_contribution:minContribution,
      max_safe_cac:safeCac,
      max_safe_coupon_amount:safeCoupon,
      contribution_math_matches:matches,
      known_leakage_coverage:Object.freeze([
        "supplier_cost","supplier_shipping","payment_reserve","refund_reserve","platform_cost"
      ]),
      unknown_leakage:Object.freeze([
        "creator_commission","affiliate_commission","chargeback_reserve","support_cost"
      ])
    });
  }

  function evaluate({passport={},econ={},feedInput=null,measurement={},performance={}}={}){
    const e=economics(econ);
    const truth=passport.truth||{};
    const externalReasons=[];
    const paidReasons=[];
    const scaleReasons=[];

    if(truth.safe_category===false)externalReasons.push("restricted_or_unsafe_category");
    if(truth.price?.verified!==true)externalReasons.push("verified_price_missing");
    if(truth.source_fresh!==true)externalReasons.push("source_freshness_not_verified");
    if(truth.availability?.exportable!==true)externalReasons.push("feed_safe_availability_missing");
    if(truth.merchant_identity_ready!==true)externalReasons.push("merchant_identity_not_ready");
    if(truth.shipping_policy_ready!==true)externalReasons.push("shipping_policy_not_ready");
    if(truth.returns_policy_ready!==true)externalReasons.push("returns_policy_not_ready");
    if(feedInput&&feedInput.export_ready!==true)externalReasons.push(...(feedInput.blockers||[]));

    if(!e.verified)paidReasons.push("verified_unit_economics_missing");
    if(e.verified&&e.contribution_math_matches!==true)paidReasons.push("economics_math_mismatch");
    if(e.verified&&!(Number(e.contribution_before_acquisition)>0))paidReasons.push("positive_contribution_missing");
    if(e.verified&&!(Number(e.max_safe_cac)>0))paidReasons.push("positive_safe_cac_missing");
    if(measurement.attribution_ready!==true)paidReasons.push("attribution_not_ready");
    if(measurement.server_event_id_persisted!==true)paidReasons.push("server_event_id_persistence_missing");
    if(measurement.owner_paid_approval!==true)paidReasons.push("owner_paid_approval_required");

    const conversions=num(performance.confirmed_conversions)||0;
    const actualCac=num(performance.actual_cac);
    const observedNet=num(performance.observed_net_contribution_after_acquisition);
    const refundRate=num(performance.refund_rate);
    const chargebackRate=num(performance.chargeback_rate);

    if(conversions<=0)scaleReasons.push("confirmed_conversion_sample_missing");
    if(actualCac===null)scaleReasons.push("actual_cac_missing");
    if(observedNet===null)scaleReasons.push("observed_net_contribution_missing");
    if(refundRate===null)scaleReasons.push("observed_refund_rate_missing");
    if(chargebackRate===null)scaleReasons.push("observed_chargeback_rate_missing");
    if(e.verified&&actualCac!==null&&actualCac>Number(e.max_safe_cac))scaleReasons.push("actual_cac_above_safe_cac");
    if(observedNet!==null&&observedNet<=0)scaleReasons.push("observed_net_contribution_not_positive");

    const externalUnique=uniq(externalReasons);
    const paidUnique=uniq([...externalUnique,...paidReasons]);
    const scaleUnique=uniq([...paidUnique,...scaleReasons]);

    const onsiteState=truth.safe_category===false?"STOP":"ACTIVE";
    const externalState=truth.safe_category===false
      ?"STOP"
      : externalUnique.length
        ?"HOLD"
        : passport.channels?.google_free_listings?.connected===true
          ?"PROMOTE_CANDIDATE"
          :"PREPARE";
    const paidState=paidUnique.length?"HOLD":"TEST_CANDIDATE";
    const scaleState=scaleUnique.length?"HOLD":"SCALE_CANDIDATE";

    return Object.freeze({
      product_key:clean(passport.product_key,220),
      onsite_state:onsiteState,
      external_state:externalState,
      paid_state:paidState,
      scale_state:scaleState,
      external_reasons:Object.freeze(externalUnique),
      paid_reasons:Object.freeze(paidUnique),
      scale_reasons:Object.freeze(scaleUnique),
      economics:e,
      kill_switch:Object.freeze({
        recommended:onsiteState==="STOP"||externalState==="STOP"||externalState==="HOLD",
        scope:onsiteState==="STOP"?"ALL":externalState==="STOP"?"EXTERNAL":"EXTERNAL_PROMOTION",
        execute:false,
        reason_codes:Object.freeze(externalUnique)
      }),
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  function summarize(rows=[]){
    const list=Array.isArray(rows)?rows.filter(Boolean):[];
    const countState=(field,state)=>list.filter(r=>r?.[field]===state).length;
    const reasons=new Map();
    for(const row of list){
      for(const reason of uniq([...(row.external_reasons||[]),...(row.paid_reasons||[]),...(row.scale_reasons||[])])){
        reasons.set(reason,(reasons.get(reason)||0)+1);
      }
    }
    const safeCacs=list.map(r=>r?.economics?.max_safe_cac).filter(v=>Number.isFinite(v));
    return Object.freeze({
      total:list.length,
      external:Object.freeze({
        promote_candidate:countState("external_state","PROMOTE_CANDIDATE"),
        prepare:countState("external_state","PREPARE"),
        hold:countState("external_state","HOLD"),
        stop:countState("external_state","STOP")
      }),
      paid:Object.freeze({
        test_candidate:countState("paid_state","TEST_CANDIDATE"),
        hold:countState("paid_state","HOLD")
      }),
      scale:Object.freeze({
        scale_candidate:countState("scale_state","SCALE_CANDIDATE"),
        hold:countState("scale_state","HOLD")
      }),
      verified_economics:list.filter(r=>r?.economics?.verified===true).length,
      safe_cac_range:safeCacs.length?Object.freeze({min:Math.min(...safeCacs),max:Math.max(...safeCacs)}):null,
      top_reasons:Object.freeze([...reasons.entries()].map(([reason,count])=>({reason,count})).sort((a,b)=>b.count-a.count||a.reason.localeCompare(b.reason))),
      execute_actions:false,
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  const api=Object.freeze({VERSION,economics,evaluate,summarize});
  if(typeof window!=="undefined")window.BoomProfitFeedControlTower=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();
