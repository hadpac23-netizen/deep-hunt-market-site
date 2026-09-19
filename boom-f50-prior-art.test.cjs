const assert=require("node:assert");
const PA=require("./boom-f50-prior-art.js");
const {strongCandidate}=require("./boom-f50-test-fixtures.cjs");

const pass=PA.analyze(strongCandidate("pa-pass"));
assert.strictEqual(pass.state,"PASS");
assert.strictEqual(pass.prior_art_ready,true);
assert.strictEqual(pass.missing_surfaces.length,0);
assert(pass.patent_refs.length>=1);

const killed=strongCandidate("pa-kill");
killed.prior_art_evidence=[...killed.prior_art_evidence,{surface:"patents",relation:"same_mechanism",source_ref:"https://patents.test/exact",verified:true,note:"Same mechanism"}];
const out=PA.analyze(killed);
assert.strictEqual(out.state,"KILL");
assert(out.blockers.includes("same_mechanism_prior_art_found"));

const over=strongCandidate("pa-over",{novelty_scope:"This is a world-first and nothing like this exists."});
assert(PA.analyze(over).blockers.includes("unsupported_global_novelty_claim"));
console.log("boom_f50_prior_art=PASS");