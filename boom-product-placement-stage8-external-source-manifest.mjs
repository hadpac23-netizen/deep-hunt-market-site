import fs from "fs";

const PREVIEW="evidence/HUNT-PRODUCT-PLACEMENT-STAGE8-COMBINED-ADMISSION-PREVIEW-2026-09-23.json";
const CJ="evidence/HUNT-CJ-FOCUSED-THIN-SHELF-SCAN-2026-09-23.json";
const OUT="evidence/HUNT-PRODUCT-PLACEMENT-STAGE8-EXTERNAL-SOURCE-MANIFEST-2026-09-23.json";
const p=JSON.parse(fs.readFileSync(PREVIEW,"utf8"));
const cj=JSON.parse(fs.readFileSync(CJ,"utf8"));
const empty=p.empty_rails||[];

const menCJ=(cj.unique_candidates||[]).filter(x=>{
 const t=String(x.title||"");
 return /\b(men'?s|mens|male)\b/i.test(t)&&/\b(two[- ]piece set|polo.{0,20}shorts|shirt.{0,20}shorts|outfit set|clothing set)\b/i.test(t)
   && !/\b(women|female|girls?|baby|kids?|children)\b/i.test(t);
});

const rails=empty.map(x=>({
  rail:x.rail,
  canonical_count:x.count,
  gap_to_good:Math.max(0,12-x.count),
  gap_to_full:Math.max(0,24-x.count),
  cj_provisional_candidates:x.rail==="men/men-clothing"?menCJ.length:0,
  cj_state:x.rail==="men/men-clothing"&&menCJ.length?"PROVISIONAL_REQUIRES_PRODUCT_DETAIL_QUOTE":"NO_CLEAN_CJ_SNAPSHOT_CANDIDATE",
  hypersku_state:"MANUAL_SOURCING_REQUEST_RECOMMENDED",
  eprolo_state:"EXHAUSTED_WAVE_A_PLUS_DEEP_SCAN_NO_CLEAN_ADMISSION_CANDIDATE",
  target_requirements:[
    "primary product type exactly matches rail",
    "high-quality main image >=500px both dimensions",
    "exact variant and stock truth",
    "worldwide shipping evidence with IL/DE/US/SG validation where supported",
    "supplier cost enabling >=$3.99 projected Product Contribution and >=35% projected product margin",
    "no MOQ/pre-purchase if dropship lane",
    "media usage rights",
    "QC/sample path"
  ],
  production_effect:false
}));

const out={
 version:"HUNT-PRODUCT-PLACEMENT-STAGE8-EXTERNAL-SOURCE-MANIFEST-V1",
 date:"2026-09-23",mode:"READ_ONLY_EXTERNAL_SOURCE_PLAN",production_effect:false,
 summary:{
   empty_rails:rails.length,
   total_gap_to_good:rails.reduce((n,x)=>n+x.gap_to_good,0),
   total_gap_to_full:rails.reduce((n,x)=>n+x.gap_to_full,0),
   rails_with_cj_provisional:rails.filter(x=>x.cj_provisional_candidates>0).length,
   hypersku_manual_sourcing_rails:rails.length
 },
 rules:[
   "EPROLO Wave A plus deep scan is considered exhausted for these empty rails.",
   "CJ provisional candidates cannot enter admission until product detail, exact variant, stock and destination quote verify.",
   "HyperSKU is manual sourcing only until API eligibility; no fake API assumption.",
   "External source discovery never bypasses Placement, Quality, Shipping or Profit gates.",
   "No Production mutation or supplier order."
 ],
 rails,
 cj_provisional:{men_clothing:menCJ}
};
fs.writeFileSync(OUT,JSON.stringify(out,null,2)+"\n");
console.log(JSON.stringify(out.summary,null,2));
for(const x of rails)console.log(x.rail,"gapGood",x.gap_to_good,"CJ",x.cj_provisional_candidates,"Hyper",x.hypersku_state);
