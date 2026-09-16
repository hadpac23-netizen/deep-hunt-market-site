const fs=require("fs");
const assert=require("assert");

const sql=fs.readFileSync("supabase/migrations/20260916130806_improve_learning_metrics_and_corrections.sql","utf8");
const edge=fs.readFileSync("supabase/functions/hunt-boom-chat/index.ts","utf8");

assert(sql.includes("occurrence_count integer not null default 1"),"occurrence_count migration missing");
assert(sql.includes("recurrence_count integer not null default 0"),"recurrence_count migration missing");
assert(sql.includes("owner_correction_recurrence"),"owner correction metric missing");
assert(sql.includes("terminal_closed_commands"),"terminal command closure metric missing");
assert(sql.includes("on conflict (cycle_id,metric_name) where cycle_id is not null"),"eval refresh upsert missing");
assert(edge.includes('category==="correction"'),"correction ingestion branch missing");
assert(edge.includes("recurrence_count"),"correction recurrence increment missing");
assert(edge.includes("EXISTING_CORRECTIONS"),"correction key reuse prompt missing");
console.log("BOOM correction metrics test: PASS");