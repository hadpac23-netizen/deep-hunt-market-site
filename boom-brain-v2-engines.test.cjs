const fs=require("fs");
const assert=require("assert");

const edge=fs.readFileSync("supabase/functions/hunt-boom-chat/index.ts","utf8");
const sql=fs.readFileSync("supabase/migrations/20260916143632_activate_boom_brain_v2_engines.sql","utf8");
const hardening=fs.readFileSync("supabase/migrations/20260916150500_add_model_telemetry_and_mcp_gate.sql","utf8");

assert(edge.includes("hunt_boom_model_routes?enabled=eq.true"),"model routes are not loaded");
assert(edge.includes("requestedTaskClass=needsOwnerGate(message)?\"critical_reasoning\":\"owner_chat\""),"task-class route selection missing");
assert(edge.includes("routeSpecs=[ctx?.model_route?.primary_model,ctx?.model_route?.fallback_model]"),"primary/fallback model routing missing");
assert(edge.includes("model_route_key"),"model route telemetry missing");

for(const name of ["hunt_boom_confidence_calibration","hunt_boom_shadow_runs","hunt_boom_capability_decision","hunt_boom_create_command_replay","hunt_boom_confidence_record","hunt_boom_create_team_shadow"]){
  assert(sql.includes(name),"missing Brain v2 engine: "+name);
}
assert(sql.includes("critical-reasoning-shadow"),"critical shadow route missing");
assert(sql.includes("'critical_reasoning'"),"critical reasoning task class missing");
assert(sql.includes("false,true,'{\"mode\":\"shadow_only\""),"critical route must stay disabled and owner-gated");
assert(sql.includes("mcp-2026-template"),"MCP 2026 registry seed missing");
assert(sql.includes("false,false"),"MCP template must remain disabled/unapproved");
assert(sql.includes("traffic_percent,run_mode,status"),"shadow run fields missing");
assert(sql.includes("brain-v2-confidence-calibration"),"confidence curriculum item missing");
assert(sql.includes("brain-v2-shadow-canary"),"shadow/canary curriculum item missing");
assert(hardening.includes("hunt_boom_model_observations"),"model observation table missing");
assert(hardening.includes("hunt_boom_mcp_access_decision"),"MCP access decision missing");
assert(hardening.includes("owner_approval_required"),"MCP owner approval gate missing");
assert(hardening.includes("scope_not_allowed"),"MCP scope gate missing");
assert(hardening.includes("oauth21_required"),"MCP OAuth 2.1 gate missing");
assert(edge.includes("persistModelObservations"),"model observation writer missing");
assert(edge.includes("latency_ms"),"model latency telemetry missing");
console.log("BOOM Brain v2 engines test: PASS");