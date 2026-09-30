const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const evidence = JSON.parse(fs.readFileSync(
  path.resolve(__dirname, '../ops/evidence/hunt-eprolo-pdp-bulk-shadow-32-2026-09-30.json'),
  'utf8'
));

test('bulk EPROLO PDP evidence remains shadow-only and non-sellable', () => {
  assert.equal(evidence.mode, 'SUPPLIER_DIRECT_SHADOW_EVIDENCE');
  assert.equal(evidence.production_effect, false);
  assert.equal(evidence.sellable, false);
  assert.equal(evidence.payment_live, false);
  assert.equal(evidence.supplier_live_order, false);
  assert.equal(evidence.database_activation_writes, 0);
  assert.equal(evidence.source_payload_updates, 0);
  assert.equal(evidence.private_pdp_qa_rows_written, 0);
});

test('all 32 targets have supplier-direct exact variant, stock, cost and IL shipping evidence', () => {
  const s = evidence.summary;
  assert.equal(s.targets, 32);
  assert.equal(s.supplier_http_200, 32);
  assert.equal(s.exact_variant_found, 32);
  assert.equal(s.positive_inventory, 32);
  assert.equal(s.positive_supplier_cost, 32);
  assert.equal(s.shipping_to_il_verified, 32);
  assert.equal(s.pretax_profit_pass + s.pretax_profit_review + s.pretax_profit_block, 32);
});

test('tax and final-profit blockers remain explicit', () => {
  const s = evidence.summary;
  assert.equal(s.destination_tax_verified, 0);
  assert.equal(s.final_profit_verified, 0);
  assert.equal(evidence.economics.tax_ddp_status, 'DESTINATION_TAX_NOT_VERIFIED');
  assert.equal(evidence.safety_gate.status, 'HOLD');
  assert.equal(evidence.safety_gate.owner_gate_required_before_live_readiness_write, true);
  assert.equal(s.canonical_readiness_promotions, 0);
});

test('evidence lists are internally consistent', () => {
  assert.equal(evidence.pretax_pass_item_ids.length, evidence.summary.pretax_profit_pass);
  assert.equal(evidence.pretax_review_item_ids.length, evidence.summary.pretax_profit_review);
  assert.equal(evidence.existing_detail_pass_item_ids.length, evidence.summary.existing_pdp_detail_pass);
  const all = new Set([...evidence.pretax_pass_item_ids, ...evidence.pretax_review_item_ids]);
  assert.equal(all.size, evidence.summary.targets);
});
