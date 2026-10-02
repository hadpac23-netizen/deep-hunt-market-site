const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const migration=fs.readFileSync(path.resolve(__dirname,"../supabase/migrations/20261001082701_harden_customer_case_permissions_rt08.sql"),"utf8");

test("RT08 removes broad authenticated access before granting customer columns",()=>{
  assert.match(migration,/revoke all on table public\.hunt_support_tickets from anon, authenticated/i);
  assert.match(migration,/revoke all on table public\.hunt_return_requests from anon, authenticated/i);
  const grants=[...migration.matchAll(/grant\s+(?:select|insert|update)\s*\(([\s\S]*?)\)\s+on table public\.(?:hunt_support_tickets|hunt_return_requests) to authenticated/gi)].map(m=>m[1]);
  assert.ok(grants.length>=5);
  for(const grant of grants)assert.doesNotMatch(grant,/internal_notes|resolved_at|approved_at|received_at|completed_at/i);
});

test("RT08 linked commerce records must belong to the same authenticated user",()=>{
  assert.match(migration,/private\.hunt_customer_owns_case_links/);
  assert.match(migration,/ps\.user_id = p_user_id/);
  assert.match(migration,/o\.user_id = p_user_id/);
  assert.match(migration,/f\.id = p_fulfillment_order_id/);
  assert.match(migration,/p_user_id = \(select auth\.uid\(\)\)/);
});

test("staff-only support and return lifecycle fields are client-write denied",()=>{
  const supportInsert=migration.match(/grant insert \(([\s\S]*?)\) on table public\.hunt_support_tickets to authenticated/i)?.[1]||"";
  const supportUpdate=migration.match(/grant update \(([\s\S]*?)\) on table public\.hunt_support_tickets to authenticated/i)?.[1]||"";
  const returnInsert=migration.match(/grant insert \(([\s\S]*?)\) on table public\.hunt_return_requests to authenticated/i)?.[1]||"";
  for(const block of [supportInsert,supportUpdate,returnInsert]){
    assert.doesNotMatch(block,/internal_notes|resolved_at|approved_at|received_at|completed_at/i);
  }
});
