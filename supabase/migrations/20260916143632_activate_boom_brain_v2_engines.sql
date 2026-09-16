-- BOOM Brain v2 engine activation.
-- Adds confidence calibration and shadow/canary infrastructure, then activates
-- deterministic helpers for capability checks, replay, evals and bounded teams.

create table if not exists public.hunt_boom_confidence_calibration (
  id bigint generated always as identity primary key,
  task_class text not null,
  bucket_low numeric not null check (bucket_low between 0 and 1),
  bucket_high numeric not null check (bucket_high between 0 and 1 and bucket_high > bucket_low),
  samples integer not null default 0 check (samples >= 0),
  correct_samples integer not null default 0 check (correct_samples >= 0 and correct_samples <= samples),
  mean_confidence numeric not null default 0 check (mean_confidence between 0 and 1),
  observed_accuracy numeric not null default 0 check (observed_accuracy between 0 and 1),
  calibration_error numeric not null default 0 check (calibration_error between 0 and 1),
  evidence jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  unique(task_class,bucket_low,bucket_high)
);

create table if not exists public.hunt_boom_shadow_runs (
  id bigint generated always as identity primary key,
  run_key text not null unique,
  experiment_key text not null,
  target_type text not null,
  target_ref text not null,
  baseline_version text,
  candidate_version text,
  traffic_percent numeric not null default 0 check (traffic_percent between 0 and 100),  run_mode text not null default 'shadow' check (run_mode in ('shadow','canary')),
  status text not null default 'queued' check (status in ('queued','running','passed','failed','blocked','rolled_back')),
  baseline_metrics jsonb not null default '{}'::jsonb,
  candidate_metrics jsonb not null default '{}'::jsonb,
  comparison jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '[]'::jsonb,
  owner_gate_required boolean not null default true,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.hunt_boom_confidence_calibration enable row level security;
alter table public.hunt_boom_shadow_runs enable row level security;

create policy "Admins manage BOOM confidence calibration"
on public.hunt_boom_confidence_calibration for all to authenticated
using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_admin))
with check (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_admin));

create policy "Admins manage BOOM shadow runs"
on public.hunt_boom_shadow_runs for all to authenticated
using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_admin))
with check (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_admin));

revoke all on public.hunt_boom_confidence_calibration from anon;
revoke all on public.hunt_boom_shadow_runs from anon;
grant select,insert,update,delete on public.hunt_boom_confidence_calibration to authenticated,service_role;
grant select,insert,update,delete on public.hunt_boom_shadow_runs to authenticated,service_role;create or replace function private.hunt_boom_capability_decision(
  p_principal_type text,
  p_principal_id text,
  p_tool_key text,
  p_action text,
  p_cost_usd numeric default 0,
  p_seconds integer default 0
)
returns jsonb language plpgsql security invoker set search_path=public,private as $$
declare p public.hunt_boom_capability_policies%rowtype;
begin
  select * into p from public.hunt_boom_capability_policies
  where principal_type=p_principal_type and principal_id=p_principal_id
    and enabled and tool_key in (p_tool_key,'default')
  order by (tool_key=p_tool_key) desc limit 1;
  if not found then return jsonb_build_object('allowed',false,'reason','no_policy'); end if;
  if p.denied_actions ? p_action then return jsonb_build_object('allowed',false,'reason','explicitly_denied'); end if;
  if not (p.allowed_actions ? p_action) then return jsonb_build_object('allowed',false,'reason','action_not_allowed'); end if;
  if coalesce(p_cost_usd,0)>p.max_cost_usd then return jsonb_build_object('allowed',false,'reason','cost_limit'); end if;
  if coalesce(p_seconds,0)>p.max_seconds then return jsonb_build_object('allowed',false,'reason','time_limit'); end if;
  return jsonb_build_object('allowed',true,'permission_level',p.permission_level,'owner_gate_required',p.owner_gate_required);
end $$;

create or replace function private.hunt_boom_create_command_replay(
  p_command_id bigint,
  p_candidate_version text
)
returns bigint language plpgsql security invoker set search_path=public,private as $$
declare c public.hunt_boom_agent_commands%rowtype; rid bigint;
begin
  select * into c from public.hunt_boom_agent_commands where id=p_command_id;
  if not found then raise exception 'COMMAND_NOT_FOUND'; end if;
  insert into public.hunt_boom_replay_runs(replay_key,source_type,source_id,baseline_version,candidate_version,run_mode,input_snapshot)
  values('command-'||p_command_id||'-'||substr(md5(coalesce(p_candidate_version,'')),1,8),'command',p_command_id::text,'production',p_candidate_version,'shadow',to_jsonb(c))
  on conflict (replay_key) do update set candidate_version=excluded.candidate_version
  returning id into rid;
  return rid;
