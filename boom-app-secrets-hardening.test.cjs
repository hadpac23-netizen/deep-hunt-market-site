const fs=require("fs");
const assert=require("assert");

const migration=fs.readFileSync(
  "supabase/migrations/20260916123952_harden_app_secrets_access.sql","utf8"
);
const chat=fs.readFileSync("supabase/functions/hunt-boom-chat/index.ts","utf8");
const transcribe=fs.readFileSync("supabase/functions/hunt-boom-transcribe/index.ts","utf8");

assert(/revoke all privileges on table public\.app_secrets from anon;/i.test(migration));
assert(/revoke all privileges on table public\.app_secrets from authenticated;/i.test(migration));
assert(/grant select, insert, update, delete on table public\.app_secrets to service_role;/i.test(migration));
assert(!/grant\s+.+\s+to\s+(anon|authenticated)/i.test(migration));

for(const [name,code] of [["chat",chat],["transcribe",transcribe]]){
  assert(code.includes('SUPABASE_SERVICE_ROLE_KEY'),name+" missing service role key");
  assert(code.includes('Authorization:"Bearer "+SERVICE') ||
         code.includes('Authorization:"Bearer "+SERVICE,') ||
         code.includes('Authorization:"Bearer "+SERVICE}'),
         name+" REST path is not service-role authenticated");
}

console.log("BOOM app_secrets hardening test: PASS");
