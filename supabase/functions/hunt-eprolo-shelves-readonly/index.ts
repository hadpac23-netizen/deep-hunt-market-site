import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import postgres from "npm:postgres@3.4.5";

const JSON_HEADERS={"content-type":"application/json; charset=utf-8","cache-control":"no-store"};
const ALLOWED_ORIGINS=new Set([
  "https://hadpac23-netizen.github.io",
  "https://raw.githack.com",
  "https://deep-hunt-market.netlify.app",
  "http://127.0.0.1:8767",
  "http://localhost:8767",
]);

function cors(req:Request){
  const origin=req.headers.get("origin")||"";
  const preview=/^https:\/\/[a-z0-9-]+--deep-hunt-market\.netlify\.app$/i.test(origin);
  return {
    ...JSON_HEADERS,
    "Access-Control-Allow-Origin":(ALLOWED_ORIGINS.has(origin)||preview)?origin:"https://hadpac23-netizen.github.io",
    "Access-Control-Allow-Headers":"apikey, content-type",
    "Access-Control-Allow-Methods":"GET, OPTIONS",
    "Vary":"Origin"
  };
}

function clean(v:unknown){return typeof v==="string"?v.trim():"";}

let sqlClientInstance:ReturnType<typeof postgres>|null=null;
function sqlClient(){
  if(sqlClientInstance)return sqlClientInstance;
  const db=(Deno.env.get("HUNT_DB_POOLER_URL")||Deno.env.get("SUPABASE_DB_URL")||"").trim();
  if(!db)return null;
  sqlClientInstance=postgres(db,{prepare:false,max:1,connect_timeout:10,idle_timeout:20,max_lifetime:600});
  return sqlClientInstance;
}

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

function aliases(department:string,shelf:string):string[]{
  const d=department.toLowerCase(),s=shelf.toLowerCase();
  const out=new Set<string>([d,s]);
  const map:Record<string,string[]>={
    "women-dresses":["dresses"],"women-evening":["dresses"],"women-skirts":["dresses"],
    "women-tops":["tops"],"women-bottoms":["bottoms"],"women-jeans":["bottoms"],
    "women-hoodies":["hoodies"],"women-knitwear":["knitwear"],"women-outerwear":["jackets"],
    "women-shoes":["shoes"],"women-socks":["socks"],"women-suits":["suits"],
    "women-sleepwear":["sleepwear"],"women-swim":["swimwear"],
    "men-tops":["tops"],"men-shirts":["tops"],"men-bottoms":["bottoms"],"men-jeans":["bottoms"],
    "men-hoodies":["hoodies"],"men-knitwear":["knitwear"],"men-outerwear":["jackets"],
    "men-shoes":["shoes"],"men-socks":["socks"],"men-suits":["suits"],
    "men-bags":["bags"],"men-accessories":["accessories"],
    "hair-accessories":["hairaccessories","accessories"],
    "bag-accessories":["accessories","bags"],
    "jewelry-bracelets":["jewelry"],"jewelry-earrings":["jewelry"],"jewelry-necklaces":["jewelry"],"jewelry-rings":["jewelry"],
    "phone-cases":["phonecases","phoneaccessories","tech"],
    "chargers-cables":["phoneaccessories","tech"],"stands-holders":["phoneaccessories","tech"],
    "wearable-accessories":["tech"],"computer-accessories":["tech"],"cameras":["tech"],
    "active-bottoms":["activewear","sports"],"fitness-accessories":["sports"],
    "camp-cooking":["outdoors"],"outdoors":["outdoors"],"outdoor-living":["outdoors"],"planters":["outdoors"],
    "luggage":["travel"],"gift-decor":["gifts"],"party":["party","gifts"],
    "stationery":["stationery","office"],"educational-toys":["toys"],
    "baby":["kids"],"baby-bedding":["kids","bedding"],"baby-clothing":["kids"],"baby-sets":["kids"],"baby-sleepsuits":["kids","sleepwear"],
    "kids-accessories":["kids","accessories"],"kids-clothing":["kids"],"kids-shoes":["kids","shoes"],"tableware":["kids"],
    "bath":["bath","home"],"cleaning":["cleaning","home"],"storage":["storage","home"],
    "towels":["blankets","home"],"cushions-throws":["pillows","blankets","home"],"rugs":["home"],
    "kitchen-tools":["kitchen"],"home-appliances":["tech","home"],
    "beauty-tools":["beauty"],"body-care":["beauty"],"hair":["beauty"],"makeup":["beauty"],"nails":["beauty"],"skincare":["beauty"],
    "pet-accessories":["pets"],"pet-beds":["pets"],"pet-clothing":["pets"],"pet-feeding":["pets"],"pet-grooming":["pets"],"pet-houses":["pets"],"pet-walk":["pets"]
  };
  for(const a of map[s]||[])out.add(a);
  return [...out].filter(Boolean);
}

