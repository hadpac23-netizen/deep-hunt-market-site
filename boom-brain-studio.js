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







  async function renderReadiness(){
    const host=$("#bs-readiness"),state=$("#bs-readiness-state"),blockers=$("#bs-readiness-blockers");
    if(!host)return;
    try{
      const r=await json("boom-control-plane-readiness.json");
      if(state)state.textContent=String(r.overall||"UNKNOWN");
      host.innerHTML=(r.areas||[]).map(row=>`<article class="bs-readiness-card" data-status="${esc(row.status||"UNKNOWN")}">
        <small>${esc(row.id)}</small>
        <strong>${esc(row.status)}</strong>
        <p>${esc(row.evidence||"")}</p>
      </article>`).join("");
      if(blockers){
        blockers.innerHTML=(r.blockers||[]).map((x,i)=>`<article><b>${i+1}</b><span>${esc(x)}</span></article>`).join("");
      }
    }catch(error){
      if(state)state.textContent="READINESS UNKNOWN";
      host.innerHTML=`<div class="bs-empty bs-error">Readiness file unavailable: ${esc(error?.message||"unknown")}</div>`;
    }
  }

  async function renderControlMaps(){
    const summary=$("#bs-control-map-summary"),host=$("#bs-control-maps");
    if(!host)return;
    try{
      const [dataMap,gateMap,toolMap,supabaseMap]=await Promise.all([
        json("boom-data-ownership-map.json"),
        json("boom-owner-gate-map.json"),
        json("boom-tool-registry.json"),
        json("boom-supabase-runtime-map.json")
      ]);
      if(summary)summary.innerHTML=[
        metric(dataMap.stores?.length||0,"Owned data stores"),
        metric(toolMap.runtime_tools?.length||0,"Canonical tools"),
        metric(gateMap.actions?.length||0,"Material Owner Gates"),
        metric((supabaseMap.groups||[]).reduce((n,g)=>n+(g.functions?.length||0),0),"Mapped Edge Functions"),
        metric((toolMap.runtime_tools||[]).filter(x=>/NOT_DEPLOYED|NOT_CONNECTED/.test(x.status||"")).length,"Not active by truth")
      ].join("");
      const ownerGroups=new Map();
      for(const row of (dataMap.stores||[])){
        const owner=row.owner||"unowned";
        if(!ownerGroups.has(owner))ownerGroups.set(owner,[]);
        ownerGroups.get(owner).push(row.table);
      }
      const ownership=[...ownerGroups.entries()].map(([owner,tables])=>`<article class="bs-control-card">
        <small>DATA OWNER</small><h3>${esc(owner)}</h3>
        <div class="bs-tags">${tables.map(x=>`<span>${esc(x)}</span>`).join("")}</div>
      </article>`).join("");
      const tools=(toolMap.runtime_tools||[]).map(row=>`<article class="bs-control-card">
        <small>TOOL · ${esc(row.type)}</small><h3>${esc(row.id)}</h3>
        <p>${esc(row.status)} · authority ${esc(row.authority)}</p>
        <code>${esc(row.owner_plane)}</code>
      </article>`).join("");
      const gates=(gateMap.actions||[]).map(row=>`<article class="bs-control-card">
        <small>OWNER GATE</small><h3>${esc(row.action)}</h3>
        <p>decision: ${esc(row.decision_owner)} · execute: ${esc(row.execution_owner)}</p>
        <code>${esc(row.gate)}</code>
      </article>`).join("");
      host.innerHTML=ownership+tools+gates;
    }catch(error){
      host.innerHTML=`<div class="bs-empty bs-error">Control maps unavailable: ${esc(error?.message||"unknown")}</div>`;
    }
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

  async function renderStylistAcademy(){
    const host=$("#bs-stylist-academy");
    if(!host)return;
    try{
      const [academy,training,f35,baseline,round1]=await Promise.all([
        json("boom-stylist-academy-contract.json"),
        json("evidence/HUNT-STYLIST-ACADEMY-TRAINING-SET-2026-09-22.json"),
        json("boom-f35-style-commerce-research-2026-09-22.json"),
        json("evidence/HUNT-F35-SIX-LAYER-PREFERENCE-BASELINE-2026-09-22.json"),
        json("evidence/HUNT-STYLIST-F35-ROUND1-2026-09-22.json")
      ]);
      const tracks=(academy.tracks||[]).map(t=>`<div class="bs-run"><div class="bs-run-head"><strong>${esc(t.id)} · ${esc(t.name)}</strong><span class="bs-status NEXT">${esc((t.modules||[]).length)} modules</span></div><p>${esc((t.modules||[]).join(" · "))}</p></div>`).join("");
      const exams=(academy.exams||[]).map(e=>`<div class="bs-run"><div class="bs-run-head"><strong>${esc(e.name)}</strong><span class="bs-status NEXT">PASS ${esc(e.pass_score)}+</span></div><small>${esc(e.output_rule)}</small></div>`).join("");
      const layers=(f35.six_layers||[]).map(l=>`<span>${esc(l.id)} · ${esc(l.name)}</span>`).join("");
      const courses=(f35.multidisciplinary_curriculum||[]).map(c=>`<div class="bs-run"><div class="bs-run-head"><strong>${esc(c.id)} · ${esc(c.name)}</strong><span class="bs-status NEXT">${esc((c.skills||[]).length)} skills</span></div><small>${esc((c.sources||[]).join(" · "))}</small></div>`).join("");
      host.innerHTML=`
        <article class="bs-creative-card">
          <div class="bs-automation-head"><strong>Academy Curriculum</strong><span class="bs-status NEXT">${esc(academy.status)}</span></div>
          <p>${esc(academy.objective)}</p>
          <div class="bs-run-list">${tracks}</div>
          <code>production influence false · autonomous shelf reorder false · publish false</code>
        </article>
        <article class="bs-creative-card">
          <div class="bs-automation-head"><strong>Verified Training Set</strong><span class="bs-status DONE">${esc(training.verified_products)} products</span></div>
          <p>Country-limited excluded: ${esc(training.excluded_country_limited)} · training only · Product Truth source preserved.</p>
          <small>EXAMS</small>
          <div class="bs-run-list">${exams}</div>
          <small>CURRENT MASTERY</small>
          <p>Level ${esc(academy.current_state?.mastery_level)} · ${esc((academy.mastery||[])[academy.current_state?.mastery_level]?.name||"UNTRAINED")}</p>
        </article>
        <article class="bs-creative-card">
          <div class="bs-automation-head"><strong>F35 · 6 Preference Layers</strong><span class="bs-status DONE">${esc(baseline.departments?.length||0)}/17 mapped</span></div>
          <div class="bs-journey-steps">${layers}</div>
          <p>External market baseline only. HUNT first-party behavior must validate or override these weights.</p>
          <code>Value · Function · Trend · Identity · Premium/Craft · Conscious/Long-life</code>
        </article>
        <article class="bs-creative-card">
          <div class="bs-automation-head"><strong>Multidisciplinary Course Round</strong><span class="bs-status NEXT">RESEARCHED · NOT COMPLETED</span></div>
          <div class="bs-run-list">${courses}</div>
          <small>CASE-STUDY RULE</small>
          <p>${esc(f35.brand_case_study_policy?.blocked||"No copying.")}</p>
        </article>
        <article class="bs-creative-card">
          <div class="bs-automation-head"><strong>F35 Exam Round 1</strong><span class="bs-status NEXT">${esc(round1.round_status)}</span></div>
          <p>Survey: ${esc(round1.survey_exam?.status)} · Style: ${esc(round1.style_exam?.status)} · Shelf: ${esc(round1.shelf_exam?.status)}</p>
          <small>ASSORTMENT GAP</small>
          <div class="bs-journey-steps">
            <span>Footwear ${esc(round1.style_exam?.assortment?.footwear)}</span>
            <span>Bottoms ${esc(round1.style_exam?.assortment?.bottoms)}</span>
            <span>Tops ${esc(round1.style_exam?.assortment?.tops)}</span>
            <span>Accessories ${esc(round1.style_exam?.assortment?.accessories)}</span>
          </div>
          <small>CURRENT HUNT QA</small>
          <p>${esc(round1.current_hunt_comparison?.shelves_below_25pct_availability_verified)} shelves are below 25% availability-verified in the current snapshot. Existing layout is QA evidence, not training truth.</p>
          <code>mastery change false · Production unchanged</code>
        </article>`;
    }catch(error){
      host.innerHTML=`<div class="bs-empty bs-error">Stylist Academy unavailable: ${esc(error?.message||"unknown")}</div>`;
    }
  }

  async function renderHuntBrandDesign(){
    const host=$("#bs-hunt-brand-design");
    if(!host)return;
    try{
      const [lane,brief]=await Promise.all([
        json("boom-hunt-brand-design-contract.json"),
        json("boom-hunt-core-01-design-brief.json")
      ]);
      const flow=(lane.flow||[]).map(x=>`<span>${esc(x)}</span>`).join("");
      const team=(lane.team||[]).map(x=>`<span>${esc(x.agent)} · ${esc(x.stage)}</span>`).join("");
      const products=(lane.collection?.products||[]).map(p=>`<div class="bs-run"><div class="bs-run-head"><strong>${esc(p.title)}</strong><span class="bs-status NEXT">${esc(p.slot)}</span></div><small>Printful #${esc(p.product_id)} · ${esc(p.role)}</small></div>`).join("");
      const directions=(brief.design_directions||[]).map(d=>`<div class="bs-run"><div class="bs-run-head"><strong>${esc(d.name)}</strong><span class="bs-status NEXT">${esc(d.id)}</span></div><p>${esc(d.idea)}</p></div>`).join("");
      host.innerHTML=`
        <article class="bs-creative-card">
          <div class="bs-automation-head"><strong>${esc(lane.collection?.working_name||"HUNT Collection")}</strong><span class="bs-status NEXT">${esc(lane.status)}</span></div>
          <p>${esc(lane.purpose)}</p>
          <small>TEAM</small><div class="bs-journey-steps">${team}</div>
          <small>FLOW</small><div class="bs-journey-steps">${flow}</div>
          <code>publish false · product creation false · checkout false · Owner Gate required</code>
        </article>
        <article class="bs-creative-card">
          <div class="bs-automation-head"><strong>Collection Zero · 5 verified bases</strong><span class="bs-status DONE">PRODUCT TRUTH SOURCE</span></div>
          <div class="bs-run-list">${products}</div>
          <small>NEXT</small>
          <p>${esc(lane.next)}</p>
        </article>
        <article class="bs-creative-card">
          <div class="bs-automation-head"><strong>Design Directions</strong><span class="bs-status NEXT">OWNER PICK</span></div>
          <div class="bs-run-list">${directions}</div>
          <small>COMMERCE RULE</small>
          <p>${esc(brief.commerce_recheck)}</p>
        </article>`;
    }catch(error){
      host.innerHTML=`<div class="bs-empty bs-error">Brand design lane unavailable: ${esc(error?.message||"unknown")}</div>`;
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
          <div class="bs-gate-actions">
            <button type="button" data-owner-gate-approve data-decision-key="${esc(row.decision_key)}">Approve SHADOW</button>
            <button type="button" data-owner-gate-reject data-decision-key="${esc(row.decision_key)}">Reject</button>
          </div>
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









  async function renderCheckoutOrderTrackingProof(){
    const host=$("#bs-checkout-order-tracking-proof");
    const state=$("#bs-checkout-order-tracking-state");
    if(!host)return;
    const proof=window.BoomCheckoutOrderTrackingProof;
    const contract=data.checkoutOrderTrackingContract||{};
    if(!proof?.snapshot){
      host.innerHTML='<div class="bs-empty bs-error">Checkout/Order/Tracking proof unavailable.</div>';
      if(state)state.textContent="UNAVAILABLE";
      return;
    }
    try{
      const out=await proof.snapshot();
      if(state)state.textContent=String(out.state||"UNKNOWN");
      const stages=contract.stages||[];
      const stats=out.stats||{};
      host.innerHTML=`
        <article class="bs-proof-summary">
          <div><small>BOUND SESSIONS</small><strong>${esc(stats.bound_sessions??0)}</strong></div>
          <div><small>USER-BOUND TEST ORDERS</small><strong>${esc(stats.user_bound_orders??0)}</strong></div>
          <div><small>DRY-RUN PASS</small><strong>${esc(stats.dry_run_pass??0)}</strong></div>
          <div><small>SUPPLIER ORDERS</small><strong>${esc(stats.supplier_order_rows??0)}</strong></div>
          <div><small>TRACKING ROWS</small><strong>${esc(stats.tracking_rows??0)}</strong></div>
          <div><small>SHIPPED EVENTS</small><strong>${esc(stats.shipped_event_rows??0)}</strong></div>
        </article>
        <div class="bs-proof-stages">${stages.map((x,i)=>{const pass=out.checks?.[x.id]===true;return `<article data-state="${pass?"PASS":"BLOCKED"}"><b>${i+1}</b><div><strong>${esc(x.id)}</strong><span>${pass?"PASS":"WAITING"}</span><small>${esc((x.requires||[]).join(" · "))}</small></div></article>`;}).join("")}</div>
        <div class="bs-attribution-grid">
          <article><small>HISTORICAL CJ BUSY</small><strong>${esc(out.historical_failures?.cj_busy??0)}</strong><span>Current code has transient retry + reconciliation.</span></article>
          <article><small>HISTORICAL PHONE FORMAT</small><strong>${esc(out.historical_failures?.phone_format??0)}</strong><span>Current code normalizes Israel phone to +972.</span></article>
          <article><small>LIVE IMPLIED?</small><strong>NO</strong><span>Sandbox E2E never activates real supplier logistics.</span></article>
          <article><small>FIRST BLOCKER</small><strong>${esc(out.blocker||"none")}</strong><span>Evidence, not assumptions.</span></article>
        </div>`;
    }catch(error){
      host.innerHTML=`<div class="bs-empty bs-error">Checkout/order/tracking evidence unavailable: ${esc(error?.message||"unknown")}</div>`;
      if(state)state.textContent="UNKNOWN";
    }
  }

  async function renderPaymentLaunchGate(){
    const host=$("#bs-payment-launch-gate");
    const state=$("#bs-payment-launch-state");
    if(!host)return;
    const gate=window.BoomPaymentLaunchGate;
    if(!gate?.snapshot){
      host.innerHTML='<div class="bs-empty bs-error">Payment Launch Gate unavailable.</div>';
      if(state)state.textContent="UNAVAILABLE";
      return;
    }
    try{
      const proof=data.payplusSandboxProof?.current_truth||{};
      const providerEvidence={
        payplus:{
          account_approved:false,
          server_credentials_ready:false,
          sandbox_proven:proof.sandbox_observations>0,
          success_callback_proven:proof.paid_acceptance_ready===true,
          failure_callback_proven:proof.paid_acceptance_ready===true,
          idempotency_integrity_proven:proof.paid_acceptance_ready===true,
          refund_proven:proof.refund_launch_ready===true,
          finance_ledger_proven:false,
          settlement_destination_verified:false,
          country_currency_scope_verified:false,
          legal_checkout_ready:false,
          owner_gate_approved:false
        },
        paypal:{
          account_approved:false,server_credentials_ready:false,sandbox_proven:false,
          success_callback_proven:false,failure_callback_proven:false,idempotency_integrity_proven:false,
          refund_proven:false,finance_ledger_proven:false,settlement_destination_verified:false,
          country_currency_scope_verified:false,legal_checkout_ready:false,owner_gate_approved:false
        }
      };
      const out=await gate.snapshot(providerEvidence);
      if(state)state.textContent=`${out.summary.live} LIVE · ${out.summary.candidates} READY CANDIDATES · ${out.summary.planned} PLANNED`;
      host.innerHTML=(out.routes||[]).map(r=>`<article class="bs-payment-route">
        <div class="bs-skill-head"><strong>${esc(r.display_name||r.route_key)}</strong><span class="bs-status ${r.state==="LIVE"?"DONE":"NEXT"}">${esc(r.state)}</span></div>
        <small>${esc(r.processor)} · ${esc(r.payment_method)}</small>
        <p>First blocker: <b>${esc(r.blocker||"none")}</b></p>
        <div class="bs-route-gates">${Object.entries(r.checks||{}).map(([k,v])=>`<span data-pass="${v===true?"1":"0"}">${v===true?"✓":"·"} ${esc(k)}</span>`).join("")}</div>
      </article>`).join("")||'<div class="bs-empty">No payment routes configured.</div>';
    }catch(error){
      host.innerHTML=`<div class="bs-empty bs-error">Payment route readiness unavailable: ${esc(error?.message||"unknown")}</div>`;
      if(state)state.textContent="UNKNOWN";
    }
  }

  async function renderPayPlusSandboxProof(){
    const host=$("#bs-payplus-sandbox-proof");
    const state=$("#bs-payplus-sandbox-state");
    if(!host)return;
    const p=window.BoomPayPlusSandboxProof;
    const baseline=data.payplusSandboxProof||{};
    if(!p?.evaluate){
      host.innerHTML='<div class="bs-empty bs-error">PayPlus Sandbox Proof unavailable.</div>';
      if(state)state.textContent="UNAVAILABLE";
      return;
    }
    const truth=baseline.current_truth||{};
    const out=p.evaluate({
      control:{enabled:truth.control_enabled===true,owner_approved:truth.control_owner_approved===true},
      sessions:Array.from({length:Number(truth.sandbox_sessions||0)},(_,i)=>({id:"baseline-"+i})),
      observations:[]
    });
    if(state)state.textContent=String(out.state||"UNKNOWN");
    const matrix=baseline.proof_matrix||[];
    host.innerHTML=`
      <article class="bs-proof-summary">
        <div><small>SANDBOX CONTROL</small><strong>${truth.control_enabled&&truth.control_owner_approved?"READY":"OFF"}</strong></div>
        <div><small>SESSIONS</small><strong>${esc(truth.sandbox_sessions??0)}</strong></div>
        <div><small>OBSERVATIONS</small><strong>${esc(truth.sandbox_observations??0)}</strong></div>
        <div><small>PAID ACCEPTANCE</small><strong>${truth.paid_acceptance_ready?"READY":"NOT PROVEN"}</strong></div>
        <div><small>CHECKOUT</small><strong>${truth.checkout_launch_ready?"READY":"NOT PROVEN"}</strong></div>
        <div><small>REFUND</small><strong>${truth.refund_launch_ready?"READY":"NOT PROVEN"}</strong></div>
      </article>
      <div class="bs-proof-stages">${matrix.map((x,i)=>`<article data-state="BLOCKED"><b>${i+1}</b><div><strong>${esc(x.id)}</strong><span>NOT PROVEN</span><small>${esc(x.pass_when||"sandbox evidence required")}</small></div></article>`).join("")}</div>
      <div class="bs-profit-guard glass"><strong>Current blocker: ${esc(out.blocker||"NO_SANDBOX_EVIDENCE")}</strong><span>J4 alone never means paid. Exact PayPlus staging fingerprints must be observed with verified signature + IPN before classification.</span></div>`;
  }

  async function renderFirstRealOrderProof(){
    const host=$("#bs-first-real-order-proof");
    const state=$("#bs-first-real-order-state");
    if(!host)return;
    const proof=window.BoomFirstRealOrderProof;
    if(!proof?.snapshot){
      host.innerHTML='<div class="bs-empty bs-error">First Real-Order Proof unavailable.</div>';
      if(state)state.textContent="UNAVAILABLE";
      return;
    }
    try{
      const out=await proof.snapshot();
      if(state)state.textContent=String(out.state||"UNKNOWN");
      const truth=out.live_truth||{};
      const stages=out.stages||[];
      host.innerHTML=`
        <article class="bs-proof-summary">
          <div><small>PAYMENT ACCEPTANCE</small><strong>${truth.payment_acceptance_enabled&&truth.payment_acceptance_owner_approved?"READY":"BLOCKED"}</strong></div>
          <div><small>REAL ORDER</small><strong>${truth.real_order_found?"FOUND":"NONE"}</strong></div>
          <div><small>REAL FINANCE</small><strong>${truth.real_finance_found?"FOUND":"NONE"}</strong></div>
          <div><small>HOURLY EVIDENCE</small><strong>${truth.hourly_found?"FOUND":"NONE"}</strong></div>
          <div><small>VERIFIED PROFIT / HOUR</small><strong>${out.verified_net_profit_per_hour===null?"UNKNOWN":"$"+Number(out.verified_net_profit_per_hour).toLocaleString()}</strong></div>
          <div><small>TARGET GAP</small><strong>${out.target_gap===null?"UNKNOWN":"$"+Number(out.target_gap).toLocaleString()}</strong></div>
        </article>
        <div class="bs-proof-stages">${stages.map((x,i)=>`<article data-state="${esc(x.status)}"><b>${i+1}</b><div><strong>${esc(x.id)}</strong><span>${esc(x.status)}</span><small>${esc(x.reason||"evidence satisfied")}</small></div></article>`).join("")||'<div class="bs-empty">No proof stages evaluated.</div>'}</div>
        <div class="bs-profit-guard glass"><strong>Current blocker: ${esc(out.blocker||"none")}</strong><span>Proof layer has zero activation authority. It cannot enable payment acceptance, live supplier orders, pricing, publishing or payouts.</span></div>`;
    }catch(error){
      host.innerHTML=`<div class="bs-empty bs-error">Real-order proof unavailable: ${esc(error?.message||"unknown")}</div>`;
      if(state)state.textContent="UNKNOWN";
    }
  }

  async function renderHourlyProfitReview(){
    const host=$("#bs-hourly-profit-state");
    const attrHost=$("#bs-marketing-profit-attribution");
    const attrState=$("#bs-marketing-profit-state");
    const costHost=$("#bs-marketing-cost-evidence");
    const costState=$("#bs-marketing-cost-state");
    if(host){
      try{
        const loop=window.BoomHourlyProfitLoop;
        if(!loop?.run)throw new Error("Hourly Profit Loop unavailable");
        const report=await loop.run({hours:24});
        const d=report.diagnosis||{};
        const snap=report.snapshot||{};
        host.innerHTML=`<div class="bs-hourly-main">
          <div><small>24H OBSERVED ROWS</small><strong>${esc(snap.rows??0)}</strong></div>
          <div><small>EXACT VERIFIED ROWS</small><strong>${esc(snap.exact_verified_rows??0)}</strong></div>
          <div><small>VERIFIED NET PROFIT / HOUR</small><strong>${d.verified_net_profit_per_hour===null?"UNKNOWN":"$"+Number(d.verified_net_profit_per_hour).toLocaleString()}</strong></div>
          <div><small>TARGET GAP</small><strong>${d.target_gap===null?"UNKNOWN":"$"+Number(d.target_gap).toLocaleString()}</strong></div>
        </div>
        <div class="bs-hourly-diagnosis"><b>${esc(d.status||"UNKNOWN")}</b><span>constraint: ${esc(d.primary_constraint||"none")}</span><small>latest observed: ${esc(d.latest_observed_status||snap.latest_row?.verification_status||"none")}</small></div>
        <div class="bs-profit-proposals">${(d.proposals||[]).map(p=>`<span>${esc(p.priority)} · ${esc(p.type)} · ${esc(p.action)}${p.owner_gate?" · Owner Gate":""}</span>`).join("")||"<span>No proposals until evidence is available.</span>"}</div>`;
      }catch(error){
        host.innerHTML=`<div class="bs-empty bs-error">Hourly profit evidence unavailable: ${esc(error?.message||"unknown")}</div>`;
      }
    }
    const a=data.marketingProfitAttribution||{};
    if(attrState)attrState.textContent=String(a.current_truth?.state||"UNKNOWN");
    if(attrHost){
      attrHost.innerHTML=[
        `<article><small>REAL ORDERS LINKED</small><strong>${esc(a.current_truth?.real_order_linked_rows??0)}</strong><span>Required before conversion/profit claims.</span></article>`,
        `<article><small>PROFIT EVIDENCE READY</small><strong>${esc(a.current_truth?.profit_evidence_ready_rows??0)}</strong><span>Finance evidence must be real and non-test.</span></article>`,
        `<article><small>MARKETING COST FEED</small><strong>${esc(a.current_truth?.marketing_cost_feed||"UNKNOWN")}</strong><span>Paid net profit and CAC stay UNKNOWN without actual spend/fee evidence.</span></article>`,
        `<article><small>PRIMARY KPI</small><strong>Marketing Net Profit</strong><span>ROAS is diagnostic only.</span></article>`
      ].join("");
    }
    const c=data.marketingCostEvidence||{};
    const cs=c.current_evidence_summary||{};
    if(costState)costState.textContent=String(cs.spend_truth||"UNKNOWN");
    if(costHost){
      costHost.innerHTML=[
        `<article><small>TRAFFIC SOURCE</small><strong>${esc(cs.ga4_account_name||"UNKNOWN")}</strong><span>${esc(cs.traffic_truth||"UNKNOWN")} · GA4 read-only</span></article>`,
        `<article><small>SESSIONS · 30D</small><strong>${esc(cs.sessions??"UNKNOWN")}</strong><span>Observed traffic evidence.</span></article>`,
        `<article><small>PURCHASES / REVENUE</small><strong>${esc(cs.purchases??"UNKNOWN")} / ${esc(cs.purchase_revenue??"UNKNOWN")}</strong><span>GA4 purchase evidence for the audited window.</span></article>`,
        `<article><small>SPEND TRUTH</small><strong>${esc(cs.spend_truth||"UNKNOWN")}</strong><span>Reported ad cost: ${esc(cs.advertiser_ad_cost_reported??"UNKNOWN")} · not accepted as verified zero without coverage proof.</span></article>`
      ].join("");
    }
  }

  async function renderProductProfitLedger(){
    const summary=$("#bs-product-profit-ledger-summary");
    const host=$("#bs-product-profit-ledger");
    if(!host)return;
    const ledger=window.BoomProductProfitLedger;
    if(!ledger?.snapshot){
      host.innerHTML='<div class="bs-empty bs-error">Product Profit Ledger adapter unavailable.</div>';
      return;
    }
    try{
      const snap=await ledger.snapshot();
      const expected=snap.expected||[];
      const realized=snap.realized||{};
      if(summary){
        summary.innerHTML=[
          metric(expected.length,"Verified expected rows"),
          metric(realized.real_finance_rows??0,"Real finance rows"),
          metric(realized.product_level_allocation?"YES":"NO","Realized product allocation"),
          metric("$"+Number(realized.realized_available_profit||0).toLocaleString(),"Mission-eligible realized profit")
        ].join("");
      }
      const expectedPreview=expected.slice(0,12);
      host.innerHTML=[
        `<article class="bs-profit-lane"><div class="bs-skill-head"><strong>EXPECTED PROFIT</strong><span class="bs-status DONE">VERIFIED UNIT ECONOMICS</span></div>
          <p>Calculated from inputs_verified unit economics. It can guide pricing/CAC decisions, but it does <b>not</b> count as realized profit.</p>
          <div class="bs-profit-ledger-rows">${expectedPreview.length?expectedPreview.map(row=>`<div><code>${esc(row.provider)} · ${esc(row.item_id)}</code><span>${esc(row.currency||"")} ${esc(row.contribution_before_coupon??"UNKNOWN")} contribution</span><small>${esc(row.profit_gate_status||"UNKNOWN")} · ${esc(row.destination_country||"GLOBAL")}</small></div>`).join(""):'<span class="bs-empty">No verified expected rows.</span>'}</div>
        </article>`,
        `<article class="bs-profit-lane"><div class="bs-skill-head"><strong>REALIZED PROFIT</strong><span class="bs-status ${realized.real_finance_rows?"DONE":"NEXT"}">${realized.real_finance_rows?"ORDER LEVEL":"NO REAL EVIDENCE"}</span></div>
          <p>Only non-test finance ledger evidence counts toward the $10K/hour mission. Product allocation stays blocked until auditable line-item allocation exists.</p>
          <div class="bs-profit-realized"><strong>${Number(realized.realized_available_profit||0).toLocaleString()}</strong><small>${esc(realized.reason||"UNKNOWN")}</small></div>
        </article>`
      ].join("");
    }catch(error){
      if(summary)summary.innerHTML="";
      host.innerHTML=`<div class="bs-empty bs-error">Profit evidence unavailable: ${esc(error?.message||"unknown")}. Mission profit remains UNKNOWN.</div>`;
    }
  }

  function renderProfitMission(){
    const p=data.profitEngine||{};
    const engine=window.BoomProfitEngine;
    const mission=$("#bs-profit-mission");
    const kpis=$("#bs-profit-kpis");
    const modules=$("#bs-profit-modules");
    const loop=$("#bs-profit-loop");
    const milestones=$("#bs-profit-milestones");
    const target=Number(p.mission?.target_net_profit_per_hour_usd||engine?.targetNetProfitPerHourUsd||10000);
    const current=engine?.evaluateHour?engine.evaluateHour({}):null;
    if(mission){
      mission.innerHTML=`<div><small>MISSION TARGET</small><strong>${target.toLocaleString()}+ <em>verified net profit / hour</em></strong>
        <p>${esc(p.mission?.rule||"Target is directional, not guaranteed.")}</p></div>
        <div class="bs-profit-state"><span>ACTUAL NOW</span><b>${current?.verified?"VERIFIED":"UNKNOWN"}</b><small>${esc(current?.status||"LIVE EVIDENCE NOT CONNECTED")}</small></div>`;
    }
    if(kpis){
      kpis.innerHTML=[
        metric("UNKNOWN","Verified Net Profit / Hour"),
        metric("$"+target.toLocaleString(),"Mission target / Hour"),
        metric("UNKNOWN","Target gap"),
        metric("UNKNOWN","Net Profit / Order"),
        metric("UNKNOWN","CAC"),
        metric("UNKNOWN","LTV")
      ].join("");
    }
    if(modules){
      modules.innerHTML=(p.modules||[]).map(x=>`<article class="bs-profit-card">
        <div class="bs-skill-head"><strong>${esc(x.id)}</strong><span class="bs-status ${x.owner_gate?"NEXT":"DONE"}">${x.owner_gate?"OWNER GATE":"ANALYZE"}</span></div>
        <small>${esc(x.owner)}</small><p>${esc(x.purpose)}</p>
        ${x.material_action?`<code>material: ${esc(x.material_action)}</code>`:""}
      </article>`).join("");
    }
    if(loop){
      loop.innerHTML=(p.hourly_loop||[]).map((x,i)=>`<article class="bs-journey"><h3>${i+1}. ${esc(x)}</h3></article>`).join("");
    }
    if(milestones){
      milestones.innerHTML=(p.milestone_policy?.sequence_usd_per_hour||[]).map(x=>`<span>${Number(x).toLocaleString()}/h</span>`).join("");
    }
  }

  function renderAIOperatingFactory(){
    const skills=data.operationalSkills||{};
    const templates=data.workflowTemplates||{};
    const router=data.aiRouter||{};
    const creative=data.creativeFactory||{};
    const buildRepair=data.buildRepairFactory||{};
    const summary=$("#bs-ai-factory-summary");
    if(summary){
      summary.innerHTML=[
        metric(skills.skills?.length||0,"Operational skills"),
        metric(templates.templates?.length||0,"Workflow templates"),
        metric(router.mode||"UNKNOWN","Router mode"),
        metric(creative.mode||"UNKNOWN","Creative factory"),
        metric(buildRepair.mode||"UNKNOWN","Build/repair")
      ].join("");
    }
    const skillHost=$("#bs-skills-library");
    if(skillHost){
      skillHost.innerHTML=(skills.skills||[]).map(x=>`<article class="bs-skill-card">
        <div class="bs-skill-head"><strong>${esc(x.title)}</strong><span class="bs-status ${x.material?"NEXT":"DONE"}">${x.material?"GATED":"READ-ONLY"}</span></div>
        <small>${esc(x.id)} · ${esc(x.owner)}</small>
        <p>${esc(x.purpose)}</p>
        <div class="bs-tags">${(x.tools||[]).map(t=>`<span>${esc(t)}</span>`).join("")}</div>
      </article>`).join("");
    }
    const tplHost=$("#bs-workflow-templates");
    if(tplHost){
      tplHost.innerHTML=(templates.templates||[]).map(x=>`<article class="bs-template-card">
        <div class="bs-skill-head"><strong>${esc(x.title)}</strong><span class="bs-status ${x.material?"NEXT":"DONE"}">${x.material?"OWNER GATE":"SAFE PLAN"}</span></div>
        <small>${esc(x.id)} · owner: ${esc(x.owner)}</small>
        <div class="bs-journey-steps">${(x.skills||[]).map(id=>`<span>${esc(id)}</span>`).join("")}</div>
        <button type="button" data-compile-template="${esc(x.id)}">Compile SHADOW Plan</button>
      </article>`).join("");
    }
    const routerHost=$("#bs-router-policy");
    if(routerHost){
      routerHost.innerHTML=`<p>${esc(router.purpose||"")}</p>
        <div class="bs-tags">${(router.dimensions||[]).map(d=>`<span>${esc(d.id)} ${esc(Math.round((Number(d.weight)||0)*100))}%</span>`).join("")}</div>
        <code>authority: ${esc(router.authority||"NONE")} · ${esc(router.mode||"PLAN_ONLY")}</code>`;
    }
    const creativeHost=$("#bs-creative-factory");
    if(creativeHost){
      creativeHost.innerHTML=`<div class="bs-journey-steps">${(creative.stages||[]).map(x=>`<span>${esc(x)}</span>`).join("")}</div>
        <p>${esc((creative.hard_rules||[]).join(" · "))}</p>`;
    }
    const repairHost=$("#bs-build-repair-factory");
    if(repairHost){
      repairHost.innerHTML=`<strong>Build</strong><div class="bs-journey-steps">${(buildRepair.build_flow||[]).map(x=>`<span>${esc(x)}</span>`).join("")}</div>
        <strong>Repair</strong><div class="bs-journey-steps">${(buildRepair.repair_flow||[]).map(x=>`<span>${esc(x)}</span>`).join("")}</div>
        <p>${esc((buildRepair.hard_rules||[]).join(" · "))}</p>`;
    }
  }

  async function compileTemplatePreview(templateId){
    const host=$("#bs-workflow-plan-preview");
    const builder=window.BoomWorkflowBuilder;
    if(!host)return;
    if(!builder?.compile){
      host.innerHTML='<span class="bs-error">Workflow Builder unavailable.</span>';
      return;
    }
    try{
      const plan=await builder.compile(templateId,{missionContext:{surface:"boom_brain_studio",preview:true}});
      if(!plan?.ok){
        host.innerHTML=`<span class="bs-error">Plan blocked: ${esc(plan?.reason||"unknown")}</span>`;
        return;
      }
      host.innerHTML=`<strong>${esc(plan.title)}</strong>
        <small>${esc(plan.workflow_plan_id)} · ${esc(plan.mode)} · dispatch: ${esc(plan.dispatch)}</small>
        <div class="bs-journey-steps">${(plan.ordered_skills||[]).map(x=>`<span>${esc(x.skill_id)} → ${esc(x.owner)}</span>`).join("")}</div>
        <p>tools: ${esc((plan.tool_dependencies||[]).join(" · ")||"none")} · gates: ${esc((plan.gates||[]).join(" · ")||"none")} · material suppressed: ${esc(plan.material_action_suppressed)}</p>`;
    }catch(error){
      host.innerHTML=`<span class="bs-error">Plan compile failed: ${esc(error?.message||"unknown")}</span>`;
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



  async function renderFreshShelfProductTruth(){
    const host=$("#bs-fresh-shelf-product-truth");
    const summary=$("#bs-fresh-shelf-summary");
    const state=$("#bs-fresh-shelf-state");
    if(!host)return;
    const truth=window.BoomFreshShelfProductTruth;
    if(!truth?.snapshot){
      host.innerHTML='<div class="bs-empty bs-error">Fresh Shelf Product Truth unavailable.</div>';
      if(state)state.textContent="UNAVAILABLE";
      return;
    }
    try{
      const report=await truth.snapshot({country:"IL",hours:24,provider:"CJdropshipping"});
      if(state)state.textContent=`${report.fresh_shelf_verified} FRESH · ${report.checkout_recheck_required} RECHECK · ${report.stale_or_unverified} STALE`;
      if(summary){
        summary.innerHTML=[
          metric(report.total_catalog,"CJ catalog rows"),
          metric(report.fresh_shelf_verified,"Fresh shelf verified · IL"),
          metric(report.checkout_recheck_required,"Checkout recheck required"),
          metric(report.checkout_live_verified,"Checkout live verified"),
          metric(report.stale_or_unverified,"Stale / unverified")
        ].join("");
      }
      const fresh=(report.rows||[]).filter(x=>x.fresh_shelf_verified).slice(0,12);
      host.innerHTML=fresh.length?fresh.map(x=>`<article>
        <small>${esc(x.category||"product")} · ${esc(x.provider||"")}</small>
        <strong>${esc(x.item_id||"")}</strong>
        <span>${esc(x.state)} · price ✓ · stock ✓ · shipping IL ✓</span>
        <span>market: ${esc(x.market_status||"unknown")} · newest: ${esc(x.evidence?.newest||"unknown")}</span>
      </article>`).join(""):'<div class="bs-empty">No fresh shelf-verified CJ products for IL in the selected window.</div>';
    }catch(error){
      if(summary)summary.innerHTML="";
      host.innerHTML=`<div class="bs-empty bs-error">Fresh product truth unavailable: ${esc(error?.message||"unknown")}</div>`;
      if(state)state.textContent="UNKNOWN";
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

  function renderMarketPolicyReadiness(){
    const host=$("#bs-market-policy-readiness");
    const state=$("#bs-market-policy-state");
    if(!host)return;
    const contract=data.marketPolicy||{};
    const evaluator=window.BoomMarketPolicyReadiness;
    if(!evaluator?.evaluate){
      host.innerHTML='<div class="bs-empty bs-error">Market Policy evaluator unavailable.</div>';
      if(state)state.textContent="UNAVAILABLE";
      return;
    }
    const global={
      business_identity_published:false,
      legal_registry_deployed:false,
      terms_published:false,
      privacy_published:false,
      returns_published:false,
      shipping_published:false,
      returns_address_ready:false,
      support_contact_ready:false,
      privacy_contact_ready:false,
      verified_shipping_promise_source:true,
      cancellation_return_flow_implemented:false
    };
    const markets=[
      {country:"IL",label:"Israel",key:"IL"},
      {country:"DE",label:"EU",key:"EU"},
      {country:"GB",label:"United Kingdom",key:"GB"},
      {country:"US",label:"United States",key:"US"},
      {country:"AU",label:"Australia",key:"AU"},
      {country:"CA",label:"Other / unmapped example",key:"UNMAPPED"}
    ];
    const results=markets.map(x=>({...x,result:evaluator.evaluate({country:x.country,global,market:{review_approved:false}})}));
    const ready=results.filter(x=>x.result.state==="READY_FOR_OWNER_REVIEW").length;
    const holds=results.filter(x=>String(x.result.state).startsWith("HOLD")).length;
    if(state)state.textContent=`${ready} READY · ${holds} HOLD · real money BLOCKED`;
    host.innerHTML=results.map(x=>{
      const baseline=contract.market_baselines?.[x.key]||null;
      const reqs=baseline?.requirements||[];
      return `<article class="bs-market-policy-card" data-state="${esc(x.result.state)}">
        <div class="bs-skill-head"><strong>${esc(x.label)}</strong><span class="bs-status NEXT">${esc(x.result.state)}</span></div>
        <p>First blocker: <b>${esc(x.result.blocker||"none")}</b></p>
        <div class="bs-route-gates">${Object.entries(x.result.checks||{}).slice(0,12).map(([k,v])=>`<span data-pass="${v===true?"1":"0"}">${v===true?"✓":"·"} ${esc(k)}</span>`).join("")}</div>
        <small>${baseline?esc(reqs.slice(0,3).join(" · ")):"Unmapped market: HOLD until consumer/privacy/tax/import/shipping review."}</small>
      </article>`;
    }).join("");
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
      const [brains,actions,inventory,surfaces,gaps,journeys,commerce,states,payplusProof,legal,merge,budgets,health,errors,reasons,storage,automation,operationalSkills,workflowTemplates,aiRouter,creativeFactory,buildRepairFactory,profitEngine,marketingProfitAttribution,marketingCostEvidence,payplusSandboxProof,checkoutOrderTrackingContract,marketPolicy,freshShelfProductTruth]=await Promise.all([
        json("boom-brain-registry.json"),json("boom-action-contract.json"),json("boom-interaction-inventory.json"),json("boom-surface-contract.json"),json("boom-brain-gaps.json"),json("boom-journey-contract.json"),json("boom-commerce-handoff-contract.json"),json("boom-payment-order-state-contract.json"),json("boom-payplus-proof-contract.json"),json("boom-legal-readiness-contract.json"),json("boom-guest-merge-matrix.json"),json("boom-mission-budget-contract.json"),json("boom-brain-health-policy.json"),json("boom-error-taxonomy.json"),json("boom-decision-reason-codes.json"),json("boom-storage-contract.json"),json("boom-automation-control-plane.json"),json("boom-operational-skills.json"),json("boom-workflow-templates.json"),json("boom-ai-tool-router.json"),json("boom-creative-factory-contract.json"),json("boom-build-repair-factory-contract.json"),json("boom-profit-engine-contract.json"),json("boom-marketing-profit-attribution-contract.json"),json("boom-marketing-cost-evidence-contract.json"),json("boom-payplus-sandbox-proof-contract.json"),json("boom-checkout-order-tracking-proof-contract.json"),json("boom-market-policy-readiness-contract.json"),json("boom-fresh-shelf-product-truth-contract.json")
      ]);
      data={brains,actions,inventory,surfaces,gaps,journeys,commerce,states,payplusProof,legal,merge,budgets,health,errors,reasons,storage,automation,operationalSkills,workflowTemplates,aiRouter,creativeFactory,buildRepairFactory,profitEngine,marketingProfitAttribution,marketingCostEvidence,payplusSandboxProof,checkoutOrderTrackingContract,marketPolicy,freshShelfProductTruth};
      $("#bs-contract-state").textContent=`${brains.version} · contracts loaded`;
      renderMetrics();renderReadiness();renderFlow();renderBrains();renderKernels();fillOwnerFilter();renderActions();renderSurfaces();renderGaps();renderAutomation();renderAIOperatingFactory();renderProfitMission();renderProductProfitLedger();renderHourlyProfitReview();renderFirstRealOrderProof();renderPayPlusSandboxProof();renderPaymentLaunchGate();renderCheckoutOrderTrackingProof();renderControlMaps();renderConsolidationMap();renderDomainWiring();renderStylistAcademy();renderHuntBrandDesign();renderCreativeLearning();renderDurableAutomation();renderFreshShelfProductTruth();renderShelfCoverage();renderGovernance();renderCommerceHandoff();renderOperationsState();renderLegalReadiness();renderMarketPolicyReadiness();renderJourneys();renderMerge();renderFiles();
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
  document.addEventListener("click",async event=>{
    const compileBtn=event.target.closest?.("[data-compile-template]");
    if(!compileBtn)return;
    await compileTemplatePreview(String(compileBtn.dataset.compileTemplate||""));
  });

  document.addEventListener("click",async event=>{
    const gateBtn=event.target.closest?.("[data-owner-gate-approve],[data-owner-gate-reject]");
    if(!gateBtn)return;
    const key=String(gateBtn.dataset.decisionKey||"");
    const approved=gateBtn.hasAttribute("data-owner-gate-approve");
    const ledger=window.BoomAutomationLedger;
    if(!key||!ledger?.decideProposal)return;
    try{
      await runtime?.runAction?.("boom.owner_gate.decide",{
        key,
        element:gateBtn,
        execute:()=>ledger.decideProposal(key,approved),
        announcePending:"Recording Owner Gate decision…",
        announceSuccess:approved?"SHADOW approval recorded. No material action executed.":"SHADOW decision rejected.",
        announceError:"Owner Gate decision could not be recorded.",
        successDetail:{approved,shadow:true,material_action_suppressed:true},
        errorDetail:error=>({error_code:runtime?.errorCode?.(error)||"ACTION_FAILED"}),
        broadcastSuccess:false,
        traceContext:{surface:"brain_studio",decision_owner:"OWNER",learning:"owner_gate"}
      });
      await renderDurableAutomation();
    }catch{}
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
