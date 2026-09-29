import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import postgres from "npm:postgres@3.4.5";
import { createHash } from "node:crypto";

const BASE="https://openapi.eprolo.com/";
const H={"content-type":"application/json; charset=utf-8","cache-control":"no-store"};

const BLOCKED=[
  "gun","firearm","ammunition","ammo","weapon","switchblade","taser","knife","dagger","sword","machete",
  "pepper spray","mace","brass knuckle","firework","explosive","detonator","poison","pesticide",
  "cannabis","marijuana","thc","cbd","cocaine","heroin","meth","steroid","vape","cigarette","nicotine",
  "beer","wine","vodka","whiskey","whisky","rum","tequila","casino","sportsbook","betting","porn",
  "sex toy","adult toy","spyware","diet pill","laxative","replica","counterfeit"
];

const STYLE_HOLD=/\b(slimming|weight[- ]?loss|body[- ]?shaping|shapewear|fetish|provocative|erotic|sexy|lingerie|g[- ]?string|thong|t[- ]?pants|buttocks? lifting|hip lifting|waist tightening|see[- ]?through)\b/i;
const IP_HOLD=/\b(disney|marvel|pokemon|star wars|hello kitty|gucci|chanel|dior|prada|hermes|nike|adidas)\b/i;
const STYLE_SIGNALS=/\b(minimal|minimalist|leather|woven|quilted|vintage|textured|elegant|classic|modern|soft|compact|travel|premium|metallic|handmade)\b/ig;

const reply=(x:unknown,s=200)=>new Response(JSON.stringify(x),{status:s,headers:H});
const num=(v:unknown)=>{const n=Number(v);return Number.isFinite(n)?n:null};
const money=(v:number)=>Math.round(v*100)/100;

