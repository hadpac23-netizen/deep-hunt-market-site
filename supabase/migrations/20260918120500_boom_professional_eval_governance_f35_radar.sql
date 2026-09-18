-- BOOM Professional AI Engineering Governance + F35 Knowledge Radar
-- Owner/Admin only. This schema does not activate Production, payments, order routing,
-- publishing, spend, provider execution, or supplier execution.

create table if not exists public.hunt_boom_evaluator_registry (
  id bigint generated always as identity primary key,
  evaluator_key text not null,
  version integer not null check (version > 0),
  evaluator_type text not null
    check (evaluator_type in ('deterministic','llm_judge','classifier','human_rubric','hybrid')),
  status text not null default 'draft'
    check (status in ('draft','candidate','active','retired')),
  rubric jsonb not null default '{}'::jsonb,
  rubric_hash text,
  target_claim text,
  validity_checks jsonb not null default '[]'::jsonb,
  model_preferences jsonb not null default '{}'::jsonb,
  calibration_required boolean not null default true,
  owner_approval_required boolean not null default true,
  source_commit text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  activated_at timestamptz,
  unique (evaluator_key, version)
);

create unique index if not exists hunt_boom_evaluator_registry_one_active_idx
  on public.hunt_boom_evaluator_registry (evaluator_key)
  where status = 'active';

