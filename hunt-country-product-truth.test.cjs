const assert=require("node:assert/strict");
const Truth=require("./hunt-country-product-truth.js");
const Decision=require("./boom-decision-brain.js");

const now=new Date("2026-09-18T00:00:00Z").getTime();

const good=Truth.evaluate({
  provider:"HyperSKU",
  item_id:"hs-1",
  sku:"SKU-1",
  variant_id:"V-1",
  title:"Test Product",
  images:["https://example.com/p.jpg"],
  warehouse:"EU",
  destination_country:"DE",
  country_supported:true,
  stock:10,
  stock_checked_at:"2026-09-17T23:30:00Z",
  source_checked_at:"2026-09-17T23:30:00Z",
  supplier_cost:10,
  shipping_method:"tracked",
  shipping_cost:4,
  eta_min_days:4,
  eta_max_days:7,
  landed_cost:14,
  retail_price:24
},{now,signals:{relevance:.8,affinity:.7,quality:.9,shipping_score:.9,trust_score:.8,freshness:.9,novelty:.4}});

assert.equal(good.eligible,true);
assert.equal(good.truth_status,"LIVE_VERIFIED");
assert.equal(good.candidate.market_eligible,true);
assert.equal(good.candidate.shipping_eligible,true);
assert.equal(Decision.scoreCandidate(good.candidate,{interactions:30}).eligible,true);

const blocked=Truth.evaluate({
  provider:"HyperSKU",
  item_id:"hs-2",
  sku:"SKU-2",
  title:"Blocked Country",
  images:["https://example.com/p2.jpg"],
  destination_country:"IL",
  country_supported:false,
  stock:5,
  stock_checked_at:"2026-09-17T23:30:00Z",
  source_checked_at:"2026-09-17T23:30:00Z",
  supplier_cost:10,
  shipping_method:"",
  shipping_cost:null,
  landed_cost:null,
  retail_price:25
},{now});

assert.equal(blocked.eligible,false);
assert.ok(blocked.issues.includes("COUNTRY_UNAVAILABLE"));
assert.equal(blocked.candidate.market_eligible,false);
assert.equal(Decision.scoreCandidate(blocked.candidate,{interactions:30}).eligible,false);

const stale=Truth.evaluate({
  provider:"CJdropshipping",
  item_id:"cj-1",
  variant_id:"VID-1",
  title:"Stale Product",
  images:["https://example.com/p3.jpg"],
  destination_country:"US",
  country_supported:true,
  stock:5,
  stock_checked_at:"2026-09-16T00:00:00Z",
  source_checked_at:"2026-09-16T00:00:00Z",
  supplier_cost:8,
  shipping_method:"tracked",
  shipping_cost:4,
  landed_cost:12,
  retail_price:20
},{now,maxAgeMs:6*60*60*1000});

assert.equal(stale.eligible,false);
assert.ok(stale.issues.includes("SOURCE_STALE"));
assert.equal(stale.truth_status,"RECHECK_REQUIRED");

console.log("HUNT Country/Product Truth tests: PASS");
