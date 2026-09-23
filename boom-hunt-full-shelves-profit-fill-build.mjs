import fs from "fs";
import path from "path";
import vm from "vm";

const ROOT=process.cwd();
const SOURCE="/Users/adichehade/.hunt-final-candidate-v1";
const BASELINE="evidence/HUNT-FULL-SHELVES-STYLIST-SHADOW-BASE-2026-09-23.json";
const STRICT="evidence/HUNT-SHADOW-SHELF-PROFIT-FILL-2026-09-23.json";
const EXPANSION=path.join(SOURCE,"hunt-eprolo-department-expansion-v2.json");
const FINAL_GAP=path.join(SOURCE,"hunt-eprolo-final-gap-fill-v3.json");
const GENERAL_GAP=path.join(SOURCE,"hunt-eprolo-gap-fill-v1.json");
const THIN_PULL="evidence/HUNT-EPROLO-THIN-RAIL-PULL-2026-09-23.json";
const THIN_SHIPPING="evidence/HUNT-EPROLO-THIN-RAIL-SHIPPING-VERIFY-2026-09-23.json";
const EPROLO_DEEP_VERIFY="evidence/HUNT-EPROLO-MEN-WOMEN-DEEP-SHIPPING-VERIFY-2026-09-23.json";
const CJ_THIN_SELECTION="evidence/HUNT-CJ-THIN-RAIL-SELECTION-2026-09-23.json";
const TARGET=24;
const BLOCKED=/\b(weapon|gun|firearm|ammo|ammunition|knife|blade|dagger|sword|machete|taser|pepper spray|mace|firework|explosives|explosive device|explosive material|vape|cigarette|nicotine|cbd|thc|cannabis|marijuana|adult|porn|steroid|diet pill|laxative|slimming|weight[- ]?loss|camp stove|gas stove|fuel canister|lighter|torch burner)\b/i;

const baseline=JSON.parse(fs.readFileSync(BASELINE,"utf8"));
const deptContract=JSON.parse(fs.readFileSync("boom-shelf-department-contract.json","utf8"));
const truthMatrix=JSON.parse(fs.readFileSync("evidence/HUNT-EPROLO-GLOBAL-PRODUCT-MARKET-MATRIX-2026-09-23.json","utf8"));
const truthIndex=new Map((truthMatrix.products||[]).map(x=>[String(x.product_id),x]));
const cjVerified=JSON.parse(fs.readFileSync("evidence/HUNT-CJ-GAP-FILL-VERIFIED-2026-09-23.json","utf8"));
const cjIndex=new Map((cjVerified.results||[]).map(x=>[String(x.id),x]));

const thinPullData=fs.existsSync(THIN_PULL)?JSON.parse(fs.readFileSync(THIN_PULL,"utf8")):{rails:{}};
const thinVariantIndex=new Map();
for(const rows of Object.values(thinPullData.rails||{})){
  for(const row of rows||[])thinVariantIndex.set(String(row.item_id),row);
}
const thinShippingData=fs.existsSync(THIN_SHIPPING)?JSON.parse(fs.readFileSync(THIN_SHIPPING,"utf8")):{results:[]};
const thinShippingIndex=new Map((thinShippingData.results||[]).map(x=>[String(x.item_id),x]));
const deepVerifyData=fs.existsSync(EPROLO_DEEP_VERIFY)?JSON.parse(fs.readFileSync(EPROLO_DEEP_VERIFY,"utf8")):{results:[]};
const deepVerifyIndex=new Map((deepVerifyData.results||[]).filter(x=>x.status==="VERIFIED_4_OF_4").map(x=>[String(x.item_id),x]));

const mapSrc=fs.readFileSync(path.join(SOURCE,"hunt-department-map-v1.js"),"utf8");
const ctx={window:{HuntCore:{categoryDefs:{}}}};
vm.createContext(ctx); vm.runInContext(mapSrc,ctx);
const H=ctx.window.HuntDepartmentMap;
const defs=ctx.window.HuntCore.categoryDefs;
const specialCategories={
  camping:["camping-shelter","camping-sleep","camping-lighting","camping-cook","outdoors"],
  electrical:["home-appliances","electrical-lighting","electrical-accessories"]
};

