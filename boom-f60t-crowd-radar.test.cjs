const assert=require("node:assert/strict");
const R=require("./boom-f60t-crowd-radar.js");

const empty=R.build({});
assert.equal(empty.ready,false);
assert.equal(empty.status,"OBSERVE");
assert.equal(empty.execute_actions,false);

const radar=R.build({
  localBuyingClockReady:true,
  hotZones:[{
    country_code:"US",platform:"google_search",category:"phone cases",
    event_count:22,intent_score_avg:72,intent_score_max:90,local_hour:20,last_seen:new Date().toISOString()
  }],
  externalTop:[
    {source_key:"pinterest_trends",platform:"pinterest",country_code:"US",category:"phone cases",signal_kind:"PINTEREST_TREND_GROWING",event_count:1,bucket_start:new Date().toISOString(),metadata:{pct_growth_wow:120}},
    {source_key:"pinterest_audience",platform:"pinterest",country_code:"US",category:"phone cases",signal_kind:"PINTEREST_AUDIENCE_AFFINITY",event_count:1,bucket_start:new Date().toISOString()}
  ]
});
assert.equal(radar.ready,true);
assert.equal(radar.top[0].country_code,"US");
assert.equal(radar.top[0].topic,"phone cases");
assert.equal(radar.top[0].first_party_intent,true);
assert.equal(radar.top[0].entry_route.code,"ONSITE_CAPTURE");
assert(radar.top[0].score>=75);
assert.equal(radar.top[0].evidence_semantics,"CONVERGENCE_SCORE_NOT_AUDIENCE_SIZE");

const yt=R.build({
  externalTop:[{
    source_key:"youtube_analytics",platform:"youtube",country_code:"US",category:"YT_SEARCH",
    signal_kind:"YOUTUBE_TRAFFIC_SOURCE",event_count:200,bucket_start:new Date().toISOString(),
    metadata:{traffic_source_type:"YT_SEARCH"}
  }]
});
assert.equal(yt.top[0].entry_route.code,"SEARCH_CAPTURE");
assert.equal(yt.top[0].execute_actions,false);
assert.equal(yt.spam_allowed,false);


const ytFusion=R.build({
  externalTop:[
    {source_key:"youtube_analytics",platform:"youtube",country_code:"DE",category:"__channel_country__",signal_kind:"YOUTUBE_CHANNEL_COUNTRY_VIEWS",event_count:500,bucket_start:new Date().toISOString()},
    {source_key:"youtube_analytics",platform:"youtube",country_code:"",category:"YT_SEARCH",signal_kind:"YOUTUBE_TRAFFIC_SOURCE",event_count:300,bucket_start:new Date().toISOString(),metadata:{traffic_source_type:"YT_SEARCH"}}
  ]
});
const germany=ytFusion.opportunities.find(x=>x.country_code==="DE");
assert(germany);
assert.equal(germany.traffic_route_signal,true);
assert.equal(germany.entry_route.code,"SEARCH_CAPTURE");
assert(germany.fused_support_count>=1);

console.log("boom_f60t_crowd_radar=PASS");