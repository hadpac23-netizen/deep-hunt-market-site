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
      const [contract,shelves,taxonomy,detailTaxonomy,stage4Queue,stage6Evidence,stage6Preview,stage7Empty,stage7Thin,stage7Final,stage7Manifest,stage8Shortlist,stage8Shipping,stage8Gate,stage8Selection,stage8Preview,judge]=await Promise.all([
        fetchJson("boom-product-placement-gate-contract.json"),
        fetchJson("evidence/HUNT-FULL-SHELVES-STYLIST-SHADOW-2026-09-23.json"),
        fetchJson("evidence/HUNT-EPROLO-PLACEMENT-TAXONOMY-REFRESH-2026-09-23.json").catch(()=>({verified:[],summary:{}})),
        fetchJson("evidence/HUNT-EPROLO-DETAIL-TAXONOMY-STAGE5-2026-09-23.json").catch(()=>({results:[],summary:{states:{}}})),
        fetchJson("evidence/HUNT-PRODUCT-PLACEMENT-STAGE4-QUEUE-2026-09-23.json").catch(()=>({summary:{},top_unknown_rails:[]})),
        fetchJson("evidence/HUNT-PRODUCT-PLACEMENT-STAGE6-OVERLAP-RESOLUTION-2026-09-23.json").catch(()=>({summary:{states:{}},results:[]})),
        fetchJson("evidence/HUNT-PRODUCT-PLACEMENT-STAGE6-REBUILD-PREVIEW-2026-09-23.json").catch(()=>({summary:{}})),
        fetchJson("evidence/HUNT-PRODUCT-PLACEMENT-STAGE7-EMPTY-RECOVERY-2026-09-23.json").catch(()=>({summary:{}})),
        fetchJson("evidence/HUNT-PRODUCT-PLACEMENT-STAGE7-THIN-RECOVERY-2026-09-23.json").catch(()=>({summary:{}})),
        fetchJson("evidence/HUNT-PRODUCT-PLACEMENT-STAGE7-FINAL-PREVIEW-2026-09-23.json").catch(()=>({summary:{}})),
        fetchJson("evidence/HUNT-PRODUCT-PLACEMENT-STAGE7-SOURCING-MANIFEST-2026-09-23.json").catch(()=>({summary:{},rails:[]})),
        fetchJson("evidence/HUNT-PRODUCT-PLACEMENT-STAGE8-P0-QA-SHORTLIST-V2-2026-09-23.json").catch(()=>({summary:{}})),
        fetchJson("evidence/HUNT-PRODUCT-PLACEMENT-STAGE8-P0-SHIPPING-VERIFY-2026-09-23.json").catch(()=>({summary:{}})),
        fetchJson("evidence/HUNT-PRODUCT-PLACEMENT-STAGE8-P0-MEDIA-PROFIT-GATE-2026-09-23.json").catch(()=>({summary:{}})),
        fetchJson("evidence/HUNT-PRODUCT-PLACEMENT-STAGE8-P0-SELECTION-2026-09-23.json").catch(()=>({summary:{}})),
        fetchJson("evidence/HUNT-PRODUCT-PLACEMENT-STAGE8-P0-PREVIEW-2026-09-23.json").catch(()=>({summary:{}})),
        fetchJson("evidence/HUNT-PRODUCT-PLACEMENT-LOCAL-JUDGE-2026-09-23.json").catch(()=>({summary:{},calibration:{},proposals:[]}))
      ]);
      const taxonomyKeep=new Map((taxonomy.verified||[]).map(x=>[x.provider+":"+String(x.item_id),x]));
      const taxonomyConflict=new Map((detailTaxonomy.results||[]).filter(x=>x.state==="SUPPLIER_TAXONOMY_CONFLICT_CURRENT_RAIL").map(x=>["EPROLO:"+String(x.item_id),x]));
      const products=[];
      for(const dep of shelves.departments||[]){
        for(const cat of dep.categories||[]){
          for(const product of cat.products||[]){
            const key=product.provider+":"+String(product.item_id||"");
            const tx=taxonomyKeep.get(key);
            const conflict=taxonomyConflict.get(key);
            products.push({
              provider:product.provider,
              item_id:String(product.item_id||""),
              title:product.title||"",
              supplier_category:product.supplier_category||null,
              supplier_category_id:tx?.supplier_category_id||conflict?.supplier_category_id||null,
              supplier_taxonomy_current_rail_verified:!!(tx&&tx.current_rail===dep.slug+"/"+cat.slug),
              supplier_taxonomy_conflict_current_rail:!!(conflict&&conflict.current_rail===dep.slug+"/"+cat.slug),
              supplier_taxonomy_suggested_rail:Array.isArray(conflict?.suggested_rail)?conflict.suggested_rail[0]:(conflict?.suggested_rail||null),
              source_evidence:product.source_evidence||null,
              current_department:dep.slug,
              current_category:cat.slug,
              current_rail:dep.slug+"/"+cat.slug
            });
          }
        }
      }
      const report=gate.audit(products);
      const overlapGate=window.BoomProductPlacementOverlapGate;
      const stage6Map=new Map((stage6Evidence.results||[]).map(x=>[x.provider+":"+String(x.item_id),x]));
      const overlapInputs=products.map(product=>{
        const ev=stage6Map.get(product.provider+":"+String(product.item_id));
        if(!ev)return null;
        return {...product,supplier_category_id:ev.supplier_category_id||null};
      }).filter(Boolean);
      const overlapReport=overlapGate?.audit?overlapGate.audit(overlapInputs):{summary:{}};
      const s6Runtime=overlapReport.summary||{};
      const s6=(s6Runtime.total||0)>0?s6Runtime:(stage6Evidence.summary?.states||{});
      const ps=report.summary||{};
      if(state)state.textContent="ALWAYS ON · SHADOW · "+String(ps.total||0)+" CHECKED";
      if(summary){
        summary.innerHTML=[
          metric(ps.KEEP||0,"KEEP · supported"),
          metric(ps.MOVE||0,"SAFE MOVE · candidate"),
          metric(ps.HOLD_REVIEW||0,"RULE / CONFLICT REVIEW · held"),
          metric(ps.HOLD_UNKNOWN||0,"UNKNOWN · held"),
          metric(taxonomy.summary?.taxonomy_verified_keep_support||0,"Supplier taxonomy KEEP support"),
          metric(detailTaxonomy.summary?.states?.SUPPLIER_TAXONOMY_CONFLICT_CURRENT_RAIL||0,"Supplier taxonomy conflicts · REVIEW"),
          metric(s6.SAFE_MOVE_CANDIDATE||0,"Stage6 SAFE MOVE · shadow"),
          metric(s6.REVIEW||0,"Stage6 overlap REVIEW"),
          metric(stage7Final.summary?.total_stage7_recovered||0,"Stage7 recovered"),
          metric(stage7Manifest.summary?.empty_rails||0,"Stage7 empty gaps"),
          metric(stage8Gate.summary?.stage8_gate_pass||0,"Stage8 gate PASS"),
          metric(stage8Selection.summary?.selected_products||0,"Stage8 selected"),
          metric(stage8Preview.summary?.rails_empty||0,"Stage8 empty gaps"),
          metric(judge.summary?.review_proposals||0,"Local Judge · REVIEW only"),
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
      cards.push('<article><small>SUPPLIER TAXONOMY</small><strong>'+esc(taxonomy.summary?.taxonomy_verified_keep_support||0)+' verified KEEP supports</strong><span>Official EPROLO read-only taxonomy · KEEP support only · never auto-MOVE.</span></article>');
      cards.push('<article><small>SUPPLIER TAXONOMY CONFLICTS</small><strong>'+esc(detailTaxonomy.summary?.states?.SUPPLIER_TAXONOMY_CONFLICT_CURRENT_RAIL||0)+' REVIEW-only conflicts</strong><span>Exact supplier taxonomy disagrees with the current rail. Conflict overrides title PASS and cannot auto-MOVE.</span></article>');
      cards.push('<article><small>STAGE 6 · OVERLAP RESOLUTION</small><strong>'+esc((s6.KEEP||0)+' KEEP · '+(s6.SAFE_MOVE_CANDIDATE||0)+' SAFE MOVE · '+(s6.REVIEW||0)+' REVIEW · '+(s6.UNKNOWN||0)+' UNKNOWN')+'</strong><span>Runs every Studio refresh on Gift Decor, Drinkware, Electrical Lighting, Beauty Tools, Sports/Fitness and Pet Accessories. Feature words cannot override primary product family.</span></article>');
      cards.push('<article><small>STAGE 6 · CLEAN REBUILD PREVIEW</small><strong>'+esc(stage6Preview.summary?.canonical_products||0)+' canonical products · '+esc(stage6Preview.summary?.rails_empty||0)+' empty rails</strong><span>Shadow preview only · '+esc(stage6Preview.summary?.rails_full_24||0)+' FULL · '+esc(stage6Preview.summary?.rails_good_12_to_23||0)+' GOOD · '+esc(stage6Preview.summary?.rails_thin_1_to_11||0)+' THIN. Profit Gate comes after placement truth.</span></article>');
      cards.push('<article><small>STAGE 7 · EMPTY/THIN RECOVERY</small><strong>'+esc((stage7Empty.summary?.keep_recoverable||0)+' empty KEEP · '+(stage7Thin.summary?.keep_recoverable||0)+' thin KEEP · '+(stage7Final.summary?.total_stage7_recovered||0)+' total recovered')+'</strong><span>Evidence recovery before sourcing · REVIEW/UNKNOWN remain quarantined · no Production mutation.</span></article>');
      cards.push('<article><small>STAGE 7 · FINAL CLEAN PREVIEW</small><strong>'+esc(stage7Final.summary?.canonical_products||0)+' canonical · '+esc(stage7Final.summary?.rails_full_24||0)+' FULL · '+esc(stage7Final.summary?.rails_good_12_to_23||0)+' GOOD · '+esc(stage7Final.summary?.rails_thin_1_to_11||0)+' THIN · '+esc(stage7Final.summary?.rails_empty||0)+' EMPTY</strong><span>Recovery only. No newly sourced inventory is counted here.</span></article>');
      cards.push('<article><small>STAGE 7 · SOURCING MANIFEST</small><strong>'+esc(stage7Manifest.summary?.empty_rails||0)+' EMPTY · '+esc(stage7Manifest.summary?.thin_rails||0)+' THIN · '+esc(stage7Manifest.summary?.new_source_required||0)+' NEW SOURCE · '+esc(stage7Manifest.summary?.evidence_blocked||0)+' EVIDENCE FIRST · '+esc(stage7Manifest.summary?.source_misplaced_or_unsupported||0)+' MISPLACED SOURCE</strong><span>Gap to GOOD: '+esc(stage7Manifest.summary?.total_gap_to_good||0)+' · Gap to FULL: '+esc(stage7Manifest.summary?.total_gap_to_24||0)+' · every new candidate must pass Placement → Quality → Stock/Shipping → Profit before shelf admission.</span></article>');
      cards.push('<article><small>STAGE 8 · SUPPLIER RECOVERY GATE</small><strong>'+esc((stage8Shortlist.summary?.shortlisted_candidates||0)+' shortlist · '+(stage8Shipping.summary?.verified_4_of_4||0)+' shipping 4/4 · '+(stage8Gate.summary?.stage8_gate_pass||0)+' gate PASS · '+(stage8Selection.summary?.selected_products||0)+' selected')+'</strong><span>Official supplier data only · strict primary type · media technical QA · Price Gate V2.1 · Final Net Profit Verified: '+esc(stage8Gate.summary?.final_net_profit_verified_products||0)+'.</span></article>');
      cards.push('<article><small>STAGE 8 · P0 CLEAN PREVIEW</small><strong>'+esc(stage8Preview.summary?.canonical_products||0)+' canonical · '+esc(stage8Preview.summary?.rails_full_24||0)+' FULL · '+esc(stage8Preview.summary?.rails_good_12_to_23||0)+' GOOD · '+esc(stage8Preview.summary?.rails_thin_1_to_11||0)+' THIN · '+esc(stage8Preview.summary?.rails_empty||0)+' EMPTY</strong><span>41 selected products are Shadow only. Semantic visual-quality review and Final Profit Truth remain separate gates; Production is unchanged.</span></article>');
      const precision=judge.calibration?.selected_threshold?.precision;
      cards.push('<article><small>LOCAL REVIEW JUDGE</small><strong>'+esc(judge.summary?.review_proposals||0)+' guarded review proposals</strong><span>Cross-rail: '+esc(judge.summary?.cross_rail_review_candidates||0)+' · Guard blocked: '+esc(judge.summary?.guard_blocked_proposals||0)+' · Holdout precision: '+esc(precision!=null?(precision*100).toFixed(2)+'%':'UNKNOWN')+' · Authority: NONE.</span></article>');
      for(const proposal of (judge.proposals||[]).filter(x=>x.effect==="CROSS_RAIL_REVIEW_CANDIDATE").slice(0,8)){
        cards.push('<article><small>JUDGE REVIEW · '+esc(proposal.provider||"")+' · '+esc(proposal.item_id||"")+'</small><strong>'+esc(proposal.title||"")+'</strong><span>'+esc(proposal.current_rail)+' ⇢ '+esc(proposal.proposed_rail)+'</span><span>REVIEW ONLY · no PASS/MOVE authority · best similarity '+esc(proposal.judge_confidence_basis?.best_similarity??"")+'</span></article>');
      }
      if(topRails.length){
        const text=topRails.map(row=>row[0]+" ("+row[1]+")").join(" · ");
        cards.push('<article><small>TOP MIXED RAILS</small><strong>'+esc(text)+'</strong><span>SAFE MOVE candidates only · no automatic mutation · current category is never evidence.</span></article>');
      }
      const routes=stage4Queue.summary?.primary_routes||{};
      const routeText=Object.entries(routes).sort((a,b)=>b[1]-a[1]).map(([route,count])=>route+" ("+count+")").join(" · ");
      if(routeText){
        cards.push('<article><small>UNKNOWN RESOLUTION ROUTES</small><strong>'+esc(routeText)+'</strong><span>Evidence ladder: supplier taxonomy / metadata first; visual evidence is secondary only and cannot move a product by itself.</span></article>');
      }
      const unknownRails=(stage4Queue.top_unknown_rails||stage4Queue.summary?.top_unknown_rails||[]).slice(0,8);
      if(unknownRails.length){
        cards.push('<article><small>TOP UNKNOWN RAILS</small><strong>'+esc(unknownRails.map(x=>x.rail+" ("+x.count+")").join(" · "))+'</strong><span>Prioritized for Stage 4 evidence refresh; no forced placement.</span></article>');
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
