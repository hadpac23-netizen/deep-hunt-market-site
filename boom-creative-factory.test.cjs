const assert=require("node:assert");
const Firewall=require("./boom-claim-firewall.js");
global.BoomClaimFirewall=Firewall;
const Factory=require("./boom-creative-factory.js");

const passport={
  passport_id:"hunt:CJ:1",
  product_key:"CJ:1",
  identity:{title:"Magnetic Lens Phone Case"},
  truth:{
    safe_category:true,
    price:{verified:true,amount:19.99,currency:"USD"}
  },
  creative_inputs:{
    verified_facts:["verified retail price","brand: Example","model: iPhone 15"],
    image_ready:true
  }
};

const control={onsite_state:"ACTIVE",external_state:"HOLD"};
const gate=Factory.candidate({passport,control});
assert.strictEqual(gate.ready,true);
const result=Factory.build({passport,control,firewall:Firewall});
assert.strictEqual(result.draft_count,5);
assert.strictEqual(result.safe_draft_count,5);
assert.strictEqual(result.blocked_draft_count,0);
assert.strictEqual(result.external_publish,false);
assert(result.video_brief);
assert.strictEqual(result.video_brief.claim_firewall.pass,true);
for(const draft of result.drafts){
  assert.strictEqual(draft.publish_ready,false);
  assert.strictEqual(draft.owner_gate,"REVIEW_REQUIRED");
  assert.strictEqual(draft.verified_product_relation,true);
  assert(draft.source_facts.length>0);
}

const stopped=Factory.build({
  passport,
  control:{onsite_state:"STOP",external_state:"STOP"},
  firewall:Firewall
});
assert.strictEqual(stopped.candidate.ready,false);
assert.strictEqual(stopped.draft_count,0);

const noFacts=Factory.build({
  passport:{...passport,creative_inputs:{verified_facts:[],image_ready:true}},
  control:{onsite_state:"ACTIVE",external_state:"HOLD"},
  firewall:Firewall
});
assert.strictEqual(noFacts.candidate.ready,false);
assert(noFacts.candidate.reasons.includes("verified_creative_fact_missing"));

const batch=Factory.buildBatch([
  {passport,control,firewall:Firewall},
  {passport,control:{onsite_state:"STOP",external_state:"STOP"},firewall:Firewall}
]);
assert.strictEqual(batch.total,2);
assert.strictEqual(batch.candidates,1);
assert.strictEqual(batch.safe_drafts,5);
assert.strictEqual(batch.external_publish,false);

console.log("boom_creative_factory=PASS",JSON.stringify({
  candidates:batch.candidates,
  safe_drafts:batch.safe_drafts
}));
