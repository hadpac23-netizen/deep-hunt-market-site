const fs=require("fs"),assert=require("node:assert/strict");
const R=require("./boom-dragon-fusion-registry.js");
const reg=JSON.parse(fs.readFileSync("boom-dragon-fusion-registry.json","utf8"));
const s=R.summarize(reg);
assert.equal(reg.schema,"BOOM_DRAGON_FUSION_REGISTRY_V1");
assert.equal(reg.brains.length,8);
assert.equal(s.mapped,true);
assert.equal(s.invalidOwners.length,0);
assert.equal(s.duplicateIds.length,0);
for(const id of [
  "a1_product_truth","a6_creative_learning","a7_a8_harness","a12_final_gate",
  "f35","f50","f60t","incident_repair","creator_os","lifecycle_brain",
  "product_live_refresh","product_detail_shadow","order_profit_truth",
  "customer_journey_truth","content_feedback","decision_engine","evidence_refresh"
])assert(reg.capabilities.some(x=>x.id===id),id+" missing");
for(const view of ["owner-home","studio","dragon-control-room","hunt-intelligence","professional-workbench","brand-factory","connect","executions","evaluations","learning"])
  assert(reg.views.some(x=>x.id===view),view+" view missing");
assert(reg.doctrine.anti_duplication.includes("ONE_RUNTIME_CLIENT"));
console.log("BOOM DRAGON Fusion Registry contract: PASS");