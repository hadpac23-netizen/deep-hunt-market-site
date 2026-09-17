import {buildRunwayCreate,RUNWAY_API_VERSION,RUNWAY_TASK_URL,validateTaskId} from "./runway-core.mjs";
const BASE=Deno.env.get("SUPABASE_URL")||"",SERVICE=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
function cors(req:Request){const o=req.headers.get("origin")||"";const ok=o==="https://deep-hunt-market.netlify.app"||/^https:\/\/[a-z0-9-]+--deep-hunt-market\.netlify\.app$/i.test(o)||o==="http://localhost:18977"||o==="http://127.0.0.1:18977";return {"Access-Control-Allow-Origin":ok?o:"https://deep-hunt-market.netlify.app","Access-Control-Allow-Headers":"authorization, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin"}}
function json(req:Request,data:unknown,status=200){return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json","cache-control":"no-store",...cors(req)}})}
async function userFromReq(req:Request){const a=req.headers.get("authorization")||"";const t=a.startsWith("Bearer ")?a.slice(7).trim():"";if(!t)return null;const r=await fetch(BASE+"/auth/v1/user",{headers:{apikey:SERVICE,Authorization:"Bearer "+t}});return r.ok?await r.json():null}
async function isAdmin(id:string){const r=await fetch(BASE+"/rest/v1/profiles?id=eq."+encodeURIComponent(id)+"&select=is_admin",{headers:{apikey:SERVICE,Authorization:"Bearer "+SERVICE}});if(!r.ok)return false;const d=await r.json();return d?.[0]?.is_admin===true}
Deno.serve(async req=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors(req)});
  if(req.method!=="POST")return json(req,{error:"POST_ONLY"},405);
  const user=await userFromReq(req); if(!user||!(await isAdmin(user.id)))return json(req,{error:"OWNER_ADMIN_REQUIRED"},403);
  const body=await req.json().catch(()=>({}));
  const enabled=Deno.env.get("RUNWAY_VIDEO_ENABLED")==="true";
  const secret=Deno.env.get("RUNWAYML_API_SECRET")||"";
  const action=String(body?.action||"preview");
  if(action==="preview"){
    try{return json(req,buildRunwayCreate(body?.dispatch,{enabled,ownerApproved:body?.owner_approved===true,secretPresent:Boolean(secret)}))}catch(e){return json(req,{error:e instanceof Error?e.message:String(e)},400)}
  }
  if(action==="create"){
    let plan;try{plan=buildRunwayCreate(body?.dispatch,{enabled,ownerApproved:body?.owner_approved===true,secretPresent:Boolean(secret)})}catch(e){return json(req,{error:e instanceof Error?e.message:String(e)},400)}
    if(!plan.can_execute)return json(req,{error:"RUNWAY_EXECUTION_BLOCKED",blockers:plan.blockers},409);
    const r=await fetch(plan.endpoint,{method:"POST",headers:{"content-type":"application/json",Authorization:"Bearer "+secret,"X-Runway-Version":RUNWAY_API_VERSION},body:JSON.stringify(plan.body),signal:AbortSignal.timeout(30000)});
    const d=await r.json().catch(()=>({})); if(!r.ok)return json(req,{error:"RUNWAY_CREATE_FAILED",status:r.status,provider_error:d?.error||d?.message||null},502);
    return json(req,{status:"TASK_CREATED",task_id:String(d?.id||""),provider:"runway-gen45",estimated_credits:plan.estimated_credits,output_exposed:false});
  }
  if(action==="status"){
    if(!enabled)return json(req,{error:"RUNWAY_CONNECTOR_DISABLED"},409);
    if(!secret)return json(req,{error:"RUNWAY_SECRET_REQUIRED"},409);
    let id;try{id=validateTaskId(body?.task_id)}catch(e){return json(req,{error:e instanceof Error?e.message:String(e)},400)}
    const r=await fetch(RUNWAY_TASK_URL+encodeURIComponent(id),{headers:{Authorization:"Bearer "+secret,"X-Runway-Version":RUNWAY_API_VERSION},signal:AbortSignal.timeout(15000)});
    const d=await r.json().catch(()=>({})); if(!r.ok)return json(req,{error:"RUNWAY_STATUS_FAILED",status:r.status},502);
    const status=String(d?.status||"UNKNOWN");
    return json(req,{task_id:id,status,completed:["SUCCEEDED","FAILED","CANCELED"].includes(status),output_count:Array.isArray(d?.output)?d.output.length:0,output_exposed:false,storage_required:status==="SUCCEEDED"});
  }
  return json(req,{error:"ACTION_UNSUPPORTED"},400);
});
