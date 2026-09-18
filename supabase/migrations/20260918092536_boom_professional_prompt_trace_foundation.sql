-- BOOM Professional Data Foundation
-- Adds only the two missing AI-engineering primitives:
-- 1) versioned prompts, 2) nested trace/session/span hierarchy.

create table if not exists public.hunt_boom_prompt_versions (
  id bigint generated always as identity primary key,
  prompt_key text not null,
  version integer not null check (version > 0),
  status text not null default 'draft'
    check (status in ('draft','candidate','active','retired')),
  environment text not null default 'studio',
  template_text text not null,
  template_hash text,
  variables jsonb not null default '{}'::jsonb,
  model_preferences jsonb not null default '{}'::jsonb,
  change_note text,
  source_commit text,
  owner_approval_required boolean not null default true,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  activated_at timestamptz,
  unique (prompt_key, version)
);

create unique index if not exists hunt_boom_prompt_versions_one_active_idx
  on public.hunt_boom_prompt_versions (prompt_key, environment)
  where status = 'active';

create index if not exists hunt_boom_prompt_versions_status_idx
  on public.hunt_boom_prompt_versions (status, updated_at desc);

create table if not exists public.hunt_boom_trace_spans (
  id bigint generated always as identity primary key,
  trace_id uuid not null default gen_random_uuid(),
  span_id uuid not null default gen_random_uuid() unique,
  parent_span_id uuid references public.hunt_boom_trace_spans(span_id) on delete set null,
  session_id text,
  span_type text not null default 'custom'
    check (span_type in ('trace','agent','model','tool','retrieval','event','custom')),
  name text not null,
  route_key text,
  provider text,
  model text,
  prompt_version_id bigint references public.hunt_boom_prompt_versions(id) on delete set null,
  status text not null default 'open',
  success boolean,
  latency_ms integer check (latency_ms is null or latency_ms >= 0),
  input_tokens bigint check (input_tokens is null or input_tokens >= 0),
  output_tokens bigint check (output_tokens is null or output_tokens >= 0),
  total_tokens bigint check (total_tokens is null or total_tokens >= 0),
  estimated_cost_usd numeric check (estimated_cost_usd is null or estimated_cost_usd >= 0),
  input_summary text,
  output_summary text,
  error_code text,
  metadata jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create index if not exists hunt_boom_trace_spans_trace_idx
  on public.hunt_boom_trace_spans (trace_id, started_at);

create index if not exists hunt_boom_trace_spans_session_idx
  on public.hunt_boom_trace_spans (session_id, started_at);
create index if not exists hunt_boom_trace_spans_parent_idx
  on public.hunt_boom_trace_spans (parent_span_id);
create index if not exists hunt_boom_trace_spans_prompt_idx
  on public.hunt_boom_trace_spans (prompt_version_id);
create index if not exists hunt_boom_trace_spans_route_idx
  on public.hunt_boom_trace_spans (route_key, started_at);
create index if not exists hunt_boom_trace_spans_status_idx
  on public.hunt_boom_trace_spans (status, started_at);

alter table public.hunt_boom_prompt_versions enable row level security;
alter table public.hunt_boom_trace_spans enable row level security;

revoke all on table public.hunt_boom_prompt_versions from anon, authenticated;
revoke all on table public.hunt_boom_trace_spans from anon, authenticated;
grant select, insert, update, delete on table public.hunt_boom_prompt_versions to authenticated;
grant select, insert, update, delete on table public.hunt_boom_trace_spans to authenticated;

revoke all on sequence public.hunt_boom_prompt_versions_id_seq from anon, authenticated;
revoke all on sequence public.hunt_boom_trace_spans_id_seq from anon, authenticated;
grant usage, select on sequence public.hunt_boom_prompt_versions_id_seq to authenticated;
grant usage, select on sequence public.hunt_boom_trace_spans_id_seq to authenticated;

create policy "Admins read BOOM prompt versions"
  on public.hunt_boom_prompt_versions for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin = true));
create policy "Admins create BOOM prompt versions"
  on public.hunt_boom_prompt_versions for insert to authenticated
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin = true));
create policy "Admins update BOOM prompt versions"
  on public.hunt_boom_prompt_versions for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin = true))
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin = true));
create policy "Admins delete BOOM prompt versions"
  on public.hunt_boom_prompt_versions for delete to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin = true));

create policy "Admins read BOOM trace spans"
  on public.hunt_boom_trace_spans for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin = true));
create policy "Admins create BOOM trace spans"
  on public.hunt_boom_trace_spans for insert to authenticated
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin = true));

create policy "Admins update BOOM trace spans"
  on public.hunt_boom_trace_spans for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin = true))
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin = true));
create policy "Admins delete BOOM trace spans"
  on public.hunt_boom_trace_spans for delete to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin = true));

comment on table public.hunt_boom_prompt_versions is
  'BOOM Owner/Admin prompt registry. Versions are explicit and never auto-published.';
comment on column public.hunt_boom_prompt_versions.owner_approval_required is
  'True means activation requires a separate Owner decision.';

comment on table public.hunt_boom_trace_spans is
  'Nested BOOM AI engineering spans grouped by session_id and trace_id.';
comment on column public.hunt_boom_trace_spans.input_summary is
  'Optional redacted summary; do not store secrets or unnecessary personal data.';
comment on column public.hunt_boom_trace_spans.output_summary is
  'Optional redacted summary; do not store secrets or unnecessary personal data.';
