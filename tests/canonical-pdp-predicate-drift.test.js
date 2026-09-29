const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const canonical=fs.readFileSync(path.join(root,"ops/hunt-canonical-pdp-readiness.sql"),"utf8");
const counts=fs.readFileSync(path.join(root,"ops/hunt-launch-core-counts.sql"),"utf8");

const signatures=[
  "provider='EPROLO'",
  "production_effect=false",
  "availability_verified=true",
  "coalesce(verified_inventory,0)>0",
  "nullif(trim(source_payload->>'variant_id'),'') is not null",
  "catalog_safety_status",
  "image_technical_status",
  "latest_market5_all_pass",
  "taxonomy_gate_v2",
  "profit_gate_v2",
  "MARKET5_READY_STYLE_PHYSICAL_PENDING",
  "MARKET5_READY_STYLE_PASS_PHYSICAL_EVIDENCE_PENDING",
  "MARKET5_READY_STYLE_PASS_PHYSICAL_METADATA_VERIFIED",
  "pdp_detail_gate",
  "qa_status='PASS'",
  "qa_variant_count>=1",
  "qa_availability_verified=true",
  "qa_retail_price_verified=true",
  "iphone%case",
  "montessori",
  "wristwatch",
  "t-shirt"
];

test("launch-core EPROLO mirror keeps canonical readiness rule signatures",()=>{
  for(const signature of signatures){
    assert.ok(canonical.includes(signature),`canonical missing ${signature}`);
    assert.ok(counts.includes(signature),`launch-core mirror drifted: missing ${signature}`);
  }
});

test("canonical readiness remains the named authoritative source",()=>{
  assert.match(canonical,/CANONICAL_PDP_READY/);
  assert.match(counts,/EPROLO_CANONICAL_PDP_READY/);
  assert.match(counts,/Do not sum these numbers under a single readiness label/);
});
