import {assertTransition,planVaultAsset,postGenerationQA} from "./vault-core.mjs";
const BASE=Deno.env.get("SUPABASE_URL")||"",SERVICE=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
function cors(req:Request){const o=req.headers.get("origin")||"";const ok=o==="https://deep-hunt-market.netlify.app"||/^https:\/\/[a-z0-9-]+--deep-hunt-market\.netlify\.app$/i.test(o)||o==="http://localhost:18977"||o==="http://127.0.0.1:18977";return {"Access-Control-Allow-Origin":ok?o:"https://deep-hunt-market.netlify.app","Access-Control-Allow-Headers":"authorization, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin"}}
function json(req:Request,data:unknown,status=200){return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json","cache-control":"no-store",...cors(req)}})}
async function userFromReq(req:Request){const a=req.headers.get("authorization")||"";const t=a.startsWith("Bearer ")?a.slice(7).trim():"";if(!t)return null;const r=await fetch(BASE+"/auth/v1/user",{headers:{apikey:SERVICE,Authorization:"Bearer "+t}});return r.ok?await r.json():null}
async function isAdmin(id:string){const r=await fetch(BASE+"/rest/v1/profiles?id=eq."+encodeURIComponent(id)+"&select=is_admin",{headers:{apikey:SERVICE,Authorization:"Bearer "+SERVICE}});if(!r.ok)return false;const d=await r.json();return d?.[0]?.is_admin===true}
Deno.serve(async req=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors(req)});
  if(req.method!=="POST")return json(req,{error:"POST_ONLY"},405);
  const user=await userFromReq(req);if(!user||!(await isAdmin(user.id)))return json(req,{error:"OWNER_ADMIN_REQUIRED"},403);
  const body=await req.json().catch(()=>({}));const action=String(body?.action||"preview_asset");
  try{
    if(action==="preview_asset")return json(req,{status:"VAULT_PLAN",...planVaultAsset(body?.asset)});
    if(action==="qa_preview")return json(req,postGenerationQA(body?.evidence||{}));
    if(action==="transition_preview"){assertTransition(String(body?.from||""),String(body?.to||""));return json(req,{status:"TRANSITION_ALLOWED",from:body.from,to:body.to,executed:false});}
    return json(req,{error:"ACTION_UNSUPPORTED"},400);
  }catch(e){return json(req,{error:e instanceof Error?e.message:String(e)},400)}
});
