const assert=require("node:assert");
const Engine=require("./boom-f50-engine.js");
const E=require("./boom-f50-evidence-engine.js");
const C=require("./boom-f50-research-core.js");

assert.strictEqual(Engine.run({token:"wrong",candidates:[]}).result,"ZERO");
assert.strictEqual(Engine.run({token:"wrong",candidates:[]}).reason,"f50_protocol_token_required");

function candidate(id,keep=false){
  return {
    id,title:"Candidate "+id,
    hidden_problem:"Hidden loss "+id,
    mechanism:"Specific mechanism "+id,
    payer:"Payer "+id,
    economic_primitive:"NEW_ASSET",
    methods:[...C.METHODS],
    novelty_surfaces:[...E.NOVELTY_SURFACES],
    prior_art_conclusion:"Broad prior-art search completed.",
    novelty_claim:"Evidence-bounded mechanism novelty.",
    moat:"Compounding proprietary outcome graph.",
    scale_math:"Users × transactions × contribution with explicit assumptions.",
    red_team:["law","fraud","adoption","technology","competition"],
    big_tech_copy_risk:keep?"LOW":"HIGH",
    mechanism_novelty:true,legal_feasibility:true,technical_feasibility:true,economic_path_plausible:true,
    evidence:[
      {id:id+"p",kind:"PATENT",ref:"patent:"+id,claim:"prior art",verified:true},
      {id:id+"r",kind:"ACADEMIC_RESEARCH",ref:"research:"+id,claim:"technical feasibility",verified:true},
      {id:id+"m",kind:"MARKET_DATA",ref:"market:"+id,claim:"economics",verified:true}
    ]
  };
}

const rows=[...Array(50)].map((_,i)=>candidate("e"+String(i).padStart(2,"0"),i===0));
const result=Engine.run({token:Engine.TOKEN,candidates:rows});
assert.strictEqual(result.result,"WINNER");
assert.strictEqual(result.winner.id,"e00");
assert.strictEqual(result.intermediate_candidates_exposed,false);
assert.strictEqual(result.paid_spend,false);
assert.strictEqual(result.external_publish,false);
assert.strictEqual(result.payment_activation,false);
assert.strictEqual(result.supplier_order,false);
assert.strictEqual(result.execute_actions,false);
console.log("boom_f50_engine=PASS");