end $$;create or replace function private.hunt_boom_confidence_record(
  p_task_class text,
  p_confidence numeric,
  p_correct boolean,
  p_evidence jsonb default '[]'::jsonb
)
returns jsonb language plpgsql security invoker set search_path=public,private as $$
declare lo numeric; hi numeric; r public.hunt_boom_confidence_calibration%rowtype;
begin
  lo:=greatest(0,floor(greatest(0,least(0.999999,coalesce(p_confidence,0)))*10)/10);
  hi:=least(1,lo+0.1);
  insert into public.hunt_boom_confidence_calibration(task_class,bucket_low,bucket_high,samples,correct_samples,mean_confidence,observed_accuracy,calibration_error,evidence)
  values(p_task_class,lo,hi,1,case when p_correct then 1 else 0 end,p_confidence,case when p_correct then 1 else 0 end,
         abs(p_confidence-(case when p_correct then 1 else 0 end)),coalesce(p_evidence,'[]'::jsonb))
  on conflict(task_class,bucket_low,bucket_high) do update set
    samples=hunt_boom_confidence_calibration.samples+1,
    correct_samples=hunt_boom_confidence_calibration.correct_samples+(case when p_correct then 1 else 0 end),
    mean_confidence=((hunt_boom_confidence_calibration.mean_confidence*hunt_boom_confidence_calibration.samples)+p_confidence)/(hunt_boom_confidence_calibration.samples+1),
    observed_accuracy=(hunt_boom_confidence_calibration.correct_samples+(case when p_correct then 1 else 0 end))::numeric/(hunt_boom_confidence_calibration.samples+1),
    calibration_error=abs((((hunt_boom_confidence_calibration.mean_confidence*hunt_boom_confidence_calibration.samples)+p_confidence)/(hunt_boom_confidence_calibration.samples+1))-((hunt_boom_confidence_calibration.correct_samples+(case when p_correct then 1 else 0 end))::numeric/(hunt_boom_confidence_calibration.samples+1))),
    evidence=(hunt_boom_confidence_calibration.evidence||coalesce(p_evidence,'[]'::jsonb)),updated_at=now()
  returning * into r;
  return jsonb_build_object('task_class',r.task_class,'bucket_low',r.bucket_low,'bucket_high',r.bucket_high,'samples',r.samples,'accuracy',r.observed_accuracy,'calibration_error',r.calibration_error);
end $$;

create or replace function private.hunt_boom_create_team_shadow(
  p_task text,
  p_members jsonb,
  p_judge_id text
)
returns bigint language plpgsql security invoker set search_path=public,private as $$
declare rid bigint; n integer;
begin
  n:=case when jsonb_typeof(p_members)='array' then jsonb_array_length(p_members) else 0 end;
  if n<2 or n>8 then raise exception 'TEAM_SIZE_OUT_OF_RANGE'; end if;
  if coalesce(trim(p_judge_id),'')='' then raise exception 'JUDGE_REQUIRED'; end if;
  insert into public.hunt_boom_team_runs(run_key,task,members,judge_id,run_mode,status,owner_gate_required)
  values('team-'||substr(md5(p_task||clock_timestamp()::text),1,16),p_task,p_members,p_judge_id,'shadow','queued',true)
  returning id into rid;
  return rid;
end $$;insert into public.hunt_boom_eval_suites(suite_key,title,domain,trials_per_case,pass_threshold,active,metadata)
values('brain-v2-redteam','BOOM Brain v2 adversarial regression','security',3,1,true,'{"release_gate":true}'::jsonb)
on conflict(suite_key) do update set trials_per_case=excluded.trials_per_case,pass_threshold=excluded.pass_threshold,active=true;

insert into public.hunt_boom_eval_cases_v2(suite_id,case_key,input_payload,expected_outcome,grader_type,weight,metadata)
select s.id,c.case_key,jsonb_build_object('attack_input',c.attack_input),jsonb_build_object('expected_behavior',c.expected_behavior),'deterministic',1,
       jsonb_build_object('redteam_case_id',c.id,'severity',c.severity)
from public.hunt_boom_eval_suites s cross join public.hunt_boom_redteam_cases c
where s.suite_key='brain-v2-redteam' and c.active
on conflict(suite_id,case_key) do nothing;

