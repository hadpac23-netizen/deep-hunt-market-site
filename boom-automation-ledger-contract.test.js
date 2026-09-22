const fs=require("fs");
const assert=require("assert");
const contract=JSON.parse(fs.readFileSync("boom-automation-ledger-contract.json","utf8"));
const sql=fs.readFileSync("supabase/schema-candidates/boom_automation_run_ledger_v1.sql","utf8");

assert.equal(contract.version,"BOOM-AUTOMATION-LEDGER-V1");
assert.equal(contract.state,"SCHEMA_READY_NOT_APPLIED");
assert.equal(contract.tables.length,3);

for(const table of ["boom_automation_runs","boom_automation_run_events","boom_automation_approvals"]){
  assert(sql.includes("public."+table),"missing table "+table);
}
assert((sql.match(/enable row level security/g)||[]).length===3,"RLS must be enabled on all ledger tables");
assert(sql.includes("revoke all privileges on table public.boom_automation_runs from anon, authenticated"));
assert(sql.includes("public.is_admin_user()"),"admin RLS helper required");
assert(sql.includes("mode <> 'SHADOW' or material_action_suppressed = true"),"SHADOW material suppression guard required");
assert(sql.includes("unique (run_id, gate_key)"),"one decision per gate required");
assert(!/service_role/i.test(sql),"schema candidate must not grant service_role directly");
console.log("BOOM automation ledger schema: PASS — 3 tables, RLS, admin gate, SHADOW guard, no anon/service grants");
