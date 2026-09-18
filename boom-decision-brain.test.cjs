const assert=require("node:assert/strict");
const Brain=require("./boom-decision-brain.js");

const base={
  truth_status:"verified",
  safety_eligible:true,
  market_eligible:true,
  shipping_eligible:true,
  stock_available:true,
  image_verified:true,
  relevance:.7,affinity:.6,quality:.9,shipping_score:.8,trust_score:.8,
  freshness:.7,novelty:.6,creative_performance:.5,margin_ratio:.2
};

assert.equal(Brain.modeFor({interactions:0}),"cold_start");
assert.equal(Brain.modeFor({interactions:8}),"learning");
assert.equal(Brain.modeFor({interactions:30}),"personalized");

const blocked=Brain.scoreCandidate({...base,market_eligible:false},{},0);
assert.equal(blocked.eligible,false);
assert.ok(blocked.reasons.includes("market_ineligible"));

const relevant=Brain.scoreCandidate({...base,relevance:.95,affinity:.9,margin_ratio:.12},{interactions:50},0);
const marginOnly=Brain.scoreCandidate({...base,relevance:.15,affinity:.1,margin_ratio:.8},{interactions:50},0);
assert.ok(relevant.score>marginOnly.score,"relevance/taste must beat margin-only ranking");

const repeat=Brain.scoreCandidate({...base,product_key:"p1",category:"bags",supplier:"HyperSKU"},
  {interactions:50,recent_product_keys:["p1"],recent_categories:["bags"],recent_suppliers:["HyperSKU"]},0);
const fresh=Brain.scoreCandidate({...base,product_key:"p2",category:"jewelry",supplier:"CJdropshipping"},
  {interactions:50,recent_product_keys:["p1"],recent_categories:["bags"],recent_suppliers:["HyperSKU"]},0);
assert.ok(fresh.score>repeat.score,"repetition fatigue should lower score");

const wildcard=Brain.scoreCandidate({...base,affinity:.1,novelty:1,quality:.95,discovery_lane:"wildcard"},{interactions:50},0);
assert.equal(wildcard.eligible,true);
assert.equal(wildcard.lane,"wildcard");

const stale=Brain.scoreCandidate({...base,truth_status:"RECHECK_REQUIRED"},{},0);
assert.equal(stale.eligible,false);

const ranked=Brain.rankCandidates([
  {...base,product_key:"a",relevance:.9,affinity:.9},
  {...base,product_key:"b",relevance:.3,affinity:.2}
],{interactions:50});
assert.equal(ranked[0].candidate.product_key,"a");

console.log("BOOM Decision Brain tests: PASS");
