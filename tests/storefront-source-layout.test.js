const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const dir=path.join(root,"supabase/functions/hunt-storefront");
const index=fs.readFileSync(path.join(dir,"index.ts"),"utf8");

test("storefront source keeps JSON sidecars separate",()=>{
  assert.ok(index.length < 150000, "index.ts unexpectedly contains embedded snapshots");
  assert.equal((index.match(/Deno\.serve/g)||[]).length,1);
  assert.ok(fs.existsSync(path.join(dir,"matterhorn_snapshot.json")));
  assert.ok(fs.existsSync(path.join(dir,"survey_snapshot.json")));
  assert.doesNotMatch(index,/\{"generated_at":"2026-09-11T18:00:00\+03:00","source":"Matterhorn/);
});

test("storefront keeps launch reliability patches after source split",()=>{
  assert.match(index,/SUPABASE_DB_POOLER_URL/);
  assert.match(index,/EXACT_VARIANT_QUOTE_REQUIRED/);
  assert.doesNotMatch(index,/await sql\.end\(\{timeout:1\}\)/);
});
