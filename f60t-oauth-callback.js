(() => {
  "use strict";

  const H=window.HuntCore;
  const sb=window.supabase;
  const status=document.querySelector("#f60t-oauth-status");
  const BASE="https://zszlnahjqmwozwubetkm.supabase.co";

  function say(message,tone=""){
    if(!status)return;
    status.textContent=message;
    status.dataset.tone=tone;
  }

  async function run(){
    if(!H||!sb?.createClient){
      say("Connection tools are unavailable. Return to BOOM Studio and try again.","error");
      return;
    }

    const params=new URLSearchParams(location.search);
    const code=params.get("code")||"";
    const state=params.get("state")||"";
    const providerError=params.get("error")||"";
    if(providerError){
      say("Platform authorization was not completed. Return to BOOM Studio when ready.","error");
      return;
    }
    if(!code||!state){
      say("The OAuth callback is incomplete. Return to BOOM Studio and restart the connection.","error");
      return;
    }

    const client=window.HuntSupabaseClient||sb.createClient(BASE,H.publishableKey);
    if(!window.HuntSupabaseClient)window.HuntSupabaseClient=client;
    const {data:{session}}=await client.auth.getSession();
    if(!session?.access_token){
      say("Owner session is required. Return to BOOM Studio, sign in, and restart the connection.","error");
      return;
    }

    say("Validating one-time authorization…");
    const res=await fetch(BASE+"/functions/v1/hunt-f60t-oauth",{
      method:"POST",
      headers:{
        apikey:H.publishableKey,
        Authorization:"Bearer "+session.access_token,
        "Content-Type":"application/json"
      },
      body:JSON.stringify({action:"exchange",code,state}),
      cache:"no-store"
    });
    const data=await res.json().catch(()=>({}));
    if(!res.ok||data?.ok!==true){
      say("Connection failed: "+String(data?.error||"OAuth exchange failed")+". Return to BOOM Studio and retry.","error");
      return;
    }

    say(String(data.provider||"Platform")+" connected securely. Returning to BOOM Studio…","ok");
    setTimeout(()=>{
      location.replace("boom-growth-os.html?f60t_oauth=connected");
    },650);
  }

  run().catch(error=>{
    say("Connection failed: "+String(error?.message||"unexpected error")+". Return to BOOM Studio and retry.","error");
  });
})();
