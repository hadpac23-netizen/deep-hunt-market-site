(() => {
  const $=(q,r=document)=>r.querySelector(q);
  async function init(){
    let cfg=null;
    try{
      const r=await fetch("legal-config.json?v=legal1",{cache:"no-store"});
      if(r.ok)cfg=await r.json();
    }catch{}
    cfg=cfg||{};
    try{
      const r=await fetch("https://zszlnahjqmwozwubetkm.supabase.co/functions/v1/hunt-business-identity?public=1",{cache:"no-store"});
      const d=await r.json();
      if(r.ok&&d?.published&&d?.identity)cfg={...cfg,...d.identity,status:"published"};
    }catch{}
    const value=(k,fallback="Not configured")=>String(cfg[k]||fallback);
    document.querySelectorAll("[data-legal]").forEach(el=>{
      const k=el.dataset.legal;
      el.textContent=value(k);
      if(!cfg[k])el.dataset.missing="true";
    });
    const required=[...(cfg.required_before_soft_launch||[]),...(cfg.required_before_real_money||[])];
    const missing=[...new Set(required)].filter(k=>!cfg[k]);
    const banner=$("#legal-config-banner");
    if(banner){
      banner.hidden=missing.length===0;
      if(missing.length){
        banner.innerHTML="<strong>PRELAUNCH DRAFT</strong><span>Business identity is incomplete. Missing: "+missing.map(k=>k.replaceAll("_"," ")).join(", ")+". These pages must not be treated as launch-ready until the real business details are supplied.</span>";
      }
    }
    document.querySelectorAll("[data-legal-date]").forEach(el=>el.textContent=value("last_reviewed","2026-09-15"));
  }
  init();
})();