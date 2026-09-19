"use strict";
const assert=require("assert");
const F60T=require("./f60t-live-index.js");
const registry=require("./f60t-source-registry.json");
const byId=Object.fromEntries(registry.sources.map(s=>[s.id,s]));
const nowMs=Date.parse("2026-09-19T19:30:00Z");

function base(source_id,observed_at){
  return {
    source_id, observed_at, source_verified:true,
    stock_verified:true, shipping_verified:true,
    attention:.9, velocity:.85, intent:.88, platform_fit:.84,
    region_fit:.82, freshness:.92, confidence:.9,
    commerce_relevance:.9, economics:.86, fulfillment:.9, trust:.94
  };
}

const hot=F60T.evaluate({...base("hunt_first_party","2026-09-19T19:25:00Z"),id:"hot"},byId.hunt_first_party,{nowMs});
assert.equal(hot.status,"ELIGIBLE");
assert.equal(hot.tier,"HOT");
assert.equal(hot.activation_allowed,true);
assert(hot.score>=78);

const research=F60T.evaluate({...base("reddit_data_api","2026-09-19T19:20:00Z"),id:"research"},byId.reddit_data_api,{nowMs});
assert.equal(research.status,"OBSERVE_ONLY");
assert.equal(research.activation_allowed,false);
assert(research.observe_only_reasons.includes("commercial_rights_not_approved"));

const stale=F60T.evaluate({...base("google_trends_trending_now","2026-09-19T17:00:00Z"),id:"stale"},byId.google_trends_trending_now,{nowMs});
assert.equal(stale.status,"KILLED");
assert(stale.reasons.includes("stale_signal"));

const fake=F60T.evaluate({...base("hunt_first_party","2026-09-19T19:29:00Z"),id:"fake",fake_urgency:true},byId.hunt_first_party,{nowMs});
assert.equal(fake.status,"KILLED");
assert(fake.reasons.includes("deceptive_merchandising"));

const cf=F60T.evaluate({...base("cloudflare_radar_http","2026-09-19T19:20:00Z"),id:"cloudflare"},byId.cloudflare_radar_http,{nowMs});
assert.equal(cf.status,"OBSERVE_ONLY");
assert.equal(cf.activation_allowed,false);
assert(cf.observe_only_reasons.includes("commercial_rights_not_approved"));

console.log("F60T Live Index: 5/5 PASS");
