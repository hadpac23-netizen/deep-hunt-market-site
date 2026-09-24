(() => {
  "use strict";

  const Truth=typeof module!=="undefined"&&module.exports
    ? require("./hunt-country-product-truth.js")
    : globalThis.HuntCountryProductTruth;

  const HOUR=60*60*1000;
  const clean=v=>String(v??"").trim();
  const isoMs=v=>{
    const t=v?new Date(v).getTime():NaN;
    return Number.isFinite(t)?t:null;
  };

  function deriveSnapshot(readiness={},index={},opts={}){
    const now=Number(opts.now||Date.now());
    const times=[
      isoMs(readiness.generated_at),
      isoMs(index.readiness_updated_at),
      isoMs(index.generated_at)
    ].filter(Number.isFinite);
    const freshest=times.length?Math.max(...times):null;
    const ageMs=freshest===null?Infinity:Math.max(0,now-freshest);
    const maxAgeMs=Number(opts.maxAgeMs||24*HOUR);
    const stale=ageMs>maxAgeMs;

    const readinessCounts=readiness.readiness&&typeof readiness.readiness==="object"
      ? {...readiness.readiness}
      : index.readiness&&typeof index.readiness==="object"
        ? {...index.readiness}
        : {};

    const providerCatalog=readiness.provider_catalog&&typeof readiness.provider_catalog==="object"
      ? {...readiness.provider_catalog}
      : {};

    const launch=index.priority_cj_verified&&typeof index.priority_cj_verified==="object"
      ? {
          total:Number(index.priority_cj_verified.total||0),
          policy:clean(index.priority_cj_verified.policy),
          shelves:{...(index.priority_cj_verified.shelves||{})}
        }
      : {total:0,policy:"",shelves:{}};

    const quoteVerified=Number(readiness.quote_verified?.count||0);
    const catalogTotal=Number(readiness.catalog_total||index.launch_unique_products||index.unique_quality_products||0);

    const blockers=[];
    if(!freshest)blockers.push("SNAPSHOT_TIMESTAMP_MISSING");
    if(stale)blockers.push("SNAPSHOT_STALE");
    if(!catalogTotal)blockers.push("CATALOG_COUNT_UNKNOWN");

    return Object.freeze({
      status:blockers.length?"PREP":"READY",
      live:false,
      stale,
      blockers:Object.freeze(blockers),
      generated_at:freshest?new Date(freshest).toISOString():null,
      age_hours:Number.isFinite(ageMs)?Number((ageMs/HOUR).toFixed(1)):null,
      catalog_total:catalogTotal,
      readiness:Object.freeze(readinessCounts),
      provider_catalog:Object.freeze(providerCatalog),
      quote_verified_count:quoteVerified,
      priority_verified:Object.freeze(launch),
      source:"catalog-readiness.json + catalog-index.json",
      truth_engine:"HuntCountryProductTruth"
    });
  }

  function evaluateProduct(input={},opts={}){
    if(!Truth||typeof Truth.evaluate!=="function"){
      return Object.freeze({
        eligible:false,
        truth_status:"BLOCKED",
        issues:Object.freeze(["TRUTH_ENGINE_UNAVAILABLE"])
      });
    }
    return Truth.evaluate(input,opts);
  }

  async function fetchJson(url){
    const res=await fetch(url,{cache:"no-store",credentials:"same-origin"});
    if(!res.ok)throw new Error("HTTP_"+res.status+"_"+url);
    return res.json();
  }

  async function loadSnapshot(opts={}){
    const base=clean(opts.baseUrl||"");
    const [readiness,index]=await Promise.all([
      fetchJson(base+"catalog-readiness.json"),
      fetchJson(base+"catalog-index.json")
    ]);
    return deriveSnapshot(readiness,index,opts);
  }

  async function initBrowser(){
    if(typeof window==="undefined")return null;
    try{
      const snapshot=await loadSnapshot();
      window.DRAGON_PRODUCT_TRUTH_STATE=snapshot;
      window.dispatchEvent(new CustomEvent("dragon:product-truth",{detail:snapshot}));
      return snapshot;
    }catch(error){
      const blocked=Object.freeze({
        status:"BLOCKED",
        live:false,
        stale:true,
        blockers:Object.freeze(["SNAPSHOT_LOAD_FAILED"]),
        error:String(error?.message||error),
        source:"catalog-readiness.json + catalog-index.json",
        truth_engine:"HuntCountryProductTruth"
      });
      window.DRAGON_PRODUCT_TRUTH_STATE=blocked;
      window.dispatchEvent(new CustomEvent("dragon:product-truth",{detail:blocked}));
      return blocked;
    }
  }

  const api=Object.freeze({deriveSnapshot,evaluateProduct,loadSnapshot,initBrowser});
  if(typeof window!=="undefined"){
    window.DragonProductTruth=api;
    if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>initBrowser());
    else initBrowser();
  }
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();