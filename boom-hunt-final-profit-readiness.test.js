const assert=require("node:assert/strict");
const fs=require("node:fs");
const read=p=>JSON.parse(fs.readFileSync(p,"utf8"));

const x=read("evidence/HUNT-FINAL-PROFIT-READINESS-709-2026-09-23.json");
const c=read("boom-final-profit-readiness-contract.json");

assert.equal(x.production_effect,false);
assert.equal(x.summary.gate_ready_products,709);
assert.equal(x.summary.product_market_pairs,2836);
assert.equal(x.summary.products_ready_for_controlled_order_evidence_4_of_4,709);
assert.equal(x.summary.pairs_ready_for_controlled_order_evidence,2836);
assert.equal(x.summary.final_profit_verified_products,0);
assert.equal(x.summary.final_profit_verified_pairs,0);
assert.equal(x.pairs.length,2836);
assert(x.pairs.every(p=>p.final_profit_verified===false));
assert(x.pairs.every(p=>p.requires_real_non_test_order_for_final_profit===true));
assert(x.pairs.every(p=>p.production_effect===false));
assert(x.required_evidence_checklist.some(x=>x.id==="ORDER_FINANCE_LEDGER_REAL_ROW"&&x.status==="NO_REAL_ROWS_YET"));
assert.equal(c.authority,"NONE");
assert.equal(c.owner_gate.live_payment_activation,true);
assert.equal(c.owner_gate.supplier_order,true);
console.log("HUNT Final Profit Readiness: PASS");
