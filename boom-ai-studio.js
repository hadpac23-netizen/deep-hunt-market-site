(() => {
  "use strict";

  const H=window.HuntCore;
  const S=window.supabase;
  if(!H||!S?.createClient){
    document.body.innerHTML='<pre style="color:white;padding:20px">BOOM Studio failed: Supabase client unavailable.</pre>';
    return;
  }

  const client=S.createClient(
    "https://zszlnahjqmwozwubetkm.supabase.co",
    H.publishableKey,
    {
      auth:{
        flowType:"pkce",
        detectSessionInUrl:true,
        persistSession:true,
        autoRefreshToken:true
      }
    }
  );
  const $=q=>document.querySelector(q);
  const $$=q=>[...document.querySelectorAll(q)];
  const esc=v=>H.esc?.(v)??String(v??"");
  const statusRank={critical:5,blocked:4,watch:3,healthy:2,working:1,offline:0};

  const state={
    session:null,
    managers:[],
    workers:[],
    workerReports:[],
    reports:[],
    events:[],
    decisions:[],
    commands:[],
    cycles:[],
    evals:[],
    learning:[],
    managerMap:new Map(),
    reportMap:new Map(),
    workerReportMap:new Map(),
    channel:null,
    selected:"boom-super-agent"
  };

  const toolNodes=[
    ["supplier-cj","CJ Supplier","CJ","🔌"],
    ["supplier-eprolo","EPROLO Supplier","EPROLO","⬡"],
    ["sales-director","Sales","Sales","$"],
    ["marketing-growth","Marketing","Marketing","◈"],
    ["category-orchestrator","Categories","Categories","▦"],
    ["dynamic-merchandising","Dynamic","Dynamic","↻"],
    ["site-reliability","Reliability","Reliability","✓"],
    ["f35-research","F35 Research","F35 Research","⚡"],
    ["f35-acquisition","F35 Acquisition","Acquisition","◎"],
    ["daily-10k-mission","$10K Mission","$10K","$"],
    ["checkout-payment","Checkout","Checkout","▣"],
    ["repair-engineering","Repair","Repair","🔧"],
    ["security-access","Security","Security","◆"],
    ["analytics-truth","Analytics","Analytics","▥"]
  ];

  function latest(rows,key){
    const map=new Map();
    for(const row of rows||[]) if(!map.has(row[key])) map.set(row[key],row);
    return map;
  }

  function ago(value){
    if(!value)return "—";
    const sec=Math.max(0,(Date.now()-new Date(value).getTime())/1000);
    if(sec<60)return "עכשיו";
    if(sec<3600)return Math.floor(sec/60)+" דק׳";
    if(sec<86400)return Math.floor(sec/3600)+" שע׳";
    return Math.floor(sec/86400)+" ימים";
  }

  function pill(status){
    const s=String(status||"offline");
    return '<span class="pill '+esc(s)+'">'+esc(s.toUpperCase())+'</span>';
  }

  function statusOf(id){
    const manager=state.managerMap.get(id);
    const report=state.reportMap.get(id);
    return report?.status||manager?.status||"offline";
  }

  function setNodeStatus(el,status){
    if(el)el.dataset.status=status;
  }

  function setLive(text,tone="healthy"){
    const el=$("#live-state");
    if(!el)return;
    el.textContent=text;
    el.className="live-pill "+tone;
  }

  function createToolNodes(){
    const host=$("#tool-nodes");
    host.innerHTML="";
    toolNodes.forEach((t,i)=>{
      const col=i%7;
      const row=Math.floor(i/7);
      const el=document.createElement("article");
      el.className="node";
      el.id="node-"+t[0];
      el.dataset.managerId=t[0];
      el.style.right=(35+col*175)+"px";
      el.style.top=(560+row*135)+"px";
      el.innerHTML=
        '<span class="port top"></span>'+
        '<div class="node-head"><span class="node-icon">'+t[3]+'</span><span class="node-title">'+esc(t[1])+'</span></div>'+
        '<div class="node-body"><p>'+esc(t[2])+' department</p><footer><span>'+esc(t[0])+'</span><span class="status-dot"></span></footer></div>';
      host.appendChild(el);
    });
  }

  function center(el){
    const canvas=$("#canvas").getBoundingClientRect();
    const r=el.getBoundingClientRect();
    return {x:r.left-canvas.left+r.width/2,y:r.top-canvas.top+r.height/2};
  }

  function addLine(svg,a,b,cls=""){
    if(!a||!b)return;
    const A=center(a),B=center(b);
    const dx=(B.x-A.x)*.45;
    const p=document.createElementNS("http://www.w3.org/2000/svg","path");
    p.setAttribute("d","M "+A.x+" "+A.y+" C "+(A.x+dx)+" "+A.y+", "+(B.x-dx)+" "+B.y+", "+B.x+" "+B.y);
    p.setAttribute("class","link "+cls);
    svg.appendChild(p);
  }

  function drawLinks(){
    const svg=$("#links");
    const canvas=$("#canvas");
    if(!svg||!canvas)return;
    svg.innerHTML="";
    svg.setAttribute("viewBox","0 0 "+canvas.clientWidth+" "+canvas.clientHeight);
    addLine(svg,$("#node-owner"),$("#node-meta"),"live");
    addLine(svg,$("#node-meta"),$("#node-super"),"live");
    addLine(svg,$("#node-super"),$("#node-model"),"watch");
    addLine(svg,$("#node-super"),$("#node-memory"),"live");
    addLine(svg,$("#node-super"),$("#node-eval"),state.evals.length?"live":"watch");
    toolNodes.forEach(t=>{
      const st=statusOf(t[0]);
      const cls=["healthy","working"].includes(st)?"live":st;
      addLine(svg,$("#node-super"),$("#node-"+t[0]),cls);
    });
  }

  function renderStudio(){
    state.managerMap=latest(state.managers,"id");
    state.reportMap=latest(state.reports,"manager_id");
    state.workerReportMap=latest(state.workerReports,"worker_id");

    setNodeStatus($("#node-owner"),"healthy");
    setNodeStatus($("#node-meta"),statusOf("boom-meta-f35"));
    setNodeStatus($("#node-super"),statusOf("boom-super-agent"));
    setNodeStatus($("#node-model"),"watch");
    setNodeStatus($("#node-memory"),"healthy");
    setNodeStatus($("#node-eval"),state.evals.length?"healthy":"watch");
    toolNodes.forEach(t=>setNodeStatus($("#node-"+t[0]),statusOf(t[0])));

    $("#meta-label").textContent=state.learning.filter(x=>x.domain==="ai-engineering").length+" AI MODULES";
    $("#command-label").textContent=state.commands.filter(x=>["queued","accepted","running","waiting_owner"].includes(x.status)).length+" OPEN COMMANDS";
    $("#memory-label").textContent=state.reports.length+" REPORTS · "+state.events.length+" EVENTS";
    $("#eval-label").textContent=state.evals.length+" EVALS";

    requestAnimationFrame(drawLinks);
  }

  function renderExecutions(){
    const rows=[
      ...state.commands.slice(0,50).map(x=>({
        priority:x.priority||3,
        title:x.title,
        body:x.instruction,
        meta:x.issued_by+" → "+x.target_manager_id+" · "+x.status,
        time:x.created_at,
        status:x.status
      })),
      ...state.events.slice(0,40).map(x=>({
        priority:x.severity==="critical"?5:x.severity==="blocked"?4:x.severity==="watch"?3:1,
        title:x.title,
        body:x.body||"",
        meta:"EVENT · "+(x.source_manager_id||"system"),
        time:x.created_at,
        status:x.severity
      }))
    ].sort((a,b)=>new Date(b.time)-new Date(a.time));

    $("#executions-list").innerHTML=rows.length?rows.map(x=>
      '<article class="list-row">'+
        '<div class="priority">P'+esc(x.priority)+'</div>'+
        '<div><strong>'+esc(x.title)+'</strong><p>'+esc(x.body)+'</p><small>'+esc(x.meta)+'</small></div>'+
        '<div>'+pill(x.status)+'<br><small>'+esc(ago(x.time))+'</small></div>'+
      '</article>'
    ).join(""):'<div class="list-row">אין executions.</div>';
  }

  function renderEvaluations(){
    const rows=state.cycles.map(c=>({cycle:c,eval:state.evals.find(e=>e.cycle_id===c.id)}));
    $("#evaluations-list").innerHTML=rows.length?rows.map(({cycle,eval:e})=>{
      const stateLabel=e?(e.passed===true?"PASS":e.passed===false?"FAIL":"OPEN"):"NO EVAL";
      const tone=e?.passed===true?"healthy":e?.passed===false?"critical":"watch";
      return '<article class="list-row">'+
        '<div class="priority">'+(stateLabel==="PASS"?"✓":stateLabel==="FAIL"?"×":"…")+'</div>'+
        '<div><strong>'+esc(cycle.focus)+'</strong><p>'+esc(cycle.hypothesis)+'</p><small>'+esc(cycle.cycle_key)+' · '+esc(cycle.status)+'</small></div>'+
        '<div>'+pill(tone)+'<br><small>'+esc(e?.metric_name||stateLabel)+'</small></div>'+
      '</article>';
    }).join(""):'<div class="list-row">אין eval cycles.</div>';
  }

  function renderLearning(){
    const rows=[
      ...state.learning.filter(x=>x.domain==="ai-engineering"),
      ...state.learning.filter(x=>x.domain!=="ai-engineering")
    ];
    $("#learning-list").innerHTML=rows.length?rows.map(x=>
      '<article class="learn-card '+(x.domain==="ai-engineering"?"ai-course":"")+'">'+
        '<small>'+esc(x.source_name)+' · '+esc(x.domain)+' · '+esc(x.status)+'</small>'+
        '<h3>'+esc(x.title)+'</h3>'+
        '<p>'+esc(x.principle)+'</p>'+
        '<p><b>BOOM:</b> '+esc(x.hunt_application)+'</p>'+
        '<p><b>Experiment:</b> '+esc(x.proposed_experiment||"—")+'</p>'+
      '</article>'
    ).join(""):'<article class="learn-card">אין learning items.</article>';
  }

  function inspectManager(id){
    const m=state.managerMap.get(id);
    if(!m)return;
    state.selected=id;
    const r=state.reportMap.get(id);
    const workers=state.workers.filter(w=>w.manager_id===id);
    $("#inspect-title").textContent=m.name;
    $("#inspect-status").innerHTML=pill(statusOf(id))+'<span class="pill">'+esc(m.department)+'</span>';

    const commands=state.commands.filter(c=>c.target_manager_id===id&&["queued","accepted","running","waiting_owner"].includes(c.status));
    const team=workers.length?workers.map(w=>{
      const wr=state.workerReportMap.get(w.id);
      const st=wr?.status||w.status||"idle";
      return '<article class="worker-card">'+
        '<div style="display:flex;justify-content:space-between;gap:8px"><strong>'+esc(w.name)+'</strong>'+pill(st)+'</div>'+
        '<small>'+esc(w.role)+'</small><p>'+esc(w.mission)+'</p>'+
      '</article>';
    }).join(""):'<p>אין workers.</p>';

    $("#inspect-body").innerHTML=
      '<section class="inspect-block"><h3>Latest report</h3><p>'+esc(r?.issues?.[0]||r?.opportunity||"אין בעיה פתוחה")+'</p><p><b>Next:</b> '+esc(r?.recommended_action||"—")+'</p></section>'+
      '<section class="inspect-block"><h3>Metrics</h3><pre>'+esc(JSON.stringify(r?.metrics||{},null,2))+'</pre></section>'+
      '<section class="inspect-block"><h3>Open commands · '+commands.length+'</h3><pre>'+esc(JSON.stringify(commands.slice(0,6),null,2))+'</pre></section>'+
      '<section class="inspect-block"><h3>Team · '+workers.length+'</h3>'+team+'</section>';
  }

  function inspectSpecial(type){
    if(type==="owner"){
      $("#inspect-title").textContent="Owner Chat Trigger";
      $("#inspect-status").innerHTML=pill("healthy");
      $("#inspect-body").innerHTML='<section class="inspect-block"><h3>Input</h3><p>פקודות Owner נכנסות ל־BOOM. פעולות רגישות נשארות Owner-gated.</p></section>';
      return;
    }
    if(type==="model"){
      $("#inspect-title").textContent="LLM / Reasoning Model";
      $("#inspect-status").innerHTML=pill("watch");
      $("#inspect-body").innerHTML='<section class="inspect-block"><h3>Connector status</h3><p><b>Model connector ready — provider not enabled yet.</b></p><p>BOOM לא מציג מודל חיצוני כאילו הוא מחובר כשאין provider server-side פעיל.</p></section>';
      return;
    }
    if(type==="memory"){
      $("#inspect-title").textContent="BOOM Memory & State";
      $("#inspect-status").innerHTML=pill("healthy");
      $("#inspect-body").innerHTML='<section class="inspect-block"><h3>Durable state</h3><pre>Managers: '+state.managers.length+'\nWorkers: '+state.workers.length+'\nReports: '+state.reports.length+'\nCommands: '+state.commands.length+'\nLearning: '+state.learning.length+'</pre></section>';
      return;
    }
    if(type==="eval"){
      $("#inspect-title").textContent="Eval Guardian";
      $("#inspect-status").innerHTML=pill(state.evals.length?"healthy":"watch");
      $("#inspect-body").innerHTML='<section class="inspect-block"><h3>Rule</h3><p>שדרוג נשמר רק עם evidence + eval. Regression → kill/rollback.</p></section><section class="inspect-block"><h3>Latest evals</h3><pre>'+esc(JSON.stringify(state.evals.slice(0,8),null,2))+'</pre></section>';
    }
  }

  function renderAll(){
    renderStudio();
    renderExecutions();
    renderEvaluations();
    renderLearning();
    if(state.managerMap.has(state.selected))inspectManager(state.selected);
    setLive("● LIVE · "+new Date().toLocaleTimeString("he-IL",{hour:"2-digit",minute:"2-digit",second:"2-digit"}));
  }

  async function query(table,columns="*",orderColumn=null,limit=300){
    let q=client.from(table).select(columns).limit(limit);
    if(orderColumn)q=q.order(orderColumn,{ascending:false});
    const {data,error}=await q;
    if(error)throw error;
    return data||[];
  }

  async function loadAll(){
    const [managers,workers,workerReports,reports,events,decisions,commands,cycles,evals,learning]=await Promise.all([
      query("hunt_boom_managers","*","updated_at",200),
      query("hunt_boom_workers","*","updated_at",400),
      query("hunt_boom_worker_reports","*","created_at",900),
      query("hunt_boom_live_reports","*","created_at",700),
      query("hunt_boom_events","*","created_at",150),
      query("hunt_boom_decisions","*","created_at",100),
      query("hunt_boom_agent_commands","*","created_at",250),
      query("hunt_boom_improvement_cycles","*","started_at",100),
      query("hunt_boom_evals","*","created_at",250),
      query("hunt_boom_learning_items","*","learned_at",150)
    ]);
    Object.assign(state,{managers,workers,workerReports,reports,events,decisions,commands,cycles,evals,learning});
    state.managerMap=latest(managers,"id");
    state.reportMap=latest(reports,"manager_id");
    state.workerReportMap=latest(workerReports,"worker_id");
    renderAll();
  }

  function scheduleReload(){
    clearTimeout(scheduleReload.timer);
    scheduleReload.timer=setTimeout(()=>loadAll().catch(showError),220);
  }

  function subscribeRealtime(){
    if(state.channel)client.removeChannel(state.channel);
    state.channel=client.channel("boom-ai-studio-live")
      .on("postgres_changes",{event:"*",schema:"public",table:"hunt_boom_managers"},scheduleReload)
      .on("postgres_changes",{event:"*",schema:"public",table:"hunt_boom_workers"},scheduleReload)
      .on("postgres_changes",{event:"*",schema:"public",table:"hunt_boom_worker_reports"},scheduleReload)
      .on("postgres_changes",{event:"*",schema:"public",table:"hunt_boom_live_reports"},scheduleReload)
      .on("postgres_changes",{event:"*",schema:"public",table:"hunt_boom_events"},scheduleReload)
      .on("postgres_changes",{event:"*",schema:"public",table:"hunt_boom_agent_commands"},scheduleReload)
      .on("postgres_changes",{event:"*",schema:"public",table:"hunt_boom_improvement_cycles"},scheduleReload)
      .on("postgres_changes",{event:"*",schema:"public",table:"hunt_boom_evals"},scheduleReload)
      .on("postgres_changes",{event:"*",schema:"public",table:"hunt_boom_learning_items"},scheduleReload)
      .subscribe(status=>{
        if(status==="SUBSCRIBED")setLive("● REALTIME");
      });
  }

  async function sendChat(){
    const input=$("#chat-input");
    const text=input.value.trim();
    if(!text)return;
    $("#chat-log").insertAdjacentHTML("beforeend",'<article class="chat-message owner">'+esc(text)+'</article>');
    input.value="";
    $("#chat-send").disabled=true;
    try{
      const {data,error}=await client.functions.invoke("hunt-boom-chat",{body:{message:text}});
      if(error)throw error;
      if(data?.error)throw new Error(data.error);
      $("#chat-log").insertAdjacentHTML("beforeend",'<article class="chat-message boom">'+esc(data.reply||"אין תשובה.")+'</article>');
      $("#chat-log").scrollTop=$("#chat-log").scrollHeight;
    }catch(err){
      $("#chat-log").insertAdjacentHTML("beforeend",'<article class="chat-message boom">שגיאה: '+esc(err.message||err)+'</article>');
    }finally{
      $("#chat-send").disabled=false;
    }
  }

  async function ensureAdmin(session){
    const {data,error}=await client.from("profiles").select("is_admin").eq("id",session.user.id).maybeSingle();
    if(error)throw error;
    if(!data?.is_admin)throw new Error("נדרשת הרשאת Owner/Admin.");
  }

  function showApp(){
    $("#login-screen").hidden=true;
    $("#app-shell").hidden=false;
    $("#logout").hidden=false;
  }

  function showLogin(){
    $("#login-screen").hidden=false;
    $("#app-shell").hidden=true;
    $("#logout").hidden=true;
  }

  function showError(err){
    setLive("ERROR","critical");
    const target=$("#login-screen").hidden?$("#inspect-body"):$("#login-error");
    if(target)target.innerHTML='<p style="color:var(--red)">'+esc(err.message||err)+'</p>';
  }

  async function boot(){
    createToolNodes();

    const url=new URL(location.href);
    const oauthError=url.searchParams.get("error_description")||url.searchParams.get("error");
    if(oauthError){
      showLogin();
      $("#login-error").textContent=oauthError;
      setLive("OAUTH LOGIN ERROR","critical");
      return;
    }

    const code=url.searchParams.get("code");
    if(code){
      setLive("FINISHING GITHUB LOGIN","watch");
      const {data,error}=await client.auth.exchangeCodeForSession(code);
      if(error)throw error;

      // Remove OAuth callback parameters after the session is saved.
      url.searchParams.delete("code");
      url.searchParams.delete("state");
      url.searchParams.delete("error");
      url.searchParams.delete("error_description");
      history.replaceState({},document.title,url.pathname+(url.search||""));

      if(!data?.session)throw new Error("GitHub login completed but no session was created.");
    }

    const {data:{session},error:sessionError}=await client.auth.getSession();
    if(sessionError)throw sessionError;
    if(!session){
      showLogin();
      setLive("LOGIN REQUIRED","watch");
      return;
    }

    state.session=session;
    await ensureAdmin(session);
    showApp();
    await loadAll();
    subscribeRealtime();
    inspectManager("boom-super-agent");
  }

  $("#github-login").addEventListener("click",async()=>{
    const button=$("#github-login");
    const error=$("#login-error");
    button.disabled=true;
    error.textContent="";
    try{
      const redirectTo=location.origin+location.pathname;
      const {error:oauthError}=await client.auth.signInWithOAuth({
        provider:"github",
        options:{redirectTo}
      });
      if(oauthError)throw oauthError;
    }catch(err){
      error.textContent=err.message||"GitHub login failed";
      button.disabled=false;
    }
  });

  $("#login-form").addEventListener("submit",async ev=>{
    ev.preventDefault();
    const button=$("#login-submit");
    const error=$("#login-error");
    button.disabled=true; error.textContent="";
    try{
      const {data,error:authError}=await client.auth.signInWithPassword({
        email:$("#login-email").value.trim(),
        password:$("#login-password").value
      });
      if(authError)throw authError;
      if(!data.session)throw new Error("Login failed");
      await ensureAdmin(data.session);
      state.session=data.session;
      showApp();
      await loadAll();
      subscribeRealtime();
      inspectManager("boom-super-agent");
    }catch(err){
      error.textContent=err.message||"Login failed";
      await client.auth.signOut().catch(()=>{});
    }finally{
      button.disabled=false;
    }
  });

  $("#logout").addEventListener("click",async()=>{
    await client.auth.signOut();
    location.reload();
  });
  $("#refresh").addEventListener("click",()=>loadAll().catch(showError));
  $("#chat-send").addEventListener("click",sendChat);
  $("#chat-input").addEventListener("keydown",ev=>{if(ev.key==="Enter"&&!ev.shiftKey){ev.preventDefault();sendChat()}});
  window.addEventListener("resize",()=>requestAnimationFrame(drawLinks));

  document.addEventListener("click",ev=>{
    const tab=ev.target.closest(".tab");
    if(tab){
      $$(".tab").forEach(x=>x.classList.remove("active"));
      $$(".view").forEach(x=>x.classList.remove("active"));
      tab.classList.add("active");
      $("#"+tab.dataset.tab).classList.add("active");
      if(tab.dataset.tab==="studio")requestAnimationFrame(drawLinks);
      return;
    }
    const managerNode=ev.target.closest("[data-manager-id]");
    if(managerNode){inspectManager(managerNode.dataset.managerId);return}
    const special=ev.target.closest("[data-special]");
    if(special)inspectSpecial(special.dataset.special);
  });

  client.auth.onAuthStateChange((event,session)=>{
    if(event==="SIGNED_IN"&&session&&!state.session&&!new URL(location.href).searchParams.has("code")){
      state.session=session;
      setTimeout(async()=>{
        try{
          await ensureAdmin(session);
          showApp();
          await loadAll();
          subscribeRealtime();
          inspectManager("boom-super-agent");
        }catch(err){
          showError(err);
          await client.auth.signOut().catch(()=>{});
          showLogin();
        }
      },0);
    }
  });

  boot().catch(showError);
})();