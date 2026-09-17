const fs=require("fs");
const assert=require("assert");

const edge=fs.readFileSync("supabase/functions/hunt-boom-chat/index.ts","utf8");
const sql=fs.readFileSync("supabase/migrations/20260916161000_add_model_chess_measurement.sql","utf8");

for(const field of ["input_tokens","output_tokens","total_tokens"]){
  assert(edge.includes(field),"runtime token telemetry missing: "+field);
  assert(sql.includes(field),"observation column missing: "+field);
}
assert(sql.includes("hunt_boom_model_cost_registry"),"model cost registry missing");
assert(sql.includes("hunt_boom_estimate_model_cost"),"cost estimate trigger missing");
assert(sql.includes("0.20,1.20"),"OpenAI Luna reference price missing");
assert(sql.includes("1.50,9.00"),"Gemini Flash reference price missing");
assert(sql.includes("hunt_boom_model_benchmark_cases"),"model benchmark cases missing");
assert(sql.includes("model-chess-security-gate"),"security benchmark case missing");
assert(sql.includes("reference_paid_standard"),"Gemini pricing tier distinction missing");
assert(edge.includes("usage?.input_tokens"),"OpenAI usage extraction missing");
assert(!edge.includes("GROQ_API_KEY"),"Groq must not be configured in BOOM runtime");
assert(!edge.includes("tryGroq"),"Groq runtime route must remain removed");
assert(edge.includes("usage?.promptTokenCount"),"Gemini usage extraction missing");

console.log("BOOM Model Chess measurement test: PASS");