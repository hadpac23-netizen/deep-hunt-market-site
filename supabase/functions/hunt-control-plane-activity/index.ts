import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const BASE=Deno.env.get("SUPABASE_URL")||"";
const SERVICE=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const PUBLISHABLE=Deno.env.get("SUPABASE_ANON_KEY")||"";
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
  return new Response(JSON.stringify(data),{
    status,
    headers:{"content-type":"application/json","cache-control":"no-store",...cors(req)}
  });
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
function safeTime(v:unknown){return clean(v)||null}
function sortDesc(a:any,b:any){return Date.parse(b.at||0)-Date.parse(a.at||0)}

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(req)});
  if(req.method!=="POST")return json(req,{error:"method not allowed"},405);
  if(!BASE||!SERVICE)return json(req,{error:"server config missing"},500);
  const user=await requireAdmin(req);
  if(!user)return json(req,{error:"Admin access required"},403);

  const body=await req.json().catch(()=>({}));
  const limit=Math.max(10,Math.min(100,Number(body?.limit||40)));

  const [commands,evidence,controls,reports]=await Promise.all([
    admin.from("hunt_boom_agent_commands")
      .select("id,target_manager_id,target_worker_id,status,action_class,priority,owner_approval_required,repeat_count,expires_at,created_at,updated_at")
      .order("updated_at",{ascending:false}).limit(limit),
    admin.from("boom_evidence")
      .select("id,claim,source_url,confidence,supporting_sources,contradictory_sources,verified_at,created_at")
      .like("source_url","boom://control-plane/%")
      .order("created_at",{ascending:false}).limit(limit),
    admin.from("hunt_runtime_controls")
      .select("key,enabled,owner_approved,note,updated_at")
      .in("key",[
        "dragon_control_evidence_persistence",
        "dragon_control_retry_executor",
        "dragon_control_scheduler",
        "hunt_payment_live",
        "hunt_supplier_order_live",
        "hunt_external_everywhere_publish"
      ]).order("updated_at",{ascending:false}),
    admin.from("hunt_boom_live_reports")
      .select("manager_id,status,action_class,owner_approval_required,confidence,expected_impact,recheck_at,created_at")
      .order("created_at",{ascending:false}).limit(Math.min(limit,50))
  ]);

  for(const x of [commands,evidence,controls,reports]){
    if(x.error)return json(req,{error:x.error.message},500);
  }

  const items:any[]=[];

  for(const c of commands.data||[]){
    items.push({
      kind:c.owner_approval_required===true||c.status==="waiting_owner"?"OWNER_GATE":"COMMAND",
      id:"command:"+c.id,
      at:safeTime(c.updated_at||c.created_at),
      manager:clean(c.target_manager_id)||null,
      worker:clean(c.target_worker_id)||null,
      status:clean(c.status).toUpperCase(),
      action_class:clean(c.action_class).toUpperCase(),
      priority:Number(c.priority||0),
      recurrence_count:Number(c.repeat_count||0),
      expires_at:safeTime(c.expires_at),
      owner_gate:c.owner_approval_required===true||c.status==="waiting_owner",
      summary:(c.owner_approval_required===true||c.status==="waiting_owner")
        ?"Action waiting for Owner authority."
        :"Control command state changed."
    });
  }

  for(const e of evidence.data||[]){
    items.push({
      kind:"EVIDENCE",
      id:"evidence:"+e.id,
      at:safeTime(e.created_at),
      status:e.verified_at?"VERIFIED":"RECORDED",
      confidence:clean(e.confidence).toUpperCase(),
      supporting_sources:Number(e.supporting_sources||0),
      contradictory_sources:Number(e.contradictory_sources||0),
      source_url:clean(e.source_url)||null,
      summary:clean(e.claim).slice(0,240)
    });
  }

  for(const c of controls.data||[]){
    const material=clean(c.key).startsWith("hunt_");
    items.push({
      kind:"CONTROL",
      id:"control:"+c.key,
      at:safeTime(c.updated_at),
      status:c.enabled===true&&c.owner_approved===true?"ON":"OFF",
      control_key:clean(c.key),
      enabled:c.enabled===true,
      owner_approved:c.owner_approved===true,
      material,
      summary:clean(c.note).slice(0,240)
    });
  }

  const latestReport=new Map<string,any>();
  for(const r of reports.data||[]){
    if(!latestReport.has(r.manager_id))latestReport.set(r.manager_id,r);
  }
  for(const r of latestReport.values()){
    items.push({
      kind:"MANAGER",
      id:"manager:"+r.manager_id,
      at:safeTime(r.created_at),
      manager:clean(r.manager_id),
      status:clean(r.status).toUpperCase(),
      action_class:clean(r.action_class).toUpperCase(),
      owner_gate:r.owner_approval_required===true,
      confidence:Number(r.confidence||0),
      expected_impact:clean(r.expected_impact)||null,
      recheck_at:safeTime(r.recheck_at),
      summary:"Latest manager health report."
    });
  }

  items.sort(sortDesc);

  const counts={
    commands:(commands.data||[]).length,
    waiting_owner:(commands.data||[]).filter((x:any)=>x.owner_approval_required===true||x.status==="waiting_owner").length,
    evidence:(evidence.data||[]).length,
    controls_on:(controls.data||[]).filter((x:any)=>x.enabled===true&&x.owner_approved===true).length,
    managers:latestReport.size
  };

  return json(req,{
    ok:true,
    generated_at:new Date().toISOString(),
    admin_user_id:user.id,
    material_execution:{
      payment_live:(controls.data||[]).some((x:any)=>x.key==="hunt_payment_live"&&x.enabled===true&&x.owner_approved===true),
      supplier_live_order:(controls.data||[]).some((x:any)=>x.key==="hunt_supplier_order_live"&&x.enabled===true&&x.owner_approved===true),
      external_publish:(controls.data||[]).some((x:any)=>x.key==="hunt_external_everywhere_publish"&&x.enabled===true&&x.owner_approved===true)
    },
    counts,
    items:items.slice(0,limit)
  });
});