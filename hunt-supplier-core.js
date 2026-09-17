(() => {
  "use strict";

  const clean=v=>String(v??"").trim();
  const num=v=>Number.isFinite(Number(v))?Number(v):null;
  const iso=v=>{
    if(!v)return null;
    const d=new Date(v);
    return Number.isNaN(d.getTime())?null:d.toISOString();
  };

  function providerKey(value){
    const key=clean(value).toLowerCase().replace(/[^a-z0-9]+/g,"");
    if(key.includes("hypersku"))return "hypersku";
    if(key.includes("cj"))return "cjdropshipping";
    if(key.includes("eprolo"))return "eprolo";
    return key||"unknown";
  }

  function safeImages(value){
    const rows=Array.isArray(value)?value:[value];
    return rows.filter(Boolean).map(clean).filter(x=>/^https:\/\//i.test(x));
  }

  function canonicalProduct(input={}){
    const provider=providerKey(input.provider);
    return Object.freeze({
      provider,
      item_id:clean(input.item_id||input.product_id),
      supplier_product_id:clean(input.supplier_product_id||input.product_id||input.item_id),
      sku:clean(input.sku),
      variant_id:clean(input.variant_id),
      title:clean(input.title),
      category:clean(input.category),
      images:safeImages(input.images||input.image_url),
      attributes:input.attributes&&typeof input.attributes==="object"?{...input.attributes}:{},
      supplier_cost:num(input.supplier_cost),
      currency:clean(input.currency||"USD").toUpperCase(),
      stock:num(input.stock),
      stock_checked_at:iso(input.stock_checked_at),
      warehouse:clean(input.warehouse),
      destination_country:clean(input.destination_country).toUpperCase(),
      shipping_method:clean(input.shipping_method),
      shipping_cost:num(input.shipping_cost),
      eta_min_days:num(input.eta_min_days),
      eta_max_days:num(input.eta_max_days),
      landed_cost:num(input.landed_cost),
      restrictions:Array.isArray(input.restrictions)?[...input.restrictions]:[],
      returns_state:clean(input.returns_state),
      margin_ratio:num(input.margin_ratio),
      truth_status:clean(input.truth_status||"UNKNOWN").toUpperCase(),
      source_checked_at:iso(input.source_checked_at||input.stock_checked_at)
    });
  }

  function ageMs(timestamp,now=Date.now()){
    const t=timestamp?new Date(timestamp).getTime():NaN;
    return Number.isFinite(t)?Math.max(0,now-t):Infinity;
  }

  function validateProduct(product={},opts={}){
    const p=canonicalProduct(product);
    const issues=[];
    if(p.provider==="unknown")issues.push("PROVIDER_UNKNOWN");
    if(!p.item_id)issues.push("ITEM_ID_MISSING");
    if(!p.sku&&!p.variant_id)issues.push("SKU_OR_VARIANT_MISSING");
    if(!p.title)issues.push("TITLE_MISSING");
    if(!p.images.length)issues.push("IMAGE_MISSING");
    if(p.stock===null)issues.push("STOCK_UNKNOWN");
    if(p.supplier_cost===null)issues.push("SUPPLIER_COST_UNKNOWN");
    if(!p.destination_country)issues.push("DESTINATION_UNKNOWN");
    if(p.shipping_cost===null)issues.push("SHIPPING_UNKNOWN");
    if(p.landed_cost===null)issues.push("LANDED_COST_UNKNOWN");

    const maxAgeMs=Number(opts.maxAgeMs||6*60*60*1000);
    if(ageMs(p.source_checked_at,opts.now)>maxAgeMs)issues.push("SOURCE_STALE");
    if(p.stock!==null&&p.stock<=0)issues.push("OUT_OF_STOCK");
    if(p.restrictions.length)issues.push("RESTRICTED");

    return Object.freeze({
      valid:issues.length===0,
      issues:Object.freeze(issues),
      product:p
    });
  }

  function toDecisionCandidate(product={},signals={}){
    const check=validateProduct(product,{maxAgeMs:signals.maxAgeMs,now:signals.now});
    const p=check.product;
    return Object.freeze({
      product_key:p.provider+":"+p.item_id+":"+(p.variant_id||p.sku),
      provider:p.provider,
      supplier:p.provider,
      category:p.category,
      safety_eligible:signals.safety_eligible!==false,
      market_eligible:signals.market_eligible!==false && !p.restrictions.length,
      shipping_eligible:Boolean(p.destination_country&&p.shipping_method&&p.shipping_cost!==null),
      truth_status:check.valid?"verified":"RECHECK_REQUIRED",
      stock_available:p.stock!==null&&p.stock>0,
      image_verified:p.images.length>0,
      relevance:Number(signals.relevance||0),
      affinity:Number(signals.affinity||0),
      quality:Number(signals.quality||0),
      shipping_score:Number(signals.shipping_score||0),
      trust_score:Number(signals.trust_score||0),
      freshness:Number(signals.freshness||0),
      novelty:Number(signals.novelty||0),
      creative_performance:Number(signals.creative_performance||0),
      margin_ratio:p.margin_ratio===null?Number(signals.margin_ratio||0):p.margin_ratio,
      adapter_issues:check.issues
    });
  }

  const api=Object.freeze({providerKey,canonicalProduct,validateProduct,toDecisionCandidate,ageMs});
  if(typeof window!=="undefined")window.HuntSupplierCore=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();
