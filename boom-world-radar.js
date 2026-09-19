(() => {
  const H=window.HuntCore, sb=window.supabase, runtime=window.BoomRuntime;
  if(!H||!sb?.createClient)return;
  const client=runtime?.getSupabaseClient?.() || sb.createClient("https://zszlnahjqmwozwubetkm.supabase.co",H.publishableKey);
  const $=q=>document.querySelector(q);
  let rows=[];
  let liveSnapshot=null;

  function label(v){return String(v||"").replaceAll("_"," ")}
  function setStatus(text,tone=""){
    const el=$("#hd-radar-status");
    if(!el)return;
    el.hidden=false;
    el.dataset.tone=tone;
    el.innerHTML="<strong>"+H.esc(text)+"</strong>";
  }
  function fmtNumber(v){
    const n=Number(v);
    return Number.isFinite(n)?new Intl.NumberFormat().format(n):"—";
  }
  function fmtMoney(v,currency="USD"){
    const n=Number(v);
    if(!Number.isFinite(n))return "—";
    try{return new Intl.NumberFormat(undefined,{style:"currency",currency}).format(n)}
    catch{return n.toFixed(2)+" "+currency}
  }
  function renderF60T(){
    const root=$("#hd-f60t-live");
    if(!root)return;
    const s=liveSnapshot;
    if(!s){
      $("#hd-f60t-generated").textContent="Unavailable";
      $("#hd-f60t-generated").className="hd-merchant-status blocked";
      $("#hd-f60t-metrics").innerHTML='<div><strong>—</strong><span>No verified snapshot</span></div>';
      return;
    }
    const profit=s.hourly_profit||{};
    const ext=s.external_signals||{};
    $("#hd-f60t-generated").textContent=s.generated_at?"LIVE SNAPSHOT":"OBSERVE";
    $("#hd-f60t-generated").className="hd-merchant-status "+(s.generated_at?"adopted":"scouted");
    $("#hd-f60t-metrics").innerHTML=[
      ["First-party / 24h",fmtNumber(s.first_party_event_count)],
      ["Intent events",fmtNumber(s.recognized_intent_event_count)],
      ["Verified external",fmtNumber(ext.verified_rows)],
      ["Verified net / hour",fmtMoney(profit.verified_net_profit,profit.currency||"USD")]
    ].map(([label,value])=>'<div><strong>'+H.esc(value)+'</strong><span>'+H.esc(label)+'</span></div>').join("");

    const radars=Array.isArray(s.world_watch?.radars)?s.world_watch.radars:[];
    $("#hd-f60t-radars").innerHTML='<p class="hd-radar-evidence"><strong>Radars:</strong> '+
      (radars.length?radars.map(r=>H.esc(label(r.code))+" · "+H.esc(r.state)).join(" · "):"No radar state")+
      '</p>';

    const zones=Array.isArray(s.hot_zones)?s.hot_zones:[];
    $("#hd-f60t-hot-zones").innerHTML=zones.length
      ? '<div class="hd-command-tags">'+zones.slice(0,8).map(z=>{
          const place=[z.country_code,z.platform,z.category].filter(Boolean).join(" · ");
          return '<span>'+H.esc(place||"aggregate signal")+' · intent '+H.esc(z.intent_score_avg)+'</span>';
        }).join("")+'</div>'
      : '<p class="hd-radar-safety"><strong>Hot zones:</strong> none verified yet.</p>';

    const sources=Array.isArray(s.sources)?s.sources:[];
    $("#hd-f60t-sources").innerHTML=sources.length
      ? '<p class="hd-radar-evidence"><strong>Sources:</strong> '+sources.map(x=>H.esc(x.source_key)+"="+H.esc(x.status)).join(" · ")+'</p>'
      : '<p class="hd-radar-evidence"><strong>Sources:</strong> no source registry returned.</p>';

    if(Array.isArray(s.errors)&&s.errors.length){
      $("#hd-f60t-sources").innerHTML+='<p class="hd-radar-safety"><strong>Snapshot warnings:</strong> '+H.esc(s.errors.join(" · "))+'</p>';
    }
  }
  async function loadF60T(session){
    try{
      const res=await fetch(H.functionsBase+"/hunt-f60t-snapshot",{
        method:"POST",
        cache:"no-store",
        headers:{
          apikey:H.publishableKey,
          Authorization:"Bearer "+session.access_token,
          "Content-Type":"application/json"
        },
        body:"{}"
      });
      const data=await res.json().catch(()=>({}));
      if(!res.ok||data?.ok!==true)throw new Error(data?.error||"F60T snapshot unavailable");
      liveSnapshot=data;
    }catch(error){
      liveSnapshot=null;
      console.warn("F60T snapshot:",error);
    }
    renderF60T();
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
    await loadF60T(session);
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
    const payload={status:field("status"),priority:Number(field("priority"))||3,next_action:String(field("next_action")||"").trim()||null,updated_at:new Date().toISOString()};
    const run=runtime?.runAction ? runtime.runAction.bind(runtime) : async (_id,opts)=>opts.execute({});
    try{
      const data=await run("boom.radar.save",{
        key:id,element:button,broadcastSuccess:false,successDetail:{radar_id:id,status:payload.status},
        execute:async()=>{
          const {data,error}=await client.from("hunt_boom_world_ideas").update(payload).eq("id",id)
            .select("id,title,domain,source_name,source_url,evidence_note,status,priority,user_value,complexity,safety_notes,next_action,last_verified_at,updated_at").single();
          if(error)throw error; return data;
        }
      });
      const i=rows.findIndex(x=>x.id===id); if(i>=0)rows[i]=data; render();
    }catch(error){setStatus(error.message||"Could not update idea.","error");}
  });
  $("#hd-radar-status-filter")?.addEventListener("change",event=>{runtime?.emit?.("filter.apply",{surface:"world_radar",filter:"status",value:String(event.currentTarget.value||"")},{broadcast:false});render();});
  $("#hd-radar-domain-filter")?.addEventListener("change",event=>{runtime?.emit?.("filter.apply",{surface:"world_radar",filter:"domain",value:String(event.currentTarget.value||"")},{broadcast:false});render();});
  load();
})();