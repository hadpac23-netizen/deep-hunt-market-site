(() => {
  "use strict";
  const VERSION="2026-09-19-v1";
  const clean=(v,max=220)=>String(v??"").replace(/\s+/g," ").trim().slice(0,max);
  const uniq=arr=>[...new Set((Array.isArray(arr)?arr:[]).filter(Boolean))];
  const num=v=>Number.isFinite(Number(v))?Number(v):null;
  const TRIGGERS=Object.freeze({
    ORDER_UPDATE:Object.freeze({class:"service",cooldown_hours:0,requires:["real_order","order_status_changed"]}),
    TRACKING_UPDATE:Object.freeze({class:"service",cooldown_hours:0,requires:["real_order","tracking_changed"]}),
    SAVED_ITEM_REMINDER:Object.freeze({class:"marketing",cooldown_hours:168,requires:["marketing_consent","saved_item","product_still_valid"]}),
    CART_REMINDER:Object.freeze({class:"marketing",cooldown_hours:72,requires:["marketing_consent","cart_active","no_later_checkout_or_purchase"]}),
    BACK_IN_STOCK:Object.freeze({class:"marketing",cooldown_hours:168,requires:["marketing_consent","saved_or_wishlisted","availability_transition_verified"]}),
    PRICE_VERIFIED:Object.freeze({class:"marketing",cooldown_hours:168,requires:["marketing_consent","saved_or_wishlisted","verified_price_change"]}),
    COMPLEMENTARY_ITEM:Object.freeze({class:"marketing",cooldown_hours:168,requires:["marketing_consent","confirmed_purchase","verified_complement"]})
  });
  const CHANNELS=Object.freeze(["email","push","sms","whatsapp"]);
  function requirementState(trigger,evidence={},consent={}){
    const def=TRIGGERS[trigger]; if(!def)return {pass:false,blockers:["trigger_invalid"]};
    const blockers=[];
    for(const req of def.requires){
      if(req==="marketing_consent"){if(consent.marketing!==true)blockers.push("marketing_consent_required");}
      else if(evidence[req]!==true)blockers.push(req+"_required");
    }
    if(def.class==="service"&&consent.service_updates===false)blockers.push("service_updates_disabled");
    return {pass:blockers.length===0,blockers:uniq(blockers)};
  }
  function frequencyState(trigger,history={},nowMs=Date.now()){
    const def=TRIGGERS[trigger]; if(!def)return {pass:false,blockers:["trigger_invalid"]};
    if(def.class==="service"){
      const eventId=clean(history.event_id,160);
      if(eventId&&Array.isArray(history.sent_event_ids)&&history.sent_event_ids.includes(eventId))return {pass:false,blockers:["service_event_already_sent"]};
      return {pass:true,blockers:[]};
    }
    const lastTrigger=num(history.last_trigger_sent_at_ms);
    const sent24=Math.max(0,num(history.marketing_sent_last_24h)||0);
    const sent7d=Math.max(0,num(history.marketing_sent_last_7d)||0);
    const blockers=[];
    if(sent24>=1)blockers.push("marketing_daily_cap_reached");
    if(sent7d>=2)blockers.push("marketing_weekly_cap_reached");
    if(lastTrigger!==null&&def.cooldown_hours>0&&nowMs-lastTrigger<def.cooldown_hours*3600*1000)blockers.push("trigger_cooldown_active");
    return {pass:blockers.length===0,blockers:uniq(blockers)};
  }
  function channelState(channel,channels={}){
    const key=clean(channel,30).toLowerCase(); if(!CHANNELS.includes(key))return {pass:false,blockers:["channel_invalid"]};
    const row=channels[key]||{},blockers=[];
    if(row.connected!==true)blockers.push(key+"_not_connected");
    if(row.send_enabled!==true)blockers.push(key+"_send_disabled");
    return {pass:blockers.length===0,blockers:uniq(blockers)};
  }
  function safeMessage(trigger,evidence={}){
    const title=clean(evidence.product_title||"your HUNT item",140);
    const orderRef=clean(evidence.order_reference||"your order",80);
    const tracking=clean(evidence.tracking_status||"",120);
    const price=clean(evidence.verified_price_text||"",40);
    const map={
      ORDER_UPDATE:{subject:"Order update",body:"There is a new verified status for "+orderRef+". Open HUNT for the current order details."},
      TRACKING_UPDATE:{subject:"Tracking update",body:"Tracking changed for "+orderRef+(tracking?": "+tracking:"")+". Open HUNT for the latest verified shipment details."},
      SAVED_ITEM_REMINDER:{subject:"Still saved on HUNT",body:title+" is still in your saved list. Open HUNT if you want to review the current product details."},
      CART_REMINDER:{subject:"Your HUNT cart",body:"Your selected items are still in your cart. Price, stock and shipping will be rechecked before checkout."},
      BACK_IN_STOCK:{subject:"Availability update",body:title+" has a newly verified availability signal. HUNT will recheck the exact option before checkout."},
      PRICE_VERIFIED:{subject:"Verified price update",body:title+(price?" now has a verified HUNT price of "+price+".":" has a newly verified price update.")+" Review the current details on HUNT."},
      COMPLEMENTARY_ITEM:{subject:"A related HUNT find",body:"HUNT found a source-backed complementary item related to your confirmed purchase. Review it only if it is useful to you."}
    };
    return Object.freeze(map[trigger]||{subject:"HUNT update",body:"Open HUNT for the latest verified information."});
  }
  function evaluate({trigger="",channel="email",evidence={},consent={},history={},channels={},now_ms=Date.now()}={}){
    const key=clean(trigger,50).toUpperCase(),def=TRIGGERS[key];
    if(!def)return Object.freeze({trigger:key,state:"HOLD",blockers:Object.freeze(["trigger_invalid"]),send_enabled:false});
    const req=requirementState(key,evidence,consent),freq=frequencyState(key,history,now_ms),chan=channelState(channel,channels);
    const blockers=uniq([...req.blockers,...freq.blockers,...chan.blockers]);
    const draftReady=req.pass&&freq.pass,sendReady=draftReady&&chan.pass;
    return Object.freeze({version:VERSION,trigger:key,class:def.class,channel:clean(channel,30).toLowerCase(),state:sendReady?"SEND_CANDIDATE":draftReady?"DRAFT_READY":"HOLD",blockers:Object.freeze(blockers),message:draftReady?safeMessage(key,evidence):null,frequency:Object.freeze({cooldown_hours:def.cooldown_hours,marketing_daily_cap:1,marketing_weekly_cap:2}),send_enabled:false,external_send:false,owner_gate:"REVIEW_REQUIRED"});
  }
  function systemReadiness(config={}){
    const channels=config.channels||{},rows=[];
    for(const [trigger,def] of Object.entries(TRIGGERS)){
      const blockers=[];
      if(def.class==="marketing"&&config.marketing_consent_infrastructure!==true)blockers.push("marketing_consent_infrastructure_missing");
      if(def.class==="service"&&config.real_order_events_ready!==true)blockers.push("real_order_events_not_ready");
      if(trigger==="TRACKING_UPDATE"&&config.tracking_events_ready!==true)blockers.push("tracking_events_not_ready");
      const connectedChannels=CHANNELS.filter(ch=>channels[ch]?.connected===true&&channels[ch]?.send_enabled===true);
      if(!connectedChannels.length)blockers.push("no_lifecycle_channel_connected");
      rows.push(Object.freeze({trigger,class:def.class,state:blockers.length?"LOCKED":"PREPARE",blockers:Object.freeze(uniq(blockers)),connected_channels:Object.freeze(connectedChannels)}));
    }
    return Object.freeze(rows);
  }
  function summarize(rows=[]){
    const list=Array.isArray(rows)?rows.filter(Boolean):[];
    return Object.freeze({total:list.length,prepare:list.filter(x=>x.state==="PREPARE").length,draft_ready:list.filter(x=>x.state==="DRAFT_READY").length,send_candidate:list.filter(x=>x.state==="SEND_CANDIDATE").length,locked_or_hold:list.filter(x=>["LOCKED","HOLD"].includes(x.state)).length,external_send:false,owner_gate:"REVIEW_REQUIRED"});
  }
  const api=Object.freeze({VERSION,TRIGGERS,CHANNELS,requirementState,frequencyState,channelState,safeMessage,evaluate,systemReadiness,summarize});
  if(typeof window!=="undefined")window.BoomLifecycleBrain=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();