Deno.serve(async(req:Request)=>{
  const headers=cors(req);
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
  if(req.method!=="GET")return new Response(JSON.stringify({error:"GET required"}),{status:405,headers});

  const sql=sqlClient();
  if(!sql)return new Response(JSON.stringify({error:"server config"}),{status:503,headers});

  try{
    const rows=await sql`
      with latest_qa as (
        select distinct on (provider,item_id)
          provider,item_id,qa_status,http_status,variant_count,availability_verified,retail_price_verified,checked_at,requested_at,id
        from private.hunt_pdp_qa_runs
        order by provider,item_id,coalesce(checked_at,requested_at) desc,id desc
      ), strict as (
        select provider,item_id,title,image_url,verified_inventory,candidate_status,source_payload,updated_at,
          lower(title) as t,
          lower(coalesce(source_payload->'taxonomy_gate_v2'->>'canonical_shelf','')) as s
        from public.hunt_shelf_candidates
        where provider='EPROLO'
          and production_effect=false
          and availability_verified=true
          and coalesce(verified_inventory,0)>0
          and nullif(trim(source_payload->>'variant_id'),'') is not null
          and coalesce(source_payload->>'catalog_safety_status','')='PASS'
          and coalesce(source_payload->>'image_technical_status','')='PASS'
          and lower(coalesce(source_payload->>'latest_market5_all_pass','false'))='true'
          and coalesce(source_payload->'taxonomy_gate_v2'->>'status','')='REMAP'
          and coalesce(source_payload->'profit_gate_v2'->>'status','')='PROFIT_REVIEW'
          and coalesce((source_payload->'profit_gate_v2'->>'target_retail_usd')::numeric,0)>0
          and coalesce((source_payload->'profit_gate_v2'->>'projected_product_contribution_usd')::numeric,0)>0
          and candidate_status in (
            'MARKET5_READY_STYLE_PHYSICAL_PENDING',
            'MARKET5_READY_STYLE_PASS_PHYSICAL_EVIDENCE_PENDING',
            'MARKET5_READY_STYLE_PASS_PHYSICAL_METADATA_VERIFIED'
          )
      ), classified as (
        select s.*,
          s.source_payload->'pdp_detail_gate'->>'status' as pdp_detail_status,
          coalesce((s.source_payload->'pdp_detail_gate'->>'http_status')::int,0) as pdp_detail_http,
          q.qa_status,coalesce(q.http_status,0) as qa_http_status,
          coalesce(q.variant_count,0) as qa_variant_count,
          coalesce(q.availability_verified,false) as qa_availability_verified,
          coalesce(q.retail_price_verified,false) as qa_retail_price_verified,
          (
            (((t like '%iphone%case%' or t like '%phone case%' or t like '%samsung%case%' or t like '%galaxy%case%')
              and t not like '%key chain%' and t not like '%keychain%' and t not like '%bag pendant%' and t not like '%passport%'
              and t not like '%document case%' and t not like '%card holder%'
              and s not like '%phone-case%' and s not like '%phoneaccess%' and s not like '%phone-access%'))
            or ((t like '%shoe%' or t like '%sandal%' or t like '%loafer%' or t like '%slipper%' or t like '%boot%' or t like '%sneaker%' or t like '%insole%')
              and (s like '%cushion%' or s like '%throw%' or s like '%pet%' or s like '%mirror%'))
            or ((t like '%montessori%' or t like '% toy%' or t like 'toy%' or t like '%toys%' or t like '%play house%') and s like '%pet%')
            or ((t like '%watch%' or t like '%wristwatch%') and (s like '%bracelet%' or s like '%necklace%' or s like '%earring%' or s like '%ring%'))
            or ((t like '%t-shirt%' or t like '%t shirt%' or t like '%shirt%' or t like '%hoodie%' or t like '%sweatshirt%' or t like '%jacket%' or t like '%pants%' or t like '%trousers%')
              and (s like '%pet%' or s like '%cushion%' or s like '%throw%'))
          ) as obvious_taxonomy_conflict
        from strict s left join latest_qa q using(provider,item_id)
      )
      select provider,item_id,title,image_url,updated_at,
        source_payload->'taxonomy_gate_v2'->>'canonical_department' as department,
        source_payload->'taxonomy_gate_v2'->>'canonical_shelf' as shelf
      from classified
      where pdp_detail_status='PASS'
        and pdp_detail_http=200
        and qa_status='PASS'
        and qa_http_status=200
        and qa_variant_count>=1
        and qa_availability_verified=true
        and qa_retail_price_verified=true
        and coalesce(image_url,'') like 'https://%'
        and not obvious_taxonomy_conflict
      order by department,shelf,item_id
    `;

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
      for(const key of aliases(department,shelf)){
        const list=shelves[key]||(shelves[key]=[]);
        if(!list.some(x=>x.provider===product.provider&&x.item_id===product.item_id))list.push(product);
      }
      visible++;
    }

    return new Response(JSON.stringify({
      ok:true,
      source:"CANONICAL_PDP_READY",
      canonical_count:rows.length,
      display_eligible_count:visible,
      quarantined_count:rows.length-visible,
      quarantine_reasons:reasonCounts,
      final_profit_verified:0,
      purchasable:false,
      production_effect:false,
      shelves
    }),{status:200,headers});
  }catch(error){
    console.error("EPROLO_SHELVES_READONLY_ERROR",error instanceof Error?error.name:"unknown");
    return new Response(JSON.stringify({error:"shelf source unavailable"}),{status:503,headers});
  }
});
