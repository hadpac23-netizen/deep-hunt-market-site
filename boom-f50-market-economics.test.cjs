const assert=require("node:assert");
const M=require("./boom-f50-market-economics.js");
const {strongCandidate}=require("./boom-f50-test-fixtures.cjs");

const pass=M.evaluate(strongCandidate("econ-pass"));
assert.strictEqual(pass.state,"PASS");
assert.strictEqual(pass.contribution_per_unit,6);
assert.strictEqual(pass.required_units,100000);
assert.strictEqual(pass.profit_guarantee,false);

const negative=strongCandidate("econ-neg",{economics:{inputs_verified:true,revenue_per_unit:5,variable_cost_per_unit:6,target_net_profit:100,reachable_units_per_period:1000,evidence_refs:["e1","e2"]}});
assert.strictEqual(M.evaluate(negative).state,"KILL");
assert(M.evaluate(negative).blockers.includes("non_positive_unit_contribution"));

const impossible=strongCandidate("econ-cap",{economics:{inputs_verified:true,revenue_per_unit:12,variable_cost_per_unit:4,expected_loss_per_unit:1,acquisition_cost_per_unit:1,target_net_profit:600000,reachable_units_per_period:50000,evidence_refs:["e1","e2"]}});
assert.strictEqual(M.evaluate(impossible).state,"KILL");
assert(M.evaluate(impossible).blockers.includes("target_exceeds_evidence_backed_capacity"));
console.log("boom_f50_market_economics=PASS");