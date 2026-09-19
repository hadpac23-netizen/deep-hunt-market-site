const fs=require("node:fs");
const assert=require("node:assert");
const sql=fs.readFileSync("supabase/migrations/20260919155433_f50_research_memory.sql","utf8");
for(const token of [
  "create table if not exists public.f50_research_runs",
  "create table if not exists public.f50_candidates",
  "create table if not exists public.f50_evidence_records",
  "create table if not exists public.f50_research_memory",
  "enable row level security",
  'create policy "Admins manage F50 research runs"',
  'create policy "Admins manage F50 candidates"',
  'create policy "Admins manage F50 evidence"',
  'create policy "Admins manage F50 memory"',
  "revoke all on table public.f50_research_memory from anon",
  "revoke all on table public.f50_research_runs from authenticated",
  "revoke all on table public.f50_research_memory from authenticated",
  "f50_runs_created_by_idx",
  "f50_runs_winner_candidate_idx",
  "f50_memory_last_run_idx",
  "f50_memory_last_candidate_idx"
]) assert(sql.includes(token),"F50 schema missing: "+token);
console.log("boom_f50_live_schema_contract=PASS");