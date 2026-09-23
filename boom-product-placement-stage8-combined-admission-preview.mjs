import fs from "fs";

const S7="evidence/HUNT-PRODUCT-PLACEMENT-STAGE7-FINAL-PREVIEW-2026-09-23.json";
const A="evidence/HUNT-PRODUCT-PLACEMENT-STAGE8-P0-QUALITY-PROFIT-GATE-2026-09-23.json";
const B="evidence/HUNT-PRODUCT-PLACEMENT-STAGE8-P0-BELT-GATE-2026-09-23.json";
const OUT="evidence/HUNT-PRODUCT-PLACEMENT-STAGE8-COMBINED-ADMISSION-PREVIEW-2026-09-23.json";

const s7=JSON.parse(fs.readFileSync(S7,"utf8"));
const sources=[JSON.parse(fs.readFileSync(A,"utf8")),JSON.parse(fs.readFileSync(B,"utf8"))];
const all=[];
for(const src of sources)for(const x of src.results||[])if(x.state==="SHADOW_ADMISSION_CANDIDATE")all.push(x);

const uniq=new Map();
for(const x of all)uniq.set(x.provider+":"+String(x.item_id),x);
const candidates=[...uniq.values()];
const counts=new Map((s7.rails||[]).map(x=>[x.rail,x.count]));
const byRail=new Map();
for(const x of candidates){
  if(!byRail.has(x.rail))byRail.set(x.rail,[]);
  byRail.get(x.rail).push(x);
}
const admitted=[],reserve=[];
for(const [rail,rows] of byRail){
  rows.sort((a,b)=>(a.max_shipping_to_retail_ratio??999)-(b.max_shipping_to_retail_ratio??999)
    ||(b.min_projected_product_contribution_usd??0)-(a.min_projected_product_contribution_usd??0));
  const current=counts.get(rail)||0,need=Math.max(0,24-current);
  const chosen=rows.slice(0,need),extra=rows.slice(need);
  admitted.push(...chosen);reserve.push(...extra);
  counts.set(rail,current+chosen.length);
}
const rails=[...counts.entries()].map(([rail,count])=>({
  rail,count,state:count>=24?"FULL":count>=12?"GOOD":count>0?"THIN":"EMPTY",
  stage8_added:admitted.filter(x=>x.rail===rail).length
})).sort((a,b)=>a.rail.localeCompare(b.rail));

const summary={
  stage7_canonical_products:s7.summary.canonical_products,
  unique_gate_pass_candidates:candidates.length,
  shadow_admitted:admitted.length,
  reserve_candidates:reserve.length,
  canonical_products_shadow:s7.summary.canonical_products+admitted.length,
  rails_full_24:rails.filter(x=>x.state==="FULL").length,
  rails_good_12_to_23:rails.filter(x=>x.state==="GOOD").length,
  rails_thin_1_to_11:rails.filter(x=>x.state==="THIN").length,
  rails_empty:rails.filter(x=>x.state==="EMPTY").length,
  final_net_profit_verified_products:0,
  production_effect:false
};
const out={
  version:"HUNT-PRODUCT-PLACEMENT-STAGE8-COMBINED-ADMISSION-PREVIEW-V1",
  date:"2026-09-23",mode:"SHADOW_ADMISSION_PREVIEW_ONLY",production_effect:false,
  summary,
  rules:[
    "Only candidates passing strict primary-type placement, exact variant stock, four-market shipping, image QA and projected Product Contribution gate enter this Shadow preview.",
    "Admission is capped at 24 per rail.",
    "Final Net Profit is not verified.",
    "No Production mutation, checkout, payment, fulfillment or supplier order."
  ],
  admitted,reserve,
  empty_rails:rails.filter(x=>x.state==="EMPTY"),
  thin_rails:rails.filter(x=>x.state==="THIN"),
  rails
};
fs.writeFileSync(OUT,JSON.stringify(out,null,2)+"\n");
console.log(JSON.stringify(summary,null,2));
console.log("ADDED");
for(const rail of [...new Set(admitted.map(x=>x.rail))])console.log(rail,admitted.filter(x=>x.rail===rail).length);
console.log("EMPTY",out.empty_rails.map(x=>x.rail).join(", "));
