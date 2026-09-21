const fs=require("fs");
const assert=require("assert");
const spec=JSON.parse(fs.readFileSync("n8n/BOOM-SHELF-COVERAGE-SHADOW.spec.json","utf8"));
assert.equal(spec.status,"SPEC_READY_NOT_CONNECTED");
assert.equal(spec.security.authority,"NONE");
assert.equal(spec.security.material_actions,"FORBIDDEN");
assert.equal(spec.input_contract.workflow_id,"shelf_coverage_17x1000");
const text=JSON.stringify(spec).toLowerCase();
for(const forbidden of ["supplier outreach","catalog activation"]){
  assert(text.includes(forbidden),"expected explicit forbidden boundary: "+forbidden);
}
assert(!spec.logical_nodes.some(n=>/payment|supplier order|publish|deploy/i.test(n.action)));
assert(spec.done_when.length>=5);
console.log("BOOM n8n shelf spec: PASS — read-only, no authority, no material nodes");
