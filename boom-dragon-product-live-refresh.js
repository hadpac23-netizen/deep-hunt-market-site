(() => {
  "use strict";

  const BASE="https://zszlnahjqmwozwubetkm.supabase.co/functions/v1";
  const KEY="sb_publishable_SCGT8rsQsVrAt5CtlKVMzA_wGjT2I6X";
  const clean=v=>String(v??"").trim();
  const n=v=>Number.isFinite(Number(v))?Number(v):0;

  function summarize(payload={},opts={}){
    const products=Array.isArray(payload.products)?payload.products:[];
    const generatedAt=payload.generated_at||null;
    const now=Number(opts.now||Date.now());
    const t=generatedAt?Date.parse(generatedAt):NaN;
    const ageMinutes=Number.isFinite(t)?Math.max(0,(now-t)/60000):null;
    const providers={};
    let priced=0,images=0,safe=0;
    for(const p of products){
      const provider=clean(p?.provider)||"UNKNOWN";
      providers[provider]=(providers[provider]||0)+1;
      if(Number.isFinite(Number(p?.supplier_cost))&&Number(p.supplier_cost)>0)priced++;
      if(/^https:\/\//i.test(clean(p?.image_url)))images++;
      if(clean(p?.item_id)&&clean(p?.title))safe++;
    }
    const pageRows=(Array.isArray(payload.pages)?payload.pages:[]).reduce((a,x)=>a+n(x?.rows),0);
    const pageKept=(Array.isArray(payload.pages)?payload.pages:[]).reduce((a,x)=>a+n(x?.kept),0);

    return Object.freeze({
      status:payload.production_effect===false&&products.length>0?"DISCOVERY_FRESH":"PREP",
      generated_at:generatedAt,
      age_minutes:ageMinutes===null?null:Number(ageMinutes.toFixed(1)),
      production_effect:payload.production_effect===true,
      source_data_mutated:false,
      source:"CJ_OFFICIAL_PRODUCT_LIST_SHADOW",
      products_seen:products.length,
      source_rows_seen:pageRows,
      safe_products_kept:pageKept||safe,
      priced_products:priced,
      image_products:images,
      providers:Object.freeze(providers),
      discovery_fresh:products.length>0&&payload.production_effect===false,
      detail_truth_ready:false,
      detail_requirements:Object.freeze([
        "VARIANT_ID",
        "VARIANT_STOCK",
        "DESTINATION_SHIPPING",
        "LANDED_COST",
        "PROFIT_GATE",
        "FRESH_DETAIL_QUOTE"
      ]),
      decision_effect:"DISCOVERY_ONLY",
      notes:Object.freeze([
        "CJ official Product List confirms current discovery/catalog visibility only.",
        "It does not prove destination stock, variant stock, shipping or landed cost.",
        "Do not upgrade a product to LIVE_VERIFIED from this signal."
      ])
    });
  }

  async function refresh(opts={}){
    const startPage=Math.max(1,Math.min(10000,Number(opts.start_page||1)));
    const pageCount=Math.max(1,Math.min(5,Number(opts.page_count||1)));
    const url=BASE+"/hunt-cj-shadow-export?start_page="+startPage+"&page_count="+pageCount;
    const res=await fetch(url,{
      method:"GET",
      cache:"no-store",
      headers:{apikey:KEY,Accept:"application/json"}
    });
    const raw=await res.text();
    let data={};
    try{data=raw?JSON.parse(raw):{}}catch{data={error:raw||("HTTP_"+res.status)}}
    if(!res.ok)throw new Error(data?.error||("CJ_SHADOW_HTTP_"+res.status));
    return summarize(data);
  }

  async function runBrowser(opts={}){
    if(typeof window==="undefined")return null;
    const startedAt=new Date().toISOString();
    window.DRAGON_PRODUCT_LIVE_REFRESH_STATE=Object.freeze({
      status:"REFRESHING",started_at:startedAt,production_effect:false,source_data_mutated:false
    });
    window.dispatchEvent(new CustomEvent("dragon:product-live-refresh",{detail:window.DRAGON_PRODUCT_LIVE_REFRESH_STATE}));
    try{
      const result=await refresh(opts);
      window.DRAGON_PRODUCT_LIVE_REFRESH_STATE=result;
      try{sessionStorage.setItem("dragon_product_live_refresh_v1",JSON.stringify(result));}catch{}
      window.dispatchEvent(new CustomEvent("dragon:product-live-refresh",{detail:result}));
      return result;
    }catch(error){
      const blocked=Object.freeze({
        status:"BLOCKED",
        error:String(error?.message||error),
        production_effect:false,
        source_data_mutated:false,
        discovery_fresh:false,
        detail_truth_ready:false,
        source:"CJ_OFFICIAL_PRODUCT_LIST_SHADOW"
      });
      window.DRAGON_PRODUCT_LIVE_REFRESH_STATE=blocked;
      window.dispatchEvent(new CustomEvent("dragon:product-live-refresh",{detail:blocked}));
      return blocked;
    }
  }

  function readCached(){
    if(typeof sessionStorage==="undefined")return null;
    try{return JSON.parse(sessionStorage.getItem("dragon_product_live_refresh_v1")||"null")}catch{return null}
  }

  const api=Object.freeze({summarize,refresh,runBrowser,readCached});
  if(typeof window!=="undefined"){
    window.DragonProductLiveRefresh=api;
    const cached=readCached();
    if(cached){
      window.DRAGON_PRODUCT_LIVE_REFRESH_STATE=cached;
      setTimeout(()=>window.dispatchEvent(new CustomEvent("dragon:product-live-refresh",{detail:cached})),20);
    }
  }
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();