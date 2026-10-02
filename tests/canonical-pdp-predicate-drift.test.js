const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const canonicalRaw=fs.readFileSync(path.join(root,"ops/hunt-canonical-pdp-readiness.sql"),"utf8");
const countsRaw=fs.readFileSync(path.join(root,"ops/hunt-launch-core-counts.sql"),"utf8");
const normalize=s=>s.replace(/\b[cqs]\./g,"").replace(/\s+/g,"");
const canonical=normalize(canonicalRaw);
const counts=normalize(countsRaw);

const shared=[
  "provider='EPROLO'",
  "production_effect=false",
  "availability_verified=true",
  "coalesce(verified_inventory,0)>0",
  "source_payload->>'variant_id'",
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
  "iphone%case",
  "montessori",
  "wristwatch",
  "t-shirt"
];

test("launch-core mirror keeps canonical EPROLO rule signatures",()=>{
  for(const signature of shared){
    assert.ok(canonical.includes(normalize(signature)),`canonical missing ${signature}`);
    assert.ok(counts.includes(normalize(signature)),`launch-core mirror drifted: missing ${signature}`);
  }
});

test("QA semantics remain equivalent despite CTE alias names",()=>{
  assert.match(canonical,/qa_variant_count>=1/);
  assert.match(counts,/coalesce\(variant_count,0\)>=1/);
  assert.match(canonical,/qa_availability_verified=true/);
  assert.match(counts,/coalesce\(availability_verified,false\)=true/);
  assert.match(canonical,/qa_retail_price_verified=true/);
  assert.match(counts,/coalesce\(retail_price_verified,false\)=true/);
  assert.match(canonical,/pdp_detail_http=200/);
  assert.match(counts,/pdp_detail_gate'->>'http_status'/);
});

test("canonical readiness remains the named authoritative source",()=>{
  assert.match(canonicalRaw,/CANONICAL_PDP_READY/);
  assert.match(countsRaw,/EPROLO_CANONICAL_PDP_READY/);
  assert.match(countsRaw,/Do not sum these numbers under a single readiness label/);
});
