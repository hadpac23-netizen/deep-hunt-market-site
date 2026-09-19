import { createSupabaseContext } from "npm:@supabase/server";
import postgres from "npm:postgres@3.4.5";

const clean=(v:unknown,n=500)=>String(v??"").replace(/[\r\n\t]+/g," ").replace(/\s+/g," ").trim().slice(0,n);
const dbUrl=Deno.env.get("SUPABASE_DB_URL")||"";
const sql=postgres(dbUrl,{max:1,prepare:false});
const DEFAULT_CALLBACK="https://deep-hunt-market.netlify.app/f60t-oauth-callback.html";

function cors(req:Request){
  const origin=req.headers.get("origin")||"";
  const allowed=new Set([
    "https://deep-hunt-market.netlify.app",
    "https://hadpac23-netizen.github.io",
    "http://127.0.0.1:18977",
    "http://localhost:18977"
  ]);
  const preview=origin.startsWith("https://")&&origin.endsWith("--deep-hunt-market.netlify.app");
  return {
    "access-control-allow-origin":(allowed.has(origin)||preview)?origin:"https://deep-hunt-market.netlify.app",
    "access-control-allow-headers":"apikey, authorization, content-type",
    "access-control-allow-methods":"POST, OPTIONS",
    "vary":"Origin"
  };
}

function json(req:Request,body:unknown,status=200){
  return new Response(JSON.stringify(body),{
    status,
    headers:{"content-type":"application/json","cache-control":"no-store",...cors(req)}
  });
}

async function isAdmin(ctx:any){
  const uid=clean(ctx.userClaims?.id||ctx.userClaims?.sub,80);
  if(!uid)return false;
  const {data}=await ctx.supabaseAdmin.from("profiles").select("is_admin").eq("id",uid).maybeSingle();
  return data?.is_admin===true;
}

function bytesToBase64Url(bytes:Uint8Array){
  let binary="";
  for(const b of bytes)binary+=String.fromCharCode(b);
  return btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}

function randomState(){
  const bytes=new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

async function sha256Hex(value:string){
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,"0")).join("");
}

