const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const sql=fs.readFileSync(path.resolve(__dirname,"../ops/hunt-canonical-pdp-readiness.sql"),"utf8");

test("launch readiness uses one canonical PDP metric",()=>{
  assert.match(sql,/CANONICAL_PDP_READY/);
  assert.match(sql,/PDP_DETAIL_PASS/);
  assert.match(sql,/PDP_NOT_RUN/);
  assert.match(sql,/TAXONOMY_BLOCKED/);
  assert.match(sql,/pdp_detail_gate/);
  assert.match(sql,/obvious_taxonomy_conflict/);
  assert.match(sql,/coalesce\(image_url,''\) like 'https:\/\/%'/);
});

test("historical QA audit counts are not relabeled PDP Ready",()=>{
  assert.match(sql,/PDP_QA_AUDIT_PASS/);
  assert.match(sql,/separate audit metric/);
});
