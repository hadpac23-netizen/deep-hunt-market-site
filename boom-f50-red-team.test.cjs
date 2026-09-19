const assert=require("node:assert");
const R=require("./boom-f50-red-team.js");
const {strongCandidate}=require("./boom-f50-test-fixtures.cjs");

const pass=R.attack(strongCandidate("rt-pass"));
assert.strictEqual(pass.state,"PASS");
assert.strictEqual(pass.missing_dimensions.length,0);

const fatal=strongCandidate("rt-fatal");
fatal.red_team_cases=fatal.red_team_cases.map(x=>x.dimension==="legal_regulatory"?{...x,severity:"FATAL",resolved:false}:x);
const out=R.attack(fatal);
assert.strictEqual(out.state,"KILL");
assert.strictEqual(out.fatal_unresolved,1);

const high=strongCandidate("rt-high");
high.red_team_cases=high.red_team_cases.map(x=>x.dimension==="competition"?{...x,severity:"HIGH",resolved:false}:x);
assert.strictEqual(R.attack(high).state,"HOLD");
console.log("boom_f50_red_team=PASS");