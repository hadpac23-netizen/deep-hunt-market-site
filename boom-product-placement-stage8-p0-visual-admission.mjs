import fs from "fs";

const QUALITY="evidence/HUNT-PRODUCT-PLACEMENT-STAGE8-P0-QUALITY-PROFIT-GATE-2026-09-23.json";
const BASE="evidence/HUNT-PRODUCT-PLACEMENT-STAGE7-FINAL-PREVIEW-2026-09-23.json";
const VISUAL_OUT="evidence/HUNT-PRODUCT-PLACEMENT-STAGE8-P0-VISUAL-QA-2026-09-23.json";
const PREVIEW_OUT="evidence/HUNT-PRODUCT-PLACEMENT-STAGE8-P0-ADMISSION-PREVIEW-2026-09-23.json";

const quality=JSON.parse(fs.readFileSync(QUALITY,"utf8"));
const base=JSON.parse(fs.readFileSync(BASE,"utf8"));
const idx=new Map((quality.results||[]).map(x=>[String(x.item_id),x]));

const approved={
  "men/men-bags":[
    "11622522","11622290","19034140","19535245","19547768","19541423",
    "19535184","19541425","19535251","19547769","19547802","19535232"
  ],
  "women/women-clothing":[
    "30910846","30910845","30854673","31648854","30860754","31403543",
    "31403880","31247576","30183941","29964830","30183932","30053098"
  ],
  "pets/pet-beds":["10575883","19701045"],
  "accessories/scarves":["32465172"]
};

const titleCleanup=new Set(["30854673","30053098","10575883"]);
const explicitVisualReview={
  "29964725":"REVIEW_TITLE_IMAGE_MISMATCH_BODYSUIT_NOT_JUMPSUIT",
  "32695439":"REVIEW_TITLE_IMAGE_MISMATCH_TOP_BODYSUIT_NOT_JUMPSUIT",
  "30089792":"REVIEW_TITLE_IMAGE_MISMATCH_BODYSUIT_NOT_TSHIRT_JUMPSUIT"
};

const approvedRows=[];
for(const [rail,ids] of Object.entries(approved)){
  for(const id of ids){
    const q=idx.get(id);
    if(!q)throw new Error("Missing quality row "+id);
    if(q.rail!==rail)throw new Error("Rail mismatch "+id+" "+q.rail+" != "+rail);
    if(q.state!=="SHADOW_ADMISSION_CANDIDATE")throw new Error("Not quality-gate pass "+id);
    approvedRows.push({
      provider:q.provider,item_id:id,rail,title:q.title,image_url:q.image_url,
      visual_state:"PASS_CATEGORY_VISUAL",
      title_cleanup_required:titleCleanup.has(id)||!!q.title_cleanup_required,
      visual_basis:rail==="men/men-bags"?"CONTACT_SHEET_24_WITH_DIVERSITY_SELECTION":
                   rail==="women/women-clothing"?"CONTACT_SHEET_15_MANUAL_SEMANTIC_REVIEW":
                   rail==="pets/pet-beds"?"DIRECT_IMAGE_REVIEW":
                   "DIRECT_IMAGE_REVIEW",
      image_qa:q.image_qa,
      exact_variant:q.exact_variant,
      verified_markets:q.verified_markets,
      min_projected_product_contribution_usd:q.min_projected_product_contribution_usd,
      min_projected_product_margin:q.min_projected_product_margin,
      max_shipping_to_retail_ratio:q.max_shipping_to_retail_ratio,
      shipping_state:q.shipping_state,
      profit_state:q.profit_state,
      final_net_profit_verified:false,
      media_rights_state:"PROVISIONAL_PROVIDER_CATALOG_USE",
      production_effect:false
    });
  }
}

const reviewRows=[];
for(const [id,reason] of Object.entries(explicitVisualReview)){
  const q=idx.get(id);
  if(q)reviewRows.push({
    provider:q.provider,item_id:id,rail:q.rail,title:q.title,image_url:q.image_url,
    visual_state:"REVIEW",reason,production_effect:false
  });
}

const visual={
  version:"HUNT-PRODUCT-PLACEMENT-STAGE8-P0-VISUAL-QA-V1",
  date:"2026-09-23",mode:"SHADOW_MANUAL_VISUAL_QA",production_effect:false,
  summary:{
    visually_approved:approvedRows.length,
    visual_review_explicit:reviewRows.length,
    rails_approved:[...new Set(approvedRows.map(x=>x.rail))].length,
    final_net_profit_verified_products:0
  },
  rules:[
    "Visual QA checks category/image semantic fit, not only pixel dimensions.",
    "Near-duplicate men bag designs are not selected merely to hit density.",
    "Women clothing title/image mismatches remain REVIEW.",
    "Provider catalog media-use rights remain provisional until explicit supplier/platform rights are confirmed for Production.",
    "Visual PASS does not imply Final Net Profit Verified or Production admission."
  ],
  approved:approvedRows,
  review:reviewRows
};
fs.writeFileSync(VISUAL_OUT,JSON.stringify(visual,null,2)+"\n");

const counts=new Map((base.rails||[]).map(x=>[x.rail,x.count]));
const added=new Map();
for(const x of approvedRows){
  counts.set(x.rail,(counts.get(x.rail)||0)+1);
  added.set(x.rail,(added.get(x.rail)||0)+1);
}
const rails=[...counts.entries()].map(([rail,count])=>({
  rail,count,
  state:count>=24?"FULL":count>=12?"GOOD":count>0?"THIN":"EMPTY",
  stage8_added:added.get(rail)||0
})).sort((a,b)=>a.rail.localeCompare(b.rail));

const summary={
  stage7_canonical_products:base.summary.canonical_products,
  stage8_visual_approved_products:approvedRows.length,
  canonical_products:base.summary.canonical_products+approvedRows.length,
  rails_full_24:rails.filter(x=>x.state==="FULL").length,
  rails_good_12_to_23:rails.filter(x=>x.state==="GOOD").length,
  rails_thin_1_to_11:rails.filter(x=>x.state==="THIN").length,
  rails_empty:rails.filter(x=>x.state==="EMPTY").length,
  final_net_profit_verified_products:0,
  production_effect:false
};
const preview={
  version:"HUNT-PRODUCT-PLACEMENT-STAGE8-P0-ADMISSION-PREVIEW-V1",
  date:"2026-09-23",mode:"SHADOW_ADMISSION_PREVIEW_ONLY",production_effect:false,
  summary,
  rules:[
    "Only candidates passing strict placement QA, shipping 4/4, technical image QA, projected contribution gate, and semantic visual QA are counted.",
    "This preview does not mutate current shelves.",
    "Media-rights truth and Final Net Profit Truth are still incomplete.",
    "No Production mutation, checkout activation or supplier order."
  ],
  added_by_rail:[...added.entries()].map(([rail,count])=>({rail,count})),
  empty_rails:rails.filter(x=>x.state==="EMPTY"),
  thin_rails:rails.filter(x=>x.state==="THIN"),
  rails
};
fs.writeFileSync(PREVIEW_OUT,JSON.stringify(preview,null,2)+"\n");

console.log("VISUAL",JSON.stringify(visual.summary));
console.log("PREVIEW",JSON.stringify(summary));
console.log("EMPTY",preview.empty_rails.map(x=>x.rail).join(", "));
