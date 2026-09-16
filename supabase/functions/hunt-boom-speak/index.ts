const BASE=Deno.env.get("SUPABASE_URL")||"";
const SERVICE=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const ALLOWED=new Set(["https://deep-hunt-market.netlify.app","https://hadpac23-netizen.github.io","http://127.0.0.1:18977","http://localhost:18977"]);
function cors(req:Request){const o=req.headers.get("origin")||"";const p=/^https:\/\/[a-z0-9-]+--deep-hunt-market\.netlify\.app$/i.test(o);return{"Access-Control-Allow-Origin":(ALLOWED.has(o)||p)?o:"https://deep-hunt-market.netlify.app","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin"}}
function json(req:Request,data:unknown,status=200){return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json","cache-control":"no-store",...cors(req)}})}
function cleanSpeech(text:string){
  return String(text||"")
    .replace(/\[([^\]]+)\]\([^\)]+\)/g,"$1")
    .replace(/[*_~`>#|]+/g," ")
    .replace(/^\s*[-•]\s*/gm,". ")
    .replace(/\s{2,}/g," ")
    .replace(/\s+([,.;!?])/g,"$1")
    .trim();
}
async function rest(path:string){const r=await fetch(BASE+"/rest/v1/"+path,{headers:{apikey:SERVICE,Authorization:"Bearer "+SERVICE}});const t=await r.text();const d=t?JSON.parse(t):null;if(!r.ok)throw new Error(d?.message||d?.error||("REST_"+r.status));return d}
async function userFromReq(req:Request){const a=req.headers.get("authorization")||"";const token=a.startsWith("Bearer ")?a.slice(7).trim():"";if(!token)return null;const r=await fetch(BASE+"/auth/v1/user",{headers:{apikey:SERVICE,Authorization:"Bearer "+token}});return r.ok?await r.json():null}
async function isAdmin(id:string){const p=await rest("profiles?id=eq."+encodeURIComponent(id)+"&select=is_admin");return p?.[0]?.is_admin===true}
Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(req)});
  if(req.method!=="POST")return json(req,{error:"method not allowed"},405);
  if(!BASE||!SERVICE)return json(req,{error:"server config missing"},500);
  const user=await userFromReq(req);if(!user?.id||!(await isAdmin(user.id)))return json(req,{error:"Admin access required"},403);
  try{
    const body=await req.json().catch(()=>({}));
    const text=cleanSpeech(String(body?.text||"")).slice(0,3500);
    if(!text)return json(req,{error:"text required"},400);
    const key=Deno.env.get("OPENAI_API_KEY")||"";
    if(!key)return json(req,{error:"OpenAI speech provider not configured"},503);
    const r=await fetch("https://api.openai.com/v1/audio/speech",{
      method:"POST",
      headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},
      body:JSON.stringify({
        model:"gpt-4o-mini-tts",
        voice:"marin",
        input:text,
        instructions:"Speak naturally, warmly, and conversationally. Preserve Hebrew, Arabic, English, and natural code-switching exactly. Use human pacing, short pauses at punctuation, clear pronunciation, and no announcer voice. Do not add or omit words.",
        response_format:"mp3"
      }),
      signal:AbortSignal.timeout(30000)
    });
    if(!r.ok){
      const raw=await r.text();
      let d:any={};try{d=raw?JSON.parse(raw):{}}catch{}
      return json(req,{error:d?.error?.message||("speech provider failed "+r.status),provider_status:r.status},502);
    }
    const audio=await r.arrayBuffer();
    return new Response(audio,{status:200,headers:{"content-type":"audio/mpeg","cache-control":"no-store","x-boom-voice":"marin",...cors(req)}});
  }catch(e){return json(req,{error:e instanceof Error?e.message:"speech generation failed"},500)}
});