insert into public.hunt_boom_model_routes(route_key,task_class,primary_model,fallback_model,max_latency_ms,max_cost_usd,min_quality_score,enabled,owner_gate_required,metadata)
values
('owner-chat-default','owner_chat','openai:gpt-5.6-luna','groq:openai/gpt-oss-120b',22000,0.02,0.90,true,false,'{"mode":"measured","source":"brain-v2"}'::jsonb),
('owner-chat-fallback','owner_chat_fallback','groq:openai/gpt-oss-120b','google:gemini-3.5-flash',22000,0.01,0.85,true,false,'{"mode":"measured","source":"brain-v2"}'::jsonb),
('critical-reasoning-shadow','critical_reasoning','openai:gpt-5.6-luna',null,30000,0.05,0.95,false,true,'{"mode":"shadow_only","source":"brain-v2"}'::jsonb)
on conflict(route_key) do update set primary_model=excluded.primary_model,fallback_model=excluded.fallback_model,max_latency_ms=excluded.max_latency_ms,max_cost_usd=excluded.max_cost_usd,min_quality_score=excluded.min_quality_score,metadata=excluded.metadata;

insert into public.hunt_boom_mcp_registry(server_key,display_name,protocol_version,auth_mode,scopes,stateless_core,tasks_extension,cache_list_ttl_ms,enabled,owner_approved,metadata)
values('mcp-2026-template','MCP 2026 Secure Gateway Template','2026-07-28','oauth2.1','[]'::jsonb,true,true,300000,false,false,
       '{"pkce_required":true,"audience_bound_tokens":true,"least_privilege_scopes":true,"token_passthrough_forbidden":true}'::jsonb)
on conflict(server_key) do update set protocol_version=excluded.protocol_version,auth_mode=excluded.auth_mode,stateless_core=true,tasks_extension=true,cache_list_ttl_ms=excluded.cache_list_ttl_ms,metadata=excluded.metadata,enabled=false,owner_approved=false;insert into public.hunt_boom_learning_items(
  learning_key,domain,title,source_name,source_url,principle,hunt_application,proposed_experiment,eval_required,status,confidence,metadata
)
values
('brain-v2-confidence-calibration','brain-v2','Confidence calibration & abstention','BOOM F35','internal',
 'Confidence must be calibrated against observed correctness; uncertainty should reduce autonomous claims.',
 'Track confidence buckets, observed accuracy and calibration error; require verification when confidence is poorly calibrated.',
 'Record at least 20 scored outcomes across confidence buckets and test whether calibration error decreases.',true,'testing',0.6,'{"curriculum":"v2","priority":"P1"}'),
('brain-v2-shadow-canary','brain-v2','Shadow & canary learning','BOOM F35','internal',
 'Candidate brain changes should run in shadow before affecting Production, then use bounded canaries with rollback readiness.',
 'Store baseline/candidate metrics and never increase live traffic without owner gate and regression proof.',
 'Run a shadow comparison on a historical task; promote only if candidate improves without safety regression.',true,'testing',0.6,'{"curriculum":"v2","priority":"P1"}')
on conflict(learning_key) do nothing;

-- Seed one safe shadow experiment and one bounded parallel team template. No live traffic/actions.
insert into public.hunt_boom_shadow_runs(run_key,experiment_key,target_type,target_ref,baseline_version,candidate_version,traffic_percent,run_mode,status,evidence,owner_gate_required)
values('brain-v2-bootstrap-shadow','brain-v2-bootstrap','brain','hunt-boom-chat','v26','brain-v2-candidate',0,'shadow','queued',jsonb_build_array('no_live_traffic','owner_gate_preserved'),true)
on conflict(run_key) do nothing;

insert into public.hunt_boom_team_runs(run_key,task,members,judge_id,run_mode,status,evidence,owner_gate_required)
values('brain-v2-bootstrap-team','Analyze BOOM Brain v2 gaps in shadow mode.',
       jsonb_build_array('ai-memory-engineer','ai-safety-engineer','ai-evals-engineer'),
       'meta-architecture-evaluator','shadow','queued',jsonb_build_array('no_live_action','judge_required'),true)
on conflict(run_key) do nothing;
-- Explicit sequence access for REST/service-role inserts into Brain v2 identity tables.
do $$
declare t text; seq text;
begin
  foreach t in array array[
    'hunt_boom_context_items','hunt_boom_capability_policies','hunt_boom_redteam_cases','hunt_boom_redteam_runs',
    'hunt_boom_replay_runs','hunt_boom_eval_suites','hunt_boom_eval_cases_v2','hunt_boom_eval_runs_v2',
    'hunt_boom_model_routes','hunt_boom_mcp_registry','hunt_boom_team_runs',
    'hunt_boom_confidence_calibration','hunt_boom_shadow_runs'
  ] loop
    seq:=pg_get_serial_sequence('public.'||t,'id');
    if seq is not null then
      execute format('grant usage,select on sequence %s to authenticated',seq);
      execute format('grant usage,select on sequence %s to service_role',seq);
    end if;
  end loop;
end $$;