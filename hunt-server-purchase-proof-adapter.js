(() => {
  "use strict";

  const VERSION="2026-09-19-v1";
  const CONFIRMED_PAYMENT_EVENTS=new Set([
    "payment_confirmed",
    "callback_verified_paid",
    "provider_paid_confirmed"
  ]);

  async function readRows(client,table,columns,limit=200){
    try{
      const res=await client.from(table).select(columns).limit(limit);
      if(res?.error)return {ok:false,rows:[],error:String(res.error.message||res.error)};
      return {ok:true,rows:Array.isArray(res?.data)?res.data:[],error:""};
    }catch(error){
      return {ok:false,rows:[],error:String(error?.message||error)};
    }
  }

  function hasAttributionContext(session={}){
    const snap=session?.commerce_snapshot;
    const attr=snap&&typeof snap==="object"?snap.attribution:null;
    if(!attr||typeof attr!=="object")return false;
    return Boolean(attr.first_touch||attr.last_touch);
  }

  function evaluate({sessions=[],orders=[],events=[]}={}){
    const orderMap=new Map((orders||[]).map(row=>[String(row.id||""),row]));
    const confirmedBySession=new Set(
      (events||[])
        .filter(row=>CONFIRMED_PAYMENT_EVENTS.has(String(row.event_type||"")))
        .map(row=>String(row.payment_session_id||""))
        .filter(Boolean)
    );

    const paidSessions=(sessions||[]).filter(row=>Boolean(row.paid_at));
    const linkedPaid=paidSessions.filter(row=>Boolean(row.order_id));
    const realLinked=linkedPaid.filter(row=>{
      const order=orderMap.get(String(row.order_id||""));
      return order&&order.is_test===false;
    });
    const confirmedReal=realLinked.filter(row=>confirmedBySession.has(String(row.id||"")));
    const contextSessions=(sessions||[]).filter(hasAttributionContext);
    const linkedWithContext=confirmedReal.filter(hasAttributionContext);

    return Object.freeze({
      paid_sessions:paidSessions.length,
      linked_paid_sessions:linkedPaid.length,
      linked_real_orders:realLinked.length,
      provider_confirmed_real_orders:confirmedReal.length,
      sessions_with_campaign_context:contextSessions.length,
      purchases_with_campaign_context:linkedWithContext.length,
      provider_payment_confirmation:confirmedReal.length>0,
      server_purchase_confirmation:confirmedReal.length>0,
      live_campaign_context_persisted:contextSessions.length>0,
      purchase_touchpoint_linkage:linkedWithContext.length>0,
      conversion_claim_allowed:linkedWithContext.length>0,
      execute_actions:false,
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  async function load(client){
    if(!client?.from)return Object.freeze({
      version:VERSION,adapter_ready:false,errors:Object.freeze(["supabase_client_missing"]),
      ...evaluate(),read_only:true,writes:0
    });

    const [sessionRes,orderRes,eventRes]=await Promise.all([
      readRows(client,"hunt_payment_sessions","id,order_id,mode,status,paid_at,commerce_snapshot,updated_at"),
      readRows(client,"hunt_orders","id,is_test,status,placed_at,updated_at"),
      readRows(client,"hunt_payment_events","payment_session_id,event_type,provider_event_id,created_at")
    ]);
    const errors=[];
    if(!sessionRes.ok)errors.push("payment_sessions:"+sessionRes.error);
    if(!orderRes.ok)errors.push("orders:"+orderRes.error);
    if(!eventRes.ok)errors.push("payment_events:"+eventRes.error);
    const proof=evaluate({sessions:sessionRes.rows,orders:orderRes.rows,events:eventRes.rows});

    return Object.freeze({
      version:VERSION,
      adapter_ready:sessionRes.ok&&orderRes.ok&&eventRes.ok,
      errors:Object.freeze(errors),
      ...proof,
      read_only:true,
      writes:0
    });
  }

  const api=Object.freeze({VERSION,CONFIRMED_PAYMENT_EVENTS,readRows,hasAttributionContext,evaluate,load});
  if(typeof window!=="undefined")window.HuntServerPurchaseProofAdapter=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();