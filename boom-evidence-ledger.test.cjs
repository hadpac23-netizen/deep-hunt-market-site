const assert=require("node:assert");
const E=require("./boom-evidence-ledger.js");
const now=Date.now();

const rows=E.matrix([
  {domain:"economics",source_kind:"DIRECT_DB",source_ref:"hunt_unit_economics",available:true,truth_verified:true,observed_count:4,minimum_count:1,observed_at:new Date(now-1000).toISOString(),max_age_ms:60000},
  {domain:"seo",source_kind:"STATIC_AUDIT",source_ref:"boom-seo-audit.json",available:true,truth_verified:true,freshness_required:false},
  {domain:"marketplace",source_kind:"DIRECT_DB",source_ref:"marketplace_snapshot",available:false,truth_verified:false,freshness_required:false},
  {domain:"stale",source_kind:"OWNER_FUNCTION",source_ref:"mission",available:true,truth_verified:true,observed_count:1,observed_at:new Date(now-100000).toISOString(),max_age_ms:1000}
],now);
assert.strictEqual(rows.rows[0].state,"VERIFIED");
assert.strictEqual(rows.rows[1].state,"STRUCTURAL");
assert.strictEqual(rows.rows[2].state,"MISSING");
assert.strictEqual(rows.rows[3].state,"STALE");
assert.strictEqual(rows.verified,1);

const gate=E.gate(rows,["economics","marketplace"]);
assert.strictEqual(gate.ready,false);
assert.deepStrictEqual(gate.missing_domains,["marketplace"]);
assert.strictEqual(gate.execute,false);
console.log("boom_evidence_ledger=PASS");