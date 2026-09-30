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
  assert.match(index,/HUNT_DB_POOLER_URL/);
  assert.match(index,/Deno\.env\.set\("SUPABASE_DB_POOLER_URL", huntDbPoolerUrl\)/);
  assert.ok(index.indexOf("Deno.env.set") < index.indexOf('await import("./runtime.ts")'));
  assert.match(runtime,/SUPABASE_DB_POOLER_URL/);
  assert.match(runtime,/EXACT_VARIANT_QUOTE_REQUIRED/);
  assert.doesNotMatch(runtime,/await sql\.end\(\{timeout:1\}\)/);
});
