const fs=require("node:fs");
const assert=require("node:assert/strict");

const html=fs.readFileSync("boom-growth-os.html","utf8");
const js=fs.readFileSync("boom-growth-os.js","utf8");

for(const token of [
  "F60T · ימ״מ GLOBAL PROFIT COMMAND",
  "$10K VERIFIED NET / HOUR",
  'id="bg-f60t-state"',
  'id="bg-f60t-stats"',
  'id="bg-f60t-mission"',
  'id="bg-f60t-gates"',
  'id="bg-f60t-connect-pinterest"',
  'id="bg-f60t-connect-youtube"',
  'id="bg-f60t-connect-status"',
  'id="bg-f60t-radar"',
  'id="bg-f60t-radar-state"',
  'boom-f60t-core.js?v=f60t1',
  'boom-f60t-live-adapter.js?v=f60tl2',
  'boom-f60t-crowd-radar.js?v=f60tr1',
  'boom-growth-os.js?v=os41'
]) assert(html.includes(token),"F60T Studio HTML missing: "+token);

assert(!html.includes("$10K+ NET/DAY MODEL"),"Legacy $10K/day panel still visible");
assert(!html.includes('id="bg-milestones"'),"Legacy milestone container still visible");

for(const token of [
  "async function ownerFunction(slug, options = {})",
  'ownerFunction("hunt-f60t-snapshot",{method:"POST",body:{source:"BOOM_STUDIO"}})',
  'ownerFunction("hunt-f60t-oauth",{method:"POST",body:{action:"status"}})',
  "async function startF60TOAuth(provider)",
  'body:{action:"start",provider}',
  "function renderF60TOAuth(data={})",
  "CONFIG REQUIRED",
  "oauth_providers:Array.isArray(f60tOauthRes?.providers)?f60tOauthRes.providers:[]",
  "const F60TCore=window.BoomF60TCore",
  "const F60TLive=window.BoomF60TLiveAdapter",
  "const F60TCrowdRadar=window.BoomF60TCrowdRadar",
  "crowd_radar:crowdRadar",
  "crowd_radar_ready:crowdRadar.ready===true",
  "function renderF60TCrowdRadar(data={})",
  "renderF60TCrowdRadar(data)",
  "Crowd convergence radar",
  "mission_replaces_daily_10k:true",
  "function renderF60T(data={})",
  "renderF60T(data)",
  '["F60T","YAMAM Global Profit Command","BoomF60TCore","PANEL"]',
  "realized:f60tLive.realized",
  "crowd_signals_ready:f60tLive.crowd_signals_ready===true",
  "local_buying_clock_ready:f60tLive.local_buying_clock_ready===true",
  "live_hourly_profit_ledger_ready:Boolean(f60tLive.hourly_profit?.hour_start)",
  "external_signal_rows:Number(f60tLive.external_signal_rows||0)",
  "agent_signal_events:Number(f60tLive.agent_events_verified||0)",
  "External official rows",
  "External platform status",
  "Top external signal",
  "no_fake_success:true"
]) assert(js.includes(token),"F60T Studio JS missing: "+token);

assert(!js.includes("renderMilestones(plan.milestones)"),"Legacy daily milestone rendering still active");

console.log("boom_f60t_studio=PASS");
