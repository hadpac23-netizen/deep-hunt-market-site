const assert=require("node:assert");
const F=require("./boom-claim-firewall.js");

const bad=F.inspectDraft({
  hook:"The #1 waterproof case",
  headline:"Fits all phones",
  body:"Delivery tomorrow. Limited stock. Free shipping.",
  cta:"Buy now"
},{verified_facts:["brand: Example"]});
assert.strictEqual(bad.pass,false);
for(const code of [
  "hook:waterproof_claim",
  "hook:popularity_claim",
  "headline:universal_fit_claim",
  "body:delivery_promise",
  "body:scarcity_claim",
  "body:free_shipping_claim"
]) assert(bad.violations.includes(code),"Missing firewall violation "+code);

const supported=F.inspectDraft({
  headline:"Waterproof pouch",
  body:"Waterproof rating is source verified."
},{verified_facts:["waterproof","brand: Example"]});
assert.strictEqual(supported.pass,true);

const discount=F.inspectDraft({body:"20% verified price drop"},{verified_facts:["discount"]});
assert.strictEqual(discount.pass,true);

const noEvidence=F.inspectDraft({body:"20% off today"},{verified_facts:[]});
assert.strictEqual(noEvidence.pass,false);
assert(noEvidence.violations.includes("body:discount_claim"));

const safe=F.sanitizeDraft({headline:"Example phone case",body:"Brand: Example. Check exact product details."},{verified_facts:["brand: Example"]});
assert.strictEqual(safe.claim_firewall.pass,true);
assert.strictEqual(safe.publish_ready,false);
assert.strictEqual(safe.owner_gate,"REVIEW_REQUIRED");
console.log("boom_claim_firewall=PASS",JSON.stringify({bad:bad.violations}));
