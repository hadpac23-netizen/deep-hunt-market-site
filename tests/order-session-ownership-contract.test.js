const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const src=fs.readFileSync(path.resolve(__dirname,"../supabase/functions/hunt-order-orchestrator/index.ts"),"utf8");

test("user-bound payment sessions require an authenticated caller",()=>{
  assert.match(src,/if\(session\.user_id\)\{/);
  assert.match(src,/SIGNED_IN_SESSION_AUTH_REQUIRED/);
  assert.match(src,/session\.user_id!==uid&&!\(await isAdmin\(ctx\)\)/);
});

test("anonymous prelaunch sessions can only dry-run and never enter supplier sandbox",()=>{
  assert.match(src,/if\(runMode==="dry_run"\)/);
  assert.match(src,/if\(!session\.user_id\)return json\(req,\{ok:false,error:"SIGNED_IN_TEST_SESSION_REQUIRED"\},409\)/);
});