function catsFor(dep){ return specialCategories[dep]||H.departments[dep]||[]; }
function priceGate(cost){
  cost=Number(cost);
  if(!Number.isFinite(cost)||cost<=0)return null;
  const reserve=.91,minProfit=4,targetMargin=.35;
  const raw=Math.max((cost+minProfit)/reserve,cost/(reserve-targetMargin));
  const retail=Math.max(.99,Math.ceil(raw+.01)-.01);
  const contribution=retail*reserve-cost;
  return {
    state:"PROJECTED_PRODUCT_CONTRIBUTION_ONLY",
    supplier_cost_usd:+cost.toFixed(2),
    target_retail_shadow_usd:+retail.toFixed(2),
    projected_product_contribution_usd:+contribution.toFixed(2),
    projected_product_margin:+(contribution/retail).toFixed(4),
    payment_refund_reserve_rate:.09,
    shipping_priced_separately:true,
    final_profit_verified:false,
    final_profit_blockers:["DESTINATION_SHIPPING_OR_ORDER_COST_RECHECK","TAX_IMPORT_RECHECK","FX_RECHECK","REALIZED_RETURN_COST_UNKNOWN","MARKETING_COST_UNKNOWN"]
  };
}
function cleanProduct(p,sourceLabel,routeStrength=150){
  const cost=Number(p.supplier_cost_min??p.price_amount??p.profit_truth?.supplier_cost_usd);
  const id=String(p.item_id||p.product_id||p.id||"");
  const provider=String(p.provider||"EPROLO");
  const title=String(p.title||"").trim();
  if(!id||!title||!p.image_url||BLOCKED.test(title+" "+String(p.category||"")))return null;
  if(p.availability_verified!==true && provider!=="CJdropshipping")return null;
  const pg=priceGate(cost);
  if(!pg)return null;
  const catalogPriceProvisional=
    p.catalog_price_provisional===true ||
    p.profit_truth?.state==="PROVISIONAL_CATALOG_PRICE_PROJECTION" ||
    p.supplier_cost_truth==="PROVISIONAL_CATALOG_PRODUCT_PRICE";
  const cj=cjIndex.get(id);
  const deepVerified=deepVerifyIndex.get(id);
  const ep=truthIndex.get(id);
  const thinVariant=thinVariantIndex.get(id)?.exact_variant||p.exact_variant||deepVerified?.exact_variant||null;
  const thinShip=thinShippingIndex.get(id);
  const inlineShip=p.destination_shipping||deepVerified?.markets||null;
  let shippingTruth="UNKNOWN";
  let exactVariantTruth=thinVariant?.id?"VERIFIED":"UNKNOWN";
  let marketCoverage=[];
  if(cj){
    const source=cj;
    marketCoverage=["IL","DE","US","SG"].filter(cc=>source.markets?.[cc]?.state==="STOCK_SHIPPING_VERIFIED");
    if(marketCoverage.length===4){shippingTruth="VERIFIED";exactVariantTruth="VERIFIED";}
  }else if(thinShip){
    marketCoverage=["IL","DE","US","SG"].filter(cc=>thinShip.markets?.[cc]?.state==="STOCK_SHIPPING_VERIFIED");
    if(marketCoverage.length){shippingTruth=marketCoverage.length===4?"VERIFIED":"PROVISIONAL";}
    if(thinShip.exact_variant?.id)exactVariantTruth="VERIFIED";
  }else if(inlineShip){
    marketCoverage=["IL","DE","US","SG"].filter(cc=>inlineShip?.[cc]?.state==="STOCK_SHIPPING_VERIFIED");
    if(marketCoverage.length){shippingTruth=marketCoverage.length===4?"VERIFIED":"PROVISIONAL";}
  }else if(ep){
    const count=["IL","DE","US","SG"].filter(cc=>ep.market_truth?.[cc]?.shipping?.cost_usd!=null).length;
    if(count){shippingTruth="PROVISIONAL";marketCoverage=["IL","DE","US","SG"].filter(cc=>ep.market_truth?.[cc]?.shipping?.cost_usd!=null);}
  }
  return {
    provider,id,item_id:id,
    department:String(p.department||""),
    department_title:String(p.department_title||""),
    category:String(p.category||""),
    category_title:String(p.category_title||""),
    title,image_url:String(p.image_url),
    availability_verified:p.availability_verified===true||provider==="CJdropshipping",
    availability_basis:String(p.availability_basis||sourceLabel),
    inventory_snapshot:Number(p.inventory_snapshot||0)||null,
    supplier_cost_min:cost,
    currency:String(p.currency||"USD"),
    variant_count:Number(p.variant_count||0)||null,
    image_count:Number(p.image_count||0)||null,
    truth_state:String(p.truth_state||"CATALOG_SHADOW_DESTINATION_RECHECK"),
    checkout_status:"DISABLED_PROFIT_TRUTH_RECHECK_REQUIRED",
    production_exposure:false,
    shelf_state:"SHELF_SHADOW_READY",
    sell_state:(shippingTruth==="VERIFIED"&&exactVariantTruth==="VERIFIED")?"GATE_READY_FINAL_PROFIT_RECHECK":"DESTINATION_VARIANT_SHIPPING_RECHECK_REQUIRED",
    exact_variant:thinVariant||thinShip?.exact_variant||null,
    market_truth_summary:{shipping_truth:shippingTruth,exact_variant_truth:exactVariantTruth,markets_with_shipping:marketCoverage},
    destination_shipping:thinShip?thinShip.markets:(inlineShip||null),
    supplier_cost_truth:catalogPriceProvisional?"PROVISIONAL_CATALOG_PRODUCT_PRICE":"VERIFIED_SUPPLIER_COST_INPUT",
    profit_truth:{
      ...pg,
      state:catalogPriceProvisional?"PROVISIONAL_CATALOG_PRICE_PROJECTION":pg.state,
      final_profit_blockers:shippingTruth==="VERIFIED"
        ? pg.final_profit_blockers.filter(x=>x!=="DESTINATION_SHIPPING_OR_ORDER_COST_RECHECK").concat(["SUPPLIER_FINAL_ORDER_COST_RECHECK"])
        : pg.final_profit_blockers
    },
    source_evidence:String(p.source_evidence||sourceLabel),
    _routeStrength:routeStrength,
    _score:(Number(p.curation_score)||Number(p.selection_score)||Number(p.preview_score)||0)*100+(Number(p.image_count)||0)
  };
}
function canonicalCategory(dep,p){
  const requested=String(p.category||"");
  const cats=catsFor(dep);
  if(requested&&cats.includes(requested))return requested;
  const matches=[];
  for(const c of cats){
    try{ if(H.matches(c,p)) matches.push(c); }catch{}
  }
  return matches[0]||null;
}
function freshJson(file){
  if(!fs.existsSync(file))return null;
  const d=JSON.parse(fs.readFileSync(file,"utf8"));
  const stamp=String(d.generated_at||d.date||"");
  if(!stamp.startsWith("2026-09-23"))return null;
  return d;
}

