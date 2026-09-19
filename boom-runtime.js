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
  let client = window.HuntAccountClient || null;
  let channel = null;
  let traceChannel = null;
  let sessionState = null;
  let sessionResolved = false;
  let sessionPromise = null;
  let authSubscription = null;

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
    "PRODUCT_RECHECK_FAILED","VARIANT_RECHECK_FAILED","OUT_OF_STOCK","SHIPPING_UNAVAILABLE","QUOTE_FAILED",
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

  function emit(actionId,detail={},options={}) {
    const payload={
      kind:"action",
      action_id:String(actionId||""),
      correlation_id:options.correlationId||correlationId("action"),
      detail:safeDetail(detail),
      ts:Date.now()
    };
    window.dispatchEvent(new CustomEvent("boom:action",{detail:payload}));
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

  async function runAction(actionId,{key="",element=null,execute,onSuccess,onError,announcePending="",announceSuccess="",announceError="",successDetail=null,errorDetail=null,broadcastSuccess=true}={}) {
    if(typeof execute!=="function")throw new Error("runAction requires execute()");
    const lock=String(actionId||"action")+"::"+String(key||"");
    if(pending.has(lock))return pending.get(lock);
    const correlation=correlationId("action");
    const previousDisabled=element?.disabled;
    if(element){
      element.disabled=true;
      element.setAttribute("aria-busy","true");
    }
    emit(actionId,{key,state:"pending"},{correlationId:correlation,broadcast:false});
    if(announcePending)announce(announcePending);
    const task=(async()=>{
      try{
        const result=await execute({correlationId:correlation});
        const extra=typeof successDetail==="function"?successDetail(result):(successDetail||{});
        emit(actionId,{key,state:"success",...safeDetail(extra)},{correlationId:correlation,broadcast:broadcastSuccess});
        if(announceSuccess)announce(announceSuccess,"ok");
        onSuccess?.(result);
        return result;
      }catch(error){
        const extra=typeof errorDetail==="function"?errorDetail(error):(errorDetail||{});
        emit(actionId,{key,state:"error",error_code:errorCode(error),...safeDetail(extra)},{correlationId:correlation,broadcast:false});
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

  window.BoomRuntime={
    version,
    getSupabaseClient,
    correlationId,
    emit,
    runAction,
    announce,
    errorCode,
    subscribeSession,
    sessionReady:()=>bootSession().then(()=>sessionState),
    currentSession:()=>sessionState,
    refreshSession,
    isPending:(actionId,key="")=>pending.has(String(actionId)+"::"+String(key)),
    destroy:()=>{authSubscription?.unsubscribe?.();channel?.close?.();traceChannel?.close?.();sessionListeners.clear();}
  };
})();
