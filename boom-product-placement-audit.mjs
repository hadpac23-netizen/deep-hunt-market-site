import fs from "fs";
import gate from "./boom-product-placement-gate.js";

const shelves=JSON.parse(fs.readFileSync("evidence/HUNT-FULL-SHELVES-STYLIST-SHADOW-2026-09-23.json","utf8"));
const TAXONOMY_REFRESH="evidence/HUNT-EPROLO-PLACEMENT-TAXONOMY-REFRESH-2026-09-23.json";
const taxonomy=fs.existsSync(TAXONOMY_REFRESH)?JSON.parse(fs.readFileSync(TAXONOMY_REFRESH,"utf8")):{verified:[]};
const taxonomyKeep=new Map((taxonomy.verified||[]).map(x=>[x.provider+":"+String(x.item_id),x]));
const DETAIL_TAXONOMY="evidence/HUNT-EPROLO-DETAIL-TAXONOMY-STAGE5-2026-09-23.json";
const detailTaxonomy=fs.existsSync(DETAIL_TAXONOMY)?JSON.parse(fs.readFileSync(DETAIL_TAXONOMY,"utf8")):{results:[]};
const taxonomyConflict=new Map((detailTaxonomy.results||[])
  .filter(x=>x.state==="SUPPLIER_TAXONOMY_CONFLICT_CURRENT_RAIL")
  .map(x=>["EPROLO:"+String(x.item_id),x]));
const products=[];
for(const dep of shelves.departments||[]){
  for(const cat of dep.categories||[]){
    for(const p of cat.products||[]){
      const key=p.provider+":"+String(p.item_id);
      const tx=taxonomyKeep.get(key);
      const conflict=taxonomyConflict.get(key);
      products.push({
        provider:p.provider,item_id:String(p.item_id),title:p.title||"",
        current_department:dep.slug,current_category:cat.slug,
        supplier_category:p.supplier_category||null,
        supplier_category_id:tx?.supplier_category_id||conflict?.supplier_category_id||null,
        supplier_taxonomy_current_rail_verified:!!(tx&&tx.current_rail===dep.slug+"/"+cat.slug),
        supplier_taxonomy_conflict_current_rail:!!(conflict&&conflict.current_rail===dep.slug+"/"+cat.slug),
        supplier_taxonomy_suggested_rail:Array.isArray(conflict?.suggested_rail)?conflict.suggested_rail[0]:(conflict?.suggested_rail||null),
        source_evidence:p.source_evidence||null
      });
    }
  }
}
const report=gate.audit(products);
const moveRows=report.rows.filter(x=>x.placement.placement_action==="MOVE");
const reviewRows=report.rows.filter(x=>x.placement.placement_action==="HOLD_REVIEW");
const unknownRows=report.rows.filter(x=>x.placement.placement_action==="HOLD_UNKNOWN");
const keepRows=report.rows.filter(x=>x.placement.placement_action==="KEEP");
const byCurrent={};
for(const x of moveRows){
  const k=x.current_department+"/"+x.current_category;
  byCurrent[k]=(byCurrent[k]||0)+1;
}
const byTarget={};
for(const x of moveRows){
  const k=x.placement.canonical_department+"/"+x.placement.canonical_category;
  byTarget[k]=(byTarget[k]||0)+1;
}
const reasonCounts={};
for(const row of report.rows||[])for(const code of row.placement?.reason_codes||[])reasonCounts[code]=(reasonCounts[code]||0)+1;
const reviewByReason={};
for(const row of reviewRows){
  const key=(row.placement?.reason_codes||[]).join("|")||"UNSPECIFIED";
  reviewByReason[key]=(reviewByReason[key]||0)+1;
}
const out={
  version:"HUNT-PRODUCT-PLACEMENT-GATE-AUDIT-V1.1-TRIAGE",
  date:"2026-09-23",
  mode:"SHADOW_ALWAYS_ON",
  production_effect:false,
  source:"evidence/HUNT-FULL-SHELVES-STYLIST-SHADOW-2026-09-23.json",
  supplier_taxonomy_evidence:fs.existsSync(TAXONOMY_REFRESH)?TAXONOMY_REFRESH:null,
  summary:report.summary,
  counts:{
    keep:keepRows.length,
    safe_move_candidates:moveRows.length,
    rule_or_conflict_review:reviewRows.length,
    unknown_hold:unknownRows.length
  },
  triage:{
    safe_move_candidates:moveRows.length,
    rule_or_conflict_review:reviewRows.length,
    unknown_hold:unknownRows.length,
    auto_move_enabled:false,
    production_mutation:false,
    reason_counts:reasonCounts,
    review_reason_counts:reviewByReason
  },
  top_current_error_rails:Object.entries(byCurrent).sort((a,b)=>b[1]-a[1]).slice(0,30).map(([rail,count])=>({rail,count})),
  top_target_rails:Object.entries(byTarget).sort((a,b)=>b[1]-a[1]).slice(0,30).map(([rail,count])=>({rail,count})),
  safe_move_candidates:moveRows,
  review_queue:reviewRows,
  unknown_queue:unknownRows,
  rules:[
    "Current HUNT category is not used as positive evidence.",
    "SAFE_MOVE_CANDIDATE is a shadow recommendation only; no catalog row is mutated.",
    "REVIEW/UNKNOWN never become shelf activation.",
    "Product Placement PASS is separate from stock/shipping/profit readiness."
  ]
};
fs.writeFileSync("evidence/HUNT-PRODUCT-PLACEMENT-GATE-AUDIT-2026-09-23.json",JSON.stringify(out,null,2)+"\n");
console.log(JSON.stringify({summary:out.summary,counts:out.counts,top_current_error_rails:out.top_current_error_rails.slice(0,15)},null,2));
