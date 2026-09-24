(() => {
"use strict";
const DAY=86400000,HOUR=3600000;
const n=v=>Number.isFinite(Number(v))?Number(v):0;
const ms=v=>{const t=v?Date.parse(String(v)):NaN;return Number.isFinite(t)?t:null};
const ageHours=(v,now=Date.now())=>{const t=ms(v);return t===null?null:Math.max(0,(now-t)/HOUR)};
const latestActiveDay=rows=>{
  const keys=["unique_sessions","product_views","likes","saves","add_to_cart","checkout_starts"];
  return (Array.isArray(rows)?rows:[]).find(r=>keys.some(k=>n(r?.[k])>0))?.day||null;
};
const control=(rows,key)=>(Array.isArray(rows)?rows:[]).find(x=>x?.key===key)||null;

function normalize(raw={},opts={}){
  const now=Number(opts.now||Date.now());
  const observedAt=raw.observed_at||null;
  const observedAge=ageHours(observedAt,now);
  const observedFresh=observedAge!==null&&observedAge<=1;

  const p=raw.product_catalog||{};
  const productSourceAt=[p.latest_source_fresh,p.latest_stock_check,p.latest_updated]
    .map(ms).filter(Number.isFinite).sort((a,b)=>b-a)[0]||null;
  const productAge=productSourceAt===null?null:Math.max(0,(now-productSourceAt)/HOUR);
  const productStale=productAge===null||productAge>24;

  const journeyDay=latestActiveDay(raw.customer_journey_daily);
  const journeyAt=journeyDay?Date.parse(journeyDay+"T23:59:59Z"):null;
  const journeyAge=Number.isFinite(journeyAt)?Math.max(0,(now-journeyAt)/HOUR):null;
  const journeyStale=journeyAge===null||journeyAge>48;

  const paymentLive=control(raw.runtime_controls,"hunt_payment_live");
  const callbackPaid=control(raw.runtime_controls,"hunt_payplus_callback_accept_paid");
  const supplierLive=control(raw.runtime_controls,"hunt_supplier_live_order");

  const security=raw.security_advisor||{};
  const securityObservedAge=ageHours(security.observed_at,now);
  const securityObservedFresh=securityObservedAge!==null&&securityObservedAge<=24;

  const finance=raw.finance_summary||{},content=raw.content_summary||{},attrib=raw.attribution_summary||{};
  const coverage=[
    Boolean(raw.product_catalog),
    Array.isArray(raw.customer_journey_daily),
    Boolean(raw.finance_summary),
    Boolean(raw.content_summary),
    Array.isArray(raw.launch_gates),
    Boolean(raw.security_advisor),
    Array.isArray(raw.runtime_controls)
  ];
  const coverageRatio=coverage.filter(Boolean).length/coverage.length;

  return Object.freeze({
    schema:"DRAGON_EVIDENCE_REFRESH_V1",
    observed_at:observedAt,
    observation_age_hours:observedAge===null?null:Number(observedAge.toFixed(2)),
    observation_fresh:observedFresh,
    production_effect:false,
    source_data_mutated:false,
    mode:"SHADOW_ONLY",
    coverage_ratio:Number(coverageRatio.toFixed(3)),
    confidence_support:observedFresh?Math.round(12*coverageRatio):0,
    product:Object.freeze({
      rows:n(p.rows),availability_verified:n(p.availability_verified),in_stock:n(p.in_stock),
      market_eligible:n(p.market_eligible),source_latest_at:productSourceAt?new Date(productSourceAt).toISOString():null,
      source_age_hours:productAge===null?null:Number(productAge.toFixed(1)),source_stale:productStale
    }),
    journey:Object.freeze({
      latest_activity_day:journeyDay,
      source_age_hours:journeyAge===null?null:Number(journeyAge.toFixed(1)),source_stale:journeyStale
    }),
    safety:Object.freeze({
      payment_live_known:Boolean(paymentLive),
      payment_live_enabled:paymentLive?.enabled===true,
      callback_paid_known:Boolean(callbackPaid),
      callback_paid_enabled:callbackPaid?.enabled===true,
      supplier_live_order_known:Boolean(supplierLive),
      supplier_live_order_enabled:supplierLive?.enabled===true
    }),
    commerce:Object.freeze({
      confirmed_attributed_purchases:n(attrib.confirmed),
      finance_rows:n(finance.rows),
      real_finance_rows:n(finance.real_rows),
      profit_rows:n(finance.profit_rows),
      creative_drafts:n(content.creative_drafts),
      distribution_drafts:n(content.distribution_drafts),
      published_distribution:n(content.published)
    }),
    security:Object.freeze({
      observed_at:security.observed_at||null,
      observation_fresh:securityObservedFresh,
      warn_findings:n(security.warn_findings),
      info_findings:n(security.info_findings),
      status:n(security.warn_findings)>0?"PARTIAL":"PASS"
    }),
    launch_gates:Object.freeze(Array.isArray(raw.launch_gates)?raw.launch_gates.map(x=>Object.freeze({...x})):[]),
    notes:Object.freeze([
      "Observed-now freshness is separate from source-data freshness.",
      "Refreshing evidence does not make stale stock, journey or launch proof fresh.",
      "No source row is mutated by this adapter."
    ])
  });
}

async function loadBranchSnapshot(){
  const res=await fetch("dragon-shadow-evidence-snapshot.json",{cache:"no-store"});
  if(!res.ok)throw new Error("EVIDENCE_SNAPSHOT_HTTP_"+res.status);
  return normalize(await res.json());
}

async function initBrowser(){
  if(typeof window==="undefined")return null;
  try{
    const state=await loadBranchSnapshot();
    window.DRAGON_EVIDENCE_REFRESH_STATE=state;
    window.dispatchEvent(new CustomEvent("dragon:evidence-refresh",{detail:state}));
    return state;
  }catch(error){
    const blocked=Object.freeze({
      schema:"DRAGON_EVIDENCE_REFRESH_V1",mode:"SHADOW_ONLY",observation_fresh:false,
      confidence_support:0,coverage_ratio:0,production_effect:false,source_data_mutated:false,
      error:String(error?.message||error),notes:Object.freeze(["Evidence refresh snapshot unavailable."])
    });
    window.DRAGON_EVIDENCE_REFRESH_STATE=blocked;
    window.dispatchEvent(new CustomEvent("dragon:evidence-refresh",{detail:blocked}));
    return blocked;
  }
}

const api=Object.freeze({normalize,loadBranchSnapshot,initBrowser,latestActiveDay});
if(typeof window!=="undefined"){
  window.DragonEvidenceRefresh=api;
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(initBrowser,180));
  else setTimeout(initBrowser,180);
}
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();