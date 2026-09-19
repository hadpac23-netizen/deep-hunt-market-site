const assert=require("node:assert");
const E=require("./boom-f50-evidence-engine.js");
const C=require("./boom-f50-research-core.js");
const PA=require("./boom-f50-prior-art.js");
const ME=require("./boom-f50-market-economics.js");
const RT=require("./boom-f50-red-team.js");
const MEM=require("./boom-f50-memory.js");
const {strongCandidate}=require("./boom-f50-test-fixtures.cjs");
const engines={priorArt:PA,economics:ME,redTeam:RT,memory:MEM};

const weak=C.killOrKeep({id:"weak",title:"AI marketplace"},E,engines,[]);
assert.strictEqual(weak.decision,"KILL");
for(const reason of ["hidden_problem_missing","mechanism_missing","payer_missing","economic_primitive_missing","scale_math_missing","novelty_claim_missing","red_team_dimensions_missing","mechanism_primitives_insufficient"]){
  assert(weak.blockers.includes(reason),"missing blocker "+reason);
}

const kept=C.killOrKeep(strongCandidate("core-strong"),E,engines,[]);
assert.strictEqual(kept.decision,"KEEP");
assert.strictEqual(kept.ready,true);
assert.strictEqual(kept.final_claim_allowed,true);
assert.strictEqual(kept.prior_art.state,"PASS");
assert.strictEqual(kept.economics.state,"PASS");
assert.strictEqual(kept.red_team.state,"PASS");
assert.strictEqual(kept.memory.memory_ready,true);

const priorKill=strongCandidate("core-prior");
priorKill.prior_art_evidence=[...priorKill.prior_art_evidence,{surface:"patents",relation:"same_mechanism",source_ref:"patent:exact",verified:true}];
assert.strictEqual(C.killOrKeep(priorKill,E,engines,[]).decision,"KILL");

console.log("boom_f50_research_core=PASS");