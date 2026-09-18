(() => {
  "use strict";

  const H=window.HuntCore;
  const S=window.supabase;
  const previewUrl=new URL(location.href);
  const previewLocalHost=["127.0.0.1","localhost"].includes(location.hostname);
  const previewNetlifyDraft=/^[a-z0-9]+--deep-hunt-market\.netlify\.app$/i.test(location.hostname);
  const SAFE_PREVIEW_BOOT=(previewLocalHost||previewNetlifyDraft)&&previewUrl.searchParams.get("preview")==="1";
  const Truth=window.HuntCountryProductTruth;
  const Taste=window.BoomTasteDNA;
  const Decision=window.BoomDecisionBrain;
  const Memory=window.HuntExperienceMemory;
  const Flow=window.Hunt2037FlowCore;
  const Stylist=window.BoomStylistCore;
  const Mirror=window.BoomMirrorCore;
  const AlphaHarness=window.BoomAlphaTestHarness;
  const EvidencePack=window.BoomAlphaEvidencePack;
  const RCPreview=window.BoomAlphaRCPreview;
  const RCQA=window.BoomAlphaRCQA;
  const FinalGate=window.BoomAlphaFinalGate;
  const ProfessionalWorkbench=window.BoomProfessionalWorkbench;
  if(!H||(!S?.createClient&&!SAFE_PREVIEW_BOOT)){
    document.body.innerHTML='<pre style="color:white;padding:20px">BOOM Studio failed: Supabase client unavailable.</pre>';
    return;
  }

  const client=S?.createClient?S.createClient(
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
  ):null;
  const $=q=>document.querySelector(q);
  const $$=q=>[...document.querySelectorAll(q)];
  const esc=v=>H.esc?.(v)??String(v??"");
  const statusRank={critical:5,blocked:4,watch:3,healthy:2,working:1,offline:0};
  const PLANNING_HISTORY_KEY="boom_hunt_planning_history_v1";

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
    connectorEvidence:{apiLogs:[],sources:[],partners:[],controls:[]},
    brandVideoPlan:null,
    brandCreativeQA:null,
    brandMission:null,
    brandBusy:false,
    brandVerified:null,
    vaultLive:true,
    vaultLast:null,
    huntCapabilities:[],
    selectedCapability:null,
    planningDraft:null,
    simulatedMemoryEvents:[],
    alphaEvidencePack:null,
    alphaRCPreview:null,
    alphaRCQA:null,
    alphaFinalGate:null,
    localPreview:false,
    professionalSnapshot:null
  };

  const studioNodeGroups=[
    {
      id:"intelligence",
      label:"HUNT INTELLIGENCE PIPELINE · A1 → A6",
      tone:"intelligence",
      top:540,
      nodes:[
        ["inventory-truth","A1 Product Truth","Stock · variants · provider truth","✓"],
        ["decision-intelligence","A2 Decision Brain","Ranking · reason codes · confidence","◆"],
        ["feedback-intelligence","A2 Taste DNA","Likes · saves · demand signals","◈"],
        ["memory-continuity","A3 Memory & Actions","History · continuity · corrections","▤"],
        ["hunt-worlds-flow","A4 Dynamic Worlds","Worlds · discovery · controlled surprise","↻"],
        ["boom-stylist","A5 BOOM Stylist","Complete the Look · occasions","✦"],
        ["boom-mirror","A5 Safe Mirror","Consent-first preview · privacy","◉"],
        ["creative-brand-factory","A6 Creative Learning","Brand · creative · visual QA","▶"]
      ]
    },
    {
      id:"release",
      label:"ALPHA QA / RELEASE CONTROL · A7 → A12",
      tone:"release",
      top:825,
      nodes:[
        ["experimentation-learning","A7–A8 Integration & Harness","Experiments · holdouts · fail-closed QA","⌁"],
        ["analytics-truth","A9 Evidence & Analytics","Evidence pack · metric truth","▥"],
        ["merchandising-ux","A10 RC Preview / UX","Private RC · mobile · desktop","▦"],
        ["site-reliability","A11 Full RC QA","Regression · broken flows · health","✓"],
        ["release-control","A12 Final Owner Gate","Go / No-Go · rollback · release","⬢"],
        ["trust-compliance","Trust & Compliance","Claims · privacy · authenticity","◆"]
      ]
    },
    {
      id:"commerce",
      label:"COMMERCE & OPERATIONS CONTROL",
      tone:"commerce",
      top:1010,
      nodes:[
        ["category-orchestrator","Categories","Taxonomy · gaps · rotation","▦"],
        ["sale-readiness","Sale Readiness","Images · variants · product quality","✓"],
        ["pricing-profit","Pricing & Profit","Landed cost · margin · bundles","$"],
        ["supplier-shipping","Supplier & Shipping","Country delivery · tracking · risk","⇄"],
        ["country-localization","Country & Localization","Currency · language · market rules","◎"],
        ["checkout-payment","Checkout & Payment","Cart · callbacks · order creation","▣"],
        ["sales-conversion","Sales & Conversion","Conversion · AOV · offer fit","$"],
        ["marketing-growth","Marketing & Growth","SEO · social · campaigns · learning","◈"],
        ["finance-reconciliation","Finance & Reconciliation","Ledger · settlements · profit release","≡"],
        ["returns-care","Returns & Customer Care","Returns · complaints · delivery issues","↩"],
        ["integration-connections","Integrations","OAuth · APIs · feeds · webhooks","⌘"],
        ["security-access","Security & Access","Auth · RLS · secrets · permissions","◆"],
        ["knowledge-freshness","Knowledge Freshness","Live verification · volatile facts","⟳"],
        ["share-referral","Share & Referral","Sharing · referrals · abuse guard","↗"],
        ["repair-engineering","Repair & Engineering","Bugs · regressions · staged fixes","🔧"]
      ]
    },
    {
      id:"missions",
      label:"F35 / GROWTH MISSIONS",
      tone:"missions",
      top:1395,
      nodes:[
        ["f35-research","F35 Research","Deep research · evidence · opportunities","⚡"],
        ["f35-acquisition","F35 Acquisition","Acquisition opportunities · channels","◎"],
        ["daily-10k-mission","$10K Mission","Daily profit mission · planning only","$"]
      ]
    },
    {
      id:"suppliers",
      label:"SUPPLIER CONNECTORS · STUDIO ONLY",
      tone:"suppliers",
      top:1575,
      nodes:[
        ["supplier-cj","CJ Supplier","Official supplier connector","🔌"],
        ["supplier-eprolo","EPROLO Supplier","Official supplier connector","⬡"],
        ["supplier-hypersku","HyperSKU Supplier","Read-only pilot · Owner-gated","H"]
      ]
    },
    {
      id:"store",
      label:"STORE DEPARTMENTS · CATEGORY OWNERS",
      tone:"store",
      top:1755,
      nodes:[
        ["dept-women","Women","Fashion · shoes · lingerie · accessories","W"],
        ["dept-men","Men","Fashion · suits · shoes · accessories","M"],
        ["dept-kids-baby","Kids & Baby","Kids · baby · family shopping","K"],
        ["dept-beauty","Beauty & Personal Care","Beauty · makeup · fragrances","B"],
        ["dept-jewelry-accessories","Jewelry & Accessories","Jewelry · watches · bags","J"],
        ["dept-home","Home & Living","Home · lighting · office","H"],
        ["dept-tech","Tech & Electronics","Phones · accessories · electronics","T"],
        ["dept-sports","Sports & Outdoors","Gym · sportswear · equipment","S"],
        ["dept-pets","Pets","Cats · dogs · pet living","P"],
        ["dept-toys","Toys","Quality toys · discovery","T"],
        ["dept-travel-office-gifts","Travel / Office / Gifts","Travel · luggage · office · gifts","G"]
      ]
    }
  ];
  const toolNodes=studioNodeGroups.flatMap(group=>group.nodes);
  const studioNodeGroupById=new Map();
  for(const group of studioNodeGroups)for(const node of group.nodes)studioNodeGroupById.set(node[0],group);

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
    const columns=6;
    const colGap=190;
    const rowGap=112;
    const rightStart=35;
    for(const group of studioNodeGroups){
      const rows=Math.ceil(group.nodes.length/columns);
      const frame=document.createElement("section");
      frame.className="studio-node-group studio-node-group-"+group.tone;
      frame.dataset.groupId=group.id;
      frame.style.top=(group.top-32)+"px";
      frame.style.right="20px";
      frame.style.height=(rows*rowGap+74)+"px";
      frame.innerHTML='<div class="studio-node-group-label">'+esc(group.label)+'</div>';
      host.appendChild(frame);
      group.nodes.forEach((node,index)=>{
        const col=index%columns;
        const row=Math.floor(index/columns);
        const el=document.createElement("article");
        el.className="node studio-tool-node";
        el.id="node-"+node[0];
        el.dataset.managerId=node[0];
        el.dataset.groupId=group.id;
        el.style.right=(rightStart+col*colGap)+"px";
        el.style.top=(group.top+row*rowGap)+"px";
        el.innerHTML=
          '<span class="port top"></span>'+
          '<div class="node-head"><span class="node-icon">'+esc(node[3])+'</span><span class="node-title">'+esc(node[1])+'</span></div>'+
          '<div class="node-body"><p>'+esc(node[2])+'</p><footer><span>'+esc(group.label.split(" · ")[0])+'</span><span class="status-dot"></span></footer></div>';
        host.appendChild(el);
      });
    }
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
    addLine(svg,$("#node-eval"),$("#node-output"),"watch");
    for(const group of studioNodeGroups){
      const first=group.nodes[0];
      if(!first)continue;
      const firstStatus=statusOf(first[0]);
      addLine(svg,$("#node-super"),$("#node-"+first[0]),["healthy","working"].includes(firstStatus)?"live":firstStatus);
      if(["intelligence","release"].includes(group.id)){
        for(let i=1;i<group.nodes.length;i++){
          const prev=group.nodes[i-1],current=group.nodes[i];
          const st=statusOf(current[0]);
          addLine(svg,$("#node-"+prev[0]),$("#node-"+current[0]),["healthy","working"].includes(st)?"live":st);
        }
      }
    }
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
    setNodeStatus($("#node-output"),"watch");
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

  function professionalCostSamples(){
    const samples=[];
    const candidates=[...state.events,...state.workerReports,...state.reports];
    for(const row of candidates){
      const meta=row?.metrics||row?.metadata||row?.result||{};
      const latency=Number(meta?.latency_ms??meta?.duration_ms??meta?.latency);
      const cost=Number(meta?.cost??meta?.estimated_cost??meta?.total_cost);
      const tokens=Number(meta?.tokens??meta?.total_tokens??meta?.token_count);
      if([latency,cost,tokens].some(Number.isFinite)){
        samples.push({
          latency_ms:Number.isFinite(latency)?latency:null,
          cost:Number.isFinite(cost)?cost:null,
          tokens:Number.isFinite(tokens)?tokens:null
        });
      }
    }
    return samples;
  }

  function renderProfessionalWorkbench(){
    const summary=$("#professional-summary"),grid=$("#professional-grid"),traceList=$("#professional-trace-list"),failureList=$("#professional-failure-list"),experimentList=$("#professional-experiment-list"),reviewList=$("#professional-review-list"),costReport=$("#professional-cost-report"),report=$("#professional-report");
    if(!summary||!grid||!ProfessionalWorkbench?.build)return null;

    const snapshot=ProfessionalWorkbench.build({
      commands:state.commands,
      events:state.events,
      workerReports:state.workerReports,
      reports:state.reports,
      cycles:state.cycles,
      evals:state.evals,
      decisions:state.decisions,
      costSamples:professionalCostSamples(),
      promptVersions:[],
      datasetStoreConnected:false,
      reviewStoreConnected:false,
      traceSchemaConnected:false,
      alertRulesConnected:false,
      releaseGate:state.alphaFinalGate
    });
    state.professionalSnapshot=snapshot;

    const ready=snapshot.capabilities.filter(x=>x.state==="ready").length;
    const gaps=snapshot.capabilities.filter(x=>x.state==="gap").length;
    const blocked=snapshot.capabilities.filter(x=>x.state==="blocked").length;
    summary.innerHTML=
      '<article><b>'+snapshot.traces.rows.length+'</b><span>TRACE ROWS</span></article>'+
      '<article><b>'+snapshot.failures.dataset_candidates+'</b><span>DATASET CANDIDATES</span></article>'+
      '<article><b>'+ready+'/'+snapshot.capabilities.length+'</b><span>PRO TOOLS READY</span></article>'+
      '<article><b>'+gaps+'</b><span>INSTRUMENTATION GAPS</span></article>';

    grid.innerHTML=snapshot.capabilities.map(item=>
      '<article class="professional-card" data-state="'+esc(item.state)+'">'+
      '<small>'+esc(item.state.toUpperCase())+'</small><h3>'+esc(item.label)+'</h3><p>'+esc(item.evidence)+'</p></article>'
    ).join("");

    $("#professional-trace-meta").textContent=snapshot.traces.failures+" fail · "+snapshot.traces.watch+" watch · "+snapshot.traces.actors+" actors";
    traceList.innerHTML=snapshot.traces.rows.length?snapshot.traces.rows.slice(0,18).map(row=>
      '<article class="professional-trace-row"><span class="professional-kind">'+esc(row.kind.toUpperCase())+'</span>'+
      '<div><strong>'+esc(row.title)+'</strong><p>'+esc(row.actor)+'</p></div>'+
      '<div>'+pill(row.status)+'<br><small>'+esc(ago(row.time))+'</small></div></article>'
    ).join(""):'<article class="professional-mini-row"><div><strong>No trace evidence yet</strong><p>Authenticated runtime data will appear here.</p></div></article>';

    $("#professional-dataset-meta").textContent=snapshot.failures.dataset_candidates+" candidate(s)";
    failureList.innerHTML=snapshot.failures.items.length?snapshot.failures.items.slice(0,12).map(item=>
      '<article class="professional-mini-row"><span class="professional-kind">'+esc(item.source.toUpperCase())+'</span>'+
      '<div><strong>'+esc(item.title)+'</strong><p>'+esc(item.detail)+'</p></div><div>'+pill(item.status)+'</div></article>'
    ).join(""):'<article class="professional-mini-row"><div><strong>Failure inbox empty</strong><p>No current candidate failures.</p></div></article>';

    $("#professional-experiment-meta").textContent=snapshot.experiments.available?snapshot.experiments.comparisons.length+" comparison(s)":"NEEDS 2+ RUNS";
    experimentList.innerHTML=snapshot.experiments.comparisons.length?snapshot.experiments.comparisons.slice(0,10).map(item=>
      '<article class="professional-mini-row"><span class="professional-kind">DIFF</span><div><strong>'+esc(item.metric)+'</strong>'+
      '<p>baseline='+esc(item.baseline??"—")+' · candidate='+esc(item.candidate??"—")+' · Δ='+esc(item.delta??"—")+'</p></div>'+
      '<div>'+pill(item.candidate_pass===true?"healthy":item.candidate_pass===false?"critical":"watch")+'</div></article>'
    ).join(""):'<article class="professional-mini-row"><div><strong>No comparable experiment pair</strong><p>BOOM needs two measured runs for the same metric before claiming improvement.</p></div></article>';

    $("#professional-review-meta").textContent=snapshot.review.count+" item(s)";
    reviewList.innerHTML=snapshot.review.rows.length?snapshot.review.rows.slice(0,12).map(item=>
      '<article class="professional-mini-row"><span class="professional-kind">'+esc(item.kind.toUpperCase())+'</span>'+
      '<div><strong>'+esc(item.title)+'</strong><p>'+esc(item.detail)+'</p></div><div>'+pill(item.status)+'</div></article>'
    ).join(""):'<article class="professional-mini-row"><div><strong>Review queue empty</strong><p>No open failure/decision evidence.</p></div></article>';

    $("#professional-cost-meta").textContent=snapshot.cost.budget_state;
    costReport.textContent=[
      "INSTRUMENTED: "+snapshot.cost.instrumented,
      "SAMPLES: "+snapshot.cost.sample_count,
      "TOTAL COST: "+(snapshot.cost.total_cost??"UNMEASURED"),
      "TOTAL TOKENS: "+(snapshot.cost.total_tokens??"UNMEASURED"),
      "P50 LATENCY MS: "+(snapshot.cost.p50_latency_ms??"UNMEASURED"),
      "P95 LATENCY MS: "+(snapshot.cost.p95_latency_ms??"UNMEASURED"),
      "",
      snapshot.cost.instrumented
        ?"Measured values are derived only from runtime rows that already expose cost/token/latency fields."
        :"GAP: add token, model, prompt-version, cost and latency fields to every model/tool trace before using budgets or alerts."
    ].join("\n");

    report.textContent=[
      "MODE: "+snapshot.mode,
      "PROFESSIONAL READY: "+snapshot.professional_ready,
      "READY TOOLS: "+ready+"/"+snapshot.capabilities.length,
      "GAPS: "+(snapshot.gaps.join(", ")||"none"),
      "BLOCKED: "+blocked,
      "",
      "TRACE SCHEMA: "+(snapshot.capabilities.find(x=>x.id==="traces")?.state||"unknown"),
      "PROMPT REGISTRY: "+snapshot.prompts.status,
      "DATASET CANDIDATES: "+snapshot.failures.dataset_candidates+" · PERSISTED DATASET: "+snapshot.failures.persisted_dataset,
      "REVIEW HISTORY PERSISTED: "+snapshot.review.persisted,
      "EXPERIMENT DIFF: "+(snapshot.experiments.available?"AVAILABLE":"NEEDS_COMPARABLE_RUNS"),
      "COST/LATENCY: "+snapshot.cost.budget_state,
      "ALERTS: critical="+snapshot.alerts.critical+" watch="+snapshot.alerts.watch+" · RULES="+(snapshot.capabilities.find(x=>x.id==="alerts")?.state||"unknown"),
      "RELEASE REPLAY: "+(snapshot.release?"ATTACHED":"NO_GATE_SNAPSHOT"),
      "",
      "MUTATION: false",
      "PRODUCTION CHANGE: false",
      "PUBLISH: false",
      "SPEND: false",
      "PAYMENTS: false",
      "SUPPLIER ORDERS: false",
      "OWNER GATE REQUIRED: true"
    ].join("\n");
    return snapshot;
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

  function connectorAgeLabel(value){
    if(!value)return "never";
    const t=new Date(value).getTime();
    if(!Number.isFinite(t))return "unknown";
    const hours=Math.max(0,(Date.now()-t)/36e5);
    if(hours<1)return "<1h";
    if(hours<24)return Math.floor(hours)+"h";
    return Math.floor(hours/24)+"d";
  }

  function connectorFresh(value,maxHours=168){
    if(!value)return false;
    const t=new Date(value).getTime();
    return Number.isFinite(t)&&Date.now()-t<=maxHours*36e5;
  }

  function latestApiBySource(){
    const map=new Map();
    for(const row of state.connectorEvidence.apiLogs||[]){
      const key=String(row.source||"").toLowerCase();
      if(key&&!map.has(key))map.set(key,row);
    }
    return map;
  }

  function buildEvidenceConnectorRows(){
    const apiMap=latestApiBySource();
    const rows=[];

    for(const partner of state.connectorEvidence.partners||[]){
      const status=String(partner.integration_status||"unknown").toLowerCase();
      const apiVerified=Boolean(partner.order_api_verified_at);
      const trackingVerified=Boolean(partner.tracking_verified_at);
      const termsVerified=Boolean(partner.terms_verified_at);
      const mediaVerified=Boolean(partner.media_rights_verified_at);
      const complete=termsVerified&&mediaVerified&&(!partner.official_api_required||apiVerified)&&(!partner.official_api_required||trackingVerified);
      let tone="watch";
      if(["auth_required","blocked"].includes(status))tone="blocked";
      else if(["terms_review","hold"].includes(status))tone="watch";
      else if(["connected","ready"].includes(status)&&complete)tone="healthy";
      const gaps=[
        termsVerified?"":"terms",
        mediaVerified?"":"media",
        partner.official_api_required&&!apiVerified?"order API":"",
        partner.official_api_required&&!trackingVerified?"tracking":""
      ].filter(Boolean);
      rows.push({
        id:"partner-"+String(partner.partner_name||"").toLowerCase().replace(/[^a-z0-9]+/g,"-"),
        name:String(partner.partner_name||"Partner"),
        kind:"PARTNER · "+String(partner.partner_type||"unknown").toUpperCase(),
        tone,
        detail:"Integration="+status+" · lane="+String(partner.lane||"unknown")+" · checkout="+String(partner.checkout_mode||"unknown"),
        evidence:gaps.length
          ?"Verification gaps: "+gaps.join(", ")+" · updated "+connectorAgeLabel(partner.updated_at)+" ago"
          :"Terms/media/API/tracking evidence complete · updated "+connectorAgeLabel(partner.updated_at)+" ago",
        gate:partner.owner_approval_required?"Owner approval required":"No extra owner gate recorded"
      });
    }

    for(const source of state.connectorEvidence.sources||[]){
      const key=String(source.source_name||"").toLowerCase();
      const api=apiMap.get(key);
      const last=source.last_success||source.last_sync||api?.attempted_at||source.updated_at;
      const verified=String(source.health_status||"").toLowerCase()==="verified_real";
      const fresh=connectorFresh(last,168);
      const enabled=source.enabled===true;
      const tone=enabled&&verified&&fresh?"healthy":(String(source.health_status||"").toLowerCase()==="not_started"?"blocked":"watch");
      rows.push({
        id:"source-"+key.replace(/[^a-z0-9]+/g,"-"),
        name:String(source.provider||source.source_name||"Source"),
        kind:"SOURCE · "+String(source.category||"unknown").toUpperCase(),
        tone,
        detail:"Registry="+String(source.health_status||"unknown")+" · enabled="+String(enabled),
        evidence:"Last success/sync "+connectorAgeLabel(last)+" ago"+
          (api?" · latest API="+String(api.result||"unknown")+" / HTTP "+String(api.http_status??"—"):" · no API log"),
        gate:enabled?"Read-only source use allowed by registry":"Source currently disabled"
      });
    }

    return rows;
  }

  function buildConnectRows(){
    const user=state.session?.user||{};
    const identities=(user.identities||[]).map(x=>x.provider).filter(Boolean);
    const primary=user.app_metadata?.provider||"unknown";
    const host=location.hostname;
    const cjRaw=statusOf("supplier-cj");
    const hyperskuRaw=statusOf("supplier-hypersku");
    const repairRaw=statusOf("repair-engineering");
    const controlMap=new Map((state.connectorEvidence.controls||[]).map(x=>[String(x.key||""),x]));
    const paymentControl=controlMap.get("hunt_payment_live");
    const supplierLiveControl=controlMap.get("hunt_supplier_order_live");

    const base=[
      {id:"supabase",name:"Supabase Core",kind:"IDENTITY + BACKEND",tone:state.localPreview?"watch":"healthy",detail:state.localPreview?"Local Preview does not query live Supabase.":"Studio data loaded successfully from the live Supabase project.",evidence:state.localPreview?"LOCAL_PREVIEW":"Live authenticated query + realtime channel",gate:"Owner gate for config changes"},
      {id:"github",name:"GitHub Admin Auth",kind:"OAUTH",tone:identities.includes("github")||primary==="github"?"healthy":"watch",detail:identities.includes("github")||primary==="github"?"GitHub identity is present on the active admin session.":"Active Studio session does not prove GitHub OAuth end-to-end.",evidence:"Active Supabase identity",gate:"Owner gate for OAuth credentials"},
      {id:"google",name:"Google OAuth",kind:"OAUTH",tone:identities.includes("google")||primary==="google"?"healthy":"watch",detail:identities.includes("google")||primary==="google"?"Google identity is present on the active admin session.":"No current-session Google identity evidence; do not claim green.",evidence:"Active Supabase identity only",gate:"Owner gate for client/secret changes"},
      {id:"netlify",name:"Netlify Hosting",kind:"DEPLOYMENT",tone:host.endsWith("netlify.app")?"healthy":"watch",detail:host.endsWith("netlify.app")?"Studio is currently served from a Netlify hostname.":"Current view is not proving Netlify serving; verify via deploy evidence.",evidence:host||"local",gate:"Owner gate for production promotion"},
      {id:"cj-manager",name:"CJ Supplier Runtime",kind:"SUPPLIER MANAGER",tone:connectTone(cjRaw),detail:"Manager/report state only; partner verification matrix below is authoritative for API/terms/tracking completeness.",evidence:"supplier-cj · "+cjRaw,gate:"Owner gate for supplier/order routing changes"},
      {id:"hypersku",name:"HyperSKU Supplier",kind:"TIER 0 SUPPLIER API",tone:connectTone(hyperskuRaw),detail:"Adapter foundation exists; live Open API auth/read-only verification are not proven.",evidence:"supplier-hypersku · "+hyperskuRaw+" · PILOT",gate:"Read-only first · fulfillment requires explicit Owner approval"},
      {id:"repair",name:"BOOM Repair Engineering",kind:"SELF-HEALING",tone:connectTone(repairRaw),detail:"Safe reversible incidents may be repaired; material changes escalate.",evidence:"repair-engineering · "+repairRaw,gate:"Safe repair auto · material changes gated"},
      {id:"payments",name:"Live Payments",kind:"PAYMENTS",tone:paymentControl?.enabled===true&&paymentControl?.owner_approved===true?"watch":"blocked",detail:paymentControl?.enabled===true?"Runtime control enabled; launch evidence still required.":"Live charging remains intentionally OFF.",evidence:paymentControl?"hunt_payment_live · enabled="+String(paymentControl.enabled)+" · owner="+String(paymentControl.owner_approved):"runtime control unavailable",gate:"Explicit Owner approval required"},
      {id:"supplier-orders",name:"Live Supplier Orders",kind:"FULFILLMENT",tone:supplierLiveControl?.enabled===true&&supplierLiveControl?.owner_approved===true?"watch":"blocked",detail:supplierLiveControl?.enabled===true?"Live supplier order gate enabled; E2E evidence still required.":"Real supplier order creation remains OFF.",evidence:supplierLiveControl?"hunt_supplier_order_live · enabled="+String(supplierLiveControl.enabled)+" · owner="+String(supplierLiveControl.owner_approved):"runtime control unavailable",gate:"Explicit Owner approval required"}
    ];

    return [...base,...buildEvidenceConnectorRows()];
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
  const promptCoverageItems=Object.freeze([
    {id:"studio-first",label:"Studio-first governance",status:"PRESENT",evidence:"Plan and inspect in BOOM Studio before HUNT/Production."},
    {id:"input-output",label:"Input → BOOM Brain → Decision → Output",status:"PRESENT",evidence:"Owner Input, Meta-F35, Super Agent, Eval Guardian and Decision/Owner Output are visible on the canvas."},
    {id:"departments",label:"Ordered department architecture",status:"PRESENT",evidence:"Intelligence A1–A6 → Release A7–A12 → Commerce → F35 → Suppliers → Store Departments."},
    {id:"alpha",label:"A1–A12 Alpha pipeline",status:"PRESENT",evidence:"Truth, Decision/Taste, Memory, Worlds, Stylist/Mirror, Creative, Integration QA, Harness, Evidence, RC Preview, RC QA and Final Gate."},
    {id:"owner-gates",label:"Owner approval / Production separation",status:"PRESENT",evidence:"Merge, Production, payments, order routing, spend and publishing remain separately gated."},
    {id:"connect",label:"BOOM Connect control center",status:"PRESENT",evidence:"OAuth/API/supplier/deployment connection truth has a dedicated Studio surface."},
    {id:"freshness",label:"Knowledge freshness / live verification",status:"PRESENT",evidence:"Knowledge Freshness, Product Truth and supplier/shipping verification are represented."},
    {id:"health-lines",label:"Green / yellow / red health lines",status:"PRESENT",evidence:"Healthy, watch and blocked/critical node/link states are rendered separately."},
    {id:"store-depts",label:"Store category departments",status:"PRESENT",evidence:"Women, Men, Kids, Beauty, Accessories, Home, Tech, Sports, Pets, Toys and Travel/Office/Gifts are visible."},
    {id:"traceability",label:"Product trace: source → shelf → checkout → order → sale",status:"PRESENT",evidence:"BOOM Studio now exposes one read-only trace that joins catalog identity with Admin order pipeline and finance evidence; missing links stay UNVERIFIED."},
    {id:"real-device",label:"Viewport visual QA · 390 / 768 / 1280 / 1440",status:"PARTIAL",evidence:"Previous draft QA exposed 390px page overflow; mobile topbar containment was fixed and requires fresh 4/4 draft-browser revalidation before this can be PRESENT."},
    {id:"supplier-hide",label:"Supplier names hidden from shopper storefront",status:"PRESENT",evidence:"Product, category, profile and HUNT History shopper surfaces use HUNT SOURCE / HUNT ORDER labels while provider identity remains internal for routing and truth."},
    {id:"connect-live",label:"Connector-by-connector truth matrix",status:"PRESENT",evidence:"BOOM Connect exposes each connector as LIVE / WATCH / PILOT / OFF / BLOCKED from runtime evidence: Supabase/GitHub/Netlify are reachable, CJ is WATCH on stock freshness, HyperSKU stays unverified pilot, and Payments remain intentionally OFF."},
    {id:"shopper-actions",label:"Like / Save / Share / History browser E2E",status:"PRESENT",evidence:"Local browser harness passed: Like/Save persist full product metadata, share emits to HUNT Memory, and History grouping receives the interaction events."},
    {id:"search-recommendation-e2e",label:"Search → recommendation → Product browser E2E",status:"PRESENT",evidence:"Private browser E2E passed: phone case search produced 36 curated matches, opened the first real product, and loaded the Product page with HUNT VERIFIED SOURCE and no error state."}
  ]);

  function renderPromptCoverageAudit(){
    const host=$("#prompt-audit-grid"),summary=$("#prompt-audit-summary"),report=$("#prompt-audit-report");
    if(!host||!summary||!report)return;
    const counts={PRESENT:0,PARTIAL:0,MISSING:0};
    for(const item of promptCoverageItems)counts[item.status]=(counts[item.status]||0)+1;
    summary.innerHTML=
      '<article><b>'+counts.PRESENT+'</b><span>PRESENT</span></article>'+
      '<article><b>'+counts.PARTIAL+'</b><span>PARTIAL / VERIFY</span></article>'+
      '<article><b>'+counts.MISSING+'</b><span>MISSING</span></article>';
    host.innerHTML=promptCoverageItems.map(item=>
      '<article class="prompt-audit-item" data-state="'+esc(item.status.toLowerCase())+'">'+
      '<small>'+esc(item.status)+'</small><strong>'+esc(item.label)+'</strong><p>'+esc(item.evidence)+'</p></article>'
    ).join("");
    report.textContent=[
      "MODE: OWNER_PROMPT_COVERAGE_AUDIT",
      "PRESENT: "+counts.PRESENT,
      "PARTIAL / VERIFY: "+counts.PARTIAL,
      "MISSING: "+counts.MISSING,
      "",
      ...promptCoverageItems.map(item=>item.status+" · "+item.label+" · "+item.evidence),
      "",
      "NEXT SAFE ACTION: Resolve PARTIAL items in the private BOOM Studio preview before any Production decision."
    ].join("\n");
  }

  const traceUuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  async function traceOrderByKey(key){
    let query=client.from("hunt_orders").select("id,provider,external_order_id,status,total_amount,currency,carrier,tracking_number,estimated_delivery_at,placed_at,updated_at,is_test,order_source");
    query=traceUuidPattern.test(key)?query.eq("id",key):query.eq("external_order_id",key);
    const {data,error}=await query.order("updated_at",{ascending:false}).limit(1);
    if(error)throw error;
    return Array.isArray(data)?data[0]||null:null;
  }

  async function runProductTrace(){
    const input=$("#product-trace-key"),button=$("#product-trace-run"),status=$("#product-trace-status"),grid=$("#product-trace-grid"),report=$("#product-trace-report");
    const key=String(input?.value||"").trim();
    if(!key){
      if(status)status.textContent="REFERENCE_REQUIRED · READ_ONLY";
      if(report)report.textContent="Enter an Order UUID, External Order ID or Payment Session UUID.";
      return null;
    }
    if(state.localPreview){
      if(status)status.textContent="LOCAL_PREVIEW · LIVE TRACE DISABLED";
      if(report)report.textContent=[
        "MODE: LOCAL_PREVIEW_PRODUCT_TRACE",
        "LIVE QUERY: false",
        "READ ONLY: true",
        "INTEGRITY RULE: Product identity must come from hunt_fulfillment_orders.line_items before any source/shelf claim.",
        "Open authenticated BOOM Studio to run the live trace."
      ].join("\n");
      return null;
    }
    if(!state.session){
      if(status)status.textContent="AUTH_REQUIRED · READ_ONLY";
      return null;
    }

    if(button)button.disabled=true;
    if(status)status.textContent="TRACING · READ_ONLY";
    try{
      let order=await traceOrderByKey(key);
      let seededPaymentSessionId=null;

      if(!order&&traceUuidPattern.test(key)){
        const [pipelineSeed,fulfillmentSeed]=await Promise.all([
          client.from("hunt_order_pipeline_runs")
            .select("payment_session_id,order_id,created_at")
            .eq("payment_session_id",key)
            .order("created_at",{ascending:false})
            .limit(1),
          client.from("hunt_fulfillment_orders")
            .select("payment_session_id,order_id,created_at")
            .eq("payment_session_id",key)
            .order("created_at",{ascending:false})
            .limit(1)
        ]);
        if(pipelineSeed.error)throw pipelineSeed.error;
        if(fulfillmentSeed.error)throw fulfillmentSeed.error;
        const seed=(Array.isArray(pipelineSeed.data)?pipelineSeed.data[0]:null)||(Array.isArray(fulfillmentSeed.data)?fulfillmentSeed.data[0]:null)||null;
        seededPaymentSessionId=seed?.payment_session_id||key;
        if(seed?.order_id)order=await traceOrderByKey(seed.order_id);
      }

      if(!order){
        if(status)status.textContent="NOT_FOUND_OR_NOT_AUTHORIZED · READ_ONLY";
        if(grid)grid.innerHTML='<article class="product-trace-stage" data-state="blocked"><small>TRACE</small><strong>No order evidence found</strong><p>The reference may not exist or may not be visible under current RLS.</p></article>';
        if(report)report.textContent="No readable HUNT order was resolved from the supplied reference. No data was changed.";
        return null;
      }

      const [pipelineResult,financeResult,fulfillmentResult]=await Promise.all([
        client.from("hunt_order_pipeline_runs")
          .select("id,payment_session_id,run_mode,stage,status,provider,supplier_order_id,supplier_order_code,tracking_number,last_error,created_at,updated_at")
          .eq("order_id",order.id)
          .order("created_at",{ascending:true}),
        client.from("hunt_order_finance_ledger")
          .select("payment_session_id,currency,customer_gross,contribution_locked,available_profit,settlement_status,supplier_payment_status,owner_payout_status,is_test,calculated_at,settled_at,updated_at")
          .eq("order_id",order.id)
          .order("updated_at",{ascending:false})
          .limit(1),
        client.from("hunt_fulfillment_orders")
          .select("id,payment_session_id,order_id,provider,status,line_items,supplier_order_id,supplier_order_code,supplier_status,tracking_number,last_error,created_at,updated_at")
          .eq("order_id",order.id)
          .order("created_at",{ascending:true})
      ]);
      if(pipelineResult.error)throw pipelineResult.error;
      if(financeResult.error)throw financeResult.error;
      if(fulfillmentResult.error)throw fulfillmentResult.error;

      const pipeline=Array.isArray(pipelineResult.data)?pipelineResult.data:[];
      const ledger=Array.isArray(financeResult.data)?financeResult.data[0]||null:null;
      const fulfillment=Array.isArray(fulfillmentResult.data)?fulfillmentResult.data:[];
      const paymentSessionId=seededPaymentSessionId||
        fulfillment.find(row=>row.payment_session_id)?.payment_session_id||
        pipeline.find(row=>row.payment_session_id)?.payment_session_id||
        ledger?.payment_session_id||
        null;

      const lineRefs=[];
      const seenRefs=new Set();
      for(const row of fulfillment){
        const rowProvider=String(row.provider||order.provider||"").trim();
        const items=Array.isArray(row.line_items)?row.line_items:[];
        for(const item of items){
          const itemId=String(item?.item_id||"").trim();
          if(!itemId)continue;
          const provider=rowProvider||String(order.provider||"").trim();
          const refKey=provider.toLowerCase()+":"+itemId;
          if(seenRefs.has(refKey))continue;
          seenRefs.add(refKey);
          lineRefs.push({
            provider,
            item_id:itemId,
            variant_id:String(item?.variant_id||""),
            title:String(item?.title||""),
            qty:Number(item?.qty||1)
          });
        }
      }

      const catalogChecks=await Promise.all(lineRefs.map(async ref=>{
        const {data,error}=await client.from("hunt_catalog_products")
          .select("provider,item_id,category,title,availability_verified,source_fresh_at,updated_at,stock_quantity,authenticity_status,market_eligibility_status")
          .eq("provider",ref.provider)
          .eq("item_id",ref.item_id)
          .limit(1);
        return {ref,row:!error&&Array.isArray(data)?data[0]||null:null,error:error||null};
      }));
      const catalogMatches=catalogChecks.filter(x=>x.row);
      const catalogErrors=catalogChecks.filter(x=>x.error);
      const exactProductEvidence=lineRefs.length>0;
      const allCatalogMatched=exactProductEvidence&&catalogMatches.length===lineRefs.length;
      const allAvailabilityVerified=allCatalogMatched&&catalogMatches.every(x=>x.row?.availability_verified===true);

      const latestPipeline=pipeline[pipeline.length-1]||null;
      const money=(value,currency)=>value===null||value===undefined?"—":Number(value).toFixed(2)+" "+String(currency||"USD");
      const categories=[...new Set(catalogMatches.map(x=>x.row?.category).filter(Boolean))];
      const providers=[...new Set(lineRefs.map(x=>x.provider).filter(Boolean))];

      const stages=[
        {
          id:"SOURCE",
          state:exactProductEvidence?"pass":"blocked",
          title:"Internal source + exact line items",
          detail:exactProductEvidence
            ? lineRefs.length+" product ref(s) from fulfillment · "+(providers.join(", ")||"provider unknown")
            : "No exact product item_id found in fulfillment line_items"
        },
        {
          id:"SHELF",
          state:allAvailabilityVerified?"pass":(allCatalogMatched?"watch":exactProductEvidence?"watch":"blocked"),
          title:"HUNT catalog / shelf truth",
          detail:exactProductEvidence
            ? catalogMatches.length+"/"+lineRefs.length+" catalog match(es) · "+(categories.join(", ")||"category unknown")+
              (allAvailabilityVerified?" · availability verified":" · live availability not fully verified")
            : "Cannot claim shelf truth without exact product identity"
        },
        {
          id:"CHECKOUT",
          state:paymentSessionId&&exactProductEvidence?"pass":(paymentSessionId?"watch":"blocked"),
          title:"Checkout session link",
          detail:paymentSessionId
            ? "Session "+paymentSessionId.slice(0,8)+"… linked through fulfillment/pipeline evidence · session payload remains RLS-gated"
            : "No payment-session reference"
        },
        {
          id:"ORDER",
          state:exactProductEvidence?"pass":"watch",
          title:"HUNT order",
          detail:String(order.status||"unknown")+" · "+(order.is_test?"TEST":"LIVE/UNMARKED")+" · "+String(order.external_order_id||order.id)
        },
        {
          id:"PIPELINE",
          state:latestPipeline?(latestPipeline.status==="pass"?"pass":latestPipeline.status==="fail"?"blocked":"watch"):"watch",
          title:"Fulfillment pipeline",
          detail:latestPipeline
            ? pipeline.length+" run(s) · "+String(latestPipeline.run_mode)+" · "+String(latestPipeline.stage)+" · "+String(latestPipeline.status)
            : fulfillment.length
              ? fulfillment.length+" fulfillment record(s) · no pipeline run recorded"
              : "No fulfillment/pipeline evidence recorded"
        },
        {
          id:"FINANCE",
          state:ledger?(ledger.settlement_status==="settled"?"pass":"watch"):"watch",
          title:"Finance / sale",
          detail:ledger
            ? String(ledger.settlement_status)+" · profit "+money(ledger.available_profit,ledger.currency)+" · payout "+String(ledger.owner_payout_status)
            : "No finance ledger row recorded — sale/profit remains UNVERIFIED"
        }
      ];

      if(grid)grid.innerHTML=stages.map(stage=>
        '<article class="product-trace-stage" data-state="'+esc(stage.state)+'">'+
        '<small>'+esc(stage.id)+'</small><strong>'+esc(stage.title)+'</strong><p>'+esc(stage.detail)+'</p></article>'
      ).join("");

      if(status)status.textContent="TRACE_READY · "+stages.filter(x=>x.state==="pass").length+"/"+stages.length+" VERIFIED/RESOLVED · READ_ONLY";
      if(report)report.textContent=[
        "MODE: BOOM_INTERNAL_PRODUCT_TRACE",
        "READ_ONLY: true",
        "ORDER ID: "+order.id,
        "EXTERNAL ORDER: "+String(order.external_order_id||"—"),
        "ORDER STATUS: "+String(order.status||"unknown"),
        "PRODUCT REFS FROM FULFILLMENT: "+lineRefs.length,
        "CATALOG MATCHES: "+catalogMatches.length+"/"+lineRefs.length,
        "CATALOG QUERY ERRORS: "+catalogErrors.length,
        "EXACT ITEM IDS: "+(lineRefs.map(x=>x.item_id).join(", ")||"none"),
        "INTERNAL PROVIDERS: "+(providers.join(", ")||"none"),
        "SHOPPER SUPPLIER LABEL: HIDDEN",
        "PAYMENT SESSION: "+String(paymentSessionId||"none"),
        "PIPELINE RUNS: "+pipeline.length,
        "FULFILLMENT RECORDS: "+fulfillment.length,
        "LATEST PIPELINE: "+(latestPipeline?String(latestPipeline.run_mode)+" / "+String(latestPipeline.stage)+" / "+String(latestPipeline.status):"none"),
        "FINANCE SETTLEMENT: "+String(ledger?.settlement_status||"none"),
        "AVAILABLE PROFIT: "+(ledger?money(ledger.available_profit,ledger.currency):"—"),
        "OWNER PAYOUT: "+String(ledger?.owner_payout_status||"none"),
        "CUSTOMER EMAIL DISPLAYED: false",
        "CUSTOMER ADDRESS DISPLAYED: false",
        "DATA_CHANGED: false",
        "",
        "INTEGRITY RULE: Source/Shelf claims require exact item_id from fulfillment line_items; missing finance stays UNVERIFIED."
      ].join("\n");
      return {order,pipeline,ledger,fulfillment,lineRefs,catalogMatches,paymentSessionId,stages};
    }catch(err){
      if(status)status.textContent="TRACE_ERROR · READ_ONLY";
      if(report)report.textContent="Trace failed safely: "+String(err?.message||err)+"\nDATA_CHANGED: false";
      return null;
    }finally{
      if(button)button.disabled=false;
    }
  }

  const huntAlphaStages=Object.freeze([
    {id:"A1",name:"Truth Foundation",brains:["country-shipping","product-truth"],goal:"Normalize exact SKU, stock, country, shipping, landed cost and freshness.",gate:"No stale or ineligible product enters Alpha."},
    {id:"A2",name:"Decision & Taste",brains:["decision-intelligence","taste-dna"],goal:"Explainable ranking with cold-start, affinity, novelty and fatigue controls.",gate:"Every recommendation returns reasons and hard-gate evidence."},
    {id:"A3",name:"Memory & Actions",brains:["hunt-memory"],goal:"Connect real impression, dwell, Like, Save, Share and History signals.",gate:"No fabricated behavior; user controls remain available."},
    {id:"A4",name:"Dynamic Flow",brains:["dynamic-worlds"],goal:"One reversible HUNT 2037 session with real products and stable facts.",gate:"Feature flag ON only in Alpha; current storefront stays fallback."},
    {id:"A5",name:"Personal Studio",brains:["boom-stylist","boom-mirror"],goal:"Stylist flow and privacy-safe Mirror entry using verified product anchors.",gate:"Consent required; rendering provider and exact-fit claims remain OFF."},
    {id:"A6",name:"Creative Learning",brains:["creative-brand-factory"],goal:"Prepare small truthful creative tests for selected Hero Products.",gate:"Private QA and Owner review before any paid generation or publishing."},
    {id:"A7",name:"Integration QA",brains:["decision-intelligence","product-truth","dynamic-worlds"],goal:"Verify mobile, desktop, keyboard, performance, fallbacks and checkout preservation.",gate:"Alpha report required before any production decision."}
  ]);

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
    state.planningDraft={id:"PLAN-"+Date.now(),version:nextPlanningVersion(),objective,status:"DRAFT_REVIEW",created_at:new Date().toISOString(),execution_allowed:false};
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
    appendPlanningHistory(state.planningDraft);
  }

  function setPlanningDecision(status){
    if(!state.planningDraft)return;
    state.planningDraft={...state.planningDraft,status,execution_allowed:false,decided_at:new Date().toISOString()};
    $("#planning-status").textContent=status+" · IMPLEMENTATION PLANNING ONLY · EXECUTION_OFF";
    const output=$("#planning-output");
    output.textContent+="\n\nOWNER DECISION: "+status+"\nLIVE EXECUTION REMAINS BLOCKED.";
    appendPlanningHistory(state.planningDraft);
  }

  function readPlanningHistory(){
    try{
      const rows=JSON.parse(localStorage.getItem(PLANNING_HISTORY_KEY)||"[]");
      return Array.isArray(rows)?rows:[];
    }catch{return []}
  }

  function nextPlanningVersion(){
    return readPlanningHistory().reduce((max,row)=>Math.max(max,Number(row.version)||0),0)+1;
  }

  function appendPlanningHistory(entry){
    const rows=readPlanningHistory();
    const snapshot=Object.freeze({
      id:String(entry.id||"PLAN-"+Date.now()),
      version:Number(entry.version)||nextPlanningVersion(),
      objective:String(entry.objective||""),
      status:String(entry.status||"DRAFT_REVIEW"),
      recorded_at:String(entry.decided_at||entry.created_at||new Date().toISOString()),
      execution_allowed:false,
      production_changed:false,
      spend_authorized:false,
      publishing_authorized:false
    });
    rows.unshift(snapshot);
    try{localStorage.setItem(PLANNING_HISTORY_KEY,JSON.stringify(rows.slice(0,100)))}catch{}
    renderApprovalQueue(rows.slice(0,100));
    return snapshot;
  }

  function renderApprovalQueue(rows=readPlanningHistory()){
    const host=$("#approval-queue");
    if(!host)return;
    if(!rows.length){host.innerHTML='<p class="approval-empty">No planning decisions yet.</p>';return}
    host.innerHTML=rows.map(row=>
      '<article class="approval-entry" data-status="'+esc(row.status)+'">'+
        '<div class="approval-entry-head"><strong>Version '+esc(row.version)+'</strong><small>'+esc(row.status)+'</small></div>'+
        '<p>'+esc(row.objective||"Untitled planning objective")+'</p>'+
        '<footer><span>'+esc(new Date(row.recorded_at).toLocaleString())+'</span><span>EXECUTION OFF</span></footer>'+
      '</article>'
    ).join("");
  }

  function renderAlphaBlueprint(){
    const host=$("#alpha-stage-grid");
    if(!host)return;
    host.innerHTML=huntAlphaStages.map(stage=>
      '<article class="alpha-stage"><header><b>'+esc(stage.id+" · "+stage.name)+'</b><em>PLANNED</em></header>'+
      '<p>'+esc(stage.goal)+'</p><footer>'+esc(stage.brains.join(" → "))+'<br>GATE: '+esc(stage.gate)+'</footer></article>'
    ).join("");
  }

  function loadAlphaPlan(){
    const input=$("#planning-objective");
    if(input)input.value="Prepare HUNT 2037 Alpha inside BOOM Studio using verified real products, explainable intelligence, memory, Worlds, Stylist, privacy-safe Mirror entry and preserved checkout fallback. No production activation.";
    buildPlanningDraft();
  }

  function truthValue(id){
    return String($("#"+id)?.value||"").trim();
  }

  function evaluateTruthWorkspace(){
    const output=$("#truth-result");
    const status=$("#truth-result-status");
    if(!Truth?.evaluate){
      status.textContent="TRUTH_ENGINE_UNAVAILABLE · EXECUTION_OFF";
      output.textContent="The Product Truth engine is unavailable. Nothing was executed.";
      return;
    }
    const checked=truthValue("truth-checked-at");
    const input={
      provider:truthValue("truth-provider"),
      destination_country:truthValue("truth-country"),
      item_id:truthValue("truth-item-id"),
      sku:truthValue("truth-sku"),
      variant_id:truthValue("truth-variant-id"),
      warehouse:truthValue("truth-warehouse"),
      stock:truthValue("truth-stock"),
      stock_checked_at:checked?new Date(checked).toISOString():null,
      source_checked_at:checked?new Date(checked).toISOString():null,
      supplier_cost:truthValue("truth-cost"),
      shipping_cost:truthValue("truth-shipping"),
      landed_cost:truthValue("truth-landed"),
      retail_price:truthValue("truth-retail"),
      shipping_method:truthValue("truth-shipping-method"),
      eta_min_days:truthValue("truth-eta-min"),
      eta_max_days:truthValue("truth-eta-max"),
      returns_state:truthValue("truth-returns"),
      country_supported:Boolean($("#truth-country-supported")?.checked),
      restrictions:$("#truth-restricted")?.checked?["OWNER_REVIEW_REQUIRED"]:[]
    };
    const result=Truth.evaluate(input,{requireEconomics:true,minContribution:1.5,minMarginRate:.12});
    status.textContent=result.truth_status+" · "+(result.eligible?"EVIDENCE PASSED":"BLOCKED / RECHECK")+" · EXECUTION_OFF";
    output.textContent=[
      "MODE: A1_STUDIO_SIMULATION",
      "TRUTH STATUS: "+result.truth_status,
      "ELIGIBLE FOR ALPHA PLANNING: "+result.eligible,
      "ISSUES: "+(result.issues.join(", ")||"none"),
      "CONTRIBUTION: "+(result.economics.contribution??"UNKNOWN"),
      "MARGIN RATE: "+(result.economics.margin_rate===null?"UNKNOWN":(result.economics.margin_rate*100).toFixed(2)+"%"),
      "PROVIDER: "+result.product.provider,
      "ITEM / VARIANT: "+result.product.item_id+" / "+(result.product.variant_id||result.product.sku||"UNKNOWN"),
      "DESTINATION: "+result.product.destination_country,
      "EXECUTION_ALLOWED: false",
      "PUBLISHED: false",
      "SUPPLIER_CALLED: false"
    ].join("\n");
  }

  function decisionNumber(id,scale=1){
    const value=Number(truthValue(id));
    return Number.isFinite(value)?value/scale:0;
  }

  function evaluateDecisionWorkspace(){
    const output=$("#decision-result");
    const status=$("#decision-result-status");
    if(!Taste?.candidateSignals||!Decision?.scoreCandidate){
      status.textContent="DECISION_ENGINE_UNAVAILABLE · EXECUTION_OFF";
      output.textContent="Decision Brain or Taste DNA is unavailable. Nothing was executed.";
      return;
    }
    const category=truthValue("decision-category").toLowerCase();
    const provider=truthValue("decision-provider").toLowerCase();
    const interactions=Math.max(0,Math.round(decisionNumber("decision-interactions")));
    const tasteScore=decisionNumber("decision-taste-score");
    const profile={
      interactions,
      mode:Taste.modeFor(interactions),
      confidence:Math.min(1,interactions/20),
      categories:category?[{key:category,score:tasteScore}]:[],
      providers:[],
      worlds:[],
      controls:{sensitive_traits_used:false,body_traits_used:false,reset_supported:true}
    };
    const taste=Taste.candidateSignals(profile,{category,provider});
    const context={interactions,recent_categories:[],recent_suppliers:[],recent_product_keys:[],taste_profile:profile};
    const candidate={
      product_key:provider+":studio-simulation",
      category,
      supplier:provider,
      safety_eligible:true,
      market_eligible:Boolean($("#decision-market")?.checked),
      shipping_eligible:Boolean($("#decision-shipping-eligible")?.checked),
      truth_status:$("#decision-truth-live")?.checked?"live_verified":"RECHECK_REQUIRED",
      stock_available:Boolean($("#decision-stock")?.checked),
      image_verified:Boolean($("#decision-media")?.checked),
      relevance:decisionNumber("decision-relevance",100),
      affinity:taste.affinity,
      quality:decisionNumber("decision-quality",100),
      shipping_score:decisionNumber("decision-shipping",100),
      trust_score:decisionNumber("decision-trust",100),
      freshness:decisionNumber("decision-freshness",100),
      novelty:decisionNumber("decision-novelty",100),
      creative_performance:decisionNumber("decision-creative",100),
      margin_ratio:decisionNumber("decision-margin",100),
      hide_risk:taste.hide_risk
    };
    const result=Decision.scoreCandidate(candidate,context,0);
    status.textContent=(result.eligible?"ELIGIBLE":"BLOCKED")+" · "+profile.mode.toUpperCase()+" · EXECUTION_OFF";
    output.textContent=[
      "MODE: A2_STUDIO_SIMULATION",
      "PERSONALIZATION MODE: "+profile.mode,
      "TASTE CONFIDENCE: "+(profile.confidence*100).toFixed(0)+"%",
      "SENSITIVE TRAITS USED: false",
      "BODY TRAITS USED: false",
      "ELIGIBLE: "+result.eligible,
      "SCORE: "+result.score,
      "DISCOVERY LANE: "+result.lane,
      "REASONS: "+(result.reasons||[]).join(", "),
      "EXPLANATION: "+Decision.explain(result),
      "COMPONENTS: "+JSON.stringify(result.components||{}),
      "EXECUTION_ALLOWED: false",
      "STOREFRONT_CHANGED: false"
    ].join("\n");
  }

  function renderMemorySimulation(){
    const list=$("#memory-event-list");
    const output=$("#memory-context-result");
    if(!list||!output)return;
    const rows=state.simulatedMemoryEvents;
    list.innerHTML=rows.length?rows.slice().reverse().map(row=>
      '<div class="memory-event"><span>'+esc(row.category||"uncategorized")+' · '+esc(row.item_id||"no item")+'</span><em>'+esc(row.type)+'</em></div>'
    ).join(""):'<p>No simulated events.</p>';
    const context=Memory?.decisionContext?.(rows)||{interactions:0,category_affinity:{},supplier_affinity:{},signal_counts:{}};
    const profile=Taste?.buildProfile?.(rows)||{mode:"cold_start",confidence:0,categories:[]};
    output.textContent=[
      "MODE: A3_ISOLATED_MEMORY_SIMULATION",
      "INTERACTIONS: "+context.interactions,
      "PERSONALIZATION MODE: "+String(profile.mode||"cold_start").toUpperCase(),
      "CONFIDENCE: "+((Number(profile.confidence)||0)*100).toFixed(0)+"%",
      "CATEGORY AFFINITY: "+JSON.stringify(context.category_affinity||{}),
      "SUPPLIER AFFINITY: "+JSON.stringify(context.supplier_affinity||{}),
      "SIGNAL COUNTS: "+JSON.stringify(context.signal_counts||{}),
      "RECENT PRODUCTS: "+(context.recent_product_keys||[]).join(", "),
      "REAL PROFILE WRITTEN: false",
      "HUNT HISTORY CHANGED: false",
      "EXECUTION_ALLOWED: false"
    ].join("\n");
  }

  function addSimulatedMemoryEvent(){
    if(!Memory?.normalize)return;
    const row=Memory.normalize({
      type:truthValue("memory-action"),
      category:truthValue("memory-category"),
      provider:truthValue("memory-provider"),
      item_id:truthValue("memory-item-id"),
      source:"boom-studio-isolated-simulation"
    });
    state.simulatedMemoryEvents.push(row);
    if(state.simulatedMemoryEvents.length>100)state.simulatedMemoryEvents.shift();
    renderMemorySimulation();
  }

  function resetMemorySimulation(){
    state.simulatedMemoryEvents=[];
    renderMemorySimulation();
  }

  function simulateDynamicFlow(){
    const preview=$("#flow-preview");
    const output=$("#flow-result");
    const status=$("#flow-result-status");
    if(!Decision?.laneFor||!Flow?.WORLDS){
      status.textContent="FLOW_ENGINE_UNAVAILABLE · STOREFRONT_OFF";
      output.textContent="Dynamic Flow engine is unavailable. HUNT was not changed.";
      return;
    }
    const interactions=Math.max(0,Math.round(decisionNumber("flow-interactions")));
    const context={interactions};
    const mode=Decision.modeFor(context);
    const slots=Math.max(4,Math.min(18,Math.round(decisionNumber("flow-slots"))||10));
    const allowSurprise=Boolean($("#flow-surprise")?.checked);
    const allowNew=Boolean($("#flow-new")?.checked);
    const reducedMotion=Boolean($("#flow-reduced-motion")?.checked);
    const worldId=truthValue("flow-world");
    const worlds=(worldId==="all"?Flow.WORLDS:Flow.WORLDS.filter(world=>world.id===worldId));
    const rows=Array.from({length:slots},(_,index)=>{
      let lane=Decision.laneFor(index,context);
      if(lane==="wildcard"&&!allowSurprise)lane="adjacent";
      if(lane==="new"&&!allowNew)lane="quality";
      const world=worlds[index%Math.max(1,worlds.length)]||Flow.WORLDS[0];
      return {position:index+1,lane,world};
    });
    preview.innerHTML=rows.map(row=>
      '<article class="flow-slot" data-lane="'+esc(row.lane)+'"><small>SLOT '+row.position+' · '+esc(row.world?.title||"HUNT World")+'</small>'+
      '<strong>'+esc(String(row.lane).toUpperCase())+'</strong><span>VERIFIED ELIGIBLE PRODUCT REQUIRED</span></article>'
    ).join("");
    status.textContent="COMPOSED · "+mode.toUpperCase()+" · "+slots+" EMPTY VERIFIED-PRODUCT SLOTS · STOREFRONT_OFF";
    output.textContent=[
      "MODE: A4_STRUCTURE_SIMULATION",
      "SESSION SEED: "+truthValue("flow-seed"),
      "PERSONALIZATION MODE: "+mode,
      "WORLD ORDER: "+worlds.map(world=>world.id).join(" → "),
      "LANE ORDER: "+rows.map(row=>row.lane).join(" → "),
      "CONTROLLED SURPRISE: "+allowSurprise,
      "NEW LANE: "+allowNew,
      "REDUCED MOTION: "+reducedMotion,
      "PRODUCTS INVENTED: 0",
      "VERIFIED PRODUCT REQUIRED PER SLOT: true",
      "STOREFRONT_CHANGED: false",
      "FEATURE_FLAG_CHANGED: false",
      "EXECUTION_ALLOWED: false"
    ].join("\n");
  }

  function simulatePersonalStudio(){
    const stylistOutput=$("#stylist-result");
    const mirrorOutput=$("#mirror-result");
    const status=$("#personal-result-status");
    if(!Stylist?.createMission||!Mirror?.renderDecision){
      status.textContent="PERSONAL_ENGINES_UNAVAILABLE · PROVIDER_OFF";
      return;
    }
    const category=truthValue("personal-category");
    const provider=truthValue("personal-provider");
    const itemId=truthValue("personal-item-id");
    const variantId=truthValue("personal-variant-id");
    const occasion=truthValue("personal-occasion");
    const productType=truthValue("personal-product-type");
    const country=truthValue("personal-country");
    const mission=Stylist.createMission({
      anchor:{provider,item_id:itemId,category,price:decisionNumber("personal-anchor-price")},
      occasion,
      budget:decisionNumber("personal-budget"),
      country,
      context:{recent_categories:[],saved_categories:[]}
    });
    const consent=Mirror.createConsent({
      accepted:Boolean($("#personal-consent")?.checked),
      photo_preview:Boolean($("#personal-preview-permission")?.checked),
      retention:truthValue("personal-retention"),
      share_allowed:false
    });
    const consentCheck=Mirror.validateConsent(consent);
    const product={
      provider,item_id:itemId,variant_id:variantId,
      image_verified:Boolean($("#personal-image-verified")?.checked),
      truth_status:$("#personal-truth-live")?.checked?"live_verified":"RECHECK_REQUIRED"
    };
    const decision=Mirror.renderDecision({
      productType,product,
      confidence:decisionNumber("personal-confidence",100),
      reducedMotion:Boolean($("#personal-reduced-motion")?.checked)
    });
    const safePreview=consentCheck.valid&&decision.can_render;
    status.textContent=(safePreview?"SAFE_PREVIEW_PLAN_READY":"BLOCKED / FALLBACK")+" · PROVIDER_OFF · EXECUTION_OFF";
    stylistOutput.textContent=[
      "MODE: A5_STYLIST_SIMULATION",
      "OCCASION: "+mission.occasion_label,
      "TARGET CATEGORIES: "+(mission.target_categories.join(", ")||"NO COMPLEMENT MAP"),
      "BUDGET TOTAL: "+mission.budget.budget_total,
      "ANCHOR RESERVED: "+mission.budget.anchor_reserved,
      "REMAINING: "+mission.budget.remaining,
      "TARGET PER ITEM: "+mission.budget.target_per_item,
      "COUNTRY PRODUCT TRUTH REQUIRED: "+mission.requires_country_product_truth,
      "EXACT FIT CLAIM: "+mission.exact_fit_claim,
      "PRODUCTS SELECTED: 0"
    ].join("\n");
    mirrorOutput.textContent=[
      "MODE: A5_SAFE_MIRROR_SIMULATION",
      "CONSENT VALID: "+consentCheck.valid,
      "CONSENT ISSUES: "+(consentCheck.issues.join(", ")||"none"),
      "RETENTION: "+consent.retention,
      "FOCUS ANCHOR: "+(decision.focus.anchor||"UNAVAILABLE"),
      "FRAME PLAN: "+(decision.focus.frames||[]).join(" → "),
      "TRANSITION: "+(decision.focus.transition||"none"),
      "PRODUCT TRUTH ISSUES: "+(decision.truth.issues||[]).join(", "),
      "SAFE PREVIEW PLAN: "+safePreview,
      "FALLBACK: "+decision.fallback,
      "BODY SCORING: false",
      "ATTRACTIVENESS SCORING: false",
      "SENSITIVE ATTRIBUTE INFERENCE: false",
      "EXACT FIT CLAIM: false",
      "PHOTO REQUESTED: false",
      "AI PROVIDER CALLED: false"
    ].join("\n");
  }

  function simulateCreativeLearning(){
    const host=$("#creative-tournament");
    const output=$("#creative-result");
    const status=$("#creative-result-status");
    const hooks=Math.max(1,Math.min(20,Math.round(decisionNumber("creative-hooks"))||10));
    const concepts=Math.max(1,Math.min(10,Math.round(decisionNumber("creative-concepts"))||5));
    const scripts=Math.max(1,Math.min(6,Math.round(decisionNumber("creative-scripts"))||3));
    const threshold=Math.max(0,Math.min(100,decisionNumber("creative-threshold")));
    const gates={
      truth:Boolean($("#creative-truth-live")?.checked),
      reference:Boolean($("#creative-reference-locked")?.checked),
      proof:Boolean($("#creative-proof-ready")?.checked)
    };
    const passed=gates.truth&&gates.reference&&gates.proof;
    const stages=[
      {name:"Hook Tournament",count:hooks,rule:"Distinct empty idea slots"},
      {name:"Concept Tournament",count:concepts,rule:"Storyboard-ready slots"},
      {name:"Script Tournament",count:scripts,rule:"Short-form draft slots"},
      {name:"Red Team",count:1,rule:"Claims and missing-proof review"},
      {name:"Visual QA",count:scripts,rule:"Fidelity threshold "+threshold},
      {name:"Owner Gate",count:1,rule:"DRAFT_REVIEW only"}
    ];
    host.innerHTML=stages.map(stage=>
      '<article class="creative-stage"><small>'+esc(String(stage.count))+' EMPTY SLOT'+(stage.count===1?"":"S")+'</small><strong>'+esc(stage.name)+'</strong><span>'+esc(stage.rule)+'</span></article>'
    ).join("");
    status.textContent=(passed?"PLAN_READY_FOR_OWNER_REVIEW":"BLOCKED / EVIDENCE_REQUIRED")+" · GENERATION_OFF";
    output.textContent=[
      "MODE: A6_CREATIVE_STRUCTURE_SIMULATION",
      "CATEGORY: "+truthValue("creative-category"),
      "CHANNEL: "+truthValue("creative-channel"),
      "TEST MODE: "+truthValue("creative-test-mode"),
      "PRODUCT TRUTH LIVE: "+gates.truth,
      "EXACT REFERENCES LOCKED: "+gates.reference,
      "PROOF BOUNDARY REVIEWED: "+gates.proof,
      "TOURNAMENT MAY PROCEED TO PRIVATE DRAFT: "+passed,
      "CONTENT GENERATED: 0",
      "VIDEO GENERATED: 0",
      "PROVIDER CALLS: 0",
      "SPEND AUTHORIZED: false",
      "PUBLISHING AUTHORIZED: false",
      "OWNER GATE: DRAFT_REVIEW"
    ].join("\n");
  }

  function alphaEvidenceText(id){
    return String($("#"+id)?.textContent||"").trim();
  }

  function alphaIntegrationStages(){
    const a1Status=alphaEvidenceText("truth-result-status"),a1=alphaEvidenceText("truth-result");
    const a2Status=alphaEvidenceText("decision-result-status"),a2=alphaEvidenceText("decision-result");
    const a3=alphaEvidenceText("memory-context-result");
    const a4Status=alphaEvidenceText("flow-result-status"),a4=alphaEvidenceText("flow-result");
    const a5Status=alphaEvidenceText("personal-result-status"),a5=alphaEvidenceText("mirror-result");
    const a6Status=alphaEvidenceText("creative-result-status"),a6=alphaEvidenceText("creative-result");
    return [
      {
        id:"A1",name:"Product Truth",
        pass:a1Status.includes("LIVE_VERIFIED")&&a1Status.includes("EVIDENCE PASSED")&&a1.includes("EXECUTION_ALLOWED: false")&&a1.includes("SUPPLIER_CALLED: false"),
        evidence:a1Status||"NOT_EVALUATED",
        blocker:"Run A1 with fresh Product Truth evidence until LIVE_VERIFIED / EVIDENCE PASSED."
      },
      {
        id:"A2",name:"Decision Brain + Taste DNA",
        pass:a2Status.startsWith("ELIGIBLE")&&a2.includes("SENSITIVE TRAITS USED: false")&&a2.includes("BODY TRAITS USED: false")&&a2.includes("STOREFRONT_CHANGED: false"),
        evidence:a2Status||"NOT_EVALUATED",
        blocker:"Run A2 with a live-verified eligible candidate and preserve the sensitive/body-trait guards."
      },
      {
        id:"A3",name:"Memory & Actions",
        pass:Boolean(Memory?.decisionContext)&&state.simulatedMemoryEvents.length>0&&a3.includes("REAL PROFILE WRITTEN: false")&&a3.includes("HUNT HISTORY CHANGED: false")&&a3.includes("EXECUTION_ALLOWED: false"),
        evidence:(state.simulatedMemoryEvents.length+" isolated event(s) · ")+(a3.split("\n")[0]||"NOT_EVALUATED"),
        blocker:"Add at least one isolated A3 event and confirm no real profile/history writes."
      },
      {
        id:"A4",name:"Dynamic Flow & Worlds",
        pass:a4Status.startsWith("COMPOSED")&&a4.includes("PRODUCTS INVENTED: 0")&&a4.includes("VERIFIED PRODUCT REQUIRED PER SLOT: true")&&a4.includes("STOREFRONT_CHANGED: false")&&a4.includes("FEATURE_FLAG_CHANGED: false"),
        evidence:a4Status||"NOT_COMPOSED",
        blocker:"Compose A4 and preserve empty verified-product slots with storefront/feature flags unchanged."
      },
      {
        id:"A5",name:"Stylist & Safe Mirror",
        pass:a5Status.startsWith("SAFE_PREVIEW_PLAN_READY")&&a5.includes("BODY SCORING: false")&&a5.includes("ATTRACTIVENESS SCORING: false")&&a5.includes("SENSITIVE ATTRIBUTE INFERENCE: false")&&a5.includes("AI PROVIDER CALLED: false"),
        evidence:a5Status||"NOT_EVALUATED",
        blocker:"Complete A5 consent + exact-product truth/image checks until SAFE_PREVIEW_PLAN_READY."
      },
      {
        id:"A6",name:"Creative Learning",
        pass:a6Status.startsWith("PLAN_READY_FOR_OWNER_REVIEW")&&a6.includes("CONTENT GENERATED: 0")&&a6.includes("VIDEO GENERATED: 0")&&a6.includes("PROVIDER CALLS: 0")&&a6.includes("SPEND AUTHORIZED: false")&&a6.includes("PUBLISHING AUTHORIZED: false")&&a6.includes("OWNER GATE: DRAFT_REVIEW"),
        evidence:a6Status||"NOT_PLANNED",
        blocker:"Complete Product Truth + locked references + proof boundary in A6; keep generation/publishing/spend off."
      }
    ];
  }

  function runAlphaIntegrationQA(){
    const stages=alphaIntegrationStages();
    const passed=stages.filter(x=>x.pass);
    const blocked=stages.filter(x=>!x.pass);
    const ready=blocked.length===0;
    const host=$("#alpha-integration-stage-grid"),summary=$("#alpha-integration-summary"),status=$("#alpha-integration-status"),report=$("#alpha-integration-report");
    if(host)host.innerHTML=stages.map(stage=>
      '<article class="integration-stage" data-state="'+(stage.pass?"pass":"blocked")+'"><small>'+esc(stage.id)+'</small><strong>'+esc(stage.name)+'</strong><span>'+(stage.pass?"PASS":"BLOCKED")+'</span><p>'+esc(stage.evidence)+'</p></article>'
    ).join("");
    if(summary)summary.innerHTML=
      '<article><b>'+passed.length+'/6</b><span>STAGES PASSED</span></article>'+
      '<article><b>'+(ready?"REVIEW":"LOCKED")+'</b><span>OWNER GATE</span></article>'+
      '<article><b>OFF</b><span>PRODUCTION</span></article>';
    if(status)status.textContent=ready
      ?"READY_FOR_OWNER_ALPHA_REVIEW · OWNER_GATE_LOCKED · PRODUCTION_OFF"
      :"BLOCKED · "+blocked.length+" STAGE(S) REQUIRE EVIDENCE · PRODUCTION_OFF";
    if(report)report.textContent=[
      "MODE: A7_INTEGRATION_QA",
      "STAGES PASSED: "+passed.length+"/6",
      "READY FOR OWNER ALPHA REVIEW: "+ready,
      "PRODUCTION READY: false",
      "PRODUCTION_CHANGED: false",
      "EXECUTION_ALLOWED: false",
      "SUPPLIER_CALLS: 0",
      "AI_PROVIDER_CALLS: 0",
      "SPEND_AUTHORIZED: false",
      "PUBLISHING_AUTHORIZED: false",
      "OWNER_GATE: OWNER_REVIEW_REQUIRED",
      "",
      ...stages.map(stage=>stage.id+" "+(stage.pass?"PASS":"BLOCKED")+" · "+stage.name+" · "+stage.evidence),
      "",
      "BLOCKERS: "+(blocked.length?blocked.map(stage=>stage.id+": "+stage.blocker).join(" | "):"none inside A1–A6 simulation evidence"),
      "NEXT SAFE ACTION: "+(ready
        ?"Owner reviews the A7 evidence pack. Any implementation remains a separate explicit approval; Production stays OFF."
        :"Resolve only the listed simulation/evidence blockers, then rerun A7. Do not activate providers, spend, publishing or Production.")
    ].join("\n");
    return {ready,passed:passed.length,blocked:blocked.map(x=>x.id),stages};
  }

  function runAlphaHarnessUI(){
    const status=$("#alpha-harness-status"),summary=$("#alpha-harness-summary"),host=$("#alpha-harness-scenarios"),report=$("#alpha-harness-report");
    if(!AlphaHarness?.runAll){
      if(status)status.textContent="HARNESS_UNAVAILABLE · PRODUCTION_OFF";
      if(report)report.textContent="A8 core is unavailable. Nothing was executed.";
      return null;
    }
    const result=AlphaHarness.runAll();
    if(host)host.innerHTML=result.scenarios.map(row=>
      '<article class="harness-scenario" data-state="'+(row.harness_pass?"pass":"blocked")+'">'+
      '<small>'+esc(row.id.replaceAll("_"," ").toUpperCase())+'</small>'+
      '<strong>'+esc(row.label)+'</strong>'+
      '<span>'+esc(row.harness_pass?"PASS":"FAIL")+'</span>'+
      '<p>Expected ready: '+esc(String(row.expected_ready))+' · Actual ready: '+esc(String(row.actual_ready))+
      ' · Blocked: '+esc(row.blocked.join(", ")||"none")+'</p></article>'
    ).join("");
    if(summary)summary.innerHTML=
      '<article><b>'+result.passed+'/'+result.total+'</b><span>SCENARIOS PASSED</span></article>'+
      '<article><b>'+(result.harness_pass?"REVIEW":"LOCKED")+'</b><span>OWNER GATE</span></article>'+
      '<article><b>OFF</b><span>PRODUCTION</span></article>';
    if(status)status.textContent=(result.harness_pass?"A8_PASS":"A8_FAIL")+" · "+result.passed+"/"+result.total+" · PRODUCTION_OFF";
    if(report)report.textContent=[
      "MODE: "+result.mode,
      "HARNESS PASS: "+result.harness_pass,
      "SCENARIOS PASSED: "+result.passed+"/"+result.total,
      "PRODUCTION READY: false",
      "PRODUCTION_CHANGED: false",
      "EXECUTION_ALLOWED: false",
      "SUPPLIER_CALLS: 0",
      "AI_PROVIDER_CALLS: 0",
      "SPEND_AUTHORIZED: false",
      "PUBLISHING_AUTHORIZED: false",
      "OWNER_GATE: "+result.owner_gate,
      "",
      ...result.scenarios.map(row=>
        row.id+" · "+(row.harness_pass?"PASS":"FAIL")+" · expected_ready="+row.expected_ready+
        " · actual_ready="+row.actual_ready+" · blocked="+(row.blocked.join(",")||"none")
      ),
      "",
      "NEXT SAFE ACTION: "+(result.harness_pass
        ?"Owner may review the Alpha evidence pack. Merge/activation/Production remain separate explicit decisions."
        :"Fix only the failed harness scenario or engine regression, then rerun A8. Do not activate Production.")
    ].join("\n");
    return result;
  }

  function buildOwnerAlphaEvidencePack(){
    const status=$("#alpha-evidence-status"),summary=$("#alpha-evidence-summary"),host=$("#alpha-evidence-stages"),report=$("#alpha-evidence-report"),fingerprint=$("#alpha-evidence-fingerprint");
    if(!EvidencePack?.build||!EvidencePack?.verifyBoundaries||!AlphaHarness?.runAll){
      if(status)status.textContent="EVIDENCE_PACK_UNAVAILABLE · PRODUCTION_OFF";
      if(report)report.textContent="A9 core or A8 harness is unavailable. Nothing was activated.";
      return null;
    }
    const integrationStages=alphaIntegrationStages();
    const harness=AlphaHarness.runAll();
    const pack=EvidencePack.build({integrationStages,harness});
    const boundaryCheck=EvidencePack.verifyBoundaries(pack);
    const valid=boundaryCheck.valid===true;
    state.alphaEvidencePack=valid?pack:null;

    if(host)host.innerHTML=pack.stages.map(stage=>
      '<article class="evidence-stage" data-state="'+(stage.pass?"pass":"blocked")+'">'+
      '<small>'+esc(stage.id)+'</small><strong>'+esc(stage.name)+'</strong>'+
      '<span>'+esc(stage.pass?"PASS":"BLOCKED")+'</span><p>'+esc(stage.evidence||"No evidence")+'</p></article>'
    ).join("");
    const passed=pack.stages.filter(x=>x.pass).length;
    if(summary)summary.innerHTML=
      '<article><b>'+passed+'/'+pack.stage_count+'</b><span>STAGES PASSED</span></article>'+
      '<article><b>'+(valid&&pack.owner_review_ready?"REVIEW":"LOCKED")+'</b><span>RELEASE GATE</span></article>'+
      '<article><b>OFF</b><span>ALPHA / PRODUCTION</span></article>';
    if(fingerprint)fingerprint.textContent="FINGERPRINT: "+pack.evidence_fingerprint+" · snapshot only";
    if(status)status.textContent=!valid
      ?"BLOCKED_BOUNDARY_VIOLATION · PRODUCTION_OFF"
      :(pack.owner_review_ready
        ?"ALPHA_OWNER_REVIEW_READY · OWNER_GATE_LOCKED · PRODUCTION_OFF"
        :"BLOCKED_EVIDENCE_REQUIRED · "+pack.blockers.length+" BLOCKER(S) · PRODUCTION_OFF");
    if(report)report.textContent=[
      "MODE: "+pack.mode,
      "EVIDENCE FINGERPRINT: "+pack.evidence_fingerprint,
      "GENERATED AT: "+pack.generated_at,
      "STAGES PASSED: "+passed+"/"+pack.stage_count,
      "OWNER REVIEW READY: "+pack.owner_review_ready,
      "RELEASE GATE: "+pack.release_gate,
      "BOUNDARY CHECK: "+(valid?"PASS":"FAIL"),
      "BOUNDARY ISSUES: "+(boundaryCheck.issues.join(", ")||"none"),
      "ALPHA ACTIVATION AUTHORIZED: false",
      "PRODUCTION READY: false",
      "PRODUCTION_CHANGED: false",
      "EXECUTION_ALLOWED: false",
      "PAYMENTS_ACTIVATED: false",
      "ORDER_ROUTING_ACTIVATED: false",
      "SUPPLIER_CALLS: 0",
      "AI_PROVIDER_CALLS: 0",
      "SPEND_AUTHORIZED: false",
      "PUBLISHING_AUTHORIZED: false",
      "OWNER_GATE: "+pack.owner_gate,
      "",
      ...pack.stages.map(stage=>stage.id+" "+(stage.pass?"PASS":"BLOCKED")+" · "+stage.name+" · "+stage.evidence),
      "",
      "BLOCKERS: "+(pack.blockers.length?pack.blockers.map(x=>x.id+": "+x.evidence).join(" | "):"none"),
      "NEXT SAFE ACTION: "+pack.next_safe_action
    ].join("\n");
    return {pack,boundaryCheck};
  }

  function buildAlphaRCPreview(){
    const status=$("#alpha-rc-preview-status"),summary=$("#alpha-rc-preview-summary"),devices=$("#alpha-rc-devices"),journey=$("#alpha-rc-journey"),report=$("#alpha-rc-preview-report");
    if(!RCPreview?.build||!RCPreview?.verify||!AlphaHarness?.runAll){
      if(status)status.textContent="RC_PREVIEW_UNAVAILABLE · PRODUCTION_OFF";
      if(report)report.textContent="A10 core is unavailable. No preview or live action was created.";
      return null;
    }

    if(!state.alphaEvidencePack){
      buildOwnerAlphaEvidencePack();
    }
    const evidencePack=state.alphaEvidencePack;
    const harness=AlphaHarness.runAll();
    const preview=RCPreview.build({evidencePack,harness});
    const verification=RCPreview.verify(preview);
    const valid=verification.valid===true;
    state.alphaRCPreview=valid?preview:null;

    if(devices)devices.innerHTML=preview.devices.map(device=>
      '<article class="rc-device" data-state="'+(preview.preview_ready?"pass":"blocked")+'">'+
      '<small>'+esc(device.id.toUpperCase())+'</small>'+
      '<strong>'+esc(device.label)+'</strong>'+
      '<span>'+esc(String(device.width))+'×'+esc(String(device.height))+'</span></article>'
    ).join("");

    if(journey)journey.innerHTML=preview.journey.map(step=>
      '<article class="rc-journey-step" data-state="'+(step.ready?"pass":"blocked")+'">'+
      '<small>'+esc(step.id.toUpperCase())+'</small>'+
      '<strong>'+esc(step.label)+'</strong>'+
      '<span>'+esc(step.ready?"READY":"BLOCKED")+'</span>'+
      '<p>'+esc(step.contract)+'</p>'+
      '<footer>'+esc(step.missing.length?"Missing: "+step.missing.join(", "):"Snapshot-only · no live mutation")+'</footer></article>'
    ).join("");

    const readySteps=preview.journey.filter(x=>x.ready).length;
    if(summary)summary.innerHTML=
      '<article><b>'+readySteps+'/'+preview.journey.length+'</b><span>JOURNEY STEPS READY</span></article>'+
      '<article><b>'+(preview.preview_ready?preview.devices.length:0)+'/'+preview.devices.length+'</b><span>VIEWPORT CONTRACTS</span></article>'+
      '<article><b>OFF</b><span>CHECKOUT / PRODUCTION</span></article>';

    if(status)status.textContent=!valid
      ?"BLOCKED_PREVIEW_BOUNDARY_VIOLATION · PRODUCTION_OFF"
      :(preview.preview_ready
        ?"A10_PRIVATE_RC_READY · OWNER_ONLY · PRODUCTION_OFF"
        :"BLOCKED_EVIDENCE_REQUIRED · "+preview.blockers.length+" BLOCKER(S) · PRODUCTION_OFF");

    if(report)report.textContent=[
      "MODE: "+preview.mode,
      "PRIVATE PREVIEW READY: "+preview.preview_ready,
      "VISIBILITY: "+preview.visibility,
      "EVIDENCE FINGERPRINT: "+(preview.evidence_fingerprint||"none"),
      "RC BOUNDARY CHECK: "+(valid?"PASS":"FAIL"),
      "RC BOUNDARY ISSUES: "+(verification.issues.join(", ")||"none"),
      "CURRENT STOREFRONT FALLBACK: "+preview.current_storefront_fallback,
      "CHECKOUT MODE: "+preview.checkout_mode,
      "PAYMENTS_ACTIVATED: false",
      "ORDER_ROUTING_ACTIVATED: false",
      "PROVIDER_CALLS: 0",
      "SUPPLIER_CALLS: 0",
      "SPEND_AUTHORIZED: false",
      "PUBLISHING_AUTHORIZED: false",
      "ALPHA_ACTIVATION_AUTHORIZED: false",
      "PRODUCTION READY: false",
      "PRODUCTION_CHANGED: false",
      "OWNER_GATE: "+preview.owner_gate,
      "",
      ...preview.devices.map(device=>"VIEWPORT "+device.id+" · "+device.width+"x"+device.height+" · CONTRACT_ONLY"),
      "",
      ...preview.journey.map(step=>step.id+" · "+(step.ready?"READY":"BLOCKED")+" · "+step.contract+" · missing="+(step.missing.join(",")||"none")),
      "",
      "BLOCKERS: "+(preview.blockers.join(" | ")||"none"),
      "NEXT SAFE ACTION: "+preview.next_safe_action
    ].join("\n");
    return {preview,verification};
  }

  function alphaRCDomAudit(){
    const ids=[...document.querySelectorAll("[id]")].map(node=>node.id).filter(Boolean);
    const seen=new Set(),duplicates=new Set();
    for(const id of ids){if(seen.has(id))duplicates.add(id);else seen.add(id)}
    const alphaButtons=[...document.querySelectorAll(
      "#truth-simulate,#decision-simulate,#memory-add-event,#memory-reset-simulation,#flow-simulate,#personal-simulate,#creative-simulate,#alpha-integration-qa,#alpha-harness-run,#alpha-evidence-build,#alpha-rc-preview-build,#alpha-rc-qa-run"
    )];
    return {
      lang:String(document.documentElement.lang||"").toLowerCase(),
      dir:String(document.documentElement.dir||"").toLowerCase(),
      viewport:Boolean(document.querySelector('meta[name="viewport"]')),
      duplicate_ids:duplicates.size,
      duplicate_id_values:[...duplicates],
      alpha_buttons_without_type:alphaButtons.filter(button=>String(button.getAttribute("type")||"").toLowerCase()!=="button").length
    };
  }

  function runAlphaRCQA(){
    const status=$("#alpha-rc-qa-status"),summary=$("#alpha-rc-qa-summary"),groups=$("#alpha-rc-qa-groups"),checks=$("#alpha-rc-qa-checks"),report=$("#alpha-rc-qa-report");
    if(!RCQA?.run||!AlphaHarness?.runAll||!EvidencePack?.build||!RCPreview?.build){
      if(status)status.textContent="RC_QA_UNAVAILABLE · A12_BLOCKED";
      if(report)report.textContent="A11 core or prerequisite core is unavailable. A12 remains blocked.";
      return null;
    }

    if(!state.alphaEvidencePack)buildOwnerAlphaEvidencePack();
    if(!state.alphaRCPreview)buildAlphaRCPreview();

    const evidencePack=state.alphaEvidencePack;
    const preview=state.alphaRCPreview;
    const harness=AlphaHarness.runAll();
    const domAudit=alphaRCDomAudit();
    const result=RCQA.run({preview,evidencePack,harness,domAudit});
    state.alphaRCQA=result;

    if(groups)groups.innerHTML=result.groups.map(group=>
      '<article class="rc-qa-group" data-state="'+(group.pass?"pass":"blocked")+'">'+
      '<small>'+esc(group.category.toUpperCase())+'</small>'+
      '<strong>'+esc(group.passed+"/"+group.total)+'</strong>'+
      '<span>'+esc(group.pass?"PASS":"BLOCKED")+'</span></article>'
    ).join("");

    if(checks)checks.innerHTML=result.checks.map(row=>
      '<article class="rc-qa-check" data-state="'+(row.pass?"pass":"blocked")+'">'+
      '<small>'+esc(row.id+" · "+row.category.toUpperCase())+'</small>'+
      '<strong>'+esc(row.label)+'</strong>'+
      '<span>'+esc(row.pass?"PASS":"FAIL")+'</span>'+
      '<p>'+esc(row.evidence)+'</p></article>'
    ).join("");

    const groupPass=result.groups.filter(x=>x.pass).length;
    if(summary)summary.innerHTML=
      '<article><b>'+result.passed+'/'+result.total+'</b><span>CHECKS PASSED</span></article>'+
      '<article><b>'+groupPass+'/'+result.groups.length+'</b><span>QA GROUPS PASSED</span></article>'+
      '<article><b>'+(result.a12_eligible?"ELIGIBLE":"LOCKED")+'</b><span>A12 ELIGIBILITY</span></article>';

    if(status)status.textContent=result.rc_qa_pass
      ?"A11_PASS · A12_ELIGIBLE · PRODUCTION_OFF"
      :"A11_BLOCKED · "+result.blockers.length+" CHECK(S) FAILED · A12_BLOCKED";

    if(report)report.textContent=[
      "MODE: "+result.mode,
      "RC QA PASS: "+result.rc_qa_pass,
      "CHECKS PASSED: "+result.passed+"/"+result.total,
      "QA GROUPS PASSED: "+groupPass+"/"+result.groups.length,
      "A12 ELIGIBLE: "+result.a12_eligible,
      "DOM LANG: "+domAudit.lang,
      "DOM DIR: "+domAudit.dir,
      "VIEWPORT META: "+domAudit.viewport,
      "DUPLICATE IDS: "+domAudit.duplicate_ids+(domAudit.duplicate_id_values.length?" · "+domAudit.duplicate_id_values.join(", "):""),
      "ALPHA BUTTONS WITHOUT TYPE: "+domAudit.alpha_buttons_without_type,
      "ALPHA ACTIVATION AUTHORIZED: false",
      "PRODUCTION READY: false",
      "PRODUCTION_CHANGED: false",
      "PAYMENTS_ACTIVATED: false",
      "ORDER_ROUTING_ACTIVATED: false",
      "SPEND_AUTHORIZED: false",
      "PUBLISHING_AUTHORIZED: false",
      "OWNER_GATE: "+result.owner_gate,
      "",
      ...result.groups.map(group=>group.category+" · "+(group.pass?"PASS":"BLOCKED")+" · "+group.passed+"/"+group.total),
      "",
      "BLOCKERS: "+(result.blockers.join(", ")||"none"),
      "NEXT SAFE ACTION: "+result.next_safe_action
    ].join("\n");
    return {result,domAudit};
  }

  function renderAlphaFinalGate(gate,verification){
    const status=$("#alpha-final-gate-status"),summary=$("#alpha-final-gate-summary"),evidence=$("#alpha-final-gate-evidence"),report=$("#alpha-final-gate-report");
    const go=$("#alpha-final-go"),noGo=$("#alpha-final-no-go");
    const valid=verification?.valid===true;
    const decision=gate?.decision_status||"PENDING_OWNER";
    if(evidence)evidence.innerHTML=[
      ["A9",gate?.evidence?.a9_fingerprint||"missing"],
      ["A10",String(gate?.evidence?.a10_journey_ready||0)+"/"+String(gate?.evidence?.a10_journey_total||0)+" journey · "+String(gate?.evidence?.a10_viewports||0)+" viewports"],
      ["A11",String(gate?.evidence?.a11_checks_passed||0)+"/"+String(gate?.evidence?.a11_checks_total||0)+" checks · "+String(gate?.evidence?.a11_groups_passed||0)+"/"+String(gate?.evidence?.a11_groups_total||0)+" groups"]
    ].map(row=>'<article><small>'+esc(row[0])+'</small><strong>'+esc(row[1])+'</strong></article>').join("");
    if(summary)summary.innerHTML=
      '<article><b>'+(gate?.final_gate_ready?"READY":"LOCKED")+'</b><span>FINAL GATE</span></article>'+
      '<article><b>'+esc(decision==="PENDING_OWNER"?"PENDING":decision.startsWith("GO_")?"GO":"NO-GO")+'</b><span>OWNER DECISION</span></article>'+
      '<article><b>OFF</b><span>MERGE / PRODUCTION</span></article>';
    if(status)status.textContent=!valid
      ?"BLOCKED_FINAL_BOUNDARY_VIOLATION · OWNER_DECISION_PENDING"
      :(gate?.decision_recorded
        ?"OWNER_DECISION_RECORDED · "+decision+" · PRODUCTION_OFF"
        :(gate?.final_gate_ready
          ?"A12_READY · OWNER_DECISION_PENDING · PRODUCTION_OFF"
          :"A12_BLOCKED · "+String(gate?.blockers?.length||0)+" BLOCKER(S) · PRODUCTION_OFF"));
    if(go)go.disabled=!(valid&&gate?.final_gate_ready===true&&decision==="PENDING_OWNER");
    if(noGo)noGo.disabled=!(valid&&decision==="PENDING_OWNER");
    if(report)report.textContent=[
      "MODE: "+String(gate?.mode||"A12_FINAL_OWNER_GO_NO_GO_GATE"),
      "FINAL GATE READY: "+String(gate?.final_gate_ready===true),
      "OWNER DECISION REQUIRED: "+String(gate?.owner_decision_required===true),
      "DECISION STATUS: "+decision,
      "BOUNDARY CHECK: "+(valid?"PASS":"FAIL"),
      "BOUNDARY ISSUES: "+((verification?.issues||[]).join(", ")||"none"),
      "A9 FINGERPRINT: "+String(gate?.evidence?.a9_fingerprint||"missing"),
      "A10 JOURNEY: "+String(gate?.evidence?.a10_journey_ready||0)+"/"+String(gate?.evidence?.a10_journey_total||0),
      "A10 VIEWPORTS: "+String(gate?.evidence?.a10_viewports||0),
      "A11 CHECKS: "+String(gate?.evidence?.a11_checks_passed||0)+"/"+String(gate?.evidence?.a11_checks_total||0),
      "A11 GROUPS: "+String(gate?.evidence?.a11_groups_passed||0)+"/"+String(gate?.evidence?.a11_groups_total||0),
      "MERGE AUTHORIZED: false",
      "PRIVATE ALPHA ACTIVATION AUTHORIZED: false",
      "PRODUCTION ACTIVATION AUTHORIZED: false",
      "PAYMENTS_ACTIVATED: false",
      "ORDER_ROUTING_ACTIVATED: false",
      "SPEND_AUTHORIZED: false",
      "PUBLISHING_AUTHORIZED: false",
      "PROVIDER_EXECUTION_AUTHORIZED: false",
      "SUPPLIER_EXECUTION_AUTHORIZED: false",
      "",
      "BLOCKERS: "+((gate?.blockers||[]).join(", ")||"none"),
      "NEXT SAFE ACTION: "+String(gate?.next_safe_action||"Owner review required.")
    ].join("\n");
  }

  function buildAlphaFinalGate(){
    if(!FinalGate?.build||!FinalGate?.verifyBoundaries){
      const status=$("#alpha-final-gate-status"),report=$("#alpha-final-gate-report");
      if(status)status.textContent="FINAL_GATE_UNAVAILABLE · OWNER_DECISION_PENDING";
      if(report)report.textContent="A12 core is unavailable. No decision or activation was performed.";
      return null;
    }
    if(!state.alphaEvidencePack)buildOwnerAlphaEvidencePack();
    if(!state.alphaRCPreview)buildAlphaRCPreview();
    if(!state.alphaRCQA)runAlphaRCQA();
    const gate=FinalGate.build({
      qa:state.alphaRCQA,
      preview:state.alphaRCPreview,
      evidencePack:state.alphaEvidencePack
    });
    const verification=FinalGate.verifyBoundaries(gate);
    state.alphaFinalGate=verification.valid?gate:null;
    renderAlphaFinalGate(gate,verification);
    return {gate,verification};
  }

  function recordAlphaFinalDecision(decision){
    if(!FinalGate?.recordDecision||!FinalGate?.verifyBoundaries)return null;
    if(!state.alphaFinalGate){
      const built=buildAlphaFinalGate();
      if(!built?.gate||!built?.verification?.valid)return null;
    }
    const next=FinalGate.recordDecision(state.alphaFinalGate,decision);
    const verification=FinalGate.verifyBoundaries(next);
    if(verification.valid)state.alphaFinalGate=next;
    renderAlphaFinalGate(next,verification);
    return {gate:next,verification};
  }

  function productTraceStage(step,label,state,evidence){
    return {step,label,state,evidence:String(evidence||"")};
  }

  function renderProductTrace(stages,reportLines=[]){
    const host=$("#product-trace-timeline"),status=$("#product-trace-status"),report=$("#product-trace-report");
    if(host)host.innerHTML=stages.map(row=>
      '<article data-state="'+esc(row.state)+'"><small>'+esc(row.step)+'</small><strong>'+esc(row.label)+'</strong><span>'+esc(row.state.toUpperCase())+'</span><p>'+esc(row.evidence||"No evidence")+'</p></article>'
    ).join("");
    const verified=stages.filter(x=>["verified","present","linked"].includes(x.state)).length;
    const blocked=stages.filter(x=>x.state==="blocked").length;
    if(status)status.textContent=blocked
      ?"TRACE_BLOCKED · "+blocked+" BLOCKER(S)"
      :"TRACE_READ_ONLY · "+verified+"/"+stages.length+" LINK(S) EVIDENCED";
    if(report)report.textContent=reportLines.join("\n");
  }

  async function runProductTrace(){
    const provider=String($("#product-trace-provider")?.value||"").trim();
    const itemId=String($("#product-trace-item")?.value||"").trim();
    const orderRef=String($("#product-trace-order")?.value||"").trim();

    if(state.localPreview){
      const stages=[
        productTraceStage("1","SOURCE","present","Local Preview structure only · live catalog query disabled"),
        productTraceStage("2","SHELF / TRUTH","unknown","Enter authenticated Studio for live catalog evidence"),
        productTraceStage("3","CHECKOUT","unknown","Live order pipeline query disabled in Local Preview"),
        productTraceStage("4","ORDER","unknown","Live order query disabled in Local Preview"),
        productTraceStage("5","FINANCE / SALE","unknown","Live finance query disabled in Local Preview")
      ];
      renderProductTrace(stages,[
        "MODE: LOCAL_PREVIEW_PRODUCT_TRACE",
        "READ ONLY: true",
        "LIVE QUERY: false",
        "MUTATION: false",
        "NEXT SAFE ACTION: Sign in to Owner/Admin Studio to run live evidence trace."
      ]);
      return {stages,localPreview:true};
    }

    if(!provider||!itemId){
      renderProductTrace([
        productTraceStage("1","SOURCE","blocked","Provider and Item ID are required"),
        productTraceStage("2","SHELF / TRUTH","unknown","Waiting for product identity"),
        productTraceStage("3","CHECKOUT","unknown","Waiting for product identity"),
        productTraceStage("4","ORDER","unknown","Waiting for product identity"),
        productTraceStage("5","FINANCE / SALE","unknown","Waiting for product identity")
      ],["TRACE_BLOCKED: provider + item_id required"]);
      return null;
    }

    const catalogQuery=await client.from("hunt_catalog_products")
      .select("provider,item_id,category,title,availability_verified,source_fresh_at,updated_at,stock_quantity,authenticity_status,market_eligibility_status")
      .eq("provider",provider).eq("item_id",itemId).maybeSingle();
    if(catalogQuery.error)throw catalogQuery.error;
    const catalog=catalogQuery.data||null;

    let order=null,pipeline=[],finance=null;
    if(orderRef){
      let q=client.from("hunt_orders")
        .select("id,external_order_id,status,total_amount,currency,placed_at,updated_at,is_test,order_source,provider");
      const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderRef);
      q=uuid?q.eq("id",orderRef):q.eq("external_order_id",orderRef);
      const orderResult=await q.maybeSingle();
      if(orderResult.error)throw orderResult.error;
      order=orderResult.data||null;

      if(order?.id){
        const [pipelineResult,financeResult]=await Promise.all([
          client.from("hunt_order_pipeline_runs")
            .select("id,payment_session_id,order_id,run_mode,stage,status,provider,supplier_order_id,tracking_number,last_error,created_at,updated_at")
            .eq("order_id",order.id).order("updated_at",{ascending:false}).limit(8),
          client.from("hunt_order_finance_ledger")
            .select("payment_session_id,order_id,currency,customer_gross,contribution_locked,available_profit,settlement_status,supplier_payment_status,owner_payout_status,is_test,calculated_at,settled_at,updated_at")
            .eq("order_id",order.id).maybeSingle()
        ]);
        if(pipelineResult.error)throw pipelineResult.error;
        if(financeResult.error)throw financeResult.error;
        pipeline=pipelineResult.data||[];
        finance=financeResult.data||null;
      }
    }

    const checkoutLinked=Boolean(finance?.payment_session_id||pipeline.some(x=>x.payment_session_id));
    const sourceState=catalog?"verified":"unknown";
    const shelfState=catalog?.category?"present":"unknown";
    const checkoutState=checkoutLinked?"linked":(order?"unknown":"unknown");
    const orderState=order?"linked":"unknown";
    const financeState=finance
      ?(["settled"].includes(String(finance.settlement_status||"").toLowerCase())?"verified":"present")
      :"unknown";

    const stages=[
      productTraceStage("1","SOURCE",sourceState,catalog
        ? provider+" · "+itemId+" · fresh="+String(catalog.source_fresh_at||catalog.updated_at||"unknown")
        :"No matching catalog product"),
      productTraceStage("2","SHELF / TRUTH",shelfState,catalog
        ? "category="+String(catalog.category||"unknown")+" · availability_verified="+String(catalog.availability_verified===true)+" · market="+String(catalog.market_eligibility_status||"unknown")
        :"No catalog shelf evidence"),
      productTraceStage("3","CHECKOUT",checkoutState,checkoutLinked
        ? "payment_session_id linked through Admin-only order pipeline / finance evidence"
        :"No linked payment session evidence supplied"),
      productTraceStage("4","ORDER",orderState,order
        ? "order="+String(order.external_order_id||order.id)+" · status="+String(order.status||"unknown")+" · test="+String(order.is_test===true)
        :"No matching order reference supplied/found"),
      productTraceStage("5","FINANCE / SALE",financeState,finance
        ? "settlement="+String(finance.settlement_status||"unknown")+" · owner_payout="+String(finance.owner_payout_status||"unknown")+" · available_profit="+String(finance.available_profit??"unknown")+" "+String(finance.currency||"")
        :"No finance ledger row linked to this order")
    ];

    renderProductTrace(stages,[
      "MODE: LIVE_ADMIN_PRODUCT_TRACE",
      "READ ONLY: true",
      "MUTATION: false",
      "PROVIDER: "+provider,
      "ITEM ID: "+itemId,
      "CATALOG FOUND: "+String(Boolean(catalog)),
      "CATEGORY: "+String(catalog?.category||"unknown"),
      "AVAILABILITY VERIFIED: "+String(catalog?.availability_verified===true),
      "ORDER FOUND: "+String(Boolean(order)),
      "ORDER STATUS: "+String(order?.status||"unknown"),
      "PIPELINE RUNS: "+String(pipeline.length),
      "CHECKOUT LINKED: "+String(checkoutLinked),
      "FINANCE LEDGER FOUND: "+String(Boolean(finance)),
      "SETTLEMENT STATUS: "+String(finance?.settlement_status||"unknown"),
      "OWNER PAYOUT STATUS: "+String(finance?.owner_payout_status||"unknown"),
      "",
      "NOTE: Missing links remain UNVERIFIED; no table writes or runtime controls were changed."
    ]);
    return {catalog,order,pipeline,finance,stages};
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
    const group=studioNodeGroupById.get(id);
    const catalogNode=group?.nodes.find(node=>node[0]===id);
    const m=state.managerMap.get(id)||toolNodeFallbackManagers[id]||(catalogNode?{
      id,
      name:catalogNode[1],
      department:group.label,
      status:"offline"
    }:null);
    if(!m)return;
    state.selected=id;
    const r=state.reportMap.get(id)||toolNodeFallbackReports[id]||(catalogNode?{
      manager_id:id,
      status:"offline",
      issues:["No live manager report is loaded for this Studio node in the current runtime."],
      recommended_action:"Review the Studio contract and connect live runtime evidence before treating this node as active.",
      metrics:{studio_group:group.id,runtime:"OFFLINE_OR_UNVERIFIED"}
    }:null);
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
    if(type==="output"){
      $("#inspect-title").textContent="Decision / Owner Output";
      $("#inspect-status").innerHTML=pill("watch");
      $("#inspect-body").innerHTML='<section class="inspect-block"><h3>Decision contract</h3><p>BOOM may propose, block, repair or prepare an Owner-gated action. Publish, payment, Production, permissions and other material actions remain separate Owner decisions.</p></section><section class="inspect-block"><h3>Authority boundary</h3><pre>KNOWLEDGE != AUTHORITY\nAUTO-PUBLISH: false\nAUTO-PAYMENT: false\nAUTO-PRODUCTION: false</pre></section>';
      return;
    }
  }

  function renderAll(){
    renderStudio();
    renderExecutions();
    renderEvaluations();
    renderLearning();
    renderProfessionalWorkbench();
    renderConnect();
    renderPromptCoverageAudit();
    if(state.managerMap.has(state.selected)||toolNodeFallbackManagers[state.selected]||studioNodeGroupById.has(state.selected))inspectManager(state.selected);
    setLive("● LIVE · "+new Date().toLocaleTimeString("he-IL",{hour:"2-digit",minute:"2-digit",second:"2-digit"}));
  }

  async function query(table,columns="*",orderColumn=null,limit=300){
    let q=client.from(table).select(columns).limit(limit);
    if(orderColumn)q=q.order(orderColumn,{ascending:false});
    const {data,error}=await q;
    if(error)throw error;
    return data||[];
  }

  async function loadConnectorEvidence(){
    if(state.localPreview){
      state.connectorEvidence={apiLogs:[],sources:[],partners:[],controls:[]};
      return state.connectorEvidence;
    }
    const [apiLogs,sources,partners,controls]=await Promise.all([
      query("api_integration_log","source,attempted_at,result,http_status,items_returned,error_message","attempted_at",120),
      query("source_registry","source_name,category,provider,enabled,health_status,last_success,last_error,last_sync,updated_at","updated_at",120),
      query("hunt_partner_matrix","partner_name,partner_type,lane,integration_status,official_api_required,checkout_mode,terms_verified_at,media_rights_verified_at,order_api_verified_at,tracking_verified_at,notes,owner_approval_required,updated_at","updated_at",120),
      query("hunt_runtime_controls","key,enabled,owner_approved,note,updated_at","updated_at",120)
    ]);
    state.connectorEvidence={apiLogs,sources,partners,controls};
    return state.connectorEvidence;
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
    await loadConnectorEvidence();
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

  function applyLocalPreviewSafety(mode="local"){
    const label=mode==="draft"?"DRAFT":"LOCAL";
    document.body.dataset.previewMode=mode;
    const disabledSelectors=[
      "#refresh","#logout","#chat-send","#chat-mic","#voice-loop",
      "#brand-run","#brand-verify","#brand-video-plan","#brand-video-qa",
      "#vault-preview","#vault-visual-qa","#vault-qa-commit","#vault-owner-approve","#vault-owner-reject",
      "#deployment-readiness-refresh","#connect-refresh"
    ];
    for(const selector of disabledSelectors){
      const el=$(selector);
      if(!el)continue;
      el.disabled=true;
      el.title=label+" PREVIEW · external/live action disabled";
    }
    $("#logout").hidden=true;
    const input=$("#chat-input");
    if(input){
      input.disabled=true;
      input.placeholder=label+" PREVIEW · chat execution disabled";
    }
    setLive("● "+label+" PREVIEW · LIVE ACTIONS OFF","watch");
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

    const url=previewUrl;
    if(SAFE_PREVIEW_BOOT){
      state.localPreview=true;
      showApp();
      applyLocalPreviewSafety(previewNetlifyDraft?"draft":"local");
      renderAll();
      await renderHuntIntelligence();
      renderApprovalQueue();
      renderAlphaBlueprint();
      renderPromptCoverageAudit();
      inspectSpecial("output");
      return;
    }
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
  $("#alpha-load-plan")?.addEventListener("click",loadAlphaPlan);
  $("#truth-simulate")?.addEventListener("click",evaluateTruthWorkspace);
  $("#decision-simulate")?.addEventListener("click",evaluateDecisionWorkspace);
  $("#memory-add-event")?.addEventListener("click",addSimulatedMemoryEvent);
  $("#memory-reset-simulation")?.addEventListener("click",resetMemorySimulation);
  $("#flow-simulate")?.addEventListener("click",simulateDynamicFlow);
  $("#personal-simulate")?.addEventListener("click",simulatePersonalStudio);
  $("#creative-simulate")?.addEventListener("click",simulateCreativeLearning);
  $("#alpha-integration-qa")?.addEventListener("click",runAlphaIntegrationQA);
  $("#alpha-harness-run")?.addEventListener("click",runAlphaHarnessUI);
  $("#alpha-evidence-build")?.addEventListener("click",buildOwnerAlphaEvidencePack);
  $("#alpha-rc-preview-build")?.addEventListener("click",buildAlphaRCPreview);
  $("#alpha-rc-qa-run")?.addEventListener("click",runAlphaRCQA);
  $("#alpha-final-gate-build")?.addEventListener("click",buildAlphaFinalGate);
  $("#alpha-final-go")?.addEventListener("click",()=>recordAlphaFinalDecision(FinalGate?.DECISIONS?.GO));
  $("#alpha-final-no-go")?.addEventListener("click",()=>recordAlphaFinalDecision(FinalGate?.DECISIONS?.NO_GO));
  $("#product-trace-run")?.addEventListener("click",()=>runProductTrace());
  $("#professional-refresh")?.addEventListener("click",()=>renderProfessionalWorkbench());
  $("#connect-refresh")?.addEventListener("click",async()=>{
    const btn=$("#connect-refresh");
    if(btn){btn.disabled=true;btn.textContent="בודק…"}
    try{await loadAll();renderConnect()}catch(err){showError(err)}finally{if(btn){btn.disabled=false;btn.textContent="בדוק עכשיו"}}
  });
  function focusStudioGroup(id){
    const studio=$("#studio");
    const target=$(".studio-node-group").find(node=>node.dataset.groupId===id);
    if(!studio||!target)return;
    const top=studio.scrollTop+target.getBoundingClientRect().top-studio.getBoundingClientRect().top-58;
    studio.scrollTo({top:Math.max(0,top),behavior:"smooth"});
    $("#studio-department-nav [data-studio-group]").forEach(button=>button.classList.toggle("active",button.dataset.studioGroup===id));
  }

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
    const studioJump=ev.target.closest("[data-studio-group]");
    if(studioJump){focusStudioGroup(studioJump.dataset.studioGroup);return}
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
      if(tab.dataset.tab==="professional-workbench")renderProfessionalWorkbench();
      if(tab.dataset.tab==="hunt-intelligence")renderHuntIntelligence();
      if(tab.dataset.tab==="hunt-intelligence")renderApprovalQueue();
      if(tab.dataset.tab==="hunt-intelligence")renderAlphaBlueprint();
      if(tab.dataset.tab==="hunt-intelligence")renderPromptCoverageAudit();
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
