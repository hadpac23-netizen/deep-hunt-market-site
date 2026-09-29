const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const contract=JSON.parse(fs.readFileSync(path.join(root,"ops/hunt-eprolo-order-contract.json"),"utf8"));
const orchestrator=fs.readFileSync(path.join(root,"supabase/functions/hunt-order-orchestrator/index.ts"),"utf8");

test("EPROLO order contract only records verified read-only endpoints",()=>{
  assert.equal(contract.state,"BLOCKED_UNTIL_OFFICIAL_ORDER_AND_TRACKING_CONTRACT_VERIFIED");
  assert.deepEqual(contract.verified_readonly_api.endpoints.map(x=>x.path).sort(),[
    "eprolo_product_list.html","get_product_shiping_fees.html"
  ].sort());
  assert.equal(contract.rules.guess_endpoint,false);
  assert.equal(contract.rules.supplier_submission_allowed,false);
});

test("orchestrator remains fail-closed for EPROLO supplier order",()=>{
  assert.match(orchestrator,/EPROLO_SUPPLIER_SANDBOX_UNAVAILABLE/);
  assert.match(orchestrator,/EPROLO_LIVE_ENDPOINT_NOT_VERIFIED/);
  assert.match(orchestrator,/supplier_submission_performed:false/);
  assert.doesNotMatch(orchestrator,/openapi\.eprolo\.com\/.+order/i);
});
