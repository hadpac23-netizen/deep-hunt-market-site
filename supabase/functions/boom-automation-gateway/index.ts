const BASE=Deno.env.get("SUPABASE_URL")||"";
const SERVICE=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const N8N_URL=Deno.env.get("N8N_SHADOW_WEBHOOK_URL")||"";
const N8N_TOKEN=Deno.env.get("N8N_SHADOW_WEBHOOK_TOKEN")||"";

const ALLOWED_ORIGINS=new Set([
  "https://deep-hunt-market.netlify.app",
  "https://hadpac23-netizen.github.io",
  "http://127.0.0.1:18977",
  "http://localhost:18977"
]);
const SAFE_WORKFLOWS=new Set(["shelf_coverage_17x1000"]);
const MAX_BODY=131072;

function cors(req:Request){
  const origin=req.headers.get("origin")||"";
  const preview=/^https:\/\/[a-z0-9-]+--deep-hunt-market\.netlify\.app$/i.test(origin);
  return {
    "Access-Control-Allow-Origin":(ALLOWED_ORIGINS.has(origin)||preview)?origin:"https://deep-hunt-market.netlify.app",
    "Access-Control-Allow-Headers":"apikey, authorization, content-type",
    "Access-Control-Allow-Methods":"POST, OPTIONS",
    "Vary":"Origin"
  };
}
function json(req:Request,data:unknown,status=200){
  return new Response(JSON.stringify(data),{
    status,
    headers:{"content-type":"application/json","cache-control":"no-store",...cors(req)}
  });
}
function clean(value:unknown,depth=0):unknown{
  if(depth>5)return null;
  if(value===null||["string","number","boolean"].includes(typeof value))return value;
  if(Array.isArray(value))return value.slice(0,100).map(v=>clean(v,depth+1));
  if(typeof value==="object"){
    const out:Record<string,unknown>={};
    for(const [k,v] of Object.entries(value as Record<string,unknown>)){
      if(/token|secret|password|credential|email|phone|address/i.test(k))continue;
      out[k]=clean(v,depth+1);
    }
    return out;
  }
  return null;
}
async function rest(path:string){
  const r=await fetch(BASE+"/rest/v1/"+path,{headers:{apikey:SERVICE,Authorization:"Bearer "+SERVICE}});
  const text=await r.text();
  let data=null;
  try{data=text?JSON.parse(text):null;}catch{data=null;}
  if(!r.ok)throw new Error((data as any)?.message||(data as any)?.error||("REST_"+r.status));
  return data;
}
async function adminUser(req:Request){
  const auth=req.headers.get("authorization")||"";
  const token=auth.startsWith("Bearer ")?auth.slice(7).trim():"";
  if(!token)return null;
  const u=await fetch(BASE+"/auth/v1/user",{headers:{apikey:SERVICE,Authorization:"Bearer "+token}});
  if(!u.ok)return null;
  const user=await u.json();
  if(!user?.id)return null;
  const p=await rest("profiles?id=eq."+encodeURIComponent(user.id)+"&select=is_admin&limit=1");
  return p?.[0]?.is_admin===true?user:null;
}
async function postEvent(payload:Record<string,unknown>){
  try{
    await fetch(BASE+"/rest/v1/hunt_boom_events",{
      method:"POST",
      headers:{
        apikey:SERVICE,Authorization:"Bearer "+SERVICE,
        "content-type":"application/json","Prefer":"return=minimal"
      },
      body:JSON.stringify(payload)
    });
  }catch{}
}
Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(req)});
  if(req.method!=="POST")return json(req,{ok:false,error:"METHOD_NOT_ALLOWED"},405);
  if(!BASE||!SERVICE)return json(req,{ok:false,error:"SERVER_CONFIG_MISSING"},500);
  if(!(await adminUser(req)))return json(req,{ok:false,error:"ADMIN_REQUIRED"},403);

  const length=Number(req.headers.get("content-length")||0);
  if(length>MAX_BODY)return json(req,{ok:false,error:"PAYLOAD_TOO_LARGE"},413);

  let input:any={};
  try{input=await req.json();}catch{return json(req,{ok:false,error:"INVALID_JSON"},400);}

  const workflowId=String(input?.workflow_id||"");
  const runId=String(input?.run_id||"");
  const missionId=String(input?.mission_id||"");
  const correlationId=String(input?.correlation_id||"");
  if(!workflowId||!runId||!missionId||!correlationId){
    return json(req,{ok:false,error:"MISSING_RUN_IDENTITY"},400);
  }
  if(!SAFE_WORKFLOWS.has(workflowId)){
    return json(req,{ok:false,error:"WORKFLOW_NOT_ALLOWLISTED",workflow_id:workflowId},403);
  }
  if(!N8N_URL||!N8N_TOKEN){
    return json(req,{ok:false,state:"NOT_CONNECTED",error:"N8N_SHADOW_NOT_CONFIGURED"},503);
  }

  const body=clean({
    mode:"SHADOW",
    authority:"NONE",
    workflow_id:workflowId,
    run_id:runId,
    mission_id:missionId,
    correlation_id:correlationId,
    payload:input?.payload||{}
  });

  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),15000);
  let response:Response;
  try{
    response=await fetch(N8N_URL,{
      method:"POST",
      signal:controller.signal,
      headers:{
        "content-type":"application/json",
        "X-BOOM-Webhook-Token":N8N_TOKEN,
        "X-BOOM-Run-ID":runId,
        "X-BOOM-Mode":"SHADOW"
      },
      body:JSON.stringify(body)
    });
  }catch(error){
    clearTimeout(timer);
    await postEvent({
      source_manager_id:"boom_orchestrator",
      event_type:"automation.n8n.dispatch_failed",
      severity:"error",
      entity_type:"automation_run",
      entity_key:runId,
      title:"n8n SHADOW dispatch failed",
      body:error instanceof Error?error.name:"dispatch failed",
      payload:clean({workflow_id:workflowId,mission_id:missionId,correlation_id:correlationId})
    });
    return json(req,{ok:false,error:error instanceof DOMException&&error.name==="AbortError"?"N8N_TIMEOUT":"N8N_DISPATCH_FAILED"},502);
  }finally{
    clearTimeout(timer);
  }

  const raw=await response.text();
  let result:unknown=null;
  try{result=raw?JSON.parse(raw):null;}catch{result={text:raw.slice(0,2000)};}

  await postEvent({
    source_manager_id:"boom_orchestrator",
    event_type:response.ok?"automation.n8n.dispatched":"automation.n8n.rejected",
    severity:response.ok?"info":"warning",
    entity_type:"automation_run",
    entity_key:runId,
    title:response.ok?"n8n SHADOW dispatched":"n8n SHADOW rejected",
    body:"HTTP "+response.status,
    payload:clean({workflow_id:workflowId,mission_id:missionId,correlation_id:correlationId,http_status:response.status})
  });

  if(!response.ok)return json(req,{ok:false,error:"N8N_REJECTED",status:response.status},502);
  return json(req,{
    ok:true,
    state:"DISPATCHED_SHADOW",
    authority:"NONE",
    material_actions_suppressed:true,
    workflow_id:workflowId,
    run_id:runId,
    result:clean(result)
  });
});