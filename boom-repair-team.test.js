const fs=require("fs");
const assert=require("assert");
const team=JSON.parse(fs.readFileSync("boom-incident-repair-contract.json","utf8"));
const brains=JSON.parse(fs.readFileSync("boom-brain-registry.json","utf8"));
const actions=JSON.parse(fs.readFileSync("boom-action-contract.json","utf8"));
const workflow=fs.readFileSync(".github/workflows/hunt-repair-qa.yml","utf8");

assert.equal(team.owner,"learning_governance_brain");
assert.equal(team.router,"boom_orchestrator");
assert.equal(team.autonomy.create_branch_patch,true);
assert.equal(team.autonomy.run_ci_checks,true);
assert.equal(team.autonomy.merge,false);
assert.equal(team.autonomy.production_deploy,false);
for(const scope of ["product_selection","product_gallery","checkout","shipping","auth_session"])
  assert(team.scope.includes(scope),"missing repair scope "+scope);
const learning=brains.primary_brains.find(x=>x.id==="learning_governance_brain");
const experience=brains.primary_brains.find(x=>x.id==="experience_brain");
assert(learning.owns.includes("incident_repair_team"));
assert(learning.owns.includes("regression_guard"));
assert(experience.owns.includes("product_selection_integrity"));
for(const id of ["incident.report","repair.patch.prepare","repair.verify"])
  assert(actions.actions.some(x=>x.action_id===id),"missing repair action "+id);
assert(workflow.includes("hunt-product-media-selection.test.js"));
console.log("BOOM repair team: PASS — triage, branch repair, regression and Owner Gate contracts are permanent.");
