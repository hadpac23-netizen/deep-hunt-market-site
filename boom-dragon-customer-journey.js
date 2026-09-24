(() => {
  "use strict";

  const BASE="https://zszlnahjqmwozwubetkm.supabase.co/functions/v1";
  const clean=v=>String(v??"").trim();
  const n=v=>Number.isFinite(Number(v))?Number(v):0;
  const dayMs=86400000;

  function latestActiveDay(rows=[]){
    const keys=["unique_sessions","product_views","likes","saves","add_to_cart","checkout_starts","checkout_market_selections"];
    return rows.find(row=>keys.some(k=>n(row?.[k])>0))?.day||null;
  }

  function staleFrom(day,now=Date.now()){
    if(!day)return true;
    const t=Date.parse(String(day)+"T23:59:59Z");
    return !Number.isFinite(t)||now-t>2*dayMs;
  }

  function normalizeFull(data={},opts={}){
    const stages=data.stages||{};
    const truth=data.purchase_truth||{};
    const latest=data.freshness?.latest_activity_day||null;
    return Object.freeze({
      status:staleFrom(latest,opts.now)?"STALE":"READY",
      source:clean(data.source||"hunt-customer-journey-snapshot"),
      mode:"SERVER_TRUTH",
      generated_at:data.generated_at||null,
      window_days:Number(data.window_days||7),
      latest_activity_day:latest,
      stale:staleFrom(latest,opts.now),
      stages:Object.freeze({
        sessions:n(stages.sessions),
        views:n(stages.product_views),
        engagement:n(stages.engagement),
        saves:n(stages.saves),
        likes:n(stages.likes),
        cart:n(stages.cart),
        checkout:n(stages.checkout),
        buyer:n(stages.buyer),
        repeat:n(stages.repeat)
      }),
      purchase_truth:Object.freeze({
        buyer_ready:true,
        confirmed_orders:n(truth.confirmed_orders),
        confirmed_buyers:n(truth.confirmed_buyers),
        repeat_buyers:n(truth.repeat_buyers),
        real_order_value:n(truth.real_order_value),
        test_orders_excluded:n(truth.test_orders_excluded),
        legacy_metric_orders:n(truth.legacy_metric_orders),
        test_contamination_detected:truth.test_contamination_detected===true,
        confirmation_rule:clean(truth.confirmation_rule)
      }),
      notes:Object.freeze(Array.isArray(data.notes)?[...data.notes]:[])
    });
  }

  function normalizeMission(data={},opts={}){
    const history=Array.isArray(data?.snapshot?.history)?data.snapshot.history:[];
    const rows=history.slice(0,Number(opts.days||7));
    const sum=key=>rows.reduce((total,row)=>total+n(row?.[key]),0);
    const latest=latestActiveDay(rows);
    return Object.freeze({
      status:staleFrom(latest,opts.now)?"STALE":"PREP",
      source:"hunt-owner-mission-control fallback",
      mode:"PREPURCHASE_LIVE_BUYER_PREP",
      generated_at:data.generated_at||null,
      window_days:Number(opts.days||7),
      latest_activity_day:latest,
      stale:staleFrom(latest,opts.now),
      stages:Object.freeze({
        sessions:sum("unique_sessions"),
        views:sum("product_views"),
        engagement:sum("likes")+sum("saves"),
        saves:sum("saves"),
        likes:sum("likes"),
        cart:sum("add_to_cart"),
        checkout:sum("checkout_starts"),
        buyer:null,
        repeat:null
      }),
      purchase_truth:Object.freeze({
        buyer_ready:false,
        confirmed_orders:null,
        confirmed_buyers:null,
        repeat_buyers:null,
        real_order_value:null,
        test_orders_excluded:null,
        legacy_metric_orders:sum("orders"),
        test_contamination_detected:null,
        confirmation_rule:"SERVER SNAPSHOT NOT DEPLOYED"
      }),
      notes:Object.freeze([
        "View/Save/Cart/Checkout come from live owner metrics.",
        "Buyer/Repeat remain unavailable until server purchase-truth snapshot is deployed.",
        "Legacy order counts are not used as Buyer truth."
      ])
    });
  }

  async function token(){
    const client=window.BOOM_SUPABASE_CLIENT;
    if(!client?.auth?.getSession)return null;
    try{
      const {data:{session}}=await client.auth.getSession();
      return session?.access_token||null;
    }catch{return null;}
  }

  async function get(path,accessToken){
    const res=await fetch(BASE+path,{
      method:"GET",
      cache:"no-store",
      headers:{
        apikey:window.HuntCore?.publishableKey||"sb_publishable_SCGT8rsQsVrAt5CtlKVMzA_wGjT2I6X",
        ...(accessToken?{Authorization:"Bearer "+accessToken}:{})
      }
    });
    const raw=await res.text();
    let data={};
    try{data=raw?JSON.parse(raw):{}}catch{data={error:raw||("HTTP "+res.status)}}
    if(!res.ok){
      const error=new Error(data?.error||("HTTP "+res.status));
      error.status=res.status;
      throw error;
    }
    return data;
  }

  async function load(opts={}){
    const days=Math.max(1,Math.min(30,Number(opts.days||7)));
    const accessToken=await token();
    if(!accessToken){
      return Object.freeze({
        status:"BLOCKED",source:"auth",mode:"AUTH_REQUIRED",stale:true,
        latest_activity_day:null,window_days:days,
        stages:Object.freeze({sessions:null,views:null,engagement:null,saves:null,likes:null,cart:null,checkout:null,buyer:null,repeat:null}),
        purchase_truth:Object.freeze({buyer_ready:false}),
        notes:Object.freeze(["Admin session required for Customer Journey truth."])
      });
    }

    try{
      const full=await get("/hunt-customer-journey-snapshot?days="+days,accessToken);
      return normalizeFull(full,{...opts,days});
    }catch(fullError){
      try{
        const fallback=await get("/hunt-owner-mission-control",accessToken);
        return normalizeMission(fallback,{...opts,days,full_error:String(fullError?.message||fullError)});
      }catch(fallbackError){
        return Object.freeze({
          status:"BLOCKED",source:"journey loaders",mode:"LOAD_FAILED",stale:true,
          latest_activity_day:null,window_days:days,
          stages:Object.freeze({sessions:null,views:null,engagement:null,saves:null,likes:null,cart:null,checkout:null,buyer:null,repeat:null}),
          purchase_truth:Object.freeze({buyer_ready:false}),
          notes:Object.freeze([
            "Customer Journey snapshot unavailable.",
            String(fallbackError?.message||fallbackError)
          ])
        });
      }
    }
  }

  async function initBrowser(){
    if(typeof window==="undefined")return null;
    const snapshot=await load({days:7});
    window.DRAGON_CUSTOMER_JOURNEY_STATE=snapshot;
    window.dispatchEvent(new CustomEvent("dragon:customer-journey",{detail:snapshot}));
    return snapshot;
  }

  const api=Object.freeze({latestActiveDay,staleFrom,normalizeFull,normalizeMission,load,initBrowser});
  if(typeof window!=="undefined"){
    window.DragonCustomerJourney=api;
    if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(initBrowser,80));
    else setTimeout(initBrowser,80);
  }
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();