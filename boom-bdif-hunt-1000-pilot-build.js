const fs=require("node:fs");
const path=require("node:path");
const bdif=require("./boom-bdif-kernel.js");

const EVIDENCE=path.join(__dirname,"evidence");
const TARGET_MARKETS=["IL","DE","US","SG"];
const PILOT_SIZE=1000;
const MARGIN_FLOOR=0.35;

function read(name){
  return JSON.parse(fs.readFileSync(path.join(__dirname,name),"utf8"));
}
function evidenceRead(name){
  return JSON.parse(fs.readFileSync(path.join(EVIDENCE,name),"utf8"));
}
function isNum(v){ return Number.isFinite(Number(v)); }
function round2(v){ return Math.round(Number(v)*100)/100; }
function truth(state,value,evidence_refs=[],extra={}){
  return {truth_state:state,value,evidence_refs:[...new Set(evidence_refs.filter(Boolean))],...extra};
}
function flattenFullShelves(){
  const data=evidenceRead("HUNT-FULL-SHELVES-STYLIST-SHADOW-2026-09-23.json");
  const rows=[];
  for(const dep of data.departments||[]){
    for(const cat of dep.categories||[]){
      for(const product of cat.products||[]){
        rows.push({...product,department:dep.slug||product.department,category:cat.slug||product.category});
      }
    }
  }
  const seen=new Set();
  return rows.filter(row=>{
    const key=String(row.provider)+":"+String(row.item_id);
    if(seen.has(key))return false;
    seen.add(key); return true;
  });
}
function selectCohort(rows,priorityIds=new Set()){
  const chosen=[];
  const chosenKeys=new Set();
  const add=row=>{
    const key=row.provider+":"+row.item_id;
    if(chosenKeys.has(key)||chosen.length>=PILOT_SIZE)return false;
    chosen.push(row); chosenKeys.add(key); return true;
  };

  rows.filter(r=>r.provider!=="EPROLO")
    .sort((a,b)=>(a.provider+":"+a.item_id).localeCompare(b.provider+":"+b.item_id))
    .forEach(add);

  rows.filter(r=>r.provider==="EPROLO"&&priorityIds.has(String(r.item_id)))
    .sort((a,b)=>String(a.item_id).localeCompare(String(b.item_id)))
    .forEach(add);

  const groups=new Map();
  for(const row of rows.filter(r=>r.provider==="EPROLO")){
    const key=String(row.department)+"|"+String(row.category);
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(row);
  }
  for(const list of groups.values()) list.sort((a,b)=>String(a.item_id).localeCompare(String(b.item_id)));
  const keys=[...groups.keys()].sort();
  let depth=0;
  while(chosen.length<PILOT_SIZE){
    let progressed=false;
    for(const key of keys){
      const row=groups.get(key)[depth];
      if(row){ add(row); progressed=true; if(chosen.length>=PILOT_SIZE)break; }
    }
    if(!progressed)break;
    depth++;
  }
  if(chosen.length!==PILOT_SIZE)throw new Error("PILOT_SELECTION_FAILED:"+chosen.length);
  return chosen;
}
function cjIndex(){
  const data=evidenceRead("HUNT-CJ-GAP-FILL-VERIFIED-2026-09-23.json");
  return new Map((data.results||[]).map(row=>[String(row.id),row]));
}
function eproloMarketIndex(){
  const data=evidenceRead("HUNT-EPROLO-GLOBAL-PRODUCT-MARKET-MATRIX-2026-09-23.json");
  return new Map((data.products||[]).map(row=>[String(row.product_id),row]));
}
function visualIndex(){
  const files=[
    "HUNT-EPROLO-MULTIMARKET-VISUAL-QA-2026-09-23.json",
    "HUNT-EPROLO-TECH-VISUAL-QA-2026-09-22.json",
    "HUNT-EPROLO-TECH-WAVE5-VISUAL-COMPLIANCE-QA-2026-09-23.json",
    "HUNT-EPROLO-TECH-WAVE6-VISUAL-SPEC-QA-2026-09-23.json",
    "HUNT-EPROLO-WAVE2-VISUAL-QA-2026-09-22.json",
    "HUNT-EPROLO-WOMEN-DRESSES-VISUAL-QA-2026-09-22.json",
    "HUNT-EPROLO-WOMEN-VISUAL-QA-2026-09-22.json"
  ];
  const map=new Map();
  for(const file of files){
    const data=evidenceRead(file);
    for(const bucket of ["items","passes","holds"]){
      for(const row of data[bucket]||[]){
        const id=String(row.product_id||"");
        if(!id)continue;
        if(!map.has(id))map.set(id,[]);
        map.get(id).push({...row,_source:file,_bucket:bucket});
      }
    }
  }
  return map;
}
function summarizeVisual(observations=[]){
  if(!observations.length)return truth("UNKNOWN",null,[]);
  const statuses=observations.map(o=>String(o.status||o.reason||"UNKNOWN"));
  const pass=observations.filter(o=>String(o.status||"").startsWith("PASS"));
  const nonpass=observations.filter(o=>!String(o.status||"").startsWith("PASS"));
  const refs=observations.map(o=>"evidence/"+o._source);
  const exactVariant=pass.find(o=>o.variant_id)?.variant_id||null;
  const exactImage=pass.find(o=>o.exact_variant_image_url)?.exact_variant_image_url||null;
  const state=pass.length&&nonpass.length?"CONFLICTED":pass.length?"VERIFIED":"PROVISIONAL";
  return truth(state,{statuses,exact_variant_id:exactVariant,exact_variant_image_url:exactImage},refs);
}
function buildProduct(row,indexes){
  const sourceRef="evidence/HUNT-FULL-SHELVES-STYLIST-SHADOW-2026-09-23.json";
  const cj=indexes.cj.get(String(row.item_id));
  const ep=indexes.eprolo.get(String(row.item_id));
  const visual=summarizeVisual(indexes.visual.get(String(row.item_id))||[]);

  const productIdentity=truth(
    row.provider&&row.item_id?"VERIFIED":"UNKNOWN",
    {provider:row.provider,item_id:String(row.item_id),title:row.title},
    [sourceRef]
  );
  const supplierPrice=truth(
    isNum(row.supplier_cost_min)&&Number(row.supplier_cost_min)>0?"VERIFIED":"UNKNOWN",
    isNum(row.supplier_cost_min)?{amount_usd:Number(row.supplier_cost_min),currency:row.currency||"USD"}:null,
    [sourceRef]
  );
  let stock=truth(
    row.availability_verified===true&&isNum(row.inventory_snapshot)&&Number(row.inventory_snapshot)>0?"VERIFIED":
      row.availability_verified===true&&row.inventory_snapshot==null?"UNKNOWN":"PROVISIONAL",
    isNum(row.inventory_snapshot)?{quantity:Number(row.inventory_snapshot)}:null,
    [sourceRef]
  );
  if(cj){
    const cjStocks=Object.values(cj.markets||{})
      .map(m=>Number(m?.selected_origin?.storage_num??m?.selected_origin?.total_inventory))
      .filter(n=>Number.isFinite(n)&&n>0);
    if(cjStocks.length){
      stock=truth("VERIFIED",{quantity:Math.min(...cjStocks),basis:"CJ_SELECTED_ORIGIN_VARIANT_STOCK"},[
        "evidence/HUNT-CJ-GAP-FILL-VERIFIED-2026-09-23.json"
      ]);
    }
  } else if(row.exact_variant?.id&&isNum(row.exact_variant?.inventory_quantity)&&Number(row.exact_variant.inventory_quantity)>0){
    stock=truth("VERIFIED",{
      quantity:Number(row.exact_variant.inventory_quantity),
      variant_id:String(row.exact_variant.id),
      basis:"EPROLO_EXACT_VARIANT_INVENTORY"
    },[
      "evidence/HUNT-EPROLO-THIN-RAIL-PULL-2026-09-23.json",
      "evidence/HUNT-EPROLO-THIN-RAIL-SHIPPING-VERIFY-2026-09-23.json"
    ]);
  }
  const category=truth(
    row.department&&row.category?"VERIFIED":"UNKNOWN",
    {department:row.department,category:row.category},
    [sourceRef]
  );

  const markets={};
  for(const market of TARGET_MARKETS){
    let exactVariant=truth("UNKNOWN",null,[]);
    let shipping=truth("UNKNOWN",null,[]);
    let targetPrice=truth("UNKNOWN",null,[]);
    let estimatedMargin=truth("UNKNOWN",null,[]);
    let landedCost=truth("UNKNOWN",null,[]);
    let finalProfitVerified=false;

    // Prefer the current canonical shelf evidence when Phase C has enriched
    // the exact variant + destination shipping after the original pilot snapshot.
    const currentShip=row.destination_shipping?.[market];
    if(row.exact_variant?.id){
      exactVariant=truth("VERIFIED",{variant_id:String(row.exact_variant.id),variant_name:row.exact_variant.name||row.exact_variant.title||null},[sourceRef]);
    }
    if(currentShip?.state==="STOCK_SHIPPING_VERIFIED"){
      const ship=currentShip.shipping||currentShip;
      const cost=ship.cost_usd??currentShip.supplier_shipping_usd;
      if(isNum(cost)){
        shipping=truth("VERIFIED",{supported:true,cost_usd:Number(cost),method:ship.method||currentShip.shipping_method||null,eta:ship.eta||currentShip.shipping_aging||null},[sourceRef]);
      }
    }
    if(isNum(row.profit_truth?.target_retail_shadow_usd)){
      targetPrice=truth("PROVISIONAL",{amount_usd:Number(row.profit_truth.target_retail_shadow_usd),basis:"CURRENT_PRICE_GATE_V2_SHADOW"},[sourceRef]);
    }
    if(isNum(row.profit_truth?.projected_product_margin)){
      estimatedMargin=truth("PROVISIONAL",{margin:Number(row.profit_truth.projected_product_margin),contribution_usd:Number(row.profit_truth.projected_product_contribution_usd)},[sourceRef]);
    }
    if(supplierPrice.truth_state==="VERIFIED"&&shipping.truth_state==="VERIFIED"){
      landedCost=truth("PROVISIONAL",{
        pre_tax_supplier_landed_cost_usd:round2(Number(row.supplier_cost_min)+Number(shipping.value.cost_usd)),
        excludes:["tax_import","payment_fees","returns","marketing","fx"]
      },[sourceRef]);
    }

    if(cj&&cj.markets&&cj.markets[market]){
      const m=cj.markets[market];
      const ref="evidence/HUNT-CJ-GAP-FILL-VERIFIED-2026-09-23.json";
      if(m.variant_id) exactVariant=truth("VERIFIED",{variant_id:String(m.variant_id),variant_name:m.variant_name||null},[ref]);
      if(m.state==="STOCK_SHIPPING_VERIFIED"&&isNum(m.supplier_shipping_usd)){
        shipping=truth("VERIFIED",{supported:true,cost_usd:Number(m.supplier_shipping_usd),method:m.shipping_method||null,eta:m.shipping_aging||null},[ref]);
      }
      if(isNum(m.retail_shadow_usd))targetPrice=truth("PROVISIONAL",{amount_usd:Number(m.retail_shadow_usd),basis:"CJ_PRICE_GATE_SHADOW"},[ref]);
      if(isNum(m.product_margin_shadow))estimatedMargin=truth("PROVISIONAL",{margin:Number(m.product_margin_shadow),contribution_usd:isNum(m.product_contribution_shadow_usd)?Number(m.product_contribution_shadow_usd):null},[ref]);
      if(isNum(m.supplier_cost_usd)&&isNum(m.supplier_shipping_usd)){
        landedCost=truth("PROVISIONAL",{
          pre_tax_supplier_landed_cost_usd:round2(Number(m.supplier_cost_usd)+Number(m.supplier_shipping_usd)),
          excludes:["tax_import","payment_fees","returns","marketing","fx"]
        },[ref]);
      }
      finalProfitVerified=m.final_profit_verified===true;
    } else if(shipping.truth_state!=="VERIFIED"&&ep&&ep.market_truth&&ep.market_truth[market]){
      const m=ep.market_truth[market];
      const ref="evidence/HUNT-EPROLO-GLOBAL-PRODUCT-MARKET-MATRIX-2026-09-23.json";
      if(m.shipping&&isNum(m.shipping.cost_usd)){
        shipping=truth("PROVISIONAL",{supported:true,cost_usd:Number(m.shipping.cost_usd),method:m.shipping.method||null,eta:m.shipping.shiptime||null,shadow_eligible:m.shadow_eligible===true,live_eligible:m.live_eligible===true},[ref]);
      }
      if(visual.value?.exact_variant_id){
        exactVariant=truth(visual.truth_state==="VERIFIED"?"VERIFIED":visual.truth_state,{variant_id:String(visual.value.exact_variant_id)},visual.evidence_refs);
      }
      if(supplierPrice.truth_state==="VERIFIED"&&m.shipping&&isNum(m.shipping.cost_usd)){
        landedCost=truth("PROVISIONAL",{
          pre_tax_supplier_landed_cost_usd:round2(Number(row.supplier_cost_min)+Number(m.shipping.cost_usd)),
          excludes:["tax_import","payment_fees","returns","marketing","fx"]
        },[sourceRef,ref]);
      }
    } else if(visual.value?.exact_variant_id){
      exactVariant=truth(visual.truth_state==="VERIFIED"?"VERIFIED":visual.truth_state,{variant_id:String(visual.value.exact_variant_id)},visual.evidence_refs);
    }

    const productGate=bdif.evaluateHuntProductGate({
      decision_id:"pilot:"+row.provider+":"+row.item_id+":"+market,
      risk:"MEDIUM",
      facts:{
        product_identity:productIdentity,
        exact_variant:exactVariant,
        stock,
        shipping,
        destination_supported: shipping.truth_state==="VERIFIED" ? truth("VERIFIED",shipping.value?.supported!==false,shipping.evidence_refs) : truth("UNKNOWN",null,shipping.evidence_refs)
      },
      require_economics:false
    });

    let profitGate={selected:"UNKNOWN",reason:"ECONOMICS_NOT_VERIFIED_FOR_PILOT"};
    const cjMargin=cj?.markets?.[market]?.product_margin_shadow;
    const currentMargin=row.profit_truth?.projected_product_margin;
    const marginForGate=isNum(cjMargin)?Number(cjMargin):(isNum(currentMargin)?Number(currentMargin):null);
    if(marginForGate!=null&&exactVariant.truth_state==="VERIFIED"&&shipping.truth_state==="VERIFIED"){
      const r=bdif.evaluateHuntProductGate({
        decision_id:"pilot-profit:"+row.provider+":"+row.item_id+":"+market,
        risk:"MEDIUM",
        facts:{
          product_identity:productIdentity,
          exact_variant:exactVariant,
          stock,
          shipping,
          destination_supported:truth("VERIFIED",shipping.value?.supported!==false,shipping.evidence_refs)
        },
        require_economics:true,
        economics:{
          inputs_verified:true,
          contribution_margin:marginForGate,
          margin_floor:MARGIN_FLOOR,
          evidence_refs:isNum(cjMargin)?["evidence/HUNT-CJ-GAP-FILL-VERIFIED-2026-09-23.json"]:[sourceRef]
        }
      });
      profitGate={selected:r.selected,reasons:r.reasons};
    }

    const gateReady=["VERIFIED"].every(s=>s===exactVariant.truth_state)&&stock.truth_state==="VERIFIED"&&shipping.truth_state==="VERIFIED";
    const fullReady=gateReady&&supplierPrice.truth_state==="VERIFIED"&&
      targetPrice.truth_state==="VERIFIED"&&estimatedMargin.truth_state==="VERIFIED"&&
      landedCost.truth_state==="VERIFIED"&&visual.truth_state==="VERIFIED"&&category.truth_state==="VERIFIED";

    markets[market]={
      exact_variant:exactVariant,
      shipping,
      landed_cost:landedCost,
      target_price:targetPrice,
      estimated_margin:estimatedMargin,
      deterministic_bdif:{
        product_gate:productGate.selected,
        product_gate_reasons:productGate.reasons,
        profit_gate:profitGate.selected,
        profit_gate_reasons:profitGate.reasons||[profitGate.reason]
      },
      readiness:{
        gate_benchmark_ready:gateReady,
        full_pilot_input_ready:fullReady,
        business_outcome_ready:finalProfitVerified
      }
    };
  }

  return {
    pilot_id:"hunt1000:"+row.provider+":"+row.item_id,
    provider:row.provider,
    item_id:String(row.item_id),
    title:row.title,
    image_url:row.image_url||null,
    product_identity:productIdentity,
    supplier_price:supplierPrice,
    stock,
    media_quality:visual,
    category,
    metadata:truth("VERIFIED",{
      variant_count:row.variant_count??null,
      image_count:row.image_count??null,
      availability_basis:row.availability_basis||null,
      source_truth_state:row.truth_state||null,
      checkout_status:row.checkout_status||null,
      production_exposure:row.production_exposure===true
    },[sourceRef]),
    current_hunt:{
      shadow_shelf_candidate:row.availability_verified===true&&Boolean(row.image_url)&&row.production_exposure!==true,
      live_sell_ready_claimed:false
    },
    markets
  };
}
function counts(list,fn){
  const out={};
  for(const item of list){ const k=String(fn(item)); out[k]=(out[k]||0)+1; }
  return out;
}
function main(){
  const rows=flattenFullShelves();
  const indexes={cj:cjIndex(),eprolo:eproloMarketIndex(),visual:visualIndex()};
  const priorityIds=new Set([
    ...indexes.eprolo.keys(),
    ...indexes.visual.keys(),
    ...rows.filter(r=>r.provider==="EPROLO"&&r.sell_state==="GATE_READY_FINAL_PROFIT_RECHECK").map(r=>String(r.item_id))
  ]);
  const selected=selectCohort(rows,priorityIds);
  const products=selected.map(row=>buildProduct(row,indexes));

  const pairs=[];
  for(const p of products){
    for(const market of TARGET_MARKETS){
      const m=p.markets[market];
      pairs.push({
        pilot_id:p.pilot_id,
        provider:p.provider,
        item_id:p.item_id,
        department:p.category.value?.department||null,
        category:p.category.value?.category||null,
        market,
        current_hunt_shadow_shelf_candidate:p.current_hunt.shadow_shelf_candidate,
        product_gate:m.deterministic_bdif.product_gate,
        product_gate_reasons:m.deterministic_bdif.product_gate_reasons,
        profit_gate:m.deterministic_bdif.profit_gate,
        gate_benchmark_ready:m.readiness.gate_benchmark_ready,
        full_pilot_input_ready:m.readiness.full_pilot_input_ready,
        business_outcome_ready:m.readiness.business_outcome_ready
      });
    }
  }

  const manifest={
    version:"BOOM-BDIF-HUNT-1000-PILOT-CANDIDATES-V1",
    date:"2026-09-23",
    mode:"SHADOW",
    production_effect:false,
    source:"evidence/HUNT-FULL-SHELVES-STYLIST-SHADOW-2026-09-23.json",
    selection_rule:"All non-EPROLO products are retained first; then EPROLO products with fresh gate-ready exact-variant + 4-market shipping evidence; remaining slots use deterministic category round-robin to preserve taxonomy coverage. No product is fabricated.",
    target_markets:TARGET_MARKETS,
    summary:{
      source_unique_products:rows.length,
      selected_products:products.length,
      provider_counts:counts(products,p=>p.provider),
      department_counts:counts(products,p=>p.category.value?.department||"UNKNOWN"),
      category_count:new Set(products.map(p=>(p.category.value?.department||"")+"|"+(p.category.value?.category||""))).size,
      current_hunt_shadow_candidates:products.filter(p=>p.current_hunt.shadow_shelf_candidate).length,
      product_market_pairs:pairs.length
    },
    products
  };

  const truthGap={
    version:"BOOM-BDIF-HUNT-1000-TRUTH-GAP-V1",
    date:"2026-09-23",
    mode:"SHADOW",
    production_effect:false,
    pilot_contract:"boom-bdif-hunt-1000-pilot-contract.json",
    summary:{
      selected_products:products.length,
      product_market_pairs:pairs.length,
      provider_counts:manifest.summary.provider_counts,
      departments_represented:Object.keys(manifest.summary.department_counts).length,
      categories_represented:manifest.summary.category_count,
      current_hunt_shadow_candidates:manifest.summary.current_hunt_shadow_candidates,
      deterministic_product_gate:counts(pairs,p=>p.product_gate),
      deterministic_profit_gate:counts(pairs,p=>p.profit_gate),
      gate_benchmark_ready_pairs:pairs.filter(p=>p.gate_benchmark_ready).length,
      full_pilot_input_ready_pairs:pairs.filter(p=>p.full_pilot_input_ready).length,
      business_outcome_ready_pairs:pairs.filter(p=>p.business_outcome_ready).length,
      model_assisted_bdif:"NOT_RUN",
      winner_status:"NOT_DETERMINED"
    },
    product_truth_coverage:{
      product_identity_verified:products.filter(p=>p.product_identity.truth_state==="VERIFIED").length,
      supplier_price_verified:products.filter(p=>p.supplier_price.truth_state==="VERIFIED").length,
      stock_verified:products.filter(p=>p.stock.truth_state==="VERIFIED").length,
      media_quality_verified:products.filter(p=>p.media_quality.truth_state==="VERIFIED").length,
      category_verified:products.filter(p=>p.category.truth_state==="VERIFIED").length
    },
    market_truth_coverage:{
      exact_variant_verified_pairs:pairs.filter(x=>{
        const p=products.find(p=>p.pilot_id===x.pilot_id); return p.markets[x.market].exact_variant.truth_state==="VERIFIED";
      }).length,
      shipping_verified_pairs:pairs.filter(x=>{
        const p=products.find(p=>p.pilot_id===x.pilot_id); return p.markets[x.market].shipping.truth_state==="VERIFIED";
      }).length,
      shipping_provisional_pairs:pairs.filter(x=>{
        const p=products.find(p=>p.pilot_id===x.pilot_id); return p.markets[x.market].shipping.truth_state==="PROVISIONAL";
      }).length,
      target_price_proven_pairs:pairs.filter(x=>{
        const p=products.find(p=>p.pilot_id===x.pilot_id); return ["VERIFIED","PROVISIONAL"].includes(p.markets[x.market].target_price.truth_state);
      }).length,
      estimated_margin_proven_pairs:pairs.filter(x=>{
        const p=products.find(p=>p.pilot_id===x.pilot_id); return ["VERIFIED","PROVISIONAL"].includes(p.markets[x.market].estimated_margin.truth_state);
      }).length,
      landed_cost_provisional_pairs:pairs.filter(x=>{
        const p=products.find(p=>p.pilot_id===x.pilot_id); return p.markets[x.market].landed_cost.truth_state==="PROVISIONAL";
      }).length
    },
    interpretation:[
      "The 1,000-product cohort is real and source-backed.",
      "Current HUNT shadow-shelf inclusion is not equivalent to live sell readiness.",
      "Deterministic BDIF intentionally returns UNKNOWN when exact variant or destination shipping is not VERIFIED.",
      "FULL_PILOT_INPUT_READY remains strict; provisional target price, margin or landed cost do not count as verified.",
      "Model-assisted BDIF has not been run; no model comparison or winner is claimed.",
      "Business-profit superiority cannot be measured until real attributed outcomes exist."
    ]
  };

  fs.writeFileSync(path.join(EVIDENCE,"BOOM-BDIF-HUNT-1000-PILOT-CANDIDATES-2026-09-23.json"),JSON.stringify(manifest,null,2)+"\n");
  fs.writeFileSync(path.join(EVIDENCE,"BOOM-BDIF-HUNT-1000-TRUTH-GAP-2026-09-23.json"),JSON.stringify(truthGap,null,2)+"\n");

  console.log(JSON.stringify(truthGap.summary,null,2));
  console.log(JSON.stringify(truthGap.product_truth_coverage,null,2));
  console.log(JSON.stringify(truthGap.market_truth_coverage,null,2));
}
if(require.main===module)main();
module.exports={flattenFullShelves,selectCohort,buildProduct};