const byRail=new Map();
const used=new Set();
const departmentMeta=new Map(deptContract.departments.map(d=>[d.slug,d]));

function ensureRail(dep,cat){
  const key=dep+"/"+cat;
  if(!byRail.has(key))byRail.set(key,[]);
  return byRail.get(key);
}
for(const d of deptContract.departments){
  for(const c of catsFor(d.slug))ensureRail(d.slug,c);
}

for(const dep of baseline.departments||[]){
  for(const cat of dep.categories||[]){
    for(const raw of cat.products||[]){
      const p=cleanProduct({...raw,department:dep.slug,category:cat.slug},"BASELINE_FULL_SHELVES",100);
      if(!p)continue;
      p.department_title=dep.title;
      p.category_title=cat.title;
      const key=p.provider+":"+p.item_id;
      if(used.has(key))continue;
      used.add(key); ensureRail(dep.slug,cat.slug).push(p);
    }
  }
}

const sourceCandidates=[];
if(fs.existsSync(STRICT)){
  const d=JSON.parse(fs.readFileSync(STRICT,"utf8"));
  for(const p of d.products||[])sourceCandidates.push({...p,_source:"STRICT_SEMANTIC_OVERLAY",_route:190});
}
for(const [file,label] of [[EXPANSION,"FRESH_EPROLO_DEPARTMENT_EXPANSION"],[FINAL_GAP,"FRESH_EPROLO_FINAL_GAP"]]){
  const d=freshJson(file);
  if(!d)continue;
  for(const rows of Object.values(d.departments||{})){
    for(const p of rows||[])sourceCandidates.push({...p,_source:label,_route:180});
  }
}
const general=freshJson(GENERAL_GAP);
if(general){
  for(const [dep,rows] of Object.entries(general.departments||{})){
    for(const p of rows||[])sourceCandidates.push({...p,department:dep,_source:"FRESH_EPROLO_GENERAL_GAP",_route:170});
  }
}

