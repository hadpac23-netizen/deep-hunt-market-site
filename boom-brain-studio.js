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
      metric(phase1,"Phase-1 surfaces")
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
  function renderJourneys(){
    const host=$("#bs-journeys");
    if(!host)return;
    host.innerHTML=data.journeys.journeys.map(j=>`<article class="bs-journey"><h3>${esc(j.id)}</h3><p>${esc(j.goal)}</p><div class="bs-journey-steps">${j.steps.map(step=>`<span>${esc(step.kind)}: ${esc(step.ref)}${step.optional?" · optional":""}</span>`).join("")}</div></article>`).join("");
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
      return `<article class="bs-trace"><time>${esc(time)}</time><code>${esc(t.action_id)}</code><span class="bs-trace-state ${esc(state)}">${esc(state)}</span><small>${esc(t.correlation_id||"")}</small></article>`;
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
  async function boot(){
    try{
      const [brains,actions,inventory,surfaces,gaps,journeys,merge]=await Promise.all([
        json("boom-brain-registry.json"),json("boom-action-contract.json"),json("boom-interaction-inventory.json"),json("boom-surface-contract.json"),json("boom-brain-gaps.json"),json("boom-journey-contract.json"),json("boom-guest-merge-matrix.json")
      ]);
      data={brains,actions,inventory,surfaces,gaps,journeys,merge};
      $("#bs-contract-state").textContent=`${brains.version} · contracts loaded`;
      renderMetrics();renderFlow();renderBrains();renderKernels();fillOwnerFilter();renderActions();renderSurfaces();renderGaps();renderJourneys();renderMerge();renderFiles();
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
