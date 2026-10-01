const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const dir=path.join(root,"supabase/functions/hunt-storefront");
const index=fs.readFileSync(path.join(dir,"index.ts"),"utf8");
const runtime=fs.readFileSync(path.join(dir,"runtime.ts"),"utf8");
const combined=index+"\n"+runtime;

test("storefront source keeps JSON sidecars separate",()=>{
  assert.ok(runtime.length < 150000, "runtime.ts unexpectedly contains embedded snapshots");
  assert.equal((runtime.match(/Deno\.serve/g)||[]).length,1);
  assert.match(index,/await import\("\.\/runtime\.ts"\)/);
  assert.ok(fs.existsSync(path.join(dir,"matterhorn_snapshot.json")));
  assert.ok(fs.existsSync(path.join(dir,"survey_snapshot.json")));
  assert.doesNotMatch(combined,/\{"generated_at":"2026-09-11T18:00:00\+03:00","source":"Matterhorn/);
});

test("storefront keeps launch reliability patches after source split",()=>{
  assert.doesNotMatch(index,/Deno\.env\.set/);
  assert.match(index,/await import\("\.\/runtime\.ts"\)/);
  assert.match(runtime,/hunt_eprolo_strict_pdp_candidate_v1/);
  assert.match(runtime,/HUNT_EPROLO_API_KEY/);
  assert.match(runtime,/HUNT_EPROLO_API_SECRET/);
  assert.doesNotMatch(runtime,/HUNT_DB_POOLER_URL|SUPABASE_DB_POOLER_URL|eproloSqlClient|npm:postgres/);
  assert.match(runtime,/EXACT_VARIANT_QUOTE_REQUIRED/);
});
