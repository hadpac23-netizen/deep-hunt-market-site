(() => {
  const H=window.HuntCore, sb=window.supabase;
  if(!H||!sb?.createClient)return;
  const client=sb.createClient("https://zszlnahjqmwozwubetkm.supabase.co",H.publishableKey);
  const $=q=>document.querySelector(q);
  let rows=[];

  function label(v){return String(v||"").replaceAll("_"," ")}
  function setStatus(text,tone=""){
    const el=$("#hd-marketing-lab-status");
    if(!el)return;
    el.hidden=false; el.dataset.tone=tone;
    el.innerHTML="<strong>"+H.esc(text)+"</strong>";
  }
  function card(row){
    const paidLock=row.paid && row.owner_approval_status!=="approved";
    return `<article class="hd-command-card glass" data-exp-id="${H.esc(row.id)}">
      <div class="hd-command-card-top">
        <div>
          <small>${H.esc(row.channel)} · ${H.esc(row.objective)}</small>
          <h2>${H.esc(row.title)}</h2>
        </div>
        <span class="hd-merchant-status ${H.esc(row.status)}">${H.esc(label(row.status))}</span>
      </div>
      <div class="hd-command-tags">
        <span>KPI: ${H.esc(row.primary_kpi)}</span>
        <span>${row.paid?"PAID":"FREE"}</span>
        ${paidLock?'<span class="hd-command-approval">LOCKED · OWNER APPROVAL</span>':""}
      </div>
      <p class="hd-command-next"><strong>Hypothesis:</strong> ${H.esc(row.hypothesis||"")}</p>
      <p class="hd-command-metric"><strong>Audience:</strong> ${H.esc(row.audience_intent||"")}</p>
      <p class="hd-command-metric"><strong>Control:</strong> ${H.esc(row.control_description||"")}</p>
      <p class="hd-command-metric"><strong>Treatment:</strong> ${H.esc(row.treatment_description||"")}</p>
      <p class="hd-command-blocker"><strong>Guardrails:</strong> ${H.esc(row.guardrails||"")}</p>
      <div class="hd-command-edit">
        <label>Status<select data-exp-field="status">
          ${["draft","ready","testing","paused","won","lost","inconclusive","archived"].map(v=>`<option value="${v}" ${row.status===v?"selected":""}>${label(v)}</option>`).join("")}
        </select></label>
        <label>Approval<select data-exp-field="owner_approval_status" ${row.paid?"":"disabled"}>
          ${["not_required","required","approved","rejected"].map(v=>`<option value="${v}" ${row.owner_approval_status===v?"selected":""}>${label(v)}</option>`).join("")}
        </select></label>
        <label class="wide">Result summary<textarea data-exp-field="result_summary" rows="3" maxlength="3000">${H.esc(row.result_summary||"")}</textarea></label>
        <label>Winner<select data-exp-field="winner">
          <option value="">None yet</option>
          ${["control","treatment","none"].map(v=>`<option value="${v}" ${row.winner===v?"selected":""}>${label(v)}</option>`).join("")}
        </select></label>
      </div>
      <button class="hd-btn hd-btn-primary" type="button" data-exp-save>Save experiment</button>
    </article>`;
  }
  function render(){
    $("#hd-ml-total").textContent=String(rows.length);
    $("#hd-ml-ready").textContent=String(rows.filter(r=>r.status==="ready").length);
    $("#hd-ml-testing").textContent=String(rows.filter(r=>r.status==="testing").length);
    $("#hd-ml-won").textContent=String(rows.filter(r=>r.status==="won").length);
    $("#hd-ml-paid-locked").textContent=String(rows.filter(r=>r.paid&&r.owner_approval_status!=="approved").length);
    $("#hd-marketing-experiments").innerHTML=rows.length?rows.map(card).join(""):'<div class="hd-review-empty">No experiments yet.</div>';
  }
  async function load(){
    const {data:{session}}=await client.auth.getSession();
    if(!session){
      location.replace("auth.html?next="+encodeURIComponent("/deep-hunt-market-site/boom-marketing-lab.html"));
      return;
    }
    const {data:profile}=await client.from("profiles").select("is_admin").eq("id",session.user.id).maybeSingle();
    if(!profile?.is_admin){setStatus("Admin access required.","error");return;}
    const {data,error}=await client.from("hunt_marketing_experiments")
      .select("id,title,channel,objective,paid,owner_approval_status,status,hypothesis,audience_intent,control_description,treatment_description,primary_kpi,guardrails,min_sample_size,result_summary,winner,starts_at,ends_at,updated_at")
      .order("created_at",{ascending:true});
    if(error){setStatus(error.message||"Could not load experiments.","error");return;}
    rows=data||[];
    $("#hd-marketing-lab-dashboard").hidden=false;
    $("#hd-marketing-lab-status").hidden=true;
    render();
  }
  document.addEventListener("click",async event=>{
    const button=event.target.closest?.("[data-exp-save]");
    if(!button)return;
    const cardEl=button.closest("[data-exp-id]"); if(!cardEl)return;
    const field=name=>cardEl.querySelector(`[data-exp-field="${name}"]`);
    const current=rows.find(x=>x.id===cardEl.dataset.expId); if(!current)return;
    const status=field("status")?.value||current.status;
    const approval=current.paid?(field("owner_approval_status")?.value||current.owner_approval_status):"not_required";
    if(current.paid && status==="testing" && approval!=="approved"){
      setStatus("Paid experiments cannot enter Testing until owner approval is Approved.","error");
      return;
    }
    button.disabled=true;
    const payload={
      status,
      owner_approval_status:approval,
      result_summary:String(field("result_summary")?.value||"").trim(),
      winner:field("winner")?.value||null,
      updated_at:new Date().toISOString()
    };
    const {data,error}=await client.from("hunt_marketing_experiments").update(payload).eq("id",current.id)
      .select("id,title,channel,objective,paid,owner_approval_status,status,hypothesis,audience_intent,control_description,treatment_description,primary_kpi,guardrails,min_sample_size,result_summary,winner,starts_at,ends_at,updated_at").single();
    if(error){setStatus(error.message||"Could not save experiment.","error");button.disabled=false;return;}
    const i=rows.findIndex(x=>x.id===data.id); if(i>=0)rows[i]=data;
    $("#hd-marketing-lab-status").hidden=true;
    render();
  });
  load();
})();