(() => {
  "use strict";
  const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  let current=null;
  const read=()=>current||window.DRAGON_DECISION_STATE||null;
  function tone(card=read()){
    const s=String(card?.status||"").toUpperCase();
    if(s==="READY")return "ready";
    if(s==="HOLD")return "hold";
    return "prep";
  }
  function label(card=read()){
    if(!card)return "DECISION PREP";
    return String(card.status||"TEST").toUpperCase()+" · "+String(card.readiness_score??"—")+"/100";
  }
  function badge(){
    const node=document.querySelector('[data-dc-node="decisions"]');if(!node)return;
    let el=node.querySelector(".dc-decision-badge");
    if(!el){el=document.createElement("span");el.className="dc-decision-badge";node.appendChild(el);}
    el.className="dc-decision-badge "+tone();
    el.textContent=label();
  }
  function dimensionRows(card){
    const d=card?.dimensions||{};
    const rows=[
      ["Product Truth",d.product_truth,20],
      ["Customer Truth",d.customer_truth,20],
      ["Profit Truth",d.profit_truth,20],
      ["Content Learning",d.content_learning,15],
      ["Launch Readiness",d.launch_readiness,25]
    ];
    return rows.map(([name,value,max])=>
      '<div class="dc-decision-dimension"><span>'+esc(name)+'</span><b>'+esc(value??0)+'/'+max+'</b></div>'
    ).join("");
  }
  function cardHtml(){
    const c=read();
    if(!c)return '<section class="dc-info dc-decision-card" data-decision-card><small>DRAGON DECISION ENGINE</small><p>Evaluating evidence…</p></section>';
    return '<section class="dc-info dc-decision-card" data-decision-card>'+
      '<small>DRAGON DECISION ENGINE · SHADOW</small>'+
      '<div class="dc-decision-score"><strong>'+esc(c.readiness_score)+'</strong><span>/100<br>READINESS</span></div>'+
      '<h3>'+esc(c.status)+' · Risk '+esc(c.risk)+'</h3>'+
      '<p>Confidence <b>'+esc(c.confidence)+'% · '+esc(c.confidence_label)+'</b>. Score and confidence are intentionally separate.</p>'+
      (c.evidence_refresh
        ? '<p class="dc-decision-refresh"><b>EVIDENCE REFRESH</b><br>Observed '+esc(c.evidence_refresh.observed_at||"—")+
          ' · Confidence support +'+esc(c.evidence_refresh.confidence_support||0)+
          ' · Product source '+(c.evidence_refresh.product_source_stale?"STALE":"CURRENT")+
          ' · Journey source '+(c.evidence_refresh.journey_source_stale?"STALE":"CURRENT")+
          ' · Security '+esc(c.evidence_refresh.security_status||"UNKNOWN")+'</p>'
        : '')+
      '<div class="dc-decision-dimensions">'+dimensionRows(c)+'</div>'+
      '<p class="dc-decision-next"><b>NEXT SAFE ACTION</b><br>'+esc(c.next_action?.text||"No action")+'</p>'+
      '<p>Owner Gate: <b>'+(c.owner_gate_required?"REQUIRED":"Not required for this preparation step")+'</b> · Execution: '+esc(c.execution_mode)+'</p>'+
      '<div class="dc-decision-unknowns"><b>Unknowns</b><ul>'+(c.unknowns?.length?c.unknowns.map(x=>"<li>"+esc(x)+"</li>").join(""):"<li>None</li>")+'</ul></div>'+
      (c.hard_gates?.blockers?.length
        ? '<div class="dc-decision-hard"><b>HARD GATES</b><ul>'+c.hard_gates.blockers.map(x=>"<li>"+esc(x.gate_key)+" · "+esc(x.status)+" — "+esc(x.title)+"</li>").join("")+'</ul></div>'
        : '')+
    '</section>';
  }
  function injectInspector(){
    const inspector=document.querySelector("#dragon-core-inspector.open");
    if(!inspector||inspector.querySelector("h2")?.textContent?.trim()!=="Decisions")return;
    inspector.querySelector("[data-decision-card]")?.remove();
    const status=Array.from(inspector.querySelectorAll(".dc-info")).find(x=>x.querySelector("small")?.textContent==="STATUS");
    if(status)status.insertAdjacentHTML("beforebegin",cardHtml()); else inspector.insertAdjacentHTML("beforeend",cardHtml());
  }
  function right(){
    const c=read();
    return '<section class="dc-status-card dc-decision-summary" data-decision-summary>'+
      '<span class="dc-chip '+tone(c)+'">'+esc(label(c))+'</span>'+
      '<small>DECISION ENGINE</small>'+
      '<h3>Score + Confidence + Evidence + Risk</h3>'+
      '<p>'+(c
        ? 'Confidence '+esc(c.confidence)+'% · Risk '+esc(c.risk)+' · '+esc(c.execution_mode)
        : 'Waiting for truth layers…')+'</p>'+
      (c?.evidence_refresh
        ? '<p>Evidence observed now · source staleness remains authoritative.</p>'
        : '')+
      '<p>Next: '+esc(c?.next_action?.text||"Load evidence")+'</p>'+
    '</section>';
  }
  function injectRight(){
    const panel=document.querySelector("#dragon-core-right-panel");if(!panel)return;
    panel.querySelector("[data-decision-summary]")?.remove();
    panel.insertAdjacentHTML("afterbegin",right());
  }
  function paint(){badge();injectInspector();injectRight();}
  window.addEventListener("dragon:decision",e=>{current=e.detail||null;setTimeout(paint,0)});
  document.addEventListener("click",e=>{
    if(e.target.closest('[data-dc-node="decisions"],[data-dc-nav-node="decisions"],[data-dc-right-node="decisions"],[data-dc-right-tab]'))setTimeout(paint,0);
  });
  const observer=new MutationObserver(()=>{const panel=document.querySelector("#dragon-core-right-panel");if(panel&&!panel.querySelector("[data-decision-summary]"))injectRight()});
  function init(){const panel=document.querySelector("#dragon-core-right-panel");if(panel)observer.observe(panel,{childList:true});paint();setTimeout(paint,500);setTimeout(paint,1300);}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
  window.DRAGON_DECISION_UI=Object.freeze({paint,label,tone});
})();