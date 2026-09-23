import fs from "fs";
const SHELVES="evidence/HUNT-FULL-SHELVES-STYLIST-SHADOW-2026-09-23.json";
const BASE="evidence/HUNT-PRODUCT-PLACEMENT-STAGE6-REBUILD-PREVIEW-2026-09-23.json";
const STAGE7="evidence/HUNT-PRODUCT-PLACEMENT-STAGE7-REBUILD-PREVIEW-2026-09-23.json";
const SOURCES=[
 "evidence/HUNT-PRODUCT-PLACEMENT-STAGE7-EMPTY-RECOVERY-2026-09-23.json",
 "evidence/HUNT-PRODUCT-PLACEMENT-STAGE7-THIN-RECOVERY-WAVE-A-2026-09-23.json",
 "evidence/HUNT-PRODUCT-PLACEMENT-STAGE7-THIN-RECOVERY-WAVE-B-2026-09-23.json",
 "evidence/HUNT-PRODUCT-PLACEMENT-STAGE7-THIN-RECOVERY-WAVE-C-2026-09-23.json"
];
const OUT="evidence/HUNT-PRODUCT-PLACEMENT-STAGE7-GAP-MAP-2026-09-23.json";
const shelves=JSON.parse(fs.readFileSync(SHELVES,"utf8"));
const base=JSON.parse(fs.readFileSync(BASE,"utf8"));
const s7=JSON.parse(fs.readFileSync(STAGE7,"utf8"));
const sourceCount=new Map();
for(const d of shelves.departments||[])for(const c of d.categories||[])sourceCount.set(d.slug+"/"+c.slug,(c.products||[]).length);
const qCount=new Map();
for(const x of base.quarantine||[])qCount.set(x.current_rail,(qCount.get(x.current_rail)||0)+1);
const recoveredByRail=new Map(), recoveredIds=new Set();
for(const fp of SOURCES){
  const d=JSON.parse(fs.readFileSync(fp,"utf8"));
  for(const x of d.results||[]){
    if(x.recovery_state!=="KEEP")continue;
    const key=x.provider+":"+x.item_id;
    if(recoveredIds.has(key))continue;
    recoveredIds.add(key);
    recoveredByRail.set(x.current_rail,(recoveredByRail.get(x.current_rail)||0)+1);
  }
}
const rows=[];
for(const r of s7.rails||[]){
  const source=sourceCount.get(r.rail)||0;
  const stage6q=qCount.get(r.rail)||0;
  const recovered=recoveredByRail.get(r.rail)||0;
  const remaining=Math.max(0,stage6q-recovered);
  const potential=(r.count||0)+remaining;
  let state="HEALTHY";
  let action="NONE";
  if(r.state==="EMPTY"){
    if(source===0){state="TRUE_SOURCE_GAP";action="SOURCE_NEW_PRODUCTS";}
    else if(remaining>0){state="SOURCE_MISPLACED_OR_UNSUPPORTED";action="NEW_SOURCE_PLUS_OPTIONAL_MANUAL_EVIDENCE_REVIEW";}
    else {state="TRUE_SOURCE_GAP";action="SOURCE_NEW_PRODUCTS";}
  } else if(r.state==="THIN"){
    if(potential>=12){state="EVIDENCE_BLOCKED_CAN_REACH_GOOD";action="BETTER_EVIDENCE_OR_NEW_VERIFIED_SOURCE";}
    else {state="NEW_SOURCE_REQUIRED_TO_REACH_GOOD";action="SOURCE_NEW_PRODUCTS";}
  }
  rows.push({
    rail:r.rail,
    density_state:r.state,
    canonical_count:r.count||0,
    source_products_existing:source,
    stage6_quarantine:stage6q,
    stage7_recovered_keep:recovered,
    remaining_quarantine:remaining,
    potential_without_new_source:potential,
    gap_to_good:Math.max(0,12-(r.count||0)),
    recovery_state:state,
    recommended_action:action
  });
}
const counts={};
for(const x of rows)counts[x.recovery_state]=(counts[x.recovery_state]||0)+1;
const priority=rows.filter(x=>x.recovery_state!=="HEALTHY").sort((a,b)=>{
  const rank={TRUE_SOURCE_GAP:0,NEW_SOURCE_REQUIRED_TO_REACH_GOOD:1,SOURCE_MISPLACED_OR_UNSUPPORTED:2,EVIDENCE_BLOCKED_CAN_REACH_GOOD:3};
  return (rank[a.recovery_state]??9)-(rank[b.recovery_state]??9) || a.gap_to_good-b.gap_to_good || a.rail.localeCompare(b.rail);
});
const out={
  version:"HUNT-PRODUCT-PLACEMENT-STAGE7-GAP-MAP-V1",
  date:"2026-09-23",mode:"SHADOW_PLANNING_ONLY",production_effect:false,
  summary:{
    rails_total:rows.length,
    states:counts,
    residual_empty:rows.filter(x=>x.density_state==="EMPTY").length,
    residual_thin:rows.filter(x=>x.density_state==="THIN").length,
    healthy_good_or_full:rows.filter(x=>["GOOD","FULL"].includes(x.density_state)).length,
    stage7_recovered_keep:recoveredIds.size
  },
  rules:[
    "Existing source count is not shelf truth.",
    "Evidence-blocked rails are not automatically treated as inventory gaps.",
    "New sourcing begins only where placement recovery is exhausted or insufficient.",
    "Every new supplier product must pass Placement Gate before Quality/Stock/Shipping/Profit gates."
  ],
  sourcing_priority:priority,
  rails:rows
};
fs.writeFileSync(OUT,JSON.stringify(out,null,2)+"\n");
console.log(JSON.stringify(out.summary,null,2));
console.log("TOP SOURCE REQUIRED");
for(const x of priority.filter(x=>["TRUE_SOURCE_GAP","NEW_SOURCE_REQUIRED_TO_REACH_GOOD","SOURCE_MISPLACED_OR_UNSUPPORTED"].includes(x.recovery_state)).slice(0,40)){
 console.log(x.recovery_state,x.rail,"count",x.canonical_count,"gap",x.gap_to_good,"source",x.source_products_existing,"remainingQ",x.remaining_quarantine);
}
