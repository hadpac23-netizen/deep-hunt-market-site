(() => {
  const H=window.HuntCore;
  const $=q=>document.querySelector(q);
  H.updateCartBadges();
  const supabaseUrl="https://zszlnahjqmwozwubetkm.supabase.co";
  const supabase=window.HuntSupabaseClient || window.supabase?.createClient(supabaseUrl,H.publishableKey,{
    auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:"pkce"}
  });
  if(supabase){
    window.HuntSupabaseClient=supabase;
    window.HuntAccountClient=supabase;
  }
  const status=$("#hd-auth-status");
  const providerButtons=[...document.querySelectorAll("button[data-oauth]")];

  function setStatus(message,tone="") { if(!status)return; status.textContent=message||""; status.dataset.tone=tone; }
  function oauthErrorFromUrl(){
    const query=new URLSearchParams(location.search);
    const hash=new URLSearchParams(location.hash.replace(/^#/,""));
    const code=query.get("error_code")||hash.get("error_code")||query.get("error")||hash.get("error");
    const description=query.get("error_description")||hash.get("error_description");
    return code?decodeURIComponent((description||code).replace(/\+/g," ")):"";
  }
  function cleanAuthErrorFromUrl(){
    const url=new URL(location.href);
    ["error","error_code","error_description","error_uri"].forEach(k=>url.searchParams.delete(k));
    if(/^#(?:error|access_token|refresh_token)/.test(url.hash))url.hash="";
    history.replaceState({},"",url.pathname+(url.search||"")+(url.hash||""));
  }
  function nextTarget(){
    const raw=new URLSearchParams(location.search).get("next")||"";
    if(!raw)return "";
    try{
      const target=new URL(raw,location.origin);
      if(target.origin!==location.origin)return "";
      return target.pathname+target.search+target.hash;
    }catch{return "";}
  }
  function redirectUrl(){
    const url=new URL("auth.html",location.href);
    const next=nextTarget()||"/";
    url.searchParams.set("next",next);
    return url.href;
  }

  function renderSession(session) {
    const user=session?.user||null;
    $("#hd-auth-signed-out").hidden=Boolean(user);
    $("#hd-auth-signed-in").hidden=!user;
    if(!user)return;
    const meta=user.user_metadata||{};
    const name=meta.full_name||meta.name||user.email?.split("@")[0]||"HUNT user";
    $("#hd-account-name").textContent=name;
    $("#hd-account-email").textContent=user.email||"Signed-in account";
    $("#hd-account-avatar").textContent=String(name).trim().slice(0,1).toUpperCase()||"H";
    const next=nextTarget();
    if(next&&!sessionStorage.getItem("hunt_auth_redirecting")){
      sessionStorage.setItem("hunt_auth_redirecting","1");
      setTimeout(()=>{
        sessionStorage.removeItem("hunt_auth_redirecting");
        location.replace(next);
      },250);
    }
  }

  async function loadProviders() {
    let external={},custom={};
    try {
      const statusRes=await fetch(supabaseUrl+"/functions/v1/hunt-auth-provider-status",{
        headers:{apikey:H.publishableKey},cache:"no-store"
      });
      if(statusRes.ok){
        const live=await statusRes.json();
        external=live.external||{};
        custom=live.custom||{};
      }else{
        const res=await fetch(supabaseUrl+"/auth/v1/settings",{headers:{apikey:H.publishableKey},cache:"no-store"});
        const data=await res.json();
        external=data.external||{};
      }
      providerButtons.forEach(button=>{
        const provider=button.dataset.oauth;
        const customKey=button.dataset.custom;
        const enabled=customKey?custom[customKey]===true:external[provider]===true;
        button.disabled=!enabled;
        button.hidden=!enabled;
        button.dataset.enabled=String(enabled);
        button.querySelector("small").textContent=enabled?"READY":"NOT CONFIGURED";
      });
    } catch {
      providerButtons.forEach(button=>{button.disabled=true;button.hidden=true;button.querySelector("small").textContent="STATUS UNAVAILABLE";});
    }
  }

  $("#hd-email-auth")?.addEventListener("submit",async event=>{
    event.preventDefault();
    if(!supabase){setStatus("Auth library unavailable.","error");return;}
    const email=$("#hd-auth-email").value.trim();
    if(!email)return;
    setStatus("Sending secure magic link…");
    const {error}=await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:redirectUrl(),shouldCreateUser:true}});
    setStatus(error?error.message:"Magic link sent. Check your email to continue.",error?"error":"ok");
  });

  providerButtons.forEach(button=>button.addEventListener("click",async()=>{
    if(button.disabled||button.dataset.enabled!=="true")return;
    if(!supabase){setStatus("Auth library unavailable.","error");return;}
    const provider=button.dataset.oauth;
    if(button.dataset.professionalOnly==="true")setStatus("Instagram connection is available for Business/Creator accounts.");
    else setStatus("Opening "+button.querySelector("span").textContent+"…");
    const {error}=await supabase.auth.signInWithOAuth({provider,options:{redirectTo:redirectUrl()}});
    if(error)setStatus(error.message,"error");
  }));

  $("#hd-sign-out")?.addEventListener("click",async()=>{
    if(!supabase)return;
    const {error}=await supabase.auth.signOut();
    if(error)setStatus(error.message,"error"); else {renderSession(null);setStatus("Signed out.","ok");}
  });

  if(supabase){
    const callbackError=oauthErrorFromUrl();
    if(callbackError){ setStatus(callbackError,"error"); cleanAuthErrorFromUrl(); }
    supabase.auth.getSession().then(({data,error})=>{
      if(error)setStatus(error.message,"error");
      renderSession(data?.session||null);
    }).catch(err=>setStatus(err?.message||"Could not restore your session.","error"));
    supabase.auth.onAuthStateChange((event,session)=>{
      renderSession(session);
      if(event==="SIGNED_IN")setStatus("Signed in successfully.","ok");
      if(event==="SIGNED_OUT")setStatus("Signed out.","ok");
    });
  }
  loadProviders();
})();
