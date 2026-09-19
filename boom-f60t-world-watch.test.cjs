const assert=require("node:assert/strict");
const W=require("./boom-f60t-world-watch.js");

assert.equal(W.SKILLS.length,18);
assert.equal(W.SKILLS[0].startsWith("F60T-23"),true);
assert.equal(W.SKILLS[17].startsWith("F60T-40"),true);
assert.equal(W.RADARS.length,5);
assert.equal(W.always_on,true);
assert.equal(W.target_is_guarantee,false);
assert.equal(W.spam_allowed,false);
assert.equal(W.deception_allowed,false);
assert.equal(W.platformPlan("reddit").route,"COMMUNITY_ANSWER_FIRST");
assert.equal(W.platformPlan("google_search").route,"SEARCH_CAPTURE");
assert.equal(W.entryWindow({convergenceScore:80,profitReady:true,localTimeReady:true,productFit:true}),"ENTRY_WINDOW");
assert.equal(W.entryWindow({convergenceScore:80,profitReady:false,localTimeReady:true,productFit:true}),"PREPARE");
assert.equal(W.entryWindow({convergenceScore:20}),"OBSERVE");

console.log("boom_f60t_world_watch=PASS");