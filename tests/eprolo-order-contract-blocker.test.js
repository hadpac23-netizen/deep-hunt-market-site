const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const contract=JSON.parse(fs.readFileSync(path.join(root,"ops/hunt-eprolo-order-contract.json"),"utf8"));
const orchestrator=fs.readFileSync(path.join(root,"supabase/functions/hunt-order-orchestrator/index.ts"),"utf8");

test("EPROLO official order/query/tracking contract is documented but execution remains blocked",()=>{
  assert.equal(contract.state,"OFFICIAL_ORDER_AND_TRACKING_CONTRACT_DOCUMENTED_EXECUTION_BLOCKED");
  assert.equal(contract.official_source.source_type,"ACCOUNT_SUPPORT_REP_SUPPLIED_SHOWDOC");
  assert.equal(contract.authentication_contract.base_url,"https://openapi.eprolo.com/");
  assert.equal(contract.official_order_contract.new_order.path,"add_order.html");
  assert.equal(contract.official_order_contract.new_order.method,"POST");
  assert.equal(contract.official_order_contract.order_query.path,"order_list.html");
  assert.equal(contract.official_order_contract.order_query.method,"GET");
  assert.ok(contract.official_order_contract.order_query.tracking_fields.includes("tracking_number"));
  assert.equal(contract.official_order_contract.order_price_quote.path,"getCostByProduct.html");
  assert.ok(contract.official_order_contract.order_price_quote.returns.includes("logistics_cost_list[].tax_cost"));
  assert.equal(contract.official_order_contract.order_price_quote.documented_method,"GET");
  assert.equal(contract.official_order_contract.order_price_quote.runtime_observed_supported_method,"POST");
  assert.equal(contract.official_order_contract.order_price_quote.method_contract_mismatch,true);
  assert.equal(contract.execution_proof.get_cost_by_product_tax_truth_verified,false);
  assert.equal(contract.official_order_contract.cancel_order.path,"cancel_orders.html");
  assert.equal(contract.official_order_contract.webhook_setup.path,"add_shop_webhook.html");
  assert.equal(contract.execution_proof.supplier_submission_performed,false);
  assert.equal(contract.execution_proof.sandbox_or_non_billable_mode_verified,false);
  assert.equal(contract.rules.guess_endpoint,false);
  assert.equal(contract.rules.mutating_supplier_api_calls_allowed,false);
  assert.equal(contract.rules.supplier_submission_allowed,false);
  const required=contract.official_order_contract.new_order.required_fields;
  for(const field of ["tax_cost","shipping_province_code","orderItemlist[].variantsid","orderItemlist[].quantity"]){
    assert.ok(required.includes(field));
  }
});

test("orchestrator remains fail-closed for EPROLO supplier order",()=>{
  assert.match(orchestrator,/EPROLO_SUPPLIER_SANDBOX_UNAVAILABLE/);
  assert.match(orchestrator,/EPROLO_LIVE_ENDPOINT_NOT_VERIFIED/);
  assert.match(orchestrator,/supplier_submission_performed:false/);
  assert.doesNotMatch(orchestrator,/openapi\.eprolo\.com\/.+order/i);
});
