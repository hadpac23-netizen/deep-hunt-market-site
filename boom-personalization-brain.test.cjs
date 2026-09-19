const assert=require("node:assert");
const P=require("./boom-personalization-brain.js");

const safe=P.sanitizeProfile({
  explicit_categories:["women","tech"],
  category_affinity:{women:80,tech:40},
  health:"blocked",religion:"blocked",
  reduced_personalization:false
});
assert.deepStrictEqual(safe.explicit_categories,["women","tech"]);
assert.deepStrictEqual([...safe.rejected_sensitive_fields].sort(),["health","religion"]);

const ready=P.readiness({
  preference_controls_ready:true,reset_controls_ready:true,
  recommendation_impression_tracking_ready:true,outcome_tracking_ready:true,
  holdout_ready:true,market_eligibility_ready:true,product_truth_ready:true,privacy_contract_ready:true
});
assert.strictEqual(ready.state,"MEASURE");
assert.strictEqual(ready.ranking_enabled,false);
assert.strictEqual(ready.execute,false);

const products=[
  {item_id:"a",category:"women",provider:"s1",retail_price_verified:true,profit_gate_status:"PASS",availability_verified:true,market_eligible:true},
  {item_id:"b",category:"women",provider:"s1",retail_price_verified:true,profit_gate_status:"PASS",market_eligible:true},
  {item_id:"c",category:"tech",provider:"s2",retail_price_verified:true,profit_gate_status:"PASS",market_eligible:true},
  {item_id:"d",category:"home",provider:"s3",retail_price_verified:true,profit_gate_status:"PASS",market_eligible:true},
  {item_id:"e",category:"women",provider:"s4",market_eligible:false}
];
const ranked=P.rank(products,safe,{limit:4,max_per_category:2,max_per_supplier:2,require_verified_truth:true,exploration_share:0});
assert.strictEqual(ranked.items.length,4);
assert.strictEqual(ranked.items[0].item.item_id,"a");
assert(!ranked.items.some(x=>x.item.item_id==="e"));

const reduced=P.score(products[0],{explicit_categories:["women"],reduced_personalization:true},{require_verified_truth:true});
assert.strictEqual(reduced.personalized,false);
assert(!reduced.reasons.includes("explicit_preference"));

console.log("boom_personalization_brain=PASS");