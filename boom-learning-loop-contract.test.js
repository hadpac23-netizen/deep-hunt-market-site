const fs=require("fs"),assert=require("assert");
const c=JSON.parse(fs.readFileSync("boom-learning-loop-contract.json","utf8"));
assert.equal(c.brain,"learning_governance_brain");
assert.equal(c.boundaries.auto_policy_change,false);
assert(c.truth_rules.some(x=>/single outcome/i.test(x)));
assert(c.truth_rules.some(x=>/evaluation evidence/i.test(x)));
assert(c.stages.includes("confidence_calibration"));
console.log("Learning loop contract: PASS — evidence first, no silent behavior change");