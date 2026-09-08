(() => {
  const H=window.HuntCore;
  const $=q=>document.querySelector(q);
  H.updateCartBadges();
  const supabaseUrl="https://zszlnahjqmwozwubetkm.supabase.co";
  const supabase=window.supabase?.createClient(supabaseUrl,H.publishableKey);
  const status=$("#hd-auth-status");
  const providerButtons=[...document.querySelectorAll("[data-oauth]")];

  function setStatus(message,tone="") { status.textContent=message||""; status.dataset.tone=tone; }
  function redirectUrl(){ return new URL("auth.html",location.href).href.split("#")[0].split("?")[0]; }

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
  }

  async function loadProviders() {
    try {
      const res=await fetch(supabaseUrl+"/auth/v1/settings",{headers:{apikey:H.publishableKey},cache:"no-store"});
      const data=await res.json();
      const external=data.external||{};
      providerButtons.forEach(button=>{
        const provider=button.dataset.oauth;
        const enabled=external[provider]===true;
        button.disabled=!enabled;
        button.dataset.enabled=String(enabled);
        button.querySelector("small").textContent=enabled?"CONNECTED":"SETUP REQUIRED";
      });
    } catch {
      providerButtons.forEach(button=>{button.disabled=true;button.querySelector("small").textContent="STATUS UNAVAILABLE";});
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
    setStatus(`Opening ${button.querySelector("span").textContent}…`);
    const {error}=await supabase.auth.signInWithOAuth({provider,options:{redirectTo:redirectUrl()}});
    if(error)setStatus(error.message,"error");
  }));

  $("#hd-sign-out")?.addEventListener("click",async()=>{
    if(!supabase)return;
    const {error}=await supabase.auth.signOut();
    if(error)setStatus(error.message,"error"); else {renderSession(null);setStatus("Signed out.","ok");}
  });

  if(supabase){
    supabase.auth.getSession().then(({data})=>renderSession(data.session));
    supabase.auth.onAuthStateChange((_event,session)=>renderSession(session));
  }
  loadProviders();
})();
