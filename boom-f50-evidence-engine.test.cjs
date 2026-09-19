const assert=require("node:assert");
const E=require("./boom-f50-evidence-engine.js");

const weak=E.inspectCandidate({
  evidence:[{id:"e1",kind:"BLOG",ref:"https://example.com",claim:"x",verified:true}],
  novelty_surfaces:["products"]
});
assert.strictEqual(weak.evidence_ready,false);
assert(weak.blockers.includes("insufficient_verified_evidence"));
assert(weak.blockers.includes("prior_art_surface_gaps"));

const surfaces=[...E.NOVELTY_SURFACES];
const strong=E.inspectCandidate({
  evidence:[
    {id:"e1",kind:"PATENT",ref:"US-TEST",claim:"prior art checked",verified:true,independent:true},
    {id:"e2",kind:"ACADEMIC_RESEARCH",ref:"doi:test",claim:"mechanism feasibility",verified:true,independent:true},
    {id:"e3",kind:"MARKET_DATA",ref:"market:test",claim:"economic demand",verified:true,independent:true}
  ],
  novelty_surfaces:surfaces
});
assert.strictEqual(strong.evidence_ready,true);
assert.strictEqual(strong.usable_count,3);
assert.strictEqual(strong.independent_count,3);
assert.deepStrictEqual(strong.missing_novelty_surfaces,[]);
console.log("boom_f50_evidence_engine=PASS");