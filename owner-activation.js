(() => {
  const H=window.HuntCore, sb=window.supabase;
  if(!H||!sb?.createClient)return;
  const BASE="https://zszlnahjqmwozwubetkm.supabase.co";
  const client=sb.createClient(BASE,H.publishableKey);
  const $=q=>document.querySelector(q);
  let session=null,state=null,pending=null;

  function status(text,tone=""){
    const el=$("#oa-status");if(!el)return;
    el.hidden=false;el.dataset.tone=tone;el.innerHTML="<strong>"+H.esc(text)+"</strong>";
  }
  function fmt(v){return String(v??"—")}
  function money(v,c="USD"){return Number.isFinite(Number(v))?H.money(Number(v),c):"—"}
  async function api(body){
    const res=await fetch(BASE+"/functions/v1/hunt-owner-activation",{
      method:body?"POST":"GET",
      headers:{apikey:H.publishableKey,Authorization:"Bearer "+session.access_token,...(body?{"Content-Type":"application/json"}:{})},
      body:body?JSON.stringify(body):undefined,
      cache:"no-store"
    });
    const data=await res.json().catch(()=>({}));
    if(!res.ok)throw Object.assign(new Error(data.error||"Request failed"),{data});
    return data;
  }
  function actionButtons(kind,row){
    return (row.activation_actions||[]).map(a=>
      '<button type="button" data-owner-action data-kind="'+H.esc(kind)+'" data-id="'+H.esc(row.id||row.key)+'" data-action="'+H.esc(a.action)+'" data-risk="'+H.esc(a.risk||"medium")+'">'+H.esc(a.label)+'</button>'
    ).join("");
  }
  function card(kind,row,title,meta,description){
    const statusText=row.status || (row.enabled?"enabled":"disabled");
    return '<article class="oa-card">'+
      '<div class="oa-card-top"><div><small>'+H.esc(kind.replaceAll("_"," "))+'</small><h3>'+H.esc(title)+'</h3></div><span class="oa-pill">'+H.esc(statusText)+'</span></div>'+
      '<p>'+H.esc(description||"")+'</p>'+
      '<div class="oa-meta">'+meta.map(x=>'<span class="oa-pill">'+H.esc(x)+'</span>').join("")+'</div>'+
      '<div class="oa-actions">'+actionButtons(kind,row)+'</div></article>';
  }
  function render(){
    const s=state||{};
    $("#oa-program-count").textContent=String((s.programs||[]).length);
    $("#oa-coupon-count").textContent=String((s.coupons||[]).length);
    $("#oa-control-count").textContent=String((s.runtime||[]).length);
    $("#oa-deal-count").textContent=String((s.deals||[]).filter(x=>x.status!=="live").length);
    $("#oa-experiment-count").textContent=String((s.experiments||[]).length);

    $("#oa-programs").innerHTML=(s.programs||[]).map(x=>card("merchant_program",x,x.version,[
      "listing "+money(x.listing_fee_amount,x.listing_fee_currency),
      "commission "+(Number(x.default_commission_bps||0)/100).toFixed(1)+"%",
      "payout hold "+fmt(x.payout_hold_days)+"d",
      x.seller_of_record_default?"merchant seller of record":"HUNT seller of record",
      x.owner_approved?"owner approved":"not approved"
    ],"Activating lets merchants accept this exact terms version. It does not approve any merchant account or store.")).join("")||'<p class="oa-empty">No merchant program versions.</p>';

    $("#oa-coupons").innerHTML=(s.coupons||[]).map(x=>card("coupon",x,x.code_prefix,[
      x.policy_type,
      x.discount_type+" "+fmt(x.requested_value),
      "min "+money(x.min_order_amount||0),
      x.requires_profit_gate?"Profit Gate required":"no Profit Gate",
      x.owner_approved?"owner approved":"not approved"
    ],x.notes||"Discount policy. Actual discount remains capped by verified safe capacity.")).join("")||'<p class="oa-empty">No coupon policies.</p>';

    $("#oa-runtime").innerHTML=(s.runtime||[]).map(x=>card("runtime",x,x.key,[
      x.enabled?"enabled":"disabled",
      x.owner_approved?"owner approved":"not approved"
    ],x.note||"Runtime control.")).join("")||'<p class="oa-empty">No runtime controls.</p>';

    $("#oa-deals").innerHTML=(s.deals||[]).map(x=>card("deal",x,x.title_snapshot||x.item_id,[
      "score "+Number(x.deal_score||0).toFixed(1),
      money(x.current_price,x.currency)+" now",
      x.reference_price?money(x.reference_price,x.currency)+" ref":"no reference",
      x.discount_percent?Number(x.discount_percent).toFixed(1)+"% drop":"no drop",
      x.profit_gate_status,
      x.truth_status
    ],"Verified deal candidate. Approve and Publish are separate owner actions.")).join("")||'<p class="oa-empty">No deal candidates waiting.</p>';

    $("#oa-campaigns").innerHTML=(s.campaigns||[]).map(x=>card("campaign",x,x.title,[
      x.campaign_type,x.placement,x.sponsored?"sponsored":"editorial",
      x.owner_approved?"owner approved":"not approved"
    ],x.sponsored?(x.disclosure||"Sponsored disclosure required"):"Internal HUNT editorial placement.")).join("")||'<p class="oa-empty">No onsite campaigns waiting.</p>';

    $("#oa-experiments").innerHTML=(s.experiments||[]).map(x=>card("experiment",x,x.title,[
      x.channel,x.objective,x.paid?"PAID DESIGN":"organic/internal",
      "approval "+x.owner_approval_status,"KPI "+x.primary_kpi
    ],x.hypothesis||"HUNT experiment.")).join("")||'<p class="oa-empty">No experiments.</p>';

    $("#oa-audit").innerHTML=(s.audit||[]).map(x=>
      '<article><strong>'+H.esc(x.action.toUpperCase()+" · "+x.object_type+" · "+x.object_id)+'</strong><span>'+H.esc(new Date(x.created_at).toLocaleString())+(x.note?" · "+H.esc(x.note):"")+'</span></article>'
    ).join("")||'<p class="oa-empty">No owner activation actions recorded yet.</p>';
  }
  function findRow(kind,id){
    const map={merchant_program:"programs",coupon:"coupons",runtime:"runtime",deal:"deals",campaign:"campaigns",experiment:"experiments"};
    const rows=state?.[map[kind]]||[];
    return rows.find(x=>String(x.id||x.key)===String(id));
  }
  function openModal(kind,id,action){
    const row=findRow(kind,id);if(!row)return;
    const descriptor=(row.activation_actions||[]).find(x=>x.action===action);if(!descriptor)return;
    pending={kind,id,action,descriptor,row};
    $("#oa-modal-risk").textContent=String(descriptor.risk||"medium").toUpperCase();
    $("#oa-modal-title").textContent=descriptor.label||"Confirm action";
    $("#oa-modal-subtitle").textContent=(row.title||row.title_snapshot||row.version||row.code_prefix||row.key||row.id)+" · "+(row.status||(row.enabled?"enabled":"disabled"));
    $("#oa-modal-effects").innerHTML=(descriptor.effects||[]).map(x=>"<li>"+H.esc(x)+"</li>").join("");
    $("#oa-modal-phrase").textContent=descriptor.confirmation||"";
    $("#oa-modal-input").value="";
    $("#oa-modal-note").value="";
    $("#oa-modal-confirm").disabled=true;
    $("#oa-modal").hidden=false;
    setTimeout(()=>$("#oa-modal-input")?.focus(),50);
  }
  function closeModal(){pending=null;$("#oa-modal").hidden=true}
  $("#oa-modal-input")?.addEventListener("input",e=>{
    $("#oa-modal-confirm").disabled=!pending||e.currentTarget.value!==pending.descriptor.confirmation;
  });
  $("#oa-modal-cancel")?.addEventListener("click",closeModal);
  $("#oa-modal")?.addEventListener("click",e=>{if(e.target.id==="oa-modal")closeModal()});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("#oa-modal").hidden)closeModal()});
  document.addEventListener("click",e=>{
    const b=e.target.closest?.("[data-owner-action]");if(!b)return;
    openModal(b.dataset.kind,b.dataset.id,b.dataset.action);
  });
  $("#oa-modal-confirm")?.addEventListener("click",async e=>{
    if(!pending)return;
    const button=e.currentTarget;button.disabled=true;button.textContent="Applying…";
    try{
      const result=await api({
        kind:pending.kind,action:pending.action,id:pending.id,
        confirmation:$("#oa-modal-input").value,
        note:$("#oa-modal-note").value.trim()
      });
      closeModal();
      status("Action completed and audit record written.","success");
      await loadState();
    }catch(error){
      status(error.message||"Activation failed.","error");
      button.disabled=false;
    }finally{
      button.textContent="Confirm action";
    }
  });
  async function loadState(){
    const data=await api();
    state=data.state||{};
    render();
  }
  async function init(){
    const auth=await client.auth.getSession();session=auth.data.session||null;
    if(!session){
      location.replace("auth.html?next="+encodeURIComponent("/deep-hunt-market-site/owner-activation.html"));
      return;
    }
    const profile=await client.from("profiles").select("is_admin").eq("id",session.user.id).maybeSingle();
    if(!profile.data?.is_admin){status("Owner/admin access required.","error");return}
    $("#oa-app").hidden=false;$("#oa-status").hidden=true;
    try{await loadState()}catch(error){status(error.message||"Could not load activation state.","error")}
  }
  init();
})();