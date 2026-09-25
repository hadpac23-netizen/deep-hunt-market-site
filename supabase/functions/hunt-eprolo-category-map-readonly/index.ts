import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import postgres from "npm:postgres@3.4.5";
import { createHash } from "node:crypto";

const BASE="https://openapi.eprolo.com/";
const IDS=[60,61,62,63,64,65,66];
const SAFE_FASHION=/\b(bag|handbag|purse|wallet|shoe|shoes|sneaker|sneakers|boot|boots|slipper|slippers|sandal|sandals)\b/i;
const H={"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"};

function sig(k:string,s:string){
  const timestamp=String(Date.now());
  return {timestamp,sign:createHash("md5").update(k+timestamp+s).digest("hex")};
}
async function get(k:string,s:string,id:number){
  const a=sig(k,s),u=new URL("eprolo_product_list.html",BASE);
  for(const [x,v] of Object.entries({page:1,page_size:5,wareTypeTwoId:id}))u.searchParams.set(x,String(v));
  u.searchParams.set("timestamp",a.timestamp);u.searchParams.set("sign",a.sign);
  const r=await fetch(u,{headers:{"apiKey":k,"Accept":"application/json","User-Agent":"HUNT-EPROLO-SAFE-FASHION-MAP/1.0"},signal:AbortSignal.timeout(12000)});
  return {http:r.status,body:await r.json().catch(()=>null)};
}

Deno.serve(async(req:Request)=>{
  if(req.method!=="POST")return new Response('{"error":"POST required"}',{status:405,headers:H});
  const db=Deno.env.get("SUPABASE_DB_URL"); if(!db)return new Response('{"error":"server config"}',{status:500,headers:H});
  const sql=postgres(db,{prepare:false,max:1});
  try{
    const rows=await sql`select name,decrypted_secret from vault.decrypted_secrets where name in ('hunt_eprolo_api_key','hunt_eprolo_api_secret','hunt_eprolo_pilot_token')`;
    const sec=Object.fromEntries(rows.map((r:any)=>[r.name,r.decrypted_secret]));
    if(req.headers.get("x-hunt-internal-token")!==sec.hunt_eprolo_pilot_token)
      return new Response('{"error":"unauthorized"}',{status:401,headers:H});
    const k=String(sec.hunt_eprolo_api_key||""),s=String(sec.hunt_eprolo_api_secret||"");
    const matches:any[]=[];
    for(const id of IDS){
      try{
        const r=await get(k,s,id);
        const data=Array.isArray(r.body?.data)?r.body.data:[];
        const safe=data.map((x:any)=>String(x?.title||"")).filter((t:string)=>SAFE_FASHION.test(t)).slice(0,5);
        if(r.http===200&&String(r.body?.code)==="0"&&safe.length){
          matches.push({wareTypeTwoId:id,safe_sample_titles:safe});
        }
      }catch{}
    }
    return new Response(JSON.stringify({ok:true,mode:"SAFE_FASHION_CATEGORY_MAP",ids:IDS,matches}),{headers:H});
  }finally{await sql.end({timeout:2}).catch(()=>{});}
});