import fs from "fs";
import vm from "vm";
import path from "path";
const ROOT=process.cwd();
const SOURCE="/Users/adichehade/.hunt-final-candidate-v1";
const STAGING=path.join(SOURCE,"catalog-staging");
const outFile=path.join(ROOT,"evidence/HUNT-FULL-SHELVES-STYLIST-SHADOW-2026-09-23.json");
const mapSrc=fs.readFileSync(path.join(SOURCE,"hunt-department-map-v1.js"),"utf8");
const ctx={window:{HuntCore:{categoryDefs:{}}}};
vm.createContext(ctx);vm.runInContext(mapSrc,ctx);
const H=ctx.window.HuntDepartmentMap;
const defs=ctx.window.HuntCore.categoryDefs;
const deptContract=JSON.parse(fs.readFileSync("boom-shelf-department-contract.json","utf8"));
const truthMatrix=JSON.parse(fs.readFileSync("evidence/HUNT-EPROLO-GLOBAL-PRODUCT-MARKET-MATRIX-2026-09-23.json","utf8"));
const truthIds=new Set(truthMatrix.products.map(x=>String(x.product_id)));
const blocked=/\b(weapon|knife|blade|gun|firearm|ammo|ammunition|vape|cigarette|nicotine|cbd|thc|adult|hunting)\b/i;
const specialCategories={
  camping:["camping-shelter","camping-sleep","camping-lighting","camping-cook","outdoors"],
  electrical:["home-appliances","electrical-lighting","electrical-accessories"]
};
const score=p=>{
  const truth=truthIds.has(String(p.item_id))?1000000:0;
  return truth+(Number(p.preview_score)||0)*100+(Number(p.curation_score)||Number(p.selection_score)||0)*10+(Number(p.image_count)||0);
};
const routes=new Map();
let sourceRows=0,blockedRows=0,noImage=0,unclassified=0;
for(const d of deptContract.departments){
  const dept=d.slug,file=path.join(STAGING,dept+".json");
  if(!fs.existsSync(file))continue;
  const rows=(JSON.parse(fs.readFileSync(file,"utf8")).products||[]);
  sourceRows+=rows.length;
  const cats=specialCategories[dept]||H.departments[dept]||[];
  for(const p of rows){
    const id=String(p.item_id||p.supplier_record_id||"");
    const key=String(p.provider||"UNKNOWN")+":"+id;
    if(!id)continue;
    if(!p.image_url){noImage++;continue;}
    if(blocked.test(String(p.title||"")+" "+String(p.category||""))){blockedRows++;continue;}
    if(p.availability_verified!==true)continue;
    const raw=String(p.category||"");
    const primary=(String(p.primary_department||p.department||"")===dept && String(p.shelf_role||"PRIMARY")==="PRIMARY");
    const matches=[];
    for(const c of cats){
      try{if(H.matches(c,p))matches.push(c)}catch{}
    }
    let chosen=null,routeStrength=0;
    if(primary && cats.includes(raw)){
      const spec=H.specs[raw];
      // If a canonical category has semantic term rules, it must pass them.
      if(!spec || !spec.term || matches.includes(raw)){chosen=raw;routeStrength=140;}
    }
    if(!chosen && matches.length){chosen=matches[0];routeStrength=primary?120:90;}
    if(!chosen){unclassified++;continue;}
    const candidate={
      provider:String(p.provider||"UNKNOWN"),
      item_id:id,
      department:dept,
      department_title:d.title,
      category:chosen,
      category_title:(defs[chosen]&&defs[chosen].title)||chosen,
      title:String(p.title||"Untitled product"),
      image_url:String(p.image_url),
      availability_verified:true,
      availability_basis:String(p.availability_basis||"CATALOG_SNAPSHOT"),
      inventory_snapshot:Number(p.inventory_snapshot||p.stock_quantity||0)||null,
      supplier_cost_min:Number(p.supplier_cost_min??p.price_amount??0)||null,
      currency:String(p.currency||"USD"),
      variant_count:Number(p.variant_count||0)||null,
      image_count:Number(p.image_count||0)||null,
      truth_state:truthIds.has(id)?"GLOBAL_PRODUCT_TRUTH":"CATALOG_SHADOW_DESTINATION_RECHECK",
      checkout_status:String(p.checkout_status||"PRODUCT_DETAIL_RECHECK_REQUIRED"),
      production_exposure:false,
      _routeStrength:routeStrength,
      _score:score(p)
    };
    const old=routes.get(key);
    if(!old || candidate._routeStrength>old._routeStrength || (candidate._routeStrength===old._routeStrength && candidate._score>old._score)){
      routes.set(key,candidate);
    }
  }
}
const grouped={};
for(const d of deptContract.departments){
  const cats=specialCategories[d.slug]||H.departments[d.slug]||[];
  grouped[d.slug]={
    slug:d.slug,title:d.title,
    canonical_categories:cats.map(c=>({slug:c,title:(defs[c]&&defs[c].title)||c})),
    categories:Object.fromEntries(cats.map(c=>[c,[]]))
  };
}
for(const p of routes.values()){
  if(grouped[p.department]?.categories[p.category])grouped[p.department].categories[p.category].push(p);
}
let selectedProducts=0,totalCategoryRails=0,thinRails=0;
const departments=[];
for(const d of deptContract.departments){
  const g=grouped[d.slug],categoryRows=[];
  for(const c of g.canonical_categories){
    const all=(g.categories[c.slug]||[]).sort((a,b)=>b._score-a._score || a.title.localeCompare(b.title));
    if(!all.length)continue;
    const clean=all.map(x=>{const y={...x};delete y._score;delete y._routeStrength;return y;});
    const initialShown=Math.min(24,clean.length);
    selectedProducts+=initialShown;totalCategoryRails++;if(all.length<6)thinRails++;
    categoryRows.push({
      slug:c.slug,title:c.title,
      clean_candidate_count:all.length,
      initial_shown_count:initialShown,
      density_state:all.length>=24?"FULL":all.length>=6?"GOOD":"THIN",
      products:clean
    });
  }
  const heroPool=categoryRows.flatMap(c=>c.products.map(p=>({...p,_cat:c.slug})));
  heroPool.sort((a,b)=>(b.truth_state==="GLOBAL_PRODUCT_TRUTH")-(a.truth_state==="GLOBAL_PRODUCT_TRUTH") || String(a.title).localeCompare(String(b.title)));
  const hero=heroPool[0]||null;
  departments.push({
    slug:d.slug,title:d.title,
    clean_candidate_count:categoryRows.reduce((s,c)=>s+c.clean_candidate_count,0),
    category_rails:categoryRows.length,
    initial_shown_products:categoryRows.reduce((s,c)=>s+c.initial_shown_count,0),
    hero,
    categories:categoryRows
  });
}
const out={
  version:"HUNT-FULL-SHELVES-STYLIST-SHADOW-V1",
  date:"2026-09-23",
  mode:"FULL_VISUAL_SHADOW_PREVIEW",
  production_effect:false,
  source:{
    staging:"/Users/adichehade/.hunt-final-candidate-v1/catalog-staging",
    taxonomy:"/Users/adichehade/.hunt-final-candidate-v1/hunt-department-map-v1.js",
    departments:"boom-shelf-department-contract.json",
    product_truth:"evidence/HUNT-EPROLO-GLOBAL-PRODUCT-MARKET-MATRIX-2026-09-23.json"
  },
  rules:[
    "One canonical department per product in this preview.",
    "One canonical category per product in this preview.",
    "Unclassified and globally blocked terms are suppressed.",
    "No cross-department filler is used to make a shelf look full.",
    "Global Product Truth products are visually prioritized when present.",
    "Catalog Shadow products require destination shipping/profit/detail recheck before commercial use.",
    "BOOM Stylist may arrange products but may not reclassify taxonomy.",
    "No Production shelf mutation, checkout activation or fulfillment."
  ],
  summary:{
    canonical_departments:departments.length,
    departments_with_products:departments.filter(x=>x.clean_candidate_count>0).length,
    globally_unique_routed_products:routes.size,
    source_rows:sourceRows,
    blocked_rows:blockedRows,
    no_image_rows:noImage,
    unclassified_occurrences:unclassified,
    category_rails:totalCategoryRails,
    thin_rails:thinRails,
    initial_shown_product_cards:selectedProducts,
    total_browsable_product_cards:routes.size,
    global_truth_products_available:truthIds.size,
    production_live_products:0
  },
  departments
};
fs.writeFileSync(outFile,JSON.stringify(out,null,2)+"\n");
console.log(JSON.stringify(out.summary,null,2));
for(const d of departments)console.log(d.slug,d.clean_candidate_count,"candidates",d.category_rails,"rails",d.initial_shown_products,"initial shown");
