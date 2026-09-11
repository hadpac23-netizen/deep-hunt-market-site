import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ALLOWED_ORIGINS = new Set([
  "https://deep-hunt-market.netlify.app",
  "https://hadpac23-netizen.github.io",
  "http://localhost:8767",
  "http://127.0.0.1:8767"
]);
const allowedEvents = new Set([
  "hunt_view_item","hunt_select_item","hunt_like","hunt_save",
  "hunt_add_to_cart","hunt_begin_checkout","hunt_survey_complete"
]);
const rate = new Map<string, number>();

function cors(req: Request) {
  const origin = req.headers.get("origin") || "";
  const preview = /^https:\/\/[a-z0-9-]+--deep-hunt-market\.netlify\.app$/i.test(origin);
  return {
    "Access-Control-Allow-Origin": (ALLOWED_ORIGINS.has(origin) || preview) ? origin : "https://deep-hunt-market.netlify.app",
    "Access-Control-Allow-Headers": "apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin"
  };
}
function json(data: unknown, status=200, headers: Record<string,string>={}) {
  return new Response(JSON.stringify(data), {status, headers: {"content-type":"application/json","cache-control":"no-store",...headers}});
}
const clean=(v:unknown,n=120)=>String(v??"").replace(/[\r\n\t]+/g," ").replace(/\s+/g," ").trim().slice(0,n);

Deno.serve(async req => {
  const headers = cors(req);
  if (req.method === "OPTIONS") return new Response(null,{status:204,headers});
  if (req.method !== "POST") return json({error:"method not allowed"},405,headers);

  const origin=req.headers.get("origin")||"";
  const preview=/^https:\/\/[a-z0-9-]+--deep-hunt-market\.netlify\.app$/i.test(origin);
  if (!(ALLOWED_ORIGINS.has(origin) || preview)) return json({error:"origin denied"},403,headers);

  let body:any;
  try { body=await req.json(); } catch { return json({error:"invalid json"},400,headers); }
  const eventType=clean(body?.event_type,40);
  const sessionId=clean(body?.session_id,80);
  if (!allowedEvents.has(eventType) || !sessionId) return json({error:"invalid signal"},400,headers);

  const ip=(req.headers.get("x-forwarded-for")||"").split(",")[0].trim()||"unknown";
  const itemId=clean(body?.item_id,100);
  const rateKey=[ip,sessionId,eventType,itemId].join("|");
  const last=rate.get(rateKey)||0;
  if (Date.now()-last<1200) return json({ok:true,deduped:true},200,headers);
  rate.set(rateKey,Date.now());

  const category=clean(body?.category,60);
  const provider=clean(body?.provider,80);
  const placement=clean(body?.placement,80);
  const quantity=Math.max(1,Math.min(20,Number(body?.quantity)||1));
  const retailPrice=Number(body?.retail_price);
  const metadata:any={category,provider,item_id:itemId,placement,quantity,source:"hunt_web"};
  if (Number.isFinite(retailPrice) && retailPrice>=0 && retailPrice<100000) metadata.retail_price=Number(retailPrice.toFixed(2));

  const url=Deno.env.get("SUPABASE_URL");
  const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !service) return json({error:"server config missing"},500,headers);
  const res=await fetch(url+"/rest/v1/analytics_events",{
    method:"POST",
    headers:{
      "apikey":service,
      "Authorization":"Bearer "+service,
      "Content-Type":"application/json",
      "Prefer":"return=minimal"
    },
    body:JSON.stringify({event_type:eventType,session_id:sessionId,metadata})
  });
  if (!res.ok) return json({error:"signal store failed"},502,headers);
  return json({ok:true},200,headers);
});