if(fs.existsSync(THIN_PULL)){
  const thin=JSON.parse(fs.readFileSync(THIN_PULL,"utf8"));
  for(const [rail,rows] of Object.entries(thin.rails||{})){
    const [department,category]=rail.split("/");
    for(const p of rows||[])sourceCandidates.push({...p,department,category,_source:"FRESH_EPROLO_THIN_RAIL_PULL",_route:230});
  }
}

if(fs.existsSync(EPROLO_DEEP_VERIFY)){
  const verified=JSON.parse(fs.readFileSync(EPROLO_DEEP_VERIFY,"utf8"));
  for(const p of verified.results||[]){
    if(p.status!=="VERIFIED_4_OF_4")continue;
    sourceCandidates.push({
      provider:"EPROLO",item_id:String(p.item_id),department:String(p.department),category:String(p.category),
      title:p.title,image_url:p.image_url,availability_verified:true,
      availability_basis:"FRESH_EPROLO_DEEP_4_MARKET_VERIFY",
      inventory_snapshot:Number(p.exact_variant?.inventory_quantity||p.inventory_snapshot||0)||null,
      supplier_cost_min:Number(p.exact_variant?.supplier_cost_usd||p.supplier_cost_min)||null,
      currency:"USD",variant_count:Number(p.variant_count||0)||null,image_count:Number(p.image_count||0)||null,
      exact_variant:p.exact_variant,destination_shipping:p.markets,
      source_evidence:"evidence/HUNT-EPROLO-MEN-WOMEN-DEEP-SHIPPING-VERIFY-2026-09-23.json",
      _source:"FRESH_EPROLO_DEEP_4_MARKET_VERIFY",_route:280
    });
  }
}

if(fs.existsSync(CJ_THIN_SELECTION)){
  const selected=JSON.parse(fs.readFileSync(CJ_THIN_SELECTION,"utf8"));
  for(const p of selected.products||[]){
    sourceCandidates.push({
      provider:"CJdropshipping",item_id:String(p.item_id),department:String(p.department),category:String(p.category),
      title:p.title,image_url:p.image_url,availability_verified:p.availability_verified===true,
      availability_basis:"CJ_FOCUSED_OFFICIAL_CATALOG_SHADOW_ONLY",
      inventory_snapshot:Number(p.stock_quantity||0)||null,
      supplier_cost_min:Number(p.price_amount)||null,currency:String(p.currency||"USD"),
      variant_count:Number(p.variant_count||0)||null,image_count:null,
      catalog_price_provisional:true,
      source_evidence:"evidence/HUNT-CJ-THIN-RAIL-SELECTION-2026-09-23.json",
      _source:"CJ_CATALOG_SHADOW_ONLY",_route:240
    });
  }
}

