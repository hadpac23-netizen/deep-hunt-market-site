(() => {
  "use strict";
  const $=q=>document.querySelector(q);
  const runtime=window.BoomRuntime;
  const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  let data=null;
  let gapFilter="all";
  const traces=[];

  async function json(path){
    const res=await fetch(path,{cache:"no-store"});
    if(!res.ok)throw new Error(path+" unavailable");
    return res.json();
  }
  function metric(value,label){return `<article class="bs-metric"><strong>${esc(value)}</strong><span>${esc(label)}</span></article>`}
  function renderMetrics(){
    const phase1=data.surfaces.surfaces.filter(x=>x.enforce_phase_1).length;
    const active=data.brains.primary_brains.filter(x=>x.lifecycle==="ACTIVE").length;
    $("#bs-metrics").innerHTML=[
      metric(data.brains.primary_brains.length,"Primary brains"),
      metric(active,"Active brains"),
      metric(data.actions.actions.length,"Canonical actions"),
      metric(data.inventory.interactions.length,"Mapped controls"),
      metric(phase1,"Phase-1 surfaces"),
      metric(data.commerce.stages.length,"Commerce handoff stages"),
      metric(data.automation?.workflows?.length||0,"Automation workflows"),
      metric(data.automation?.mode||"UNKNOWN","Automation mode")
    ].join("");
  }
  function renderFlow(){
    const brains=[...data.brains.primary_brains].sort((a,b)=>a.order-b.order);
    $("#bs-flow").innerHTML=brains.map(b=>`<article class="bs-flow-step"><small>${esc(b.lifecycle)} · ${esc(b.order)}</small><strong>${esc(b.id)}</strong></article>`).join("");
  }
  function renderBrains(){
    $("#bs-brains").innerHTML=[...data.brains.primary_brains].sort((a,b)=>a.order-b.order).map(b=>`<article class="bs-brain">
      <div class="bs-brain-top"><h3>${esc(b.id)}</h3><span class="bs-lifecycle ${esc(b.lifecycle)}">${esc(b.lifecycle)}</span></div>
      <p>${esc(b.role)}</p>
      <div class="bs-tags">${(b.owns||[]).map(x=>`<span>${esc(x)}</span>`).join("")}</div>
      ${b.review_route?`<div class="bs-review-route">Review route → ${esc(b.review_route)}</div>`:""}
    </article>`).join("");
  }
  function renderKernels(){
    $("#bs-kernels").innerHTML=(data.brains.shared_control_planes||[]).map(k=>`<article class="bs-kernel"><strong>${esc(k.id)}</strong><span>${esc(k.purpose)}</span><span>Owner: ${esc(k.owner)}</span></article>`).join("");
  }
  function fillOwnerFilter(){
    const owners=[...new Set(data.actions.actions.map(x=>x.owner))].sort();
    $("#bs-action-owner").insertAdjacentHTML("beforeend",owners.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join(""));
  }
  function renderActions(){
    const q=String($("#bs-action-search")?.value||"").trim().toLowerCase();
    const owner=$("#bs-action-owner")?.value||"all";
    const rows=data.actions.actions.filter(a=>(owner==="all"||a.owner===owner)&&(!q||JSON.stringify(a).toLowerCase().includes(q)));
    $("#bs-action-count").textContent=`${rows.length} / ${data.actions.actions.length} visible`;
    $("#bs-actions").innerHTML=rows.length?rows.map(a=>`<article class="bs-action">
      <code>${esc(a.action_id)}</code><strong>${esc(a.owner)}</strong>
      <div class="bs-action-meta"><span>${esc(a.auth_policy)}</span><span>${esc(a.persistence)}</span><span>${a.optimistic?"optimistic":"confirmed"}</span><span>fail: ${esc(a.failure_policy)}</span></div>
    </article>`).join(""):'<div class="bs-empty">No actions match this filter.</div>';
  }
  function renderSurfaces(){
    $("#bs-surfaces").innerHTML=data.surfaces.surfaces.map(s=>`<article class="bs-surface"><div class="bs-surface-head"><strong>${esc(s.id)}</strong><span class="bs-status ${s.enforce_phase_1?"DONE":"NEXT"}">${s.enforce_phase_1?"ENFORCED":"MIGRATION"}</span></div><small>${esc(s.file)}</small><p>${(s.required||[]).map(esc).join(" · ")}</p></article>`).join("");
  }
  function renderGaps(){
    const rows=data.gaps.items.filter(x=>gapFilter==="all"||x.status===gapFilter);
    $("#bs-gaps").innerHTML=rows.length?rows.map(g=>`<article class="bs-gap"><div class="bs-gap-head"><strong>${esc(g.title)}</strong><span class="bs-status ${esc(g.status)}">${esc(g.status)}</span></div><small>${esc(g.source)} · ${esc(g.owner)}</small><p>${esc(g.next)}</p></article>`).join(""):'<div class="bs-empty">No gaps in this state.</div>';
  }





  async function renderConsolidationMap(){
    const summary=$("#bs-consolidation-summary"),host=$("#bs-consolidation-map"),agentsHost=$("#bs-agent-map"),schedulerHost=$("#bs-scheduler-map");
    if(!host)return;
    try{
      const [agents,skills,scheduler]=await Promise.all([
        json("boom-agent-registry.json"),json("boom-skill-registry.json"),json("boom-scheduler-contract.json")
      ]);
      const rewired=(agents.legacy_manager_map||[]).filter(x=>!["SUPERSEDED_BY_PRIMARY_BRAIN","SPLIT_BY_DECISION_DOMAIN"].includes(x.classification)).length;
      if(summary)summary.innerHTML=[
        metric(8,"Primary brains"),
        metric(agents.legacy_source?.manager_count||0,"Legacy managers mapped"),
        metric(rewired,"Agent/adapter rewires"),
        metric(skills.skills?.length||0,"Skills classified"),
        metric(scheduler.jobs?.length||0,"Scheduler jobs mapped")
      ].join("");
      const byOwner=new Map();
      for(const row of (agents.legacy_manager_map||[])){
        const owner=row.new_owner||"split / superseded";
        if(!byOwner.has(owner))byOwner.set(owner,[]);
        byOwner.get(owner).push(row);
      }
      host.innerHTML=[...byOwner.entries()].map(([owner,rows])=>`<article class="bs-domain-card">
        <small>${esc(owner)}</small><h3>${esc(rows.length)} legacy responsibilities</h3>
        <div class="bs-tags">${rows.slice(0,12).map(x=>`<span>${esc(x.new_role||x.legacy_id)}</span>`).join("")}</div>
        <p>${rows.length>12?esc((rows.length-12)+" more mapped in registry"):"One canonical owner per decision domain."}</p>
      </article>`).join("");
      if(agentsHost){
        agentsHost.innerHTML=(agents.legacy_manager_map||[]).map(row=>`<article class="bs-map-row">
          <code>${esc(row.legacy_id)}</code><span>→</span><strong>${esc(row.new_role||row.classification)}</strong><small>${esc(row.new_owner||row.classification)}</small>
        </article>`).join("");
      }
      if(schedulerHost){
        schedulerHost.innerHTML=(scheduler.jobs||[]).map(job=>`<article class="bs-map-row">
          <code>${esc(job.id)}</code><span>${esc(job.schedule||"—")}</span><strong>${esc(job.operation)}</strong><small>${esc(job.status)}</small>
        </article>`).join("");
      }
    }catch(error){
      host.innerHTML=`<div class="bs-empty bs-error">Consolidation registries unavailable: ${esc(error?.message||"unknown")}</div>`;
    }
  }

  async function renderDomainWiring(){
    const host=$("#bs-domain-wiring");
    if(!host)return;
    try{
      const [supplier,customer,learning]=await Promise.all([
        json("boom-supplier-product-intake-contract.json"),
        json("boom-customer-lifecycle-contract.json"),
        json("boom-learning-loop-contract.json")
      ]);
      const cards=[
        {
          kicker:"COMMERCE TRUTH",
          title:"Supplier → Shelf Candidate",
          brain:supplier.brain,
          agents:supplier.agents,
          gates:supplier.preconditions,
          stores:Object.entries(supplier.source_of_truth||{}).map(([k,v])=>k+": "+v.table),
          boundary:"supplier order OFF · activation OFF · invented truth forbidden"
        },
        {
          kicker:"OPERATIONS",
          title:"Customer Lifecycle",
          brain:customer.brain,
          agents:customer.agents,
          gates:customer.preconditions,
          stores:Object.entries(customer.source_of_truth||{}).map(([k,v])=>k+": "+v.table),
          boundary:"outreach/refund/order mutation OFF · PII forbidden in run ledger"
        },
        {
          kicker:"LEARNING GOVERNANCE",
          title:"Analytics → Learning",
          brain:learning.brain,
          agents:learning.agents,
          gates:["evidence_quality_pass","provenance_verified","baseline_available"],
          stores:Object.entries(learning.source_of_truth||{}).map(([k,v])=>k+": "+v.table),
          boundary:"no auto policy · no auto skill promotion · no auto price/publish/prod"
        }
      ];
      host.innerHTML=cards.map(card=>`<article class="bs-domain-card">
        <small>${esc(card.kicker)}</small>
        <h3>${esc(card.title)}</h3>
        <p><strong>${esc(card.brain)}</strong></p>
        <div class="bs-tags">${(card.agents||[]).map(x=>`<span>${esc(x)}</span>`).join("")}</div>
        <div class="bs-domain-block"><b>GATES</b>${(card.gates||[]).map(x=>`<code>${esc(typeof x==="string"?x:x.id||x)}</code>`).join("")}</div>
        <div class="bs-domain-block"><b>SOURCE OF TRUTH</b>${(card.stores||[]).map(x=>`<code>${esc(x)}</code>`).join("")}</div>
        <p class="bs-domain-boundary">${esc(card.boundary)}</p>
      </article>`).join("");
    }catch(error){
      host.innerHTML=`<div class="bs-empty bs-error">Domain wiring unavailable: ${esc(error?.message||"unknown")}</div>`;
    }
  }

  async function renderCreativeLearning(){
    const host=$("#bs-creative-learning");
    if(!host)return;
    try{
      const [a6,a7]=await Promise.all([
        json("boom-creative-learning-contract.json"),
        json("boom-a7-integration-contract.json")
      ]);
      const gates=(a6.preconditions||[]).map(g=>`<span>${esc(g.id)} · required</span>`).join("");
      const stages=(a6.stages||[]).map(stage=>`<span>${esc(stage.name)} · ${esc(stage.default_count)}</span>`).join("");
      const a7stages=(a7.stages||[]).map(stage=>`<span>${esc(stage.id)} ${esc(stage.name)}</span>`).join("");
      host.innerHTML=`
        <article class="bs-creative-card">
          <div class="bs-automation-head"><strong>A6 · Creative Learning Simulator</strong><span class="bs-status NEXT">${esc(a6.status)}</span></div>
          <p>Owner: ${esc(a6.brain)} / ${esc(a6.agent_id)}</p>
          <small>PRECONDITIONS</small><div class="bs-journey-steps">${gates}</div>
          <small>TOURNAMENT</small><div class="bs-journey-steps">${stages}</div>
          <p>QA: Product Fidelity 28% · Hook 22% · Clarity 18% · Conversion 20% · Claim Safety 12%</p>
          <code>content 0 · video 0 · provider calls 0 · spend false · publish false</code>
        </article>
        <article class="bs-creative-card">
          <div class="bs-automation-head"><strong>A7 · Integration QA</strong><span class="bs-status NEXT">OWNER REVIEW GATE</span></div>
          <p>Required: ${esc(a7.readiness.required_pass)} before ${esc(a7.readiness.pass_status)}</p>
          <small>EVIDENCE CHAIN</small><div class="bs-journey-steps">${a7stages}</div>
          <p>Production ready: false · Execution allowed: false · AI provider calls: 0 · Publishing: false</p>
          <code>${esc(a7.boundaries.owner_gate)}</code>
        </article>`;
    }catch(error){
      host.innerHTML=`<div class="bs-empty bs-error">Creative contracts unavailable: ${esc(error?.message||"unknown")}</div>`;
    }
  }

  async function renderDurableAutomation(){
    const runsHost=$("#bs-ledger-runs");
    const approvalsHost=$("#bs-approval-queue");
    const incidentsHost=$("#bs-incidents");
    const ledger=window.BoomAutomationLedger;
    if(!ledger){
      if(runsHost)runsHost.innerHTML='<div class="bs-empty">Ledger adapter unavailable.</div>';
      if(approvalsHost)approvalsHost.innerHTML='<div class="bs-empty">Approval adapter unavailable.</div>';
      if(incidentsHost)incidentsHost.innerHTML='<div class="bs-empty">Incident adapter unavailable.</div>';
      return;
    }
    try{
      const [runs,approvals,incidents]=await Promise.all([ledger.listRecent(20),ledger.listPendingApprovals(20),ledger.listIncidents?.(20)||Promise.resolve([])]);
      if(runsHost){
        runsHost.innerHTML=runs.length?runs.map(row=>{
          const lineage=Array.isArray(row.members)?row.members[0]||{}:{};
          const suppressed=Array.isArray(row.evidence)&&row.evidence.some(x=>x?.material_action_suppressed===true);
          return `<article class="bs-run">
            <div class="bs-run-head"><strong>${esc(row.task)}</strong><span class="bs-status ${String(row.status).toLowerCase()==="succeeded"?"DONE":"NEXT"}">${esc(row.status)}</span></div>
            <code>${esc(row.run_key)}</code>
            <small>mission: ${esc(lineage.mission_id||"—")} · correlation: ${esc(lineage.correlation_id||"—")}</small>
            <p>${row.owner_gate_required?"Owner Gate required":"No material Owner Gate"} · ${suppressed?"material action suppressed":"internal/read-only"}</p>
          </article>`;
        }).join(""):'<div class="bs-empty">No durable automation runs yet.</div>';
      }
      if(approvalsHost){
        approvalsHost.innerHTML=approvals.length?approvals.map(row=>`<article class="bs-run">
          <div class="bs-run-head"><strong>${esc(row.title)}</strong><span class="bs-status NEXT">${esc(row.status)}</span></div>
          <code>${esc(row.decision_key)}</code>
          <small>${esc(row.decision_type)} · priority ${esc(row.priority)}</small>
          <p>${esc(row.rationale||"Material workflow waiting for Owner Gate.")}</p>
        </article>`).join(""):'<div class="bs-empty">No pending automation approvals.</div>';
      }
      if(incidentsHost){
        incidentsHost.innerHTML=incidents.length?incidents.map(row=>{
          const lineage=Array.isArray(row.members)?row.members[0]||{}:{};
          const parent=lineage.parent_run_id||"—";
          const status=String(row.status||"ready");
          return `<article class="bs-run bs-incident">
            <div class="bs-run-head"><strong>Incident · ${esc(lineage.owner||"learning_governance_brain")}</strong><span class="bs-status ${status.toLowerCase()==="succeeded"?"DONE":"NEXT"}">${esc(status)}</span></div>
            <code>${esc(row.run_key)}</code>
            <small>parent: ${esc(parent)} · correlation: ${esc(lineage.parent_correlation_id||lineage.correlation_id||"—")}</small>
            <p>Repair stays internal until reproduction, root cause, tests, independent review and Owner Gate.</p>
          </article>`;
        }).join(""):'<div class="bs-empty">No incident runs yet.</div>';
      }
    }catch(error){
      const copy=esc(error?.message||"Durable automation ledger unavailable");
      if(runsHost)runsHost.innerHTML=`<div class="bs-empty bs-error">${copy}</div>`;
      if(approvalsHost)approvalsHost.innerHTML=`<div class="bs-empty bs-error">${copy}</div>`;
      if(incidentsHost)incidentsHost.innerHTML=`<div class="bs-empty bs-error">${copy}</div>`;
    }
  }

  function renderAutomation(){
    const a=data.automation||{};
    const state=$("#bs-automation-state");
    if(state) state.textContent=String(a.mode||"UNKNOWN");
    const adapters=$("#bs-automation-adapters");
    if(adapters){
      adapters.innerHTML=(a.adapters||[]).map(x=>`<article class="bs-automation-adapter">
        <div><strong>${esc(x.id)}</strong><span class="bs-status ${x.status==="CONNECTED"?"DONE":"NEXT"}">${esc(x.status)}</span></div>
        <p>${esc(x.role)}</p><code>authority: ${esc(x.authority||"NONE")}</code>
      </article>`).join("");
    }
    const host=$("#bs-automation-workflows");
    if(host){
      host.innerHTML=(a.workflows||[]).map(w=>`<article class="bs-automation-workflow">
        <div class="bs-automation-head"><strong>${esc(w.name)}</strong><span class="bs-lifecycle ${esc(w.mode||"SHADOW")}">${esc(w.mode||"SHADOW")}</span></div>
        <small>${esc(w.id)} · owner: ${esc(w.owner)}</small>
        <div class="bs-journey-steps">${(w.stages||[]).map(x=>`<span>${esc(x)}</span>`).join("")}</div>
        <p>gate: ${esc(w.gate||"none")} · material: ${esc(w.material_action||"none")} · failure: ${esc(w.failure_route||"hold")}</p>
      </article>`).join("");
    }
    const shelf=$("#bs-shelf-target");
    if(shelf){
      const t=a.targets||{};
      shelf.innerHTML=`<strong>${esc(t.departments||0)} departments × ${esc(t.target_products_per_department||0)} target products</strong>
        <span>${esc(t.truth_rule||"Verified evidence only.")}</span>
        <code>readiness = verified_count + fresh_stock + fresh_price + supported_shipping + media_present</code>`;
    }
  }


  async function renderShelfCoverage(){
    const summaryHost=$("#bs-shelf-coverage-summary");
    const grid=$("#bs-shelf-coverage-matrix");
    if(!grid)return;
    try{
      const contract=await json("boom-shelf-department-contract.json");
      const audit=window.HuntShelfCoverageAudit;
      if(!audit?.fromServer)throw new Error("Shelf coverage server adapter unavailable");
      const report=await audit.fromServer(contract);
      const summary=report.summary||{};
      if(summaryHost){
        summaryHost.innerHTML=[
          metric((summary.canonical_resolved??13)+"/17","Canonical departments"),
          metric(summary.ready??0,"Ready ≥ 1,000"),
          metric(summary.stale??0,"Stale evidence"),
          metric(summary.unknown??0,"Unknown"),
          metric(summary.known_verified_total??0,"Fresh verified total")
        ].join("");
      }
      grid.innerHTML=(report.departments||[]).map(row=>{
        const verified=row.verified_count===null||row.verified_count===undefined?"UNKNOWN":String(row.verified_count);
        const stale=row.stale_verified_count===null||row.stale_verified_count===undefined?"":` · stale count: ${esc(row.stale_verified_count)}`;
        const freshness=row.evidence_fresh?"fresh":"stale / unresolved";
        return `<article class="bs-shelf-card" data-state="${esc(row.state||"UNKNOWN")}">
          <div class="bs-shelf-head"><strong>${esc(row.title||row.slug||"Unresolved")}</strong><span class="bs-status ${row.state==="READY"?"DONE":"NEXT"}">${esc(row.state||"UNKNOWN")}</span></div>
          <div class="bs-shelf-count">${esc(verified)}<small> / 1,000</small></div>
          <p>gap: ${esc(row.gap_to_target??1000)} · ${esc(freshness)}${stale}</p>
          <small>${esc((row.providers||[]).join(" · ")||"No verified provider evidence")}</small>
        </article>`;
      }).join("");
    }catch(error){
      if(summaryHost)summaryHost.innerHTML="";
      grid.innerHTML=`<div class="bs-empty bs-error">Shelf evidence unavailable: ${esc(error?.message||"unknown error")}. Readiness remains blocked.</div>`;
    }
  }

  function renderGovernance(){
    const cards=[
      {value:data.budgets.resources.length,label:"Material budget classes",detail:"autonomous budget = 0"},
      {value:data.health.mode,label:"Brain circuit breaker",detail:"recommend-only"},
      {value:data.errors.errors.length,label:"Safe error codes",detail:"trace-safe taxonomy"},
      {value:data.reasons.codes.length,label:"Decision reason codes",detail:"evidence still required"},
      {value:data.storage.stores.length,label:"Registered storage keys",detail:"version/migration contract"}
    ];
    $("#bs-governance").innerHTML=cards.map(c=>`<article class="bs-governance"><strong>${esc(c.value)}</strong><span>${esc(c.label)}</span><code>${esc(c.detail)}</code></article>`).join("");
  }

  function renderCommerceHandoff(){
    const host=$("#bs-commerce-handoff");
    if(!host)return;
    host.innerHTML=data.commerce.stages.map(stage=>`<article class="bs-journey">
      <h3>${esc(stage.id)}</h3>
      <p><strong>${esc(stage.owner)}</strong></p>
      <div class="bs-journey-steps">${(stage.requires||[]).map(x=>`<span>requires: ${esc(x)}</span>`).join("")}${stage.emits?`<span>emits: ${esc(stage.emits)}</span>`:""}</div>
    </article>`).join("");
  }
  function renderOperationsState(){
    const host=$("#bs-operations-state");
    if(!host)return;
    const domains=["payment","order","fulfillment","pipeline"];
    const stateCards=domains.map(id=>{
      const section=data.states[id]||{};
      const transitions=Object.values(section.transitions||{}).reduce((sum,rows)=>sum+(rows?.length||0),0);
      return `<article class="bs-journey">
        <h3>${esc(id)}</h3>
        <p><strong>${esc(data.states.owner)}</strong> · ${esc((section.states||section.stages||[]).length)} states · ${esc(transitions)} allowed transitions</p>
        <div class="bs-journey-steps">${Object.entries(section.transitions||{}).map(([from,to])=>`<span>${esc(from)} → ${esc((to||[]).join(", ")||"terminal")}</span>`).join("")}</div>
      </article>`;
    });
    const proof=data.payplusProof||{};
    stateCards.push(`<article class="bs-journey">
      <h3>payplus_status_proof</h3>
      <p><strong>${esc(proof.owner||"operations_brain")}</strong> · <span class="bs-status ${proof.state==="READY"?"DONE":"NEXT"}">${esc(proof.state||"HOLD")}</span></p>
      <div class="bs-journey-steps">
        <span>success fingerprint: ${proof.approved_success?"approved":"not approved"}</span>
        <span>reject fingerprint: ${proof.approved_reject?"approved":"not approved"}</span>
        <span>owner approval: ${proof.owner_approved===true?"yes":"no"}</span>
        <span>policy: exact fingerprint only</span>
      </div>
    </article>`);
    host.innerHTML=stateCards.join("");
  }
  function renderJourneys(){
    const host=$("#bs-journeys");
    if(!host)return;
    host.innerHTML=data.journeys.journeys.map(j=>`<article class="bs-journey"><h3>${esc(j.id)}</h3><p>${esc(j.goal)}</p><div class="bs-journey-steps">${j.steps.map(step=>`<span>${esc(step.kind)}: ${esc(step.ref)}${step.optional?" · optional":""}</span>`).join("")}</div></article>`).join("");
  }
  function renderLegalReadiness(){
    const host=$("#bs-legal-readiness");
    if(!host)return;
    const legal=data.legal||{};
    host.innerHTML=(legal.required_documents||[]).map(doc=>`<article class="bs-journey">
      <h3>${esc(doc.title)}</h3>
      <p><strong>${esc(legal.owner||"learning_governance_brain")}</strong> · <span class="bs-status NEXT">OWNER GATE</span></p>
      <div class="bs-journey-steps">
        <span>doc_key: ${esc(doc.doc_key)}</span>
        <span>source: ${esc(legal.current_source||"hunt_legal_document_versions")}</span>
        <span>public only after published + owner_approved</span>
      </div>
    </article>`).join("");
  }
  function renderMerge(){
    const host=$("#bs-merge");
    if(!host)return;
    host.innerHTML=data.merge.states.map(row=>`<article class="bs-merge"><div class="bs-merge-head"><h3>${esc(row.state)}</h3><span class="bs-status ${row.status==="IMPLEMENTED"?"DONE":"NEXT"}">${esc(row.status)}</span></div><p>${esc(row.policy)}</p><code>${esc(row.owner)}</code></article>`).join("");
  }

  function renderTraces(){
    const host=$("#bs-traces");
    if(!host)return;
    if(!traces.length){host.innerHTML='<div class="bs-empty">No actions observed yet.</div>';return;}
    host.innerHTML=traces.map(t=>{
      const state=String(t.detail?.state||"event");
      const time=new Date(Number(t.ts)||Date.now()).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit",second:"2-digit"});
      const lineage=[
        t.owner,
        t.decision_owner?("decision:"+t.decision_owner):"",
        t.detail?.commerce_truth?("commerce:"+t.detail.commerce_truth):"",
        t.endpoint||t.telemetry,t.analytics,t.learning,t.correlation_id
      ].filter(Boolean).join(" · ");
      return `<article class="bs-trace"><time>${esc(time)}</time><code>${esc(t.action_id)}</code><span class="bs-trace-state ${esc(state)}">${esc(state)}</span><small>${esc(lineage)}</small></article>`;
    }).join("");
  }
  function recordTrace(payload){
    if(!payload?.action_id)return;
    traces.unshift(payload);
    if(traces.length>50)traces.length=50;
    renderTraces();
  }

  function renderFiles(){
    const counts=new Map();
    for(const row of data.inventory.interactions)counts.set(row.file,(counts.get(row.file)||0)+1);
    const rows=[...counts.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
    $("#bs-control-count").textContent=`${data.inventory.interactions.length} mapped controls across ${rows.length} files`;
    $("#bs-files").innerHTML=rows.map(([file,count])=>`<article class="bs-file"><strong>${esc(file)}</strong><span>${count} mapped interaction${count===1?"":"s"}</span></article>`).join("");
  }
  async function guardAdmin(){
    const gate=$("#bs-access-copy");
    const result=await runtime?.adminReady?.();
    if(result?.ok){
      document.body.dataset.adminReady="true";
      return true;
    }
    const reason=String(result?.reason||"AUTH_REQUIRED");
    if(gate)gate.textContent=reason==="AUTH_REQUIRED"
      ? "Sign in with the approved BOOM owner/admin account to open this private surface."
      : "This account is not authorized for BOOM Brain Studio.";
    return false;
  }

  async function boot(){
    try{
      if(!await guardAdmin())return;
      const [brains,actions,inventory,surfaces,gaps,journeys,commerce,states,payplusProof,legal,merge,budgets,health,errors,reasons,storage,automation]=await Promise.all([
        json("boom-brain-registry.json"),json("boom-action-contract.json"),json("boom-interaction-inventory.json"),json("boom-surface-contract.json"),json("boom-brain-gaps.json"),json("boom-journey-contract.json"),json("boom-commerce-handoff-contract.json"),json("boom-payment-order-state-contract.json"),json("boom-payplus-proof-contract.json"),json("boom-legal-readiness-contract.json"),json("boom-guest-merge-matrix.json"),json("boom-mission-budget-contract.json"),json("boom-brain-health-policy.json"),json("boom-error-taxonomy.json"),json("boom-decision-reason-codes.json"),json("boom-storage-contract.json"),json("boom-automation-control-plane.json")
      ]);
      data={brains,actions,inventory,surfaces,gaps,journeys,commerce,states,payplusProof,legal,merge,budgets,health,errors,reasons,storage,automation};
      $("#bs-contract-state").textContent=`${brains.version} · contracts loaded`;
      renderMetrics();renderFlow();renderBrains();renderKernels();fillOwnerFilter();renderActions();renderSurfaces();renderGaps();renderAutomation();renderConsolidationMap();renderDomainWiring();renderCreativeLearning();renderDurableAutomation();renderShelfCoverage();renderGovernance();renderCommerceHandoff();renderOperationsState();renderLegalReadiness();renderJourneys();renderMerge();renderFiles();
    }catch(error){
      $("#bs-contract-state").textContent="Contract load failed";
      $("#bs-contract-state").classList.add("bs-error");
      $("#bs-metrics").innerHTML=`<div class="bs-empty bs-error">${esc(error?.message||"Brain OS unavailable")}</div>`;
    }
  }
  $("#bs-action-search")?.addEventListener("input",event=>{
    runtime?.emit?.("filter.apply",{surface:"brain_studio",filter:"action_search",value:String(event.currentTarget.value||"")},{broadcast:false});
    renderActions();
  });
  $("#bs-action-owner")?.addEventListener("change",event=>{
    runtime?.emit?.("filter.apply",{surface:"brain_studio",filter:"action_owner",value:String(event.currentTarget.value||"")},{broadcast:false});
    renderActions();
  });
  document.addEventListener("click",event=>{
    const btn=event.target.closest?.("[data-gap-filter]");
    if(!btn)return;
    gapFilter=btn.dataset.gapFilter||"all";
    runtime?.emit?.("filter.apply",{surface:"brain_studio",filter:"gap_status",value:gapFilter},{broadcast:false});
    document.querySelectorAll("[data-gap-filter]").forEach(x=>x.classList.toggle("active",x===btn));
    renderGaps();
  });
  window.addEventListener("boom:action",event=>recordTrace(event.detail));
  window.addEventListener("boom:trace",event=>recordTrace(event.detail));
  boot();
})();
