import fs from "fs";
import gate from "./boom-product-placement-gate.js";
import overlap from "./boom-product-placement-overlap-gate.js";

const SOURCE="evidence/HUNT-FULL-SHELVES-STYLIST-SHADOW-2026-09-23.json";
const TAX="evidence/HUNT-EPROLO-PLACEMENT-TAXONOMY-REFRESH-2026-09-23.json";
const DETAIL="evidence/HUNT-EPROLO-DETAIL-TAXONOMY-STAGE5-2026-09-23.json";
const STAGE6="evidence/HUNT-PRODUCT-PLACEMENT-STAGE6-OVERLAP-RESOLUTION-2026-09-23.json";
const OUT="evidence/HUNT-PRODUCT-PLACEMENT-STAGE6-REBUILD-PREVIEW-2026-09-23.json";
const source=JSON.parse(fs.readFileSync(SOURCE,"utf8"));
const tax=JSON.parse(fs.readFileSync(TAX,"utf8"));
const detail=JSON.parse(fs.readFileSync(DETAIL,"utf8"));
const stage6=JSON.parse(fs.readFileSync(STAGE6,"utf8"));
const taxKeep=new Map((tax.verified||[]).map(x=>[x.provider+":"+String(x.item_id),x]));
const taxConflict=new Map((detail.results||[]).filter(x=>x.state==="SUPPLIER_TAXONOMY_CONFLICT_CURRENT_RAIL").map(x=>["EPROLO:"+String(x.item_id),x]));
const s6=new Map((stage6.results||[]).map(x=>[x.provider+":"+String(x.item_id),x]));
const canonical=new Map();
for(const dep of source.departments||[])for(const cat of dep.categories||[])canonical.set(dep.slug+"/"+cat.slug,[]);
let keep=0,move=0,review=0,unknown=0,held=0;
const quarantine=[];
for(const dep of source.departments||[])for(const cat of dep.categories||[])for(const p of cat.products||[]){
  const rail=dep.slug+"/"+cat.slug,key=p.provider+":"+String(p.item_id),ov=s6.get(key);
  if(ov&&ov.current_rail===rail){
    if(ov.overlap_state==="KEEP"){canonical.get(rail)?.push({...p,placement_source:"STAGE6_OVERLAP_KEEP"});keep++;continue;}
    if(ov.overlap_state==="SAFE_MOVE_CANDIDATE"&&canonical.has(ov.suggested_rail)){
      canonical.get(ov.suggested_rail).push({...p,placement_source:"STAGE6_OVERLAP_SAFE_MOVE",placement_previous:{department:dep.slug,category:cat.slug}});
      move++;continue;
    }
    if(ov.overlap_state==="HOLD_OUT_OF_SCOPE"){held++;quarantine.push({provider:p.provider,item_id:String(p.item_id),title:p.title,current_rail:rail,state:"HOLD_OUT_OF_SCOPE",reason:ov.reason});continue;}
    if(ov.overlap_state==="REVIEW"){review++;quarantine.push({provider:p.provider,item_id:String(p.item_id),title:p.title,current_rail:rail,state:"REVIEW",reason:ov.reason});continue;}
    unknown++;quarantine.push({provider:p.provider,item_id:String(p.item_id),title:p.title,current_rail:rail,state:"UNKNOWN",reason:ov.reason});continue;
  }
  const tx=taxKeep.get(key),cf=taxConflict.get(key);
  const placement=gate.evaluate({
    provider:p.provider,item_id:String(p.item_id),title:p.title,current_department:dep.slug,current_category:cat.slug,
    supplier_category_id:tx?.supplier_category_id||cf?.supplier_category_id||null,
    supplier_taxonomy_current_rail_verified:!!(tx&&tx.current_rail===rail),
    supplier_taxonomy_conflict_current_rail:!!(cf&&cf.current_rail===rail),
    supplier_taxonomy_suggested_rail:Array.isArray(cf?.suggested_rail)?cf.suggested_rail[0]:(cf?.suggested_rail||null)
  });
  if(placement.placement_action==="KEEP"){canonical.get(rail)?.push({...p,placement_source:"PRIMARY_GATE_KEEP"});keep++;continue;}
  if(placement.placement_action==="MOVE"&&canonical.has(placement.canonical_department+"/"+placement.canonical_category)){
    canonical.get(placement.canonical_department+"/"+placement.canonical_category).push({...p,placement_source:"PRIMARY_GATE_SAFE_MOVE",placement_previous:{department:dep.slug,category:cat.slug}});
    move++;continue;
  }
  if(placement.placement_action==="HOLD_REVIEW")review++; else unknown++;
  quarantine.push({provider:p.provider,item_id:String(p.item_id),title:p.title,current_rail:rail,state:placement.decision,reason:placement.reason_codes});
}
let full=0,good=0,thin=0,empty=0,total=0;
const rails=[];
for(const dep of source.departments||[])for(const cat of dep.categories||[]){
  const rail=dep.slug+"/"+cat.slug,products=canonical.get(rail)||[];total+=products.length;
  const state=products.length>=24?"FULL":products.length>=12?"GOOD":products.length?"THIN":"EMPTY";
  if(state==="FULL")full++;else if(state==="GOOD")good++;else if(state==="THIN")thin++;else empty++;
  rails.push({rail,count:products.length,state});
}
const out={
  version:"HUNT-PRODUCT-PLACEMENT-STAGE6-REBUILD-PREVIEW-V1",date:"2026-09-23",mode:"SHADOW_PREVIEW_ONLY",production_effect:false,
  summary:{source_products:keep+move+review+unknown+held,canonical_products:total,keep,safe_move_applied_shadow:move,review_quarantine:review,unknown_quarantine:unknown,out_of_scope_hold:held,rails_full_24:full,rails_good_12_to_23:good,rails_thin_1_to_11:thin,rails_empty:empty},
  rules:["Stage6 SAFE_MOVE_CANDIDATE may move only inside this shadow preview.","REVIEW/UNKNOWN/HOLD_OUT_OF_SCOPE are quarantined.","No Production mutation.","Profit Gate runs only after placement truth."],
  empty_rails:rails.filter(x=>x.state==="EMPTY"),thin_rails:rails.filter(x=>x.state==="THIN"),rails,quarantine
};
fs.writeFileSync(OUT,JSON.stringify(out,null,2)+"\n");
console.log(JSON.stringify(out.summary,null,2));
console.log("EMPTY",out.empty_rails.map(x=>x.rail).join(", "));
