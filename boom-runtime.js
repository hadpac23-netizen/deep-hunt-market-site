(() => {
  "use strict";
  if (window.BoomRuntime?.version) return;

  const version = "BOOM-RUNTIME-V1";
  const supabaseUrl = "https://zszlnahjqmwozwubetkm.supabase.co";
  const fallbackPublishableKey = "sb_publishable_SCGT8rsQsVrAt5CtlKVMzA_wGjT2I6X";
  const channelName = "boom-hunt-runtime-v1";
  const pending = new Map();
  let client = window.HuntAccountClient || null;
  let channel = null;

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
      auth: {persistSession:true, autoRefreshToken:true, detectSessionInUrl:false}
    });
    window.HuntAccountClient = client;
    return client;
  }

  function correlationId(prefix="boom") {
    const id = crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
    return prefix + "-" + id;
  }

  function safeDetail(detail) {
    if (!detail || typeof detail !== "object") return {};
    const allowed = {};
    for (const [k,v] of Object.entries(detail)) {
      if (/token|secret|password|email|phone|address/i.test(k)) continue;
      if (["string","number","boolean"].includes(typeof v) || v === null) allowed[k]=v;
    }
    return allowed;
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
    const payload={action_id:String(actionId||""),correlation_id:options.correlationId||correlationId("action"),detail:safeDetail(detail),ts:Date.now()};
    window.dispatchEvent(new CustomEvent("boom:action",{detail:payload}));
    if(options.broadcast!==false && channel){
      try{channel.postMessage(payload);}catch{}
    }
    return payload;
  }

  async function runAction(actionId,{key="",element=null,execute,onSuccess,onError,announcePending="",announceSuccess="",announceError=""}={}) {
    if(typeof execute!=="function")throw new Error("runAction requires execute()");
    const lock=String(actionId||"action")+"::"+String(key||"");
    if(pending.has(lock))return pending.get(lock);
    const correlation=correlationId("action");
    const previousDisabled=element?.disabled;
    if(element){
      element.disabled=true;
      element.setAttribute("aria-busy","true");
    }
    if(announcePending)announce(announcePending);
    const task=(async()=>{
      try{
        const result=await execute({correlationId:correlation});
        emit(actionId,{key,state:"success"},{correlationId:correlation});
        if(announceSuccess)announce(announceSuccess,"ok");
        onSuccess?.(result);
        return result;
      }catch(error){
        emit(actionId,{key,state:"error",error_code:String(error?.message||"ERROR").slice(0,120)},{correlationId:correlation});
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

  function bootChannel(){
    if(!("BroadcastChannel" in window))return;
    try{
      channel=new BroadcastChannel(channelName);
      channel.addEventListener("message",event=>{
        const payload=event?.data;
        if(!payload?.action_id)return;
        window.dispatchEvent(new CustomEvent("boom:remote-action",{detail:payload}));
      });
    }catch{channel=null;}
  }

  bootChannel();

  window.BoomRuntime={
    version,
    getSupabaseClient,
    correlationId,
    emit,
    runAction,
    announce,
    isPending:(actionId,key="")=>pending.has(String(actionId)+"::"+String(key))
  };
})();