const pools=new Map();
for(const raw of sourceCandidates){
  const dep=String(raw.department||raw.primary_department||"");
  if(!departmentMeta.has(dep))continue;
  const cat=canonicalCategory(dep,raw);
  if(!cat)continue;
  const key=String(raw.provider||"EPROLO")+":"+String(raw.item_id||raw.product_id||raw.id||"");
  if(used.has(key))continue;
  const p=cleanProduct({...raw,department:dep,category:cat},raw._source,raw._route);
  if(!p)continue;
  p.department_title=departmentMeta.get(dep).title;
  p.category_title=(defs[cat]&&defs[cat].title)||cat;
  const rail=dep+"/"+cat;
  if(!pools.has(rail))pools.set(rail,[]);
  pools.get(rail).push(p);
}
for(const arr of pools.values()){
  arr.sort((a,b)=>b._routeStrength-a._routeStrength||b._score-a._score||a.title.localeCompare(b.title));
}

let added=0;
for(const [rail,arr] of pools){
  const target=ensureRail(...rail.split("/"));
  const need=Math.max(0,TARGET-target.length);
  for(const p of arr){
    if(target.length>=TARGET)break;
    const key=p.provider+":"+p.item_id;
    if(used.has(key))continue;
    target.push(p);used.add(key);added++;
  }
}

const departments=[];
let rails=0,full24=0,good12=0,thin=0,zero=0;
let totalProducts=0, projected=0, provisionalPrice=0, finalProfitVerified=0, gateReady=0;
for(const d of deptContract.departments){
  const categories=[];
  for(const c of catsFor(d.slug)){
    const list=ensureRail(d.slug,c).sort((a,b)=>{
      const ta=a.market_truth_summary.shipping_truth==="VERIFIED"?2:a.market_truth_summary.shipping_truth==="PROVISIONAL"?1:0;
      const tb=b.market_truth_summary.shipping_truth==="VERIFIED"?2:b.market_truth_summary.shipping_truth==="PROVISIONAL"?1:0;
      return tb-ta || (b.profit_truth?.projected_product_margin||0)-(a.profit_truth?.projected_product_margin||0) || a.title.localeCompare(b.title);
    });
    rails++;
    if(list.length>=24)full24++; else if(list.length>=12)good12++; else if(list.length===0)zero++; else thin++;
    totalProducts+=list.length;
    projected+=list.filter(p=>p.profit_truth?.state==="PROJECTED_PRODUCT_CONTRIBUTION_ONLY").length;
    provisionalPrice+=list.filter(p=>p.profit_truth?.state==="PROVISIONAL_CATALOG_PRICE_PROJECTION").length;
    finalProfitVerified+=list.filter(p=>p.profit_truth?.final_profit_verified===true).length;
    gateReady+=list.filter(p=>p.sell_state==="GATE_READY_FINAL_PROFIT_RECHECK").length;
    categories.push({
      slug:c,
      title:(defs[c]&&defs[c].title)||c,
      clean_candidate_count:list.length,
      initial_shown_count:Math.min(24,list.length),
      density_state:list.length>=24?"FULL":list.length>=12?"GOOD":list.length>0?"THIN":"EMPTY",
      products:list.map(p=>{const x={...p};delete x.id;delete x._routeStrength;delete x._score;return x;})
    });
  }
  const nonEmpty=categories.flatMap(c=>c.products.map(p=>({...p,_category:c.slug})));
  const hero=nonEmpty.find(p=>p.market_truth_summary?.shipping_truth==="VERIFIED")||nonEmpty[0]||null;
  departments.push({
    slug:d.slug,title:d.title,
    clean_candidate_count:categories.reduce((s,c)=>s+c.clean_candidate_count,0),
    category_rails:categories.length,
    initial_shown_products:categories.reduce((s,c)=>s+c.initial_shown_count,0),
    hero,categories
  });
}
const uniqueProducts=new Set();
for(const d of departments)for(const c of d.categories)for(const p of c.products)uniqueProducts.add(p.provider+":"+p.item_id);