create table if not exists public.hunt_boom_human_alignment_runs (
  id bigint generated always as identity primary key,
  evaluator_id bigint not null references public.hunt_boom_evaluator_registry(id) on delete cascade,
  run_key text not null unique,
  dataset_ref text,
  sample_count integer not null check (sample_count > 0),
  human_reviewers integer not null default 1 check (human_reviewers > 0),
  agreement_rate numeric check (agreement_rate is null or (agreement_rate >= 0 and agreement_rate <= 1)),
  kappa numeric,
  false_positive_rate numeric check (false_positive_rate is null or (false_positive_rate >= 0 and false_positive_rate <= 1)),
  false_negative_rate numeric check (false_negative_rate is null or (false_negative_rate >= 0 and false_negative_rate <= 1)),
  status text not null default 'pending'
    check (status in ('pending','running','completed','failed')),
  evidence jsonb not null default '{}'::jsonb,
  owner_approved boolean not null default false,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.hunt_boom_online_eval_windows (
  id bigint generated always as identity primary key,
  window_key text not null unique,
  route_key text not null,
  task_class text,
  environment text not null default 'studio'
    check (environment in ('studio','alpha','production_shadow','production')),
  sampling_mode text not null default 'shadow'
    check (sampling_mode in ('shadow','sampled','full')),
  sample_rate numeric not null default 0 check (sample_rate >= 0 and sample_rate <= 1),
  window_start timestamptz not null,
  window_end timestamptz not null,
  sample_count integer not null default 0 check (sample_count >= 0),
  scored_count integer not null default 0 check (scored_count >= 0),
  passed_count integer not null default 0 check (passed_count >= 0),
  failed_count integer not null default 0 check (failed_count >= 0),
  average_score numeric,
  p95_latency_ms integer check (p95_latency_ms is null or p95_latency_ms >= 0),
  estimated_cost_usd numeric check (estimated_cost_usd is null or estimated_cost_usd >= 0),
  status text not null default 'pending'
    check (status in ('pending','running','completed','failed')),
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  check (window_end > window_start),
  check (scored_count <= sample_count),
  check (passed_count + failed_count <= scored_count)
);

create index if not exists hunt_boom_online_eval_windows_route_idx
  on public.hunt_boom_online_eval_windows (route_key, window_end desc);

create table if not exists public.hunt_boom_ci_quality_gates (
  id bigint generated always as identity primary key,
  gate_key text not null unique,
  scope text not null default 'studio'
    check (scope in ('studio','alpha','release_candidate','production')),
  metric_key text not null,
  operator text not null check (operator in ('>=','>','<=','<','==')),
  threshold numeric not null,
  min_samples integer not null default 1 check (min_samples > 0),
  blocks_merge boolean not null default true,
  enabled boolean not null default true,
  owner_approval_required boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hunt_boom_ci_quality_gate_runs (
  id bigint generated always as identity primary key,
  gate_id bigint not null references public.hunt_boom_ci_quality_gates(id) on delete cascade,
  run_key text not null unique,
  candidate_ref text not null,
  source_commit text,
  sample_count integer not null default 0 check (sample_count >= 0),
  metric_value numeric,
  passed boolean,
  status text not null default 'pending'
    check (status in ('pending','running','completed','failed')),
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists hunt_boom_ci_quality_gate_runs_gate_idx
  on public.hunt_boom_ci_quality_gate_runs (gate_id, created_at desc);

create table if not exists public.hunt_boom_f35_sources (
  id bigint generated always as identity primary key,
  source_key text not null unique,
  display_name text not null,
  source_type text not null
    check (source_type in ('official_docs','official_changelog','research','status','standards')),
  canonical_url text not null,
  domain text not null,
  priority integer not null default 50 check (priority between 1 and 100),
  freshness_hours integer not null default 168 check (freshness_hours > 0),
  enabled boolean not null default true,
  owner_approved boolean not null default true,
  notes text,
  last_checked_at timestamptz,
  last_changed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hunt_boom_f35_findings (
  id bigint generated always as identity primary key,
  source_id bigint references public.hunt_boom_f35_sources(id) on delete set null,
  finding_key text not null unique,
  observed_at timestamptz not null,
  published_at timestamptz,
  title text not null,
  summary text not null,
  evidence_url text,
  impact_area text not null
    check (impact_area in ('evals','observability','security','performance','supabase','models','agents','tooling','standards','other')),
  relevance_score numeric check (relevance_score is null or (relevance_score >= 0 and relevance_score <= 1)),
  confidence text not null default 'review_required'
    check (confidence in ('verified_official','cross_verified','review_required','rejected')),
  action_state text not null default 'review'
    check (action_state in ('review','backlog','implemented','no_action','rejected')),
  requires_owner_review boolean not null default true,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists hunt_boom_f35_findings_observed_idx
  on public.hunt_boom_f35_findings (observed_at desc);
create index if not exists hunt_boom_f35_findings_area_idx
  on public.hunt_boom_f35_findings (impact_area, observed_at desc);

alter table public.hunt_boom_evaluator_registry enable row level security;
alter table public.hunt_boom_human_alignment_runs enable row level security;
alter table public.hunt_boom_online_eval_windows enable row level security;
alter table public.hunt_boom_ci_quality_gates enable row level security;
alter table public.hunt_boom_ci_quality_gate_runs enable row level security;
alter table public.hunt_boom_f35_sources enable row level security;
alter table public.hunt_boom_f35_findings enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'hunt_boom_evaluator_registry',
    'hunt_boom_human_alignment_runs',
    'hunt_boom_online_eval_windows',
    'hunt_boom_ci_quality_gates',
    'hunt_boom_ci_quality_gate_runs',
    'hunt_boom_f35_sources',
    'hunt_boom_f35_findings'
  ]
  loop
    execute format('revoke all on table public.%I from anon, authenticated', t);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', t);
  end loop;
end $$;

do $$
declare
  seq text;
begin
  foreach seq in array array[
    'hunt_boom_evaluator_registry_id_seq',
    'hunt_boom_human_alignment_runs_id_seq',
    'hunt_boom_online_eval_windows_id_seq',
    'hunt_boom_ci_quality_gates_id_seq',
    'hunt_boom_ci_quality_gate_runs_id_seq',
    'hunt_boom_f35_sources_id_seq',
    'hunt_boom_f35_findings_id_seq'
  ]
  loop
    execute format('revoke all on sequence public.%I from anon, authenticated', seq);
    execute format('grant usage, select on sequence public.%I to authenticated', seq);
  end loop;
end $$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'hunt_boom_evaluator_registry',
    'hunt_boom_human_alignment_runs',
    'hunt_boom_online_eval_windows',
    'hunt_boom_ci_quality_gates',
    'hunt_boom_ci_quality_gate_runs',
    'hunt_boom_f35_sources',
    'hunt_boom_f35_findings'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', 'Admins read ' || t, t);
    execute format('drop policy if exists %I on public.%I', 'Admins create ' || t, t);
    execute format('drop policy if exists %I on public.%I', 'Admins update ' || t, t);
    execute format('drop policy if exists %I on public.%I', 'Admins delete ' || t, t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin = true))',
      'Admins read ' || t, t
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin = true))',
      'Admins create ' || t, t
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin = true)) with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin = true))',
      'Admins update ' || t, t
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin = true))',
      'Admins delete ' || t, t
    );
  end loop;
end $$;

comment on table public.hunt_boom_evaluator_registry is
  'Versioned BOOM evaluator/scorer registry. Activation is Owner-gated.';
comment on table public.hunt_boom_human_alignment_runs is
  'Human-vs-evaluator calibration evidence. Completed measured runs only count toward readiness.';
comment on table public.hunt_boom_online_eval_windows is
  'Read-only evidence windows for sampled/shadow online evaluation. Does not itself enable production traffic.';
comment on table public.hunt_boom_ci_quality_gates is
  'Owner-gated quality thresholds for release evidence. No automatic merge is authorized by schema state.';
comment on table public.hunt_boom_f35_sources is
  'Curated official/research sources for BOOM F35 knowledge freshness checks.';
comment on table public.hunt_boom_f35_findings is
  'Evidence-first F35 findings. Findings require review and cannot self-activate product behavior.';
