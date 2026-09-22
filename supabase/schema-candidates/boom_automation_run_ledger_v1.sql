-- BOOM Automation Durable Run Ledger V1 — SCHEMA CANDIDATE ONLY.
-- Do NOT apply to production until reviewed and converted into a canonical Supabase migration.
-- Security model: public schema + RLS + minimal grants + Owner/Admin policies.
-- No raw secrets or customer PII may be stored in these tables.

create table if not exists public.boom_automation_runs (
  run_id uuid primary key default gen_random_uuid(),
  mission_id uuid not null,
  workflow_id text not null,
  correlation_id uuid not null,
  owner_brain text not null,
  mode text not null default 'SHADOW',
  state text not null default 'READY',
  material_action text not null default 'none',
  material_action_suppressed boolean not null default true,
  retry_count integer not null default 0,
  max_retries integer not null default 2,
  current_stage text,
  input_summary jsonb not null default '{}'::jsonb,
  output_summary jsonb not null default '{}'::jsonb,
  error_code text,
  evidence_refs jsonb not null default '[]'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint boom_automation_runs_workflow_nonempty
    check (length(btrim(workflow_id)) > 0),
  constraint boom_automation_runs_owner_nonempty
    check (length(btrim(owner_brain)) > 0),
  constraint boom_automation_runs_mode_check
    check (mode in ('SHADOW','ACTIVE','GATED')),
  constraint boom_automation_runs_state_check
    check (state in ('DRAFT','READY','RUNNING','WAITING_OWNER','RETRY_WAIT','SUCCEEDED','FAILED','QUARANTINED','CANCELLED')),
  constraint boom_automation_runs_retry_check
    check (retry_count >= 0 and max_retries >= 0 and retry_count <= max_retries + 1),
  constraint boom_automation_runs_shadow_guard
    check (mode <> 'SHADOW' or material_action_suppressed = true)
);

create unique index if not exists boom_automation_runs_correlation_uidx
  on public.boom_automation_runs(correlation_id);

create index if not exists boom_automation_runs_workflow_state_idx
  on public.boom_automation_runs(workflow_id, state, updated_at desc);

create index if not exists boom_automation_runs_mission_idx
  on public.boom_automation_runs(mission_id, created_at desc);

create table if not exists public.boom_automation_run_events (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.boom_automation_runs(run_id) on delete cascade,
  event_type text not null,
  from_state text,
  to_state text,
  stage text,
  reason_code text,
  evidence_refs jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  actor_kind text not null default 'system',
  actor_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),

  constraint boom_automation_run_events_type_nonempty
    check (length(btrim(event_type)) > 0),
  constraint boom_automation_run_events_actor_check
    check (actor_kind in ('system','owner','admin','adapter'))
);

create index if not exists boom_automation_run_events_run_created_idx
  on public.boom_automation_run_events(run_id, created_at asc);

create table if not exists public.boom_automation_approvals (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.boom_automation_runs(run_id) on delete cascade,
  gate_key text not null,
  material_action text not null,
  decision text not null,
  reason text not null default '',
  decided_by uuid not null references auth.users(id) on delete restrict,
  decided_at timestamptz not null default now(),
  created_at timestamptz not null default now(),

  constraint boom_automation_approvals_gate_nonempty
    check (length(btrim(gate_key)) > 0),
  constraint boom_automation_approvals_action_nonempty
    check (length(btrim(material_action)) > 0),
  constraint boom_automation_approvals_decision_check
    check (decision in ('APPROVED','REJECTED')),
  unique (run_id, gate_key)
);

create index if not exists boom_automation_approvals_run_idx
  on public.boom_automation_approvals(run_id, decided_at desc);

alter table public.boom_automation_runs enable row level security;
alter table public.boom_automation_run_events enable row level security;
alter table public.boom_automation_approvals enable row level security;

drop policy if exists "admins_read_boom_automation_runs" on public.boom_automation_runs;
create policy "admins_read_boom_automation_runs"
on public.boom_automation_runs
for select
to authenticated
using ((select public.is_admin_user()));

drop policy if exists "admins_manage_boom_automation_runs" on public.boom_automation_runs;
create policy "admins_manage_boom_automation_runs"
on public.boom_automation_runs
for all
to authenticated
using ((select public.is_admin_user()))
with check ((select public.is_admin_user()));

drop policy if exists "admins_read_boom_automation_run_events" on public.boom_automation_run_events;
create policy "admins_read_boom_automation_run_events"
on public.boom_automation_run_events
for select
to authenticated
using ((select public.is_admin_user()));

drop policy if exists "admins_insert_boom_automation_run_events" on public.boom_automation_run_events;
create policy "admins_insert_boom_automation_run_events"
on public.boom_automation_run_events
for insert
to authenticated
with check ((select public.is_admin_user()));

drop policy if exists "admins_read_boom_automation_approvals" on public.boom_automation_approvals;
create policy "admins_read_boom_automation_approvals"
on public.boom_automation_approvals
for select
to authenticated
using ((select public.is_admin_user()));

drop policy if exists "admins_insert_boom_automation_approvals" on public.boom_automation_approvals;
create policy "admins_insert_boom_automation_approvals"
on public.boom_automation_approvals
for insert
to authenticated
with check (
  (select public.is_admin_user())
  and decided_by = (select auth.uid())
);

-- Client roles get only the DML required by RLS.
revoke all privileges on table public.boom_automation_runs from anon, authenticated;
revoke all privileges on table public.boom_automation_run_events from anon, authenticated;
revoke all privileges on table public.boom_automation_approvals from anon, authenticated;

grant select, insert, update on table public.boom_automation_runs to authenticated;
grant select, insert on table public.boom_automation_run_events to authenticated;
grant select, insert on table public.boom_automation_approvals to authenticated;

comment on table public.boom_automation_runs is
  'Durable BOOM automation run ledger. Metadata only; no secrets or customer PII.';
comment on table public.boom_automation_run_events is
  'Append-only BOOM automation state/evidence trace. Metadata only.';
comment on table public.boom_automation_approvals is
  'Owner/Admin decision evidence for material BOOM automation gates.';

do $assert$
declare
  v_rls integer;
  v_anon_privs integer;
  v_admin_policies integer;
begin
  select count(*) into v_rls
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public'
    and c.relname in ('boom_automation_runs','boom_automation_run_events','boom_automation_approvals')
    and c.relrowsecurity=true;

  if v_rls <> 3 then
    raise exception 'BOOM_AUTOMATION_LEDGER_HARDENING_FAILED: expected RLS on 3 tables, found %', v_rls;
  end if;

  select count(*) into v_anon_privs
  from information_schema.role_table_grants
  where table_schema='public'
    and table_name in ('boom_automation_runs','boom_automation_run_events','boom_automation_approvals')
    and grantee='anon';

  if v_anon_privs <> 0 then
    raise exception 'BOOM_AUTOMATION_LEDGER_HARDENING_FAILED: anon has % table privileges', v_anon_privs;
  end if;

  select count(*) into v_admin_policies
  from pg_catalog.pg_policies
  where schemaname='public'
    and tablename in ('boom_automation_runs','boom_automation_run_events','boom_automation_approvals');

  if v_admin_policies < 6 then
    raise exception 'BOOM_AUTOMATION_LEDGER_HARDENING_FAILED: expected at least 6 RLS policies, found %', v_admin_policies;
  end if;
end
$assert$;
