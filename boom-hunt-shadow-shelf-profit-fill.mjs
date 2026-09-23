import fs from "fs";
import path from "path";

const ROOT=process.cwd();
const STAGING="/Users/adichehade/.hunt-final-candidate-v1/catalog-staging";
const BASELINE="evidence/HUNT-FULL-SHELVES-STYLIST-SHADOW-2026-09-23.json";
const TARGET=12;
const BLOCKED=/\b(weapon|gun|firearm|ammo|ammunition|knife|blade|dagger|sword|machete|taser|pepper spray|mace|firework|explosive|vape|cigarette|nicotine|cbd|thc|cannabis|marijuana|adult|porn|steroid|diet pill|laxative|slimming|weight[- ]?loss)\b/i;

const RULES={
  "accessories/bag-accessories":/\b(bag strap|bag charm|bag chain|bag organizer|purse strap|handbag strap|bag accessory)\b/i,
  "accessories/gloves":/\b(glove|gloves|mitten|mittens)\b/i,
  "accessories/hair-accessories":/\b(hair clip|hair band|hair pin|hair claw|hair tie|scrunchie|headband|barrette)\b/i,
  "accessories/hats":/\b(hat|cap|beanie|beret|bucket hat|baseball cap)\b/i,
  "accessories/jewelry":/\b(jewelry set|jewellery set|necklace.+earring|earring.+necklace|bracelet.+necklace)\b/i,
  "accessories/jewelry-earrings":/\b(earring|earrings)\b/i,
  "accessories/jewelry-necklaces":/\b(necklace|necklaces|pendant necklace)\b/i,
  "accessories/socks":/\b(sock|socks|stocking|stockings)\b/i,
  "accessories/bags":/\b(handbag|shoulder bag|crossbody bag|backpack|tote bag|purse)\b/i,
  "accessories/scarves":/\b(scarf|scarves|shawl|wrap)\b/i,
  "accessories/belts":/\b(belt|belts)\b/i,
  "accessories/jewelry-bracelets":/\b(bracelet|bracelets|bangle|bangles)\b/i,

  "beauty/nails":/\b(nail art|nail polish|nail tips|nail sticker|manicure|press[- ]?on nails|fake nails)\b/i,

  "home/bath":/\b(bath mat|bathroom|shower curtain|soap dish|towel rack|bath caddy|bath towel)\b/i,
  "home/bedding":/\b(bed sheet|duvet|quilt|pillow|bedding|mattress cover|bed cover)\b/i,
  "home/cleaning":/\b(cleaning|mop|duster|scrubber|dustpan|broom|squeegee)\b/i,
  "home/curtains":/\b(curtain|curtains|window blind|drape|drapes)\b/i,
  "home/home-storage":/\b(storage box|storage basket|storage bag|storage rack|organizer|drawer organizer)\b/i,
  "home/laundry":/\b(laundry|hamper|clothes drying|drying rack|ironing|clothes hanger)\b/i,
  "home/lighting":/\b(lamp|lighting|night light|led light|table light|wall light|ceiling light)\b/i,
  "home/mirrors":/\b(mirror|mirrors)\b/i,
  "home/rugs":/\b(rug|rugs|carpet|floor mat|doormat)\b/i,
  "home/wall-decor":/\b(wall art|wall decor|wall clock|wall sticker|wall shelf|poster)\b/i,

  "kids/baby-clothing":/\b(baby|newborn|infant).{0,30}\b(romper|onesie|bodysuit|clothes|clothing|outfit|pants|shirt|dress|jumpsuit)\b/i,

  "men/men-boxers":/\b(boxer|boxers|boxer briefs)\b/i,
  "men/men-clothing":/\b(men's clothing|mens clothing|men clothing|men outfit|men casual set)\b/i,
  "men/men-hoodies":/\b(hoodie|hoodies|sweatshirt|sweatshirts)\b/i,
  "men/men-jeans":/\b(jean|jeans|denim pants|denim trousers)\b/i,
  "men/men-knitwear":/\b(sweater|sweaters|knitwear|knitted cardigan|pullover)\b/i,
  "men/men-socks":/\b(sock|socks|stocking|stockings)\b/i,
  "men/men-suits":/\b(suit|suits|blazer|blazers|tuxedo)\b/i,
  "men/men-underwear":/\b(underwear|brief|briefs|underpants)\b/i,
  "men/men-bottoms":/\b(pants|trousers|shorts|cargo pants|joggers)\b/i,
  "men/men-outerwear":/\b(jacket|jackets|coat|coats|parka|windbreaker)\b/i,
  "men/men-tops":/\b(t[- ]?shirt|shirt|shirts|polo|tank top)\b/i,

  "office/crafts":/\b(craft|crafts|diy|embroidery|knitting|crochet|beading|scrapbook|sewing|stamp punch|wooden chips)\b/i,
  "office/stickers":/\b(sticker|stickers|decal|decals)\b/i,
  "office/office-storage":/\b(desk organizer|file organizer|document holder|pen holder|office storage|desktop storage)\b/i,
  "office/stationery":/\b(notebook|pen|pencil|marker|eraser|stationery|sticky note|paper clip|sketch book)\b/i,

  "pets/aquarium":/\b(aquarium|fish tank|aquatic|fish filter|fish feeder)\b/i,
  "pets/pet-clothing":/\b(pet clothes|pet clothing|dog clothes|dog coat|dog shirt|cat clothes|cat clothing|pet hoodie|dog hoodie)\b/i,
  "pets/pet-houses":/\b(pet house|dog house|cat house|pet bed|dog bed|cat bed|pet condo|cat condo)\b/i,
  "pets/pet-grooming":/\b(pet grooming|dog grooming|cat grooming|pet brush|dog brush|cat brush|deshedding|pet nail clipper)\b/i,

  "sports/outdoors":/\b(hiking|trekking|outdoor training|outdoor sport|climbing accessory)\b/i,
  "sports/sports-gear":/\b(basketball|football|soccer|tennis|badminton|volleyball|sports gear|training gear)\b/i,
  "sports/fitness-accessories":/\b(resistance band|yoga mat|fitness band|workout band|gym accessory|fitness accessory|exercise band)\b/i,
  "sports/active-bottoms":/\b(yoga pants|sports shorts|gym shorts|running pants|training pants|workout leggings)\b/i,

  "tech/gaming":/\b(gaming|gamepad|game controller|gaming mouse|gaming keyboard|controller)\b/i,
  "tech/phone-cases":/\b(phone case|iphone case|galaxy case|smartphone case|mobile phone case)\b/i,
  "tech/wearable-accessories":/\b(watch band|watch strap|smartwatch band|smart watch band|wearable strap)\b/i,

  "women/women-bottoms":/\b(women.{0,20}(pants|trousers|shorts)|wide leg pants|women cargo pants)\b/i,
  "women/women-hoodies":/\b(hoodie|hoodies|sweatshirt|sweatshirts)\b/i,
  "women/women-knitwear":/\b(sweater|sweaters|cardigan|knitwear|knitted top|knitted pullover)\b/i,
  "women/women-sleepwear":/\b(pajama|pajamas|pyjama|pyjamas|nightgown|sleepwear|nightwear|robe)\b/i,
  "women/women-socks":/\b(sock|socks|stocking|stockings|pantyhose)\b/i,
  "women/women-skirts":/\b(skirt|skirts)\b/i,
  "women/women-outerwear":/\b(jacket|jackets|coat|coats|parka|windbreaker)\b/i,
  "women/women-evening":/\b(evening dress|prom dress|party dress|cocktail dress|formal dress|occasion dress)\b/i,

  "camping/camping-cook":/\b(camping (cookware|pot|kettle|utensil|tableware)|picnic cookware|camping kitchen)\b/i,
  "camping/camping-sleep":/\b(sleeping bag|camping pillow|camping mat|camping mattress|air mattress)\b/i,

  "toys/building-toys":/\b(building blocks|construction blocks|brick set|building toy|construction toy)\b/i,
  "garden/garden-lighting":/\b(garden light|solar garden light|outdoor garden light|landscape light)\b/i,
  "garden/garden-tools":/\b(garden tool|gardening tool|planting shovel|garden rake|watering tool|plant tool)\b/i
};

function priceGate(cost){
  cost=Number(cost);
  if(!Number.isFinite(cost)||cost<=0)return null;
  const reserve=.91,minProfit=4,targetMargin=.35;
  const raw=Math.max((cost+minProfit)/reserve,cost/(reserve-targetMargin));
  const retail=Math.max(.99,Math.ceil(raw+.01)-.01);
  const contribution=retail*reserve-cost;
  return {
    supplier_cost_usd:+cost.toFixed(2),
    target_retail_shadow_usd:+retail.toFixed(2),
    projected_product_contribution_usd:+contribution.toFixed(2),
    projected_product_margin:+(contribution/retail).toFixed(4),
    reserve_rate:.09,
    shipping_priced_separately:true,
    final_profit_verified:false
  };
}
function primaryDept(row){
  return String(row.primary_department||row.department||"");
}
function score(row){
  return (Number(row.preview_score)||0)*1000+(Number(row.curation_score)||Number(row.selection_score)||0)*100+(Number(row.image_count)||0);
}

const baseline=JSON.parse(fs.readFileSync(BASELINE,"utf8"));
const existingByRail=new Map();
const existingIds=new Set();
for(const dep of baseline.departments){
  for(const cat of dep.categories||[]){
    const key=dep.slug+"/"+cat.slug;
    existingByRail.set(key,(cat.products||[]).length);
    for(const p of cat.products||[]) existingIds.add(String(p.provider)+":"+String(p.item_id));
  }
}
const allRowsByDept=new Map();
for(const dep of baseline.departments){
  const file=path.join(STAGING,dep.slug+".json");
  const rows=fs.existsSync(file)?(JSON.parse(fs.readFileSync(file,"utf8")).products||[]):[];
  allRowsByDept.set(dep.slug,rows);
}

const overlay=[];
const railSummary=[];
const used=new Set(existingIds);

for(const [rail,rx] of Object.entries(RULES)){
  const [department,category]=rail.split("/");
  const before=existingByRail.get(rail)??0;
  if(before>=TARGET)continue;
  const rows=allRowsByDept.get(department)||[];
  const candidates=[];
  for(const row of rows){
    const id=String(row.item_id||row.supplier_record_id||"");
    const key=String(row.provider||"UNKNOWN")+":"+id;
    if(!id||used.has(key))continue;
    if(row.availability_verified!==true||!row.image_url)continue;
    if(primaryDept(row)!==department)continue;
    const title=String(row.title||"");
    if(BLOCKED.test(title+" "+String(row.category||"")))continue;
    const exactCategory=String(row.category||"")===category;
    const semanticMatch=rx.test(title);
    if(!exactCategory&&!semanticMatch)continue;
    const pg=priceGate(row.supplier_cost_min??row.price_amount);
    if(!pg)continue;
    candidates.push({
      provider:String(row.provider||"UNKNOWN"),
      item_id:id,
      department,
      category,
      title,
      image_url:String(row.image_url),
      availability_verified:true,
      availability_basis:String(row.availability_basis||"CATALOG_SNAPSHOT"),
      inventory_snapshot:Number(row.inventory_snapshot||row.stock_quantity||0)||null,
      supplier_cost_min:Number(row.supplier_cost_min??row.price_amount),
      currency:String(row.currency||"USD"),
      variant_count:Number(row.variant_count||0)||null,
      image_count:Number(row.image_count||0)||null,
      route_basis:exactCategory?"EXACT_SOURCE_CATEGORY":"STRICT_TITLE_SEMANTIC_MATCH",
      shelf_state:"SHELF_SHADOW_READY",
      sell_state:"DESTINATION_VARIANT_SHIPPING_RECHECK_REQUIRED",
      profit_truth:{
        state:"PROJECTED_PRODUCT_CONTRIBUTION_ONLY",
        ...pg,
        blockers:["EXACT_VARIANT_RECHECK","DESTINATION_SHIPPING_RECHECK","TAX_IMPORT_RECHECK","FX_RECHECK","REALIZED_RETURN_COST_UNKNOWN"]
      },
      production_exposure:false,
      _score:score(row)
    });
  }
  candidates.sort((a,b)=>b._score-a._score||a.title.localeCompare(b.title));
  const need=Math.max(0,TARGET-before);
  const selected=candidates.slice(0,need);
  for(const row of selected){
    delete row._score;
    overlay.push(row);
    used.add(row.provider+":"+row.item_id);
  }
  railSummary.push({
    department,category,before,target:TARGET,strict_candidates_found:candidates.length,
    added:selected.length,after:before+selected.length,
    density_after:before+selected.length>=TARGET?"TARGET_MET":before+selected.length>=6?"GOOD":"THIN"
  });
}

const output={
  version:"HUNT-SHADOW-SHELF-PROFIT-FILL-V1",
  date:"2026-09-23",
  mode:"SHADOW_ONLY",
  production_effect:false,
  target_per_thin_rail:TARGET,
  summary:{
    rails_targeted:railSummary.length,
    products_added:overlay.length,
    rails_target_met:railSummary.filter(x=>x.after>=TARGET).length,
    rails_still_below_target:railSummary.filter(x=>x.after<TARGET).length,
    projected_contribution_positive:overlay.filter(x=>x.profit_truth?.projected_product_contribution_usd>0).length,
    final_profit_verified:0,
    sell_ready:0
  },
  rails:railSummary,
  products:overlay,
  rules:[
    "Primary department must already equal the target HUNT department.",
    "Product must have verified catalog availability, image and positive supplier cost.",
    "Target category requires exact source category or strict title semantic match.",
    "Blocked/dangerous/adult/nicotine/drug/weapon terms are excluded.",
    "Price Gate V2 projection uses supplier cost plus 9% payment/refund reserve and $4 minimum contribution; shipping remains separate.",
    "Projected product contribution is not final net profit.",
    "No product becomes SELL_READY until exact variant, fresh stock and destination shipping are verified.",
    "No Production shelf mutation, checkout activation, supplier order or fulfillment."
  ]
};
fs.writeFileSync("evidence/HUNT-SHADOW-SHELF-PROFIT-FILL-2026-09-23.json",JSON.stringify(output,null,2)+"\n");
console.log(JSON.stringify(output.summary,null,2));
for(const r of railSummary.filter(x=>x.added||x.after<TARGET)) console.log(r.department+"/"+r.category,r.before+" -> "+r.after,"added",r.added,"found",r.strict_candidates_found,r.density_after);
