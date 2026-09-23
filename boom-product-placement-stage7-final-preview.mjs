import fs from "fs";
const S6="evidence/HUNT-PRODUCT-PLACEMENT-STAGE6-REBUILD-PREVIEW-2026-09-23.json";
const EMPTY="evidence/HUNT-PRODUCT-PLACEMENT-STAGE7-EMPTY-RECOVERY-2026-09-23.json";
const THIN="evidence/HUNT-PRODUCT-PLACEMENT-STAGE7-THIN-RECOVERY-2026-09-23.json";
const OUT="evidence/HUNT-PRODUCT-PLACEMENT-STAGE7-FINAL-PREVIEW-2026-09-23.json";
const s6=JSON.parse(fs.readFileSync(S6,"utf8"));
const er=JSON.parse(fs.readFileSync(EMPTY,"utf8"));
const tr=JSON.parse(fs.readFileSync(THIN,"utf8"));
const counts=new Map((s6.rails||[]).map(x=>[x.rail,x.count]));
const recoveredByRail=new Map(),ids=new Set();
function add(rows,label){
  for(const x of rows||[]){
    if(x.recovery_state!=="KEEP")continue;
    const key=x.provider+":"+x.item_id;if(ids.has(key))continue;ids.add(key);
    counts.set(x.current_rail,(counts.get(x.current_rail)||0)+1);
    const v=recoveredByRail.get(x.current_rail)||{empty_recovery:0,thin_recovery:0,total:0};
    v[label]++;v.total++;recoveredByRail.set(x.current_rail,v);
  }
}
add(er.results,"empty_recovery");add(tr.results,"thin_recovery");
const rails=[...counts.entries()].map(([rail,count])=>({rail,count,state:count>=24?"FULL":count>=12?"GOOD":count>0?"THIN":"EMPTY",...(recoveredByRail.get(rail)||{empty_recovery:0,thin_recovery:0,total:0})})).sort((a,b)=>a.rail.localeCompare(b.rail));
const summary={
 source_products:s6.summary.source_products,
 stage6_canonical_products:s6.summary.canonical_products,
 empty_recovered:(er.results||[]).filter(x=>x.recovery_state==="KEEP").length,
 thin_recovered:(tr.results||[]).filter(x=>x.recovery_state==="KEEP").length,
 total_stage7_recovered:ids.size,
 canonical_products:[...counts.values()].reduce((a,b)=>a+b,0),
 rails_full_24:rails.filter(x=>x.state==="FULL").length,
 rails_good_12_to_23:rails.filter(x=>x.state==="GOOD").length,
 rails_thin_1_to_11:rails.filter(x=>x.state==="THIN").length,
 rails_empty:rails.filter(x=>x.state==="EMPTY").length
};
const out={
 version:"HUNT-PRODUCT-PLACEMENT-STAGE7-FINAL-PREVIEW-V2-QA",
 date:"2026-09-23",mode:"SHADOW_RECOVERY_PREVIEW_ONLY",production_effect:false,summary,
 rules:[
  "Only QA-passed Stage7 KEEP recovery is added to Stage6 canonical preview.",
  "Recovered products are deduplicated by provider/item_id.",
  "Stage6 safe moves are never overridden.",
  "REVIEW/UNKNOWN/HOLD remain quarantined.",
  "No newly sourced inventory is counted.",
  "Profit Gate has not yet been applied to recovered placements."
 ],
 recovered_by_rail:[...recoveredByRail.entries()].map(([rail,x])=>({rail,...x})).sort((a,b)=>b.total-a.total),
 empty_rails:rails.filter(x=>x.state==="EMPTY"),thin_rails:rails.filter(x=>x.state==="THIN"),rails
};
fs.writeFileSync(OUT,JSON.stringify(out,null,2)+"\n");
console.log(JSON.stringify(summary,null,2));
