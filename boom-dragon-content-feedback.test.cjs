const assert=require("node:assert/strict");
const Feedback=require("./boom-dragon-content-feedback.js");
assert.equal(Feedback.distributionIdentity("d3af03a4-9e51-434a-915d-1e4bb0a2902c"),"creative:d3af03a4-9e51-434a-915d-1e4bb0a2902c");
assert.equal(Feedback.canonicalCreativeKey("1582554080420048896"),"");
const x=Feedback.normalize({
  status:"PREP",
  counts:{creative_drafts:96,distribution_drafts:96,distribution_published:0},
  readiness:{winner_eligible:false},
  blockers:["NO_PUBLISHED_DISTRIBUTION"],
  rules:{revenue_only_winner:false}
});
assert.equal(x.counts.creative_drafts,96);
assert.equal(x.readiness.winner_eligible,false);
assert.equal(x.rules.revenue_only_winner,false);
console.log("DRAGON Content Feedback adapter tests: PASS");