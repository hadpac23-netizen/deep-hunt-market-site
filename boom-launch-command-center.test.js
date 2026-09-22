const fs=require("fs"),assert=require("assert");
const contract=JSON.parse(fs.readFileSync("boom-launch-command-center-contract.json","utf8"));
assert.equal(contract.authority,"NONE");
assert.deepEqual(contract.domains.map(x=>x.id),["inventory","payments","orders","legal","performance","profit","automation","suppliers"]);
assert(contract.hard_rules.some(x=>/Test orders never count/.test(x)));
assert(contract.hard_rules.some(x=>/never overrides domain source-of-truth/i.test(x)));
const html=fs.readFileSync("boom-command-center.html","utf8");
for(const id of ["hd-launch-command-center","hd-launch-overall","hd-launch-live-metrics","hd-launch-domain-grid","hd-launch-blockers","hd-launch-performance"]){
  assert(html.includes('id="'+id+'"'),"missing launch command element "+id);
}
const js=fs.readFileSync("boom-command-center.js","utf8");
for(const needle of [
  'fetchJson("boom-control-plane-readiness.json")',
  'fetchJson("boom-launch-command-center-contract.json")',
  'fetchJson("boom-performance-mobile-readiness-contract.json")',
  '.eq("is_test",false)',
  'owner_approval_required',
  'renderLaunchCommandCenter()'
]) assert(js.includes(needle),"command center missing "+needle);
assert(!js.includes('from("hunt_runtime_controls").update'),"launch command center must not change runtime controls");
assert(!js.includes('hunt_payment_live").update'),"launch command center must not activate payments");
assert(!js.includes('hunt_supplier_order_live").update'),"launch command center must not activate supplier fulfillment");
assert(!js.includes('from("analytics_events")'),"launch command center must not fetch raw analytics session IDs in browser");
console.log("BOOM Launch Command Center: PASS — canonical readiness + read-only live metrics, no activation authority");