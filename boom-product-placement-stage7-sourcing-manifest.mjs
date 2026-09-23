import fs from "fs";
const FINAL="evidence/HUNT-PRODUCT-PLACEMENT-STAGE7-FINAL-PREVIEW-2026-09-23.json";
const GAP="evidence/HUNT-PRODUCT-PLACEMENT-STAGE7-GAP-MAP-2026-09-23.json";
const OUT="evidence/HUNT-PRODUCT-PLACEMENT-STAGE7-SOURCING-MANIFEST-2026-09-23.json";
const final=JSON.parse(fs.readFileSync(FINAL,"utf8"));
const gap=JSON.parse(fs.readFileSync(GAP,"utf8"));
const rails=(gap.sourcing_priority||[]).map(x=>({
 ...x,
 minimum_good_target:12,
 full_target:24,
 gap_to_full:Math.max(0,24-(x.canonical_count||0)),
 priority:x.density_state==="EMPTY"?"P0_EMPTY":x.canonical_count<=3?"P1_CRITICAL_THIN":x.canonical_count<=7?"P2_THIN":"P3_NEAR_GOOD",
 sourcing_status:["NEW_SOURCE_REQUIRED_TO_REACH_GOOD","SOURCE_MISPLACED_OR_UNSUPPORTED","TRUE_SOURCE_GAP"].includes(x.recovery_state)?"READ_ONLY_SUPPLIER_DISCOVERY_ALLOWED":"EVIDENCE_FIRST",
 checkout_status:"BLOCKED_UNTIL_PLACEMENT_QUALITY_STOCK_SHIPPING_PROFIT_PASS"
}));
const out={
 version:"HUNT-PRODUCT-PLACEMENT-STAGE7-SOURCING-MANIFEST-V2-GAP-AWARE",
 date:"2026-09-23",mode:"READ_ONLY_SUPPLIER_DISCOVERY_PLAN",production_effect:false,
 summary:{
   empty_rails:final.summary.rails_empty,
   thin_rails:final.summary.rails_thin_1_to_11,
   healthy_good_or_full:final.summary.rails_full_24+final.summary.rails_good_12_to_23,
   p0_empty:rails.filter(x=>x.priority==="P0_EMPTY").length,
   p1_critical_thin:rails.filter(x=>x.priority==="P1_CRITICAL_THIN").length,
   evidence_blocked:gap.summary.states.EVIDENCE_BLOCKED_CAN_REACH_GOOD||0,
   new_source_required:gap.summary.states.NEW_SOURCE_REQUIRED_TO_REACH_GOOD||0,
   source_misplaced_or_unsupported:gap.summary.states.SOURCE_MISPLACED_OR_UNSUPPORTED||0,
   total_gap_to_good:rails.reduce((n,x)=>n+(x.gap_to_good||0),0),
   total_gap_to_24:rails.reduce((n,x)=>n+(x.gap_to_full||0),0)
 },
 supplier_pipeline:[
   "Placement Gate","Supplier taxonomy / exact product family","Image / media quality","Variant truth",
   "Stock truth","Destination shipping truth","Price Gate / Product Contribution",
   "Final Profit Truth before live sell","Owner Gate before Production mutation"
 ],
 rules:[
   "Evidence-blocked rails stay evidence-first and are not treated as automatic inventory gaps.",
   "New supplier discovery is allowed only for source-required or source-misplaced rails.",
   "Do not fill a rail with semantically adjacent products merely to hit density.",
   "No fake stock, shipping, price, profit or variants.",
   "No Production mutation or supplier order."
 ],
 rails
};
fs.writeFileSync(OUT,JSON.stringify(out,null,2)+"\n");
console.log(JSON.stringify(out.summary,null,2));
