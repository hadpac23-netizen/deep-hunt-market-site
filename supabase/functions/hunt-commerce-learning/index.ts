import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ALLOWED_ORIGINS = new Set([
  "https://deep-hunt-market.netlify.app",
  "https://hadpac23-netizen.github.io",
  "http://localhost:8767",
  "http://127.0.0.1:8767"
]);
const weights:Record<string,number>={
  hunt_view_item:1,
  hunt_select_item:2,
  hunt_like:3,
  hunt_save:4,
  hunt_add_to_cart:7,
  hunt_begin_checkout:10,
  hunt_survey_complete:2
};
let cache:any=null, cacheAt=0;

function cors(req:Request){
  const origin=req.headers.get("origin")||"";
  const preview=/^https:\/\/[a-z0-9-]+--deep-hunt-market\.netlify\.app$/i.test(origin);
  return {
    "Access-Control-Allow-Origin":(ALLOWED_ORIGINS.has(origin)||preview)?origin:"https://deep-hunt-market.netlify.app",
    "Access-Control-Allow-Headers":"apikey, content-type",
    "Access-Control-Allow-Methods":"GET, OPTIONS",
    "Vary":"Origin"
  };
}
function json(data:unknown,status=200,headers:Record<string,string>={}){
  return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json","cache-control":"public, max-age=120",...headers}});
}
Deno.serve(async req=>{
  const headers=cors(req);
  if(req.method==="OPTIONS") return new Response(null,{status:204,headers});
  if(req.method!=="GET") return json({error:"method not allowed"},405,headers);
  if(cache && Date.now()-cacheAt<300000) return json(cache,200,headers);

  const url=Deno.env.get("SUPABASE_URL");
  const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!url||!service) return json({error:"server config missing"},500,headers);
  const since=new Date(Date.now()-30*86400000).toISOString();
  const eventList=Object.keys(weights).join(",");
  const q=new URL(url+"/rest/v1/analytics_events");
  q.searchParams.set("select","event_type,session_id,metadata,created_at");
  q.searchParams.set("created_at","gte."+since);
  q.searchParams.set("event_type","in.("+eventList+")");
  q.searchParams.set("limit","10000");
  const res=await fetch(q,{headers:{"apikey":service,"Authorization":"Bearer "+service}});
  if(!res.ok) return json({error:"learning read failed"},502,headers);
  const rows=await res.json();

  const categories:Record<string,{score:number,events:number,sessions:Set<string>}>= {};
  const products:Record<string,{score:number,events:number,sessions:Set<string>}>= {};
  for(const row of Array.isArray(rows)?rows:[]){
    const w=Number(weights[row?.event_type]||0);
    if(!w) continue;
    const meta=row?.metadata||{};
    const category=String(meta?.category||"").slice(0,60);
    const provider=String(meta?.provider||"").slice(0,80);
    const itemId=String(meta?.item_id||"").slice(0,100);
    const sid=String(row?.session_id||"").slice(0,80);
    if(category){
      const c=categories[category]||(categories[category]={score:0,events:0,sessions:new Set()});
      c.score+=w;c.events++;if(sid)c.sessions.add(sid);
    }
    if(provider&&itemId){
      const key=provider+":"+itemId;
      const p=products[key]||(products[key]={score:0,events:0,sessions:new Set()});
      p.score+=w;p.events++;if(sid)p.sessions.add(sid);
    }
  }
  const catOut:Record<string,number>={};
  for(const [k,v] of Object.entries(categories)){
    const confidence=Math.min(1,v.sessions.size/20);
    catOut[k]=Number(Math.min(12,Math.log1p(v.score)*2.4*confidence).toFixed(2));
  }
  const productOut:Record<string,number>={};
  for(const [k,v] of Object.entries(products)){
    const confidence=Math.min(1,v.sessions.size/8);
    productOut[k]=Number(Math.min(18,Math.log1p(v.score)*3.0*confidence).toFixed(2));
  }
  cache={window_days:30,generated_at:new Date().toISOString(),categories:catOut,products:productOut,event_count:Array.isArray(rows)?rows.length:0};
  cacheAt=Date.now();
  return json(cache,200,headers);
});