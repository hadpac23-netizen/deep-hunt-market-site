const assert=require("node:assert");
const E=require("./boom-f50-evidence-engine.js");
const C=require("./boom-f50-research-core.js");
const F=require("./boom-f50-funnel.js");

function base(id){
  return {
    id,title:"Candidate "+id,
    hidden_problem:"Hidden loss "+id,
    mechanism:"Mechanism "+id+" converts the hidden loss into a transaction.",
    payer:"Payer "+id,
    economic_primitive:"NEW_ASSET",
    methods:[...C.METHODS],
    novelty_surfaces:[...E.NOVELTY_SURFACES],
    prior_art_conclusion:"Broad prior art search completed.",
    novelty_claim:"Mechanism novelty remains evidence-bounded.",
    moat:"Compounding proprietary outcome graph.",
    scale_math:"Explicit users × transactions × contribution math.",
    red_team:["law","fraud","adoption","technology","competition"],
    big_tech_copy_risk:"LOW",
    mechanism_novelty:true,
    legal_feasibility:true,
    technical_feasibility:true,
    economic_path_plausible:true,
    evidence:[
      {id:id+"p",kind:"PATENT",ref:"patent:"+id,claim:"prior art",verified:true},
      {id:id+"r",kind:"ACADEMIC_RESEARCH",ref:"research:"+id,claim:"feasibility",verified:true},
      {id:id+"m",kind:"MARKET_DATA",ref:"market:"+id,claim:"economics",verified:true}
    ]
  };
}

const one=[...Array(50)].map((_,i)=>{
  const x=base("c"+String(i).padStart(2,"0"));
  if(i!==0)x.big_tech_copy_risk="HIGH";
  return x;
});
const winner=F.run(one,C,E);
assert.strictEqual(winner.input_count,50);
assert.strictEqual(winner.stage_10.length,10);
assert.strictEqual(winner.stage_3.length,3);
assert.strictEqual(winner.result,"WINNER");
assert.strictEqual(winner.winner.id,"c00");

const zero=F.run(one.map(x=>({...x,big_tech_copy_risk:"HIGH"})),C,E);
assert.strictEqual(zero.result,"ZERO");
assert.strictEqual(zero.winner,null);

const many=F.run([...Array(50)].map((_,i)=>base("z"+String(i).padStart(2,"0"))),C,E);
assert.strictEqual(many.result,"ZERO");
assert.strictEqual(many.reason,"multiple_survivors_require_more_attack");
assert.strictEqual(many.medium_ideas_exposed,false);
console.log("boom_f50_funnel=PASS");