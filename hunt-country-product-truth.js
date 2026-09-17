(() => {
  "use strict";

  const Core=typeof module!=="undefined"&&module.exports
    ? require("./hunt-supplier-core.js")
    : globalThis.HuntSupplierCore;

  const clean=v=>String(v??"").trim();
  const num=v=>Number.isFinite(Number(v))?Number(v):null;
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,Number(v)||0));

  function countryCode(value){
    const code=clean(value).toUpperCase();
    return /^[A-Z]{2}$/.test(code)?code:null;
  }

  function normalizeTruth(input={}){
    return Object.freeze({
      provider:Core.providerKey(input.provider),
      item_id:clean(input.item_id||input.product_id),
      sku:clean(input.sku),
      variant_id:clean(input.variant_id),
      warehouse:clean(input.warehouse),
      destination_country:countryCode(input.destination_country||input.country),
      country_supported:input.country_supported!==false,
      stock:num(input.stock),
      stock_checked_at:input.stock_checked_at||null,
      supplier_cost:num(input.supplier_cost),
      shipping_method:clean(input.shipping_method),
      shipping_cost:num(input.shipping_cost),
      eta_min_days:num(input.eta_min_days),
      eta_max_days:num(input.eta_max_days),
      landed_cost:num(input.landed_cost),
      retail_price:num(input.retail_price),
      restrictions:Array.isArray(input.restrictions)?[...input.restrictions]:[],
      source_checked_at:input.source_checked_at||input.stock_checked_at||null,
      returns_state:clean(input.returns_state)
    });
  }
  function economics(row,{minContribution=1.5,minMarginRate=.12}={}){
    if(row.retail_price===null||row.landed_cost===null){
      return Object.freeze({known:false,positive:false,contribution:null,margin_rate:null});
    }
    const contribution=row.retail_price-row.landed_cost;
    const marginRate=row.retail_price>0?contribution/row.retail_price:null;
    const positive=contribution>=Number(minContribution||0)
      && marginRate!==null
      && marginRate>=Number(minMarginRate||0);
    return Object.freeze({
      known:true,
      positive,
      contribution:Number(contribution.toFixed(2)),
      margin_rate:Number(marginRate.toFixed(4))
    });
  }

  function evaluate(input={},opts={}){
    const row=normalizeTruth(input);
    const issues=[];

    if(row.provider==="unknown")issues.push("PROVIDER_UNKNOWN");
    if(!row.item_id)issues.push("ITEM_ID_MISSING");
    if(!row.sku&&!row.variant_id)issues.push("SKU_OR_VARIANT_MISSING");
    if(!row.destination_country)issues.push("DESTINATION_INVALID");
    if(!row.country_supported)issues.push("COUNTRY_UNAVAILABLE");
    if(row.stock===null)issues.push("STOCK_UNKNOWN");
    else if(row.stock<=0)issues.push("OUT_OF_STOCK");
    if(!row.shipping_method)issues.push("SHIPPING_METHOD_UNKNOWN");
    if(row.shipping_cost===null)issues.push("SHIPPING_COST_UNKNOWN");
    if(row.landed_cost===null)issues.push("LANDED_COST_UNKNOWN");
    if(row.restrictions.length)issues.push("RESTRICTED");

    const maxAgeMs=Number(opts.maxAgeMs||6*60*60*1000);
    if(Core.ageMs(row.source_checked_at,opts.now)>maxAgeMs)issues.push("SOURCE_STALE");

    const money=economics(row,opts);
    if(opts.requireEconomics!==false){
      if(!money.known)issues.push("ECONOMICS_UNKNOWN");
      else if(!money.positive)issues.push("ECONOMICS_FAIL");
    }
    const eligible=issues.length===0;
    const product=Core.canonicalProduct({
      ...input,
      provider:row.provider,
      item_id:row.item_id,
      sku:row.sku,
      variant_id:row.variant_id,
      warehouse:row.warehouse,
      destination_country:row.destination_country||"",
      stock:row.stock,
      stock_checked_at:row.stock_checked_at,
      supplier_cost:row.supplier_cost,
      shipping_method:row.shipping_method,
      shipping_cost:row.shipping_cost,
      eta_min_days:row.eta_min_days,
      eta_max_days:row.eta_max_days,
      landed_cost:row.landed_cost,
      restrictions:row.restrictions,
      returns_state:row.returns_state,
      margin_ratio:money.margin_rate,
      truth_status:eligible?"LIVE_VERIFIED":"RECHECK_REQUIRED",
      source_checked_at:row.source_checked_at
    });

    const candidate=Core.toDecisionCandidate(product,{
      ...opts.signals,
      now:opts.now,
      maxAgeMs,
      market_eligible:Boolean(row.destination_country&&row.country_supported&&!row.restrictions.length),
      safety_eligible:opts.safety_eligible!==false
    });

    return Object.freeze({
      eligible,
      truth_status:eligible?"LIVE_VERIFIED":"RECHECK_REQUIRED",
      issues:Object.freeze(issues),
      economics:money,
      product,
      candidate:Object.freeze({
        ...candidate,
        market_eligible:eligible?candidate.market_eligible:false,
        shipping_eligible:eligible?candidate.shipping_eligible:false,
        truth_status:eligible?"live_verified":"RECHECK_REQUIRED"
      })
    });
  }

  const api=Object.freeze({countryCode,normalizeTruth,economics,evaluate});
  if(typeof window!=="undefined")window.HuntCountryProductTruth=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();
