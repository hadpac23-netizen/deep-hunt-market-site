const BASE=Deno.env.get("SUPABASE_URL")||"";
const SERVICE=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";

const ALLOWED_ORIGINS=new Set([
  "https://deep-hunt-market.netlify.app",
  "https://hadpac23-netizen.github.io",
  "http://127.0.0.1:18977",
  "http://localhost:18977"
]);
const DEPARTMENTS=[
  ["women","Women"],["men","Men"],["kids","Kids & Baby"],["beauty","Beauty"],
  ["accessories","Accessories & Jewelry"],["tech","Phone & Tech"],["home","Home & Living"],
  ["sports","Sports & Outdoors"],["pets","Pets"],["toys","Toys"],["travel","Travel"],
  ["office","Office & Crafts"],["gifts","Gifts & Party"]
];
const TARGET=1000;
const MAX_FRESH_HOURS=24;

function cors(req:Request){
  const origin=req.headers.get("origin")||"";
  const preview=/^https:\/\/[a-z0-9-]+--deep-hunt-market\.netlify\.app$/i.test(origin);
  return {
    "Access-Control-Allow-Origin":(ALLOWED_ORIGINS.has(origin)||preview)?origin:"https://deep-hunt-market.netlify.app",
    "Access-Control-Allow-Headers":"apikey, authorization, content-type",
    "Access-Control-Allow-Methods":"GET, POST, OPTIONS",
    "Vary":"Origin"
  };
}
function json(req:Request,data:unknown,status=200){
  return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json","cache-control":"no-store",...cors(req)}});
}
async function rest(path:string){
  const r=await fetch(BASE+"/rest/v1/"+path,{headers:{apikey:SERVICE,Authorization:"Bearer "+SERVICE}});
  const t=await r.text();
  let d=null;try{d=t?JSON.parse(t):null;}catch{d=null;}
  if(!r.ok)throw new Error((d as any)?.message||(d as any)?.error||("REST_"+r.status));
  return d;
}
async function adminUser(req:Request){
  const auth=req.headers.get("authorization")||"";
  const token=auth.startsWith("Bearer ")?auth.slice(7).trim():"";
  if(!token)return null;
  const u=await fetch(BASE+"/auth/v1/user",{headers:{apikey:SERVICE,Authorization:"Bearer "+token}});
  if(!u.ok)return null;
  const user=await u.json();if(!user?.id)return null;
  const p=await rest("profiles?id=eq."+encodeURIComponent(user.id)+"&select=is_admin&limit=1");
  return p?.[0]?.is_admin===true?user:null;
}
function isFresh(ts:unknown,hours=MAX_FRESH_HOURS){
  const n=Date.parse(String(ts||""));
  return Number.isFinite(n)&&Date.now()-n<=hours*3600000;
}
function state(count:number|null,resolved=true){
  if(!resolved)return "UNRESOLVED";
  if(count===null)return "UNKNOWN";
  if(count<=0)return "EMPTY";
  if(count<50)return "CRITICAL";
  if(count<250)return "THIN";
  if(count<TARGET)return "BUILDING";
  return "READY";
}

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(req)});
  if(!["GET","POST"].includes(req.method))return json(req,{ok:false,error:"METHOD_NOT_ALLOWED"},405);
  if(!BASE||!SERVICE)return json(req,{ok:false,error:"SERVER_CONFIG_MISSING"},500);
  if(!(await adminUser(req)))return json(req,{ok:false,error:"ADMIN_REQUIRED"},403);

  try{
    const rows=await rest("hunt_shelf_coverage?select=shelf_slug,static_unique_products,live_verified_products,curated_eligible_products,providers,coverage_status,last_live_audit_at,updated_at");
    const bySlug=new Map((rows||[]).map((x:any)=>[String(x.shelf_slug),x]));
    const departments=DEPARTMENTS.map(([slug,title])=>{
      const row:any=bySlug.get(slug)||null;
      const evidenceFresh=Boolean(row&&isFresh(row.last_live_audit_at));
      const raw=Number.isFinite(Number(row?.live_verified_products))?Number(row.live_verified_products):null;
      const verified=evidenceFresh?raw:null;
      return {
        slug,title,resolved:true,state:state(verified,true),
        verified_count:verified,
        stale_verified_count:evidenceFresh?null:raw,
        gap_to_target:verified===null?TARGET:Math.max(0,TARGET-verified),
        evidence_fresh:evidenceFresh,
        providers:Array.isArray(row?.providers)?row.providers:[],
        last_live_audit_at:row?.last_live_audit_at||null,
        static_unique_products:Number(row?.static_unique_products||0),
        curated_eligible_products:Number.isFinite(Number(row?.curated_eligible_products))?Number(row.curated_eligible_products):null
      };
    });
    for(let i=14;i<=17;i++){
      departments.push({
        slug:null,title:"Unresolved department "+i,resolved:false,state:"UNRESOLVED",
        verified_count:null,stale_verified_count:null,gap_to_target:TARGET,evidence_fresh:false,
        providers:[],last_live_audit_at:null,static_unique_products:0,curated_eligible_products:null
      });
    }
    const summary={
      target_departments:17,target_per_department:TARGET,target_total:17*TARGET,
      canonical_resolved:13,unresolved:4,
      ready:departments.filter((x:any)=>x.state==="READY").length,
      unknown:departments.filter((x:any)=>x.state==="UNKNOWN").length,
      stale:departments.filter((x:any)=>x.resolved&&!x.evidence_fresh).length,
      known_verified_total:departments.reduce((sum:number,x:any)=>sum+(Number(x.verified_count)||0),0)
    };
    return json(req,{
      ok:true,version:"HUNT-SHELF-COVERAGE-SERVER-V1",
      generated_at:new Date().toISOString(),
      readiness:summary.ready===17?"READY":"BLOCKED",
      truth_rule:"Only fresh live_verified_products count toward readiness. Stale/static/curated counts are evidence context only.",
      summary,departments
    });
  }catch(error){
    return json(req,{ok:false,error:error instanceof Error?error.message:"SHELF_COVERAGE_FAILED"},500);
  }
});