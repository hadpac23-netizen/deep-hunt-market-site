import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import postgres from "npm:postgres@3.4.5";
import { createHash } from "node:crypto";

const BASE="https://openapi.eprolo.com/";
const TARGETS=[
  {product_id:"24539908",category_id:1256,variant_id:"629377685"},
  {product_id:"25395988",category_id:1230,variant_id:"639401972"}
];

function sig(k:string,s:string){
  const timestamp=String(Date.now());
  return {timestamp,sign:createHash("md5").update(k+timestamp+s).digest("hex")};
}
async function get(k:string,s:string,path:string,params:Record<string,string|number>){
  const a=sig(k,s),u=new URL(path,BASE);
  for(const [x,v] of Object.entries(params))u.searchParams.set(x,String(v));
  u.searchParams.set("timestamp",a.timestamp);u.searchParams.set("sign",a.sign);
  const r=await fetch(u,{headers:{"apiKey":k,"Accept":"application/json","User-Agent":"HUNT-EPROLO-VISUAL-2/1.0"},signal:AbortSignal.timeout(15000)});
  return {http:r.status,body:await r.json().catch(()=>null)};
}
Deno.serve(async(req:Request)=>{
  if(req.method!=="POST") return new Response('{"error":"POST required"}',{status:405,headers:{"Content-Type":"application/json"}});
  const db=Deno.env.get("SUPABASE_DB_URL");
  if(!db) return new Response('{"error":"server config"}',{status:500,headers:{"Content-Type":"application/json"}});
  const sql=postgres(db,{prepare:false,max:1});
  try{
    const rows=await sql`select name,decrypted_secret from vault.decrypted_secrets where name in ('hunt_eprolo_api_key','hunt_eprolo_api_secret','hunt_eprolo_pilot_token')`;
    const sec=Object.fromEntries(rows.map((r:any)=>[r.name,r.decrypted_secret]));
    if(req.headers.get("x-hunt-internal-token")!==sec.hunt_eprolo_pilot_token)
      return new Response('{"error":"unauthorized"}',{status:401,headers:{"Content-Type":"application/json"}});
    const k=String(sec.hunt_eprolo_api_key||""),s=String(sec.hunt_eprolo_api_secret||"");
    const out=[];
    for(const t of TARGETS){
      const cat=await get(k,s,"eprolo_product_list.html",{page:1,page_size:200,wareTypeTwoId:t.category_id});
      const product=(cat.body?.data||[]).find((x:any)=>String(x?.product_id||x?.id||"")===t.product_id);
      if(!product){out.push({...t,status:"PRODUCT_NOT_FOUND"});continue;}
      const variant=(product.variantlist||[]).find((v:any)=>String(v?.id||v?.variantsid||v?.variantId||"")===t.variant_id);
      const imageId=String(variant?.imagesid||"");
      const image=(product.imagelist||[]).find((x:any)=>String(x?.id||"")===imageId);
      const url=String(image?.src||product?.imagefirst||"");
      out.push({
        ...t,status:url?"PASS":"IMAGE_MISSING",
        title:String(product?.title||""),
        variant_title:String(variant?.title||""),
        image_url:url||null
      });
    }
    return new Response(JSON.stringify({ok:true,mode:"READ_ONLY_VISUAL_2",products:out}),{headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
  }finally{await sql.end({timeout:2}).catch(()=>{});}
});