(() => {
  const H=window.HuntCore,sb=window.supabase,$=q=>document.querySelector(q);
  if(!H||!sb?.createClient)return;
  const BASE="https://zszlnahjqmwozwubetkm.supabase.co";
  const client=sb.createClient(BASE,H.publishableKey);
  let session=null,current=null;
  const fields=["legal_entity_name","registration_number","registered_country","business_address","support_email","support_phone","returns_address","privacy_contact_email"];
  function status(t,tone=""){const el=$("#bi-status");el.hidden=false;el.dataset.tone=tone;el.innerHTML="<strong>"+H.esc(t)+"</strong>"}
  function payload(){const f=new FormData($("#bi-form"));const o={};for(const k of fields)o[k]=String(f.get(k)||"").trim();return o}
  function complete(x){return ["legal_entity_name","registration_number","business_address","support_email","privacy_contact_email","returns_address"].every(k=>String(x?.[k]||"").trim())}
  function fill(x){current=x||{};for(const k of fields){const el=$("#bi-form").elements[k];if(el)el.value=current[k]||""}$("#bi-state").textContent=current.status||"draft";$("#bi-approved").textContent=current.owner_approved?"Yes":"No";$("#bi-complete").textContent=complete(current)?"Yes":"No";$("#bi-unpublish").disabled=current.status!=="published";$("#bi-publish-open").disabled=!complete(current)||current.status==="published"}
  async function api(body){const r=await fetch(BASE+"/functions/v1/hunt-business-identity",{method:body?"POST":"GET",headers:{apikey:H.publishableKey,Authorization:"Bearer "+session.access_token,...(body?{"Content-Type":"application/json"}:{})},body:body?JSON.stringify(body):undefined,cache:"no-store"});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||"Request failed");return d}
  async function save(action,extra={}){try{const d=await api({action,...payload(),...extra});fill(d.identity);status(action==="publish"?"Business identity published.":"Business identity saved.","success");return true}catch(e){status(e.message||"Update failed.","error");return false}}
  $("#bi-save")?.addEventListener("click",()=>save("save"));
  $("#bi-publish-open")?.addEventListener("click",()=>{$("#bi-confirm").hidden=false;$("#bi-confirm-input").value="";$("#bi-publish").disabled=true;$("#bi-confirm-input").focus()});
  $("#bi-confirm-input")?.addEventListener("input",e=>$("#bi-publish").disabled=e.currentTarget.value!=="PUBLISH HUNT BUSINESS IDENTITY");
  $("#bi-cancel")?.addEventListener("click",()=>$("#bi-confirm").hidden=true);
  $("#bi-publish")?.addEventListener("click",async()=>{if(await save("publish",{confirmation:$("#bi-confirm-input").value}))$("#bi-confirm").hidden=true});
  $("#bi-unpublish")?.addEventListener("click",()=>save("unpublish"));
  async function init(){const a=await client.auth.getSession();session=a.data.session||null;if(!session){location.replace("auth.html?next="+encodeURIComponent("/deep-hunt-market-site/business-identity.html"));return}const p=await client.from("profiles").select("is_admin").eq("id",session.user.id).maybeSingle();if(!p.data?.is_admin){status("Owner/admin access required.","error");return}$("#bi-app").hidden=false;$("#bi-status").hidden=true;try{const d=await api();fill(d.identity)}catch(e){status(e.message||"Could not load business identity.","error")}}
  init();
})();