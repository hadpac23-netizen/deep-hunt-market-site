const fs=require("fs"),assert=require("assert");
const r=JSON.parse(fs.readFileSync("boom-scheduler-contract.json","utf8"));
assert.equal(r.owner,"boom_orchestrator");
assert.equal(r.mode,"SHADOW");
assert(r.jobs.filter(x=>x.schedule==="*/30 * * * *").length===2);
assert(r.jobs.every(x=>!/publish|spend|order|payment/i.test(x.operation)));
assert(r.failure_policy.some(x=>/Owner Gate/i.test(x)));
console.log("Scheduler contract: PASS — one owner, preserved schedules, no material permission");