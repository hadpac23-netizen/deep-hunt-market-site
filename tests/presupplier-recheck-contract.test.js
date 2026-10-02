const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const payment=fs.readFileSync(path.join(root,"supabase/functions/hunt-payment-session/index.ts"),"utf8");
const orchestrator=fs.readFileSync(path.join(root,"supabase/functions/hunt-order-orchestrator/index.ts"),"utf8");

test("prepayment persists exact CJ supplier-cost snapshot",()=>{
  assert.match(payment,/supplierCost=providerLower\.includes\("cj"\)/);
  assert.match(payment,/SUPPLIER_COST_RECHECK_FAILED/);
  assert.match(payment,/supplier_cost_amount/);
});

test("supplier sandbox performs fresh exact-variant stock and route recheck",()=>{
  assert.match(orchestrator,/product\/stock\/queryByVid/);
  assert.match(orchestrator,/freightCalculate/);
  assert.match(orchestrator,/PRESUPPLIER_OUT_OF_STOCK/);
  assert.match(orchestrator,/PRESUPPLIER_LOGISTICS_CHANGED_REQUOTE_REQUIRED/);
  assert.match(orchestrator,/PRESUPPLIER_SHIPPING_COST_INCREASED_REQUOTE_REQUIRED/);
});

test("supplier sandbox blocks supplier cost drift and rechecks profit",()=>{
  assert.match(orchestrator,/cjCurrentVariantCost/);
  assert.match(orchestrator,/PRESUPPLIER_SUPPLIER_COST_INCREASED_REQUOTE_REQUIRED/);
  assert.match(orchestrator,/PRESUPPLIER_PROFIT_GATE_FAILED/);
  assert.match(orchestrator,/min_contribution_per_unit/);
  assert.match(orchestrator,/min_margin_rate/);
});

test("presupplier gate runs before test order creation",()=>{
  const gate=orchestrator.indexOf("presupplierEvidence.push(await presupplierCjRecheck");
  const create=orchestrator.indexOf("provider:\"HUNT_SANDBOX\"");
  assert.ok(gate>0 && create>gate);
});

test("presupplier evidence never claims destination tax verified",()=>{
  assert.match(orchestrator,/destination_tax_verified:false/);
  assert.match(orchestrator,/supplier_submission_performed:false/);
});
