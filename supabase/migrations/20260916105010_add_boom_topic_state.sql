-- Persistent BOOM topic continuity for the owner.
-- Stores only working-context state; conversation messages remain in hunt_boom_chat.

create table if not exists public.hunt_boom_topic_state (
  owner_id uuid primary key references public.profiles(id) on delete cascade,
  active_topic text not null default 'HUNT / BOOM',
  active_goal text,
  current_task text,
  previous_task text,
  unresolved_items jsonb not null default '[]'::jsonb,
  decisions_made jsonb not null default '[]'::jsonb,
  constraints jsonb not null default '[]'::jsonb,
  owner_last_instruction text,
  next_expected_step text,
  relevant_project text not null default 'HUNT',
  relevant_managers jsonb not null default '[]'::jsonb,
  relevant_verified_evidence jsonb not null default '[]'::jsonb,
  last_execution_state jsonb not null default '{}'::jsonb,
  topic_history jsonb not null default '[]'::jsonb,
  conversation_id uuid,
  updated_at timestamptz not null default now()
);

alter table public.hunt_boom_topic_state enable row level security;

drop policy if exists "Admins manage BOOM topic state"
  on public.hunt_boom_topic_state;
create policy "Admins manage BOOM topic state"
on public.hunt_boom_topic_state
for all
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id=(select auth.uid()) and p.is_admin
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id=(select auth.uid()) and p.is_admin
  )
);

create index if not exists hunt_boom_topic_state_updated_idx
  on public.hunt_boom_topic_state(updated_at desc);

revoke all privileges on table public.hunt_boom_topic_state from anon;
grant select,insert,update,delete on table public.hunt_boom_topic_state to authenticated;
grant select,insert,update,delete on table public.hunt_boom_topic_state to service_role;
