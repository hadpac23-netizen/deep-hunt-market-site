import fs from "fs";
import gate from "./boom-product-placement-gate.js";

const shelves=JSON.parse(fs.readFileSync("evidence/HUNT-FULL-SHELVES-STYLIST-SHADOW-2026-09-23.json","utf8"));
const products=[];
for(const dep of shelves.departments||[]){
  for(const cat of dep.categories||[]){
    for(const p of cat.products||[]){
      products.push({
        provider:p.provider,item_id:String(p.item_id),title:p.title||"",
        current_department:dep.slug,current_category:cat.slug,
        supplier_category:p.supplier_category||null,
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
const out={
  version:"HUNT-PRODUCT-PLACEMENT-GATE-AUDIT-V1",
  date:"2026-09-23",
  mode:"SHADOW_ALWAYS_ON",
  production_effect:false,
  source:"evidence/HUNT-FULL-SHELVES-STYLIST-SHADOW-2026-09-23.json",
  summary:report.summary,
  counts:{
    keep:keepRows.length,
    move_recommended:moveRows.length,
    review:reviewRows.length,
    unknown:unknownRows.length
  },
  top_current_error_rails:Object.entries(byCurrent).sort((a,b)=>b[1]-a[1]).slice(0,30).map(([rail,count])=>({rail,count})),
  top_target_rails:Object.entries(byTarget).sort((a,b)=>b[1]-a[1]).slice(0,30).map(([rail,count])=>({rail,count})),
  move_examples:moveRows.slice(0,200),
  review_examples:reviewRows.slice(0,100),
  unknown_examples:unknownRows.slice(0,100),
  rules:[
    "Current HUNT category is not used as positive evidence.",
    "MOVE is a shadow recommendation only; no catalog row is mutated.",
    "REVIEW/UNKNOWN never become shelf activation.",
    "Product Placement PASS is separate from stock/shipping/profit readiness."
  ]
};
fs.writeFileSync("evidence/HUNT-PRODUCT-PLACEMENT-GATE-AUDIT-2026-09-23.json",JSON.stringify(out,null,2)+"\n");
console.log(JSON.stringify({summary:out.summary,counts:out.counts,top_current_error_rails:out.top_current_error_rails.slice(0,15)},null,2));
