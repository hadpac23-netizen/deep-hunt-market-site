(() => {
  const H=window.HuntCore, sb=window.supabase;
  if(!H||!sb?.createClient)return;
  const URL="https://zszlnahjqmwozwubetkm.supabase.co";
  const client=sb.createClient(URL,H.publishableKey);
  const $=q=>document.querySelector(q);
  let session=null;

  function money(v,c="USD"){return Number.isFinite(Number(v))?H.money(Number(v),c):"—";}
  function status(text,tone=""){
    const el=$("#bd-status");
    if(!el)return;
    el.hidden=false;
    el.dataset.tone=tone;
    el.innerHTML="<strong>"+H.esc(text)+"</strong>";
  }
  async function callFunction(slug,body){
    const res=await fetch(URL+"/functions/v1/"+slug,{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "apikey":H.publishableKey,
        "Authorization":"Bearer "+session.access_token
      },
      body:JSON.stringify(body)
    });
    const data=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(data.error||"Request failed");
    return data;
  }
  function dealRow(d){
    const discount=d.discount_percent ? " · "+Number(d.discount_percent).toFixed(1)+"% verified drop" : "";
    const approve=d.status==="owner_review" ? '<button data-deal-action="approve" data-id="'+H.esc(d.id)+'">Approve</button>' : "";
    const publish=d.status==="approved" ? '<button data-deal-action="publish" data-id="'+H.esc(d.id)+'">Publish</button>' : "";
    const reject=!["live","rejected","expired"].includes(d.status) ? '<button data-deal-action="reject" data-id="'+H.esc(d.id)+'">Reject</button>' : "";
    return '<article class="bd-row">'+
      '<div class="bd-row-head"><div><strong>'+H.esc(d.title_snapshot||d.item_id)+'</strong><small>'+H.esc(d.provider)+' · score '+Number(d.deal_score||0).toFixed(1)+'</small></div><span class="bd-pill">'+H.esc(d.status)+'</span></div>'+
      '<p>'+money(d.current_price,d.currency)+' · reference '+money(d.reference_price,d.currency)+discount+'</p>'+
      '<small>Profit: '+H.esc(d.profit_gate_status)+' · safe extra coupon '+money(d.max_safe_coupon_amount,d.currency)+' · '+H.esc(d.truth_status)+'</small>'+
      '<div class="bd-actions">'+approve+publish+reject+'</div></article>';
  }
  function economicsRow(x){
    return '<article class="bd-row">'+
      '<div class="bd-row-head"><strong>'+H.esc(x.provider)+' · '+H.esc(x.item_id)+'</strong><span class="bd-pill">'+H.esc(x.profit_gate_status)+'</span></div>'+
      '<p>Sale '+money(x.sale_price_per_unit,x.currency)+' · contribution '+money(x.contribution_before_coupon,x.currency)+' · margin '+(Number(x.contribution_margin||0)*100).toFixed(1)+'%</p>'+
      '<small>Max coupon '+money(x.max_safe_coupon_amount,x.currency)+' · Max CAC '+money(x.max_safe_cac,x.currency)+' · '+(x.inputs_verified?"verified inputs":"review inputs")+'</small></article>';
  }
  function couponRow(x){
    return '<article class="bd-row">'+
      '<div class="bd-row-head"><strong>'+H.esc(x.code_prefix)+'</strong><span class="bd-pill">'+H.esc(x.status)+'</span></div>'+
      '<p>'+H.esc(x.policy_type)+' · '+H.esc(x.discount_type)+' '+H.esc(x.requested_value)+'</p>'+
      '<small>Profit Gate: '+(x.requires_profit_gate?"required":"no")+' · Owner approved: '+(x.owner_approved?"yes":"no")+'</small></article>';
  }
  async function load(){
    const [econRes,couponRes,dealRes]=await Promise.all([
      client.from("hunt_unit_economics").select("*").order("calculated_at",{ascending:false}).limit(30),
      client.from("hunt_coupon_policies").select("*").order("created_at",{ascending:true}),
      client.from("hunt_deal_candidates").select("*").order("updated_at",{ascending:false}).limit(80)
    ]);
    const economics=econRes.data||[], coupons=couponRes.data||[], deals=dealRes.data||[];
    $("#bd-economics").innerHTML=economics.length?economics.map(economicsRow).join(""):"<p>No economics checks yet.</p>";
    $("#bd-coupons").innerHTML=coupons.length?coupons.map(couponRow).join(""):"<p>No coupon policies.</p>";
    $("#bd-deals").innerHTML=deals.length?deals.map(dealRow).join(""):"<p>No verified price-drop candidates yet. BOOM will not invent them.</p>";
    $("#bd-econ-count").textContent=String(economics.length);
    $("#bd-deal-count").textContent=String(deals.length);
    $("#bd-review-count").textContent=String(deals.filter(x=>x.status==="owner_review").length);
    $("#bd-live-count").textContent=String(deals.filter(x=>x.status==="live").length);
  }
  $("#bd-profit-form")?.addEventListener("submit",async event=>{
    event.preventDefault();
    const body=Object.fromEntries(new FormData(event.currentTarget).entries());
    body.quantity=Number(body.quantity||1);
    body.requested_coupon_amount=Number(body.requested_coupon_amount||0);
    $("#bd-profit-result").textContent="Checking live data…";
    try{
      const d=await callFunction("hunt-profit-engine",body);
      const summary={
        title:d.title,
        verified:d.inputs_verified,
        gate:d.economics?.profit_gate_status,
        product_revenue:d.economics?.product_revenue,
        supplier_product_cost:d.economics?.supplier_product_cost,
        supplier_shipping_cost:d.economics?.supplier_shipping_cost,
        payment_reserve:d.economics?.payment_reserve,
        refund_reserve:d.economics?.refund_reserve,
        contribution:d.economics?.contribution_before_coupon,
        margin_percent:Number((Number(d.economics?.contribution_margin||0)*100).toFixed(2)),
        max_safe_coupon:d.economics?.max_safe_coupon_amount,
        max_safe_cac:d.economics?.max_safe_cac,
        requested_coupon:d.requested_coupon_amount,
        approved_coupon:d.approved_coupon_amount,
        contribution_after_coupon:d.contribution_after_coupon,
        remaining_safe_cac:d.remaining_safe_cac_after_coupon
      };
      $("#bd-profit-result").textContent=JSON.stringify(summary,null,2);
      await load();
    }catch(error){
      $("#bd-profit-result").textContent=error.message||"Profit check failed.";
    }
  });
  $("#bd-refresh-deals")?.addEventListener("click",async event=>{
    event.currentTarget.disabled=true;
    try{
      await callFunction("hunt-deal-engine",{action:"refresh"});
      await load();
    }catch(error){
      status(error.message||"Deal refresh failed.","error");
    }
    event.currentTarget.disabled=false;
  });
  document.addEventListener("click",async event=>{
    const button=event.target.closest?.("[data-deal-action]");
    if(!button)return;
    button.disabled=true;
    try{
      await callFunction("hunt-deal-engine",{action:button.dataset.dealAction,id:button.dataset.id});
      await load();
    }catch(error){
      status(error.message||"Deal action failed.","error");
      button.disabled=false;
    }
  });
  async function init(){
    const auth=await client.auth.getSession();
    session=auth.data.session||null;
    if(!session){
      location.replace("auth.html?next="+encodeURIComponent("/deep-hunt-market-site/boom-deal-control.html"));
      return;
    }
    const profile=await client.from("profiles").select("is_admin").eq("id",session.user.id).maybeSingle();
    if(!profile.data?.is_admin){
      status("Owner/admin access required.","error");
      return;
    }
    $("#bd-status").hidden=true;
    $("#bd-app").hidden=false;
    await load();
  }
  init();
})();