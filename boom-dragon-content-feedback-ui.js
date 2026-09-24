(() => {
  "use strict";
  const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  let current=null;
  const read=()=>current||window.DRAGON_CONTENT_FEEDBACK_STATE||null;
  function label(s=read()){
    if(!s)return "CONTENT PREP";
    if(s.status==="BLOCKED")return "CONTENT BLOCKED";
    if(s.readiness?.winner_eligible===true)return "LEARNING READY";
    return "CONTENT PREP";
  }
  function tone(s=read()){return s?.readiness?.winner_eligible===true?"ready":"prep"}
  function card(){
    const s=read(),c=s?.counts||{},r=s?.readiness||{};
    if(!s)return '<section class="dc-info dc-content-feedback-card" data-content-feedback-card><small>CONTENT FEEDBACK LOOP</small><p>Loading content evidence…</p></section>';
    return '<section class="dc-info dc-content-feedback-card" data-content-feedback-card>'+
      '<small>CONTENT FEEDBACK LOOP</small>'+
      '<p><b>'+esc(label(s))+'</b> · Creative → Distribution → Attribution → Profit → Learning</p>'+
      '<div class="dc-feedback-flow">'+
        '<span><b>'+esc(c.creative_drafts??0)+'</b>Creative</span><i>→</i>'+
        '<span><b>'+esc(c.distribution_published??0)+'</b>Published</span><i>→</i>'+
        '<span><b>'+esc(c.attribution_contexts??0)+'</b>Attributed</span><i>→</i>'+
        '<span><b>'+esc(c.confirmed_attributed_purchases??0)+'</b>Purchase</span><i>→</i>'+
        '<span><b>'+esc(c.settled_profit_orders??0)+'</b>Profit</span>'+
      '</div>'+
      '<p>Creative identity: '+(r.creative_identity_ready?"READY":"PREP")+
      ' · Attribution: '+(r.attribution_ready?"READY":"PREP")+
      ' · Profit: '+(r.profit_ready?"READY":"PREP")+'</p>'+
      '<p class="dc-feedback-note">Winner eligible: <strong>'+(r.winner_eligible?"YES":"NO")+'</strong>. Revenue/clicks alone can never create a winner.</p>'+
      '<ul>'+(s.blockers||[]).slice(0,6).map(x=>"<li>"+esc(x)+"</li>").join("")+'</ul>'+
    '</section>';
  }
  function injectInspector(){
    const inspector=document.querySelector("#dragon-core-inspector.open");
    if(!inspector)return;
    const title=inspector.querySelector("h2")?.textContent?.trim();
    if(!["BOOM Stylist","F60T","Decisions","Customers","Profit"].includes(title))return;
    inspector.querySelector("[data-content-feedback-card]")?.remove();
    const status=Array.from(inspector.querySelectorAll(".dc-info")).find(x=>x.querySelector("small")?.textContent==="STATUS");
    if(status)status.insertAdjacentHTML("beforebegin",card());else inspector.insertAdjacentHTML("beforeend",card());
  }
  function right(){
    const s=read(),c=s?.counts||{},r=s?.readiness||{};
    return '<section class="dc-status-card dc-content-feedback-summary" data-content-feedback-summary>'+
      '<span class="dc-chip '+tone(s)+'">'+esc(label(s))+'</span>'+
      '<small>CONTENT → PROFIT → LEARNING</small>'+
      '<h3>Creative feedback truth</h3>'+
      '<div class="dc-stat-grid"><div><strong>'+esc(c.creative_drafts??0)+'</strong><span>Creative</span></div><div><strong>'+esc(c.distribution_published??0)+'</strong><span>Published</span></div><div><strong>'+esc(c.confirmed_attributed_purchases??0)+'</strong><span>Confirmed</span></div></div>'+
      '<p>Winner '+(r.winner_eligible?"eligible":"PREP")+' · Settled profit '+esc(c.settled_profit_orders??0)+'</p>'+
    '</section>';
  }
  function injectRight(){
    const panel=document.querySelector("#dragon-core-right-panel");if(!panel)return;
    panel.querySelector("[data-content-feedback-summary]")?.remove();
    panel.insertAdjacentHTML("afterbegin",right());
  }
  function paint(){injectInspector();injectRight();}
  window.addEventListener("dragon:content-feedback",e=>{current=e.detail||null;setTimeout(paint,0)});
  document.addEventListener("click",event=>{
    if(event.target.closest('[data-dc-node="stylist"],[data-dc-node="f60t"],[data-dc-node="decisions"],[data-dc-node="customers"],[data-dc-node="profit"],[data-dc-right-tab]'))setTimeout(paint,0);
  });
  const observer=new MutationObserver(()=>{const panel=document.querySelector("#dragon-core-right-panel");if(panel&&!panel.querySelector("[data-content-feedback-summary]"))injectRight()});
  function init(){const panel=document.querySelector("#dragon-core-right-panel");if(panel)observer.observe(panel,{childList:true});paint();setTimeout(paint,250);setTimeout(paint,1100)}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
  window.DRAGON_CONTENT_FEEDBACK_UI=Object.freeze({paint,label,tone});
})();