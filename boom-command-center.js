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
    rows=data||[]; $("#hd-command-dashboard").hidden=false; $("#hd-command-status").hidden=true; render();
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