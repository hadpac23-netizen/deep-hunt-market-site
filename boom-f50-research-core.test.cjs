const assert=require("node:assert");
const E=require("./boom-f50-evidence-engine.js");
const C=require("./boom-f50-research-core.js");

const weak=C.killOrKeep({id:"weak",title:"AI marketplace"},E);
assert.strictEqual(weak.decision,"KILL");
for(const reason of ["hidden_problem_missing","mechanism_missing","payer_missing","economic_primitive_missing","scale_math_missing","prior_art_conclusion_missing","red_team_incomplete"]){
  assert(weak.blockers.includes(reason),"missing blocker "+reason);
}

const strong={
  id:"strong-1",title:"Strong mechanism",
  hidden_problem:"A hidden resource is systematically lost because no commercial mechanism captures it.",
  mechanism:"Create a specific non-trivial mechanism that converts the hidden resource into a measurable transaction primitive.",
  payer:"Businesses losing measurable value from the hidden resource.",
  economic_primitive:"NEW_ASSET",
  scale_math:"At 1M verified events/day and $0.10 contribution/event, annualized contribution can be modeled; assumptions remain explicit.",
  prior_art_conclusion:"Products, startups, patents, research, GitHub, legacy industries and alternate names were searched; adjacent systems exist but the mechanism differs.",
  novelty_claim:"Novelty is claimed only at the mechanism-combination level and remains conditional on the cited prior-art search.",
  moat:"Outcome graph compounds from verified cross-party observations that are not available at launch to a copycat.",
  red_team:["regulation","fraud","adoption","technical feasibility","competition"],
  big_tech_copy_risk:"LOW",
  ordinary_category:false,
  mechanism_novelty:true,
  legal_feasibility:true,
  technical_feasibility:true,
  economic_path_plausible:true,
  methods:[...C.METHODS],
  novelty_surfaces:[...E.NOVELTY_SURFACES],
  evidence:[
    {id:"p",kind:"PATENT",ref:"patent:test",claim:"prior art checked",verified:true},
    {id:"r",kind:"ACADEMIC_RESEARCH",ref:"research:test",claim:"technical basis",verified:true},
    {id:"m",kind:"MARKET_DATA",ref:"market:test",claim:"payer/economics basis",verified:true}
  ]
};
const kept=C.killOrKeep(strong,E);
assert.strictEqual(kept.decision,"KEEP");
assert.strictEqual(kept.ready,true);
assert.strictEqual(kept.final_claim_allowed,true);
console.log("boom_f50_research_core=PASS");