import fs from "fs";
import gate from "./boom-product-placement-gate.js";

const SHELVES="evidence/HUNT-FULL-SHELVES-STYLIST-SHADOW-2026-09-23.json";
const TAX="evidence/HUNT-EPROLO-PLACEMENT-TAXONOMY-REFRESH-2026-09-23.json";
const OUT="evidence/HUNT-PRODUCT-PLACEMENT-STAGE4-QUEUE-2026-09-23.json";
const shelves=JSON.parse(fs.readFileSync(SHELVES,"utf8"));
const tax=fs.existsSync(TAX)?JSON.parse(fs.readFileSync(TAX,"utf8")):{verified:[],rail_mapping:{},scan_meta:{}};
const taxKeep=new Map((tax.verified||[]).map(x=>[x.provider+":"+String(x.item_id),x]));
const DETAIL_TAXONOMY="evidence/HUNT-EPROLO-DETAIL-TAXONOMY-STAGE5-2026-09-23.json";
const detailTaxonomy=fs.existsSync(DETAIL_TAXONOMY)?JSON.parse(fs.readFileSync(DETAIL_TAXONOMY,"utf8")):{results:[]};
const taxonomyConflict=new Map((detailTaxonomy.results||[])
  .filter(x=>x.state==="SUPPLIER_TAXONOMY_CONFLICT_CURRENT_RAIL")
  .map(x=>["EPROLO:"+String(x.item_id),x]));
const railMapping=tax.rail_mapping||{};
const OFFICIAL_TREE="evidence/HUNT-EPROLO-OFFICIAL-CATEGORY-TREE-SAFE-2026-09-23.json";
const officialTree=fs.existsSync(OFFICIAL_TREE)?JSON.parse(fs.readFileSync(OFFICIAL_TREE,"utf8")):{exact_mapping:{}};
const officialExact=officialTree.exact_mapping||{};
const apiErrorRails=new Set();
for(const meta of Object.values(tax.scan_meta||{})){
  if(meta?.stop_reason==="API_ERROR")for(const rail of meta.rails||[])apiErrorRails.add(rail);
}

const products=[];
for(const dep of shelves.departments||[]){
  for(const cat of dep.categories||[]){
    for(const p of cat.products||[]){
      const key=p.provider+":"+String(p.item_id||"");
      const conflict=taxonomyConflict.get(key);
      products.push({
        provider:p.provider,item_id:String(p.item_id||""),title:p.title||"",
        image_url:p.image_url||null,
        current_department:dep.slug,current_category:cat.slug,
        current_rail:dep.slug+"/"+cat.slug,
        supplier_taxonomy_current_rail_verified:!!(taxKeep.get(key)&&taxKeep.get(key)?.current_rail===dep.slug+"/"+cat.slug),
        supplier_taxonomy_conflict_current_rail:!!(conflict&&conflict.current_rail===dep.slug+"/"+cat.slug),
        supplier_taxonomy_suggested_rail:Array.isArray(conflict?.suggested_rail)?conflict.suggested_rail[0]:(conflict?.suggested_rail||null),
        supplier_category_id:taxKeep.get(key)?.supplier_category_id||conflict?.supplier_category_id||null,
        source_evidence:p.source_evidence||null
      });
    }
  }
}
const audited=gate.audit(products);
const unknown=audited.rows.filter(x=>x.placement?.placement_action==="HOLD_UNKNOWN");

const railCounts=new Map();
for(const x of unknown)railCounts.set(x.current_rail,(railCounts.get(x.current_rail)||0)+1);

function primaryRoute(x){
  if(x.provider==="EPROLO"){
    if(officialExact[x.current_rail])return "EPROLO_PUBLIC_DETAIL_TAXONOMY";
    if(railMapping[x.current_rail]){
      return apiErrorRails.has(x.current_rail)?"EPROLO_TAXONOMY_RETRY":"EPROLO_TAXONOMY_DEEPER_SCAN";
    }
    return "EPROLO_CATEGORY_MAPPING_NEEDED";
  }
  if(x.provider==="CJdropshipping")return "CJ_OFFICIAL_DETAIL_TAXONOMY_REFRESH";
  if(x.provider==="Gooten")return "GOOTEN_METADATA_REFRESH";
  return "OTHER_SUPPLIER_METADATA_REFRESH";
}
function priority(x){
  const n=railCounts.get(x.current_rail)||0;
  const commerceBoost=["women","men","tech","beauty","home","kids"].includes(x.current_department)?20:0;
  const visualBoost=x.image_url?5:0;
  return n+commerceBoost+visualBoost;
}

const queue=unknown.map(x=>({
  provider:x.provider,item_id:x.item_id,title:x.title,image_url:x.image_url,
  current_department:x.current_department,current_category:x.current_category,current_rail:x.current_rail,
  primary_resolution_route:primaryRoute(x),
  secondary_resolution_route:x.image_url?"VISUAL_EVIDENCE_SECONDARY":"OWNER_REVIEW",
  visual_evidence_authority:"ASSIST_ONLY_REQUIRES_SECOND_SOURCE",
  priority_score:priority(x),
  placement_state:"UNKNOWN",
  production_effect:false
})).sort((a,b)=>b.priority_score-a.priority_score||a.current_rail.localeCompare(b.current_rail));

const routeCounts={};
const providerCounts={};
for(const x of queue){
  routeCounts[x.primary_resolution_route]=(routeCounts[x.primary_resolution_route]||0)+1;
  providerCounts[x.provider]=(providerCounts[x.provider]||0)+1;
}
const topRails=[...railCounts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,40).map(([rail,count])=>({rail,count}));

const out={
  version:"HUNT-PRODUCT-PLACEMENT-STAGE4-QUEUE-V1",
  date:"2026-09-23",mode:"SHADOW_ALWAYS_ON",production_effect:false,
  summary:{
    unknown_total:queue.length,
    providers:providerCounts,
    primary_routes:routeCounts,
    visual_secondary_candidates:queue.filter(x=>x.image_url).length,
    top_unknown_rails:topRails.slice(0,15)
  },
  rules:[
    "No UNKNOWN is forced into a category.",
    "Official supplier metadata is preferred over additional keyword expansion.",
    "Visual evidence is secondary and requires agreement with another independent source.",
    "Current HUNT category is not evidence.",
    "No Production mutation or automatic move."
  ],
  top_unknown_rails:topRails,
  queue
};
fs.writeFileSync(OUT,JSON.stringify(out,null,2)+"\n");
console.log(JSON.stringify(out.summary,null,2));
