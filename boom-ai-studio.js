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
    modelRoutes:[],
    managerMap:new Map(),
    reportMap:new Map(),
    workerReportMap:new Map(),
    channel:null,
    selected:"boom-super-agent",
    conversationId:null,
    mediaRecorder:null,
    micStream:null,
    micChunks:[],
    micTimer:null,
    chatMode:"chat",
    voiceLoop:false,
    speaking:false,
    voiceAudio:null,
    audioContext:null,
    vadRaf:null,
    traceType:"all"
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

  function attentionReports(){
    return [...state.reportMap.values()]
      .filter(r=>["critical","blocked","watch"].includes(r.status))
      .sort((a,b)=>(statusRank[b.status]||0)-(statusRank[a.status]||0)||new Date(b.created_at)-new Date(a.created_at));
  }

  function focusAttention(){
    const started=performance.now();
    const list=attentionReports();
    const report=list[0];
    if(!report)return;
    $$(".node.attention-focus").forEach(x=>x.classList.remove("attention-focus"));
    inspectManager(report.manager_id);
    const node=$("#node-"+report.manager_id);
    if(node)node.classList.add("attention-focus");
    requestAnimationFrame(()=>{
      const ms=Math.max(0,Math.round(performance.now()-started));
      const btn=$("#attention-focus");
      if(btn){
        btn.dataset.focusMs=String(ms);
        btn.title="Focused "+report.manager_id+" in "+ms+" ms";
      }
    });
  }

  function renderStudio(){
    state.managerMap=latest(state.managers,"id");
    state.reportMap=latest(state.reports,"manager_id");
    state.workerReportMap=latest(state.workerReports,"worker_id");

    setNodeStatus($("#node-owner"),"healthy");
    setNodeStatus($("#node-meta"),statusOf("boom-meta-f35"));
    setNodeStatus($("#node-super"),statusOf("boom-super-agent"));
    setNodeStatus($("#node-model"),state.modelRoutes.some(r=>r.enabled!==false)?"healthy":"watch");
    setNodeStatus($("#node-memory"),"healthy");
    setNodeStatus($("#node-eval"),state.evals.length?"healthy":"watch");
    toolNodes.forEach(t=>setNodeStatus($("#node-"+t[0]),statusOf(t[0])));

    $("#meta-label").textContent=state.learning.filter(x=>x.domain==="ai-engineering").length+" AI MODULES";
    $("#command-label").textContent=state.commands.filter(x=>["queued","accepted","running","waiting_owner"].includes(x.status)).length+" OPEN COMMANDS";
    $("#memory-label").textContent=state.reports.length+" REPORTS · "+state.events.length+" EVENTS";
    $("#eval-label").textContent=state.evals.length+" EVALS";
    const attention=attentionReports();
    $("#attention-count").textContent=String(attention.length);
    $("#attention-focus").disabled=attention.length===0;

    requestAnimationFrame(drawLinks);
  }

  function renderExecutions(){
    const rows=[
      ...state.commands.slice(0,80).map(x=>({
        type:"command",
        priority:x.priority||3,
        title:x.title||("Command #"+x.id),
        body:x.instruction||"",
        meta:(x.issued_by||"BOOM")+" → "+(x.target_manager_id||"unknown")+" · "+(x.action_class||"COMMAND"),
        time:x.created_at,
        status:x.status,
        evidence:x.evidence||[]
      })),
      ...state.events.slice(0,80).map(x=>({
        type:"event",
        priority:x.severity==="critical"?5:x.severity==="blocked"?4:x.severity==="watch"?3:1,
        title:x.title||x.event_type||"Event",
        body:x.body||"",
        meta:"EVENT · "+(x.source_manager_id||"system")+" · "+(x.entity_type||"system"),
        time:x.created_at,
        status:x.severity||"healthy",
        evidence:[]
      })),
      ...state.workerReports.slice(0,100).map(x=>({
        type:"worker",
        priority:x.status==="critical"?5:x.status==="blocked"?4:x.status==="watch"?3:1,
        title:x.worker_id||"Worker report",
        body:x.finding||x.recommended_action||"",
        meta:"WORKER · "+(x.worker_id||"unknown")+" → "+(x.manager_id||"unknown")+" · "+(x.action_class||"OBSERVE"),
        time:x.created_at,
        status:x.status||"healthy",
        evidence:Array.isArray(x.evidence)?x.evidence:[]
      })),
      ...state.cycles.slice(0,40).map(x=>({
        type:"cycle",
        priority:["blocked","killed"].includes(x.status)?4:x.status==="evaluating"?3:2,
        title:"Cycle · "+(x.focus||x.cycle_key||x.id),
        body:x.hypothesis||"",
        meta:"CYCLE · "+(x.started_by||"BOOM")+" · "+(x.verdict||x.status),
        time:x.evaluated_at||x.started_at,
        status:x.status,
        evidence:[
          x.verdict?"verdict="+x.verdict:null,
          x.result?.attention!==undefined?"attention="+x.result.attention:null
        ].filter(Boolean)
      })),
      ...state.evals.slice(0,80).map(x=>({
        type:"eval",
        priority:x.passed===false?5:x.passed===true?1:3,
        title:"Eval · "+(x.metric_name||x.eval_key||x.id),
        body:(x.notes||"")+(x.current_value!==null&&x.current_value!==undefined?" · "+String(x.current_value)+" / target "+String(x.target??"—"):""),
        meta:"EVAL · "+(x.subject_type||"subject")+" · "+(x.subject_key||"unknown"),
        time:x.created_at,
        status:x.passed===true?"healthy":x.passed===false?"critical":"watch",
        evidence:Array.isArray(x.evidence)?x.evidence:[]
      }))
    ].sort((a,b)=>new Date(b.time)-new Date(a.time));

    const visible=state.traceType==="all"?rows:rows.filter(x=>x.type===state.traceType);
    const failures=visible.filter(x=>["critical","blocked","failed","killed"].includes(String(x.status))).length;
    const passed=visible.filter(x=>x.type==="eval"&&x.status==="healthy").length;
    const actors=new Set(visible.map(x=>x.meta.split(" · ")[1]).filter(Boolean));

    $("#trace-summary").innerHTML=
      '<div><b>'+esc(visible.length)+'</b><span>SPANS</span></div>'+
      '<div><b>'+esc(actors.size)+'</b><span>ACTORS</span></div>'+
      '<div><b>'+esc(failures)+'</b><span>FAIL/BLOCK</span></div>'+
      '<div><b>'+esc(passed)+'</b><span>EVAL PASS</span></div>';

    $("#executions-list").innerHTML=visible.length?visible.map(x=>{
      const evidence=x.evidence?.length
        ?'<div class="trace-evidence">'+x.evidence.slice(0,3).map(v=>'<span>'+esc(v)+'</span>').join("")+'</div>'
        :"";
      return '<article class="list-row trace-row" data-trace-kind="'+esc(x.type)+'">'+
        '<div class="trace-kind">'+esc(x.type.toUpperCase())+'</div>'+
        '<div><strong>'+esc(x.title)+'</strong><p>'+esc(x.body)+'</p><small>'+esc(x.meta)+'</small>'+evidence+'</div>'+
        '<div>'+pill(x.status)+'<br><small>'+esc(ago(x.time))+'</small></div>'+
      '</article>';
    }).join(""):'<div class="list-row">אין executions.</div>';
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
      const routes=state.modelRoutes.filter(r=>r.enabled!==false);
      const routeSummary=routes.map(r=>String(r.route_key)+": "+String(r.primary_model||"—")+(r.fallback_model?" → "+String(r.fallback_model):"")).join("\n")||"No active model route";
      $("#inspect-title").textContent="LLM / Reasoning Model";
      $("#inspect-status").innerHTML=pill(routes.length?"healthy":"watch");
      $("#inspect-body").innerHTML='<section class="inspect-block"><h3>Live routing</h3><pre>'+esc(routeSummary)+'</pre><p>המצב נקרא ישירות מ־BOOM control plane. אין Groq במסלול הפעיל.</p></section>';
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
    const [managers,workers,workerReports,reports,events,decisions,commands,cycles,evals,learning,modelRoutes]=await Promise.all([
      query("hunt_boom_managers","*","updated_at",200),
      query("hunt_boom_workers","*","updated_at",400),
      query("hunt_boom_worker_reports","*","created_at",900),
      query("hunt_boom_live_reports","*","created_at",700),
      query("hunt_boom_events","*","created_at",150),
      query("hunt_boom_decisions","*","created_at",100),
      query("hunt_boom_agent_commands","*","created_at",250),
      query("hunt_boom_improvement_cycles","*","started_at",100),
      query("hunt_boom_evals","*","created_at",250),
      query("hunt_boom_learning_items","*","learned_at",150),
      query("hunt_boom_model_routes","route_key,task_class,primary_model,fallback_model,enabled,updated_at","updated_at",40)
    ]);
    Object.assign(state,{managers,workers,workerReports,reports,events,decisions,commands,cycles,evals,learning,modelRoutes});
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

  async function invokeBoomFunction(name,body){
    const {data:{session},error:sessionError}=await client.auth.getSession();
    if(sessionError)throw sessionError;
    if(!session?.access_token)throw new Error("Session expired. Please sign in again.");

    const res=await fetch("https://zszlnahjqmwozwubetkm.supabase.co/functions/v1/"+name,{
      method:"POST",
      headers:{
        "Authorization":"Bearer "+session.access_token,
        "apikey":H.publishableKey,
        "Content-Type":"application/json"
      },
      body:JSON.stringify(body)
    });

    let data=null;
    const raw=await res.text();
    try{data=raw?JSON.parse(raw):null}catch{data={error:raw||("HTTP "+res.status)}}
    if(!res.ok)throw new Error(data?.error||data?.message||("HTTP "+res.status));
    return data||{};
  }

  async function invokeBoomAudio(name,body){
    const {data:{session},error:sessionError}=await client.auth.getSession();
    if(sessionError)throw sessionError;
    if(!session?.access_token)throw new Error("Session expired. Please sign in again.");
    const res=await fetch("https://zszlnahjqmwozwubetkm.supabase.co/functions/v1/"+name,{
      method:"POST",
      headers:{
        "Authorization":"Bearer "+session.access_token,
        "apikey":H.publishableKey,
        "Content-Type":"application/json"
      },
      body:JSON.stringify(body)
    });
    if(!res.ok){
      const raw=await res.text();
      let data={};try{data=raw?JSON.parse(raw):{}}catch{}
      throw new Error(data?.error||("HTTP "+res.status));
    }
    return await res.blob();
  }

  function appendChatMessage(type,text,{spokenText="",copyReport=""}={}){
    const article=document.createElement("article");
    article.className="chat-message "+type;
    article.dir="auto";
    article.dataset.spokenText=String(spokenText||text||"");
    article.dataset.copyReport=String(copyReport||text||"");
    const copy=document.createElement("span");
    copy.className="chat-copy";
    copy.textContent=String(text||"");
    article.appendChild(copy);
    if(type==="boom"){
      const speak=document.createElement("button");
      speak.type="button";
      speak.className="speak-btn";
      speak.setAttribute("aria-label","השמע תשובה");
      speak.textContent="🔊";
      article.appendChild(speak);
      const copyBtn=document.createElement("button");
      copyBtn.type="button";
      copyBtn.className="copy-report-btn";
      copyBtn.setAttribute("aria-label","העתק דוח BOOM");
      copyBtn.title="Copy report";
      copyBtn.textContent="COPY";
      article.appendChild(copyBtn);
    }
    $("#chat-log").appendChild(article);
    $("#chat-log").scrollTop=$("#chat-log").scrollHeight;
    return article;
  }

  function speechLanguage(text){
    const he=(String(text).match(/[֐-׿]/g)||[]).length;
    const ar=(String(text).match(/[؀-ۿ]/g)||[]).length;
    if(ar>he)return "ar";
    if(he>0)return "he-IL";
    return "en-US";
  }

  function pickVoice(lang){
    const voices=window.speechSynthesis?.getVoices?.()||[];
    return voices.find(v=>v.lang?.toLowerCase()===lang.toLowerCase())
      ||voices.find(v=>v.lang?.toLowerCase().startsWith(lang.split("-")[0].toLowerCase()))
      ||null;
  }

  function browserSpeakText(text,{resumeListening=false}={}){
    return new Promise(resolve=>{
      if(!window.speechSynthesis||!window.SpeechSynthesisUtterance){resolve();return}
      try{
        speechSynthesis.cancel();
        const utter=new SpeechSynthesisUtterance(String(text||""));
        utter.lang=speechLanguage(text);
        const voice=pickVoice(utter.lang);if(voice)utter.voice=voice;
        utter.rate=.96;utter.pitch=1;
        const done=()=>{
          state.speaking=false;
          if(state.voiceLoop&&resumeListening){
            setVoiceStatus("תורך לדבר…");
            setTimeout(()=>toggleMic().catch(()=>{}),400);
          }else setVoiceStatus("AI Voice · עברית · العربية · English · Auto");
          resolve();
        };
        utter.onend=done;utter.onerror=done;
        speechSynthesis.speak(utter);
      }catch{state.speaking=false;resolve()}
    });
  }

  async function speakText(text,{resumeListening=false}={}){
    if(state.mediaRecorder?.state==="recording")await stopMic();
    state.micStream?.getTracks().forEach(t=>t.stop());state.micStream=null;
    speechSynthesis?.cancel?.();
    if(state.voiceAudio){
      try{state.voiceAudio.pause();state.voiceAudio.src=""}catch{}
      state.voiceAudio=null;
    }
    state.speaking=true;
    setVoiceStatus("BOOM מדבר בקול AI…");
    try{
      const blob=await invokeBoomAudio("hunt-boom-speak",{text:String(text||"")});
      const url=URL.createObjectURL(blob);
      const audio=new Audio(url);
      state.voiceAudio=audio;
      await new Promise((resolve,reject)=>{
        audio.onended=resolve;
        audio.onerror=()=>reject(new Error("audio playback failed"));
        audio.play().catch(reject);
      });
      URL.revokeObjectURL(url);
      state.voiceAudio=null;
      state.speaking=false;
      if(state.voiceLoop&&resumeListening){
        setVoiceStatus("תורך לדבר…");
        setTimeout(()=>toggleMic().catch(()=>{}),350);
      }else setVoiceStatus("AI Voice · עברית · العربية · English · Auto");
    }catch(err){
      state.voiceAudio=null;
      setVoiceStatus("קול AI לא זמין — עובר לקול המכשיר");
      await browserSpeakText(text,{resumeListening});
    }
  }

  async function sendChat(){
    const input=$("#chat-input");
    const text=input.value.trim();
    if(!text)return null;
    appendChatMessage("owner",text);
    input.value="";
    $("#chat-send").disabled=true;
    try{
      const data=await invokeBoomFunction("hunt-boom-chat",{
        message:text,
        conversation_id:state.conversationId,
        mode:state.chatMode
      });
      if(data?.error)throw new Error(data.error);
      if(data?.conversation_id)state.conversationId=data.conversation_id;
      const reply=String(data.display_text||data.reply||"אין תשובה.");
      const spokenText=String(data.spoken_text||reply);
      const copyReport=String(data.copy_report||reply);
      appendChatMessage("boom",reply,{spokenText,copyReport});
      if(state.voiceLoop)await speakText(spokenText,{resumeListening:true});
      return data;
    }catch(err){
      const msg="שגיאה: "+(err.message||err);
      appendChatMessage("boom",msg);
      if(state.voiceLoop)setVoiceStatus("השיחה הקולית נעצרה בגלל שגיאה");
      return null;
    }finally{
      $("#chat-send").disabled=false;
    }
  }

  function setChatMode(mode){
    state.chatMode=mode==="command"?"command":"chat";
    $$("[data-chat-mode]").forEach(btn=>btn.classList.toggle("active",btn.dataset.chatMode===state.chatMode));
    $("#chat-input").placeholder=state.chatMode==="command"
      ?"תן פקודה ל־BOOM Super Agent…"
      :"דבר או כתוב ל־BOOM…";
    setVoiceStatus(state.chatMode==="command"
      ?"מצב פקודה · BOOM ינתח וינתב, פעולות חיות נשארות gated"
      :"AI Voice · עברית · العربية · English · Auto");
  }

  async function toggleVoiceLoop(){
    state.voiceLoop=!state.voiceLoop;
    const btn=$("#voice-loop");
    btn.classList.toggle("active",state.voiceLoop);
    btn.textContent=state.voiceLoop?"⏹ עצור שיחה קולית":"🎧 שיחה קולית";
    if(!state.voiceLoop){
      speechSynthesis?.cancel?.();
      if(state.voiceAudio){try{state.voiceAudio.pause();state.voiceAudio.src=""}catch{}state.voiceAudio=null}
      await stopMic();
      state.micStream?.getTracks().forEach(t=>t.stop());
      state.micStream=null;
      setVoiceStatus("שיחה קולית כבויה");
      return;
    }
    setVoiceStatus("תורך לדבר…");
    if(!state.speaking&&state.mediaRecorder?.state!=="recording")await toggleMic();
  }

  function blobToBase64(blob){
    return new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onload=()=>resolve(String(reader.result||"").split(",")[1]||"");
      reader.onerror=reject;
      reader.readAsDataURL(blob);
    });
  }

  function setVoiceStatus(text){const el=$("#voice-status");if(el)el.textContent=text}

  async function stopMic(){
    if(state.micTimer){clearTimeout(state.micTimer);state.micTimer=null}
    if(state.vadRaf){cancelAnimationFrame(state.vadRaf);state.vadRaf=null}
    if(state.audioContext){
      try{await state.audioContext.close()}catch{}
      state.audioContext=null;
    }
    if(state.mediaRecorder&&state.mediaRecorder.state!=="inactive")state.mediaRecorder.stop();
  }

  function startVoiceActivityWatch(stream){
    const AudioCtx=window.AudioContext||window.webkitAudioContext;
    if(!AudioCtx)return;
    try{
      const ctx=new AudioCtx();
      state.audioContext=ctx;
      const source=ctx.createMediaStreamSource(stream);
      const analyser=ctx.createAnalyser();
      analyser.fftSize=1024;
      source.connect(analyser);
      const data=new Uint8Array(analyser.fftSize);
      let speechStarted=false;
      let lastVoiceAt=performance.now();
      const startedAt=performance.now();

      const tick=()=>{
        if(!state.mediaRecorder||state.mediaRecorder.state!=="recording")return;
        analyser.getByteTimeDomainData(data);
        let sum=0;
        for(const v of data){const n=(v-128)/128;sum+=n*n}
        const rms=Math.sqrt(sum/data.length);
        const now=performance.now();
        if(rms>0.028){speechStarted=true;lastVoiceAt=now}
        if(speechStarted&&now-startedAt>900&&now-lastVoiceAt>1150){
          stopMic();
          return;
        }
        state.vadRaf=requestAnimationFrame(tick);
      };
      state.vadRaf=requestAnimationFrame(tick);
    }catch{}
  }

  async function toggleMic(){
    const btn=$("#chat-mic");
    if(state.mediaRecorder&&state.mediaRecorder.state==="recording"){stopMic();return}
    if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){
      setVoiceStatus("המיקרופון לא נתמך בדפדפן הזה");
      return;
    }
    btn.disabled=true;
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
      state.micStream=stream;
      const choices=["audio/webm;codecs=opus","audio/webm","audio/ogg;codecs=opus"];
      const mime=choices.find(x=>MediaRecorder.isTypeSupported?.(x))||"";
      const rec=new MediaRecorder(stream,mime?{mimeType:mime}:undefined);
      state.mediaRecorder=rec;state.micChunks=[];
      rec.ondataavailable=e=>{if(e.data?.size)state.micChunks.push(e.data)};
      rec.onstart=()=>{btn.disabled=false;btn.classList.add("recording");btn.textContent="⏹";setVoiceStatus("מקשיב… עברית · العربية · English")};
      rec.onerror=()=>{setVoiceStatus("שגיאת מיקרופון");btn.classList.remove("recording");btn.textContent="🎙️"};
      rec.onstop=async()=>{
        btn.classList.remove("recording");btn.textContent="🎙️";btn.disabled=true;
        try{
          const blob=new Blob(state.micChunks,{type:rec.mimeType||"audio/webm"});
          state.micStream?.getTracks().forEach(t=>t.stop());state.micStream=null;
          if(blob.size<800){setVoiceStatus("לא זוהה דיבור");return}
          setVoiceStatus("מתמלל אוטומטית…");
          const audio_base64=await blobToBase64(blob);
          const data=await invokeBoomFunction("hunt-boom-transcribe",{audio_base64,mime_type:blob.type||"audio/webm"});
          if(data?.error)throw new Error(data.error);
          const transcript=String(data?.transcript||"").trim();
          if(!transcript)throw new Error("לא זוהה דיבור");
          $("#chat-input").value=transcript;
          setVoiceStatus("זוהה: "+transcript.slice(0,70)+(transcript.length>70?"…":""));
          await sendChat();
        }catch(err){
          setVoiceStatus("שגיאה בתמלול: "+(err.message||err));
        }finally{btn.disabled=false;state.mediaRecorder=null;state.micChunks=[]}
      };
      rec.start(250);
      startVoiceActivityWatch(stream);
      state.micTimer=setTimeout(()=>stopMic(),30000);
    }catch(err){
      btn.disabled=false;setVoiceStatus("לא התקבלה הרשאת מיקרופון: "+(err.message||err));
    }
  }

  async function ensureAdmin(session){
    const {data,error}=await client.from("profiles").select("is_admin").eq("id",session.user.id).maybeSingle();
    if(error)throw error;
    if(!data?.is_admin)throw new Error("נדרשת הרשאת Owner/Admin.");
  }

  function setChatOpen(open=true){
    const inspector=$(".inspector");
    if(!inspector)return;
    inspector.classList.toggle("chat-open",open);
    const toggle=$("#chat-toggle");
    if(toggle)toggle.textContent=open?"💬 BOOM Chat פתוח":"💬 BOOM Chat";
    if(open)setTimeout(()=>$("#chat-input")?.focus(),80);
  }

  function showApp(){
    $("#login-screen").hidden=true;
    $("#app-shell").hidden=false;
    $("#logout").hidden=false;
    $("#chat-toggle").hidden=false;
    setChatOpen(true);
  }

  function showLogin(){
    $("#login-screen").hidden=false;
    $("#app-shell").hidden=true;
    $("#logout").hidden=true;
    $("#chat-toggle").hidden=true;
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
  $("#attention-focus").addEventListener("click",focusAttention);
  $("#chat-toggle").addEventListener("click",()=>setChatOpen(!$(".inspector").classList.contains("chat-open")));
  $("#chat-collapse").addEventListener("click",()=>setChatOpen(false));
  $("#chat-send").addEventListener("click",sendChat);
  $("#chat-mic").addEventListener("click",toggleMic);
  $("#voice-loop").addEventListener("click",()=>toggleVoiceLoop().catch(err=>setVoiceStatus(err.message||err)));
  $$("[data-chat-mode]").forEach(btn=>btn.addEventListener("click",()=>setChatMode(btn.dataset.chatMode)));
  $("#chat-log").addEventListener("click",async ev=>{
    const copyBtn=ev.target.closest(".copy-report-btn");
    if(copyBtn){
      const article=copyBtn.closest(".chat-message");
      const text=article?.dataset.copyReport||article?.querySelector(".chat-copy")?.textContent||"";
      try{
        await navigator.clipboard.writeText(text);
        copyBtn.textContent="✓";
        setTimeout(()=>{copyBtn.textContent="COPY"},1200);
      }catch{
        setVoiceStatus("לא הצלחתי להעתיק — אפשר לסמן את הדוח ידנית");
      }
      return;
    }
    const btn=ev.target.closest(".speak-btn");
    if(!btn)return;
    const article=btn.closest(".chat-message");
    const text=article?.dataset.spokenText||article?.querySelector(".chat-copy")?.textContent||"";
    speakText(text);
  });
  $("#chat-input").addEventListener("keydown",ev=>{if(ev.key==="Enter"&&!ev.shiftKey){ev.preventDefault();sendChat()}});
  window.addEventListener("resize",()=>requestAnimationFrame(drawLinks));

  document.addEventListener("click",ev=>{
    const traceFilter=ev.target.closest("[data-trace-type]");
    if(traceFilter){
      state.traceType=traceFilter.dataset.traceType||"all";
      $$("#trace-filters .trace-filter").forEach(x=>x.classList.toggle("active",x===traceFilter));
      renderExecutions();
      return;
    }
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
    if(special){
      if(special.dataset.special==="owner"){
        setChatOpen(true);
        return;
      }
      inspectSpecial(special.dataset.special);
    }
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