import {buildDryRunPlan} from "./plan-core.mjs";

const BASE=Deno.env.get("SUPABASE_URL")||"";
const SERVICE=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const ALLOWED=new Set([
  "https://deep-hunt-market.netlify.app",
  "https://hadpac23-netizen.github.io",
  "http://127.0.0.1:18977",
  "http://localhost:18977"
]);

function cors(req:Request){
  const origin=req.headers.get("origin")||"";
  const preview=/^https:\/\/[a-z0-9-]+--deep-hunt-market\.netlify\.app$/i.test(origin);
  return {
    "Access-Control-Allow-Origin":(ALLOWED.has(origin)||preview)?origin:"https://deep-hunt-market.netlify.app",
    "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods":"POST, OPTIONS",
    "Vary":"Origin"
  };
}
function json(req:Request,data:unknown,status=200){return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json","cache-control":"no-store",...cors(req)}})}
async function rest(path:string){
  const res=await fetch(BASE+"/rest/v1/"+path,{headers:{apikey:SERVICE,Authorization:"Bearer "+SERVICE}});
  const text=await res.text();const data=text?JSON.parse(text):null;
  if(!res.ok)throw new Error(data?.message||data?.error||("REST_"+res.status));
  return data;
}
async function userFromReq(req:Request){
  const auth=req.headers.get("authorization")||"";
  const token=auth.startsWith("Bearer ")?auth.slice(7).trim():"";
  if(!token)return null;
  const res=await fetch(BASE+"/auth/v1/user",{headers:{apikey:SERVICE,Authorization:"Bearer "+token}});
  return res.ok?await res.json():null;
}
async function isAdmin(id:string){const rows=await rest("profiles?id=eq."+encodeURIComponent(id)+"&select=is_admin");return rows?.[0]?.is_admin===true}

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(req)});
  if(req.method!=="POST")return json(req,{error:"METHOD_NOT_ALLOWED"},405);
  try{
    if(!BASE||!SERVICE)throw new Error("SERVER_CONFIG_MISSING");
    const user=await userFromReq(req);
    if(!user?.id)return json(req,{error:"UNAUTHORIZED"},401);
    if(!await isAdmin(user.id))return json(req,{error:"FORBIDDEN"},403);
    const body=await req.json().catch(()=>null);
    if(!body||typeof body!=="object")return json(req,{error:"INVALID_JSON"},400);
    const result=buildDryRunPlan(body);
    return json(req,result,200);
  }catch(err){
    const message=String(err?.message||err||"UNKNOWN_ERROR");
    const clientErrors=new Set(["DRY_RUN_ONLY","PRODUCT_TRUTH_REVERIFY_REQUIRED","ROUTE_MUST_BE_NON_EXECUTABLE","SHOT_COUNT_INVALID"]);
    const status=clientErrors.has(message)||message.startsWith("SHOT_")?400:500;
    return json(req,{error:message},status);
  }
});
