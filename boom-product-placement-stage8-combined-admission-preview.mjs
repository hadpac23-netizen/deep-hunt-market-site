import fs from "fs";

const S7="evidence/HUNT-PRODUCT-PLACEMENT-STAGE7-FINAL-PREVIEW-2026-09-23.json";
const VISUAL="evidence/HUNT-PRODUCT-PLACEMENT-STAGE8-P0-VISUAL-QA-2026-09-23.json";
const BELT_GATE="evidence/HUNT-PRODUCT-PLACEMENT-STAGE8-P0-BELT-GATE-2026-09-23.json";
const BELT_VISUAL="evidence/HUNT-PRODUCT-PLACEMENT-STAGE8-BELT-VISUAL-QA-2026-09-23.json";
const OUT="evidence/HUNT-PRODUCT-PLACEMENT-STAGE8-COMBINED-ADMISSION-PREVIEW-2026-09-23.json";

const s7=JSON.parse(fs.readFileSync(S7,"utf8"));
const visual=JSON.parse(fs.readFileSync(VISUAL,"utf8"));
const beltGate=JSON.parse(fs.readFileSync(BELT_GATE,"utf8"));
const beltVisual=JSON.parse(fs.readFileSync(BELT_VISUAL,"utf8"));

const approved=[...(visual.approved||[])];
const beltIds=new Set(beltVisual.approved_item_ids||[]);
for(const x of beltGate.results||[]){
  if(x.state==="SHADOW_ADMISSION_CANDIDATE"&&beltIds.has(String(x.item_id))){
    approved.push({...x,visual_state:"PASS_CATEGORY_VISUAL",visual_basis:"BELT_CONTACT_SHEET_7"});
  }
}
const uniq=new Map();
for(const x of approved)uniq.set(x.provider+":"+String(x.item_id),x);
const admitted=[...uniq.values()];

const counts=new Map((s7.rails||[]).map(x=>[x.rail,x.count]));
for(const x of admitted)counts.set(x.rail,(counts.get(x.rail)||0)+1);
const rails=[...counts.entries()].map(([rail,count])=>({
  rail,count,state:count>=24?"FULL":count>=12?"GOOD":count>0?"THIN":"EMPTY",
  stage8_added:admitted.filter(x=>x.rail===rail).length
})).sort((a,b)=>a.rail.localeCompare(b.rail));

const summary={
  stage7_canonical_products:s7.summary.canonical_products,
  visual_gate_pass_candidates:admitted.length,
  shadow_admitted:admitted.length,
  canonical_products_shadow:s7.summary.canonical_products+admitted.length,
  rails_full_24:rails.filter(x=>x.state==="FULL").length,
  rails_good_12_to_23:rails.filter(x=>x.state==="GOOD").length,
  rails_thin_1_to_11:rails.filter(x=>x.state==="THIN").length,
  rails_empty:rails.filter(x=>x.state==="EMPTY").length,
  final_net_profit_verified_products:0,
  production_effect:false
};
const out={
  version:"HUNT-PRODUCT-PLACEMENT-STAGE8-COMBINED-ADMISSION-PREVIEW-V2-VISUAL-STRICT",
  date:"2026-09-23",mode:"SHADOW_ADMISSION_PREVIEW_ONLY",production_effect:false,
  summary,
  rules:[
    "Only semantic-visual-approved products are admitted to this Shadow preview.",
    "All admitted products also passed strict placement, exact variant/stock, shipping 4/4 where required, technical image QA and projected Product Contribution gate.",
    "Near-duplicate men bags are deliberately limited for shelf diversity.",
    "Women title/image mismatches remain REVIEW.",
    "Final Net Profit and explicit media-rights truth are not yet verified.",
    "No Production mutation, checkout, payment, fulfillment or supplier order."
  ],
  admitted,
  empty_rails:rails.filter(x=>x.state==="EMPTY"),
  thin_rails:rails.filter(x=>x.state==="THIN"),
  rails
};
fs.writeFileSync(OUT,JSON.stringify(out,null,2)+"\n");
console.log(JSON.stringify(summary,null,2));
console.log("ADDED");
for(const rail of [...new Set(admitted.map(x=>x.rail))])console.log(rail,admitted.filter(x=>x.rail===rail).length);
console.log("EMPTY",out.empty_rails.map(x=>x.rail).join(", "));
