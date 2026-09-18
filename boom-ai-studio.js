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
    traceType:"all",
    connectRows:[],
    connectCheckedAt:null,
    brandVideoPlan:null,
    brandCreativeQA:null,
    brandMission:null,
    brandBusy:false,
    brandVerified:null,
    vaultLive:true,
    vaultLast:null,
    huntCapabilities:[],
    selectedCapability:null,
    planningDraft:null
  };

  const toolNodes=[
    ["supplier-cj","CJ Supplier","CJ","🔌"],
    ["supplier-eprolo","EPROLO Supplier","EPROLO","⬡"],
    ["supplier-hypersku","HyperSKU Supplier","HyperSKU","H"],
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

  const toolNodeFallbackManagers=Object.freeze({
    "supplier-hypersku":Object.freeze({
      id:"supplier-hypersku",
      name:"HyperSKU Supplier",
      department:"TIER 0 SUPPLIER",
      status:"watch"
    })
  });
  const toolNodeFallbackReports=Object.freeze({
    "supplier-hypersku":Object.freeze({
      manager_id:"supplier-hypersku",
      status:"watch",
      issues:["PILOT · Open API adapter foundation ready; live auth not connected"],
      recommended_action:"Connect official HyperSKU Open API in read-only mode and verify SKU, stock and shipping before fulfillment.",
      metrics:{tier:"TIER 0",storefront:"OFF",fulfillment:"OFF",country_truth:"LIVE_VERIFY_REQUIRED"}
    })
  });

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
    const manager=state.managerMap.get(id)||toolNodeFallbackManagers[id];
    const report=state.reportMap.get(id)||toolNodeFallbackReports[id];
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
    setNodeStatus($("#node-model"),"watch");
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

  function connectTone(raw){
    const s=String(raw||"offline").toLowerCase();
    if(["healthy","working","connected_verified"].includes(s))return "healthy";
    if(["critical","broken"].includes(s))return "critical";
    if(["blocked","disabled_by_owner"].includes(s))return "blocked";
    return "watch";
  }

  function buildConnectRows(){
    const user=state.session?.user||{};
    const identities=(user.identities||[]).map(x=>x.provider).filter(Boolean);
    const primary=user.app_metadata?.provider||"unknown";
    const host=location.hostname;
    const cjRaw=statusOf("supplier-cj");
    const hyperskuRaw=statusOf("supplier-hypersku");
    const repairRaw=statusOf("repair-engineering");
    const googleVerifiedAt=new Date("2026-09-17T12:55:00Z");
    const googleFresh=Date.now()-googleVerifiedAt.getTime()<24*60*60*1000;
    return [
      {id:"supabase",name:"Supabase Core",kind:"IDENTITY + BACKEND",tone:"healthy",detail:"Studio data loaded successfully from the live Supabase project.",evidence:"Live query + realtime channel",gate:"Owner gate for config changes"},
      {id:"github",name:"GitHub Admin Auth",kind:"OAUTH",tone:identities.includes("github")||primary==="github"?"healthy":"watch",detail:identities.includes("github")||primary==="github"?"GitHub identity is present on the active admin session.":"Current Studio session is not proving GitHub end-to-end right now.",evidence:"Active Supabase session",gate:"Owner gate for OAuth credentials"},
      {id:"google",name:"Google OAuth",kind:"OAUTH",tone:googleFresh?"healthy":"watch",detail:googleFresh?"Fresh end-to-end login repair was verified today. Credential pairing should be rechecked after any provider change.":"Last recorded end-to-end verification is stale; BOOM CONNECT should reverify before claiming green.",evidence:"HUNT login E2E · 2026-09-17",gate:"Owner gate for client/secret changes"},
      {id:"netlify",name:"Netlify Production",kind:"DEPLOYMENT",tone:host.endsWith("netlify.app")?"healthy":"watch",detail:host.endsWith("netlify.app")?"Studio is being served from Netlify now.":"This view is not currently served from a Netlify hostname.",evidence:host||"local",gate:"Owner gate for production promotion"},
      {id:"cj",name:"CJ Supplier",kind:"SUPPLIER API",tone:connectTone(cjRaw),detail:"Status is derived from the live supplier-cj manager/report, not a hard-coded green badge.",evidence:"supplier-cj · "+cjRaw,gate:"Owner gate for supplier/order routing changes"},
      {id:"hypersku",name:"HyperSKU Supplier",kind:"TIER 0 SUPPLIER API",tone:connectTone(hyperskuRaw),detail:"BOOM Studio recognizes HyperSKU as a Tier 0 supplier lane. Adapter foundation is ready; live Open API auth and read-only verification are not connected yet.",evidence:"supplier-hypersku · "+hyperskuRaw+" · PILOT",gate:"Read-only first · live fulfillment requires explicit Owner approval"},
      {id:"repair",name:"BOOM Repair Engineering",kind:"SELF-HEALING",tone:connectTone(repairRaw),detail:"BOOM Brain repair lane handles safe reversible incidents and escalates material changes.",evidence:"repair-engineering · "+repairRaw,gate:"Safe repair auto · material changes gated"},
      {id:"payments",name:"Live Payments",kind:"PAYMENTS",tone:"blocked",detail:"Live charging remains intentionally OFF until launch authorization and full order E2E.",evidence:"DISABLED_BY_OWNER",gate:"Explicit Owner approval required"}
    ];
  }


  function intelligenceTone(capability={}){
    const status=String(capability.brain_status||"UNKNOWN").toUpperCase();
    if(status==="VERIFIED_REAL")return "healthy";
    if(status==="PILOT"||status==="IMPLEMENTED_BUT_UNVERIFIED")return "watch";
    if(status==="BLOCKED")return "blocked";
    return "offline";
  }

  async function renderHuntIntelligence(){
    const host=$("#intelligence-grid");
    const summary=$("#intelligence-summary");
    if(!host||!summary)return;
    try{
      const response=await fetch("boom-hunt-2037-capabilities.json?v=2",{cache:"no-store"});
      if(!response.ok)throw new Error("CAPABILITY_MANIFEST_UNAVAILABLE");
      const manifest=await response.json();
      const rows=Array.isArray(manifest.capabilities)?manifest.capabilities:[];
      state.huntCapabilities=rows;
      const counts={ready:0,pilot:0,planned:0,gated:0};
      rows.forEach(row=>{
        const status=String(row.brain_status||"UNKNOWN").toUpperCase();
        if(status==="VERIFIED_REAL")counts.ready++;
        else if(status==="PILOT"||status==="IMPLEMENTED_BUT_UNVERIFIED")counts.pilot++;
        else counts.planned++;
        if(row.owner_gate)counts.gated++;
      });
      summary.innerHTML=
        '<article><b>'+counts.ready+'</b><span>VERIFIED REAL</span></article>'+
        '<article><b>'+counts.pilot+'</b><span>PILOT / UNVERIFIED</span></article>'+
        '<article><b>'+counts.planned+'</b><span>PLANNED / BLOCKED</span></article>'+
        '<article><b>'+counts.gated+'</b><span>OWNER-GATED</span></article>';
      host.innerHTML=rows.map(row=>
        '<article class="intelligence-card" data-capability-id="'+esc(row.id)+'" data-state="'+esc(String(row.brain_status||"UNKNOWN").toUpperCase())+'">'+
          '<div class="intelligence-card-head"><div><h3>'+esc(row.id)+'</h3><small>'+esc(row.manager||"unassigned")+'</small></div>'+pill(intelligenceTone(row))+'</div>'+
          '<p>'+esc(row.notes||"No evidence note recorded.")+'</p>'+
          '<div class="intelligence-deps">'+(row.dependencies||[]).map(dep=>'<span>'+esc(dep)+'</span>').join("")+'</div>'+
        '</article>'
      ).join("");
      if(state.selectedCapability)renderBrainDetail(state.selectedCapability);
    }catch(err){
      state.huntCapabilities=[];
      summary.innerHTML="";
      host.innerHTML='<article class="intelligence-card" data-state="BLOCKED"><h3>Capability truth unavailable</h3><p>'+esc(err.message||err)+'</p></article>';
    }
  }

  const capabilityContracts=Object.freeze({
    "decision-intelligence":{inputs:["verified candidate","country eligibility","taste context","quality and trust"],outputs:["eligible / blocked","score and lane","reason codes"],forbidden:["bypass Product Truth","rank unsafe or unavailable items"]},
    "country-shipping":{inputs:["country","exact SKU and variant","warehouse","live quote evidence"],outputs:["shipping eligibility","landed cost","ETA evidence"],forbidden:["infer local stock","invent delivery promises"]},
    "product-truth":{inputs:["supplier identity","SKU / variant","stock","price","media","facts"],outputs:["LIVE_VERIFIED / RECHECK_REQUIRED","truth timestamp","blocked claims"],forbidden:["publish stale facts","invent claims or reviews"]},
    "taste-dna":{inputs:["views","dwell","likes","saves","shares","negative signals"],outputs:["confidence-gated affinity","discovery context"],forbidden:["use sensitive traits","judge body traits","pretend cold-start knowledge"]},
    "hunt-memory":{inputs:["real interaction events","session context"],outputs:["history","continuity","recent exposure"],forbidden:["fabricate behavior","spam reminders"]},
    "dynamic-worlds":{inputs:["eligible products","Decision Brain lanes","performance budget"],outputs:["feature-flagged discovery composition"],forbidden:["replace production without approval","hide product facts"]},
    "boom-stylist":{inputs:["occasion","budget","verified products","taste"],outputs:["truthful looks","reasons","alternatives"],forbidden:["body criticism","unverified availability"]},
    "boom-mirror":{inputs:["explicit consent","retention choice","verified product anchor"],outputs:["private preview plan","focus mode"],forbidden:["exact-fit claims","retain images without consent","activate provider without approval"]},
    "creative-brand-factory":{inputs:["verified product truth","human idea","references"],outputs:["hooks","storyboard","QA shortlist"],forbidden:["paid generation","publishing","fake claims without Owner approval"]}
  });

  function renderBrainDetail(id){
    const row=state.huntCapabilities.find(item=>item.id===id);
    const host=$("#brain-detail");
    if(!row||!host)return;
    state.selectedCapability=id;
    $$(".intelligence-card").forEach(card=>card.classList.toggle("selected",card.dataset.capabilityId===id));
    const contract=capabilityContracts[id]||{inputs:["Capability evidence"],outputs:["Auditable plan"],forbidden:["Live execution without explicit Owner approval"]};
    const list=items=>'<ul>'+items.map(item=>'<li>'+esc(item)+'</li>').join("")+'</ul>';
    host.innerHTML=
      '<div class="brain-detail-grid">'+
        '<article><small>'+esc(row.manager||"unassigned")+'</small><h2>'+esc(row.id)+'</h2><p>'+esc(row.notes||"No evidence recorded.")+'</p><div class="status-wrap">'+pill(intelligenceTone(row))+'</div></article>'+
        '<article><h3>INPUT CONTRACT</h3>'+list(contract.inputs)+'<h3>OUTPUT CONTRACT</h3>'+list(contract.outputs)+'</article>'+
        '<article><h3>DEPENDENCIES</h3>'+list(row.dependencies||["none recorded"])+'<h3>FORBIDDEN</h3>'+list(contract.forbidden)+'</article>'+
      '</div>';
  }

  function buildPlanningDraft(){
    const objective=String($("#planning-objective")?.value||"").trim();
    const output=$("#planning-output");
    if(!objective){$("#planning-status").textContent="OBJECTIVE_REQUIRED · EXECUTION_OFF";return}
    const rows=state.huntCapabilities||[];
    const route=["decision-intelligence","country-shipping","product-truth","taste-dna","hunt-memory","dynamic-worlds","boom-stylist","boom-mirror","creative-brand-factory"]
      .map(id=>rows.find(row=>row.id===id)).filter(Boolean);
    const blockers=route.filter(row=>["PLANNED","BLOCKED","UNKNOWN"].includes(String(row.brain_status||"").toUpperCase()));
    const gates=route.filter(row=>row.owner_gate);
    state.planningDraft={objective,status:"DRAFT_REVIEW",created_at:new Date().toISOString(),execution_allowed:false};
    output.textContent=[
      "PLAN STATUS: DRAFT_REVIEW",
      "OBJECTIVE: "+objective,
      "MODE: STUDIO_PLANNING_ONLY",
      "",
      "PROPOSED BRAIN ROUTE:",
      ...route.map((row,index)=>(index+1)+". "+row.id+" — "+row.brain_status),
      "",
      "BLOCKERS: "+(blockers.map(row=>row.id).join(", ")||"none recorded"),
      "OWNER GATES: "+(gates.map(row=>row.id).join(", ")||"none"),
      "",
      "SUCCESS EVIDENCE REQUIRED:",
      "- Product Truth remains live and exact",
      "- Tests pass with no storefront regression",
      "- Mobile, desktop, keyboard and reduced-motion QA",
      "- Existing checkout remains unchanged",
      "",
      "EXECUTION_ALLOWED: false",
      "PRODUCTION_CHANGED: false",
      "SPEND_AUTHORIZED: false",
      "PUBLISHING_AUTHORIZED: false"
    ].join("\n");
    $("#planning-status").textContent="DRAFT_REVIEW · OWNER DECISION REQUIRED · EXECUTION_OFF";
    $("#planning-revision").disabled=false;
    $("#planning-approve").disabled=false;
  }

  function setPlanningDecision(status){
    if(!state.planningDraft)return;
    state.planningDraft={...state.planningDraft,status,execution_allowed:false,decided_at:new Date().toISOString()};
    $("#planning-status").textContent=status+" · IMPLEMENTATION PLANNING ONLY · EXECUTION_OFF";
    const output=$("#planning-output");
    output.textContent+="\n\nOWNER DECISION: "+status+"\nLIVE EXECUTION REMAINS BLOCKED.";
  }

  function simulateHuntIntelligence(){
    const output=$("#intelligence-simulation");
    const rows=state.huntCapabilities||[];
    if(!output)return;
    if(!rows.length){output.textContent="Simulation blocked: capability truth is unavailable. Execution remains OFF.";return}
    const order=["decision-intelligence","country-shipping","product-truth","taste-dna","hunt-memory","dynamic-worlds","boom-stylist","boom-mirror","creative-brand-factory"];
    const selected=order.map(id=>rows.find(row=>row.id===id)).filter(Boolean);
    const blocked=selected.filter(row=>["PLANNED","BLOCKED","UNKNOWN"].includes(String(row.brain_status||"").toUpperCase()));
    const gated=selected.filter(row=>row.owner_gate);
    output.textContent=[
      "MODE: SIMULATION_ONLY",
      "EXECUTION_ALLOWED: false",
      "PRODUCTION_CHANGED: false",
      "SPEND_AUTHORIZED: false",
      "PUBLISHING_AUTHORIZED: false",
      "ROUTE: "+selected.map(row=>row.id+"["+row.brain_status+"]").join(" → "),
      "BLOCKERS: "+(blocked.map(row=>row.id).join(", ")||"none in simulated route"),
      "OWNER_GATES: "+(gated.map(row=>row.id).join(", ")||"none"),
      "NEXT SAFE ACTION: Review capability evidence in BOOM Studio. Owner approval is required before any execution."
    ].join("\n");
  }

  function renderConnect(){
    const host=$("#connect-grid");
    const summary=$("#connect-summary");
    if(!host||!summary)return;
    const rows=buildConnectRows();
    state.connectRows=rows;
    state.connectCheckedAt=new Date();
    const counts={healthy:0,watch:0,critical:0,blocked:0};
    rows.forEach(x=>counts[x.tone]=(counts[x.tone]||0)+1);
    summary.innerHTML=
      '<article><b>'+counts.healthy+'</b><span>CONNECTED / HEALTHY</span></article>'+
      '<article><b>'+counts.watch+'</b><span>NEEDS ATTENTION</span></article>'+
      '<article><b>'+counts.critical+'</b><span>BROKEN</span></article>'+
      '<article><b>'+counts.blocked+'</b><span>OWNER-GATED / OFF</span></article>';
    host.innerHTML=rows.map(x=>
      '<article class="connect-card '+x.tone+'" data-connect-id="'+esc(x.id)+'">'+
        '<div class="connect-card-head"><div><h3>'+esc(x.name)+'</h3><small>'+esc(x.kind)+'</small></div>'+pill(x.tone)+'</div>'+
        '<p>'+esc(x.detail)+'</p><div class="connect-meta"><span>'+esc(x.evidence)+'</span><span>'+esc(x.gate)+'</span></div>'+
      '</article>'
    ).join("");
  }

  function inspectConnection(id){
    const row=state.connectRows.find(x=>x.id===id);
    if(!row)return;
    $("#inspect-title").textContent=row.name;
    $("#inspect-status").innerHTML=pill(row.tone)+'<span class="pill">BOOM CONNECT</span>';
    $("#inspect-body").innerHTML=
      '<section class="inspect-block"><h3>Connection truth</h3><p>'+esc(row.detail)+'</p></section>'+
      '<section class="inspect-block"><h3>Evidence</h3><pre>'+esc(row.evidence)+'</pre></section>'+
      '<section class="inspect-block"><h3>Recovery policy</h3><p>'+esc(row.gate)+'</p><p>Safe reversible repair may run automatically. Secrets, provider authority, production promotion, payments and order routing remain Owner-gated.</p></section>'+
      '<section class="inspect-block"><h3>Last Studio check</h3><pre>'+esc(state.connectCheckedAt?.toLocaleString("he-IL")||"—")+'</pre></section>';
  }

  function inspectManager(id){
    const m=state.managerMap.get(id)||toolNodeFallbackManagers[id];
    if(!m)return;
    state.selected=id;
    const r=state.reportMap.get(id)||toolNodeFallbackReports[id];
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
    renderConnect();
    if(state.managerMap.has(state.selected)||toolNodeFallbackManagers[state.selected])inspectManager(state.selected);
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

  function vaultIdentity(){return {mission_id:$("#vault-mission-id")?.value.trim()||"",asset_id:$("#vault-asset-id")?.value.trim()||""}}
  function setVaultOutput(value){const el=$("#vault-output");if(el)el.textContent=typeof value==="string"?value:JSON.stringify(value,null,2)}
  function vaultEvidence(){const out={};$$('[data-vault-qa]').forEach(el=>out[el.dataset.vaultQa]=el.checked===true);return out}
  function setVaultControls(){const on=state.vaultLive===true;["#vault-preview","#vault-visual-qa","#vault-qa-commit","#vault-owner-approve","#vault-owner-reject"].forEach(q=>{const el=$(q);if(el)el.disabled=!on});$$('[data-vault-qa]').forEach(el=>el.disabled=!on)}
  async function vaultAction(action,extra={}){if(!state.vaultLive)throw new Error("MEDIA_VAULT_NOT_DEPLOYED");const id=vaultIdentity();if(!id.mission_id||!id.asset_id)throw new Error("Mission ID and Asset ID are required.");const data=await invokeBoomFunction("hunt-boom-media-vault",{action,...id,...extra});state.vaultLast=data;setVaultOutput(data);return data}
  async function refreshDeploymentReadiness(){
    const out=$("#deployment-readiness-output"),badge=$("#deployment-readiness-badge");
    if(out)out.textContent="Checking server-side provider readiness…";
    try{
      const [runway,vault]=await Promise.all([
        invokeBoomFunction("hunt-boom-video-runway",{action:"readiness"}),
        invokeBoomFunction("hunt-boom-media-vault",{action:"readiness"})
      ]);
      const providerSecrets=runway?.secret_present===true&&vault?.vision_secret_present===true&&vault?.runway_output_hosts_configured===true;
      const providerFlags=runway?.enabled===true&&vault?.vision_enabled===true;
      const status=!providerSecrets?"PROVIDERS_BLOCKED":!providerFlags?"PROVIDERS_PRESENT_FLAGS_OFF":"OWNER_ACTIVATION_REQUIRED";
      const result={status,source_ready:true,runtime_ready:true,providers:{runway:{secret_present:runway?.secret_present===true,output_hosts_configured:vault?.runway_output_hosts_configured===true,enabled:runway?.enabled===true},vision:{secret_present:vault?.vision_secret_present===true,enabled:vault?.vision_enabled===true,model:vault?.vision_model||null}},owner_activation_required:true,provider_calls_made:0,spend_authorized:false,publishing_authorized:false};
      if(out)out.textContent=JSON.stringify(result,null,2);
      if(badge)badge.textContent=status.replaceAll("_"," ");
      return result;
    }catch(err){if(out)out.textContent="Readiness check failed: "+(err?.message||err);if(badge)badge.textContent="READINESS ERROR";throw err}
  }
  async function runVaultPreview(){try{const data=await vaultAction("private_preview",{ttl_seconds:60});if(data?.signed_url)window.open(data.signed_url,"_blank","noopener,noreferrer")}catch(err){setVaultOutput(err.message||err)}}
  async function sampleVaultFrames(url){
    const ratios=[0.05,0.25,0.5,0.75,0.95],video=document.createElement("video");video.crossOrigin="anonymous";video.preload="auto";video.muted=true;video.playsInline=true;video.src=url;
    await new Promise((resolve,reject)=>{video.onloadedmetadata=resolve;video.onerror=()=>reject(new Error("FRAME_VIDEO_LOAD_FAILED"))});
    if(!(video.duration>0&&Number.isFinite(video.duration)))throw new Error("FRAME_VIDEO_DURATION_INVALID");
    const out=[];for(const ratio of ratios){const t=Math.min(Math.max(video.duration*ratio,0),Math.max(video.duration-0.04,0));await new Promise((resolve,reject)=>{const done=()=>{video.removeEventListener("seeked",done);resolve()};video.addEventListener("seeked",done,{once:true});video.onerror=()=>reject(new Error("FRAME_VIDEO_SEEK_FAILED"));video.currentTime=t});const max=768,scale=Math.min(1,max/Math.max(video.videoWidth||1,video.videoHeight||1)),canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(video.videoWidth*scale));canvas.height=Math.max(1,Math.round(video.videoHeight*scale));const ctx=canvas.getContext("2d");if(!ctx)throw new Error("FRAME_CANVAS_UNAVAILABLE");ctx.drawImage(video,0,0,canvas.width,canvas.height);out.push(canvas.toDataURL("image/jpeg",0.82))}video.removeAttribute("src");video.load();return out
  }
  function vaultVisualContext(){const id=vaultIdentity(),shot=state.brandVideoPlan?.shots?.find(x=>String(x.id||x.shot_id||"")===id.asset_id)||null;return {product_name:state.brandMission?.mission?.product_name||"",reference_images:[state.brandMission?.product_truth_snapshot?.image_url].filter(Boolean),script:shot?JSON.stringify(shot):""}}
  async function runVaultVisualQA(){try{setVaultOutput("Sampling 5 private video frames…");const preview=await vaultAction("private_preview",{ttl_seconds:120});if(!preview?.signed_url)throw new Error("PRIVATE_PREVIEW_REQUIRED");const frames=await sampleVaultFrames(preview.signed_url);setVaultOutput("Sending sampled frames to server-side Visual QA…");await vaultAction("visual_qa_analyze",{frames,...vaultVisualContext()})}catch(err){setVaultOutput(err.message||err)}}
  async function commitVaultQA(){try{await vaultAction("qa_commit",{evidence:vaultEvidence()})}catch(err){setVaultOutput(err.message||err)}}
  async function commitVaultOwnerDecision(decision){try{await vaultAction("owner_decision",{decision,note:$("#vault-owner-note")?.value.trim()||""})}catch(err){setVaultOutput(err.message||err)}}

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


  function brandNum(value){
    const n=Number(String(value||"").replace(/[^0-9.-]/g,""));
    return Number.isFinite(n)?n:null;
  }

  function brandInputs(){
    const price=brandNum($("#brand-price")?.value),cost=brandNum($("#brand-cost")?.value),shipping=brandNum($("#brand-shipping")?.value);
    const productGross=[price,cost].every(v=>v!==null)?price-cost:null;
    const productMargin=productGross!==null&&price>0?(productGross/price)*100:null;
    const subsidizedContribution=[price,cost,shipping].every(v=>v!==null)?price-cost-shipping:null;
    const subsidizedMargin=subsidizedContribution!==null&&price>0?(subsidizedContribution/price)*100:null;
    const customerTotal=[price,shipping].every(v=>v!==null)?price+shipping:null;
    return {
      provider:$("#brand-provider")?.value.trim()||"",item_id:$("#brand-item-id")?.value.trim()||"",variant_id:$("#brand-variant-id")?.value.trim()||"",country_code:($("#brand-country")?.value.trim()||"").toUpperCase(),
      product_name:$("#brand-product-name")?.value.trim()||"",category:$("#brand-category")?.value.trim()||"",target_market:$("#brand-market")?.value.trim()||"",
      price,cost,shipping,currency:($("#brand-currency")?.value.trim()||"USD").toUpperCase(),verified_facts:$("#brand-facts")?.value.trim()||"",proof_notes:$("#brand-proof")?.value.trim()||"",
      product_gross_profit:productGross,product_gross_margin_pct:productMargin,customer_total_before_tax:customerTotal,
      contribution_if_shipping_subsidized:subsidizedContribution,contribution_margin_if_shipping_subsidized:subsidizedMargin,
      source_verified:Boolean(state.brandVerified),verification:state.brandVerified
    };
  }

  function renderBrandFinance(){
    const x=brandInputs(),el=$("#brand-finance");if(!el)return;
    if(x.product_gross_margin_pct===null){el.textContent="Product margin: — · add verified price/cost to calculate";return}
    const base="Product gross: "+x.product_gross_profit.toFixed(2)+" "+x.currency+" · "+x.product_gross_margin_pct.toFixed(1)+"% before fees/tax/ads/returns";
    const shipping=x.shipping===null?"":" · customer total with separate shipping: "+x.customer_total_before_tax.toFixed(2)+" "+x.currency+" · if HUNT subsidizes shipping: "+x.contribution_if_shipping_subsidized.toFixed(2)+" "+x.currency;
    el.textContent=base+shipping;
  }

  function brandPlainText(value){
    const el=document.createElement("div");el.innerHTML=String(value||"");return (el.textContent||"").replace(/\s+/g," ").trim();
  }

  async function verifyBrandProduct(){
    const provider=$("#brand-provider")?.value.trim()||"CJdropshipping";
    const itemId=$("#brand-item-id")?.value.trim()||"";
    const variantId=$("#brand-variant-id")?.value.trim()||"";
    const country=($("#brand-country")?.value.trim()||"IL").toUpperCase();
    const btn=$("#brand-verify"),status=$("#brand-status");
    if(!itemId||!variantId||!/^[A-Z]{2}$/.test(country)){status.textContent="Item ID, Variant ID and a 2-letter country code are required.";return}
    btn.disabled=true;btn.classList.remove("verified");btn.textContent="Verifying…";status.textContent="Rechecking HUNT product truth, stock and destination shipping…";
    try{
      const productUrl=new URL(H.functionsBase+"/hunt-storefront");
      productUrl.searchParams.set("provider",provider);productUrl.searchParams.set("product_id",itemId);productUrl.searchParams.set("country_code",country);
      const productRes=await fetch(productUrl,{headers:{apikey:H.publishableKey},cache:"no-store"});
      const productBody=await productRes.json().catch(()=>({}));
      if(!productRes.ok||!productBody?.product)throw new Error("PRODUCT_RECHECK_FAILED");
      const product=productBody.product,variants=Array.isArray(product.variants)?product.variants:[];
      const variant=variants.find(v=>String(v?.variant_id||"")===variantId);
      if(!variant)throw new Error("VARIANT_RECHECK_FAILED");
      const retailVerified=(variant.retail_price_verified??product.retail_price_verified)===true;
      const profitPass=String(variant.profit_gate_status||product.profit_gate_status||"")==="PASS";
      const retail=Number(variant.retail_price_amount??product.retail_price_amount);
      const cost=Number(variant.price_amount??product.price_amount);
      if(!retailVerified||!profitPass||!(retail>0)||!(cost>=0))throw new Error("PRICE_OR_PROFIT_GATE_NOT_READY");
      const quoteUrl=new URL(H.functionsBase+"/hunt-cj-quote");
      quoteUrl.searchParams.set("vid",variantId);quoteUrl.searchParams.set("country_code",country);quoteUrl.searchParams.set("quantity","1");
      const quoteRes=await fetch(quoteUrl,{headers:{apikey:H.publishableKey},cache:"no-store"});
      const quote=await quoteRes.json().catch(()=>({}));
      const shipping=Array.isArray(quote.shipping_options)?quote.shipping_options[0]:null;
      if(!quoteRes.ok||quote.stock_verified!==true||quote.stock_available!==true)throw new Error("STOCK_RECHECK_FAILED");
      if(quote.shipping_verified!==true||!shipping||!(Number(shipping.price_usd)>=0))throw new Error("SHIPPING_RECHECK_FAILED");
      $("#brand-product-name").value=String(product.title||"").slice(0,120);
      $("#brand-category").value=String(product.category||"").slice(0,80);$("#brand-market").value=country;
      $("#brand-price").value=retail.toFixed(2);$("#brand-cost").value=cost.toFixed(2);$("#brand-shipping").value=Number(shipping.price_usd).toFixed(2);
      $("#brand-currency").value=String(variant.retail_currency||product.retail_currency||"USD").toUpperCase().slice(0,8);
      $("#brand-facts").value=brandPlainText(product.description).slice(0,1200);
      const origin=quote.selected_origin||{};
      $("#brand-proof").value=("HUNT live recheck: retail verified; Profit Gate PASS; stock verified; inventory "+(origin.total_inventory??origin.storage_num??"unknown")+"; shipping verified via "+String(shipping.name||"unknown")+"; ETA "+String(shipping.aging||"unknown")+" days; origin "+String(origin.country_code||"unknown")+".").slice(0,900);
      state.brandVerified={provider,item_id:itemId,variant_id:variantId,country_code:country,retail_price_verified:true,profit_gate_status:"PASS",stock_verified:true,shipping_verified:true,shipping_method:String(shipping.name||""),shipping_eta:String(shipping.aging||""),origin_country_code:String(origin.country_code||""),inventory:Number(origin.total_inventory??origin.storage_num)||null,image_url:String(variant.image_url||product.image_url||""),verified_at:new Date().toISOString()};
      renderBrandFinance();btn.classList.add("verified");btn.textContent="✓ Verified from HUNT";status.textContent="Product Truth verified live · safe to build a draft Brand Mission.";
    }catch(err){state.brandVerified=null;btn.textContent="Verify from HUNT";status.textContent="Verification failed: "+(err.message||err)}
    finally{btn.disabled=false}
  }

  function setBrandPipeline(mode="waiting"){
    const stages=$$("[data-brand-stage]");
    stages.forEach((el,i)=>{
      el.classList.remove("running","done","blocked");
      const label=el.querySelector("span");
      if(mode==="running"){el.classList.add("running");if(label)label.textContent=i===7?"locked":"working"}
      else if(mode==="done"){el.classList.add(i===7?"blocked":"done");if(label)label.textContent=i===7?"awaiting owner":"complete"}
      else if(label)label.textContent=i===7?"locked":"waiting";
    });
  }

  function buildBrandPrompt(x){
    return `BOOM BRAND FACTORY V1 — ANALYSIS/DRAFT ONLY.\nDo not publish, spend money, contact suppliers, change production, or execute campaigns.\nUse ONLY the verified product facts below. Never invent product claims, prices, stock, shipping, reviews, certifications, performance, scarcity, endorsements, or evidence. Unknowns must be labelled UNKNOWN / NEEDS PROOF.\n\nPRODUCT TRUTH:\n${JSON.stringify(x,null,2)}\n\nReturn STRICT JSON only (no markdown) with exactly these top-level keys: mission, audience, positioning, hooks, concepts, scripts, red_team, score, owner_gate.\nRequirements: hooks=10 distinct hooks; concepts=5 ad concepts; scripts=3 short-form video scripts with scene arrays; red_team must identify blocked/unproven claims and missing evidence; score must contain opportunity, brand_fit, creative, proof, margin, overall as 0-100 numbers. owner_gate.status must be DRAFT_REVIEW and owner_gate.next_safe_action must require explicit Owner approval before any publishing or spend. Focus on ethical, truthful marketing and commercial usefulness.`;
  }

  function parseBrandReply(text){
    const raw=String(text||"").trim().replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/,"");
    try{return JSON.parse(raw)}catch{}
    const start=raw.indexOf("{"),end=raw.lastIndexOf("}");
    if(start>=0&&end>start){try{return JSON.parse(raw.slice(start,end+1))}catch{}}
    return null;
  }

  function renderBrandVideoProviders(){
    const host=$("#brand-video-providers"),router=window.BoomVideoRouter;if(!host||!router)return;
    host.innerHTML=Object.values(router.providers).map(p=>'<span><b>'+esc(p.label)+'</b> · '+esc(p.connection)+'</span>').join("");
  }

  function resetBrandVideoPlan(){
    state.brandVideoPlan=null;state.brandCreativeQA=null;const btn=$("#brand-video-plan"),qaBtn=$("#brand-video-qa"),out=$("#brand-video-output"),qaOut=$("#brand-video-qa-output"),qaSummary=$("#brand-qa-summary");
    if(btn)btn.disabled=!Boolean(state.brandMission?.video_prompt_pack);
    if(qaBtn)qaBtn.disabled=true;
    if(out)out.textContent="Complete or load a Brand Mission with a video prompt pack.";
    if(qaOut)qaOut.textContent="No shortlist yet.";if(qaSummary)qaSummary.textContent="Creative QA waiting for a route plan.";
  }

  function buildBrandVideoPlan(){
    const router=window.BoomVideoRouter,out=$("#brand-video-output"),status=$("#brand-status");
    if(!router){if(status)status.textContent="Video Router unavailable.";return}
    if(!state.brandMission?.video_prompt_pack){if(status)status.textContent="No video prompt pack in this mission.";return}
    const image=state.brandVerified?.image_url||state.brandMission?.product_truth_snapshot?.image_url||"";
    const plan=router.buildPlan(state.brandMission,{productImageUrl:image,ownerApproved:false});
    state.brandVideoPlan=plan;state.brandCreativeQA=null;if(out)out.textContent=JSON.stringify(plan,null,2);
    const qaBtn=$("#brand-video-qa");if(qaBtn)qaBtn.disabled=!Boolean(plan?.shots?.length);
    if($("#brand-video-qa-output"))$("#brand-video-qa-output").textContent="No shortlist yet.";if($("#brand-qa-summary"))$("#brand-qa-summary").textContent="Route plan ready · run QA before any generation.";
    if(status)status.textContent="Video route plan ready · generation remains blocked by Owner Gate and provider connection.";
  }

  function runBrandCreativeQA(){
    const qa=window.BoomCreativeQA,status=$("#brand-status"),out=$("#brand-video-qa-output"),summary=$("#brand-qa-summary");
    if(!qa){if(status)status.textContent="Creative QA unavailable.";return}
    if(!state.brandVideoPlan?.shots?.length){if(status)status.textContent="Build the Video Route Plan first.";return}
    const result=qa.tournament(state.brandVideoPlan,state.brandMission,{limit:4,minScore:62});
    state.brandCreativeQA=result;if(out)out.textContent=JSON.stringify(result,null,2);
    if(summary)summary.textContent=result.input_shots+" shots → "+result.finalist_count+" finalists · "+result.generation_reduction_pct+"% fewer generations · execution blocked";
    if(status)status.textContent="Creative QA complete · shortlist only · no generation / no spend.";
  }

  function renderBrandResult(result,raw){
    const title=$("#brand-result-title"),out=$("#brand-output"),scores=$("#brand-scoreboard"),copy=$("#brand-copy");
    if(title)title.textContent=result?.mission?.product_name||brandInputs().product_name||"Brand mission";
    if(out)out.textContent=result?JSON.stringify(result,null,2):String(raw||"No structured output returned.");
    if(scores){
      const s=result?.score||{};
      scores.innerHTML=Object.entries(s).filter(([,v])=>Number.isFinite(Number(v))).map(([k,v])=>'<span class="'+(k==="overall"?"overall":"")+'>'+esc(k.replaceAll("_"," "))+' · '+Math.max(0,Math.min(100,Number(v)))+'</span>').join("");
    }
    if(copy)copy.disabled=false;
    const planBtn=$("#brand-video-plan");if(planBtn)planBtn.disabled=!Boolean(result?.video_prompt_pack);
  }

  async function loadBrandSeed(){
    const status=$("#brand-status");
    try{
      status.textContent="Loading F35 research seed…";
      const res=await fetch("brand-factory-seed-il-0001.json?v=1",{cache:"no-store"});
      if(!res.ok)throw new Error("SEED_LOAD_FAILED");
      const seed=await res.json();
      $("#brand-provider").value="CJdropshipping";$("#brand-country").value="IL";
      $("#brand-item-id").value="2406230329031627300";$("#brand-variant-id").value="2406230329031627500";
      $("#brand-product-name").value="Korean Vintage Floral Phone Case";
      $("#brand-category").value="Phones & Accessories > Cases & Covers > Silicone Cases";$("#brand-market").value="IL";
      $("#brand-price").value="5.99";$("#brand-cost").value="0.70";$("#brand-shipping").value="4.20";$("#brand-currency").value="USD";
      $("#brand-facts").value="Supplier catalog: TPU soft-shell floral phone case; Apple-compatible variants; printed vintage/floral style. Exact model mapping must be rechecked before publish.";
      $("#brand-proof").value="F35 seed snapshot only. Last observed: retail verified, Profit Gate PASS, stock/shipping verified to IL, CJPacket Liquid Line 9-23 day estimate. Re-verify live before rerun or publish.";
      state.brandMission=seed;state.brandVerified=null;$("#brand-verify")?.classList.remove("verified");if($("#brand-verify"))$("#brand-verify").textContent="Verify from HUNT";
      renderBrandFinance();renderBrandResult(seed,JSON.stringify(seed,null,2));setBrandPipeline("done");
      status.textContent="F35 seed loaded · research draft only · Verify from HUNT required before BOOM rerun.";
    }catch(err){status.textContent="Seed error: "+(err.message||err)}
  }

  async function runBrandFactory(ev){
    ev?.preventDefault?.();
    if(state.brandBusy)return;
    const x=brandInputs();
    if(!x.product_name){$("#brand-status").textContent="Product name is required.";return}
    if(x.item_id&&!x.source_verified){$("#brand-status").textContent="This HUNT product must be verified live before Brand Factory can run.";return}
    state.brandBusy=true;setBrandPipeline("running");
    $("#brand-run").disabled=true;$("#brand-status").textContent="BOOM is building a draft mission · no publishing / no spend.";
    try{
      const data=await invokeBoomFunction("hunt-boom-chat",{message:buildBrandPrompt(x),conversation_id:state.conversationId,mode:"chat"});
      if(data?.error)throw new Error(data.error);
      if(data?.conversation_id)state.conversationId=data.conversation_id;
      const raw=String(data.copy_report||data.display_text||data.reply||"");
      const parsed=parseBrandReply(raw);
      state.brandMission=parsed||{raw_output:raw,owner_gate:{status:"DRAFT_REVIEW"}};
      renderBrandResult(parsed,raw);setBrandPipeline("done");
      $("#brand-status").textContent=parsed?"Draft complete · Owner Gate locked before publishing/spend.":"Draft returned, but structured JSON parsing failed · manual review required.";
    }catch(err){
      setBrandPipeline("waiting");$("#brand-status").textContent="Brand Factory error: "+(err.message||err);
    }finally{state.brandBusy=false;$("#brand-run").disabled=false}
  }

  function clearBrandFactory(){
    $("#brand-brief")?.reset();if($("#brand-provider"))$("#brand-provider").value="CJdropshipping";if($("#brand-country"))$("#brand-country").value="IL";if($("#brand-currency"))$("#brand-currency").value="USD";state.brandMission=null;state.brandVerified=null;$("#brand-verify")?.classList.remove("verified");if($("#brand-verify"))$("#brand-verify").textContent="Verify from HUNT";setBrandPipeline("waiting");renderBrandFinance();
    $("#brand-result-title").textContent="No mission yet";$("#brand-scoreboard").innerHTML="";$("#brand-output").textContent="Run one verified product through the factory. Output remains a draft until Owner approval.";$("#brand-copy").disabled=true;resetBrandVideoPlan();$("#brand-status").textContent="Ready · no campaign will be published.";
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
    renderBrandVideoProviders();
    setVaultControls();

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
    await refreshDeploymentReadiness().catch(()=>{});
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
      await refreshDeploymentReadiness().catch(()=>{});
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
  $("#brand-brief")?.addEventListener("submit",runBrandFactory);
  $("#brand-verify")?.addEventListener("click",verifyBrandProduct);
  $("#brand-seed")?.addEventListener("click",loadBrandSeed);
  $("#brand-video-plan")?.addEventListener("click",buildBrandVideoPlan);
  $("#brand-video-qa")?.addEventListener("click",runBrandCreativeQA);
  $("#vault-preview")?.addEventListener("click",runVaultPreview);
  $("#vault-visual-qa")?.addEventListener("click",runVaultVisualQA);
  $("#vault-qa-commit")?.addEventListener("click",commitVaultQA);
  $("#vault-owner-approve")?.addEventListener("click",()=>commitVaultOwnerDecision("approve"));
  $("#vault-owner-reject")?.addEventListener("click",()=>commitVaultOwnerDecision("reject"));
  $("#deployment-readiness-refresh")?.addEventListener("click",()=>refreshDeploymentReadiness().catch(()=>{}));
  $("#brand-clear")?.addEventListener("click",clearBrandFactory);
  $$("#brand-provider,#brand-item-id,#brand-variant-id,#brand-country").forEach(el=>el.addEventListener("input",()=>{state.brandVerified=null;$("#brand-verify")?.classList.remove("verified");if($("#brand-verify"))$("#brand-verify").textContent="Verify from HUNT"}));
  $$("#brand-price,#brand-cost,#brand-shipping,#brand-currency").forEach(el=>el.addEventListener("input",renderBrandFinance));
  $("#brand-copy")?.addEventListener("click",async()=>{try{await navigator.clipboard.writeText($("#brand-output")?.textContent||"");$("#brand-copy").textContent="✓";setTimeout(()=>$("#brand-copy").textContent="COPY",1000)}catch{$("#brand-status").textContent="Copy failed · select the output manually."}});
  $("#intelligence-simulate")?.addEventListener("click",simulateHuntIntelligence);
  $("#planning-build")?.addEventListener("click",buildPlanningDraft);
  $("#planning-revision")?.addEventListener("click",()=>setPlanningDecision("NEEDS_REVISION"));
  $("#planning-approve")?.addEventListener("click",()=>setPlanningDecision("APPROVED_FOR_IMPLEMENTATION_PLANNING"));
  $("#connect-refresh")?.addEventListener("click",async()=>{
    const btn=$("#connect-refresh");
    if(btn){btn.disabled=true;btn.textContent="בודק…"}
    try{await loadAll();renderConnect()}catch(err){showError(err)}finally{if(btn){btn.disabled=false;btn.textContent="בדוק עכשיו"}}
  });
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
    const connectCard=ev.target.closest("[data-connect-id]");
    if(connectCard){inspectConnection(connectCard.dataset.connectId);return}
    const capabilityCard=ev.target.closest("[data-capability-id]");
    if(capabilityCard){renderBrainDetail(capabilityCard.dataset.capabilityId);return}
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
      if(tab.dataset.tab==="connect")renderConnect();
      if(tab.dataset.tab==="hunt-intelligence")renderHuntIntelligence();
      if(tab.dataset.tab==="brand-factory")renderBrandFinance();
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

  setInterval(()=>{if(state.session&&!$("#app-shell")?.hidden)renderConnect()},60000);
  boot().catch(showError);
})();
