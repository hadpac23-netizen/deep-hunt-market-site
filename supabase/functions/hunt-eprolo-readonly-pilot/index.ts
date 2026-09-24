import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import postgres from "npm:postgres@3.4.5";
import { createHash } from "node:crypto";

const BASE = "https://openapi.eprolo.com/";
const DESTINATIONS = ["IL","DE","US"] as const;
const JSON_HEADERS = {"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"};
const BLOCKED = /\b(gun|firearm|ammunition|ammo|weapon|switchblade|taser|knife|dagger|sword|machete|pepper\s*spray|mace|brass\s*knuckle|firework|explosive|poison|pesticide|cannabis|marijuana|thc|cbd|cocaine|heroin|meth|steroid|vape|cigarette|nicotine|beer|wine|vodka|whiskey|whisky|rum|tequila|casino|sportsbook|betting|porn|sex\s*toy|adult\s*toy|vibrator|dildo|bdsm|diet\s*pill|laxative)\b/i;
const STYLE_TONE_HOLD = /\b(sexy|kink|fetish)\b/i;

const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:JSON_HEADERS});
const num=(v:unknown)=>{const x=Number(v);return Number.isFinite(x)?x:null};
const money=(v:number)=>Math.round(v*100)/100;

function sign(apiKey:string,apiSecret:string){
  const timestamp=String(Date.now());
  const sign=createHash("md5").update(apiKey+timestamp+apiSecret).digest("hex");
  return {timestamp,sign};
}

async function signedGet(apiKey:string,apiSecret:string,path:string,params:Record<string,string|number>){
  const s=sign(apiKey,apiSecret);
  const url=new URL(path,BASE);
  for(const [k,v] of Object.entries(params)) url.searchParams.set(k,String(v));
  url.searchParams.set("timestamp",s.timestamp);
  url.searchParams.set("sign",s.sign);
  const res=await fetch(url,{
    method:"GET",
    headers:{"apiKey":apiKey,"Accept":"application/json","User-Agent":"HUNT-EPROLO-READONLY-PILOT/2.0"},
    signal:AbortSignal.timeout(15000)
  });
  const body=await res.json().catch(()=>null);
  return {http:res.status,body};
}

function cheapestShipping(body:any){
  const options:any[]=[];
  const data=body?.data;
  for(const v of (data?.variantlist||[])){
    for(const lg of (v?.logistics_cost_list||[])){
      for(const x of (lg?.cost_list||[])){
        const cost=num(x?.cost);
        if(cost===null||cost<0) continue;
        options.push({
          cost_usd:money(cost),
          method:String(x?.ship_method||""),
          eta:String(x?.shiptime||""),
          countrycode:String(x?.countrycode||"")
        });
      }
    }
  }
  options.sort((a,b)=>a.cost_usd-b.cost_usd);
  return options[0]||null;
}

function shadowPrice(landed:number){
  const reserve=.91, minProfit=4, target=.35;
  const contribution=(landed+minProfit)/reserve;
  const margin=landed/(reserve-target);
  const retail=Math.max(.99,Math.ceil(Math.max(contribution,margin))-.01);
  const profit=retail*reserve-landed;
  return {
    retail_usd:money(retail),
    projected_contribution_profit_usd:money(profit),
    projected_contribution_margin:Math.round((profit/retail)*10000)/10000,
    formula_status:"HUNT_SHADOW_ONLY"
  };
}

