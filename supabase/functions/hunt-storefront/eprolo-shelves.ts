function clean(v:unknown){return typeof v==="string"?v.trim():"";}

function displayHoldReason(title:string,department:string,shelf:string):string|null{
  const t=title.toLowerCase(),d=department.toLowerCase(),s=shelf.toLowerCase();
  const child=/\b(baby|newborn|infant|toddler|child|children|girl|girls|boy|boys|romper|onesie|bodysuit)\b/;
  const pet=/\b(pet|dog|cat|puppy|kitten|leash)\b/;
  if(d==="pets"&&child.test(t)&&!pet.test(t))return "CHILD_PRODUCT_IN_PETS";
  if(d==="home"&&/\b(scooter|motorcycle|automotive|car rearview|vehicle rearview)\b/.test(t))return "VEHICLE_PRODUCT_IN_HOME";
  if(s==="curtains-blinds"&&/\bblind box\b/.test(t)&&!/\bcurtain|blind|shade\b/.test(t.replace(/blind box/g,"")))return "TOY_IN_CURTAINS";
  if(s==="belts"&&/\b(shoe|shoes|sandal|sandals|slipper|slippers|sneaker|sneakers|boot|boots)\b/.test(t))return "FOOTWEAR_IN_BELTS";
  if(d==="beauty"&&s==="nails"&&/\b(bathroom|rack|suction cup|shelf)\b/.test(t))return "HOME_FIXTURE_IN_BEAUTY";
  if(d==="pets"&&s==="pet-houses"&&!pet.test(t)&&/\b(mat|floor|fly trap|pest|household|kitchen)\b/.test(t))return "NON_PET_PRODUCT_IN_PET_HOUSES";
  if(/\b(batman|bts|marvel|disney|pokemon|star wars|hello kitty|gucci|chanel|dior|prada|hermes|nike|adidas)\b/i.test(title))return "IP_REVIEW";
  return null;
}

