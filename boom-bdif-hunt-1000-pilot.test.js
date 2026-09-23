const assert=require("node:assert/strict");
const fs=require("node:fs");
const {execFileSync}=require("node:child_process");

execFileSync(process.execPath,["boom-bdif-hunt-1000-pilot-build.js"],{stdio:"pipe"});
const manifest=JSON.parse(fs.readFileSync("evidence/BOOM-BDIF-HUNT-1000-PILOT-CANDIDATES-2026-09-23.json","utf8"));
const gap=JSON.parse(fs.readFileSync("evidence/BOOM-BDIF-HUNT-1000-TRUTH-GAP-2026-09-23.json","utf8"));

assert.equal(manifest.production_effect,false);
assert.equal(manifest.products.length,1000);
assert.equal(new Set(manifest.products.map(p=>p.provider+":"+p.item_id)).size,1000);
assert.equal(manifest.target_markets.length,4);
assert.equal(gap.summary.product_market_pairs,4000);
assert.equal(gap.summary.model_assisted_bdif,"NOT_RUN");
assert.equal(gap.summary.winner_status,"NOT_DETERMINED");
assert.equal(gap.summary.business_outcome_ready_pairs,0);
assert.equal(gap.summary.provider_counts.CJdropshipping,39);
assert.equal(gap.summary.provider_counts.Gooten,13);
assert.equal(gap.summary.provider_counts.EPROLO,948);
assert.equal(gap.summary.departments_represented,17);
assert(manifest.summary.category_count>=100);
assert(gap.summary.gate_benchmark_ready_pairs>0);
assert(gap.summary.full_pilot_input_ready_pairs<=gap.summary.gate_benchmark_ready_pairs);
for(const product of manifest.products){
  assert.equal(product.metadata.value.production_exposure,false);
  for(const market of manifest.target_markets){
    assert(["PASS","REVIEW","REJECT","UNKNOWN","ESCALATE"].includes(product.markets[market].deterministic_bdif.product_gate));
  }
}
console.log("BDIF HUNT 1000 Pilot: PASS", gap.summary);
