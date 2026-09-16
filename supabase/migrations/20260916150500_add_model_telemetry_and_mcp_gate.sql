-- BOOM Brain v2: model telemetry + deterministic MCP access gate.

create table if not exists public.hunt_boom_model_observations (
  id bigint generated always as identity primary key,
  route_key text,
  task_class text,
  provider text not null,
  model text,
  success boolean not null,
  status_code integer,
  latency_ms integer check (latency_ms is null or latency_ms >= 0),
  quality_score numeric check (quality_score is null or quality_score between 0 and 1),
  estimated_cost_usd numeric check (estimated_cost_usd is null or estimated_cost_usd >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists hunt_boom_model_observations_route_idx
  on public.hunt_boom_model_observations(route_key,created_at desc);

alter table public.hunt_boom_model_observations enable row level security;
drop policy if exists "Admins manage BOOM model observations" on public.hunt_boom_model_observations;
create policy "Admins manage BOOM model observations"
on public.hunt_boom_model_observations for all to authenticated
using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_admin))
with check (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_admin));

revoke all on public.hunt_boom_model_observations from anon;
grant select,insert,update,delete on public.hunt_boom_model_observations to authenticated,service_role;
grant usage,select on sequence public.hunt_boom_model_observations_id_seq to authenticated,service_role;

create or replace function private.hunt_boom_mcp_access_decision(
  p_server_key text,
  p_requested_scopes jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path=public,private
as $$
declare
  s public.hunt_boom_mcp_registry%rowtype;
  scope text;
begin
  select * into s from public.hunt_boom_mcp_registry where server_key=p_server_key;
  if not found then return jsonb_build_object('allowed',false,'reason','server_not_registered'); end if;
  if not s.enabled then return jsonb_build_object('allowed',false,'reason','server_disabled'); end if;
  if not s.owner_approved then return jsonb_build_object('allowed',false,'reason','owner_approval_required'); end if;
  if s.auth_mode <> 'oauth2.1' then return jsonb_build_object('allowed',false,'reason','oauth21_required'); end if;
  if coalesce((s.metadata->>'pkce_required')::boolean,false) is not true
     or coalesce((s.metadata->>'audience_bound_tokens')::boolean,false) is not true
     or coalesce((s.metadata->>'token_passthrough_forbidden')::boolean,false) is not true
  then return jsonb_build_object('allowed',false,'reason','oauth_hardening_incomplete'); end if;
  if jsonb_typeof(coalesce(p_requested_scopes,'[]'::jsonb)) <> 'array'
  then return jsonb_build_object('allowed',false,'reason','invalid_scope_request'); end if;
  for scope in select jsonb_array_elements_text(coalesce(p_requested_scopes,'[]'::jsonb))
  loop
    if not (s.scopes ? scope) then
      return jsonb_build_object('allowed',false,'reason','scope_not_allowed','scope',scope);
    end if;
  end loop;
  return jsonb_build_object('allowed',true,'server_key',s.server_key,'protocol_version',s.protocol_version,'scopes',p_requested_scopes);
end $$;
