const assert=require("node:assert");
const Engine=require("./boom-f50-engine.js");
const {strongCandidate}=require("./boom-f50-test-fixtures.cjs");

assert.strictEqual(Engine.run({token:"wrong",candidates:[]}).result,"ZERO");
assert.strictEqual(Engine.run({token:"wrong",candidates:[]}).reason,"f50_protocol_token_required");

const rows=[...Array(50)].map((_,i)=>{
  const x=strongCandidate("e"+String(i).padStart(2,"0"));
  if(i!==0)x.big_tech_copy_risk="HIGH";
  return x;
});
const result=Engine.run({token:Engine.TOKEN,candidates:rows,memory_rows:[]});
assert.strictEqual(result.result,"WINNER");
assert.strictEqual(result.winner.id,"e00");
assert.strictEqual(result.gates.prior_art,true);
assert.strictEqual(result.gates.market_economics,true);
assert.strictEqual(result.gates.red_team,true);
assert.strictEqual(result.gates.research_memory,true);
assert.strictEqual(result.intermediate_candidates_exposed,false);
assert.strictEqual(result.paid_spend,false);
assert.strictEqual(result.external_publish,false);
assert.strictEqual(result.payment_activation,false);
assert.strictEqual(result.supplier_order,false);
assert.strictEqual(result.execute_actions,false);

const killedMemory=[{
  mechanism_fingerprint:require("./boom-f50-memory.js").fingerprint(rows[0]),
  last_decision:"KILL",hit_count:1
}];
const blocked=Engine.run({token:Engine.TOKEN,candidates:rows,memory_rows:killedMemory});
assert.strictEqual(blocked.result,"ZERO");
console.log("boom_f50_engine=PASS");