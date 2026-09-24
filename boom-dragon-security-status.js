(() => {
"use strict";
const clean=v=>String(v??"").trim();
async function load(){
  try{
    const res=await fetch("dragon-security-status.json",{cache:"no-store"});
    if(!res.ok)throw new Error("SECURITY_STATUS_HTTP_"+res.status);
    const raw=await res.json();
    const state=Object.freeze({
      schema:raw.schema||"DRAGON_SECURITY_STATUS_V1",
      observed_at:raw.observed_at||null,
      database_status:raw.database_security?.status||"UNKNOWN",
      definer_warnings:Number(raw.database_security?.advisor_definer_warnings??raw.security_definer?.after_warn_count??0),
      rls_warnings:Number(raw.database_security?.advisor_rls_info??0),
      leaked_password_protection:clean(raw.auth?.leaked_password_protection||"UNKNOWN").toUpperCase(),
      auth_status:clean(raw.auth?.status||"UNKNOWN"),
      remaining_advisor_warnings:
        (clean(raw.auth?.leaked_password_protection).toUpperCase()==="DISABLED"?1:0),
      remediation:raw.auth?.remediation||null,
      source:"dragon-security-status.json"
    });
    window.DRAGON_SECURITY_STATE=state;
    window.dispatchEvent(new CustomEvent("dragon:security-status",{detail:state}));
    return state;
  }catch(error){
    const blocked=Object.freeze({
      database_status:"UNKNOWN",
      definer_warnings:null,
      rls_warnings:null,
      leaked_password_protection:"UNKNOWN",
      auth_status:"BLOCKED",
      remaining_advisor_warnings:null,
      error:String(error?.message||error)
    });
    window.DRAGON_SECURITY_STATE=blocked;
    window.dispatchEvent(new CustomEvent("dragon:security-status",{detail:blocked}));
    return blocked;
  }
}
const api=Object.freeze({load});
if(typeof window!=="undefined"){
  window.DragonSecurityStatus=api;
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(load,240));
  else setTimeout(load,240);
}
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();