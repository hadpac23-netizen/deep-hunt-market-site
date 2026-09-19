(() => {
  "use strict";

  const VERSION="2026-09-19-f60t-radar1";
  const clamp=(n,min=0,max=100)=>Math.max(min,Math.min(max,Number(n)||0));
  const clean=(v,n=120)=>String(v??"").replace(/[\r\n\t]+/g," ").replace(/\s+/g," ").trim().slice(0,n);
  const lower=(v)=>clean(v).toLowerCase();

  const ENTRY_ROUTES=Object.freeze({
    FIRST_PARTY_INTENT:Object.freeze({
      code:"ONSITE_CAPTURE",
      label:"Onsite capture",
      action:"Prioritize matching products, collections and recommendations inside HUNT for this market. Keep price changes owner-gated.",
      action_type:"onsite_merchandising"
    }),
    PINTEREST_TREND_GROWING:Object.freeze({
      code:"PINTEREST_TREND_CONTENT",
      label:"Pinterest trend content",
      action:"Prepare trend-aligned Pins and a matching HUNT collection/landing page. Publish only through an approved channel and never fake urgency.",
      action_type:"organic_creative_test"
    }),
    PINTEREST_AUDIENCE_AFFINITY:Object.freeze({
      code:"PINTEREST_AFFINITY_COLLECTION",
      label:"Pinterest affinity collection",
      action:"Shape an organic collection and creative angle around the verified affinity. Treat affinity as interest, not purchase intent.",
      action_type:"organic_creative_test"
    }),
    PINTEREST_AUDIENCE_COUNTRY:Object.freeze({
      code:"PINTEREST_GEO_FOCUS",
      label:"Pinterest geo focus",
      action:"Use the verified country distribution to localize organic creative and collection copy. Do not infer buying intent from audience share alone.",
      action_type:"organic_creative_test"
    }),
    YOUTUBE_CHANNEL_COUNTRY_VIEWS:Object.freeze({
      code:"YOUTUBE_GEO_CONTENT",
      label:"YouTube geo content",
      action:"Prepare country-relevant video concepts and HUNT landing content. Views are attention evidence, not purchase intent.",
      action_type:"organic_creative_test"
    }),
    YOUTUBE_TRAFFIC_SOURCE:Object.freeze({
      code:"YOUTUBE_TRAFFIC_ROUTE",
      label:"YouTube traffic route",
      action:"Match the content plan to the verified traffic source: search intent, related-content discovery, external referral or subscriber discovery.",
      action_type:"organic_creative_test"
    }),
    REDDIT_COMMUNITY_ACTIVITY:Object.freeze({
      code:"COMMUNITY_ANSWER_FIRST",
      label:"Community answer-first",
      action:"Participate only where rules allow, answer the community need first, disclose affiliation when relevant, and avoid spam or fake accounts.",
      action_type:"research"
    })
  });

  function recencyPoints(bucketStart){
    const t=Date.parse(String(bucketStart||""));
    if(!Number.isFinite(t))return 0;
    const ageH=Math.max(0,(Date.now()-t)/3600000);
    if(ageH<=2)return 10;
    if(ageH<=12)return 6;
    if(ageH<=24)return 3;
    return 0;
  }

  function topicOf(row={}){
    const category=clean(row.category,120);
    const meta=row.metadata&&typeof row.metadata==="object"?row.metadata:{};
    return category||clean(meta.keyword,120)||clean(row.signal_kind,120)||"general";
  }

  function normalizedSignal(row={}, origin="external"){
    return Object.freeze({
      origin,
      source_key:clean(row.source_key||origin,80),
      platform:lower(row.platform||row.source_key||origin),
      country_code:clean(row.country_code||row.country,12).toUpperCase(),
      category:topicOf(row).toLowerCase(),
      audience:clean(row.audience,80),
      signal_kind:clean(row.signal_kind||"FIRST_PARTY_INTENT",80),
      event_count:Math.max(0,Number(row.event_count||0)),
      intent_score_avg:Number.isFinite(Number(row.intent_score_avg))?Number(row.intent_score_avg):null,
      intent_score_max:Number.isFinite(Number(row.intent_score_max))?Number(row.intent_score_max):null,
      local_hour:row.local_hour==null?null:Number(row.local_hour),
      bucket_start:clean(row.bucket_start||row.last_seen,80),
      metadata:row.metadata&&typeof row.metadata==="object"?row.metadata:{},
      evidence_ref:clean(row.evidence_ref,400)
    });
  }

  function keyFor(row={}){
    const country=row.country_code||"GLOBAL";
    const topic=row.category&&row.category!=="__channel_country__"&&row.category!=="__audience_country__"
      ? row.category
      : "general";
    return [country,topic].join("|");
  }

  function trafficRoute(signal={}){
    const raw=clean(signal.metadata?.traffic_source_type||signal.category,80).toUpperCase();
    if(raw.includes("YT_SEARCH")||raw.includes("SEARCH"))return {
      code:"SEARCH_CAPTURE",
      label:"Search capture",
      action:"Prepare search-aligned video topics, titles and HUNT landing pages around the proven query/theme. No keyword stuffing."
    };
    if(raw.includes("RELATED")||raw.includes("SUGGESTED"))return {
      code:"RELATED_CONTENT_BRIDGE",
      label:"Related-content bridge",
      action:"Create genuinely adjacent comparison/demo content that can earn related-video discovery. Do not imitate or misrepresent another creator."
    };
    if(raw.includes("EXT_URL")||raw.includes("EXTERNAL"))return {
      code:"EXTERNAL_REFERRAL_BRIDGE",
      label:"External referral bridge",
      action:"Identify the legitimate external referral class and prepare matching owned/partner content. Any partnership or payment remains owner-gated."
    };
    if(raw.includes("SUBSCRIBER")||raw.includes("NOTIFICATION"))return {
      code:"AUDIENCE_RETENTION",
      label:"Audience retention",
      action:"Use the signal to strengthen owned-channel sequencing and follow-up content. Do not treat subscriber attention as a purchase."
    };
    return ENTRY_ROUTES.YOUTUBE_TRAFFIC_SOURCE;
  }

  function supportSignals(groupRows=[],allSignals=[]){
    const platforms=new Set(groupRows.map(x=>x.platform).filter(Boolean));
    const topics=new Set(groupRows.map(x=>x.category).filter(x=>x&&x!=="general"&&!x.startsWith("__")));
    const existing=new Set(groupRows.map(x=>[x.source_key,x.signal_kind,x.country_code,x.category].join("|")));
    const support=[];
    for(const row of allSignals){
      const id=[row.source_key,row.signal_kind,row.country_code,row.category].join("|");
      if(existing.has(id))continue;
      if(!platforms.has(row.platform))continue;
      if(row.signal_kind==="YOUTUBE_TRAFFIC_SOURCE"){
        support.push(row);
        continue;
      }
      if(row.signal_kind==="PINTEREST_AUDIENCE_AFFINITY"&&(topics.has(row.category)||!topics.size)){
        support.push(row);
        continue;
      }
      if(row.signal_kind==="PINTEREST_AUDIENCE_COUNTRY"){
        const groupCountry=groupRows.find(x=>x.country_code)?.country_code||"";
        if(!row.country_code||row.country_code===groupCountry)support.push(row);
      }
    }
    return support.slice(0,6);
  }

  function routeFor(signals=[]){
    const firstParty=signals.find(x=>x.origin==="first_party"&&(x.intent_score_max||0)>0);
    if(firstParty)return ENTRY_ROUTES.FIRST_PARTY_INTENT;
    const ytTraffic=signals.find(x=>x.signal_kind==="YOUTUBE_TRAFFIC_SOURCE");
    if(ytTraffic)return trafficRoute(ytTraffic);
    const preferred=[
      "PINTEREST_TREND_GROWING",
      "PINTEREST_AUDIENCE_AFFINITY",
      "YOUTUBE_CHANNEL_COUNTRY_VIEWS",
      "PINTEREST_AUDIENCE_COUNTRY",
      "REDDIT_COMMUNITY_ACTIVITY"
    ];
    for(const kind of preferred){
      const hit=signals.find(x=>x.signal_kind===kind);
      if(hit&&ENTRY_ROUTES[kind])return ENTRY_ROUTES[kind];
    }
    return Object.freeze({
      code:"OBSERVE_ONLY",
      label:"Observe only",
      action:"Keep collecting verified signals. Do not enter a channel from one weak or ambiguous signal.",
      action_type:"research"
    });
  }

  function build({hotZones=[],externalTop=[],localBuyingClockReady=false}={}){
    const signals=[
      ...(Array.isArray(hotZones)?hotZones:[]).map(x=>normalizedSignal({...x,signal_kind:"FIRST_PARTY_INTENT",source_key:"hunt_first_party"},"first_party")),
      ...(Array.isArray(externalTop)?externalTop:[]).map(x=>normalizedSignal(x,"external"))
    ];
    const grouped=new Map();
    for(const s of signals){
      const key=keyFor(s);
      const arr=grouped.get(key)||[];
      arr.push(s);
      grouped.set(key,arr);
    }

    const opportunities=[];
    for(const [key,rows] of grouped){
      const fused=[...rows,...supportSignals(rows,signals)];
      const sources=new Set(fused.map(x=>x.source_key).filter(Boolean));
      const kinds=new Set(fused.map(x=>x.signal_kind).filter(Boolean));
      const firstParty=fused.some(x=>x.origin==="first_party"&&(x.intent_score_max||0)>0);
      const trend=fused.some(x=>x.signal_kind==="PINTEREST_TREND_GROWING");
      const affinity=fused.some(x=>x.signal_kind==="PINTEREST_AUDIENCE_AFFINITY");
      const traffic=fused.some(x=>x.signal_kind==="YOUTUBE_TRAFFIC_SOURCE");
      const geo=rows.some(x=>x.country_code);
      const fresh=Math.max(...fused.map(x=>recencyPoints(x.bucket_start)),0);
      let score=0;
      if(firstParty)score+=40;
      if(trend)score+=18;
      if(affinity)score+=12;
      if(traffic)score+=12;
      if(geo)score+=5;
      score+=Math.min(8,Math.max(0,sources.size-1)*4);
      score+=fresh;
      if(localBuyingClockReady&&rows.some(x=>x.local_hour!=null))score+=5;
      score=clamp(score);

      const route=routeFor(fused);
      const [country,topic]=key.split("|");
      const confidence=score>=75?"HIGH":score>=50?"MEDIUM":score>=30?"LOW":"OBSERVE";
      opportunities.push(Object.freeze({
        country_code:country==="GLOBAL"?"":country,
        topic:topic==="general"?"":topic,
        score,
        confidence,
        source_count:sources.size,
        source_keys:Object.freeze([...sources]),
        signal_kinds:Object.freeze([...kinds]),
        fused_support_count:Math.max(0,fused.length-rows.length),
        first_party_intent:firstParty,
        trend_velocity_signal:trend,
        audience_affinity_signal:affinity,
        traffic_route_signal:traffic,
        local_time_evidence:localBuyingClockReady&&rows.some(x=>x.local_hour!=null),
        entry_route:Object.freeze(route),
        evidence_semantics:"CONVERGENCE_SCORE_NOT_AUDIENCE_SIZE",
        execute_actions:false,
        external_publish:false,
        paid_spend:false,
        live_price_write:false,
        owner_gate:route.action_type==="research"||route.action_type==="onsite_merchandising"||route.action_type==="organic_creative_test"
          ?"GREEN_RECOMMENDATION_ONLY"
          :"YELLOW_OWNER_REVIEW"
      }));
    }

    opportunities.sort((a,b)=>b.score-a.score||b.source_count-a.source_count);
    const strong=opportunities.filter(x=>x.score>=50);
    return Object.freeze({
      version:VERSION,
      ready:strong.length>0,
      status:strong.length?"ENTRY_WINDOWS_FOUND":"OBSERVE",
      methodology:"Evidence convergence across verified first-party intent, official trend/audience/viewership/traffic signals and local-time evidence.",
      score_semantics:"CONVERGENCE_SCORE_NOT_AUDIENCE_SIZE",
      opportunities:Object.freeze(opportunities.slice(0,12)),
      top:Object.freeze(opportunities.slice(0,5)),
      external_publish:false,
      paid_spend:false,
      execute_actions:false,
      deception_allowed:false,
      spam_allowed:false
    });
  }

  const api=Object.freeze({VERSION,ENTRY_ROUTES,build,routeFor,supportSignals});
  if(typeof window!=="undefined")window.BoomF60TCrowdRadar=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();