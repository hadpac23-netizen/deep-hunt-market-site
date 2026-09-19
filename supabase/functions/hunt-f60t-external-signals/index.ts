import { createSupabaseContext } from "npm:@supabase/server";

const clean=(v:unknown,n=180)=>String(v??"").replace(/[\r\n\t]+/g," ").replace(/\s+/g," ").trim().slice(0,n);
const moneyNumber=(v:unknown)=>Number.isFinite(Number(v))?Number(v):null;

function cors(req:Request){
  const origin=req.headers.get("origin")||"";
  const allowed=new Set([
    "https://deep-hunt-market.netlify.app",
    "https://hadpac23-netizen.github.io",
    "http://127.0.0.1:18977",
    "http://localhost:18977"
  ]);
  const preview=/^https:\/\/[a-z0-9-]+--deep-hunt-market\.netlify\.app$/i.test(origin);
  return {
    "access-control-allow-origin":(allowed.has(origin)||preview)?origin:"https://deep-hunt-market.netlify.app",
    "access-control-allow-headers":"apikey, authorization, content-type",
    "access-control-allow-methods":"POST, OPTIONS",
    "vary":"Origin"
  };
}
function json(req:Request,body:unknown,status=200){
  return new Response(JSON.stringify(body),{status,headers:{
    "content-type":"application/json","cache-control":"no-store",...cors(req)
  }});
}
async function isAdmin(ctx:any){
  const uid=clean(ctx.userClaims?.id||ctx.userClaims?.sub,80);
  if(!uid)return false;
  const {data}=await ctx.supabaseAdmin.from("profiles").select("is_admin").eq("id",uid).maybeSingle();
  return data?.is_admin===true;
}
function bucketHour(){
  const d=new Date();
  d.setUTCMinutes(0,0,0);
  return d.toISOString();
}
function env(name:string){
  return clean(Deno.env.get(name)||"",5000);
}
function boolConfig(){
  return {
    pinterest_access_token:Boolean(env("PINTEREST_ACCESS_TOKEN")),
    pinterest_ad_account_id:Boolean(env("PINTEREST_AD_ACCOUNT_ID")),
    youtube_oauth_access_token:Boolean(env("YOUTUBE_OAUTH_ACCESS_TOKEN"))
  };
}
async function runStart(ctx:any,sourceKey:string,action:string,region=""){
  const {data,error}=await ctx.supabaseAdmin.from("f60t_external_signal_runs").insert({
    source_key:sourceKey,action,status:"STARTED",region:clean(region,20),
    evidence_ref:"",error_code:"",metadata:{}
  }).select("id").single();
  if(error||!data?.id)return "";
  return String(data.id);
}
async function runFinish(ctx:any,id:string,patch:any){
  if(!id)return;
  await ctx.supabaseAdmin.from("f60t_external_signal_runs").update({
    ...patch,completed_at:new Date().toISOString()
  }).eq("id",id);
}
async function setSource(ctx:any,sourceKey:string,status:string,note:string,evidenceRef:string=""){
  await ctx.supabaseAdmin.from("f60t_signal_sources").update({
    status,
    notes:clean(note,800),
    verified_at:status==="LIVE"?new Date().toISOString():null,
    updated_at:new Date().toISOString(),
    ...(evidenceRef?{official_reference:evidenceRef}:{})
  }).eq("source_key",sourceKey);
}
function safeRegions(body:any){
  const fromBody=Array.isArray(body?.regions)?body.regions:[];
  const fromEnv=env("F60T_PINTEREST_REGIONS").split(",").map(x=>x.trim()).filter(Boolean);
  const list=(fromBody.length?fromBody:fromEnv.length?fromEnv:["US"])
    .map(x=>clean(x,4).toUpperCase())
    .filter(x=>/^[A-Z]{2}$/.test(x));
  return [...new Set(list)].slice(0,12);
}
async function pinterestTrends(ctx:any,body:any){
  const token=env("PINTEREST_ACCESS_TOKEN");
  const sourceKey="pinterest_trends";
  const regions=safeRegions(body);
  if(!token){
    await setSource(ctx,sourceKey,"AVAILABLE_NOT_CONNECTED","Official Trends API verified; PINTEREST_ACCESS_TOKEN is not configured.");
    return {source:sourceKey,status:"SKIPPED_CONFIG",regions,rows_written:0};
  }

  let written=0;
  const results:any[]=[];
  for(const region of regions){
    const runId=await runStart(ctx,sourceKey,"SYNC_TRENDS",region);
    const url="https://api.pinterest.com/v5/trends/keywords/"+encodeURIComponent(region)+"/top/growing?limit=25";
    try{
      const res=await fetch(url,{headers:{Authorization:"Bearer "+token,Accept:"application/json"}});
      const payload=await res.json().catch(()=>({}));
      if(!res.ok){
        const code="PINTEREST_HTTP_"+res.status;
        await runFinish(ctx,runId,{status:"FAILED",http_status:res.status,error_code:code,evidence_ref:url,metadata:{region}});
        await setSource(ctx,sourceKey,"ACCESS_REQUIRED","Pinterest Trends authorization/configuration is not currently valid.","https://developers.pinterest.com/docs/analytics-and-reports/trends/");
        results.push({region,status:"FAILED",http_status:res.status,error_code:code});
        continue;
      }
      const trends=Array.isArray(payload?.trends)?payload.trends:[];
      const rows=trends.slice(0,25).map((x:any,index:number)=>({
        bucket_start:bucketHour(),
        source_key:sourceKey,
        platform:"pinterest",
        country_code:region,
        region:"",
        timezone:"",
        local_hour:null,
        category:clean(x?.keyword,120).toLowerCase(),
        audience:"",
        signal_kind:"PINTEREST_TREND_GROWING",
        event_count:1,
        intent_score_avg:null,
        intent_score_max:null,
        verified:true,
        evidence_ref:url,
        metadata:{
          rank:index+1,
          keyword:clean(x?.keyword,120),
          pct_growth_wow:moneyNumber(x?.pct_growth_wow),
          pct_growth_mom:moneyNumber(x?.pct_growth_mom),
          pct_growth_yoy:moneyNumber(x?.pct_growth_yoy),
          source_semantics:"DEMAND_TREND_NOT_PURCHASE_INTENT",
          official_api:true
        },
        updated_at:new Date().toISOString()
      })).filter((x:any)=>x.category);
      if(rows.length){
        const {error}=await ctx.supabaseAdmin.from("f60t_crowd_signal_snapshots").upsert(rows,{
          onConflict:"bucket_start,source_key,platform,country_code,region,timezone,local_hour,category,audience,signal_kind"
        });
        if(error)throw new Error("SNAPSHOT_STORE_FAILED:"+error.message);
      }
      written+=rows.length;
      await runFinish(ctx,runId,{status:"SUCCESS",http_status:res.status,rows_written:rows.length,evidence_ref:url,metadata:{region}});
      results.push({region,status:"SUCCESS",rows_written:rows.length});
    }catch(error){
      const msg=clean((error as Error)?.message||error,180);
      await runFinish(ctx,runId,{status:"FAILED",rows_written:0,error_code:"PINTEREST_TRENDS_FETCH_FAILED",evidence_ref:url,metadata:{region,message:msg}});
      results.push({region,status:"FAILED",error_code:"PINTEREST_TRENDS_FETCH_FAILED"});
    }
  }

  if(written>0)await setSource(ctx,sourceKey,"LIVE","Official Pinterest Trends API sync succeeded.","https://developers.pinterest.com/docs/analytics-and-reports/trends/");
  return {source:sourceKey,status:written>0?"SUCCESS":"FAILED",rows_written:written,regions:results};
}
async function pinterestAudience(ctx:any,body:any){
  const token=env("PINTEREST_ACCESS_TOKEN");
  const adAccount=env("PINTEREST_AD_ACCOUNT_ID");
  const sourceKey="pinterest_audience";
  if(!token||!adAccount){
    await setSource(ctx,sourceKey,"AVAILABLE_NOT_CONNECTED","Pinterest Audience Insights requires PINTEREST_ACCESS_TOKEN and PINTEREST_AD_ACCOUNT_ID.");
    return {source:sourceKey,status:"SKIPPED_CONFIG",rows_written:0};
  }
  const audienceType=["YOUR_TOTAL_AUDIENCE","YOUR_ENGAGED_AUDIENCE","PINTEREST_TOTAL_AUDIENCE"].includes(String(body?.audience_insight_type||""))
    ? String(body.audience_insight_type)
    : "PINTEREST_TOTAL_AUDIENCE";
  const url="https://api.pinterest.com/v5/ad_accounts/"+encodeURIComponent(adAccount)+"/audience_insights?audience_insight_type="+encodeURIComponent(audienceType);
  const runId=await runStart(ctx,sourceKey,"SYNC_AUDIENCE","");
  try{
    const res=await fetch(url,{headers:{Authorization:"Bearer "+token,Accept:"application/json"}});
    const payload=await res.json().catch(()=>({}));
    if(!res.ok){
      const code="PINTEREST_HTTP_"+res.status;
      await runFinish(ctx,runId,{status:"FAILED",http_status:res.status,error_code:code,evidence_ref:url,metadata:{audience_type:audienceType}});
      await setSource(ctx,sourceKey,"ACCESS_REQUIRED","Pinterest Audience Insights authorization/configuration is not currently valid.","https://developers.pinterest.com/docs/analytics-and-reports/audience-insights/");
      return {source:sourceKey,status:"FAILED",http_status:res.status,error_code:code,rows_written:0};
    }

    const rows:any[]=[];
    const bucket=bucketHour();
    const categories=Array.isArray(payload?.categories)?payload.categories:[];
    categories.slice(0,50).forEach((x:any,index:number)=>{
      const name=clean(x?.name,120);
      if(!name)return;
      rows.push({
        bucket_start:bucket,source_key:sourceKey,platform:"pinterest",country_code:"",region:"",timezone:"",
        local_hour:null,category:name.toLowerCase(),audience:audienceType,signal_kind:"PINTEREST_AUDIENCE_AFFINITY",
        event_count:1,intent_score_avg:null,intent_score_max:null,verified:true,evidence_ref:url,
        metadata:{rank:index+1,ratio:moneyNumber(x?.ratio),index:moneyNumber(x?.index),source_semantics:"AUDIENCE_AFFINITY_NOT_PURCHASE_INTENT",official_api:true},
        updated_at:new Date().toISOString()
      });
    });
    const countries=Array.isArray(payload?.demographics?.countries)?payload.demographics.countries:[];
    countries.slice(0,60).forEach((x:any,index:number)=>{
      const country=clean(x?.key,4).toUpperCase();
      if(!/^[A-Z]{2}$/.test(country))return;
      rows.push({
        bucket_start:bucket,source_key:sourceKey,platform:"pinterest",country_code:country,region:"",timezone:"",
        local_hour:null,category:"__audience_country__",audience:audienceType,signal_kind:"PINTEREST_AUDIENCE_COUNTRY",
        event_count:1,intent_score_avg:null,intent_score_max:null,verified:true,evidence_ref:url,
        metadata:{rank:index+1,ratio:moneyNumber(x?.ratio),name:clean(x?.name,120),source_semantics:"AUDIENCE_DISTRIBUTION_NOT_PURCHASE_INTENT",official_api:true},
        updated_at:new Date().toISOString()
      });
    });
    if(rows.length){
      const {error}=await ctx.supabaseAdmin.from("f60t_crowd_signal_snapshots").upsert(rows,{
        onConflict:"bucket_start,source_key,platform,country_code,region,timezone,local_hour,category,audience,signal_kind"
      });
      if(error)throw new Error("SNAPSHOT_STORE_FAILED:"+error.message);
    }
    await runFinish(ctx,runId,{status:"SUCCESS",http_status:res.status,rows_written:rows.length,evidence_ref:url,metadata:{audience_type:audienceType}});
    await setSource(ctx,sourceKey,"LIVE","Official Pinterest Audience Insights API sync succeeded.","https://developers.pinterest.com/docs/analytics-and-reports/audience-insights/");
    return {source:sourceKey,status:"SUCCESS",rows_written:rows.length,audience_type:audienceType};
  }catch(error){
    const msg=clean((error as Error)?.message||error,180);
    await runFinish(ctx,runId,{status:"FAILED",rows_written:0,error_code:"PINTEREST_AUDIENCE_FETCH_FAILED",evidence_ref:url,metadata:{message:msg,audience_type:audienceType}});
    return {source:sourceKey,status:"FAILED",error_code:"PINTEREST_AUDIENCE_FETCH_FAILED",rows_written:0};
  }
}
function isoDate(daysAgo:number){
  const d=new Date(Date.now()-daysAgo*86400000);
  return d.toISOString().slice(0,10);
}
async function youtubeAnalytics(ctx:any){
  const token=env("YOUTUBE_OAUTH_ACCESS_TOKEN");
  const sourceKey="youtube_analytics";
  if(!token){
    await setSource(ctx,sourceKey,"AVAILABLE_NOT_CONNECTED","Official YouTube Analytics connector is ready; YOUTUBE_OAUTH_ACCESS_TOKEN is not configured.");
    return {source:sourceKey,status:"SKIPPED_CONFIG",rows_written:0};
  }
  const params=new URLSearchParams({
    ids:"channel==MINE",
    startDate:isoDate(8),
    endDate:isoDate(1),
    metrics:"views,estimatedMinutesWatched",
    dimensions:"country",
    sort:"-views",
    maxResults:"50"
  });
  const url="https://youtubeanalytics.googleapis.com/v2/reports?"+params.toString();
  const runId=await runStart(ctx,sourceKey,"SYNC_COUNTRY_TRAFFIC","");
  try{
    const res=await fetch(url,{headers:{Authorization:"Bearer "+token,Accept:"application/json"}});
    const payload=await res.json().catch(()=>({}));
    if(!res.ok){
      const code="YOUTUBE_HTTP_"+res.status;
      await runFinish(ctx,runId,{status:"FAILED",http_status:res.status,error_code:code,evidence_ref:"https://developers.google.com/youtube/analytics/reference/reports/query",metadata:{}});
      await setSource(ctx,sourceKey,"ACCESS_REQUIRED","YouTube Analytics OAuth/access is not currently valid.","https://developers.google.com/youtube/analytics/reference/reports/query");
      return {source:sourceKey,status:"FAILED",http_status:res.status,error_code:code,rows_written:0};
    }
    const headers=Array.isArray(payload?.columnHeaders)?payload.columnHeaders.map((x:any)=>String(x?.name||"")):[];
    const countryIndex=headers.indexOf("country");
    const viewsIndex=headers.indexOf("views");
    const minutesIndex=headers.indexOf("estimatedMinutesWatched");
    const rawRows=Array.isArray(payload?.rows)?payload.rows:[];
    const bucket=bucketHour();
    const rows=rawRows.slice(0,50).map((row:any[])=>{
      const country=clean(row?.[countryIndex],4).toUpperCase();
      const views=Math.max(0,Math.floor(Number(row?.[viewsIndex])||0));
      if(!/^[A-Z]{2}$/.test(country)||views<=0)return null;
      return {
        bucket_start:bucket,source_key:sourceKey,platform:"youtube",country_code:country,region:"",timezone:"",
        local_hour:null,category:"__channel_country__",audience:"",signal_kind:"YOUTUBE_CHANNEL_COUNTRY_VIEWS",
        event_count:views,intent_score_avg:null,intent_score_max:null,verified:true,
        evidence_ref:"https://developers.google.com/youtube/analytics/reference/reports/query",
        metadata:{views,estimated_minutes_watched:moneyNumber(row?.[minutesIndex]),source_semantics:"CHANNEL_VIEWERSHIP_NOT_PURCHASE_INTENT",official_api:true,period_start:isoDate(8),period_end:isoDate(1)},
        updated_at:new Date().toISOString()
      };
    }).filter(Boolean);
    if(rows.length){
      const {error}=await ctx.supabaseAdmin.from("f60t_crowd_signal_snapshots").upsert(rows,{
        onConflict:"bucket_start,source_key,platform,country_code,region,timezone,local_hour,category,audience,signal_kind"
      });
      if(error)throw new Error("SNAPSHOT_STORE_FAILED:"+error.message);
    }
    await runFinish(ctx,runId,{status:"SUCCESS",http_status:res.status,rows_written:rows.length,evidence_ref:"https://developers.google.com/youtube/analytics/reference/reports/query",metadata:{period_start:isoDate(8),period_end:isoDate(1)}});
    await setSource(ctx,sourceKey,"LIVE","Official YouTube Analytics country report sync succeeded. This is viewership, not purchase intent or hourly viewer-time.","https://developers.google.com/youtube/analytics/reference/reports/query");
    return {source:sourceKey,status:"SUCCESS",rows_written:rows.length};
  }catch(error){
    const msg=clean((error as Error)?.message||error,180);
    await runFinish(ctx,runId,{status:"FAILED",rows_written:0,error_code:"YOUTUBE_ANALYTICS_FETCH_FAILED",evidence_ref:"https://developers.google.com/youtube/analytics/reference/reports/query",metadata:{message:msg}});
    return {source:sourceKey,status:"FAILED",error_code:"YOUTUBE_ANALYTICS_FETCH_FAILED",rows_written:0};
  }
}

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors(req)});
  if(req.method!=="POST")return json(req,{error:"method not allowed"},405);
  const {data:ctx,error:authError}=await createSupabaseContext(req,{auth:["user","publishable"]});
  if(authError||!ctx)return json(req,{error:"unauthorized"},authError?.status||401);
  if(!(await isAdmin(ctx)))return json(req,{error:"ADMIN_REQUIRED"},403);

  let body:any={};
  try{body=await req.json()}catch{}
  const action=clean(body?.action||"status",50).toLowerCase();
  const config=boolConfig();

  if(action==="status"){
    const {data:sources}=await ctx.supabaseAdmin.from("f60t_signal_sources")
      .select("source_key,platform,signal_family,status,access_mode,official_reference,notes,verified_at,updated_at")
      .in("source_key",["pinterest_trends","pinterest_audience","youtube_analytics","google_trends_alpha","tiktok_market_scope","youtube_audience_time"])
      .order("source_key");
    return json(req,{ok:true,action,config,sources:sources||[],secrets_exposed:false});
  }

  const allowed=new Set(["sync_pinterest_trends","sync_pinterest_audience","sync_youtube_analytics","sync_available"]);
  if(!allowed.has(action))return json(req,{error:"unsupported action"},400);

  const results:any[]=[];
  if(action==="sync_pinterest_trends"||action==="sync_available")results.push(await pinterestTrends(ctx,body));
  if(action==="sync_pinterest_audience"||action==="sync_available")results.push(await pinterestAudience(ctx,body));
  if(action==="sync_youtube_analytics"||action==="sync_available")results.push(await youtubeAnalytics(ctx));

  return json(req,{
    ok:true,
    action,
    config,
    results,
    paid_spend:false,
    external_publish:false,
    live_price_write:false,
    supplier_order:false,
    payment_activation:false,
    secrets_exposed:false
  });
});