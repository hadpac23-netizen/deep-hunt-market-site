(() => {
  "use strict";
  const H=window.HuntCore, sb=window.supabase;
  if(!H||!sb?.createClient)return;

  const URL="https://zszlnahjqmwozwubetkm.supabase.co";
  const client=sb.createClient(URL,H.publishableKey);
  const $=q=>document.querySelector(q);
  const $$=q=>[...document.querySelectorAll(q)];
  const state={managers:[],workers:[],workerReports:[],reports:[],events:[],decisions:[],commands:[],cycles:[],evals:[],learning:[],chat:[],latest:new Map(),workerLatest:new Map(),session:null,channel:null};
  const conversationKey="hunt_boom_cloud_conversation_v1";
  const conversationId=localStorage.getItem(conversationKey)||crypto.randomUUID();
  localStorage.setItem(conversationKey,conversationId);
  let refreshTimer=null;

  const statusRank={critical:6,blocked:5,watch:4,healthy:3,working:2,offline:1};
  const impactRank={critical:5,high:4,medium:3,low:2};
  const groupOrder=[
    ["top","Meta / Super"],
    ["executive","Executive"],
    ["revenue","Sales · Profit · Growth"],
    ["suppliers","Suppliers"],
    ["commerce","Commerce Operations"],
    ["system","System & Trust"],
    ["f35","F35 Research & Acquisition"],
    ["departments","Department Managers"]
  ];

  function esc(v){return H.esc?.(v)??String(v??"")}
  function timeAgo(value){
    if(!value)return "אין דיווח";
    const d=new Date(value), seconds=Math.max(0,(Date.now()-d.getTime())/1000);
    if(seconds<60)return "עכשיו";
    if(seconds<3600)return Math.floor(seconds/60)+" דק׳";
    if(seconds<86400)return Math.floor(seconds/3600)+" שע׳";
    return Math.floor(seconds/86400)+" ימים";
  }
  function money(v){
    const n=Number(v);
    return Number.isFinite(n)?new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n):"$0";
  }
  function label(v){return String(v||"").replaceAll("_"," ").replaceAll("-"," ")}
  function getReport(id){return state.latest.get(id)||null}
  function metricsHtml(metrics={}){
    return Object.entries(metrics||{}).slice(0,6).map(([k,v])=>"<span>"+esc(label(k))+": "+esc(v)+"</span>").join("");
  }
  function statusOf(manager){
    const report=getReport(manager.id);
    return report?.status||manager.status||"offline";
  }
  function managerGroup(m){
    if(["boom-meta-f35","boom-super-agent"].includes(m.id))return "top";
    if(m.id==="boom-executive")return "executive";
    if(["sales-director","pricing-profit","finance-reconciliation","marketing-growth","feedback-intelligence","daily-10k-mission"].includes(m.id))return "revenue";
    if(m.id.startsWith("supplier-")||m.id==="supplier-shipping")return "suppliers";
    if(["category-orchestrator","inventory-truth","sale-readiness","checkout-payment","dynamic-merchandising","merchandising-ux","returns-care","country-localization"].includes(m.id))return "commerce";
    if(["site-reliability","repair-engineering","integration-connections","release-control","security-access","trust-compliance","analytics-truth"].includes(m.id))return "system";
    if(m.id.startsWith("f35-"))return "f35";
    if(m.id.startsWith("dept-"))return "departments";
    return "commerce";
  }
  function buildLatest(){
    state.latest=new Map();
    state.workerLatest=new Map();
    for(const r of state.reports){
      if(!state.latest.has(r.manager_id))state.latest.set(r.manager_id,r);
    }
    for(const r of state.workerReports){
      if(!state.workerLatest.has(r.worker_id))state.workerLatest.set(r.worker_id,r);
    }
  }
  function sortAttention(rows){
    return [...rows].sort((a,b)=>
      (statusRank[b.status]||0)-(statusRank[a.status]||0) ||
      (impactRank[b.expected_impact]||0)-(impactRank[a.expected_impact]||0) ||
      new Date(b.created_at)-new Date(a.created_at)
    );
  }

  function renderSummary(){
    const managers=state.managers;
    const reports=[...state.latest.values()];
    const attention=reports.filter(r=>["critical","blocked","watch"].includes(r.status));
    const critical=reports.filter(r=>r.status==="critical").length;
    const blocked=reports.filter(r=>r.status==="blocked").length;
    const watch=reports.filter(r=>r.status==="watch").length;
    const exec=critical?"CRITICAL":blocked?"BLOCKED":watch?"WATCH":"HEALTHY";
    const execEl=$("#bc-exec-status");
    execEl.textContent=exec;
    execEl.className="bc-exec-"+exec.toLowerCase();
    $("#bc-exec-note").textContent=critical?critical+" קריטיים":blocked?blocked+" חסומים":watch?watch+" דורשים תשומת לב":"המערכת יציבה לפי הדוחות האחרונים";
    $("#bc-manager-count").textContent=String(managers.length);
    $("#bc-manager-watch").textContent=state.workers.length+" workers · "+attention.length+" דורשים תשומת לב";
    $("#bc-report-count").textContent=String(reports.length);
    const last=reports.map(r=>r.created_at).filter(Boolean).sort().at(-1);
    $("#bc-last-pulse").textContent=last?"Pulse לפני "+timeAgo(last):"אין pulse";

    const mission=getReport("daily-10k-mission");
    const profit=Number(mission?.metrics?.available_profit_today||0);
    const gap=Number(mission?.metrics?.gap||Math.max(0,10000-profit));
    $("#bc-profit-today").textContent=money(profit);
    $("#bc-profit-gap").textContent="פער: "+money(gap);

    const top=sortAttention(attention)[0];
    $("#bc-top-issue").textContent=top?(top.issues?.[0]||top.manager_id):"אין חסימה קריטית כרגע";
    $("#bc-top-action").textContent=top?.recommended_action||"BOOM ממשיך לעקוב אחרי כל המחלקות.";
    $("#bc-boom-pill").textContent=exec;
    $("#bc-boom-pill").className="bc-status-pill "+exec.toLowerCase();

    const approvals=state.decisions.filter(d=>d.owner_approval_required&&["proposed","blocked"].includes(d.status));
    $("#bc-approval-count").textContent=String(approvals.length);
  }

  function focusCard(id,title){
    const m=state.managers.find(x=>x.id===id)||{id,name:title,status:"offline"};
    const r=getReport(id);
    const status=r?.status||m.status||"offline";
    const issue=r?.issues?.[0]||"אין בעיה מדווחת כרגע.";
    return `<article class="bc-focus-card" data-manager-id="${esc(id)}">
      <header><div><small>${esc(m.department||"")}</small><h3>${esc(title||m.name)}</h3></div><span class="bc-status-pill ${esc(status)}">${esc(status.toUpperCase())}</span></header>
      <div class="bc-focus-metrics">${metricsHtml(r?.metrics||{})}</div>
      <p>${esc(issue)}</p>
      <p><strong>Next:</strong> ${esc(r?.recommended_action||"ממתין לדוח חי.")}</p>
    </article>`;
  }
  function renderSuppliers(){
    $("#bc-suppliers").innerHTML=[
      focusCard("supplier-cj","CJ Supplier Manager"),
      focusCard("supplier-eprolo","EPROLO Supplier Manager")
    ].join("");
  }
  function renderF35(){
    $("#bc-f35").innerHTML=[
      focusCard("f35-research","F35 Research & Learning"),
      focusCard("f35-acquisition","F35 Buyer Acquisition"),
      focusCard("daily-10k-mission","Daily $10K+ Mission")
    ].join("");
  }


  function renderSuperStack(){
    const open=state.commands.filter(c=>["queued","accepted","running","waiting_owner"].includes(c.status));
    const owner=open.filter(c=>c.owner_approval_required||c.status==="waiting_owner");
    const set=(id,value)=>{const el=$(id);if(el)el.textContent=value};
    set("#bc-learning-count",state.learning.length+" learnings");
    set("#bc-cycle-count",state.cycles.length+" cycles");
    set("#bc-eval-count",state.evals.length+" evals");
    set("#bc-command-count",state.commands.length+" commands");
    set("#bc-command-open",open.length+" open");
    set("#bc-command-owner",owner.length+" owner");
    set("#bc-stack-managers",state.managers.length+" managers");
    set("#bc-stack-workers",state.workers.length+" workers");
  }

  function renderCommands(){
    const rows=[...state.commands].sort((a,b)=>Number(b.priority||0)-Number(a.priority||0)||new Date(b.created_at)-new Date(a.created_at)).slice(0,40);
    const open=rows.filter(c=>["queued","accepted","running","waiting_owner"].includes(c.status)).length;
    $("#bc-command-summary").textContent=open+" פתוחות";
    $("#bc-commands").innerHTML=rows.length?rows.map(c=>\`<article class="bc-command">
      <div class="bc-command-priority">\${esc(c.priority||3)}</div>
      <div><strong>\${esc(c.title)}</strong><p>\${esc(c.instruction)}</p><small>\${esc(c.issued_by)} → \${esc(c.target_manager_id)} · \${esc(c.action_class)}</small></div>
      <span class="bc-status-pill \${c.status==="waiting_owner"?"watch":c.status==="failed"?"critical":"healthy"}">\${esc(c.status)}</span>
    </article>\`).join(""):'<div class="bc-empty">אין עדיין פקודות BOOM.</div>';
  }

  function renderLearning(){
    $("#bc-learning-summary").textContent=state.learning.length+" learning items";
    const learn=state.learning.slice(0,16);
    $("#bc-learning").innerHTML=learn.length?learn.map(x=>\`<article class="bc-learning-item">
      <small>\${esc(x.domain)} · \${esc(x.source_name)}</small>
      <strong>\${esc(x.title)}</strong>
      <p>\${esc(x.principle)}</p>
      <p><b>HUNT:</b> \${esc(x.hunt_application)}</p>
    </article>\`).join(""):'<div class="bc-empty">אין learning items.</div>';
    const cycles=state.cycles.slice(0,10);
    $("#bc-cycles").innerHTML=cycles.length?cycles.map(c=>{
      const evalRow=state.evals.find(e=>e.cycle_id===c.id);
      const evalText=evalRow?(evalRow.passed===true?"PASS":evalRow.passed===false?"FAIL":"OPEN"):"NO EVAL";
      return \`<article class="bc-cycle-item"><small>\${esc(c.status)} · \${esc(evalText)}</small><strong>\${esc(c.focus)}</strong><p>\${esc(c.hypothesis)}</p></article>\`;
    }).join(""):'<div class="bc-empty">אין improvement cycles.</div>';
  }

  function managerCard(m){
    const r=getReport(m.id);
    const status=statusOf(m);
    const issue=r?.issues?.[0]||r?.opportunity||"ממתין לדוח/אין בעיה פתוחה.";
    const workers=state.workers.filter(w=>w.manager_id===m.id);
    return `<article class="bc-manager-card" data-manager-id="${esc(m.id)}" data-status="${esc(status)}">
      <header><div><h4>${esc(m.name)}</h4><small>${esc(m.department)} · reports to ${esc(m.reports_to||"OWNER")}</small></div><span class="bc-manager-state">${esc(status)}</span></header>
      <p>${esc(issue)}</p>
      <footer><span>${esc(timeAgo(r?.created_at||m.last_report_at))}</span><span>${workers.length} workers · ${r?esc(r.action_class):"NO REPORT"}</span></footer>
    </article>`;
  }
  function renderOrg(){
    const q=String($("#bc-manager-search")?.value||"").toLowerCase();
    const filter=$("#bc-status-filter")?.value||"all";
    const visible=state.managers.filter(m=>{
      const text=(m.name+" "+m.department+" "+m.id).toLowerCase();
      const s=statusOf(m);
      return (!q||text.includes(q))&&(filter==="all"||s===filter);
    });
    const grouped=new Map();
    for(const m of visible){
      const g=managerGroup(m);
      if(!grouped.has(g))grouped.set(g,[]);
      grouped.get(g).push(m);
    }
    $("#bc-org").innerHTML=groupOrder.map(([key,title])=>{
      const rows=grouped.get(key)||[];
      if(!rows.length)return "";
      rows.sort((a,b)=>(statusRank[statusOf(b)]||0)-(statusRank[statusOf(a)]||0)||a.name.localeCompare(b.name));
      return `<section class="bc-org-section">
        <div class="bc-org-title"><h3>${esc(title)}</h3><span>${rows.length} managers</span></div>
        <div class="bc-manager-grid">${rows.map(managerCard).join("")}</div>
      </section>`;
    }).join("")||'<div class="bc-empty">אין מנהלים שמתאימים לפילטר.</div>';
  }

  function renderEvents(){
    const rows=state.events.slice(0,80);
    $("#bc-event-count").textContent=rows.length+" אירועים";
    $("#bc-events").innerHTML=rows.length?rows.map(e=>`<article class="bc-event" data-severity="${esc(e.severity)}">
      <span class="bc-event-dot"></span>
      <div><strong>${esc(e.title)}</strong><p>${esc(e.body||"")}</p></div>
      <time>${esc(timeAgo(e.created_at))}</time>
    </article>`).join(""):'<div class="bc-empty">אין עדיין אירועי מערכת.</div>';
  }

  function renderDecisions(){
    const rows=state.decisions.slice(0,80);
    $("#bc-decisions").innerHTML=rows.length?rows.map(d=>`<article class="bc-decision">
      <div><span class="bc-status-pill ${d.status==="blocked"?"blocked":"watch"}">${esc(d.status)}</span></div>
      <div><strong>${esc(d.title)}</strong><p>${esc(d.rationale||d.decision_type||"")}</p></div>
      <div class="bc-decision-actions">
        ${d.owner_approval_required&&d.status==="proposed"?`<button data-decision-id="${esc(d.id)}" data-decision-action="approved">אשר</button><button data-decision-id="${esc(d.id)}" data-decision-action="rejected">דחה</button>`:`<time>${esc(timeAgo(d.created_at))}</time>`}
      </div>
    </article>`).join(""):'<div class="bc-empty">אין החלטות שמחכות כרגע.</div>';
  }

  function renderChat(){
    const log=$("#bc-chat-log");
    log.innerHTML=state.chat.length?state.chat.map(m=>`<article class="bc-message ${esc(m.sender_type)}"><small>${esc(m.sender_type==="owner"?"OWNER":m.sender_id||m.sender_type)} · ${esc(timeAgo(m.created_at))}</small>${esc(m.body)}</article>`).join("")
      :'<div class="bc-empty">כתוב ל־BOOM. הוא יענה מתוך הדוחות החיים.</div>';
    log.scrollTop=log.scrollHeight;
  }

  function showManager(id){
    const m=state.managers.find(x=>x.id===id);
    if(!m)return;
    const r=getReport(id);
    const workers=state.workers.filter(x=>x.manager_id===id);
    const workerHtml=workers.length?workers.map(w=>{
      const wr=state.workerLatest.get(w.id);
      const ws=wr?.status||w.status||"idle";
      return '<article class=\'bc-worker-row\' data-status=\''+esc(ws)+'\'><div><strong>'+esc(w.name)+'</strong><small>'+esc(w.role)+'</small><p>'+esc(w.mission)+'</p></div><div class=\'bc-worker-meta\'><span class=\'bc-status-pill '+esc(ws)+'\'>'+esc(ws.toUpperCase())+'</span><small>'+esc(timeAgo(wr?.created_at||w.last_report_at))+'</small></div></article>';
    }).join(''):'<div class=\'bc-empty\'>אין עובדים מוגדרים למנהל הזה.</div>';
    const body=$("#bc-detail-body");
    body.innerHTML=`
      <div class="bc-detail-block"><small>${esc(m.department)}</small><h2>${esc(m.name)}</h2><p>Reports to: ${esc(m.reports_to||"OWNER")} · Status: ${esc(statusOf(m))}</p></div>
      <div class="bc-detail-block"><h3>Team · ${workers.length} workers</h3><div class="bc-worker-list">${workerHtml}</div></div>
      <div class="bc-detail-block"><h3>Latest metrics</h3><pre>${esc(JSON.stringify(r?.metrics||{},null,2))}</pre></div>
      <div class="bc-detail-block"><h3>Issues</h3><pre>${esc(JSON.stringify(r?.issues||[],null,2))}</pre></div>
      <div class="bc-detail-block"><h3>Recommended action</h3><p>${esc(r?.recommended_action||"אין דוח עדיין.")}</p></div>
      <div class="bc-detail-block"><h3>Evidence</h3><pre>${esc(JSON.stringify(r?.evidence||[],null,2))}</pre></div>`;
    $("#bc-detail").showModal();
  }

  function renderAll(){
    buildLatest();
    renderSummary();
    renderSuppliers();
    renderF35();
    renderSuperStack();
    renderCommands();
    renderLearning();
    renderOrg();
    renderEvents();
    renderDecisions();
    renderChat();
    $("#bc-sync").textContent="LIVE · "+new Date().toLocaleTimeString("he-IL",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
  }

  async function loadAll(){
    const [m,w,wr,r,e,d,cmd,cy,ev,learn,c]=await Promise.all([
      client.from("hunt_boom_managers").select("*").order("department",{ascending:true}),
      client.from("hunt_boom_workers").select("*").order("manager_id",{ascending:true}).order("name",{ascending:true}),
      client.from("hunt_boom_worker_reports").select("*").order("created_at",{ascending:false}).limit(800),
      client.from("hunt_boom_live_reports").select("*").order("created_at",{ascending:false}).limit(600),
      client.from("hunt_boom_events").select("*").order("created_at",{ascending:false}).limit(100),
      client.from("hunt_boom_decisions").select("*").order("priority",{ascending:false}).order("created_at",{ascending:false}).limit(100),
      client.from("hunt_boom_agent_commands").select("*").order("created_at",{ascending:false}).limit(200),
      client.from("hunt_boom_improvement_cycles").select("*").order("started_at",{ascending:false}).limit(80),
      client.from("hunt_boom_evals").select("*").order("created_at",{ascending:false}).limit(200),
      client.from("hunt_boom_learning_items").select("*").order("learned_at",{ascending:false}).limit(100),
      client.from("hunt_boom_chat").select("*").eq("conversation_id",conversationId).order("created_at",{ascending:true}).limit(200)
    ]);
    for(const x of [m,w,wr,r,e,d,cmd,cy,ev,learn,c])if(x.error)throw x.error;
    state.managers=m.data||[];
    state.workers=w.data||[];
    state.workerReports=wr.data||[];
    state.reports=r.data||[];
    state.events=e.data||[];
    state.decisions=d.data||[];
    state.commands=cmd.data||[];
    state.cycles=cy.data||[];
    state.evals=ev.data||[];
    state.learning=learn.data||[];
    state.chat=c.data||[];
    renderAll();
  }

  function scheduleRefresh(){
    clearTimeout(refreshTimer);
    refreshTimer=setTimeout(()=>loadAll().catch(err=>setGate(err.message||"Realtime refresh failed","error")),180);
  }
  function setGate(text,tone=""){
    const el=$("#bc-gate");
    el.hidden=false;el.dataset.tone=tone;el.innerHTML="<strong>"+esc(text)+"</strong>";
  }

  async function sendBoom(message){
    const clean=String(message||"").trim();
    if(!clean)return;
    const btn=$("#bc-chat-send"),input=$("#bc-chat-input");
    btn.disabled=true;input.disabled=true;
    try{
      const {data,error}=await client.functions.invoke("hunt-boom-chat",{body:{message:clean,conversation_id:conversationId}});
      if(error)throw error;
      if(data?.error)throw new Error(data.error);
      input.value="";
      await loadAll();
    }finally{
      btn.disabled=false;input.disabled=false;input.focus();
    }
  }

  async function decide(id,status){
    const row=state.decisions.find(x=>String(x.id)===String(id));
    if(!row)return;
    const {error}=await client.from("hunt_boom_decisions").update({status,updated_at:new Date().toISOString()}).eq("id",id);
    if(error)throw error;
    await loadAll();
  }

  function subscribe(){
    state.channel=client.channel("boom-command-cloud-live")
      .on("postgres_changes",{event:"*",schema:"public",table:"hunt_boom_managers"},scheduleRefresh)
      .on("postgres_changes",{event:"*",schema:"public",table:"hunt_boom_workers"},scheduleRefresh)
      .on("postgres_changes",{event:"*",schema:"public",table:"hunt_boom_worker_reports"},scheduleRefresh)
      .on("postgres_changes",{event:"*",schema:"public",table:"hunt_boom_live_reports"},scheduleRefresh)
      .on("postgres_changes",{event:"*",schema:"public",table:"hunt_boom_events"},scheduleRefresh)
      .on("postgres_changes",{event:"*",schema:"public",table:"hunt_boom_chat"},payload=>{
        if(payload?.new?.conversation_id===conversationId)scheduleRefresh();
      })
      .on("postgres_changes",{event:"*",schema:"public",table:"hunt_boom_decisions"},scheduleRefresh)
      .on("postgres_changes",{event:"*",schema:"public",table:"hunt_boom_agent_commands"},scheduleRefresh)
      .on("postgres_changes",{event:"*",schema:"public",table:"hunt_boom_improvement_cycles"},scheduleRefresh)
      .on("postgres_changes",{event:"*",schema:"public",table:"hunt_boom_evals"},scheduleRefresh)
      .on("postgres_changes",{event:"*",schema:"public",table:"hunt_boom_learning_items"},scheduleRefresh)
      .subscribe(status=>{
        const el=$("#bc-realtime-status");
        if(el)el.textContent=status;
        if(status==="SUBSCRIBED"){
          $("#bc-realtime-status").textContent="LIVE";
          $("#bc-realtime-status").style.color="var(--bc-green)";
        }
      });
  }

  async function init(){
    const {data:{session}}=await client.auth.getSession();
    if(!session){
      location.replace("auth.html?next="+encodeURIComponent("/boom-cloud.html"));
      return;
    }
    state.session=session;
    const {data:profile,error}=await client.from("profiles").select("is_admin").eq("id",session.user.id).maybeSingle();
    if(error)throw error;
    if(!profile?.is_admin){setGate("נדרשת הרשאת Owner/Admin.","error");return;}
    $("#bc-gate").hidden=true;
    $("#bc-dashboard").hidden=false;
    await loadAll();
    subscribe();
  }

  document.addEventListener("click",async ev=>{
    const card=ev.target.closest?.("[data-manager-id]");
    if(card&&!ev.target.closest("button"))showManager(card.dataset.managerId);
    const q=ev.target.closest?.("[data-boom-ask]");
    if(q){
      $("#bc-chat-input").value=q.dataset.boomAsk||"";
      try{await sendBoom(q.dataset.boomAsk)}catch(e){setGate(e.message||"BOOM chat failed","error")}
    }
    const decision=ev.target.closest?.("[data-decision-id][data-decision-action]");
    if(decision){
      decision.disabled=true;
      try{await decide(decision.dataset.decisionId,decision.dataset.decisionAction)}catch(e){setGate(e.message||"Decision update failed","error")}
    }
  });
  $("#bc-chat-form")?.addEventListener("submit",async ev=>{
    ev.preventDefault();
    try{await sendBoom($("#bc-chat-input").value)}catch(e){setGate(e.message||"BOOM chat failed","error")}
  });
  $("#bc-refresh")?.addEventListener("click",()=>loadAll().catch(e=>setGate(e.message||"Refresh failed","error")));
  $("#bc-manager-search")?.addEventListener("input",renderOrg);
  $("#bc-status-filter")?.addEventListener("change",renderOrg);
  $("#bc-detail-close")?.addEventListener("click",()=>$("#bc-detail").close());

  init().catch(err=>setGate(err.message||"BOOM Cloud failed to load","error"));
})();