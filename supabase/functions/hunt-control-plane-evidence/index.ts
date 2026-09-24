import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const BASE=Deno.env.get("SUPABASE_URL")||"";
const SERVICE=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const PUBLISHABLE=Deno.env.get("SUPABASE_ANON_KEY")||"";
const PERSISTENCE_ENABLED=Deno.env.get("DRAGON_CONTROL_PERSISTENCE_ENABLED")==="true";

const admin=createClient(BASE,SERVICE,{auth:{persistSession:false,autoRefreshToken:false}});
const clean=(v:unknown)=>String(v??"").trim();

function cors(req:Request){
  const origin=req.headers.get("origin")||"";
  const allowed=new Set([
    "https://deep-hunt-market.netlify.app",
    "https://hadpac23-netizen.github.io",
    "http://localhost:18977","http://127.0.0.1:18977",
    "http://localhost:8767","http://127.0.0.1:8767"
  ]);
  const preview=/^https:\/\/[a-z0-9-]+--deep-hunt-market\.netlify\.app$/i.test(origin);
  return {
    "Access-Control-Allow-Origin":allowed.has(origin)||preview?origin:"https://deep-hunt-market.netlify.app",
    "Access-Control-Allow-Headers":"authorization, apikey, content-type",
    "Access-Control-Allow-Methods":"POST, OPTIONS",
    "Vary":"Origin"
  };
}
function json(req:Request,data:unknown,status=200){
  return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json","cache-control":"no-store",...cors(req)}});
}
async function requireAdmin(req:Request){
  const auth=req.headers.get("authorization")||"";
  const token=auth.startsWith("Bearer ")?auth.slice(7).trim():"";
  if(!token)return null;
  const authClient=createClient(BASE,PUBLISHABLE||SERVICE,{
    auth:{persistSession:false,autoRefreshToken:false},
    global:{headers:{Authorization:"Bearer "+token}}
  });
  const {data:{user},error}=await authClient.auth.getUser(token);
  if(error||!user?.id)return null;
  const {data:profile}=await admin.from("profiles").select("is_admin").eq("id",user.id).maybeSingle();
  return profile?.is_admin===true?user:null;
}
function normalizeRow(x:any){
  const claim=clean(x?.claim).slice(0,1000);
  if(!claim)throw new Error("CLAIM_REQUIRED");
  const supporting=Math.max(0,Math.min(1000,Number(x?.supporting_sources||0)));
  const contradictory=Math.max(0,Math.min(1000,Number(x?.contradictory_sources||0)));
  const confidence=["LOW","MEDIUM","HIGH"].includes(clean(x?.confidence).toUpperCase())
    ?clean(x.confidence).toUpperCase():"LOW";
  return {
    insight_id:null,
    claim,
    source_registry_id:null,
    source_url:clean(x?.source_url).slice(0,1000)||null,
    confidence,
    supporting_sources:supporting,
    contradictory_sources:contradictory,
    verified_at:x?.verified===true?new Date().toISOString():null
  };
}

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(req)});
  if(req.method!=="POST")return json(req,{error:"method not allowed"},405);
  if(!BASE||!SERVICE)return json(req,{error:"server config missing"},500);
  const user=await requireAdmin(req);
  if(!user)return json(req,{error:"Admin access required"},403);

  const body=await req.json().catch(()=>({}));
  const action=clean(body?.action||"preview").toLowerCase();
  const rows=(Array.isArray(body?.rows)?body.rows:[]).slice(0,100).map(normalizeRow);

  if(action==="preview"){
    return json(req,{
      ok:true,
      action:"preview",
      persistence_enabled:PERSISTENCE_ENABLED,
      rows,
      production_effect:false,
      persisted:false
    });
  }

  if(action!=="persist")return json(req,{error:"unknown action"},400);
  if(!PERSISTENCE_ENABLED){
    return json(req,{
      ok:false,
      error:"CONTROL_PERSISTENCE_DISABLED",
      persisted:false,
      owner_gate_required:true
    },409);
  }
  if(!rows.length)return json(req,{error:"rows required"},400);

  const {data,error}=await admin.from("boom_evidence").insert(rows).select("id,claim,confidence,supporting_sources,contradictory_sources,verified_at,created_at");
  if(error)return json(req,{error:error.message},500);

  return json(req,{
    ok:true,
    persisted:true,
    rows:data||[],
    owner_gate_required:true
  });
});