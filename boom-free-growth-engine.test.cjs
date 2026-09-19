const assert=require("node:assert");
const G=require("./boom-free-growth-engine.js");

const base=G.build({
  plan:{funnel:{sessions:10}},
  data:{passportSummary:{channels:{}},creatorSystem:{state:"HOLD"}},
  marketing:{eligibleDeals:0},
  seo_score:55,
  crawlable_urls_ready:true,
  structured_data_ready:true,
  search_console_ready:false,
  sharing:{share_ready:true,attribution_ready:false,reward_economics_ready:false},
  localization:{language_ready:true,currency_ready:true,shipping_truth_ready:false},
  measurement:{earned_attribution_ready:false}
});
assert.strictEqual(base.paid_spend,false);
assert.strictEqual(base.external_publish,false);
assert.strictEqual(base.execute_actions,false);
assert(base.opportunities.some(x=>x.channel==="technical_seo"));
assert(base.primary);

const ready=G.build({
  plan:{funnel:{sessions:50}},
  data:{
    passportSummary:{channels:{
      google_free_listings:{data_ready:5,ready:5},
      organic_social:{data_ready:5,ready:5}
    }},
    creatorSystem:{state:"PREPARE"}
  },
  marketing:{eligibleDeals:3},
  seo_score:80,
  crawlable_urls_ready:true,structured_data_ready:true,search_console_ready:true,
  sharing:{share_ready:true,attribution_ready:true,reward_economics_ready:true},
  localization:{language_ready:true,currency_ready:true,shipping_truth_ready:true},
  measurement:{earned_attribution_ready:true}
});
assert(ready.organic_test_candidates>=5);
assert.strictEqual(ready.primary.state,"TEST_CANDIDATE");
assert.strictEqual(G.VERSION,"2026-09-19-v1");
console.log("boom_free_growth_engine=PASS");