function sig(k:string,s:string){
  const timestamp=String(Date.now());
  return {timestamp,sign:createHash("md5").update(k+timestamp+s).digest("hex")};
}
async function get(k:string,s:string,path:string,params:Record<string,string|number>){
  const a=sig(k,s),u=new URL(path,BASE);
  for(const [x,v] of Object.entries(params))u.searchParams.set(x,String(v));
  u.searchParams.set("timestamp",a.timestamp);u.searchParams.set("sign",a.sign);
  const r=await fetch(u,{headers:{"apiKey":k,"Accept":"application/json","User-Agent":"HUNT-EPROLO-CATALOG-FILL/1.0"},signal:AbortSignal.timeout(15000)});
  return {http:r.status,body:await r.json().catch(()=>null)};
}
function safeText(title:string){
  const h=title.toLowerCase();
  return !BLOCKED.some(x=>h.includes(x));
}
function mapCategory(title:string){
  const t=title.toLowerCase();
  const hasWomen=/\b(women|woman|womens|women's|lady|ladies|female)\b/.test(t);
  const hasMen=/\b(men|man|mens|men's|male)\b/.test(t);
  const hasKids=/\b(kid|kids|child|children|toddler|boys|girls|boy's|girl's)\b/.test(t) && !hasWomen && !hasMen;
  const basicUnderwear=/\b(brief|briefs|panty|panties|underwear|underpants|boyshort|boyshorts|hipster|hipsters|trunk|trunks|boxer|boxers)\b/;
  const bra=/\b(sports? bra|nursing bra|maternity bra|breastfeeding bra|bra|bras)\b/;
  if(hasWomen && bra.test(t)) return "women-bras";
  if(hasKids && basicUnderwear.test(t)) return "kids-underwear";
  if(hasMen && basicUnderwear.test(t)) return "men-underwear";
  if(hasWomen && basicUnderwear.test(t)) return "women-underwear";
  const rules:[string,RegExp][]=[
    ["women-dresses",/\b(dress|dresses|skirt)\b/],
    ["women-tops",/\b(blouse|women.*shirt|women.*top|women.*tee|crop top)\b/],
    ["men-tops",/\b(men.*shirt|men.*top|men.*tee|men.*hoodie|men.*jacket)\b/],
    ["men-bottoms",/\b(men.*pants|men.*trousers|men.*jeans|men.*shorts)\b/],
    ["shoes",/\b(shoe|shoes|sneaker|sneakers|boot|boots|sandal|sandals|slipper|slippers)\b/],
    ["bags",/\b(handbag|crossbody|tote|backpack|duffle|bag)\b/],
    ["wallets-small-accessories",/\b(wallet|purse|card holder|card case|passport holder|keychain|clutch)\b/],
    ["jewelry",/\b(necklace|bracelet|earring|earrings|ring|rings|pendant|jewelry|jewellery)\b/],
    ["beauty",/\b(makeup|cosmetic|skincare|beauty|hair care|mirror|brush)\b/],
    ["home",/\b(home decor|pillow|blanket|rug|household|decor)\b/],
    ["kitchen",/\b(kitchen|cookware|utensil|bakeware|lunch box|food storage|cup|mug|bottle)\b/],
    ["lighting",/\b(lamp|lighting|night light|desk light|led light|lantern)\b/],
    ["office",/\b(office|desk|notebook|planner|file organizer|stationery)\b/],
    ["tech-accessories",/\b(phone case|screen protector|phone stand|charging cable|charger|earbuds|keyboard|mouse pad)\b/],
    ["travel",/\b(travel|luggage|suitcase|packing cube|passport holder|weekender)\b/],
    ["pets",/\b(pet|dog|cat|leash|collar|pet bed|pet toy)\b/],
    ["sports-outdoor",/\b(fitness|running|cycling|yoga|camping|hiking|outdoor|sports)\b/],
    ["kids",/\b(kid|kids|child|children|baby|toddler|girl|boy)\b/]
  ];
  for(const [slug,re] of rules)if(re.test(t))return slug;
  return "general-review";
}
function pickVariant(raw:any){
  const rows=(Array.isArray(raw?.variantlist)?raw.variantlist:[]).map((v:any)=>({
    id:String(v?.id||v?.variantsid||v?.variantId||""),
    cost:num(v?.cost),
    stock:num(v?.inventory_quantity),
    title:String(v?.title||""),
    imageId:String(v?.imagesid||"")
  })).filter((v:any)=>v.id&&v.cost!==null&&v.cost>0&&(v.stock??0)>0);
  rows.sort((a:any,b:any)=>(a.cost-b.cost)||((b.stock??0)-(a.stock??0)));
  return {picked:rows[0]||null,count:rows.length};
}
function exactImage(raw:any,imageId:string){
  const row=(Array.isArray(raw?.imagelist)?raw.imagelist:[]).find((x:any)=>String(x?.id||"")===imageId);
  const exact=String(row?.src||"");
  if(/^https?:\/\//i.test(exact))return {url:exact,scope:"EXACT_VARIANT"};
  const fb=String(raw?.imagefirst||"");
  return {url:/^https?:\/\//i.test(fb)?fb:null,scope:"PRODUCT_FALLBACK"};
}
function stylePrecheck(title:string){
  const signals=[...title.matchAll(STYLE_SIGNALS)].map(m=>m[0].toLowerCase());
  const hold=STYLE_HOLD.test(title);
  const ip=IP_HOLD.test(title);
  const score=Math.max(0,Math.min(100,55+Math.min(30,new Set(signals).size*7)-(hold?40:0)-(ip?35:0)));
  return {score,signals:[...new Set(signals)],hold,ip,status:hold?"STYLE_HOLD":ip?"IP_REVIEW":"PASS"};
}

Deno.serve(async(req:Request)=>{
  if(req.method!=="POST")return reply({error:"POST required"},405);
  const db=Deno.env.get("SUPABASE_DB_URL");if(!db)return reply({error:"server config"},500);
  const sql=postgres(db,{prepare:false,max:1});
  try{
    const secretRows=await sql`select name,decrypted_secret from vault.decrypted_secrets where name in ('hunt_eprolo_api_key','hunt_eprolo_api_secret','hunt_eprolo_pilot_token')`;
    const sec=Object.fromEntries(secretRows.map((r:any)=>[r.name,r.decrypted_secret]));
    if(req.headers.get("x-hunt-internal-token")!==sec.hunt_eprolo_pilot_token)return reply({error:"unauthorized"},401);
    const k=String(sec.hunt_eprolo_api_key||""),s=String(sec.hunt_eprolo_api_secret||"");if(!k||!s)return reply({error:"supplier credentials unavailable"},503);

    const body=await req.json().catch(()=>({}));
    const page=Math.max(1,Math.min(10000,Number(body?.page)||1));
    const pageSize=Math.max(10,Math.min(100,Number(body?.page_size)||50));
    const categoryId=Number(body?.category_id);
    const persist=body?.persist===true;
    const params:any={page,page_size:pageSize};
    if(Number.isFinite(categoryId)&&categoryId>0)params.wareTypeTwoId=Math.trunc(categoryId);

    const cat=await get(k,s,"eprolo_product_list.html",params);
    if(cat.http!==200||String(cat.body?.code)!=="0"||!Array.isArray(cat.body?.data))return reply({ok:false,error:"catalog_read_failed",http:cat.http},502);

    const products:any[]=[];
    for(const raw of cat.body.data){
      const productId=String(raw?.product_id||raw?.id||""),title=String(raw?.title||"").trim();
      if(!productId||!title||!safeText(title))continue;
      const st=stylePrecheck(title); if(st.status!=="PASS")continue;
      const v=pickVariant(raw); if(!v.picked)continue;
      const image=exactImage(raw,v.picked.imageId); if(!image.url)continue;
      const category=mapCategory(title); if(category==="general-review")continue;
      products.push({
        provider:"EPROLO",item_id:productId,title,category,image_url:image.url,
        supplier_cost:money(v.picked.cost),supplier_currency:"USD",
        verified_inventory:Math.max(0,Math.trunc(v.picked.stock||0)),
        variant_id:v.picked.id,stocked_variant_count:v.count,image_scope:image.scope,
        stylist_precheck:st
      });
    }

    let persisted=0;
    if(persist&&products.length){
      for(const x of products){
        await sql`
          insert into public.hunt_shelf_candidates
          (provider,item_id,title,category,image_url,supplier_cost,supplier_currency,verified_inventory,warehouse_inventory,
           verified_warehouse,availability_verified,retail_truth_status,product_truth_status,candidate_status,sellable,
           production_effect,source,source_payload,discovered_at,updated_at)
          values
          ('EPROLO',${x.item_id},${x.title},${x.category},${x.image_url},${x.supplier_cost},'USD',${x.verified_inventory},${x.verified_inventory},
           false,true,'NOT_FINAL','CATALOG_PRECHECK_PASS','PENDING_GLOBAL_SHIPPING_PROFIT_VISUAL_QUALITY',false,
           false,'EPROLO_CATALOG_FILL_V3',${sql.json({variant_id:x.variant_id,stocked_variant_count:x.stocked_variant_count,image_scope:x.image_scope,stylist_precheck:x.stylist_precheck,page,category_id:Number.isFinite(categoryId)?categoryId:null})},now(),now())
          on conflict (provider,item_id) do update set
            title=excluded.title,
            category=case
              when coalesce(public.hunt_shelf_candidates.category,'') in ('','general-review') then excluded.category
              else public.hunt_shelf_candidates.category
            end,
            image_url=case
              when public.hunt_shelf_candidates.image_url is not null
               and (
                 public.hunt_shelf_candidates.candidate_status in (
                   'FULLY_READY',
                   'MARKET5_READY_STYLE_PHYSICAL_PENDING',
                   'MARKET5_READY_IMAGE_TECH_REVIEW',
                   'MARKET5_READY_STYLE_PASS_PHYSICAL_METADATA_VERIFIED',
                   'MARKET5_READY_STYLE_PASS_PHYSICAL_EVIDENCE_PENDING',
                   'PARTIAL_MARKET_READY',
                   'HOLD_MARKET_READINESS',
                   'BLOCKED_CATEGORY_REVIEW',
                   'CATEGORY_REVIEW_REQUIRED',
                   'RECHECK_REQUIRED'
                 )
                 or public.hunt_shelf_candidates.retail_truth_status in (
                   'VERIFIED','MARKET5_PROFIT_PASS','PARTIAL_MARKET_PASS','MARKET_HOLD'
                 )
                 or public.hunt_shelf_candidates.product_truth_status in (
                   'FULLY_READY','CJ_SAFE_EXPORT_PASS','TECHNICAL_SHADOW_PASS','RECHECK_REQUIRED'
                 )
               )
                then public.hunt_shelf_candidates.image_url
              else coalesce(excluded.image_url,public.hunt_shelf_candidates.image_url)
            end,
            supplier_cost=coalesce(excluded.supplier_cost,public.hunt_shelf_candidates.supplier_cost),
            verified_inventory=greatest(coalesce(public.hunt_shelf_candidates.verified_inventory,0),coalesce(excluded.verified_inventory,0)),
            warehouse_inventory=greatest(coalesce(public.hunt_shelf_candidates.warehouse_inventory,0),coalesce(excluded.warehouse_inventory,0)),
            availability_verified=(coalesce(public.hunt_shelf_candidates.availability_verified,false) or excluded.availability_verified),
            retail_truth_status=case
              when public.hunt_shelf_candidates.retail_truth_status in ('VERIFIED','MARKET5_PROFIT_PASS','PARTIAL_MARKET_PASS','MARKET_HOLD')
                then public.hunt_shelf_candidates.retail_truth_status
              else excluded.retail_truth_status
            end,
            product_truth_status=case
              when public.hunt_shelf_candidates.product_truth_status in ('FULLY_READY','CJ_SAFE_EXPORT_PASS','TECHNICAL_SHADOW_PASS','RECHECK_REQUIRED')
                then public.hunt_shelf_candidates.product_truth_status
              else excluded.product_truth_status
            end,
            candidate_status=case
              when public.hunt_shelf_candidates.candidate_status in (
                'FULLY_READY',
                'MARKET5_READY_STYLE_PHYSICAL_PENDING',
                'MARKET5_READY_IMAGE_TECH_REVIEW',
                'MARKET5_READY_STYLE_PASS_PHYSICAL_METADATA_VERIFIED',
                'MARKET5_READY_STYLE_PASS_PHYSICAL_EVIDENCE_PENDING',
                'PARTIAL_MARKET_READY',
                'HOLD_MARKET_READINESS',
                'BLOCKED_CATEGORY_REVIEW',
                'CATEGORY_REVIEW_REQUIRED',
                'RECHECK_REQUIRED'
              ) then public.hunt_shelf_candidates.candidate_status
              else excluded.candidate_status
            end,
            sellable=false,
            production_effect=false,
            source=coalesce(public.hunt_shelf_candidates.source,excluded.source),
            source_payload=case
              when (
                public.hunt_shelf_candidates.candidate_status in (
                  'FULLY_READY',
                  'MARKET5_READY_STYLE_PHYSICAL_PENDING',
                  'MARKET5_READY_IMAGE_TECH_REVIEW',
                  'MARKET5_READY_STYLE_PASS_PHYSICAL_METADATA_VERIFIED',
                  'MARKET5_READY_STYLE_PASS_PHYSICAL_EVIDENCE_PENDING',
                  'PARTIAL_MARKET_READY',
                  'HOLD_MARKET_READINESS',
                  'BLOCKED_CATEGORY_REVIEW',
                  'CATEGORY_REVIEW_REQUIRED',
                  'RECHECK_REQUIRED'
                )
                or public.hunt_shelf_candidates.retail_truth_status in (
                  'VERIFIED','MARKET5_PROFIT_PASS','PARTIAL_MARKET_PASS','MARKET_HOLD'
                )
                or public.hunt_shelf_candidates.product_truth_status in (
                  'FULLY_READY','CJ_SAFE_EXPORT_PASS','TECHNICAL_SHADOW_PASS','RECHECK_REQUIRED'
                )
              ) then jsonb_set(
                coalesce(public.hunt_shelf_candidates.source_payload,'{}'::jsonb),
                '{last_refill}',
                excluded.source_payload,
                true
              )
              else coalesce(public.hunt_shelf_candidates.source_payload,'{}'::jsonb)||excluded.source_payload
            end,
            updated_at=now()
        `;
        persisted++;
      }
    }

    return reply({
      ok:true,provider:"EPROLO",mode:"CATALOG_FILL_READ_ONLY_V3",page,page_size:pageSize,
      category_id:Number.isFinite(categoryId)?categoryId:null,raw_count:cat.body.data.length,
      qualified_count:products.length,persisted,persist_enabled:persist,
      products:products.slice(0,100),
      gates:{safety:"PASS",style_precheck:"PASS",ip_precheck:"PASS",stocked_variant:"PASS",exact_or_fallback_image:"PASS",global_shipping:"PENDING",final_profit:"PENDING",visual_quality:"PENDING",physical_quality:"PENDING"},
      payment:"OFF",supplier_live_order:"OFF",production_effect:false
    });
  }catch(e){return reply({ok:false,error:e instanceof Error?e.message:"catalog fill failed"},500);}
  finally{await sql.end({timeout:2}).catch(()=>{});}
});