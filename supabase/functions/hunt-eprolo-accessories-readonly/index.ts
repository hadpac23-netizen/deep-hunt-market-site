import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import postgres from "npm:postgres@3.4.5";
import { createHash } from "node:crypto";

const BASE="https://openapi.eprolo.com/";
const CATEGORY_ID=61;
const LIMIT=10;
const DEST=["IL","DE","US"] as const;
const SAFE_ACCESSORY=/\b(wallet|purse|card holder|card case|coin pouch|coin purse|small bag|crossbody bag|phone pouch)\b/i;
const BRAND_REVIEW=/\b(apple|iphone|samsung|gucci|louis vuitton|chanel|dior|prada|hermes|coach|batman|marvel|disney|pokemon|hello kitty|star wars|nike|adidas)\b/i;
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
  const r=await fetch(u,{headers:{"apiKey":k,"Accept":"application/json","User-Agent":"HUNT-EPROLO-ACCESSORIES-READONLY/3.0"},signal:AbortSignal.timeout(15000)});
  return {http:r.status,body:await r.json().catch(()=>null)};
}
function pick(raw:any){
  const rows=(raw?.variantlist||[]).map((v:any)=>({
    id:String(v?.id||v?.variantsid||v?.variantId||""),
    cost:num(v?.cost),stock:num(v?.inventory_quantity),weight:num(v?.weight),
    title:String(v?.title||""),imageId:String(v?.imagesid||"")
  })).filter((v:any)=>v.id&&v.cost!==null&&v.cost>0&&(v.stock??0)>0);
  rows.sort((a:any,b:any)=>(a.cost-b.cost)||((b.stock??0)-(a.stock??0)));
  return {picked:rows[0]||null,count:rows.length};
}
function image(raw:any,id:string){
  const row=(raw?.imagelist||[]).find((x:any)=>String(x?.id||"")===id);
  const exact=String(row?.src||"");
  if(/^https?:\/\//i.test(exact))return {url:exact,scope:"EXACT_VARIANT"};
  const fb=String(raw?.imagefirst||"");
  return {url:/^https?:\/\//i.test(fb)?fb:null,scope:"PRODUCT_FALLBACK"};
}
function magic(b:Uint8Array){
  if(b.length>=3&&b[0]===0xff&&b[1]===0xd8&&b[2]===0xff)return "image/jpeg";
  if(b.length>=8&&b[0]===0x89&&b[1]===0x50&&b[2]===0x4e&&b[3]===0x47)return "image/png";
  if(b.length>=12&&String.fromCharCode(...b.slice(0,4))==="RIFF"&&String.fromCharCode(...b.slice(8,12))==="WEBP")return "image/webp";
  return null;
}
async function probe(url:string|null){
  if(!url)return {pass:false,http:null,type:null,bytes:null};
  try{
    const h=await fetch(url,{method:"HEAD",redirect:"follow",signal:AbortSignal.timeout(8000)});
    const type=h.headers.get("content-type"),bytes=num(h.headers.get("content-length"));
    if(h.ok&&type?.toLowerCase().startsWith("image/")&&(bytes===null||bytes>=12000))
      return {pass:true,http:h.status,type,bytes};
    const g=await fetch(url,{method:"GET",headers:{"Range":"bytes=0-31"},redirect:"follow",signal:AbortSignal.timeout(8000)});
    const b=new Uint8Array(await g.arrayBuffer()),detected=magic(b);
    return {pass:Boolean(g.ok&&detected&&(bytes===null||bytes>=12000)),http:g.status,type:detected||g.headers.get("content-type"),bytes};
  }catch{return {pass:false,http:null,type:null,bytes:null};}
}
function cheapest(body:any){
  const a:any[]=[];
  for(const v of (body?.data?.variantlist||[]))
    for(const l of (v?.logistics_cost_list||[]))
      for(const x of (l?.cost_list||[])){
        const c=num(x?.cost);
        if(c!==null&&c>=0)a.push({cost_usd:money(c),method:String(x?.ship_method||""),eta:String(x?.shiptime||"")});
      }
  a.sort((x,y)=>x.cost_usd-y.cost_usd);return a[0]||null;
}
function price(landed:number){
  const reserve=.91,minProfit=4,target=.35;
  const retail=Math.max(.99,Math.ceil(Math.max((landed+minProfit)/reserve,landed/(reserve-target)))-.01);
  return {retail_usd:money(retail),projected_contribution_profit_usd:money(retail*reserve-landed),status:"SHADOW_ONLY"};
}

Deno.serve(async(req:Request)=>{
  if(req.method!=="POST")return reply({error:"POST required"},405);
  const db=Deno.env.get("SUPABASE_DB_URL");if(!db)return reply({error:"server config"},500);
  const sql=postgres(db,{prepare:false,max:1});
  try{
    const rows=await sql`select name,decrypted_secret from vault.decrypted_secrets where name in ('hunt_eprolo_api_key','hunt_eprolo_api_secret','hunt_eprolo_pilot_token')`;
    const sec=Object.fromEntries(rows.map((r:any)=>[r.name,r.decrypted_secret]));
    if(req.headers.get("x-hunt-internal-token")!==sec.hunt_eprolo_pilot_token)return reply({error:"unauthorized"},401);
    const k=String(sec.hunt_eprolo_api_key||""),s=String(sec.hunt_eprolo_api_secret||"");

    const cat=await get(k,s,"eprolo_product_list.html",{page:1,page_size:LIMIT,wareTypeTwoId:CATEGORY_ID});
    if(cat.http!==200||String(cat.body?.code)!=="0"||!Array.isArray(cat.body?.data))return reply({ok:false,error:"category_read_failed"},502);

    const products:any[]=[];
    for(const raw of cat.body.data.slice(0,LIMIT)){
      const productId=String(raw?.product_id||raw?.id||""),title=String(raw?.title||"").trim();
      const taxonomy=SAFE_ACCESSORY.test(title);
      const brand=BRAND_REVIEW.test(title);
      const v=pick(raw);
      if(!productId||!title||!v.picked){
        products.push({product_id:productId||null,title,status:"REVIEW_REQUIRED",technical_shadow_pass:false});
        continue;
      }
      const img=image(raw,v.picked.imageId),ig=await probe(img.url);
      const markets=Object.fromEntries(await Promise.all(DEST.map(async cc=>{
        try{
          const q=await get(k,s,"get_product_shiping_fees.html",{productid:productId,variantId:v.picked.id,countrycode:cc});
          const sh=q.http===200&&String(q.body?.code)==="0"?cheapest(q.body):null;
          if(!sh)return [cc,{shipping_verified:false}];
          const landed=money(v.picked.cost+sh.cost_usd);
          return [cc,{shipping_verified:true,shipping:sh,landed_supplier_plus_shipping_usd:landed,price_gate_shadow:price(landed),final_profit_verified:false}];
        }catch{return [cc,{shipping_verified:false}];}
      })));
      const shipping=DEST.every(cc=>markets[cc]?.shipping_verified===true);
      const pass=taxonomy&&!brand&&ig.pass&&shipping;
      products.push({
        product_id:productId,title,status:pass?"TECHNICAL_SHADOW_PASS":"REVIEW_REQUIRED",technical_shadow_pass:pass,
        taxonomy_gate:taxonomy?"PASS":"HOLD_CATEGORY_MISMATCH",
        brand_gate:brand?"BRAND_REVIEW_REQUIRED":"PASS",
        picked_variant:{id:v.picked.id,title:v.picked.title||null,supplier_cost_usd:money(v.picked.cost),inventory_snapshot:Math.max(0,Math.trunc(v.picked.stock||0)),weight_g:v.picked.weight},
        stocked_variant_count:v.count,image_scope:img.scope,image_technical_gate:ig,markets,
        physical_quality_verified:false,visual_merchandising_verified:false,final_profit_verified:false,
        fresh_stock_recheck_required:true,production_exposure:false,checkout:"DISABLED",fulfillment:"DISABLED"
      });
    }

    const summary={
      checked:products.length,
      technical_shadow_pass:products.filter(x=>x.technical_shadow_pass).length,
      taxonomy_pass:products.filter(x=>x.taxonomy_gate==="PASS").length,
      brand_review:products.filter(x=>x.brand_gate==="BRAND_REVIEW_REQUIRED").length,
      image_technical_pass:products.filter(x=>x.image_technical_gate?.pass===true).length,
      all_3_markets_shipping_pass:products.filter(x=>DEST.every(cc=>x.markets?.[cc]?.shipping_verified===true)).length,
      physical_quality_verified:0,visual_merchandising_verified:0,final_profit_verified:0,fully_ready:0
    };
    return reply({ok:true,provider:"EPROLO",mode:"READ_ONLY_ACCESSORIES_61_V3",category_id:CATEGORY_ID,category_label:"wallets_small_accessories",destinations:DEST,summary,products,payment:"OFF",supplier_live_order:"OFF",production_catalog_write:false});
  }finally{await sql.end({timeout:2}).catch(()=>{});}
});