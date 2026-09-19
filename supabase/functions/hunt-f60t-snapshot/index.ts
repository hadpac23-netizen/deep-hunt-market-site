import { createSupabaseContext } from "npm:@supabase/server";

const clean=(v:unknown,n=160)=>String(v??"").replace(/[\r\n\t]+/g," ").replace(/\s+/g," ").trim().slice(0,n);
const number=(v:unknown)=>Number.isFinite(Number(v))?Number(v):null;
const INTENT_SCORE:Record<string,number>={
  hunt_page_view:10,
  hunt_view_list:20,
  hunt_search:40,
  hunt_view_item:50,
  hunt_select_item:55,
  hunt_like:60,
  hunt_save:65,
  hunt_add_to_cart:75,
  hunt_checkout_market:82,
  hunt_begin_checkout:90
};

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
    "access-control-allow-headers":"apikey, authorization, content-type, x-f60t-cron-secret",
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
async function sha256Hex(value:string){
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,"0")).join("");
}
function safeEqual(a:string,b:string){
  if(a.length!==b.length)return false;
  let diff=0;
  for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);
  return diff===0;
}
async function cronAuthorized(ctx:any,req:Request){
  const raw=clean(req.headers.get("x-f60t-cron-secret"),300);
  if(!raw)return false;
  const {data}=await ctx.supabaseAdmin.from("f60t_cron_auth")
    .select("secret_hash").eq("key","hourly").maybeSingle();
  if(!data?.secret_hash)return false;
  return safeEqual(await sha256Hex(raw),String(data.secret_hash));
}
async function callerAllowed(ctx:any,req:Request){
  if(ctx.authMode==="user")return await isAdmin(ctx);
  if(ctx.authMode==="none")return await cronAuthorized(ctx,req);
  return false;
}
function hourStartUtc(d=new Date()){
  const x=new Date(d);
  x.setUTCMinutes(0,0,0);
  return x;
}
function localHour(iso:string,timezone:string){
  if(!timezone)return null;
  try{
    const parts=new Intl.DateTimeFormat("en-US",{timeZone:timezone,hour:"2-digit",hourCycle:"h23"}).formatToParts(new Date(iso));
    const part=parts.find(x=>x.type==="hour")?.value;
    const h=Number(part);
    return Number.isInteger(h)&&h>=0&&h<=23?h:null;
  }catch{return null}
}
function sourceOf(meta:any){
  const explicit=clean(meta?.attribution_source,80).toLowerCase();
  if(explicit)return explicit;
  const src=clean(meta?.source,80).toLowerCase();
  return src||"unknown";
}
function marketOf(meta:any){
  return clean(meta?.destination_market||meta?.market,12).toUpperCase();
}
function aggregate(events:any[]){
  const map=new Map<string,any>();
  for(const row of events||[]){
    const meta=row?.metadata&&typeof row.metadata==="object"?row.metadata:{};
    const timezone=clean(meta.timezone,80);
    const local=localHour(String(row.created_at||""),timezone);
    const source=sourceOf(meta);
    const country=marketOf(meta);
    const category=clean(meta.category||meta.search_category,80).toLowerCase();
    const audience=clean(meta.mission_type,40).toLowerCase();
    const score=INTENT_SCORE[String(row.event_type||"")]??0;
    const key=[country,source,category,timezone,local===null?"":String(local),audience].join("|");
    const item=map.get(key)||{
      country_code:country,platform:source,category,timezone,local_hour:local,audience,
      event_count:0,intent_score_sum:0,intent_score_max:0,last_seen:""
    };
    item.event_count+=1;
    item.intent_score_sum+=score;
    item.intent_score_max=Math.max(item.intent_score_max,score);
    if(!item.last_seen||String(row.created_at)>item.last_seen)item.last_seen=String(row.created_at||"");
    map.set(key,item);
  }
  return [...map.values()].map(x=>({
    country_code:x.country_code,
    platform:x.platform,
    category:x.category,
    timezone:x.timezone,
    local_hour:x.local_hour,
    audience:x.audience,
    event_count:x.event_count,
    intent_score_avg:x.event_count?Number((x.intent_score_sum/x.event_count).toFixed(2)):0,
    intent_score_max:x.intent_score_max,
    last_seen:x.last_seen,
    score_type:"FIRST_PARTY_INTENT_PROXY_NOT_PROFIT"
  }));
}

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors(req)});
  if(req.method!=="POST")return json(req,{error:"method not allowed"},405);

  const {data:ctx,error:authError}=await createSupabaseContext(req,{auth:["user","none"]});
  if(authError||!ctx)return json(req,{error:"unauthorized"},authError?.status||401);
  if(!(await callerAllowed(ctx,req)))return json(req,{error:"ADMIN_OR_CRON_REQUIRED"},403);

  const errors:string[]=[];
  const now=new Date();
  const hourStart=hourStartUtc(now);
  const hourEnd=new Date(hourStart.getTime()+60*60*1000);
  const since24=new Date(now.getTime()-24*60*60*1000).toISOString();

  const [eventsRes,sourcesRes,agentsRes,bridgeRes,externalRes,externalRunsRes]=await Promise.all([
    ctx.supabaseAdmin.from("analytics_events")
      .select("event_type,metadata,created_at")
      .gte("created_at",since24)
      .order("created_at",{ascending:false})
      .limit(5000),
    ctx.supabaseAdmin.from("f60t_signal_sources")
      .select("source_key,platform,signal_family,access_mode,status,official_reference,notes,verified_at,updated_at")
      .order("source_key"),
    ctx.supabaseAdmin.from("f60t_agent_signal_events")
      .select("surface,protocol,event_type,country_code,product_key,verified,evidence_ref,occurred_at")
      .gte("occurred_at",since24)
      .order("occurred_at",{ascending:false})
      .limit(1000),
    ctx.supabaseAdmin.from("hunt_purchase_attribution_bridge")
      .select("payment_session_id,paid_at,provider_payment_confirmation,real_order_linked,server_purchase_confirmation,finance_ledger_id,finance_ledger_present,finance_is_test,settlement_status,contribution_locked,available_profit,profit_evidence_ready")
      .gte("paid_at",hourStart.toISOString())
      .lt("paid_at",hourEnd.toISOString()),
    ctx.supabaseAdmin.from("f60t_crowd_signal_snapshots")
      .select("source_key,platform,country_code,category,audience,signal_kind,event_count,verified,evidence_ref,metadata,bucket_start")
      .neq("source_key","hunt_first_party")
      .gte("bucket_start",since24)
      .order("bucket_start",{ascending:false})
      .limit(1000),
    ctx.supabaseAdmin.from("f60t_external_signal_runs")
      .select("source_key,action,status,region,rows_written,http_status,evidence_ref,error_code,started_at,completed_at")
      .order("started_at",{ascending:false})
      .limit(40)
  ]);
  if(eventsRes.error)errors.push("analytics_events:"+eventsRes.error.message);
  if(sourcesRes.error)errors.push("signal_sources:"+sourcesRes.error.message);
  if(agentsRes.error)errors.push("agent_signals:"+agentsRes.error.message);
  if(bridgeRes.error)errors.push("purchase_bridge:"+bridgeRes.error.message);
  if(externalRes.error)errors.push("external_signals:"+externalRes.error.message);
  if(externalRunsRes.error)errors.push("external_runs:"+externalRunsRes.error.message);

  const events=Array.isArray(eventsRes.data)?eventsRes.data:[];
  const clusters=aggregate(events);
  const knownMarketEvents=events.filter((row:any)=>marketOf(row?.metadata)).length;
  const recognizedIntentEvents=events.filter((row:any)=>Object.prototype.hasOwnProperty.call(INTENT_SCORE,String(row?.event_type||"")));
  const recognizedMarketIntentEvents=recognizedIntentEvents.filter((row:any)=>marketOf(row?.metadata)).length;
  const timezoneEvents=recognizedIntentEvents.filter((row:any)=>clean(row?.metadata?.timezone,80)).length;
  const crowdSignalsReady=recognizedMarketIntentEvents>=20;
  const localBuyingClockReady=timezoneEvents>=20;
  const hotZones=clusters
    .filter(x=>x.event_count>=3&&x.country_code&&x.intent_score_max>0)
    .sort((a,b)=>b.intent_score_avg-a.intent_score_avg||b.event_count-a.event_count)
    .slice(0,12);

  const currentHourEvents=events.filter((row:any)=>{
    const t=Date.parse(String(row.created_at||""));
    return Number.isFinite(t)&&t>=hourStart.getTime()&&t<hourEnd.getTime();
  });
  const currentClusters=aggregate(currentHourEvents).filter(x=>x.timezone&&x.local_hour!==null&&x.event_count>0);
  if(currentClusters.length){
    const snapshotRows=currentClusters.map(x=>({
      bucket_start:hourStart.toISOString(),
      source_key:"hunt_first_party",
      platform:x.platform,
      country_code:x.country_code,
      region:"",
      timezone:x.timezone,
      local_hour:x.local_hour,
      category:x.category,
      audience:x.audience,
      signal_kind:"FIRST_PARTY_INTENT",
      event_count:x.event_count,
      intent_score_avg:x.intent_score_avg,
      intent_score_max:x.intent_score_max,
      verified:true,
      evidence_ref:"analytics_events:consented_first_party",
      metadata:{score_type:x.score_type},
      updated_at:now.toISOString()
    }));
    const {error}=await ctx.supabaseAdmin.from("f60t_crowd_signal_snapshots").upsert(snapshotRows,{
      onConflict:"bucket_start,source_key,platform,country_code,region,timezone,local_hour,category,audience,signal_kind"
    });
    if(error)errors.push("crowd_snapshot_upsert:"+error.message);
  }

  const bridgeRows=(Array.isArray(bridgeRes.data)?bridgeRes.data:[]).filter((r:any)=>
    r?.provider_payment_confirmation===true&&
    r?.server_purchase_confirmation===true&&
    r?.real_order_linked===true&&
    r?.finance_ledger_present===true&&
    r?.finance_is_test===false&&
    r?.profit_evidence_ready===true
  );
  const financeIds=[...new Set(bridgeRows.map((r:any)=>clean(r.finance_ledger_id,80)).filter(Boolean))];
  let financeRows:any[]=[];
  if(financeIds.length){
    const fr=await ctx.supabaseAdmin.from("hunt_order_finance_ledger")
      .select("id,currency,available_profit,contribution_locked,settlement_status,is_test")
      .in("id",financeIds);
    if(fr.error)errors.push("finance_ledger:"+fr.error.message);
    else financeRows=Array.isArray(fr.data)?fr.data:[];
  }

  const groups=new Map<string,any>();
  for(const row of financeRows){
    if(row?.is_test===true)continue;
    const currency=clean(row?.currency,12).toUpperCase()||"USD";
    const g=groups.get(currency)||{currency,rows:[],settled:[]};
    g.rows.push(row);
    if(String(row?.settlement_status||"").toLowerCase()==="settled")g.settled.push(row);
    groups.set(currency,g);
  }
  if(!groups.size)groups.set("USD",{currency:"USD",rows:[],settled:[]});

  const profitRows:any[]=[];
  for(const g of groups.values()){
    const locked=g.rows.reduce((sum:number,row:any)=>sum+(number(row?.contribution_locked)||0),0);
    const verifiedNet=g.settled.reduce((sum:number,row:any)=>sum+(number(row?.available_profit)||0),0);
    const status=g.rows.length===0
      ?"UNVERIFIED"
      :g.settled.length===g.rows.length
        ?"VERIFIED"
        :g.settled.length>0
          ?"PARTIAL"
          :"LOCKED_EVIDENCE";
    profitRows.push({
      hour_start:hourStart.toISOString(),
      currency:g.currency,
      verified_net_profit:Number(verifiedNet.toFixed(2)),
      locked_contribution:Number(locked.toFixed(2)),
      confirmed_real_orders:g.rows.length,
      settled_real_orders:g.settled.length,
      evidence_rows:g.rows.length,
      verification_status:status,
      source_mode:"M29_PURCHASE_BRIDGE",
      evidence:{
        provider_payment_confirmation_required:true,
        server_purchase_confirmation_required:true,
        real_order_required:true,
        finance_evidence_required:true,
        settlement_required_for_verified_net:true,
        source_finance_ledger_ids:g.rows.map((x:any)=>String(x.id))
      },
      calculated_at:now.toISOString(),
      updated_at:now.toISOString()
    });
  }
  const {error:profitError}=await ctx.supabaseAdmin.from("f60t_hourly_profit_ledger").upsert(profitRows,{
    onConflict:"hour_start,currency"
  });
  if(profitError)errors.push("hourly_profit_upsert:"+profitError.message);

  const usd=profitRows.find(x=>x.currency==="USD")||{
    hour_start:hourStart.toISOString(),currency:"USD",verified_net_profit:0,locked_contribution:0,
    confirmed_real_orders:0,settled_real_orders:0,evidence_rows:0,verification_status:"UNVERIFIED"
  };

  const externalRows=Array.isArray(externalRes.data)?externalRes.data:[];
  const verifiedExternalRows=externalRows.filter((x:any)=>x?.verified===true);
  const externalSourceCounts:Record<string,number>={};
  for(const row of verifiedExternalRows){
    const key=clean(row?.source_key,80)||"unknown";
    externalSourceCounts[key]=(externalSourceCounts[key]||0)+1;
  }
  const topExternal=verifiedExternalRows.slice(0,12).map((row:any)=>({
    source_key:clean(row?.source_key,80),
    platform:clean(row?.platform,60),
    country_code:clean(row?.country_code,12),
    category:clean(row?.category,120),
    audience:clean(row?.audience,80),
    signal_kind:clean(row?.signal_kind,80),
    event_count:Number(row?.event_count||0),
    bucket_start:String(row?.bucket_start||""),
    metadata:row?.metadata&&typeof row.metadata==="object"?row.metadata:{},
    evidence_ref:clean(row?.evidence_ref,400)
  }));

  const agentRows=Array.isArray(agentsRes.data)?agentsRes.data:[];
  const verifiedAgentRows=agentRows.filter((x:any)=>x?.verified===true);
  const agentCounts:Record<string,number>={};
  for(const row of verifiedAgentRows){
    const key=clean(row?.event_type,40)||"unknown";
    agentCounts[key]=(agentCounts[key]||0)+1;
  }

  const externalKinds=new Set(verifiedExternalRows.map((x:any)=>clean(x?.signal_kind,80)));
  const worldWatch={
    always_on:true,
    cadence:"HOURLY",
    skill_count:40,
    radars:[
      {
        code:"SEARCH_RADAR",
        state:(recognizedIntentEvents.length>0||externalKinds.has("YOUTUBE_TRAFFIC_SOURCE")||externalKinds.has("PINTEREST_TREND_GROWING"))?"SIGNALS":"OBSERVE"
      },
      {
        code:"SOCIAL_DISCOVERY_RADAR",
        state:(externalSourceCounts["pinterest_trends"]||externalSourceCounts["pinterest_audience"])?"SIGNALS":"OBSERVE"
      },
      {
        code:"COMMUNITY_RADAR",
        state:"OBSERVE"
      },
      {
        code:"CREATOR_LIVE_RADAR",
        state:(externalSourceCounts["youtube_analytics"]||0)>0?"SIGNALS":"OBSERVE"
      },
      {
        code:"AGENT_RADAR",
        state:verifiedAgentRows.length>0?"SIGNALS":"OBSERVE"
      }
    ],
    cycle:[
      "SCAN_WORLD","MAP_CROWD","MAP_INTENT","MAP_LOCAL_TIME","SEGMENT_AUDIENCE",
      "MAP_PLATFORM","CHOOSE_FIRST_THING","CHOOSE_ENTRY_ROUTE","CHECK_PROFIT",
      "CHECK_OWNER_GATE","EXECUTE_PREPARE_HOLD","VERIFY","LEARN","MOVE"
    ],
    external_actions_gated:true,
    paid_spend:false,
    external_publish:false,
    live_price_write:false,
    verified_profit_required:true
  };

  return json(req,{
    ok:true,
    generated_at:now.toISOString(),
    crowd_signals_ready:crowdSignalsReady,
    local_buying_clock_ready:localBuyingClockReady,
    first_party_event_count:events.length,
    known_market_event_count:knownMarketEvents,
    recognized_intent_event_count:recognizedIntentEvents.length,
    recognized_market_intent_event_count:recognizedMarketIntentEvents,
    timezone_event_count:timezoneEvents,
    hot_zones:hotZones,
    sources:Array.isArray(sourcesRes.data)?sourcesRes.data:[],
    world_watch:worldWatch,
    external_signals:{
      verified_rows:verifiedExternalRows.length,
      source_counts:externalSourceCounts,
      top:topExternal,
      recent_runs:Array.isArray(externalRunsRes.data)?externalRunsRes.data:[]
    },
    agent_signals:{
      verified_events:verifiedAgentRows.length,
      counts:agentCounts
    },
    hourly_profit:{
      ...usd,
      hour_end:hourEnd.toISOString(),
      evidence_ref:"f60t_hourly_profit_ledger:"+hourStart.toISOString()+":USD"
    },
    errors
  });
});