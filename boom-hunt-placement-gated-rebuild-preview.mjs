import fs from "fs";
import gate from "./boom-product-placement-gate.js";

const SOURCE="evidence/HUNT-FULL-SHELVES-STYLIST-SHADOW-2026-09-23.json";
const OUT="evidence/HUNT-PLACEMENT-GATED-REBUILD-PREVIEW-2026-09-23.json";
const source=JSON.parse(fs.readFileSync(SOURCE,"utf8"));
const TAXONOMY_REFRESH="evidence/HUNT-EPROLO-PLACEMENT-TAXONOMY-REFRESH-2026-09-23.json";
const taxonomy=fs.existsSync(TAXONOMY_REFRESH)?JSON.parse(fs.readFileSync(TAXONOMY_REFRESH,"utf8")):{verified:[]};
const taxonomyKeep=new Map((taxonomy.verified||[]).map(x=>[x.provider+":"+String(x.item_id),x]));

const canonical=new Map();
const quarantined=[];
const allRails=[];
for(const dep of source.departments||[]){
  for(const cat of dep.categories||[]){
    const key=dep.slug+"/"+cat.slug;
    allRails.push({department:dep.slug,department_title:dep.title,category:cat.slug,category_title:cat.title,key});
    canonical.set(key,[]);
  }
}

let keep=0,move=0,review=0,unknown=0;
for(const dep of source.departments||[]){
  for(const cat of dep.categories||[]){
    for(const p of cat.products||[]){
      const tx=taxonomyKeep.get(p.provider+":"+String(p.item_id||""));
      const placement=gate.evaluate({
        provider:p.provider,item_id:String(p.item_id||""),title:p.title||"",
        current_department:dep.slug,current_category:cat.slug,
        supplier_category_id:tx?.supplier_category_id||null,
        supplier_taxonomy_current_rail_verified:!!(tx&&tx.current_rail===dep.slug+"/"+cat.slug)
      });
      const base={...p,placement_truth:placement};
      if(placement.placement_action==="KEEP"){
        canonical.get(dep.slug+"/"+cat.slug)?.push(base); keep++; continue;
      }
      if(placement.placement_action==="MOVE"){
        const target=placement.canonical_department+"/"+placement.canonical_category;
        if(canonical.has(target)){
          canonical.get(target).push({...base,placement_previous:{department:dep.slug,category:cat.slug}});
          move++; continue;
        }
      }
      if(placement.placement_action==="HOLD_REVIEW")review++;
      else unknown++;
      quarantined.push({
        provider:p.provider,item_id:String(p.item_id||""),title:p.title||"",
        current_department:dep.slug,current_category:cat.slug,
        placement
      });
    }
  }
}

const departments=[];
let railsFull=0,railsGood=0,railsThin=0,railsEmpty=0,total=0;
for(const dep of source.departments||[]){
  const categories=[];
  for(const cat of dep.categories||[]){
    const products=canonical.get(dep.slug+"/"+cat.slug)||[];
    total+=products.length;
    if(products.length>=24)railsFull++;
    else if(products.length>=12)railsGood++;
    else if(products.length>0)railsThin++;
    else railsEmpty++;
    categories.push({
      slug:cat.slug,title:cat.title,strict_placement_count:products.length,
      density_state:products.length>=24?"FULL":products.length>=12?"GOOD":products.length>0?"THIN":"EMPTY",
      products
    });
  }
  departments.push({slug:dep.slug,title:dep.title,categories});
}

const out={
  version:"HUNT-PLACEMENT-GATED-REBUILD-PREVIEW-V1",
  date:"2026-09-23",mode:"STRICT_PLACEMENT_SHADOW_PREVIEW",
  production_effect:false,source:SOURCE,
  supplier_taxonomy_evidence:fs.existsSync(TAXONOMY_REFRESH)?TAXONOMY_REFRESH:null,
  summary:{
    source_products:keep+move+review+unknown,
    strict_canonical_products:total,
    keep, safe_move_applied_shadow:move,
    quarantined_review:review, quarantined_unknown:unknown,
    rails_full_24:railsFull,rails_good_12_to_23:railsGood,
    rails_thin_1_to_11:railsThin,rails_empty:railsEmpty
  },
  rules:[
    "KEEP remains in its current canonical rail.",
    "Only SAFE_MOVE_CANDIDATE is re-routed in this preview.",
    "REVIEW and UNKNOWN are quarantined and never forced into a rail.",
    "This preview does not mutate Production or the existing HUNT shelf evidence.",
    "Shelf density must be rebuilt only after placement truth improves."
  ],
  quarantine_summary:{
    total:quarantined.length,
    review:review,unknown:unknown,
    next:"Stage 2 must use independent supplier taxonomy/attributes or stronger deterministic rules; current category cannot self-prove."
  },
  departments,
  quarantine:quarantined
};
fs.writeFileSync(OUT,JSON.stringify(out,null,2)+"\n");
console.log(JSON.stringify(out.summary,null,2));
