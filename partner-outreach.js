(() => {
  const H=window.HuntCore, sb=window.supabase;
  if(!H||!sb?.createClient)return;
  const client=sb.createClient("https://zszlnahjqmwozwubetkm.supabase.co",H.publishableKey);
  const $=q=>document.querySelector(q);
  let rows=[];

  function setStatus(text,tone=""){
    const el=$("#hd-partner-status");
    if(!el)return;
    el.hidden=false;
    el.innerHTML=`<strong>${H.esc(text)}</strong>`;
    el.dataset.tone=tone;
  }

  function statusLabel(value){
    return String(value||"").replaceAll("_"," ");
  }

  function card(row){
    const contact=row.contact_email
      ? `<a href="mailto:${H.esc(row.contact_email)}">${H.esc(row.contact_email)}</a>`
      : '<span>No direct email listed</span>';
    return `<article class="hd-partner-card glass" data-partner-id="${H.esc(row.id)}">
      <div class="hd-partner-card-top">
        <div>
          <small>${H.esc(row.opportunity_type)} · priority ${H.esc(row.priority)}</small>
          <h2>${H.esc(row.name)}</h2>
        </div>
        <span class="hd-merchant-status ${H.esc(row.status)}">${H.esc(statusLabel(row.status))}</span>
      </div>

      <div class="hd-partner-links">
        <a href="${H.esc(row.program_url)}" target="_blank" rel="noopener">Official program ↗</a>
        ${contact}
        ${row.network_hint?`<span>${H.esc(row.network_hint)}</span>`:""}
      </div>

      <p class="hd-partner-evidence">${H.esc(row.evidence_note||"")}</p>

      <div class="hd-partner-edit-grid">
        <label>Status
          <select data-partner-field="status">
            ${["not_contacted","contacted","replied","in_review","approved","rejected","paused","live"].map(v=>`<option value="${v}" ${row.status===v?"selected":""}>${statusLabel(v)}</option>`).join("")}
          </select>
        </label>
        <label>Priority
          <select data-partner-field="priority">
            ${[5,4,3,2,1].map(v=>`<option value="${v}" ${Number(row.priority)===v?"selected":""}>${v}</option>`).join("")}
          </select>
        </label>
        <label class="wide">Next action
          <input data-partner-field="next_action" maxlength="500" value="${H.esc(row.next_action||"")}">
        </label>
        <label class="wide">Notes
          <textarea data-partner-field="notes" maxlength="5000" rows="3">${H.esc(row.notes||"")}</textarea>
        </label>
      </div>

      <div class="hd-partner-card-actions">
        <button class="hd-btn hd-btn-primary" type="button" data-partner-save>Save</button>
        ${row.status==="not_contacted"?'<button class="hd-btn" type="button" data-partner-contacted>Mark contacted</button>':""}
      </div>
    </article>`;
  }

  function filteredRows(){
    const status=$("#hd-partner-status-filter")?.value||"all";
    const priority=$("#hd-partner-priority-filter")?.value||"all";
    return rows.filter(row=>(status==="all"||row.status===status)&&(priority==="all"||String(row.priority)===priority));
  }

  function render(){
    const total=rows.length;
    $("#hd-partner-total").textContent=String(total);
    $("#hd-partner-open").textContent=String(rows.filter(r=>["not_contacted","contacted","replied"].includes(r.status)).length);
    $("#hd-partner-review").textContent=String(rows.filter(r=>r.status==="in_review").length);
    $("#hd-partner-live").textContent=String(rows.filter(r=>r.status==="live").length);

    const list=filteredRows();
    $("#hd-partner-board").innerHTML=list.length?list.map(card).join(""):'<div class="hd-review-empty">No partners match these filters.</div>';
  }
  async function load(){
    const {data:{session}}=await client.auth.getSession();
    if(!session){
      location.replace("auth.html?next="+encodeURIComponent("/deep-hunt-market-site/partner-outreach.html"));
      return;
    }

    const {data:profile,error:profileError}=await client.from("profiles").select("is_admin").eq("id",session.user.id).maybeSingle();
    if(profileError||!profile?.is_admin){
      setStatus("Admin access required.","error");
      return;
    }

    const {data,error}=await client.from("hunt_partner_leads")
      .select("id,name,opportunity_type,program_url,contact_email,network_hint,status,verification_status,priority,evidence_note,last_verified_at,last_contacted_at,next_action,notes,updated_at")
      .order("priority",{ascending:false})
      .order("name",{ascending:true});

    if(error){
      setStatus(error.message||"Could not load partner pipeline.","error");
      return;
    }

    rows=data||[];
    $("#hd-partner-dashboard").hidden=false;
    $("#hd-partner-status").hidden=true;
    render();
  }

  async function saveCard(cardEl,markContacted=false){
    const id=cardEl?.dataset.partnerId;
    if(!id)return;

    const field=name=>cardEl.querySelector(`[data-partner-field="${name}"]`)?.value;
    const payload={
      status:markContacted?"contacted":field("status"),
      priority:Number(field("priority"))||3,
      next_action:String(field("next_action")||"").trim()||null,
      notes:String(field("notes")||"").trim(),
      updated_at:new Date().toISOString()
    };
    if(markContacted)payload.last_contacted_at=new Date().toISOString();

    const {data,error}=await client.from("hunt_partner_leads")
      .update(payload)
      .eq("id",id)
      .select("id,name,opportunity_type,program_url,contact_email,network_hint,status,verification_status,priority,evidence_note,last_verified_at,last_contacted_at,next_action,notes,updated_at")
      .single();

    if(error)throw error;
    const index=rows.findIndex(x=>x.id===id);
    if(index>=0)rows[index]=data;
    render();
  }

  document.addEventListener("click",async event=>{
    const save=event.target.closest?.("[data-partner-save]");
    const contacted=event.target.closest?.("[data-partner-contacted]");
    if(!save&&!contacted)return;

    const cardEl=event.target.closest("[data-partner-id]");
    const button=save||contacted;
    button.disabled=true;
    try{
      await saveCard(cardEl,Boolean(contacted));
    }catch(error){
      setStatus(error.message||"Could not update partner.","error");
      button.disabled=false;
    }
  });

  $("#hd-partner-status-filter")?.addEventListener("change",render);
  $("#hd-partner-priority-filter")?.addEventListener("change",render);

  load();
})();