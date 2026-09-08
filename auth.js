(() => {
  const H=window.HuntCore;
  const $=q=>document.querySelector(q);
  H.updateCartBadges();
  const supabaseUrl="https://zszlnahjqmwozwubetkm.supabase.co";
  const googleClientId="958182987084-dck16kardln9j1j3ovirvc9pi8523bcu.apps.googleusercontent.com";
  const supabase=window.supabase?.createClient(supabaseUrl,H.publishableKey);
  const status=$("#hd-auth-status");
  const providerButtons=[...document.querySelectorAll("button[data-oauth]")];
  const googleContainer=$("#hd-google-signin");
  const googleStatus=$("#hd-google-status");
  let googleReady=false;

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

  function loadGoogleIdentity() {
    if(window.google?.accounts?.id)return Promise.resolve();
    return new Promise((resolve,reject)=>{
      const existing=document.getElementById("hd-google-gsi");
      if(existing){
        existing.addEventListener("load",()=>resolve(),{once:true});
        existing.addEventListener("error",()=>reject(new Error("Google identity library failed to load.")),{once:true});
        return;
      }
      const script=document.createElement("script");
      script.id="hd-google-gsi";
      script.src="https://accounts.google.com/gsi/client";
      script.async=true;
      script.defer=true;
      script.onload=()=>resolve();
      script.onerror=()=>reject(new Error("Google identity library failed to load."));
      document.head.appendChild(script);
    });
  }

  async function createGoogleNonce() {
    const bytes=crypto.getRandomValues(new Uint8Array(32));
    const nonce=btoa(String.fromCharCode(...bytes));
    const encoded=new TextEncoder().encode(nonce);
    const digest=await crypto.subtle.digest("SHA-256",encoded);
    const hashedNonce=[...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,"0")).join("");
    return {nonce,hashedNonce};
  }

  async function initGoogle(enabled) {
    if(!googleContainer||!googleStatus)return;
    if(!enabled){
      googleStatus.textContent="SETUP REQUIRED";
      return;
    }
    googleStatus.textContent="LOADING…";
    try{
      await loadGoogleIdentity();
      const {nonce,hashedNonce}=await createGoogleNonce();
      window.google.accounts.id.initialize({
        client_id:googleClientId,
        callback:async response=>{
          if(!response?.credential){
            setStatus("Google did not return a sign-in credential.","error");
            return;
          }
          setStatus("Finishing Google sign-in…");
          const {data,error}=await supabase.auth.signInWithIdToken({
            provider:"google",
            token:response.credential,
            nonce
          });
          if(error){
            setStatus(error.message,"error");
            return;
          }
          renderSession(data.session);
          setStatus("Signed in with Google.","ok");
        },
        nonce:hashedNonce,
        use_fedcm_for_prompt:true,
        auto_select:false
      });
      googleContainer.replaceChildren();
      const width=Math.max(180,Math.min(320,Math.floor(googleContainer.getBoundingClientRect().width||240)));
      window.google.accounts.id.renderButton(googleContainer,{
        type:"standard",
        theme:"outline",
        size:"large",
        shape:"pill",
        text:"signin_with",
        logo_alignment:"left",
        width
      });
      googleStatus.textContent="CONNECTED";
      googleReady=true;
    }catch(error){
      googleStatus.textContent="GOOGLE UNAVAILABLE";
      setStatus(error?.message||"Google sign-in is unavailable.","error");
    }
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
      await initGoogle(external.google===true);
    } catch {
      providerButtons.forEach(button=>{button.disabled=true;button.querySelector("small").textContent="STATUS UNAVAILABLE";});
      if(googleStatus)googleStatus.textContent="STATUS UNAVAILABLE";
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
    setStatus("Opening "+button.querySelector("span").textContent+"…");
    const {error}=await supabase.auth.signInWithOAuth({provider,options:{redirectTo:redirectUrl()}});
    if(error)setStatus(error.message,"error");
  }));

  $("#hd-sign-out")?.addEventListener("click",async()=>{
    if(!supabase)return;
    if(googleReady)window.google?.accounts?.id?.disableAutoSelect?.();
    const {error}=await supabase.auth.signOut();
    if(error)setStatus(error.message,"error"); else {renderSession(null);setStatus("Signed out.","ok");}
  });

  if(supabase){
    supabase.auth.getSession().then(({data})=>renderSession(data.session));
    supabase.auth.onAuthStateChange((_event,session)=>renderSession(session));
  }
  loadProviders();
})();