function imageMap(raw:any){
  const m=new Map<string,string>();
  for(const x of (Array.isArray(raw?.imagelist)?raw.imagelist:[])){
    const id=String(x?.id||"");
    const src=String(x?.src||"");
    if(id&&/^https?:\/\//i.test(src)) m.set(id,src);
  }
  return m;
}

function pickVariant(raw:any){
  const variants=(Array.isArray(raw?.variantlist)?raw.variantlist:[]).map((v:any)=>({
    id:String(v?.id||v?.variantsid||v?.variantId||""),
    sku:String(v?.sku||""),
    title:String(v?.title||""),
    cost:num(v?.cost),
    stock:num(v?.inventory_quantity),
    weight_g:num(v?.weight),
    imagesid:String(v?.imagesid||"")
  })).filter((v:any)=>v.id&&v.cost!==null&&v.cost>0&&(v.stock??0)>0);
  variants.sort((a:any,b:any)=>(a.cost-b.cost)||((b.stock??0)-(a.stock??0)));
  return {picked:variants[0]||null,stocked:variants};
}

async function imageProbe(url:string|null){
  if(!url) return {status:"MISSING",http:null,content_type:null,content_length:null};
  try{
    const res=await fetch(url,{method:"HEAD",redirect:"follow",signal:AbortSignal.timeout(8000)});
    return {
      status:res.ok?"REACHABLE":"HTTP_REVIEW",
      http:res.status,
      content_type:res.headers.get("content-type"),
      content_length:num(res.headers.get("content-length"))
    };
  }catch{
    return {status:"FETCH_REVIEW",http:null,content_type:null,content_length:null};
  }
}

Deno.serve(async(req:Request)=>{
  if(req.method!=="POST") return reply({error:"POST required"},405);
  const dbUrl=Deno.env.get("SUPABASE_DB_URL");
  if(!dbUrl) return reply({error:"server configuration unavailable"},500);
  const sql=postgres(dbUrl,{prepare:false,max:1});
  try{
    const rows=await sql`
      select name,decrypted_secret from vault.decrypted_secrets
      where name in ('hunt_eprolo_api_key','hunt_eprolo_api_secret','hunt_eprolo_pilot_token')
    `;
    const sec=Object.fromEntries(rows.map((r:any)=>[r.name,r.decrypted_secret]));
    if(!sec.hunt_eprolo_pilot_token||req.headers.get("x-hunt-internal-token")!==sec.hunt_eprolo_pilot_token)
      return reply({error:"unauthorized"},401);
    const apiKey=String(sec.hunt_eprolo_api_key||""), apiSecret=String(sec.hunt_eprolo_api_secret||"");
    if(!apiKey||!apiSecret) return reply({error:"supplier credentials unavailable"},503);

    const cat=await signedGet(apiKey,apiSecret,"eprolo_product_list.html",{page:1,page_size:5,wareTypeTwoId:1241});
    if(cat.http!==200||String(cat.body?.code)!=="0"||!Array.isArray(cat.body?.data)){
      return reply({ok:false,mode:"READ_ONLY_EVALUATION",upstream_http:cat.http,supplier_code:cat.body?.code??null,payment:"OFF",supplier_live_order:"OFF"},502);
    }

    const evaluated:any[]=[];
    for(const raw of cat.body.data.slice(0,5)){
      const productId=String(raw?.product_id||raw?.id||"");
      const title=String(raw?.title||"").trim();
      if(!productId||!title||BLOCKED.test(title)){
        evaluated.push({product_id:productId||null,title:title||null,gate:"BLOCKED_CATALOG_POLICY"});
        continue;
      }
      const {picked,stocked}=pickVariant(raw);
      const im=imageMap(raw);
      const exactImage=picked?(im.get(picked.imagesid)||null):null;
      const fallback=/^https?:\/\//i.test(String(raw?.imagefirst||""))?String(raw.imagefirst):null;
      const imageUrl=exactImage||fallback;
      const img=await imageProbe(imageUrl);

      const markets:any={};
      if(picked){
        const quotes=await Promise.all(DESTINATIONS.map(async country=>{
          try{
            const q=await signedGet(apiKey,apiSecret,"get_product_shiping_fees.html",{
              productid:productId,variantId:picked.id,countrycode:country
            });
            const ship=(q.http===200&&String(q.body?.code)==="0")?cheapestShipping(q.body):null;
            if(!ship) return [country,{shipping_verified:false,http:q.http,supplier_code:q.body?.code??null}];
            const landed=money(picked.cost+ship.cost_usd);
            return [country,{
              shipping_verified:true,
              shipping:ship,
              supplier_cost_usd:money(picked.cost),
              landed_supplier_plus_shipping_usd:landed,
              price_gate_shadow:shadowPrice(landed),
              final_profit_verified:false
            }];
          }catch{
            return [country,{shipping_verified:false,error:"QUOTE_REVIEW_REQUIRED"}];
          }
        }));
        Object.assign(markets,Object.fromEntries(quotes));
      }

      evaluated.push({
        product_id:productId,
        title,
        style_text_gate:STYLE_TONE_HOLD.test(title)?"HOLD_SUPPLIER_MARKETING_TONE":"PASS_TEXT_STYLE",
        physical_quality_verified:false,
        physical_quality_gate:"SUPPLIER_API_CANNOT_PROVE_MATERIAL_OR_BUILD_QUALITY",
        picked_variant:picked?{
          id:picked.id,sku:picked.sku||null,title:picked.title||null,
          supplier_cost_usd:money(picked.cost),inventory_snapshot:Math.max(0,Math.trunc(picked.stock||0)),
          weight_g:picked.weight_g
        }:null,
        stocked_variant_count:stocked.length,
        exact_variant_image:imageUrl,
        image_scope:exactImage?"EXACT_VARIANT":"PRODUCT_FALLBACK",
        image_probe:img,
        visual_style_quality_gate:"VISUAL_REVIEW_REQUIRED",
        fresh_stock_recheck_required:true,
        markets,
        production_exposure:false,
        checkout:"DISABLED",
        fulfillment:"DISABLED"
      });
    }

    return reply({
      ok:true,provider:"EPROLO",mode:"READ_ONLY_EVALUATION_V2",
      endpoint_scope:["eprolo_product_list.html","get_product_shiping_fees.html"],
      destinations:DESTINATIONS,
      sample_count:evaluated.length,
      evaluated,
      final_profit_definition:"NOT_VERIFIED_UNTIL_FINAL_SUPPLIER_ORDER_COST_METHOD_IS_VERIFIED",
      payment:"OFF",supplier_live_order:"OFF",production_catalog_write:false
    });
  }catch{
    return reply({ok:false,mode:"READ_ONLY_EVALUATION_V2",error:"server-side evaluation failed",payment:"OFF",supplier_live_order:"OFF"},500);
  }finally{
    await sql.end({timeout:2}).catch(()=>{});
  }
});