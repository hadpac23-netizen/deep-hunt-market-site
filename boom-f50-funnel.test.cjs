const assert=require("node:assert");
const E=require("./boom-f50-evidence-engine.js");
const C=require("./boom-f50-research-core.js");
const F=require("./boom-f50-funnel.js");
const PA=require("./boom-f50-prior-art.js");
const ME=require("./boom-f50-market-economics.js");
const RT=require("./boom-f50-red-team.js");
const MEM=require("./boom-f50-memory.js");
const {strongCandidate}=require("./boom-f50-test-fixtures.cjs");
const engines={priorArt:PA,economics:ME,redTeam:RT,memory:MEM};

const one=[...Array(50)].map((_,i)=>{
  const x=strongCandidate("c"+String(i).padStart(2,"0"));
  if(i!==0)x.big_tech_copy_risk="HIGH";
  return x;
});
const winner=F.run(one,C,E,engines,[]);
assert.strictEqual(winner.input_count,50);
assert.strictEqual(winner.stage_10.length,10);
assert.strictEqual(winner.stage_3.length,3);
assert.strictEqual(winner.result,"WINNER");
assert.strictEqual(winner.winner.id,"c00");

const zero=F.run(one.map(x=>({...x,big_tech_copy_risk:"HIGH"})),C,E,engines,[]);
assert.strictEqual(zero.result,"ZERO");
assert.strictEqual(zero.winner,null);

const many=F.run([...Array(50)].map((_,i)=>strongCandidate("z"+String(i).padStart(2,"0"))),C,E,engines,[]);
assert.strictEqual(many.result,"ZERO");
assert.strictEqual(many.reason,"multiple_survivors_require_more_attack");
assert.strictEqual(many.medium_ideas_exposed,false);
console.log("boom_f50_funnel=PASS");