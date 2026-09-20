(() => {
  "use strict";
  const H=window.HuntCore, runtime=window.BoomRuntime;
  const client=runtime?.getSupabaseClient?.();
  if(!H||!runtime||!client)return;
  const $=q=>document.querySelector(q);
  const status=$("#f60t-connection-status");
  const panel=$("#f60t-connection-panel");
  const actionStatus=$("#f60t-action-status");
  let session=null;

  function setStatus(text,tone=""){
    if(!status)return;
    status.hidden=false;
    status.dataset.tone=tone;
    status.innerHTML="<strong>"+H.esc(text)+"</strong>";
  }
  function setAction(text,tone=""){
    if(!actionStatus)return;
    actionStatus.textContent=text||"";
    actionStatus.dataset.tone=tone;
  }
  function providerRow(data,name){
    return (Array.isArray(data?.providers)?data.providers:[]).find(x=>x?.provider===name)||null;
  }
  function renderProvider(name,row){
    const badge=document.querySelector('[data-provider-state="'+name+'"]');
    const note=document.querySelector('[data-provider-note="'+name+'"]');
    const button=document.querySelector('[data-connect-provider="'+name+'"]');
    const connection=row?.connection||{};
    const connected=connection?.status==="CONNECTED";
    const ready=row?.config_ready===true;

    if(badge){
      badge.textContent=connected?"CONNECTED":ready?"READY":"CONFIG REQUIRED";
      badge.className="hd-merchant-status "+(connected?"adopted":ready?"testing":"blocked");
    }
    if(note){
      if(connected){
        note.textContent="Connected. Official API sync still determines whether the source becomes LIVE.";
      }else if(ready){
        note.textContent="OAuth app is configured. Authorization can be started.";
      }else{
        note.textContent="OAuth app configuration is missing or incomplete on the server.";
      }
    }
    if(button){
      button.disabled=!ready;
      button.textContent=connected?"Reconnect "+(name==="youtube"?"YouTube":"Pinterest"):"Connect "+(name==="youtube"?"YouTube":"Pinterest");
    }
  }

  async function callOauth(body){
    if(!session?.access_token)throw new Error("Admin session required.");
    const res=await fetch(H.functionsBase+"/hunt-f60t-oauth",{
      method:"POST",
      cache:"no-store",
      headers:{
        apikey:H.publishableKey,
        Authorization:"Bearer "+session.access_token,
        "Content-Type":"application/json"
      },
      body:JSON.stringify(body||{})
    });
    const data=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(data?.error||data?.status||"F60T OAuth request failed.");
    return data;
  }

  async function load(){
    const gate=await runtime.adminReady();
    if(!gate?.ok){
      if(gate?.reason==="AUTH_REQUIRED"){
        location.replace("auth.html?next="+encodeURIComponent("/f60t-connections.html"));
        return;
      }
      setStatus("Admin access required.","error");
      return;
    }
    session=gate.session;

    try{
      const data=await callOauth({action:"status"});
      renderProvider("youtube",providerRow(data,"youtube"));
      renderProvider("pinterest",providerRow(data,"pinterest"));
      status.hidden=true;
      panel.hidden=false;
    }catch(error){
      setStatus(error?.message||"Could not load connector status.","error");
    }
  }

  document.addEventListener("click",async event=>{
    const button=event.target.closest?.("[data-connect-provider]");
    if(!button||button.disabled)return;
    const provider=button.dataset.connectProvider;
    setAction("Preparing secure "+provider+" authorization…");
    const run=runtime?.runAction ? runtime.runAction.bind(runtime) : async (_id,opts)=>opts.execute({});
    try{
      const data=await run("connector.oauth.start",{
        key:provider,element:button,broadcastSuccess:false,successDetail:{provider},
        traceContext:{
          surface:"boom.connections",
          owner:"identity_session_kernel",
          endpoint:"hunt-f60t-oauth",
          analytics:"connector_oauth_start",
          learning:"official_sync_gate"
        },
        execute:async()=>{
          const data=await callOauth({action:"start",provider});
          if(data?.status!=="AUTHORIZATION_REQUIRED"||!data?.auth_url)throw new Error("Authorization URL was not returned.");
          return data;
        }
      });
      location.assign(data.auth_url);
    }catch(error){
      setAction(error?.message||"Could not start authorization.","error");
    }
  });

  load();
})();
