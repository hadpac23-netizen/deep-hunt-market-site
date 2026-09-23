import fs from "fs";
const SOURCES=[
 "evidence/HUNT-PRODUCT-PLACEMENT-STAGE7-THIN-RECOVERY-WAVE-A-2026-09-23.json",
 "evidence/HUNT-PRODUCT-PLACEMENT-STAGE7-THIN-RECOVERY-WAVE-B-2026-09-23.json",
 "evidence/HUNT-PRODUCT-PLACEMENT-STAGE7-THIN-RECOVERY-WAVE-C-2026-09-23.json"
];
const OUT="evidence/HUNT-PRODUCT-PLACEMENT-STAGE7-THIN-RECOVERY-2026-09-23.json";
const results=[],seen=new Set(),byRail={};
for(const fp of SOURCES){
  const d=JSON.parse(fs.readFileSync(fp,"utf8"));
  for(const x of d.results||[]){
    const key=x.provider+":"+x.item_id;
    if(seen.has(key))continue;
    seen.add(key);results.push(x);
    byRail[x.current_rail]??={};
    byRail[x.current_rail][x.recovery_state]=(byRail[x.current_rail][x.recovery_state]||0)+1;
  }
}
const out={
 version:"HUNT-PRODUCT-PLACEMENT-STAGE7-THIN-RECOVERY-V2-AGGREGATED",
 date:"2026-09-23",mode:"SHADOW_EVIDENCE_RECOVERY",production_effect:false,
 sources:SOURCES,
 summary:{
   target_rails:Object.keys(byRail).length,
   products_checked:results.length,
   keep_recoverable:results.filter(x=>x.recovery_state==="KEEP").length,
   review:results.filter(x=>x.recovery_state==="REVIEW").length,
   unknown:results.filter(x=>x.recovery_state==="UNKNOWN").length,
   rails_with_keep_recovery:Object.values(byRail).filter(x=>(x.KEEP||0)>0).length
 },
 rules:[
   "Aggregates only Stage7 thin recovery waves that passed sample QA.",
   "Only Stage6 quarantine products were eligible in source waves.",
   "Current rail is not evidence.",
   "KEEP recovery is Shadow only.",
   "No Production mutation or new sourcing is included."
 ],
 by_rail:byRail,results
};
fs.writeFileSync(OUT,JSON.stringify(out,null,2)+"\n");
console.log(JSON.stringify(out.summary,null,2));
