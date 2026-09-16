const fs=require("fs");
const assert=require("assert");

const sql=fs.readFileSync("supabase/migrations/20260916122519_add_learning_graduation_engine.sql","utf8");
assert(sql.includes("hunt_boom_learning_graduation_guard"),"graduation guard missing");
assert(sql.includes("hunt_boom_try_graduate_learning"),"try_graduate function missing");
assert(sql.includes("BOOM_LEARNING_GRADUATION_BLOCKED"),"graduation hard block missing");
assert(sql.includes("subject_type='learning_item'"),"learning-item eval gate missing");
assert(sql.includes("jsonb_array_length"),"evidence length gate missing");
assert(sql.includes("pre_graduation_status"),"legacy learned revalidation missing");
assert(sql.includes("command_duplication_is_not_progress"),"first graduation candidate missing");
assert(sql.includes("learning-command-duplication-is-not-progress-v1"),"graduation eval key missing");
console.log("BOOM learning graduation test: PASS");