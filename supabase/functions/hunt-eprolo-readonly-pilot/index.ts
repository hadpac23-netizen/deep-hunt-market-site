import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import postgres from "npm:postgres@3.4.5";
import { createHash } from "node:crypto";

const BASE = "https://openapi.eprolo.com/";
const DESTINATIONS = ["IL","DE","US"] as const;
const LIMIT = 25;
const CATEGORY_ID = 1241;
const JSON_HEADERS = {"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"};
const STYLE_HOLD = /\b(sexy|kink|fetish|provocative|slimming|slim[- ]?fitting|skinny|body[- ]?shaping|weight[- ]?loss)\b/i;

const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:JSON_HEADERS});
const num=(v:unknown)=>{const x=Number(v);return Number.isFinite(x)?x:null};
const money=(v:number)=>Math.round(v*100)/100;

function signature(apiKey:string,apiSecret:string){
  const timestamp=String(Date.now());
  return {timestamp,sign:createHash("md5").update(apiKey+timestamp+apiSecret).digest("hex")};
}

async function signedGet(apiKey:string,apiSecret:string,path:string,params:Record<string,string|number>){
  const s=signature(apiKey,apiSecret);
  const url=new URL(path,BASE);
  for(const [k,v] of Object.entries(params)) url.searchParams.set(k,String(v));
  url.searchParams.set("timestamp",s.timestamp);
  url.searchParams.set("sign",s.sign);
  const res=await fetch(url,{
    headers:{"apiKey":apiKey,"Accept":"application/json","User-Agent":"HUNT-EPROLO-WOMEN-READONLY/4.0"},
    signal:AbortSignal.timeout(15000)
  });
  return {http:res.status,body:await res.json().catch(()=>null)};
}

function pickVariant(raw:any){
  const rows=(Array.isArray(raw?.variantlist)?raw.variantlist:[]).map((v:any)=>({
    id:String(v?.id||v?.variantsid||v?.variantId||""),
    sku:String(v?.sku||""),
    title:String(v?.title||""),
    cost:num(v?.cost),
    stock:num(v?.inventory_quantity),
    weight_g:num(v?.weight),
    image_id:String(v?.imagesid||"")
  })).filter((v:any)=>v.id&&v.cost!==null&&v.cost>0&&(v.stock??0)>0);
  rows.sort((a:any,b:any)=>(a.cost-b.cost)||((b.stock??0)-(a.stock??0)));
  return {picked:rows[0]||null,stocked:rows};
}

