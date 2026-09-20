(() => {
  "use strict";
  if (window.BoomRuntime?.version) return;

  const version = "BOOM-RUNTIME-V2";
  const supabaseUrl = "https://zszlnahjqmwozwubetkm.supabase.co";
  const fallbackPublishableKey = "sb_publishable_SCGT8rsQsVrAt5CtlKVMzA_wGjT2I6X";
  const channelName = "boom-hunt-runtime-v1";
  const traceChannelName = "boom-hunt-trace-v1";
  const pending = new Map();
  const sessionListeners = new Set();
  const actionMeta = new Map();
  let client = window.HuntAccountClient || null;
  let channel = null;
  let traceChannel = null;
  let sessionState = null;
  let sessionResolved = false;
  let sessionPromise = null;
  let authSubscription = null;
  let feedbackTimer = null;

  function publishableKey() {
    return window.HuntCore?.publishableKey || fallbackPublishableKey;
  }

  function getSupabaseClient() {
    if (client) return client;
    if (window.HuntAccountClient) {
      client = window.HuntAccountClient;
      return client;
    }
    if (!window.supabase?.createClient) return null;
    client = window.supabase.createClient(supabaseUrl, publishableKey(), {
      auth: {
        persistSession:true,
        autoRefreshToken:true,
        // Keep OAuth/magic-link callbacks working on auth.html.
        detectSessionInUrl:true
      }
    });
    window.HuntAccountClient = client;
    return client;
  }

  function correlationId(prefix="boom") {
    const id = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
    return prefix + "-" + id;
  }

  async function loadActionContract() {
    try {
      const res=await fetch("boom-action-contract.json",{cache:"force-cache"});
      if(!res.ok)return;
      const data=await res.json();
      for(const row of (data?.actions||[])) if(row?.action_id) actionMeta.set(String(row.action_id),row);
    } catch {}
  }

  function ownerForAction(actionId) {
    const id=String(actionId||"");
    const known=actionMeta.get(id)?.owner;
    if(known)return String(known);
    if(id.startsWith("auth."))return "identity_session_kernel";
    if(id.startsWith("cart.")||id.startsWith("product.like")||id.startsWith("product.save")||id.startsWith("product.quantity"))return "action_state_kernel";
    if(id.startsWith("checkout.")||id.startsWith("admin."))return "operations_brain";
    if(id.startsWith("boom.command"))return "boom_orchestrator";
    if(id.startsWith("boom.experiment"))return "learning_governance_brain";
    if(id.startsWith("boom.radar"))return "intelligence_brain";
    if(id.startsWith("partner."))return "growth_brain";
    return "";
  }

  function safeDetail(detail) {
    if (!detail || typeof detail !== "object") return {};
    const allowed = {};
    for (const [k,v] of Object.entries(detail)) {
      if (/token|secret|password|email|phone|address|credential/i.test(k)) continue;
      if (["string","number","boolean"].includes(typeof v) || v === null) allowed[k]=v;
    }
    return allowed;
  }

  const knownErrorCodes=new Set([
    "AUTH_REQUIRED","PERMISSION_DENIED","ACTION_IN_FLIGHT","NETWORK_UNAVAILABLE","VALIDATION_FAILED",
    "PRODUCT_RECHECK_FAILED","VARIANT_RECHECK_FAILED","OUT_OF_STOCK","SHIPPING_UNAVAILABLE",
    "SUPPLIER_COST_NOT_READY","PROFIT_RECHECK_FAILED","PROFIT_PROFILE_NOT_ACTIVE","ECONOMICS_EVIDENCE_STORE_FAILED","QUOTE_FAILED",
    "EVIDENCE_STALE","OWNER_GATE_REQUIRED","ACTION_FAILED"
  ]);
  function errorCode(error){
    const raw=String(error?.code||error?.message||"ACTION_FAILED").trim().toUpperCase().replace(/[^A-Z0-9_:-]+/g,"_").slice(0,80);
    if(knownErrorCodes.has(raw))return raw;
    if(/NETWORK|FETCH|TIMEOUT|OFFLINE/.test(raw))return "NETWORK_UNAVAILABLE";
    if(/AUTH|SESSION|LOGIN|SIGN_IN/.test(raw))return "AUTH_REQUIRED";
    if(/PERMISSION|FORBIDDEN|ADMIN_REQUIRED/.test(raw))return "PERMISSION_DENIED";
    if(/VALID|REQUIRED|INVALID/.test(raw))return "VALIDATION_FAILED";
    return "ACTION_FAILED";
  }

  function announce(message,tone="") {
    let host=document.getElementById("boom-runtime-status");
    if(!host){
      host=document.createElement("div");
      host.id="boom-runtime-status";
      host.setAttribute("role","status");
      host.setAttribute("aria-live","polite");
      host.style.position="fixed";
      host.style.width="1px";
      host.style.height="1px";
      host.style.overflow="hidden";
      host.style.clipPath="inset(50%)";
      document.body?.appendChild(host);
    }
    if(host){
      host.dataset.tone=tone;
      host.textContent=String(message||"");
    }
  }

  function feedbackHost(){
    if(!document.body)return null;
    let host=document.getElementById("boom-feedback-center");
    if(host)return host;
    const style=document.createElement("style");
    style.id="boom-feedback-style";
    style.textContent="#boom-feedback-center{position:fixed;z-index:99998;top:76px;right:16px;width:min(360px,calc(100vw - 24px));pointer-events:none;opacity:0;transform:translateY(-8px);transition:opacity .18s ease,transform .18s ease}#boom-feedback-center[data-open='true']{opacity:1;transform:translateY(0)}#boom-feedback-center .boom-feedback-card{background:rgba(7,18,31,.94);border:1px solid rgba(126,170,218,.32);box-shadow:0 14px 42px rgba(0,0,0,.28);backdrop-filter:blur(16px);border-radius:14px;padding:12px 14px;color:#eef6ff;font:700 .76rem/1.4 system-ui,-apple-system,sans-serif}#boom-feedback-center[data-tone='ok'] .boom-feedback-card{border-color:rgba(117,210,166,.45)}#boom-feedback-center[data-tone='error'] .boom-feedback-card{border-color:rgba(239,137,137,.5)}#boom-feedback-center[data-tone='pending'] .boom-feedback-card{border-color:rgba(126,170,218,.5)}@media(max-width:620px){#boom-feedback-center{top:64px;right:12px;left:12px;width:auto}}";
    document.head?.appendChild(style);
    host=document.createElement("div");
    host.id="boom-feedback-center";
    host.setAttribute("aria-hidden","true");
    host.innerHTML='<div class="boom-feedback-card"></div>';
    document.body?.appendChild(host);
    return host;
  }

  function feedback(message,tone="info",{persist=false}={}){
    const host=feedbackHost();
    if(!host)return;
    clearTimeout(feedbackTimer);
    const text=String(message||"").trim().slice(0,220);
    if(!text){host.dataset.open="false";return;}
    host.dataset.tone=String(tone||"info");
    host.querySelector(".boom-feedback-card").textContent=text;
    host.dataset.open="true";
    if(!persist)feedbackTimer=setTimeout(()=>{host.dataset.open="false";},tone==="error"?6200:3600);
  }

  function actionFeedback(payload){
    const action=String(payload?.action_id||"");
    const detail=payload?.detail||{};
    const state=String(detail.state||"direct");
    let copy="", tone="info", persist=false;

    if(action==="checkout.quote.verify"){
      if(state==="pending"){copy="Verifying price, stock, shipping and checkout economics…";tone="pending";persist=true;}
      else if(state==="success"){copy="Price and shipping verified.";tone="ok";}
      else if(state==="error"){copy="Checkout verification failed. No payment was attempted.";tone="error";}
    }else if(action==="cart.add"&&state==="direct"){copy="Added to cart.";tone="ok";}
    else if(action==="cart.remove"&&state==="direct"){copy="Cart updated.";tone="ok";}
    else if(action==="cart.quantity.change"&&state==="direct"){copy="Quantity updated.";tone="ok";}
    else if(action==="product.like.toggle"&&state==="success"){copy=detail.active?"Added to likes.":"Removed from likes.";tone="ok";}
    else if(action==="product.save.toggle"&&state==="success"){copy=detail.active?"Saved for later.":"Removed from saved.";tone="ok";}
    else if(action==="auth.signin"){
      if(state==="pending"){copy="Signing in securely…";tone="pending";persist=true;}
      else if(state==="success"){copy="Signed in.";tone="ok";}
      else if(state==="error"){copy="Sign-in could not be completed.";tone="error";}
    }else if(action==="auth.signout"&&state==="success"){copy="Signed out.";tone="ok";}
    else if(action==="review.submit"){
      if(state==="pending"){copy="Publishing review…";tone="pending";persist=true;}
      else if(state==="success"){copy="Review submitted.";tone="ok";}
      else if(state==="error"){copy="Review could not be submitted.";tone="error";}
    }
    if(copy)feedback(copy,tone,{persist});
  }

  function emit(actionId,detail={},options={}) {
    const id=String(actionId||"");
    const meta=actionMeta.get(id)||{};
    const trace=options.traceContext||{};
    const payload={
      kind:"action",
      action_id:id,
      correlation_id:options.correlationId||correlationId("action"),
      owner:String(trace.owner||ownerForAction(id)||""),
      decision_owner:String(trace.decision_owner||meta.decision_owner||""),
      telemetry:String(trace.telemetry||meta.telemetry||""),
      surface:String(trace.surface||""),
      endpoint:String(trace.endpoint||""),
      analytics:String(trace.analytics||""),
      learning:String(trace.learning||""),
      detail:safeDetail(detail),
      ts:Date.now()
    };
    window.dispatchEvent(new CustomEvent("boom:action",{detail:payload}));
    actionFeedback(payload);
    if(traceChannel){
      try{traceChannel.postMessage(payload);}catch{}
    }
    if(options.broadcast!==false && channel){
      try{channel.postMessage(payload);}catch{}
    }
    return payload;
  }

  function notifySession(session,{event="SESSION",broadcast=false,source="local"}={}) {
    sessionState=session||null;
    sessionResolved=true;
    const summary={authenticated:Boolean(sessionState?.user),event:String(event||"SESSION"),source};
    for(const listener of sessionListeners){
      try{listener(sessionState,summary);}catch{}
    }
    window.dispatchEvent(new CustomEvent("boom:session",{detail:summary}));
    if(broadcast && channel){
      try{channel.postMessage({kind:"session-invalidate",action_id:"auth.session.changed",ts:Date.now()});}catch{}
    }
  }

  async function refreshSession({broadcast=false,event="REFRESH",source="runtime"}={}) {
    const authClient=getSupabaseClient();
    if(!authClient)return null;
    const {data,error}=await authClient.auth.getSession();
    if(error)throw error;
    notifySession(data?.session||null,{event,broadcast,source});
    return sessionState;
  }

  function bootSession() {
    if(sessionPromise)return sessionPromise;
    const authClient=getSupabaseClient();
    if(!authClient){
      sessionResolved=false;
      return Promise.resolve(null);
    }
    sessionPromise=refreshSession({broadcast:false,event:"INITIAL_SESSION",source:"runtime"}).catch(()=>{
      notifySession(null,{event:"INITIAL_SESSION_ERROR",broadcast:false,source:"runtime"});
      return null;
    });
    const {data}=authClient.auth.onAuthStateChange((event,session)=>{
      notifySession(session,{event,broadcast:true,source:"supabase"});
    });
    authSubscription=data?.subscription||null;
    return sessionPromise;
  }

  async function adminReady() {
    const session=await bootSession();
    if(!session?.user)return {ok:false,reason:"AUTH_REQUIRED"};
    const authClient=getSupabaseClient();
    if(!authClient)return {ok:false,reason:"NETWORK_UNAVAILABLE"};
    const {data,error}=await authClient.from("profiles").select("is_admin").eq("id",session.user.id).maybeSingle();
    if(error)return {ok:false,reason:errorCode(error)};
    if(data?.is_admin!==true)return {ok:false,reason:"PERMISSION_DENIED"};
    return {ok:true,session};
  }

  function subscribeSession(listener,{immediate=true}={}) {
    if(typeof listener!=="function")return ()=>{};
    sessionListeners.add(listener);
    bootSession();
    if(immediate&&sessionResolved){
      queueMicrotask(()=>{
        if(sessionListeners.has(listener))listener(sessionState,{authenticated:Boolean(sessionState?.user),event:"CURRENT_SESSION",source:"runtime"});
      });
    }
    return ()=>sessionListeners.delete(listener);
  }

  async function runAction(actionId,{key="",element=null,execute,onSuccess,onError,announcePending="",announceSuccess="",announceError="",successDetail=null,errorDetail=null,broadcastSuccess=true,traceContext={}}={}) {
    if(typeof execute!=="function")throw new Error("runAction requires execute()");
    const lock=String(actionId||"action")+"::"+String(key||"");
    if(pending.has(lock))return pending.get(lock);
    const correlation=correlationId("action");
    const previousDisabled=element?.disabled;
    if(element){
      element.disabled=true;
      element.setAttribute("aria-busy","true");
    }
    emit(actionId,{key,state:"pending"},{correlationId:correlation,broadcast:false,traceContext});
    if(announcePending)announce(announcePending);
    const task=(async()=>{
      try{
        const result=await execute({correlationId:correlation});
        const extra=typeof successDetail==="function"?successDetail(result):(successDetail||{});
        emit(actionId,{key,state:"success",...safeDetail(extra)},{correlationId:correlation,broadcast:broadcastSuccess,traceContext});
        if(announceSuccess)announce(announceSuccess,"ok");
        onSuccess?.(result);
        return result;
      }catch(error){
        const extra=typeof errorDetail==="function"?errorDetail(error):(errorDetail||{});
        emit(actionId,{key,state:"error",error_code:errorCode(error),...safeDetail(extra)},{correlationId:correlation,broadcast:false,traceContext});
        if(announceError)announce(announceError,"error");
        onError?.(error);
        throw error;
      }finally{
        pending.delete(lock);
        if(element){
          element.disabled=Boolean(previousDisabled);
          element.removeAttribute("aria-busy");
        }
      }
    })();
    pending.set(lock,task);
    return task;
  }

  function bootTraceChannel(){
    if(!("BroadcastChannel" in window))return;
    try{
      traceChannel=new BroadcastChannel(traceChannelName);
      traceChannel.addEventListener("message",event=>{
        const payload=event?.data;
        if(payload?.kind!=="action"||!payload?.action_id)return;
        window.dispatchEvent(new CustomEvent("boom:trace",{detail:payload}));
      });
    }catch{traceChannel=null;}
  }

  function bootChannel(){
    if(!("BroadcastChannel" in window))return;
    try{
      channel=new BroadcastChannel(channelName);
      channel.addEventListener("message",event=>{
        const payload=event?.data;
        if(payload?.kind==="session-invalidate"){
          refreshSession({broadcast:false,event:"REMOTE_INVALIDATION",source:"broadcast"}).catch(()=>{});
          return;
        }
        if(!payload?.action_id)return;
        window.dispatchEvent(new CustomEvent("boom:remote-action",{detail:payload}));
      });
    }catch{channel=null;}
  }

  bootChannel();
  bootTraceChannel();
  bootSession();
  loadActionContract();

  window.BoomRuntime={
    version,
    getSupabaseClient,
    correlationId,
    emit,
    runAction,
    announce,
    feedback,
    errorCode,
    subscribeSession,
    adminReady,
    sessionReady:()=>bootSession().then(()=>sessionState),
    currentSession:()=>sessionState,
    refreshSession,
    isPending:(actionId,key="")=>pending.has(String(actionId)+"::"+String(key)),
    destroy:()=>{authSubscription?.unsubscribe?.();channel?.close?.();traceChannel?.close?.();sessionListeners.clear();}
  };
})();
