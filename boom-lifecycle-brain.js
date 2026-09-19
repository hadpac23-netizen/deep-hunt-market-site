(() => {
  "use strict";

  const VERSION="2026-09-19-v2";
  const DAY=24*60*60*1000;
  const HOUR=60*60*1000;
  const clean=(v,max=180)=>String(v??"").replace(/\s+/g," ").trim().slice(0,max);
  const uniq=arr=>[...new Set((Array.isArray(arr)?arr:[]).filter(Boolean))];

  const TRIGGERS=Object.freeze({
    saved_reminder:Object.freeze({marketing:true,min_age_ms:24*HOUR,cooldown_ms:7*DAY,max_30d:2}),
    cart_reminder:Object.freeze({marketing:true,min_age_ms:2*HOUR,cooldown_ms:72*HOUR,max_30d:2}),
    price_verified:Object.freeze({marketing:true,min_age_ms:0,cooldown_ms:7*DAY,max_30d:2}),
    back_in_stock:Object.freeze({marketing:true,min_age_ms:0,cooldown_ms:7*DAY,max_30d:2}),
    order_update:Object.freeze({marketing:false,min_age_ms:0,cooldown_ms:0,max_30d:20}),
    tracking_update:Object.freeze({marketing:false,min_age_ms:0,cooldown_ms:0,max_30d:40}),
    complementary_followup:Object.freeze({marketing:true,min_age_ms:7*DAY,cooldown_ms:30*DAY,max_30d:1})
  });
  const CHANNELS=Object.freeze(["in_app","email","push","sms","whatsapp"]);

  function validChannel(channel){
    return CHANNELS.includes(String(channel||""));
  }

  function consentFor(trigger,channel,consent={}){
    const rule=TRIGGERS[trigger];
    if(!rule||!validChannel(channel))return false;
    if(channel==="in_app")return consent.in_app!==false;
    if(rule.marketing!==true)return consent.transactional?.[channel]===true;
    return consent.marketing?.[channel]===true;
  }

  function rowTime(row){
    const ts=Date.parse(String(row?.sent_at||row?.created_at||""));
    return Number.isFinite(ts)?ts:null;
  }

  function recentHistory(trigger,channel,history=[],now=Date.now()){
    return (Array.isArray(history)?history:[]).filter(row=>{
      if(row?.trigger!==trigger||row?.channel!==channel)return false;
      const ts=rowTime(row);
      return ts!==null&&now-ts>=0&&now-ts<=30*DAY;
    }).sort((a,b)=>(rowTime(b)||0)-(rowTime(a)||0));
  }

  function marketingHistory(history=[],now=Date.now()){
    return (Array.isArray(history)?history:[]).filter(row=>{
      const ts=rowTime(row);
      const isMarketing=row?.marketing===true||TRIGGERS[row?.trigger]?.marketing===true;
      return isMarketing&&ts!==null&&now-ts>=0&&now-ts<=30*DAY;
    });
  }

  function quietHoursBlocked(channel,ctx={}){
    if(channel==="in_app")return false;
    return ctx.quiet_hours_blocked===true;
  }

  function truthReady(trigger,ctx={}){
    if(["saved_reminder","cart_reminder","price_verified","back_in_stock"].includes(trigger)){
      if(ctx.safe_category===false)return {ok:false,reason:"restricted_or_unsafe_category"};
      if(ctx.product_truth_ready!==true)return {ok:false,reason:"product_truth_not_ready"};
      if(ctx.price_verified!==true)return {ok:false,reason:"verified_price_missing"};
      if(trigger==="back_in_stock"&&ctx.variant_stock_verified!==true)return {ok:false,reason:"variant_stock_not_verified"};
      if(trigger==="price_verified"&&ctx.price_change_verified!==true)return {ok:false,reason:"price_change_not_verified"};
    }

    if(trigger==="order_update"||trigger==="tracking_update"){
      if(ctx.is_test_order===true)return {ok:false,reason:"test_order_suppressed"};
      if(ctx.real_order_confirmed!==true)return {ok:false,reason:"real_order_not_confirmed"};
      if(trigger==="order_update"&&!clean(ctx.order_status,80))return {ok:false,reason:"order_status_missing"};
      if(trigger==="tracking_update"){
        if(ctx.tracking_changed!==true)return {ok:false,reason:"tracking_change_not_verified"};
        if(!clean(ctx.tracking_status||ctx.tracking_number,120))return {ok:false,reason:"tracking_status_missing"};
      }
    }

    if(trigger==="complementary_followup"){
      if(ctx.is_test_order===true)return {ok:false,reason:"test_order_suppressed"};
      if(ctx.delivered===true&&ctx.real_order_confirmed===true&&ctx.complement_truth_ready===true)return {ok:true};
      return {ok:false,reason:"delivered_order_or_complement_truth_missing"};
    }
    return {ok:true};
  }

  function safeMessage(trigger,ctx={}){
    const title=clean(ctx.product_title||"your HUNT item",140);
    const orderRef=clean(ctx.order_reference||"your order",80);
    const tracking=clean(ctx.tracking_status||ctx.tracking_number||"",120);
    const price=clean(ctx.verified_price_text||"",40);
    const map={
      saved_reminder:{subject:"Still saved on HUNT",body:title+" is still in your saved list. Open HUNT if you want to review the current product details."},
      cart_reminder:{subject:"Your HUNT cart",body:"Your selected items are still in your cart. Price, stock and shipping will be rechecked before checkout."},
      price_verified:{subject:"Verified price update",body:title+(price?" has a verified HUNT price of "+price+".":" has a newly verified price update.")+" Review the current details on HUNT."},
      back_in_stock:{subject:"Availability update",body:title+" has a newly verified availability signal. HUNT will recheck the exact option before checkout."},
      order_update:{subject:"Order update",body:"There is a new verified status for "+orderRef+". Open HUNT for the current order details."},
      tracking_update:{subject:"Tracking update",body:"Tracking changed for "+orderRef+(tracking?": "+tracking:".")+" Open HUNT for the latest verified shipment details."},
      complementary_followup:{subject:"A related HUNT find",body:"HUNT found a source-backed complementary item related to your confirmed purchase. Review it only if it is useful to you."}
    };
    return Object.freeze(map[trigger]||{subject:"HUNT update",body:"Open HUNT for the latest verified information."});
  }

  function evaluate({trigger,channel="in_app",context={},consent={},history=[],now=Date.now()}={}){
    const rule=TRIGGERS[trigger];
    const blockers=[];

    if(!rule)blockers.push("unknown_trigger");
    if(!validChannel(channel))blockers.push("invalid_channel");
    if(rule&&!consentFor(trigger,channel,consent))blockers.push(rule.marketing?"marketing_opt_in_required":"transactional_channel_not_enabled");

    if(channel!=="in_app"){
      if(context.consent_registry_ready!==true)blockers.push("lifecycle_consent_registry_missing");
      if(context.send_history_ready!==true)blockers.push("send_history_missing");
      if(context.frequency_cap_ledger_ready!==true)blockers.push("frequency_cap_ledger_missing");
      if(context.channel_connected!==true)blockers.push(channel+"_not_connected");
      if(context.channel_send_enabled!==true)blockers.push(channel+"_send_disabled");
    }

    if(quietHoursBlocked(channel,context))blockers.push("quiet_hours");
    if(context.user_identified!==true&&channel!=="in_app")blockers.push("identified_recipient_required");
    if(context.unsubscribe===true||context.suppressed===true)blockers.push("recipient_suppressed");

    const truth=truthReady(trigger,context);
    if(!truth.ok)blockers.push(truth.reason);

    const signalAt=Date.parse(String(context.signal_at||context.saved_at||context.cart_updated_at||context.delivered_at||""));
    if(rule&&rule.min_age_ms>0){
      if(!Number.isFinite(signalAt))blockers.push("signal_time_missing");
      else if(now-signalAt<rule.min_age_ms)blockers.push("minimum_wait_not_reached");
    }

    const recent=rule?recentHistory(trigger,channel,history,now):[];
    if(rule&&recent.length>=rule.max_30d)blockers.push("frequency_cap_30d");
    if(rule&&rule.cooldown_ms>0&&recent.length){
      const last=rowTime(recent[0]);
      if(last!==null&&now-last<rule.cooldown_ms)blockers.push("cooldown_active");
    }

    if(rule?.marketing===true){
      const marketing=marketingHistory(history,now);
      const sent24=marketing.filter(row=>now-(rowTime(row)||0)<=DAY).length;
      const sent7d=marketing.filter(row=>now-(rowTime(row)||0)<=7*DAY).length;
      if(sent24>=1)blockers.push("marketing_daily_cap_reached");
      if(sent7d>=2)blockers.push("marketing_weekly_cap_reached");
    }else{
      const eventId=clean(context.event_id,160);
      if(eventId&&Array.isArray(history)&&history.some(row=>clean(row?.event_id,160)===eventId)){
        blockers.push("service_event_already_sent");
      }
    }

    const unique=uniq(blockers);
    const eligible=unique.length===0;
    const mode=eligible?(channel==="in_app"?"IN_APP_CANDIDATE":"SEND_CANDIDATE"):"HOLD";

    return Object.freeze({
      version:VERSION,
      trigger:clean(trigger,60),
      channel:clean(channel,30),
      eligible,
      mode,
      blockers:Object.freeze(unique),
      marketing:rule?.marketing===true,
      message:eligible?safeMessage(trigger,context):null,
      frequency:Object.freeze({
        sent_30d:recent.length,
        max_30d:rule?.max_30d??0,
        cooldown_ms:rule?.cooldown_ms??0,
        marketing_daily_cap:1,
        marketing_weekly_cap:2
      }),
      send_enabled:false,
      external_send:false,
      execute:false,
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  function plan(signals=[],opts={}){
    const rows=[];
    for(const signal of Array.isArray(signals)?signals:[]){
      const trigger=clean(signal?.trigger,60);
      const channels=Array.isArray(signal?.channels)&&signal.channels.length?signal.channels:["in_app"];
      for(const channel of channels){
        rows.push(evaluate({
          trigger,
          channel,
          context:signal.context||{},
          consent:signal.consent||opts.consent||{},
          history:signal.history||opts.history||[],
          now:opts.now||Date.now()
        }));
      }
    }
    const reasons=new Map();
    for(const row of rows)for(const reason of row.blockers)reasons.set(reason,(reasons.get(reason)||0)+1);
    return Object.freeze({
      version:VERSION,
      total:rows.length,
      eligible:rows.filter(r=>r.eligible).length,
      hold:rows.filter(r=>!r.eligible).length,
      send_candidates:rows.filter(r=>r.mode==="SEND_CANDIDATE").length,
      in_app_candidates:rows.filter(r=>r.mode==="IN_APP_CANDIDATE").length,
      rows:Object.freeze(rows),
      top_blockers:Object.freeze([...reasons.entries()].map(([blocker,count])=>({blocker,count})).sort((a,b)=>b.count-a.count||a.blocker.localeCompare(b.blocker))),
      sends_executed:0,
      execute_actions:false,
      external_send:false,
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  const api=Object.freeze({VERSION,TRIGGERS,CHANNELS,safeMessage,evaluate,plan});
  if(typeof window!=="undefined")window.BoomLifecycleBrain=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();
