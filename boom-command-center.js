(() => {
  const H=window.HuntCore, sb=window.supabase;
  if(!H||!sb?.createClient)return;
  const client=sb.createClient("https://zszlnahjqmwozwubetkm.supabase.co",H.publishableKey);
  const $=q=>document.querySelector(q);
  let rows=[];

  function label(v){return String(v||"").replaceAll("_"," ")}
  function setStatus(text,tone=""){
    const el=$("#hd-command-status");
    if(!el)return;
    el.hidden=false; el.dataset.tone=tone;
    el.innerHTML="<strong>"+H.esc(text)+"</strong>";
  }
  function score(row){return (Number(row.impact)||0)*2+(Number(row.priority)||0)*2-(Number(row.effort)||0)}
  function filtered(){
    const status=$("#hd-command-status-filter")?.value||"all";
    const stream=$("#hd-command-workstream-filter")?.value||"all";
    return rows.filter(r=>(status==="all"||r.status===status)&&(stream==="all"||r.workstream===stream));
  }
  function card(row){
    const approval=row.owner_approval_required?'<span class="hd-command-approval">OWNER APPROVAL</span>':"";
    const blocker=row.blocker?'<p class="hd-command-blocker"><strong>Blocker:</strong> '+H.esc(row.blocker)+'</p>':"";
    return `<article class="hd-command-card glass" data-command-id="${H.esc(row.id)}">
      <div class="hd-command-card-top">
        <div>
          <small>${H.esc(row.workstream)} · score ${H.esc(score(row))}</small>
          <h2>${H.esc(row.title)}</h2>
        </div>
        <span class="hd-merchant-status ${H.esc(row.status)}">${H.esc(label(row.status))}</span>
      </div>
      <div class="hd-command-tags">
        <span>Impact ${H.esc(row.impact)}/5</span><span>Effort ${H.esc(row.effort)}/5</span>
        <span>${H.esc(label(row.cost_mode))}</span>${approval}
      </div>
      ${blocker}
      <p class="hd-command-next"><strong>Next:</strong> ${H.esc(row.next_action||"")}</p>
      ${row.success_metric?`<p class="hd-command-metric"><strong>Done when:</strong> ${H.esc(row.success_metric)}</p>`:""}
      <div class="hd-command-edit">
        <label>Status<select data-command-field="status">
          ${["queued","ready","in_progress","blocked","review","done","rejected"].map(v=>`<option value="${v}" ${row.status===v?"selected":""}>${label(v)}</option>`).join("")}
        </select></label>
        <label>Priority<select data-command-field="priority">
          ${[5,4,3,2,1].map(v=>`<option value="${v}" ${Number(row.priority)===v?"selected":""}>${v}</option>`).join("")}
        </select></label>
        <label class="wide">Next action<input data-command-field="next_action" maxlength="1200" value="${H.esc(row.next_action||"")}"></label>
        <label class="wide">Blocker<input data-command-field="blocker" maxlength="1200" value="${H.esc(row.blocker||"")}"></label>
      </div>
      <button class="hd-btn hd-btn-primary" type="button" data-command-save>Save</button>
    </article>`;
  }
  function render(){
    $("#hd-command-total").textContent=String(rows.length);
    $("#hd-command-ready").textContent=String(rows.filter(r=>r.status==="ready").length);
    $("#hd-command-progress").textContent=String(rows.filter(r=>r.status==="in_progress").length);
    $("#hd-command-blocked").textContent=String(rows.filter(r=>r.status==="blocked").length);
    $("#hd-command-done").textContent=String(rows.filter(r=>r.status==="done").length);
    const list=filtered().sort((a,b)=>score(b)-score(a)||Number(b.priority)-Number(a.priority));
    $("#hd-command-board").innerHTML=list.length?list.map(card).join(""):'<div class="hd-review-empty">No tasks match these filters.</div>';
  }
  async function loadOwnerSnapshot(){
    try{
      const [{data:{session}},catalogRes]=await Promise.all([
        client.auth.getSession(),
        fetch("catalog-index.json?v=mission1",{cache:"no-store"}).then(r=>r.ok?r.json():null).catch(()=>null)
      ]);
      if(!session)return;
      const res=await fetch("https://zszlnahjqmwozwubetkm.supabase.co/functions/v1/hunt-owner-mission-control",{
        headers:{apikey:H.publishableKey,Authorization:"Bearer "+session.access_token},
        cache:"no-store"
      });
      const data=await res.json().catch(()=>({}));
      if(!res.ok||data?.ok!==true)throw new Error(data?.error||"Mission snapshot failed");
      const snap=data.snapshot||{},today=snap.today||{},pending=snap.pending||{},econ=snap.economics||{},goal=snap.goal||{},rec=data.recommendation||{};
      const set=(id,val)=>{const el=$(id);if(el)el.textContent=String(val??"—")};
      const money=v=>Number.isFinite(Number(v))?H.money(Number(v),"USD"):"—";
      const pct=v=>Number.isFinite(Number(v))?Number(v).toFixed(1)+"%":"—";

      set("#hd-owner-sessions",today.unique_sessions||0);
      set("#hd-owner-pageviews",(today.page_views||0)+" page views");
      set("#hd-owner-product-views",today.product_views||0);
      set("#hd-owner-searches",(today.searches||0)+" searches");
      set("#hd-owner-carts",today.add_to_cart||0);
      set("#hd-owner-cart-rate",pct(today.product_view_to_cart_pct)+" from product views");
      set("#hd-owner-checkouts",today.checkout_starts||0);
      set("#hd-owner-checkout-rate",pct(today.cart_to_checkout_pct)+" from carts");
      set("#hd-owner-orders",today.orders||0);
      set("#hd-owner-gmv",money(today.gross_order_value||0)+" gross value");
      set("#hd-owner-catalog",catalogRes?.launch_unique_products||catalogRes?.unique_product_count||"—");

      set("#hd-owner-next-title",rec.title||"No recommendation");
      set("#hd-owner-next-code",rec.code||"—");
      set("#hd-owner-next-why",rec.why||"");
      set("#hd-owner-next-action",rec.action||"—");

      set("#hd-owner-econ-checks",econ.checks||0);
      set("#hd-owner-econ-pass",econ.verified_pass||0);
      set("#hd-owner-contribution",econ.avg_verified_contribution==null?"—":money(econ.avg_verified_contribution));
      set("#hd-owner-required-orders",goal.required_orders_at_current_verified_avg==null?"—":goal.required_orders_at_current_verified_avg);
      set("#hd-owner-goal-note",goal.note||"No assumptions will be invented.");

      set("#hd-owner-deals",pending.deals_waiting||0);
      set("#hd-owner-merchants",pending.merchants_waiting||0);
      set("#hd-owner-kyc",pending.kyc_waiting||0);
      set("#hd-owner-blocked",pending.command_blocked||0);
      set("#hd-owner-stale",pending.merchant_products_attention||0);
      set("#hd-owner-open",pending.command_open||0);

      const controls=$("#hd-owner-controls");
      if(controls){
        controls.innerHTML=(snap.controls||[]).map(c=>{
          const active=c.enabled===true&&c.owner_approved===true;
          return '<div class="hd-owner-control '+(active?"on":"off")+'"><span></span><div><strong>'+H.esc(c.key)+'</strong><small>'+(active?"ON":"OFF")+' · '+H.esc(c.note||"")+'</small></div></div>';
        }).join("")||'<p>No runtime controls found.</p>';
      }

      const history=$("#hd-owner-history");
      if(history){
        history.innerHTML=(snap.history||[]).map(row=>{
          return '<article><strong>'+H.esc(row.day)+'</strong><span>'+Number(row.unique_sessions||0)+' sessions</span><span>'+Number(row.product_views||0)+' product views</span><span>'+Number(row.add_to_cart||0)+' carts</span><span>'+Number(row.checkout_starts||0)+' checkout</span><span>'+Number(row.orders||0)+' orders</span></article>';
        }).join("")||'<p>No HUNT traffic history yet.</p>';
      }
      set("#hd-owner-generated","Updated "+new Date(data.generated_at).toLocaleString()+" · "+(data.timezone||"Asia/Jerusalem"));
    }catch(error){
      const el=$("#hd-owner-generated");
      if(el)el.textContent=error.message||"Could not load owner snapshot.";
    }
  }

  async function load(){
    const {data:{session}}=await client.auth.getSession();
    if(!session){
      location.replace("auth.html?next="+encodeURIComponent("/deep-hunt-market-site/boom-command-center.html"));
      return;
    }
    const {data:profile}=await client.from("profiles").select("is_admin").eq("id",session.user.id).maybeSingle();
    if(!profile?.is_admin){setStatus("Admin access required.","error");return;}
    const {data,error}=await client.from("hunt_boom_command_queue")
      .select("id,title,workstream,status,priority,impact,effort,cost_mode,blocker,next_action,success_metric,owner_approval_required,evidence_note,updated_at")
      .order("priority",{ascending:false}).order("impact",{ascending:false});
    if(error){setStatus(error.message||"Could not load BOOM queue.","error");return;}
    rows=data||[]; $("#hd-command-dashboard").hidden=false; $("#hd-command-status").hidden=true; render(); await loadOwnerSnapshot();
  }
  document.addEventListener("click",async event=>{
    const button=event.target.closest?.("[data-command-save]");
    if(!button)return;
    const cardEl=button.closest("[data-command-id]"); if(!cardEl)return;
    const field=name=>cardEl.querySelector(`[data-command-field="${name}"]`)?.value;
    button.disabled=true;
    const payload={
      status:field("status"), priority:Number(field("priority"))||3,
      next_action:String(field("next_action")||"").trim(),
      blocker:String(field("blocker")||"").trim()||null,
      updated_at:new Date().toISOString()
    };
    const {data,error}=await client.from("hunt_boom_command_queue").update(payload).eq("id",cardEl.dataset.commandId)
      .select("id,title,workstream,status,priority,impact,effort,cost_mode,blocker,next_action,success_metric,owner_approval_required,evidence_note,updated_at").single();
    if(error){setStatus(error.message||"Could not update task.","error");button.disabled=false;return;}
    const i=rows.findIndex(x=>x.id===data.id); if(i>=0)rows[i]=data; render();
  });
  $("#hd-command-status-filter")?.addEventListener("change",render);
  $("#hd-command-workstream-filter")?.addEventListener("change",render);
  load();
})();