function aliases(department:string,shelf:string,title=""):string[]{
  const d=department.toLowerCase(),s=shelf.toLowerCase(),t=title.toLowerCase();
  const out=new Set<string>([d,s]);
  const map:Record<string,string[]>={
    "women-dresses":["dresses"],"women-evening":["dresses","women-occasionwear"],"women-skirts":["dresses"],
    "women-tops":["tops"],"women-bottoms":["bottoms"],"women-jeans":["bottoms"],
    "women-hoodies":["hoodies"],"women-knitwear":["knitwear"],"women-outerwear":["jackets"],
    "women-shoes":["shoes"],"women-socks":["socks"],"women-suits":["suits","women-tailoring"],
    "women-sleepwear":["sleepwear","women-nightwear"],"women-swim":["swimwear"],
    "men-tops":["tops"],"men-shirts":["tops"],"men-bottoms":["bottoms"],"men-jeans":["bottoms"],
    "men-hoodies":["hoodies"],"men-knitwear":["knitwear"],"men-outerwear":["jackets"],
    "men-shoes":["shoes"],"men-socks":["socks"],"men-suits":["suits","men-tailoring"],
    "men-bags":["bags"],"men-accessories":["accessories"],
    "hair-accessories":["hairaccessories","accessories"],"bag-accessories":["accessories","bags"],"keychains":["wallets-small-accessories","accessories"],
    "jewelry-bracelets":["jewelry"],"jewelry-earrings":["jewelry"],"jewelry-necklaces":["jewelry"],"jewelry-rings":["jewelry"],
    "phone-cases":["phonecases","phoneaccessories","tech","tech-accessories"],"chargers-cables":["phoneaccessories","tech","tech-accessories"],
    "stands-holders":["phoneaccessories","tech"],"wearable-accessories":["tech"],"computer-accessories":["tech","tech-accessories"],"cameras":["tech"],
    "activewear":["sports","sports-outdoor"],"active-bottoms":["activewear","sports","sports-outdoor"],"fitness-accessories":["sports","sports-outdoor"],
    "camp-cooking":["outdoors"],"outdoors":["outdoors"],"outdoor-living":["outdoors"],"planters":["outdoors"],
    "luggage":["travel"],"gift-decor":["gifts"],"party":["party","gifts"],"stationery":["stationery","office"],
    "educational-toys":["toys"],"baby":["kids"],"baby-bedding":["kids","bedding"],"baby-clothing":["kids"],
    "baby-sets":["kids"],"baby-sleepsuits":["kids","sleepwear"],"kids-accessories":["kids","accessories"],
    "kids-clothing":["kids"],"kids-shoes":["kids","shoes"],"tableware":["kids"],
    "bath":["bath","home"],"cleaning":["cleaning","home"],"storage":["storage","home"],
    "towels":["blankets","home"],"cushions-throws":["pillows","blankets","home"],"curtains":["curtains-blinds","home"],"rugs":["home","rugs-runners"],
    "kitchen-tools":["kitchen"],"home-appliances":["tech","home"],
    "beauty-tools":["beauty"],"body-care":["beauty"],"hair":["beauty"],"makeup":["beauty"],"nails":["beauty"],"skincare":["beauty"],
    "pet-accessories":["pets"],"pet-beds":["pets"],"pet-clothing":["pets"],"pet-feeding":["pets"],
    "pet-grooming":["pets"],"pet-houses":["pets"],"pet-walk":["pets"]
  };
  for(const a of map[s]||[])out.add(a);

  // Targeted canonical fill: every supplemental alias is constrained by both
  // the existing canonical department/shelf and customer-facing product title.
  // This deliberately leaves ambiguous empty shelves empty instead of filling by keyword alone.
  if((s==="baby-clothing"||s==="baby")&&/\b(bodysuit|onesie|romper)\b/.test(t)&&!/\b(swimsuit|swimwear)\b/.test(t))out.add("baby-bodysuits");
  if(["baby","baby-clothing","baby-bedding"].includes(s)&&/\bnewborn\b/.test(t))out.add("newborn");
  if(["baby","baby-clothing"].includes(s)&&(
    /\b(stroller organizer|crib storage|changing pad|diaper pad|nursery closet)\b/.test(t)||
    (/\bdiaper\b/.test(t)&&/\borganizer\b/.test(t))
  ))out.add("nursery");
  if(d==="kids"&&["kids-clothing","baby-clothing","baby-sets"].includes(s)&&/\bboy(?:s|'s)?\b/.test(t)&&!/\b(shoe|shoes|boot|boots|sandal|sandals|slipper|slippers)\b/.test(t))out.add("boys");
  if(d==="kids"&&["baby-sleepsuits","baby-clothing","kids-clothing"].includes(s)&&/\b(pajama|pajamas|pyjama|pyjamas|sleepwear|nightwear|home wear)\b/.test(t))out.add("kids-nightwear");
  if(d==="kids"&&["baby-clothing","kids-clothing","party","baby-sets"].includes(s)&&/\b(formal|christening|party|birthday|princess)\b/.test(t)&&!/\b(halloween|cosplay|costume)\b/.test(t))out.add("kids-occasionwear");
  if(d==="kids"&&["baby-clothing","kids-clothing"].includes(s)&&/\b(swimsuit|swimwear|bathing suit)\b/.test(t))out.add("kids-swimwear");
  if(d==="men"&&s==="men-bottoms"&&/\bshorts\b/.test(t))out.add("men-shorts");
  if(d==="women"&&s==="women-sleepwear"&&/\b(loungewear|lounge wear|home wear)\b/.test(t))out.add("women-loungewear");
  if(d==="women"&&["women-underwear","women-tops","women-dresses"].includes(s)&&/\b(maternity|pregnan(?:t|cy)?|breastfeeding|nursing)\b/.test(t))out.add("women-maternity");

  return [...out].filter(Boolean);
}

export type EproloCanonicalShelvesResult={
  shelves:Record<string,any[]>;
  meta:{source:string;canonical_count:number;display_eligible_count:number;quarantined_count:number;quarantine_reasons:Record<string,number>;final_profit_verified:0;purchasable:false;production_effect:false;db_connection_mode:string};
};

async function canonicalRowsViaRpc():Promise<any[]>{
  const base=clean(Deno.env.get("SUPABASE_URL"));
  const serviceKey=clean(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
  if(!base||!serviceKey)throw new Error("EPROLO_RPC_CONFIG_MISSING");
  const res=await fetch(base+"/rest/v1/rpc/hunt_eprolo_canonical_shelves_rows",{
    method:"POST",
    headers:{
      apikey:serviceKey,
      authorization:`Bearer ${serviceKey}`,
      "content-type":"application/json",
      accept:"application/json"
    },
    body:"{}",
    signal:AbortSignal.timeout(8000)
  });
  if(!res.ok)throw new Error(`EPROLO_RPC_FAILED_${res.status}`);
  const body=await res.json().catch(()=>[]);
  if(!Array.isArray(body))throw new Error("EPROLO_RPC_INVALID_RESPONSE");
  return body;
}

export async function eproloCanonicalMarketShelves(_sql:any,_dbConnectionMode:string):Promise<EproloCanonicalShelvesResult>{
  const dbConnectionMode="supabase_rpc";
  const empty:EproloCanonicalShelvesResult={shelves:{},meta:{source:"CANONICAL_PDP_READY",canonical_count:0,display_eligible_count:0,quarantined_count:0,quarantine_reasons:{},final_profit_verified:0,purchasable:false,production_effect:false,db_connection_mode:dbConnectionMode}};
  let rows:any[]=[];
  try{
    rows=await canonicalRowsViaRpc();
  }catch(error){
    console.error("HUNT_EPROLO_CANONICAL_RPC_FAILED",String(error));
    return empty;
  }

  const shelves:Record<string,any[]>={};
  const reasonCounts:Record<string,number>={};
  let visible=0;
  for(const row of rows){
    const title=clean(row.title),department=clean(row.department),shelf=clean(row.shelf),itemId=clean(row.item_id),image=clean(row.image_url);
    if(!title||!department||!shelf||!itemId||!image)continue;
    const hold=displayHoldReason(title,department,shelf);
    if(hold){reasonCounts[hold]=(reasonCounts[hold]||0)+1;continue;}
    const product={
      provider:"EPROLO",item_id:itemId,title,image_url:image,
      category:shelf,canonical_department:department,canonical_shelf:shelf,hunt_department:department,hunt_shelf:shelf,
      gender:department==="women"?"women":department==="men"?"men":null,
      source_fresh_at:row.updated_at?String(row.updated_at):null,
      availability_verified:false,retail_price_verified:false,profit_gate_status:"REVIEW",
      quote_verification_status:"HOLD",checkout_status:"PRODUCT_DETAIL_RECHECK_REQUIRED",
      market_eligibility_status:"CANONICAL_PDP_READY_DISPLAY_HOLD",
      purchasable:false,production_effect:false
    };
    for(const key of aliases(department,shelf,title)){
      const list=shelves[key]||(shelves[key]=[]);
      if(!list.some(x=>x.provider===product.provider&&x.item_id===product.item_id))list.push(product);
    }
    visible++;
  }

  const meta={source:"CANONICAL_PDP_READY",canonical_count:rows.length,display_eligible_count:visible,quarantined_count:rows.length-visible,quarantine_reasons:reasonCounts,final_profit_verified:0 as const,purchasable:false as const,production_effect:false as const,db_connection_mode:dbConnectionMode};
  console.log(JSON.stringify({event:"HUNT_EPROLO_CANONICAL_SHELVES",...meta}));
  return {shelves,meta};
}