function exactImage(raw:any,imageId:string){
  const row=(Array.isArray(raw?.imagelist)?raw.imagelist:[]).find((x:any)=>String(x?.id||"")===imageId);
  const src=String(row?.src||"");
  if(/^https?:\/\//i.test(src)) return {url:src,scope:"EXACT_VARIANT"};
  const fallback=String(raw?.imagefirst||"");
  return {url:/^https?:\/\//i.test(fallback)?fallback:null,scope:"PRODUCT_FALLBACK"};
}

async function imageProbe(url:string|null){
  if(!url) return {technical_pass:false,http:null,content_type:null,content_length:null};
  try{
    const res=await fetch(url,{method:"HEAD",redirect:"follow",signal:AbortSignal.timeout(8000)});
    const type=res.headers.get("content-type");
    const length=num(res.headers.get("content-length"));
    return {
      technical_pass:Boolean(res.ok&&type?.toLowerCase().startsWith("image/")&&(length===null||length>=15000)),
      http:res.status,content_type:type,content_length:length
    };
  }catch{
    return {technical_pass:false,http:null,content_type:null,content_length:null};
  }
}

function cheapestShipping(body:any){
  const out:any[]=[];
  for(const v of (body?.data?.variantlist||[]))
    for(const l of (v?.logistics_cost_list||[]))
      for(const x of (l?.cost_list||[])){
        const cost=num(x?.cost);
        if(cost!==null&&cost>=0) out.push({cost_usd:money(cost),method:String(x?.ship_method||""),eta:String(x?.shiptime||"")});
      }
  out.sort((a,b)=>a.cost_usd-b.cost_usd);
  return out[0]||null;
}

function shadowPrice(landed:number){
  const reserve=.91,minProfit=4,target=.35;
  const retail=Math.max(.99,Math.ceil(Math.max((landed+minProfit)/reserve,landed/(reserve-target)))-.01);
  const projected=retail*reserve-landed;
  return {retail_usd:money(retail),projected_contribution_profit_usd:money(projected),formula_status:"SHADOW_ONLY"};
}

async function evaluate(raw:any,apiKey:string,apiSecret:string){
  const productId=String(raw?.product_id||raw?.id||"");
  const title=String(raw?.title||"").trim();
  if(!productId||!title) return {product_id:productId||null,status:"REVIEW_REQUIRED",technical_shadow_pass:false};

  const styleGate=STYLE_HOLD.test(title)?"HOLD_MARKETING_LANGUAGE":"PASS_TEXT_STYLE";
  const {picked,stocked}=pickVariant(raw);
  if(!picked) return {product_id:productId,title,status:"NO_STOCKED_VARIANT",style_text_gate:styleGate,technical_shadow_pass:false};

  const img=exactImage(raw,picked.image_id);
  const image=await imageProbe(img.url);
  const entries=await Promise.all(DESTINATIONS.map(async country=>{
    try{
      const q=await signedGet(apiKey,apiSecret,"get_product_shiping_fees.html",{productid:productId,variantId:picked.id,countrycode:country});
      const ship=(q.http===200&&String(q.body?.code)==="0")?cheapestShipping(q.body):null;
      if(!ship) return [country,{shipping_verified:false}];
      const landed=money(picked.cost+ship.cost_usd);
      return [country,{shipping_verified:true,shipping:ship,landed_supplier_plus_shipping_usd:landed,price_gate_shadow:shadowPrice(landed),final_profit_verified:false}];
    }catch{return [country,{shipping_verified:false}];}
  }));
  const markets=Object.fromEntries(entries);
  const shippingPass=DESTINATIONS.every(c=>markets[c]?.shipping_verified===true);
  const pass=styleGate==="PASS_TEXT_STYLE"&&image.technical_pass&&shippingPass;

  return {
    product_id:productId,title,status:pass?"TECHNICAL_SHADOW_PASS":"REVIEW_REQUIRED",technical_shadow_pass:pass,
    style_text_gate:styleGate,
    picked_variant:{id:picked.id,sku:picked.sku||null,supplier_cost_usd:money(picked.cost),inventory_snapshot:Math.max(0,Math.trunc(picked.stock||0)),weight_g:picked.weight_g},
    stocked_variant_count:stocked.length,
    image_scope:img.scope,image_technical_gate:image,
    physical_quality_verified:false,visual_merchandising_verified:false,
    markets,final_profit_verified:false,fresh_stock_recheck_required:true,
    production_exposure:false,checkout:"DISABLED",fulfillment:"DISABLED"
  };
}

Deno.serve(async(req:Request)=>{
  if(req.method!=="POST") return reply({error:"POST required"},405);
  const dbUrl=Deno.env.get("SUPABASE_DB_URL");
  if(!dbUrl) return reply({error:"server configuration unavailable"},500);
  const sql=postgres(dbUrl,{prepare:false,max:1});
  try{
    const rows=await sql`select name,decrypted_secret from vault.decrypted_secrets where name in ('hunt_eprolo_api_key','hunt_eprolo_api_secret','hunt_eprolo_pilot_token')`;
    const sec=Object.fromEntries(rows.map((r:any)=>[r.name,r.decrypted_secret]));
    if(!sec.hunt_eprolo_pilot_token||req.headers.get("x-hunt-internal-token")!==sec.hunt_eprolo_pilot_token) return reply({error:"unauthorized"},401);
    const apiKey=String(sec.hunt_eprolo_api_key||""),apiSecret=String(sec.hunt_eprolo_api_secret||"");
    if(!apiKey||!apiSecret) return reply({error:"supplier credentials unavailable"},503);

    const cat=await signedGet(apiKey,apiSecret,"eprolo_product_list.html",{page:1,page_size:LIMIT,wareTypeTwoId:CATEGORY_ID});
    if(cat.http!==200||String(cat.body?.code)!=="0"||!Array.isArray(cat.body?.data)) return reply({ok:false,error:"catalog_read_failed"},502);

    const products:any[]=[];
    const src=cat.body.data.slice(0,LIMIT);
    for(let i=0;i<src.length;i+=5) products.push(...await Promise.all(src.slice(i,i+5).map((x:any)=>evaluate(x,apiKey,apiSecret))));

    const summary={
      checked:products.length,
      technical_shadow_pass:products.filter(x=>x.technical_shadow_pass).length,
      style_text_pass:products.filter(x=>x.style_text_gate==="PASS_TEXT_STYLE").length,
      style_text_hold:products.filter(x=>x.style_text_gate==="HOLD_MARKETING_LANGUAGE").length,
      image_technical_pass:products.filter(x=>x.image_technical_gate?.technical_pass===true).length,
      all_3_markets_shipping_pass:products.filter(x=>DESTINATIONS.every(c=>x.markets?.[c]?.shipping_verified===true)).length,
      physical_quality_verified:0,visual_merchandising_verified:0,final_profit_verified:0,fully_ready:0
    };
    return reply({
      ok:true,provider:"EPROLO",mode:"READ_ONLY_WOMEN_25_V2",category_scope:"women_dresses",destinations:DESTINATIONS,
      summary,products,
      gates:{physical_quality:"REVIEW_REQUIRED",visual_merchandising:"REVIEW_REQUIRED",fresh_stock:"REQUIRED_AT_ACTIVATION",final_supplier_order_cost:"REQUIRED",owner_gate:"REQUIRED"},
      payment:"OFF",supplier_live_order:"OFF",production_catalog_write:false
    });
  }catch{return reply({ok:false,error:"server_side_evaluation_failed"},500);}
  finally{await sql.end({timeout:2}).catch(()=>{});}
});