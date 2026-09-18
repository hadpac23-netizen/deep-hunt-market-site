const assert=require("node:assert/strict");
const fs=require("node:fs");

const registry=JSON.parse(fs.readFileSync("./boom-manager-registry.json","utf8"));
const caps=JSON.parse(fs.readFileSync("./boom-hunt-2037-capabilities.json","utf8"));
const prompt=fs.readFileSync("./skills/boom-master-owner-prompt.md","utf8");
const brain=fs.readFileSync("./skills/boom-hunt-2037-operating-brain.md","utf8");

const ids=registry.managers.map(x=>x.id);
assert.equal(ids.length,new Set(ids).size,"manager ids must be unique");

for(const id of [
  "boom-executive","inventory-truth","supplier-shipping","checkout-payment",
  "decision-intelligence","hunt-worlds-flow","boom-stylist","boom-mirror",
  "creative-brand-factory","experimentation-learning","knowledge-freshness",
  "memory-continuity","share-referral","supplier-hypersku"
]) assert.ok(ids.includes(id),"missing manager "+id);

assert.equal(registry.change_policy.preserve_existing,true);
assert.equal(registry.change_policy.modify_existing_only_when_required,true);
assert.equal(registry.knowledge_policy.volatile_requires_live_verification,true);

for(const c of caps.capabilities){
  assert.ok(ids.includes(c.manager),"unknown manager for capability "+c.id);
  assert.ok(caps.truth_states.includes(c.brain_status),"invalid brain truth state "+c.id);
}
assert.equal(caps.rules.brain_awareness_is_not_activation,true);
assert.equal(caps.rules.production_activation_requires_evidence,true);

for(const id of [
  "hunt-watch","style-watch","look-locker","look-deconstruction",
  "customer-personalization-controls","post-purchase-styling","share-referral",
  "shop-together-foundation","experimentation-learning"
]){
  const cap=caps.capabilities.find(x=>x.id===id);
  assert.ok(cap,"missing B13 capability "+id);
  assert.notEqual(cap.brain_status,"PLANNED","B13 capability must have a source-level brain contract: "+id);
}

assert.match(prompt,/HUNT 2037 Brain Bootstrap/);
assert.match(prompt,/preserve existing approved BOOM Studio managers/);
assert.match(brain,/Non-destructive rule/);
assert.match(brain,/Volatile facts require live verification/);

console.log("BOOM HUNT 2037 brain tests: PASS");