function providerConfig(provider:string){
  if(provider==="pinterest"){
    return {
      client_id:clean(Deno.env.get("PINTEREST_CLIENT_ID"),300),
      client_secret:clean(Deno.env.get("PINTEREST_CLIENT_SECRET"),1000),
      redirect_uri:clean(Deno.env.get("PINTEREST_REDIRECT_URI")||DEFAULT_CALLBACK,500),
      scopes:["ads:read","user_accounts:read"]
    };
  }
  if(provider==="youtube"){
    return {
      client_id:clean(Deno.env.get("GOOGLE_OAUTH_CLIENT_ID"),300),
      client_secret:clean(Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET"),1000),
      redirect_uri:clean(Deno.env.get("GOOGLE_OAUTH_REDIRECT_URI")||DEFAULT_CALLBACK,500),
      scopes:[
        "https://www.googleapis.com/auth/youtube.readonly",
        "https://www.googleapis.com/auth/yt-analytics.readonly"
      ]
    };
  }
  return {client_id:"",client_secret:"",redirect_uri:"",scopes:[]};
}

async function vaultUpsert(name:string,value:string,description:string){
  if(!name||!value)throw new Error("invalid vault write");
  const rows:any[]=await sql.unsafe(
    "select id::text from vault.secrets where name=$1 limit 1",
    [name]
  );
  if(rows.length){
    await sql.unsafe(
      "select vault.update_secret($1::uuid,$2,$3,$4)",
      [rows[0].id,value,name,description]
    );
  }else{
    await sql.unsafe(
      "select vault.create_secret($1,$2,$3)",
      [value,name,description]
    );
  }
}

async function vaultExists(name:string){
  if(!name)return false;
  const rows:any[]=await sql.unsafe(
    "select exists(select 1 from vault.secrets where name=$1) as exists",
    [name]
  );
  return rows[0]?.exists===true;
}

async function exchangePinterest(cfg:any,code:string){
  const basic=btoa(cfg.client_id+":"+cfg.client_secret);
  const body=new URLSearchParams({
    grant_type:"authorization_code",
    code,
    redirect_uri:cfg.redirect_uri
  });
  const res=await fetch("https://api.pinterest.com/v5/oauth/token",{
    method:"POST",
    headers:{
      Authorization:"Basic "+basic,
      "Content-Type":"application/x-www-form-urlencoded",
      Accept:"application/json"
    },
    body
  });
  const payload=await res.json().catch(()=>({}));
  if(!res.ok||!payload?.access_token)throw new Error("PINTEREST_TOKEN_EXCHANGE_FAILED");
  return payload;
}

async function exchangeGoogle(cfg:any,code:string){
  const body=new URLSearchParams({
    client_id:cfg.client_id,
    client_secret:cfg.client_secret,
    code,
    redirect_uri:cfg.redirect_uri,
    grant_type:"authorization_code"
  });
  const res=await fetch("https://oauth2.googleapis.com/token",{
    method:"POST",
    headers:{"Content-Type":"application/x-www-form-urlencoded",Accept:"application/json"},
    body
  });
  const payload=await res.json().catch(()=>({}));
  if(!res.ok||!payload?.access_token)throw new Error("GOOGLE_TOKEN_EXCHANGE_FAILED");
  return payload;
}
async function discoverPinterestAccount(accessToken:string){
  try{
    const res=await fetch("https://api.pinterest.com/v5/ad_accounts?page_size=25",{
      headers:{Authorization:"Bearer "+accessToken,Accept:"application/json"}
    });
    const payload=await res.json().catch(()=>({}));
    if(!res.ok)return {selected:"",candidates:[],discovery_status:"UNAVAILABLE"};
    const items=Array.isArray(payload?.items)?payload.items:[];
    const candidates=items.map((x:any)=>clean(x?.id,120)).filter(Boolean).slice(0,25);
    return {
      selected:candidates.length===1?candidates[0]:"",
      candidates,
      discovery_status:candidates.length===1?"AUTO_SELECTED":candidates.length>1?"OWNER_SELECTION_REQUIRED":"NONE_FOUND"
    };
  }catch{
    return {selected:"",candidates:[],discovery_status:"UNAVAILABLE"};
  }
}
async function discoverYoutubeChannel(accessToken:string){
  try{
    const params=new URLSearchParams({part:"id",mine:"true",maxResults:"5"});
    const res=await fetch("https://www.googleapis.com/youtube/v3/channels?"+params.toString(),{
      headers:{Authorization:"Bearer "+accessToken,Accept:"application/json"}
    });
    const payload=await res.json().catch(()=>({}));
    if(!res.ok)return {selected:"",candidates:[],discovery_status:"UNAVAILABLE"};
    const items=Array.isArray(payload?.items)?payload.items:[];
    const candidates=items.map((x:any)=>clean(x?.id,120)).filter(Boolean).slice(0,5);
    return {
      selected:candidates.length===1?candidates[0]:"",
      candidates,
      discovery_status:candidates.length===1?"AUTO_SELECTED":candidates.length>1?"OWNER_SELECTION_REQUIRED":"NONE_FOUND"
    };
  }catch{
    return {selected:"",candidates:[],discovery_status:"UNAVAILABLE"};
  }
}

function parseScopes(payload:any,fallback:string[]){
  const raw=payload?.scope;
  if(Array.isArray(raw))return raw.map((x:any)=>clean(x,200)).filter(Boolean);
  if(typeof raw==="string")return raw.split(/[\s,]+/).map(x=>clean(x,200)).filter(Boolean);
  return fallback;
}

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors(req)});
  if(req.method!=="POST")return json(req,{error:"method not allowed"},405);

  const {data:ctx,error:authError}=await createSupabaseContext(req,{auth:"user"});
  if(authError||!ctx)return json(req,{error:"unauthorized"},authError?.status||401);
  if(!(await isAdmin(ctx)))return json(req,{error:"ADMIN_REQUIRED"},403);

  let body:any={};
  try{body=await req.json()}catch{}
  const action=clean(body?.action||"status",40).toLowerCase();

  if(action==="status"){
    const {data,error}=await ctx.supabaseAdmin.from("f60t_oauth_connections")
      .select("provider,status,scopes,external_account_id,expires_at,connected_at,last_refresh_at,last_error_code,metadata,updated_at")
      .order("provider");
    if(error)return json(req,{error:"connection_status_failed"},500);

    const providers=["pinterest","youtube"].map(provider=>{
      const cfg=providerConfig(provider);
      const row=(data||[]).find((x:any)=>x.provider===provider)||{};
      return {
        provider,
        config_ready:Boolean(cfg.client_id&&cfg.client_secret&&cfg.redirect_uri),
        redirect_uri:cfg.redirect_uri||"",
        scopes:cfg.scopes,
        connection:row
      };
    });
    return json(req,{ok:true,action,providers,secrets_exposed:false});
  }

  if(action==="start"){
    const provider=clean(body?.provider,30).toLowerCase();
    if(!["pinterest","youtube"].includes(provider))return json(req,{error:"unsupported provider"},400);

    const cfg=providerConfig(provider);
    if(!cfg.client_id||!cfg.client_secret||!cfg.redirect_uri){
      await ctx.supabaseAdmin.from("f60t_oauth_connections").upsert({
        provider,status:"CONFIG_REQUIRED",last_error_code:"OAUTH_APP_CONFIG_MISSING",updated_at:new Date().toISOString()
      },{onConflict:"provider"});
      return json(req,{
        ok:false,
        provider,
        status:"CONFIG_REQUIRED",
        required:provider==="pinterest"
          ? ["PINTEREST_CLIENT_ID","PINTEREST_CLIENT_SECRET","PINTEREST_REDIRECT_URI"]
          : ["GOOGLE_OAUTH_CLIENT_ID","GOOGLE_OAUTH_CLIENT_SECRET","GOOGLE_OAUTH_REDIRECT_URI"],
        secrets_exposed:false
      },409);
    }

    const state=randomState();
    const stateHash=await sha256Hex(state);
    const uid=clean(ctx.userClaims?.id||ctx.userClaims?.sub,80);
    const expiresAt=new Date(Date.now()+10*60*1000).toISOString();

    const {error}=await ctx.supabaseAdmin.from("f60t_oauth_states").insert({
      state_hash:stateHash,
      provider,
      created_by:uid,
      redirect_uri:cfg.redirect_uri,
      expires_at:expiresAt
    });
    if(error)return json(req,{error:"oauth_state_store_failed"},500);

    let authUrl="";
    if(provider==="pinterest"){
      const q=new URLSearchParams({
        client_id:cfg.client_id,
        redirect_uri:cfg.redirect_uri,
        response_type:"code",
        scope:cfg.scopes.join(","),
        state
      });
      authUrl="https://www.pinterest.com/oauth/?"+q.toString();
    }else{
      const q=new URLSearchParams({
        client_id:cfg.client_id,
        redirect_uri:cfg.redirect_uri,
        response_type:"code",
        scope:cfg.scopes.join(" "),
        access_type:"offline",
        include_granted_scopes:"true",
        prompt:"consent",
        state
      });
      authUrl="https://accounts.google.com/o/oauth2/v2/auth?"+q.toString();
    }

    return json(req,{ok:true,provider,status:"AUTHORIZATION_REQUIRED",auth_url:authUrl,expires_at:expiresAt,secrets_exposed:false});
  }

  if(action==="exchange"){
    const code=clean(body?.code,3000);
    const state=clean(body?.state,300);
    if(!code||!state)return json(req,{error:"invalid oauth callback"},400);

    const stateHash=await sha256Hex(state);
    const uid=clean(ctx.userClaims?.id||ctx.userClaims?.sub,80);

    const {data:stateRow,error:stateError}=await ctx.supabaseAdmin.from("f60t_oauth_states")
      .select("state_hash,provider,created_by,redirect_uri,expires_at,used_at")
      .eq("state_hash",stateHash)
      .eq("created_by",uid)
      .maybeSingle();

    if(stateError||!stateRow)return json(req,{error:"OAUTH_STATE_INVALID"},403);
    const provider=clean(stateRow.provider,30).toLowerCase();
    if(!["pinterest","youtube"].includes(provider))return json(req,{error:"OAUTH_PROVIDER_INVALID"},403);
    const cfg=providerConfig(provider);
    if(!cfg.client_id||!cfg.client_secret||!cfg.redirect_uri)return json(req,{error:"OAUTH_APP_CONFIG_MISSING"},409);
    if(stateRow.used_at)return json(req,{error:"OAUTH_STATE_ALREADY_USED"},403);
    if(Date.parse(String(stateRow.expires_at||""))<=Date.now())return json(req,{error:"OAUTH_STATE_EXPIRED"},403);
    if(String(stateRow.redirect_uri||"")!==cfg.redirect_uri)return json(req,{error:"OAUTH_REDIRECT_MISMATCH"},403);

    try{
      const payload=provider==="pinterest"
        ? await exchangePinterest(cfg,code)
        : await exchangeGoogle(cfg,code);

      const accessToken=clean(payload?.access_token,10000);
      const refreshToken=clean(payload?.refresh_token,10000);
      const expiresIn=Number(payload?.expires_in)||3600;

      const accessName="f60t_"+provider+"_access_token";
      const refreshName="f60t_"+provider+"_refresh_token";

      await vaultUpsert(accessName,accessToken,"F60T "+provider+" OAuth access token");
      if(refreshToken)await vaultUpsert(refreshName,refreshToken,"F60T "+provider+" OAuth refresh token");

      const hasRefresh=refreshToken?true:await vaultExists(refreshName);
      const scopes=parseScopes(payload,cfg.scopes);
      const expiresAt=new Date(Date.now()+Math.max(60,expiresIn)*1000).toISOString();
      const discovery=provider==="pinterest"
        ? await discoverPinterestAccount(accessToken)
        : await discoverYoutubeChannel(accessToken);

      const {error:upsertError}=await ctx.supabaseAdmin.from("f60t_oauth_connections").upsert({
        provider,
        status:"CONNECTED",
        scopes,
        external_account_id:discovery.selected,
        vault_access_secret_name:accessName,
        vault_refresh_secret_name:hasRefresh?refreshName:"",
        expires_at:expiresAt,
        connected_by:uid,
        connected_at:new Date().toISOString(),
        last_error_code:"",
        metadata:{
          token_type:clean(payload?.token_type,40),
          refresh_present:hasRefresh,
          account_discovery_status:discovery.discovery_status,
          account_candidates:discovery.candidates
        },
        updated_at:new Date().toISOString()
      },{onConflict:"provider"});
      if(upsertError)throw new Error("OAUTH_CONNECTION_STORE_FAILED");

      await ctx.supabaseAdmin.from("f60t_oauth_states")
        .update({used_at:new Date().toISOString()})
        .eq("state_hash",stateHash);

      const sourceKeys=provider==="pinterest"
        ? ["pinterest_trends","pinterest_audience"]
        : ["youtube_analytics"];

      await ctx.supabaseAdmin.from("f60t_signal_sources").update({
        notes:"OAuth connected. Source becomes LIVE only after a successful official API sync.",
        updated_at:new Date().toISOString()
      }).in("source_key",sourceKeys);

      return json(req,{
        ok:true,
        provider,
        status:"CONNECTED",
        expires_at:expiresAt,
        refresh_available:hasRefresh,
        scopes,
        account_discovery_status:discovery.discovery_status,
        account_selection_required:discovery.discovery_status==="OWNER_SELECTION_REQUIRED",
        secrets_exposed:false
      });
    }catch(error){
      const errorCode=clean((error as Error)?.message||"OAUTH_EXCHANGE_FAILED",100);
      await ctx.supabaseAdmin.from("f60t_oauth_connections").upsert({
        provider,status:"ERROR",last_error_code:errorCode,updated_at:new Date().toISOString()
      },{onConflict:"provider"});
      return json(req,{error:errorCode,secrets_exposed:false},502);
    }
  }

  return json(req,{error:"unsupported action"},400);
});