const fs=require("fs");

function assert(condition,message){
  if(!condition)throw new Error(message);
}

const sql=fs.readFileSync("supabase/migrations/20260918123000_boom_professional_baseline_evidence.sql","utf8");

assert(!sql.includes("true,true,now()"),"F35 source seed must not stamp last_checked_at with now()");
assert(!/select id,'[^']+',now\(\)/.test(sql),"F35 finding seed must not stamp observed_at with now()");
assert(
  sql.includes("last_checked_at=public.hunt_boom_f35_sources.last_checked_at"),
  "F35 source replay must preserve existing last_checked_at"
);
const preserveFindingCount=(sql.match(/observed_at=public\.hunt_boom_f35_findings\.observed_at/g)||[]).length;
assert(preserveFindingCount===5,"Expected all five baseline findings to preserve observed_at on replay");

console.log("PASS boom-f35-baseline-freshness");
