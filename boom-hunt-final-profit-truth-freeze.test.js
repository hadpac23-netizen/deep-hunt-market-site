const assert=require("node:assert/strict");
const fs=require("node:fs");
const crypto=require("node:crypto");

const freeze=JSON.parse(fs.readFileSync("evidence/BOOM-BDIF-HUNT-1K-FROZEN-2026-09-23.json","utf8"));
const profit=JSON.parse(fs.readFileSync("evidence/HUNT-FINAL-PROFIT-TRUTH-709-2026-09-23.json","utf8"));
const gaps=JSON.parse(fs.readFileSync("evidence/HUNT-28-THIN-RAILS-SOURCING-QUEUE-2026-09-23.json","utf8"));
const suppliers=JSON.parse(fs.readFileSync("evidence/HUNT-SUPPLIER-READINESS-MATRIX-2026-09-23.json","utf8"));

assert.equal(freeze.production_effect,false);
assert.equal(freeze.selected_products,1000);
assert.equal(freeze.product_market_pairs,4000);
assert.equal(freeze.rows.length,1000);
assert.equal(new Set(freeze.rows.map(x=>x.provider+":"+x.item_id)).size,1000);
assert.equal(freeze.identity_sha256.length,64);

assert.equal(profit.production_effect,false);
assert.equal(profit.gate_ready_products,709);
assert.equal(profit.product_market_pairs,2836);
assert.equal(profit.pairs.length,2836);
assert.equal(profit.summary.final_profit_verified_products,0);
assert.equal(profit.summary.final_profit_verified_pairs,0);
assert.equal(profit.summary.final_profit_input_partial_pairs,2836);
assert(profit.pairs.every(x=>x.final_profit_verified===false));
assert(profit.pairs.every(x=>x.economics.final_net_profit_usd===null));
assert(profit.pairs.every(x=>x.blockers.includes("PAYMENT_PROCESSOR_ACTUAL_FEE_NOT_REALIZED")));
assert(profit.pairs.every(x=>x.blockers.includes("TAX_IMPORT_TREATMENT_NOT_VERIFIED")));

assert.equal(gaps.production_effect,false);
assert.equal(gaps.summary.thin_rails,28);
assert.equal(gaps.summary.empty_rails,0);
assert.equal(gaps.summary.missing_slots_to_12,181);
assert.equal(gaps.summary.missing_slots_to_24,517);
assert.equal(gaps.rails.length,28);

assert(suppliers.suppliers.some(x=>x.supplier==="HyperSKU"&&x.status==="WAITING_SOURCING_DETAILS"));
assert(suppliers.suppliers.some(x=>x.supplier==="BT Case / Jimi"&&x.status==="WAITING_SELECTED_MODEL_PRICES_AND_QC"));

console.log("HUNT Final Profit Truth Freeze: PASS — 1K frozen, 709 Gate Ready / 2836 market pairs truth-mapped, 28 thin rails queued");
