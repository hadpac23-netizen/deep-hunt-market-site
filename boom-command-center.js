(() => {
  const H=window.HuntCore, runtime=window.BoomRuntime;
  if(!H||!runtime?.getSupabaseClient)return;
  const client=runtime.getSupabaseClient();
  if(!client)return;
  const $=q=>document.querySelector(q);
  let rows=[], readiness=null, launchContract=null, perfReadiness=null, liveLaunchMetrics=null;

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

  async function fetchJson(path){
    const response=await fetch(path,{cache:"no-store"});
    if(!response.ok)throw new Error("HTTP "+response.status+" "+path);
    return response.json();
  }
  function launchSeverity(status){
    const s=String(status||"UNKNOWN").toUpperCase();
    if(/^(BLOCKED|STALE|NOT_)|FAIL/.test(s))return 4;
    if(/PENDING|NEEDS|IN_PROGRESS|UNKNOWN|PLANNED/.test(s))return 3;
    if(/^CODED|SHADOW|TESTING_ONLY/.test(s))return 2;
    if(/DONE|PASS|READY/.test(s))return 0;
    return 2;
  }
  function launchTone(status){
    const n=launchSeverity(status);
    return n>=4?"blocked":n>=2?"review":"done";
  }
  function metricCard(value,label,detail=""){
    return '<article><strong>'+H.esc(value)+'</strong><span>'+H.esc(label)+'</span>'+(detail?'<small>'+H.esc(detail)+'</small>':"")+'</article>';
  }
  async function loadLiveLaunchMetrics(){
    const cutoff=new Date(Date.now()-86400000).toISOString();
    const results=await Promise.allSettled([
      client.from("hunt_orders").select("id,total_amount,currency,is_test").eq("is_test",false).limit(1000),
      client.from("hunt_order_finance_ledger").select("id,currency,available_profit,is_test").eq("is_test",false).limit(1000),
      client.from("hunt_boom_team_runs").select("id,status,created_at").gte("created_at",cutoff).limit(1000),
      client.from("hunt_boom_decisions").select("id,status,owner_approval_required,created_at").eq("owner_approval_required",true).limit(1000)
    ]);
    const data=i=>results[i]?.status==="fulfilled"&&!results[i].value?.error?(results[i].value.data||[]):null;
    const orders=data(0),finance=data(1),runs=data(2),decisions=data(3);
    const sessions=null;
    const currencies=finance===null?[]:[...new Set(finance.map(x=>String(x.currency||"").toUpperCase()).filter(Boolean))];
    const profit=finance===null?null:finance.reduce((sum,x)=>sum+(Number(x.available_profit)||0),0);
    const resolved=new Set(["approved","rejected","done","completed","cancelled","canceled"]);
    const pending=decisions===null?null:decisions.filter(x=>!resolved.has(String(x.status||"").toLowerCase())).length;
    return {
      internal_sessions_24h:sessions,
      real_orders:orders===null?null:orders.length,
      real_finance_rows:finance===null?null:finance.length,
      realized_profit:profit,
      realized_profit_currency:currencies.length===1?currencies[0]:(currencies.length===0?"USD":"MULTI"),
      automation_runs_24h:runs===null?null:runs.length,
      owner_gate_pending:pending
    };
  }
  function renderLaunchCommandCenter(){
    const overall=$("#hd-launch-overall"),metrics=$("#hd-launch-live-metrics"),grid=$("#hd-launch-domain-grid");
    const blockers=$("#hd-launch-blockers"),perf=$("#hd-launch-performance");
    if(!overall||!metrics||!grid||!blockers||!perf)return;
    if(!readiness||!launchContract){
      overall.textContent="READINESS UNAVAILABLE";
      overall.className="hd-merchant-status blocked";
      grid.innerHTML='<div class="hd-review-empty">Canonical readiness files are unavailable.</div>';
      return;
    }
    overall.textContent=String(readiness.overall||"UNKNOWN").replaceAll("_"," ");
    overall.className="hd-merchant-status "+launchTone(readiness.overall);
    const m=liveLaunchMetrics||{};
    const val=v=>v===null||v===undefined?"UNKNOWN":String(v);
    const profit=m.realized_profit===null||m.realized_profit===undefined?"UNKNOWN":(m.realized_profit_currency==="MULTI"?"MULTI":m.realized_profit_currency+" "+Number(m.realized_profit).toLocaleString(undefined,{maximumFractionDigits:2}));
    metrics.innerHTML=[
      metricCard(val(m.internal_sessions_24h),"Internal sessions · 24h","UNKNOWN until server-side aggregate is connected"),
      metricCard(val(m.real_orders),"Real orders","is_test=false only"),
      metricCard(val(m.real_finance_rows),"Real finance rows","Test ledger excluded"),
      metricCard(profit,"Realized profit","Finance evidence only"),
      metricCard(val(m.automation_runs_24h),"Automation runs · 24h","Canonical team-run ledger"),
      metricCard(val(m.owner_gate_pending),"Owner Gates pending","Unresolved material decisions")
    ].join("");
    const areas=new Map((readiness.areas||[]).map(x=>[x.id,x]));
    grid.innerHTML=(launchContract.domains||[]).map(domain=>{
      const rows=(domain.area_ids||[]).map(id=>areas.get(id)).filter(Boolean);
      const worst=rows.slice().sort((a,b)=>launchSeverity(b.status)-launchSeverity(a.status))[0]||{status:"UNKNOWN",evidence:"No readiness evidence"};
      return '<article class="hd-launch-domain" data-tone="'+launchTone(worst.status)+'">'+
        '<div class="hd-command-card-top"><div><small>'+H.esc(domain.owner||"")+'</small><h3>'+H.esc(domain.label||domain.id)+'</h3></div>'+
        '<span class="hd-merchant-status '+launchTone(worst.status)+'">'+H.esc(String(worst.status||"UNKNOWN").replaceAll("_"," "))+'</span></div>'+
        '<p>'+H.esc(worst.evidence||"No evidence available.")+'</p>'+
        '<div class="hd-launch-domain-sources">'+rows.map(x=>'<span>'+H.esc(x.id)+': '+H.esc(x.status)+'</span>').join("")+'</div></article>';
    }).join("");
    blockers.innerHTML=(readiness.blockers||[]).slice(0,10).map((b,i)=>'<article><b>'+(i+1)+'</b><span>'+H.esc(b)+'</span></article>').join("")||'<div class="hd-review-empty">No blockers recorded.</div>';
    const p=perfReadiness?.current_truth||{};
    const mob=p.mobile_390||{},tab=p.tablet_768||{};
    perf.innerHTML=[
      metricCard(val(mob.dom_nodes),"390px DOM nodes","Budget ≤ "+val(perfReadiness?.budgets?.mobile_390?.max_initial_dom_nodes)),
      metricCard(val(mob.images),"390px images","Budget ≤ "+val(perfReadiness?.budgets?.mobile_390?.max_initial_images)),
      metricCard(val(mob.shelf_cards),"Initial shelf cards","Progressive mounting"),
      metricCard(val(mob.small_touch_targets),"Small touch targets","Target = 0"),
      metricCard(val(tab.dom_nodes),"768px DOM nodes","Structural QA"),
      metricCard(p.pwa_preview_proof?"PASS":"PENDING","PWA Preview proof","Update/install/offline")
    ].join("");
  }

  async function load(){
    const {data:{session}}=await client.auth.getSession();
    if(!session){
      location.replace("auth.html?next="+encodeURIComponent("/deep-hunt-market-site/boom-command-center.html"));
      return;
    }
    const {data:profile}=await client.from("profiles").select("is_admin").eq("id",session.user.id).maybeSingle();
    if(!profile?.is_admin){setStatus("Admin access required.","error");return;}
    const [queueResult,readinessResult,launchResult,perfResult,metricsResult]=await Promise.all([
      client.from("hunt_boom_command_queue")
        .select("id,title,workstream,status,priority,impact,effort,cost_mode,blocker,next_action,success_metric,owner_approval_required,evidence_note,updated_at")
        .order("priority",{ascending:false}).order("impact",{ascending:false}),
      fetchJson("boom-control-plane-readiness.json").catch(()=>null),
      fetchJson("boom-launch-command-center-contract.json").catch(()=>null),
      fetchJson("boom-performance-mobile-readiness-contract.json").catch(()=>null),
      loadLiveLaunchMetrics().catch(()=>null)
    ]);
    if(queueResult.error){setStatus(queueResult.error.message||"Could not load BOOM queue.","error");return;}
    rows=queueResult.data||[];
    readiness=readinessResult; launchContract=launchResult; perfReadiness=perfResult; liveLaunchMetrics=metricsResult;
    $("#hd-command-dashboard").hidden=false; $("#hd-command-status").hidden=true;
    renderLaunchCommandCenter(); render();
  }
  document.addEventListener("click",async event=>{
    const button=event.target.closest?.("[data-command-save]");
    if(!button)return;
    const cardEl=button.closest("[data-command-id]"); if(!cardEl)return;
    const field=name=>cardEl.querySelector(`[data-command-field="${name}"]`)?.value;
    const payload={
      status:field("status"), priority:Number(field("priority"))||3,
      next_action:String(field("next_action")||"").trim(),
      blocker:String(field("blocker")||"").trim()||null,
      updated_at:new Date().toISOString()
    };
    const run=runtime?.runAction ? runtime.runAction.bind(runtime) : async (_id,opts)=>opts.execute({});
    try{
      const data=await run("boom.command.save",{
        key:cardEl.dataset.commandId,element:button,broadcastSuccess:false,
        successDetail:{command_id:cardEl.dataset.commandId,status:payload.status},
        execute:async()=>{
          const {data,error}=await client.from("hunt_boom_command_queue").update(payload).eq("id",cardEl.dataset.commandId)
            .select("id,title,workstream,status,priority,impact,effort,cost_mode,blocker,next_action,success_metric,owner_approval_required,evidence_note,updated_at").single();
          if(error)throw error; return data;
        }
      });
      const i=rows.findIndex(x=>x.id===data.id); if(i>=0)rows[i]=data; render();
    }catch(error){setStatus(error.message||"Could not update task.","error");}
  });
  $("#hd-command-status-filter")?.addEventListener("change",event=>{runtime?.emit?.("filter.apply",{surface:"command_center",filter:"status",value:String(event.currentTarget.value||"")},{broadcast:false});render();});
  $("#hd-command-workstream-filter")?.addEventListener("change",event=>{runtime?.emit?.("filter.apply",{surface:"command_center",filter:"workstream",value:String(event.currentTarget.value||"")},{broadcast:false});render();});
  load();
})();