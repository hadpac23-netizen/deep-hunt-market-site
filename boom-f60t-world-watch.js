(() => {
  "use strict";

  const VERSION="2026-09-19-f60t-worldwatch1";
  const RADARS=Object.freeze([
    "SEARCH_RADAR",
    "SOCIAL_DISCOVERY_RADAR",
    "COMMUNITY_RADAR",
    "CREATOR_LIVE_RADAR",
    "AGENT_RADAR"
  ]);

  const PLATFORM_ROLES=Object.freeze({
    google_search:{role:"HIGH_INTENT_DEMAND_CAPTURE",first:"ANSWER_PRODUCT_PRICE_SHIPPING_AVAILABILITY",route:"SEARCH_CAPTURE"},
    google_shopping:{role:"TRANSACTIONAL_PRODUCT_DISCOVERY",first:"PRODUCT_IMAGE_PRICE_DELIVERY_VARIANT",route:"PRODUCT_TRUTH_FEED"},
    ai_agents:{role:"DELEGATED_BUYING_DECISION",first:"STRUCTURED_PRODUCT_TRUTH_COMPARISON",route:"AGENT_COMMERCE"},
    tiktok:{role:"FAST_DISCOVERY_SEARCH_CREATOR",first:"HOOK_DEMO_PROBLEM_SOLUTION",route:"NATIVE_DISCOVERY_CAPTURE"},
    instagram:{role:"VISUAL_DISCOVERY_CREATOR",first:"VISUAL_LIFESTYLE_REEL",route:"REEL_TO_PRODUCT"},
    facebook:{role:"COMMUNITY_REELS_MESSAGING",first:"UTILITY_TRUST_COMMUNITY_RELEVANCE",route:"COMMUNITY_TO_CONVERSATION"},
    youtube:{role:"RESEARCH_SEARCH_COMPARISON",first:"ANSWER_COMPARISON_DEMO",route:"SEARCH_OR_RELATED_CAPTURE"},
    pinterest:{role:"PLANNING_VISUAL_SEARCH",first:"INSPIRATION_COLLECTION_USE_CASE",route:"TREND_OR_AFFINITY_CAPTURE"},
    reddit:{role:"VALIDATION_COMPARISON_TRUST",first:"HELPFUL_ANSWER_EVIDENCE",route:"COMMUNITY_ANSWER_FIRST"},
    threads:{role:"TOPIC_COMMUNITY_CONVERSATION",first:"DISCUSSION_INSIGHT_SOLUTION",route:"TOPIC_CONVERSATION_CAPTURE"},
    x:{role:"REAL_TIME_MOMENT",first:"TIMELY_INFORMATION_COMPARISON",route:"MOMENT_CAPTURE"},
    snapchat:{role:"YOUTH_CREATOR_AR_DISCOVERY",first:"VISUAL_DEMO_CREATOR_UTILITY",route:"CREATOR_VISUAL_DISCOVERY"},
    telegram:{role:"CHANNEL_BOT_MINIAPP",first:"UTILITY_FEED_COMMUNITY_VALUE",route:"CHANNEL_BOT_MINIAPP"},
    discord:{role:"DEEP_INTEREST_COMMUNITY",first:"UTILITY_EXPERTISE_COMMUNITY_VALUE",route:"COMMUNITY_FIRST"},
    twitch:{role:"LIVE_CREATOR_COMMUNITY",first:"DEMO_CREATOR_INTEGRATION",route:"CREATOR_CATEGORY_FIT"},
    linkedin:{role:"PROFESSIONAL_PREMIUM_B2B",first:"PROFESSIONAL_VALUE_PREMIUM_PROOF",route:"PROFESSIONAL_PREMIUM_B2B"}
  });

  const SKILLS=Object.freeze([
    "F60T-23 GLOBAL_HUMAN_RADAR",
    "F60T-24 PLATFORM_POPULATION_BRAIN",
    "F60T-25 AUDIENCE_SPLITTER",
    "F60T-26 FIRST_THING_ENGINE",
    "F60T-27 CROWD_CONVERGENCE",
    "F60T-28 ENTRY_WINDOW",
    "F60T-29 ENTRY_ROUTER",
    "F60T-30 PLATFORM_CONTENT_ROUTER",
    "F60T-31 FOLLOW_THE_SUN_RADAR",
    "F60T-32 CREATOR_CROWD_RADAR",
    "F60T-33 COMMUNITY_RADAR",
    "F60T-34 SEARCH_INTENT_RADAR",
    "F60T-35 AGENT_CROWD_RADAR",
    "F60T-36 PROFIT_PRESERVATION",
    "F60T-37 PRICE_PRESSURE",
    "F60T-38 GLOBAL_OPPORTUNITY_ROUTER",
    "F60T-39 ALWAYS_ON_MEMORY",
    "F60T-40 WORLD_WATCH_COMMANDER"
  ]);

  const CYCLE=Object.freeze([
    "SCAN_WORLD","MAP_CROWD","MAP_INTENT","MAP_LOCAL_TIME","SEGMENT_AUDIENCE",
    "MAP_PLATFORM","CHOOSE_FIRST_THING","CHOOSE_ENTRY_ROUTE","CHECK_PROFIT",
    "CHECK_OWNER_GATE","EXECUTE_PREPARE_HOLD","VERIFY","LEARN","MOVE"
  ]);

  function platformPlan(platform){
    const key=String(platform||"").trim().toLowerCase();
    return PLATFORM_ROLES[key]||Object.freeze({
      role:"WATCH_ONLY",
      first:"COLLECT_EVIDENCE",
      route:"OBSERVE_ONLY"
    });
  }

  function entryWindow({convergenceScore=0,profitReady=false,localTimeReady=false,productFit=false}={}){
    const score=Number(convergenceScore)||0;
    if(score>=75&&profitReady&&localTimeReady&&productFit)return "ENTRY_WINDOW";
    if(score>=50&&productFit)return "PREPARE";
    if(score>=30)return "WATCH";
    return "OBSERVE";
  }

  const api=Object.freeze({
    VERSION,RADARS,PLATFORM_ROLES,SKILLS,CYCLE,
    always_on:true,
    target_net_per_hour:10000,
    target_is_guarantee:false,
    profit_truth_required:true,
    owner_gate_required:true,
    spam_allowed:false,
    deception_allowed:false,
    external_publish:false,
    paid_spend:false,
    live_price_write:false,
    platformPlan,entryWindow
  });

  if(typeof window!=="undefined")window.BoomF60TWorldWatch=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();