const BASE=Deno.env.get("SUPABASE_URL")||"";
const SERVICE=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const ALLOWED=new Set(["https://deep-hunt-market.netlify.app","https://hadpac23-netizen.github.io","http://127.0.0.1:18977","http://localhost:18977"]);
function cors(req:Request){const o=req.headers.get("origin")||"";const p=/^https:\/\/[a-z0-9-]+--deep-hunt-market\.netlify\.app$/i.test(o);return{"Access-Control-Allow-Origin":(ALLOWED.has(o)||p)?o:"https://deep-hunt-market.netlify.app","Access-Control-Allow-Headers":"apikey, authorization, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin"}}
function json(req:Request,data:unknown,status=200){return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json","cache-control":"no-store",...cors(req)}})}
async function rest(path:string){const r=await fetch(BASE+"/rest/v1/"+path,{headers:{apikey:SERVICE,Authorization:"Bearer "+SERVICE}});const t=await r.text();const d=t?JSON.parse(t):null;if(!r.ok)throw new Error(d?.message||d?.error||("REST_"+r.status));return d}
async function userFromReq(req:Request){const a=req.headers.get("authorization")||"";const token=a.startsWith("Bearer ")?a.slice(7).trim():"";if(!token)return null;const r=await fetch(BASE+"/auth/v1/user",{headers:{apikey:SERVICE,Authorization:"Bearer "+token}});return r.ok?await r.json():null}
async function isAdmin(id:string){const p=await rest("profiles?id=eq."+encodeURIComponent(id)+"&select=is_admin");return p?.[0]?.is_admin===true}
async function callGemini(apiKey:string,mime:string,audio:string){
  const body=JSON.stringify({contents:[{role:"user",parts:[
    {text:"Transcribe ONLY the spoken words. Automatically detect Hebrew, Arabic and English, including natural code-switching. Preserve names and HUNT/BOOM terms. Return plain transcript only, no explanation."},
    {inline_data:{mime_type:mime,data:audio}}
  ]}],generationConfig:{temperature:0.1,maxOutputTokens:700}});
  const url="https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
  let r=apiKey.startsWith("AQ.")
    ?await fetch(url,{method:"POST",headers:{"content-type":"application/json",Authorization:"Bearer "+apiKey},body})
    :await fetch(url+"?key="+encodeURIComponent(apiKey),{method:"POST",headers:{"content-type":"application/json"},body});
  if(!r.ok&&apiKey.startsWith("AQ."))r=await fetch(url,{method:"POST",headers:{"content-type":"application/json","x-goog-api-key":apiKey},body});
  const t=await r.text();let d:any={};try{d=t?JSON.parse(t):{}}catch{}
  if(!r.ok)throw new Error(d?.error?.message||("Gemini transcription failed "+r.status));
  return String(d?.candidates?.[0]?.content?.parts?.[0]?.text||"").trim();
}
Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(req)});
  if(req.method!=="POST")return json(req,{error:"method not allowed"},405);
  if(!BASE||!SERVICE)return json(req,{error:"server config missing"},500);
  const user=await userFromReq(req);if(!user?.id||!(await isAdmin(user.id)))return json(req,{error:"Admin access required"},403);
  try{
    const b=await req.json().catch(()=>({}));const audio=String(b?.audio_base64||"");let mime=String(b?.mime_type||"audio/webm").split(";")[0].toLowerCase();
    if(!audio)return json(req,{error:"audio required"},400);if(audio.length>8000000)return json(req,{error:"audio too large"},413);
    const allowed=new Set(["audio/webm","audio/ogg","audio/wav","audio/mpeg","audio/mp3","audio/aac","audio/flac","audio/m4a"]);
    if(mime==="audio/mp4")mime="audio/m4a";if(!allowed.has(mime))return json(req,{error:"unsupported audio format"},415);
    const rows=await rest("app_secrets?key=eq.GEMINI_API_KEY&select=value&limit=1");const key=String(rows?.[0]?.value||"");if(!key)return json(req,{error:"transcription provider not configured"},503);
    const transcript=await callGemini(key,mime,audio);if(!transcript)return json(req,{error:"no speech detected"},422);
    return json(req,{ok:true,transcript,language_mode:"auto"});
  }catch(e){return json(req,{error:e instanceof Error?e.message:"transcription failed"},500)}
});