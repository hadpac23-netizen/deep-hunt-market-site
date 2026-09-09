(() => {
  const H=window.HuntCore, sb=window.supabase;
  if(!H||!sb?.createClient)return;
  const client=sb.createClient("https://zszlnahjqmwozwubetkm.supabase.co",H.publishableKey);
  const $=q=>document.querySelector(q);
  let rows=[];

  function label(v){return String(v||"").replaceAll("_"," ")}
  function setStatus(text,tone=""){
    const el=$("#hd-radar-status");
    if(!el)return;
    el.hidden=false;
    el.dataset.tone=tone;
    el.innerHTML="<strong>"+H.esc(text)+"</strong>";
  }
  function filtered(){
    const status=$("#hd-radar-status-filter")?.value||"all";
    const domain=$("#hd-radar-domain-filter")?.value||"all";
    return rows.filter(r=>(status==="all"||r.status===status)&&(domain==="all"||r.domain===domain));
  }
  function card(row){
    return `<article class="hd-radar-card glass" data-radar-id="${H.esc(row.id)}">
      <div class="hd-radar-card-top">
        <div><small>${H.esc(row.domain)} · priority ${H.esc(row.priority)}</small><h2>${H.esc(row.title)}</h2></div>
        <span class="hd-merchant-status ${H.esc(row.status)}">${H.esc(label(row.status))}</span>
      </div>
      <p class="hd-radar-evidence">${H.esc(row.evidence_note||"")}</p>
      <div class="hd-radar-score">
        <span>User value <b>${H.esc(row.user_value)}/5</b></span>
        <span>Complexity <b>${H.esc(row.complexity)}/5</b></span>
        <a href="${H.esc(row.source_url)}" target="_blank" rel="noopener">Official source ↗</a>
      </div>
      ${row.safety_notes?`<p class="hd-radar-safety"><strong>Guardrails:</strong> ${H.esc(row.safety_notes)}</p>`:""}
      <div class="hd-radar-edit">
        <label>Status<select data-radar-field="status">
          ${["scouted","prototype","testing","adopted","blocked","rejected"].map(v=>`<option value="${v}" ${row.status===v?"selected":""}>${label(v)}</option>`).join("")}
        </select></label>
        <label>Priority<select data-radar-field="priority">
          ${[5,4,3,2,1].map(v=>`<option value="${v}" ${Number(row.priority)===v?"selected":""}>${v}</option>`).join("")}
        </select></label>
        <label class="wide">Next action<input data-radar-field="next_action" maxlength="800" value="${H.esc(row.next_action||"")}"></label>
      </div>
      <button class="hd-btn hd-btn-primary" type="button" data-radar-save>Save</button>
    </article>`;
  }
  function render(){
    $("#hd-radar-total").textContent=String(rows.length);
    $("#hd-radar-prototype").textContent=String(rows.filter(r=>r.status==="prototype").length);
    $("#hd-radar-testing").textContent=String(rows.filter(r=>r.status==="testing").length);
    $("#hd-radar-adopted").textContent=String(rows.filter(r=>r.status==="adopted").length);
    const list=filtered();
    $("#hd-radar-board").innerHTML=list.length?list.map(card).join(""):'<div class="hd-review-empty">No ideas match these filters.</div>';
  }
  async function load(){
    const {data:{session}}=await client.auth.getSession();
    if(!session){
      location.replace("auth.html?next="+encodeURIComponent("/deep-hunt-market-site/boom-world-radar.html"));
      return;
    }
    const {data:profile}=await client.from("profiles").select("is_admin").eq("id",session.user.id).maybeSingle();
    if(!profile?.is_admin){setStatus("Admin access required.","error");return;}
    const {data,error}=await client.from("hunt_boom_world_ideas")
      .select("id,title,domain,source_name,source_url,evidence_note,status,priority,user_value,complexity,safety_notes,next_action,last_verified_at,updated_at")
      .order("priority",{ascending:false}).order("user_value",{ascending:false});
    if(error){setStatus(error.message||"Could not load World Radar.","error");return;}
    rows=data||[];
    $("#hd-radar-dashboard").hidden=false;
    $("#hd-radar-status").hidden=true;
    render();
  }
  document.addEventListener("click",async event=>{
    const button=event.target.closest?.("[data-radar-save]");
    if(!button)return;
    const cardEl=button.closest("[data-radar-id]");
    if(!cardEl)return;
    const id=cardEl.dataset.radarId;
    const field=name=>cardEl.querySelector(`[data-radar-field="${name}"]`)?.value;
    button.disabled=true;
    const payload={status:field("status"),priority:Number(field("priority"))||3,next_action:String(field("next_action")||"").trim()||null,updated_at:new Date().toISOString()};
    const {data,error}=await client.from("hunt_boom_world_ideas").update(payload).eq("id",id)
      .select("id,title,domain,source_name,source_url,evidence_note,status,priority,user_value,complexity,safety_notes,next_action,last_verified_at,updated_at").single();
    if(error){setStatus(error.message||"Could not update idea.","error");button.disabled=false;return;}
    const i=rows.findIndex(x=>x.id===id); if(i>=0)rows[i]=data; render();
  });
  $("#hd-radar-status-filter")?.addEventListener("change",render);
  $("#hd-radar-domain-filter")?.addEventListener("change",render);
  load();
})();