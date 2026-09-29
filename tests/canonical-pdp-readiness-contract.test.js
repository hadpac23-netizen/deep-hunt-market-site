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
  assert.match(sql,/PDP_QA_LATEST_PASS/);
  assert.match(sql,/latest private\.hunt_pdp_qa_runs record is PASS/);
});


test("canonical PDP readiness intersects the private QA ledger",()=>{
  assert.match(sql,/private\.hunt_pdp_qa_runs/);
  assert.match(sql,/latest_qa/);
  assert.match(sql,/qa_status='PASS'/);
  assert.match(sql,/qa_availability_verified=true/);
  assert.match(sql,/qa_retail_price_verified=true/);
  assert.match(sql,/CANONICAL_PDP_READY=261/);
});
