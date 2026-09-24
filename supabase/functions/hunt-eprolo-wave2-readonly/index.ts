import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import postgres from "npm:postgres@3.4.5";
import { createHash } from "node:crypto";

const BASE="https://openapi.eprolo.com/";
const DEST=["IL","DE","US"] as const;
const LANES=[
  {department:"men",category:"men-tops",id:1256,take:4},
  {department:"men",category:"men-bottoms",id:1230,take:4},
  {department:"home",category:"lighting",id:109,take:4},
  {department:"tech",category:"phone-cases",id:36,take:4},
  {department:"tech",category:"wearable-accessories",id:43,take:4},
];
const HOLD_LANGUAGE=/\b(slimming|slim(?:[- ]?fit(?:ting)?)?|skinny|body[- ]?shaping|weight[- ]?loss)\b/i;
const ACTIVE_ELECTRONICS=/\b(battery|rechargeable|charger|charging|wireless|bluetooth|electronic|electric|power|led|lamp|light|clock|smartwatch|smart watch|smart bracelet)\b/i;
const HEALTH_CLAIM=/\b(ecg|ppg|heart rate|blood oxygen|blood pressure|health monitoring|medical)\b/i;
const BRAND_COMPAT=/\b(iphone|apple|samsung|whoop)\b/i;
const H={"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"};

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
  const r=await fetch(u,{headers:{"apiKey":k,"Accept":"application/json","User-Agent":"HUNT-EPROLO-WAVE2-READONLY/3.0"},signal:AbortSignal.timeout(15000)});
  return {http:r.status,body:await r.json().catch(()=>null)};
}
function variant(raw:any){
  const rows=(raw?.variantlist||[]).map((v:any)=>({
    id:String(v?.id||v?.variantsid||v?.variantId||""),
    cost:num(v?.cost),stock:num(v?.inventory_quantity),weight:num(v?.weight),
    title:String(v?.title||""),sku:String(v?.sku||""),imageId:String(v?.imagesid||"")
  })).filter((v:any)=>v.id&&v.cost!==null&&v.cost>0&&(v.stock??0)>0);
  rows.sort((a:any,b:any)=>(a.cost-b.cost)||((b.stock??0)-(a.stock??0)));
  return {picked:rows[0]||null,count:rows.length};
}
function img(raw:any,id:string){
  const row=(raw?.imagelist||[]).find((x:any)=>String(x?.id||"")===id);
  const exact=String(row?.src||"");
  if(/^https?:\/\//i.test(exact))return {url:exact,scope:"EXACT_VARIANT"};
  const fb=String(raw?.imagefirst||"");
  return {url:/^https?:\/\//i.test(fb)?fb:null,scope:"PRODUCT_FALLBACK"};
}
function magic(bytes:Uint8Array){
  if(bytes.length>=3&&bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff)return "image/jpeg";
  if(bytes.length>=8&&bytes[0]===0x89&&bytes[1]===0x50&&bytes[2]===0x4e&&bytes[3]===0x47)return "image/png";
  if(bytes.length>=12&&String.fromCharCode(...bytes.slice(0,4))==="RIFF"&&String.fromCharCode(...bytes.slice(8,12))==="WEBP")return "image/webp";
  return null;
}
async function probe(url:string|null){
  if(!url)return {pass:false,http:null,type:null,bytes:null,verified_by:null};
  try{
    const h=await fetch(url,{method:"HEAD",redirect:"follow",signal:AbortSignal.timeout(8000)});
    const type=h.headers.get("content-type"),bytes=num(h.headers.get("content-length"));
    if(h.ok&&type?.toLowerCase().startsWith("image/")&&(bytes===null||bytes>=15000))
      return {pass:true,http:h.status,type,bytes,verified_by:"HEAD_CONTENT_TYPE"};
    const g=await fetch(url,{method:"GET",headers:{"Range":"bytes=0-31"},redirect:"follow",signal:AbortSignal.timeout(8000)});
    const arr=new Uint8Array(await g.arrayBuffer()),detected=magic(arr);
    return {pass:Boolean(g.ok&&detected&&(bytes===null||bytes>=15000)),http:g.status,type:detected||g.headers.get("content-type"),bytes,verified_by:detected?"MAGIC_BYTES":"FAILED"};
  }catch{return {pass:false,http:null,type:null,bytes:null,verified_by:"FETCH_FAILED"};}
}
function ship(body:any){
  const x:any[]=[];
  for(const v of (body?.data?.variantlist||[]))
    for(const l of (v?.logistics_cost_list||[]))
      for(const c of (l?.cost_list||[])){
        const cost=num(c?.cost);if(cost!==null&&cost>=0)x.push({cost_usd:money(cost),method:String(c?.ship_method||""),eta:String(c?.shiptime||"")});
      }
  x.sort((a,b)=>a.cost_usd-b.cost_usd);return x[0]||null;
}
function taxonomyPass(category:string,title:string){
  const t=title.toLowerCase();
  if(category==="men-tops")return /\b(men|men's|male)\b/.test(t)&&/\b(sweater|pullover|shirt|t-shirt|tee|hoodie|jacket|coat|top)\b/.test(t)&&!/\bwomen|women's|female\b/.test(t);
  if(category==="men-bottoms")return /\b(men|men's|male)\b/.test(t)&&/\b(pants|trousers|jeans|shorts|bottom)\b/.test(t)&&!/\bwomen|women's|female\b/.test(t);
  if(category==="lighting")return /\b(lamp|light|lighting|lantern)\b/.test(t);
  if(category==="digital-clock")return /\bclock|alarm clock|digital clock\b/.test(t);
  if(category==="phone-cases")return /\b(case|cover)\b/.test(t)&&/\b(phone|iphone|smartphone|mobile)\b/.test(t);
  if(category==="wearable-accessories")return /\b(strap|band|case|cover)\b/.test(t);
  return false;
}
function price(landed:number){
  const reserve=.91,minProfit=4,target=.35;
  const retail=Math.max(.99,Math.ceil(Math.max((landed+minProfit)/reserve,landed/(reserve-target)))-.01);
  return {retail_usd:money(retail),projected_contribution_profit_usd:money(retail*reserve-landed),status:"SHADOW_ONLY"};
}
async function evalProduct(raw:any,lane:any,k:string,s:string){
  const productId=String(raw?.product_id||raw?.id||""),title=String(raw?.title||"").trim();
  const v=variant(raw);
  if(!productId||!title||!v.picked)return {department:lane.department,category:lane.category,product_id:productId||null,title,status:"REVIEW_REQUIRED",technical_shadow_pass:false};

  const image=img(raw,v.picked.imageId),imageGate=await probe(image.url);
  const quotes=Object.fromEntries(await Promise.all(DEST.map(async cc=>{
    try{
      const q=await get(k,s,"get_product_shiping_fees.html",{productid:productId,variantId:v.picked.id,countrycode:cc});
      const best=q.http===200&&String(q.body?.code)==="0"?ship(q.body):null;
      if(!best)return [cc,{shipping_verified:false}];
      const landed=money(v.picked.cost+best.cost_usd);
      return [cc,{shipping_verified:true,shipping:best,landed_supplier_plus_shipping_usd:landed,price_gate_shadow:price(landed),final_profit_verified:false}];
    }catch{return [cc,{shipping_verified:false}];}
  })));

  const taxonomy=taxonomyPass(lane.category,title);
  const langHold=HOLD_LANGUAGE.test(title);
  const batteryRoute=DEST.some(cc=>/battery/i.test(String(quotes[cc]?.shipping?.method||"")));
  const compliance=((lane.department==="tech"||lane.department==="home")&&ACTIVE_ELECTRONICS.test(title))||batteryRoute;
  const health=HEALTH_CLAIM.test(title);
  const brand=(lane.category==="phone-cases"||lane.category==="wearable-accessories")&&BRAND_COMPAT.test(title);
  const shippingPass=DEST.every(cc=>quotes[cc]?.shipping_verified===true);
  const pass=taxonomy&&!langHold&&!compliance&&!health&&!brand&&imageGate.pass&&shippingPass;

  return {
    department:lane.department,category:lane.category,product_id:productId,title,
    status:pass?"TECHNICAL_SHADOW_PASS":"REVIEW_REQUIRED",technical_shadow_pass:pass,
    taxonomy_gate:taxonomy?"PASS":"HOLD_CATEGORY_MISMATCH",
    language_gate:langHold?"HOLD_MARKETING_LANGUAGE":"PASS",
    compliance_gate:compliance?"COMPLIANCE_REVIEW_REQUIRED":"PASS",
    health_claim_gate:health?"HEALTH_CLAIM_REVIEW_REQUIRED":"PASS",
    brand_compatibility_gate:brand?"BRAND_COMPATIBILITY_REVIEW_REQUIRED":"PASS",
    picked_variant:{id:v.picked.id,sku:v.picked.sku||null,supplier_cost_usd:money(v.picked.cost),inventory_snapshot:Math.max(0,Math.trunc(v.picked.stock||0)),weight_g:v.picked.weight},
    stocked_variant_count:v.count,image_scope:image.scope,image_technical_gate:imageGate,
    markets:quotes,physical_quality_verified:false,visual_merchandising_verified:false,
    final_profit_verified:false,fresh_stock_recheck_required:true,
    production_exposure:false,checkout:"DISABLED",fulfillment:"DISABLED"
  };
}

Deno.serve(async(req:Request)=>{
  if(req.method!=="POST")return reply({error:"POST required"},405);
  const db=Deno.env.get("SUPABASE_DB_URL");if(!db)return reply({error:"server config"},500);
  const sql=postgres(db,{prepare:false,max:1});
  try{
    const rows=await sql`select name,decrypted_secret from vault.decrypted_secrets where name in ('hunt_eprolo_api_key','hunt_eprolo_api_secret','hunt_eprolo_pilot_token')`;
    const sec=Object.fromEntries(rows.map((r:any)=>[r.name,r.decrypted_secret]));
    if(req.headers.get("x-hunt-internal-token")!==sec.hunt_eprolo_pilot_token)return reply({error:"unauthorized"},401);
    const k=String(sec.hunt_eprolo_api_key||""),s=String(sec.hunt_eprolo_api_secret||"");if(!k||!s)return reply({error:"supplier credentials unavailable"},503);

    const products:any[]=[];
    for(const lane of LANES){
      const cat=await get(k,s,"eprolo_product_list.html",{page:1,page_size:lane.take,wareTypeTwoId:lane.id});
      if(cat.http!==200||String(cat.body?.code)!=="0"||!Array.isArray(cat.body?.data)){
        products.push({department:lane.department,category:lane.category,status:"CATEGORY_READ_FAILED",technical_shadow_pass:false});
        continue;
      }
      products.push(...await Promise.all(cat.body.data.slice(0,lane.take).map((r:any)=>evalProduct(r,lane,k,s))));
    }
    const summary={
      checked:products.filter(x=>x.product_id).length,
      technical_shadow_pass:products.filter(x=>x.technical_shadow_pass).length,
      taxonomy_hold:products.filter(x=>x.taxonomy_gate==="HOLD_CATEGORY_MISMATCH").length,
      language_hold:products.filter(x=>x.language_gate==="HOLD_MARKETING_LANGUAGE").length,
      compliance_review:products.filter(x=>x.compliance_gate==="COMPLIANCE_REVIEW_REQUIRED").length,
      health_claim_review:products.filter(x=>x.health_claim_gate==="HEALTH_CLAIM_REVIEW_REQUIRED").length,
      brand_compatibility_review:products.filter(x=>x.brand_compatibility_gate==="BRAND_COMPATIBILITY_REVIEW_REQUIRED").length,
      image_technical_pass:products.filter(x=>x.image_technical_gate?.pass===true).length,
      all_3_markets_shipping_pass:products.filter(x=>x.product_id&&DEST.every(cc=>x.markets?.[cc]?.shipping_verified===true)).length,
      physical_quality_verified:0,visual_merchandising_verified:0,final_profit_verified:0,fully_ready:0
    };
    return reply({ok:true,provider:"EPROLO",mode:"READ_ONLY_WAVE2_V3",destinations:DEST,summary,products,
      accessories:{status:"MAPPING_REQUIRED",reason:"fashion accessories category id not yet verified"},
      payment:"OFF",supplier_live_order:"OFF",production_catalog_write:false});
  }catch{return reply({ok:false,error:"server_side_evaluation_failed"},500);}
  finally{await sql.end({timeout:2}).catch(()=>{});}
});