const out={
  version:"HUNT-FULL-SHELVES-PROFIT-FILL-SHADOW-V2",
  date:"2026-09-23",
  mode:"FULL_VISUAL_SHADOW_PREVIEW",
  production_effect:false,
  target_products_per_rail:TARGET,
  source:{
    baseline:BASELINE,
    strict_overlay:STRICT,
    fresh_eprolo_department_expansion:fs.existsSync(EXPANSION)?EXPANSION:null,
    fresh_eprolo_final_gap:fs.existsSync(FINAL_GAP)?FINAL_GAP:null,
    fresh_eprolo_general_gap:general?GENERAL_GAP:null,
    fresh_eprolo_thin_rail_pull:fs.existsSync(THIN_PULL)?THIN_PULL:null,
    fresh_eprolo_thin_rail_shipping:fs.existsSync(THIN_SHIPPING)?THIN_SHIPPING:null,
    fresh_eprolo_deep_verify:fs.existsSync(EPROLO_DEEP_VERIFY)?EPROLO_DEEP_VERIFY:null,
    cj_catalog_shadow_selection:fs.existsSync(CJ_THIN_SELECTION)?CJ_THIN_SELECTION:null,
    cj_truth:"evidence/HUNT-CJ-GAP-FILL-VERIFIED-2026-09-23.json",
    eprolo_market_truth:"evidence/HUNT-EPROLO-GLOBAL-PRODUCT-MARKET-MATRIX-2026-09-23.json"
  },
  summary:{
    canonical_departments:departments.length,
    category_rails:rails,
    rails_full_24:full24,
    rails_good_12_to_23:good12,
    rails_thin_1_to_11:thin,
    rails_empty:zero,
    newly_added_unique_products:added,
    globally_unique_products:uniqueProducts.size,
    total_category_occurrences:totalProducts,
    projected_product_contribution_checked:projected,
    provisional_catalog_price_projections:provisionalPrice,
    gate_ready_final_profit_recheck_products:gateReady,
    final_profit_verified_products:finalProfitVerified,
    checkout_live:0,
    payment_live:0,
    fulfillment_live:0
  },
  profit_semantics:{
    projected_product_contribution:"Supplier-cost Price Gate V2 projection after 9% payment/refund reserve; shipping priced separately.",
    final_profit_verified:"Requires complete attributed cost truth including destination shipping/order cost, tax/import where applicable, FX, marketing, realized returns/refunds and other variable costs.",
    rule:"PROJECTED_PRODUCT_CONTRIBUTION is never labeled realized or final net profit."
  },
  rules:[
    "Only supplier-backed products with image, positive supplier cost and catalog availability enter Shadow shelves.",
    "Every product keeps one canonical department and one canonical category.",
    "Restricted/dangerous/adult/nicotine/drug/weapon products are excluded.",
    "Fresh supplier pulls may fill thin shelves only when canonical routing succeeds.",
    "Target shelf density is 24 products per canonical rail where real matching supply exists.",
    "Unknown exact variant or destination shipping blocks SELL_READY but does not block Shadow shelf display.",
    "No Production shelf mutation, checkout activation, payment activation, supplier order or fulfillment."
  ],
  departments
};

fs.writeFileSync("evidence/HUNT-FULL-SHELVES-STYLIST-SHADOW-2026-09-23.json",JSON.stringify(out,null,2)+"\n");
console.log(JSON.stringify(out.summary,null,2));
for(const d of departments){
  const gaps=d.categories.filter(c=>c.clean_candidate_count<24);
  if(gaps.length)console.log(d.slug,gaps.map(c=>c.slug+":"+c.clean_candidate_count).join(", "));
}
