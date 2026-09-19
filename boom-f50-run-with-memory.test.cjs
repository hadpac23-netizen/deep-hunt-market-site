const assert=require("node:assert");
const Engine=require("./boom-f50-engine.js");
const Memory=require("./boom-f50-memory.js");
const {strongCandidate}=require("./boom-f50-test-fixtures.cjs");

(async()=>{
  const rows=[...Array(50)].map((_,i)=>{
    const x=strongCandidate("m"+String(i).padStart(2,"0"));
    if(i!==0)x.big_tech_copy_risk="HIGH";
    return x;
  });
  const killed={
    mechanism_fingerprint:Memory.fingerprint(rows[0]),
    mechanism_primitives:rows[0].mechanism_primitives,
    last_decision:"KILL",
    kill_reasons:["prior_art"],
    prior_art_refs:["patent:test"],
    winner_claim_allowed:false,
    hit_count:3,
    last_seen_at:new Date().toISOString()
  };
  const client={
    from(name){
      assert.strictEqual(name,"f50_research_memory");
      return {
        select(){
          return {
            order(){
              return {limit:async()=>({data:[killed],error:null})};
            }
          };
        }
      };
    }
  };
  const result=await Engine.runWithMemory({token:Engine.TOKEN,candidates:rows},client);
  assert.strictEqual(result.result,"ZERO");
  assert.strictEqual(result.winner,null);
  console.log("boom_f50_run_with_memory=PASS");
})().catch(err=>{console.error(err);process.exit(1);});