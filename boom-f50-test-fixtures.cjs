const E=require("./boom-f50-evidence-engine.js");
const C=require("./boom-f50-research-core.js");
const PA=require("./boom-f50-prior-art.js");
const RT=require("./boom-f50-red-team.js");

function strongCandidate(id="strong",overrides={}){
  const prior=PA.SURFACES.map((surface,i)=>({
    surface,
    relation:surface==="products"?"same_function":"adjacent",
    source_ref:"https://evidence.test/"+id+"/"+surface,
    verified:true,
    note:"Verified prior-art evidence for "+surface
  }));
  const red=RT.DIMENSIONS.map(d=>({
    dimension:d,severity:d==="competition"?"HIGH":"MEDIUM",
    attack:"Concrete attack against "+d+" for "+id,
    mitigation:d==="competition"?"Differentiated data moat and mechanism boundary with independent evidence.":"Specific mitigation for "+d+" supported by evidence.",
    resolved:true,evidence_ref:"https://evidence.test/"+id+"/red/"+d
  }));
  return {
    id,title:"Candidate "+id,
    hidden_problem:"A hidden resource is systematically lost because no commercial mechanism captures it.",
    mechanism:"A specific non-trivial mechanism converts that hidden resource into a measurable transaction primitive.",
    mechanism_primitives:["hidden_resource_capture","verified_transaction_primitive","cross_party_outcome_graph"],
    payer:"Businesses losing measurable value from the hidden resource.",
    economic_primitive:"NEW_ASSET",
    economics:{
      inputs_verified:true,revenue_per_unit:12,variable_cost_per_unit:4,
      expected_loss_per_unit:1,acquisition_cost_per_unit:1,
      target_net_profit:600000,reachable_units_per_period:120000,period:"month",
      evidence_refs:["https://economics.test/source-cost","https://economics.test/source-revenue"]
    },
    market_evidence:[
      {source_ref:"https://market.test/"+id+"/1",verified:true},
      {source_ref:"https://market.test/"+id+"/2",verified:true}
    ],
    scale_math:"At $6 verified contribution per unit, 100,000 units produce a theoretical $600,000 contribution before fixed overhead.",
    prior_art_conclusion:"Products, startups, patents, research, GitHub, legacy industries and alternate names were searched; adjacent systems exist but no verified same mechanism was found.",
    novelty_scope:"The novelty claim is limited to the specific mechanism combination and does not claim that routing, marketplaces, agents, or supplier selection are new.",
    novelty_claim:"Mechanism-level novelty only, bounded by the cited prior-art search and subject to continued patent review.",
    mechanism_difference:"Existing systems address the same broad function, but do not use the same transaction primitive and fixed mechanism contract described here.",
    alternate_names:["outcome contract","dynamic fulfillment promise","verified transaction primitive"],
    prior_art_evidence:prior,
    moat:"Verified cross-party outcome data compounds into a graph unavailable to a new entrant at launch.",
    red_team_cases:red,
    red_team:["technical","legal","fraud","adoption","economics","competition","scale","operations","data moat"],
    big_tech_copy_risk:"LOW",
    ordinary_category:false,
    legal_feasibility:true,technical_feasibility:true,economic_path_plausible:true,
    methods:[...C.METHODS],
    novelty_surfaces:[...E.NOVELTY_SURFACES],
    evidence:[
      {id:id+"p",kind:"PATENT",ref:"patent:"+id,claim:"prior art checked",verified:true,independent:true},
      {id:id+"r",kind:"ACADEMIC_RESEARCH",ref:"research:"+id,claim:"technical basis",verified:true,independent:true},
      {id:id+"m",kind:"MARKET_DATA",ref:"market:"+id,claim:"payer/economics basis",verified:true,independent:true}
    ],
    ...overrides
  };
}
module.exports={strongCandidate};