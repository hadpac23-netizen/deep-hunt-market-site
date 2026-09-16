const fs=require("fs");
const assert=require("assert");

const sql=fs.readFileSync(
  "supabase/migrations/20260916124929_harden_security_definer_search_path.sql",
  "utf8"
);

assert(sql.includes("create or replace function public.is_admin_user()"));
assert(sql.includes("create or replace function public.admin_set_user_ban"));
assert((sql.match(/set search_path to ''/g)||[]).length===2);
assert(sql.includes("public.is_admin_user()"));
assert(sql.includes("public.profiles"));
assert(sql.includes("auth.uid()"));
assert(sql.includes("revoke execute on function public.is_admin_user() from public, anon;"));
assert(sql.includes("revoke execute on function public.admin_set_user_ban(uuid, boolean) from public, anon;"));
assert(sql.includes("grant execute on function public.is_admin_user() to authenticated, service_role;"));
assert(sql.includes("grant execute on function public.admin_set_user_ban(uuid, boolean) to authenticated, service_role;"));

console.log("BOOM SECURITY DEFINER hardening test: PASS");
