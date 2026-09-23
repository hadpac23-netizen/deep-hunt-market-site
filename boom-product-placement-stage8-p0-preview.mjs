import fs from "fs";
const BASE="evidence/HUNT-PRODUCT-PLACEMENT-STAGE7-FINAL-PREVIEW-2026-09-23.json";
const SEL="evidence/HUNT-PRODUCT-PLACEMENT-STAGE8-P0-SELECTION-2026-09-23.json";
const OUT="evidence/HUNT-PRODUCT-PLACEMENT-STAGE8-P0-PREVIEW-2026-09-23.json";
const base=JSON.parse(fs.readFileSync(BASE,"utf8"));
const sel=JSON.parse(fs.readFileSync(SEL,"utf8"));
const add=new Map();
for(const x of sel.selected||[])add.set(x.rail,(add.get(x.rail)||0)+1);
const rails=(base.rails||[]).map(r=>{
  const added=add.get(r.rail)||0;
  const count=(r.count||0)+added;
  return {...r,stage8_selected:added,count,state:count>=24?"FULL":count>=12?"GOOD":count>0?"THIN":"EMPTY"};
});
const summary={
  stage7_canonical_products:base.summary.canonical_products,
  stage8_selected_products:(sel.selected||[]).length,
  canonical_products:rails.reduce((n,x)=>n+x.count,0),
  rails_full_24:rails.filter(x=>x.state==="FULL").length,
  rails_good_12_to_23:rails.filter(x=>x.state==="GOOD").length,
  rails_thin_1_to_11:rails.filter(x=>x.state==="THIN").length,
  rails_empty:rails.filter(x=>x.state==="EMPTY").length,
  final_net_profit_verified_products:0,
  production_effect:false
};
const out={
 version:"HUNT-PRODUCT-PLACEMENT-STAGE8-P0-PREVIEW-V1",
 date:"2026-09-23",mode:"SHADOW_PREVIEW_ONLY",production_effect:false,
 summary,
 rules:[
   "Preview adds only Stage8 selected PASS products to Stage7 canonical counts.",
   "No CJ provisional item is counted.",
   "Semantic visual-quality review remains separate from technical media QA.",
   "Final Net Profit remains unverified.",
   "No Production mutation."
 ],
 recovered_rails:rails.filter(x=>x.stage8_selected>0),
 empty_rails:rails.filter(x=>x.state==="EMPTY"),
 thin_rails:rails.filter(x=>x.state==="THIN"),
 rails
};
fs.writeFileSync(OUT,JSON.stringify(out,null,2)+"\n");
console.log(JSON.stringify(summary,null,2));
console.log("EMPTY",out.empty_rails.map(x=>x.rail).join(", "));
