-- F50 Research Memory
-- Persistent owner-only research state for killed/kept candidates and evidence.
-- Public schema is used for authenticated owner access from BOOM Studio; RLS is mandatory.

create table if not exists public.f50_research_runs (
  id uuid primary key default gen_random_uuid(),
  mission text not null check (char_length(mission) between 1 and 1000),
  protocol_token text not null default 'F50-DEEP-HUNT-CONTINUE',
  status text not null default 'running'
    check (status in ('running','completed','hold','zero','winner')),
  result text not null default 'UNRESOLVED'
    check (result in ('UNRESOLVED','ZERO','WINNER')),
  winner_candidate_id uuid,
  created_by uuid references auth.users(id) on delete set null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.f50_candidates (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.f50_research_runs(id) on delete cascade,
  candidate_key text not null check (char_length(candidate_key) between 1 and 160),
  title text not null check (char_length(title) between 1 and 300),
  domain text not null default 'general',
  mechanism_fingerprint text not null check (char_length(mechanism_fingerprint) between 8 and 160),
  mechanism_primitives jsonb not null default '[]'::jsonb,
  hidden_problem text not null default '',
  mechanism text not null default '',
  payer text not null default '',
  economic_primitive text not null default '',
  novelty_claim text not null default '',
  prior_art_conclusion text not null default '',
  moat text not null default '',
  scale_math text not null default '',
  big_tech_copy_risk text not null default 'UNKNOWN',
  stage text not null default 'generated'
    check (stage in ('generated','top10','top3','final','killed')),
  decision text not null default 'UNRESOLVED'
    check (decision in ('UNRESOLVED','KILL','KEEP','WINNER')),
  kill_reasons jsonb not null default '[]'::jsonb,
  prior_art_result jsonb not null default '{}'::jsonb,
  economics_result jsonb not null default '{}'::jsonb,
  red_team_result jsonb not null default '{}'::jsonb,
  evidence_result jsonb not null default '{}'::jsonb,
  memory_result jsonb not null default '{}'::jsonb,
  winner_claim_allowed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(run_id,candidate_key)
);

alter table public.f50_research_runs
  drop constraint if exists f50_research_runs_winner_candidate_id_fkey;
alter table public.f50_research_runs
  add constraint f50_research_runs_winner_candidate_id_fkey
  foreign key (winner_candidate_id) references public.f50_candidates(id) on delete set null;

create table if not exists public.f50_evidence_records (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.f50_candidates(id) on delete cascade,
  source_kind text not null,
  source_ref text not null check (char_length(source_ref) between 1 and 1000),
  claim text not null check (char_length(claim) between 1 and 1200),
  novelty_surface text,
  relation text not null default 'adjacent'
    check (relation in ('same_mechanism','same_function','adjacent','different','market','technical','regulatory')),
  verified boolean not null default false,
  independent boolean not null default true,
  source_date date,
  checked_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.f50_research_memory (
  mechanism_fingerprint text primary key,
  canonical_title text not null default '',
  canonical_mechanism text not null default '',
  mechanism_primitives jsonb not null default '[]'::jsonb,
  last_decision text not null
    check (last_decision in ('KILL','KEEP','WINNER','UNRESOLVED')),
  kill_reasons jsonb not null default '[]'::jsonb,
  prior_art_refs jsonb not null default '[]'::jsonb,
  last_run_id uuid references public.f50_research_runs(id) on delete set null,
  last_candidate_id uuid references public.f50_candidates(id) on delete set null,
  winner_claim_allowed boolean not null default false,
  hit_count integer not null default 1 check (hit_count >= 1),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists f50_candidates_fingerprint_idx
  on public.f50_candidates(mechanism_fingerprint);
create index if not exists f50_candidates_decision_idx
  on public.f50_candidates(decision, updated_at desc);
create index if not exists f50_candidates_run_stage_idx
  on public.f50_candidates(run_id, stage);
create index if not exists f50_evidence_candidate_idx
  on public.f50_evidence_records(candidate_id, checked_at desc);
create index if not exists f50_evidence_surface_idx
  on public.f50_evidence_records(novelty_surface, verified);
create index if not exists f50_memory_decision_idx
  on public.f50_research_memory(last_decision, last_seen_at desc);
create index if not exists f50_runs_created_by_idx
  on public.f50_research_runs(created_by);
create index if not exists f50_runs_winner_candidate_idx
  on public.f50_research_runs(winner_candidate_id);
create index if not exists f50_memory_last_run_idx
  on public.f50_research_memory(last_run_id);
create index if not exists f50_memory_last_candidate_idx
  on public.f50_research_memory(last_candidate_id);

alter table public.f50_research_runs enable row level security;
alter table public.f50_candidates enable row level security;
alter table public.f50_evidence_records enable row level security;
alter table public.f50_research_memory enable row level security;

revoke all on table public.f50_research_runs from anon;
revoke all on table public.f50_candidates from anon;
revoke all on table public.f50_evidence_records from anon;
revoke all on table public.f50_research_memory from anon;

revoke all on table public.f50_research_runs from authenticated;
revoke all on table public.f50_candidates from authenticated;
revoke all on table public.f50_evidence_records from authenticated;
revoke all on table public.f50_research_memory from authenticated;

grant select,insert,update,delete on table public.f50_research_runs to authenticated;
grant select,insert,update,delete on table public.f50_candidates to authenticated;
grant select,insert,update,delete on table public.f50_evidence_records to authenticated;
grant select,insert,update,delete on table public.f50_research_memory to authenticated;

drop policy if exists "Admins manage F50 research runs" on public.f50_research_runs;
create policy "Admins manage F50 research runs"
on public.f50_research_runs for all
to authenticated
using (exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_admin))
with check (exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_admin));

drop policy if exists "Admins manage F50 candidates" on public.f50_candidates;
create policy "Admins manage F50 candidates"
on public.f50_candidates for all
to authenticated
using (exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_admin))
with check (exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_admin));

drop policy if exists "Admins manage F50 evidence" on public.f50_evidence_records;
create policy "Admins manage F50 evidence"
on public.f50_evidence_records for all
to authenticated
using (exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_admin))
with check (exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_admin));

drop policy if exists "Admins manage F50 memory" on public.f50_research_memory;
create policy "Admins manage F50 memory"
on public.f50_research_memory for all
to authenticated
using (exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_admin))
with check (exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_admin));
