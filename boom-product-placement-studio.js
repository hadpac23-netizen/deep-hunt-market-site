(function(){
  const $=selector=>document.querySelector(selector);
  const esc=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const fetchJson=async path=>{
    const res=await fetch(path,{cache:"no-store"});
    if(!res.ok)throw new Error(path+" HTTP "+res.status);
    return res.json();
  };
  const metric=(value,label)=>'<article><strong>'+esc(value)+'</strong><span>'+esc(label)+'</span></article>';
  let refreshTimer=null;
  let adminWaitTimer=null;

  async function run(){
    const host=$("#bs-placement-watch");
    const summary=$("#bs-placement-summary");
    const state=$("#bs-placement-state");
    if(!host)return;
    const gate=window.BoomProductPlacementGate;
    if(!gate?.audit){
      host.innerHTML='<div class="bs-empty bs-error">Product Placement Gate unavailable.</div>';
      if(state)state.textContent="UNAVAILABLE";
      return;
    }
    try{
      const [contract,shelves]=await Promise.all([
        fetchJson("boom-product-placement-gate-contract.json"),
        fetchJson("evidence/HUNT-FULL-SHELVES-STYLIST-SHADOW-2026-09-23.json")
      ]);
      const products=[];
      for(const dep of shelves.departments||[]){
        for(const cat of dep.categories||[]){
          for(const product of cat.products||[]){
            products.push({
              provider:product.provider,
              item_id:String(product.item_id||""),
              title:product.title||"",
              supplier_category:product.supplier_category||null,
              source_evidence:product.source_evidence||null,
              current_department:dep.slug,
              current_category:cat.slug
            });
          }
        }
      }
      const report=gate.audit(products);
      const ps=report.summary||{};
      if(state)state.textContent="ALWAYS ON · SHADOW · "+String(ps.total||0)+" CHECKED";
      if(summary){
        summary.innerHTML=[
          metric(ps.KEEP||0,"KEEP · supported"),
          metric(ps.MOVE||0,"SAFE MOVE · candidate"),
          metric(ps.HOLD_REVIEW||0,"RULE / CONFLICT REVIEW · held"),
          metric(ps.HOLD_UNKNOWN||0,"UNKNOWN · held"),
          metric(contract.always_on_policy?.studio_refresh_seconds||60,"Refresh seconds")
        ].join("");
      }
      const moves=(report.rows||[]).filter(row=>row.placement?.placement_action==="MOVE");
      const reviews=(report.rows||[]).filter(row=>row.placement?.placement_action==="HOLD_REVIEW");
      const currentCounts=new Map();
      for(const row of moves){
        const key=row.current_department+"/"+row.current_category;
        currentCounts.set(key,(currentCounts.get(key)||0)+1);
      }
      const topRails=[...currentCounts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,8);
      const cards=[];
      cards.push('<article><small>ENFORCEMENT</small><strong>'+esc(contract.enforcement_point||"MANDATORY")+'</strong><span>Auto move: '+(contract.always_on_policy?.automatic_product_move?"ON":"OFF")+' · Production mutation: '+(contract.always_on_policy?.production_mutation?"ON":"OFF")+'</span></article>');
      if(topRails.length){
        const text=topRails.map(row=>row[0]+" ("+row[1]+")").join(" · ");
        cards.push('<article><small>TOP MIXED RAILS</small><strong>'+esc(text)+'</strong><span>SAFE MOVE candidates only · no automatic mutation · current category is never evidence.</span></article>');
      }
      for(const row of moves.slice(0,18)){
        const placement=row.placement||{};
        cards.push('<article><small>'+esc(row.provider||"")+' · '+esc(row.item_id||"")+'</small><strong>'+esc(row.title||"")+'</strong><span>'+esc(row.current_department)+'/'+esc(row.current_category)+' → '+esc(placement.canonical_department)+'/'+esc(placement.canonical_category)+'</span><span>'+esc(placement.detected_product_type||"type unknown")+' · confidence '+esc(Math.round((placement.confidence||0)*100))+'% · SAFE MOVE CANDIDATE · SHADOW ONLY</span></article>');
      }
      if(reviews.length){
        cards.push('<article><small>REVIEW QUEUE</small><strong>'+esc(reviews.length)+' explicit conflicts</strong><span>Held from automatic placement; requires better evidence or rule refinement.</span></article>');
      }
      host.innerHTML=cards.join("")||'<div class="bs-empty">No placement results.</div>';
      window.dispatchEvent(new CustomEvent("boom:placement-audit",{detail:{summary:ps,shadow:true}}));
    }catch(error){
      if(summary)summary.innerHTML="";
      host.innerHTML='<div class="bs-empty bs-error">Placement audit unavailable: '+esc(error?.message||"unknown error")+'</div>';
      if(state)state.textContent="UNKNOWN";
    }
  }

  function start(){
    if(adminWaitTimer)clearInterval(adminWaitTimer);
    adminWaitTimer=setInterval(()=>{
      if(document.body.dataset.adminReady!=="true")return;
      clearInterval(adminWaitTimer);
      adminWaitTimer=null;
      run();
      if(refreshTimer)clearInterval(refreshTimer);
      refreshTimer=setInterval(run,60000);
    },500);
  }

  window.BoomProductPlacementStudio={runNow:run,start};
  start();
})();
