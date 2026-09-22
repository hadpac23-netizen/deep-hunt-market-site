const fs=require("fs"),assert=require("assert");
const r=JSON.parse(fs.readFileSync("boom-agent-registry.json","utf8"));
assert.equal(r.legacy_source.manager_count,31);
assert.equal(r.legacy_manager_map.length,31);
assert.equal(r.legacy_manager_map.find(x=>x.legacy_id==="boom-executive").classification,"SUPERSEDED_BY_PRIMARY_BRAIN");
assert.equal(r.legacy_manager_map.find(x=>x.legacy_id==="supplier-hypersku").classification,"REWIRE_AS_ADAPTER");
assert.equal(r.department_policy.representation,"TAXONOMY_MODULES_NOT_AGENTS");
assert.equal(r.split_rules.find(x=>x.legacy_id==="country-localization").targets.length,2);
console.log("Agent registry: PASS — 31 managers consolidated, departments are modules");