(() => {
  "use strict";

  const VERSION="2026-09-19-v1";
  const clean=(v,max=180)=>String(v??"").replace(/\s+/g," ").trim().slice(0,max);
  const num=v=>{
    if(v===null||v===undefined||v==="")return null;
    return Number.isFinite(Number(v))?Number(v):null;
  };
  const upper=v=>clean(v,60).toUpperCase();
  const uniq=arr=>[...new Set((Array.isArray(arr)?arr:[]).filter(Boolean))];

  function rights(input={},context={}){
    const blockers=[];
    const now=Number.isFinite(Number(context.now_ms))?Number(context.now_ms):Date.now();
    const expires=Date.parse(String(input.expires_at||""));
    const channels=uniq(input.allowed_channels||[]).map(x=>clean(x,60).toLowerCase());
    const countries=uniq(input.allowed_countries||[]).map(x=>upper(x));
    const targetChannel=clean(context.channel,60).toLowerCase();
    const targetCountry=upper(context.country);

    if(input.usage_rights_verified!==true)blockers.push("usage_rights_not_verified");
    if(input.content_asset_verified!==true)blockers.push("content_asset_not_verified");
    if(!Number.isFinite(expires))blockers.push("rights_expiry_missing");
    else if(expires<=now)blockers.push("rights_expired");
    if(targetChannel&& !channels.includes(targetChannel))blockers.push("channel_not_licensed");
    if(targetCountry&& !countries.includes(targetCountry)&&!countries.includes("GLOBAL"))blockers.push("country_not_licensed");
    if(context.paid_media===true&&input.paid_media_allowed!==true)blockers.push("paid_media_rights_missing");
    if(context.remix_required===true&&input.edit_remix_allowed!==true)blockers.push("edit_remix_rights_missing");

    return Object.freeze({
      verified:blockers.length===0,
      blockers:Object.freeze(uniq(blockers)),
      allowed_channels:Object.freeze(channels),
      allowed_countries:Object.freeze(countries),
      paid_media_allowed:input.paid_media_allowed===true,
      edit_remix_allowed:input.edit_remix_allowed===true,
      expires_at:Number.isFinite(expires)?new Date(expires).toISOString():null
    });
  }

  function economics(input={}){
    const revenue=num(input.confirmed_revenue)||0;
    const productContribution=num(input.product_contribution_before_creator_costs);
    const commission=num(input.creator_commission_amount);
    const affiliate=num(input.affiliate_commission_amount);
    const coupon=num(input.coupon_cost);
    const platform=num(input.platform_fee);
    const contentFee=num(input.content_fee);
    const refundReserve=num(input.refund_reserve);
    const chargebackReserve=num(input.chargeback_reserve);
    const supportCost=num(input.support_cost);

    const required=[
      productContribution,commission,affiliate,coupon,platform,contentFee,refundReserve,chargebackReserve,supportCost
    ];
    const verified=input.inputs_verified===true&&required.every(v=>v!==null);
    const creatorCosts=required.every(v=>v!==null)
      ? Number((commission+affiliate+coupon+platform+contentFee+refundReserve+chargebackReserve+supportCost).toFixed(6))
      : null;
    const net=verified
      ? Number((productContribution-creatorCosts).toFixed(6))
      : null;

    return Object.freeze({
      verified,
      confirmed_revenue:revenue,
      product_contribution_before_creator_costs:productContribution,
      creator_commission_amount:commission,
      affiliate_commission_amount:affiliate,
      coupon_cost:coupon,
      platform_fee:platform,
      content_fee:contentFee,
      refund_reserve:refundReserve,
      chargeback_reserve:chargebackReserve,
      support_cost:supportCost,
      total_creator_cost:creatorCosts,
      net_contribution_after_creator_costs:net
    });
  }

  function attribution(input={}){
    const confirmedConversions=Math.max(0,Number(input.confirmed_conversions)||0);
    const blockers=[];
    if(!clean(input.attribution_key,180))blockers.push("creator_attribution_key_missing");
    if(input.event_id_persistence_ready!==true)blockers.push("event_id_persistence_missing");
    if(input.confirmed_conversion_source_ready!==true)blockers.push("confirmed_conversion_source_missing");
    if(input.click_or_referral_identity_ready!==true)blockers.push("referral_identity_missing");

    return Object.freeze({
      ready:blockers.length===0,
      blockers:Object.freeze(blockers),
      attribution_key:clean(input.attribution_key,180),
      confirmed_conversions:confirmedConversions,
      confirmed_sales_only:true
    });
  }

  function evaluate({creator={},passport={},rights_input={},economics_input={},attribution_input={},context={},performance={}}={}){
    const blockers=[];
    const r=rights(rights_input,context);
    const e=economics(economics_input);
    const a=attribution(attribution_input);

    if(!clean(creator.creator_id,120))blockers.push("creator_identity_missing");
    if(!clean(creator.platform,60))blockers.push("creator_platform_missing");
    if(passport?.truth?.safe_category===false)blockers.push("restricted_or_unsafe_category");
    if(passport?.creative_inputs?.no_claim_generation!==true)blockers.push("product_truth_creative_contract_missing");
    if(context.claim_firewall_pass!==true)blockers.push("claim_firewall_not_passed");
    blockers.push(...r.blockers);

    const rightsReady=blockers.length===0;
    const economicsBlockers=[];
    if(!e.verified)economicsBlockers.push("creator_economics_not_verified");
    if(e.verified&&!(Number(e.net_contribution_after_creator_costs)>0))economicsBlockers.push("creator_net_contribution_not_positive");

    const attributionBlockers=[...a.blockers];

    const confirmedConversions=a.confirmed_conversions;
    const observedNet=num(performance.observed_net_contribution_after_creator_costs);
    const observedRefundRate=num(performance.refund_rate);
    const observedChargebackRate=num(performance.chargeback_rate);
    const scaleBlockers=[];
    if(confirmedConversions<Number(context.min_scale_conversions||20))scaleBlockers.push("confirmed_conversion_sample_too_small");
    if(observedNet===null)scaleBlockers.push("observed_creator_net_contribution_missing");
    else if(observedNet<=0)scaleBlockers.push("observed_creator_net_contribution_not_positive");
    if(observedRefundRate===null)scaleBlockers.push("observed_refund_rate_missing");
    if(observedChargebackRate===null)scaleBlockers.push("observed_chargeback_rate_missing");

    let state="DRAFT";
    if(!rightsReady)state="RIGHTS_HOLD";
    else if(economicsBlockers.length)state="ECONOMICS_HOLD";
    else if(attributionBlockers.length)state="ATTRIBUTION_HOLD";
    else if(context.owner_approved!==true)state="OWNER_HOLD";
    else if(scaleBlockers.length)state="TEST_CANDIDATE";
    else state="SCALE_CANDIDATE";

    return Object.freeze({
      creator_id:clean(creator.creator_id,120),
      platform:clean(creator.platform,60).toLowerCase(),
      state,
      rights:r,
      economics:e,
      attribution:a,
      blockers:Object.freeze(uniq([...blockers,...economicsBlockers,...attributionBlockers])),
      scale_blockers:Object.freeze(scaleBlockers),
      performance_claims_allowed:a.ready&&confirmedConversions>0,
      commission_claims_allowed:a.ready&&confirmedConversions>0,
      publish:false,
      payout:false,
      execute:false,
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  function systemReadiness(config={}){
    const blockers=[];
    if(config.creator_registry_ready!==true)blockers.push("creator_registry_missing");
    if(config.rights_ledger_ready!==true)blockers.push("creator_rights_ledger_missing");
    if(config.attribution_registry_ready!==true)blockers.push("creator_attribution_registry_missing");
    if(config.economics_ledger_ready!==true)blockers.push("creator_economics_ledger_missing");
    if(config.claim_firewall_ready!==true)blockers.push("claim_firewall_not_ready");
    if(config.event_id_persistence_ready!==true)blockers.push("event_id_persistence_missing");
    if(config.confirmed_conversion_source_ready!==true)blockers.push("confirmed_creator_conversion_source_missing");
    return Object.freeze({
      state:blockers.length?"HOLD":"PREPARE",
      blockers:Object.freeze(blockers),
      creator_registry_count:Math.max(0,Number(config.creator_registry_count)||0),
      rights_verified_count:Math.max(0,Number(config.rights_verified_count)||0),
      confirmed_creator_conversions:Math.max(0,Number(config.confirmed_creator_conversions)||0),
      publish_actions:0,
      payouts:0,
      execute_actions:false,
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  function summarize(rows=[]){
    const list=Array.isArray(rows)?rows.filter(Boolean):[];
    const states={};
    for(const row of list)states[row.state]=(states[row.state]||0)+1;
    const blockers=new Map();
    for(const row of list){
      for(const blocker of uniq([...(row.blockers||[]),...(row.scale_blockers||[])])){
        blockers.set(blocker,(blockers.get(blocker)||0)+1);
      }
    }
    return Object.freeze({
      total:list.length,
      states:Object.freeze(states),
      rights_ready:list.filter(x=>x.rights?.verified===true).length,
      economics_ready:list.filter(x=>x.economics?.verified===true).length,
      attribution_ready:list.filter(x=>x.attribution?.ready===true).length,
      confirmed_conversions:list.reduce((sum,x)=>sum+Number(x.attribution?.confirmed_conversions||0),0),
      top_blockers:Object.freeze([...blockers.entries()].map(([blocker,count])=>({blocker,count})).sort((a,b)=>b.count-a.count||a.blocker.localeCompare(b.blocker))),
      publish_actions:0,
      payouts:0,
      execute_actions:false,
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  const api=Object.freeze({VERSION,rights,economics,attribution,evaluate,systemReadiness,summarize});
  if(typeof window!=="undefined")window.BoomCreatorOS=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();
