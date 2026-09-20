(() => {
  "use strict";
  const H=window.HuntCore, runtime=window.BoomRuntime;
  if(!H||!runtime?.getSupabaseClient)return;

  const client=runtime.getSupabaseClient();
  if(!client)return;
  const title=document.getElementById("f60t-callback-title");
  const status=document.getElementById("f60t-callback-status");
  const back=document.getElementById("f60t-callback-return");

  function finish(ok,message){
    if(title)title.textContent=ok?"Connection completed":"Connection not completed";
    if(status){
      status.textContent=message;
      status.dataset.tone=ok?"ok":"error";
    }
    if(back)back.hidden=false;
  }

  async function run(){
    const params=new URLSearchParams(location.search);
    const code=params.get("code")||"";
    const state=params.get("state")||"";
    const providerError=params.get("error")||"";
    if(providerError){
      finish(false,"Provider authorization was cancelled or rejected.");
      return;
    }
    if(!code||!state){
      finish(false,"Missing OAuth callback parameters.");
      return;
    }

    const {data:{session}}=await client.auth.getSession();
    if(!session){
      const next=location.pathname+location.search;
      location.replace("auth.html?next="+encodeURIComponent(next));
      return;
    }

    try{
      const res=await fetch(H.functionsBase+"/hunt-f60t-oauth",{
        method:"POST",
        cache:"no-store",
        headers:{
          apikey:H.publishableKey,
          Authorization:"Bearer "+session.access_token,
          "Content-Type":"application/json"
        },
        body:JSON.stringify({action:"exchange",code,state})
      });
      const data=await res.json().catch(()=>({}));
      if(!res.ok)throw new Error(data?.error||"OAuth exchange failed.");
      const provider=data?.provider==="youtube"?"YouTube":data?.provider==="pinterest"?"Pinterest":"Provider";
      finish(true,provider+" connected securely. F60T will mark the source LIVE only after a successful official API sync.");
      history.replaceState({},document.title,location.pathname);
    }catch(error){
      finish(false,error?.message||"OAuth exchange failed.");
    }
  }

  run();
})();
