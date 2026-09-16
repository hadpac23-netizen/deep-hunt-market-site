const fs=require("fs");
const assert=require("assert");

const sql=fs.readFileSync("supabase/migrations/20260916134640_add_worker_tool_contracts.sql","utf8");
assert(sql.includes("hunt_boom_workers_capabilities_array_check"),"capabilities array guard missing");
assert(sql.includes("hunt_boom_workers_guardrails_array_check"),"guardrails array guard missing");
assert(sql.includes("'input_schema'"),"input schema missing");
assert(sql.includes("'output_schema'"),"output schema missing");
assert(sql.includes("'expected_outcome',mission"),"expected outcome missing");
assert(sql.includes("'evidence_required',true"),"evidence requirement missing");
assert(sql.includes("'owner_gate_sensitive_live_actions'"),"owner gate guardrail missing");
assert(sql.includes("jsonb_array_length(capabilities)=0"),"existing capability preservation gate missing");
assert(sql.includes("jsonb_array_length(guardrails)=0"),"existing guardrail preservation gate missing");
console.log("BOOM worker tool contract test: PASS");