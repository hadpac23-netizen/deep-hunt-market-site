(() => {
  "use strict";

  const VERSION="2026-09-19-v1";
  const EVENT_NAMES=Object.freeze([
    "page_view","view_item_list","search","view_item","select_item",
    "add_to_cart","begin_checkout","checkout_market_selected",
    "shopping_preference","view_promotion","purchase"
  ]);
  const PII_KEYS=/^(email|phone|address|full_name|first_name|last_name|user_data|customer_email)$/i;
  const clean=(v,max=160)=>String(v??"").replace(/[\r\n\t]+/g," ").replace(/\s+/g," ").trim().slice(0,max);
  const num=v=>Number.isFinite(Number(v))?Number(v):null;

  function sanitizeItems(items){
    return (Array.isArray(items)?items:[]).slice(0,50).map(row=>({
      item_id:clean(row?.item_id,100),
      item_name:clean(row?.item_name,160),
      item_brand:clean(row?.item_brand,80),
      item_category:clean(row?.item_category,80),
      item_variant:clean(row?.item_variant,100),
      quantity:Math.max(1,Math.min(20,Number(row?.quantity)||1))
    })).filter(row=>row.item_id);
  }

  function safeParams(params={}){
    const out={};
    for(const [key,value] of Object.entries(params||{})){
      if(PII_KEYS.test(key))continue;
      if(key==="items"){out.items=sanitizeItems(value);continue;}
      if(Array.isArray(value)){out[key]=value.slice(0,20).map(v=>clean(v,120));continue;}
      if(typeof value==="boolean"||typeof value==="number"){out[key]=value;continue;}
      if(value&&typeof value==="object")continue;
      out[key]=clean(value,180);
    }
    return Object.freeze(out);
  }

  function validateEnvelope(envelope={}){
    const blockers=[];
    if(!clean(envelope.event_id,160))blockers.push("event_id_missing");
    if(!EVENT_NAMES.includes(clean(envelope.event_name,80)))blockers.push("event_name_invalid");
    if(!Number.isFinite(Number(envelope.event_time_ms)))blockers.push("event_time_missing");
    if(!clean(envelope.source,40))blockers.push("source_missing");
    if(envelope.params&&Object.keys(envelope.params).some(key=>PII_KEYS.test(key)))blockers.push("raw_pii_forbidden");
    if(envelope.event_name==="purchase"){
      if(!clean(envelope.params?.transaction_id,120))blockers.push("purchase_transaction_id_missing");
      if(!(num(envelope.params?.value)>=0))blockers.push("purchase_value_missing");
      if(!clean(envelope.params?.currency,12))blockers.push("purchase_currency_missing");
      if(envelope.params?.hunt_order_state!=="confirmed_real_order")blockers.push("purchase_not_confirmed");
    }
    return Object.freeze({valid:blockers.length===0,blockers:Object.freeze(blockers)});
  }

  function destinationReadiness(config={}){
    const consent=config.consent_granted===true;
    const ga4=config.ga4_configured===true;
    const firstParty=config.first_party_configured===true;
    const eventIdPersisted=config.server_event_id_persisted===true;

    const external=(name,connected)=>Object.freeze({
      connected:connected===true,
      event_id_ready:eventIdPersisted,
      user_data_enabled:false,
      send_enabled:false,
      state:connected===true&&eventIdPersisted&&consent?"PREPARE":"LOCKED",
      blockers:Object.freeze([
        ...(consent?[]:["analytics_consent_required"]),
        ...(connected===true?[]:[name+"_not_connected"]),
        ...(eventIdPersisted?[]:["server_event_id_persistence_missing"])
      ])
    });

    return Object.freeze({
      ga4:Object.freeze({
        connected:ga4,
        event_id_ready:true,
        send_enabled:ga4&&consent,
        state:ga4&&consent?"ACTIVE":"LOCKED",
        blockers:Object.freeze([...(consent?[]:["analytics_consent_required"]),...(ga4?[]:["ga4_not_configured"])])
      }),
      first_party:Object.freeze({
        connected:firstParty,
        event_id_ready:eventIdPersisted,
        send_enabled:firstParty&&consent,
        state:firstParty&&consent?(eventIdPersisted?"ACTIVE":"PARTIAL"):"LOCKED",
        blockers:Object.freeze([...(consent?[]:["analytics_consent_required"]),...(firstParty?[]:["first_party_not_configured"]),...(eventIdPersisted?[]:["server_event_id_persistence_missing"])])
      }),
      google_ads_data_manager:external("google_ads_data_manager",config.google_ads_data_manager_connected),
      meta_capi:external("meta_capi",config.meta_capi_connected),
      tiktok_events_api:external("tiktok_events_api",config.tiktok_events_api_connected),
      pinterest_conversions_api:external("pinterest_conversions_api",config.pinterest_conversions_api_connected)
    });
  }

  function summarize(readiness={}){
    const rows=Object.entries(readiness);
    return Object.freeze({
      total:rows.length,
      active:rows.filter(([,row])=>row?.state==="ACTIVE").length,
      partial:rows.filter(([,row])=>row?.state==="PARTIAL"||row?.state==="PREPARE").length,
      locked:rows.filter(([,row])=>row?.state==="LOCKED").length,
      external_send_enabled:rows.some(([name,row])=>!["ga4","first_party"].includes(name)&&row?.send_enabled===true)
    });
  }

  const api=Object.freeze({VERSION,EVENT_NAMES,safeParams,validateEnvelope,destinationReadiness,summarize});
  if(typeof window!=="undefined")window.BoomMeasurementHub=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();
