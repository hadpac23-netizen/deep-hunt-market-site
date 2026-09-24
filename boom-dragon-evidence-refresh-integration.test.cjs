const assert=require("node:assert/strict");
const fs=require("fs");
const Engine=require("./boom-dragon-decision-engine.js");
const Refresh=require("./boom-dragon-evidence-refresh.js");

const raw=JSON.parse(fs.readFileSync("dragon-shadow-evidence-snapshot.json","utf8"));
const refresh=Refresh.normalize(raw,{now:Date.parse("2026-09-24T11:00:00Z")});

const card=Engine.assess({
  product:{status:"PREP",stale:true,live:false,generated_at:"2026-09-14T18:42:41Z",blockers:["SNAPSHOT_STALE"],source:"catalog-readiness.json + catalog-index.json"},
  journey:{status:"STALE",stale:true,mode:"SERVER_TRUTH",generated_at:"2026-09-24T10:58:31Z",purchase_truth:{buyer_ready:true}},
  profit:null,
  content:{status:"PREP",generated_at:"2026-09-24T10:58:31Z",counts:{creative_drafts:96},readiness:{winner_eligible:false}},
  refresh,
  launch_gates:refresh.launch_gates
});

assert.equal(card.status,"HOLD");
assert.equal(card.readiness_score,28);
assert.equal(card.confidence,67);
assert.equal(card.confidence_label,"MEDIUM");
assert.equal(card.evidence_refresh.observation_fresh,true);
assert.equal(card.evidence_refresh.product_source_stale,true);
assert.equal(card.evidence_refresh.journey_source_stale,true);
assert.equal(card.evidence_refresh.security_status,"PARTIAL");
assert.equal(card.evidence_refresh.payment_live_enabled,false);
assert.equal(card.hard_gates.blocked,true);
assert.equal(card.next_action.target,"deployment_sync");
assert.equal(card.execution_mode,"SHADOW_ONLY");
assert.equal(card.persisted,false);

console.log("DRAGON Shadow Evidence Refresh regression: PASS");