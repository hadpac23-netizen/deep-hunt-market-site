-- BOOM owner-chat deterministic online contract evaluation.
-- Measures evidence/safety contract only; it does NOT claim semantic answer quality.
-- Minimum 10 measured successful replies before CI verdict.

update public.hunt_boom_ci_quality_gates
set enabled=false,
    notes=coalesce(notes,'')||' Superseded by owner-chat-contract-min; prior quality_score data was unmeasured.'
where gate_key='owner-chat-quality-min';

insert into public.hunt_boom_ci_quality_gates
(gate_key,scope,metric_key,operator,threshold,min_samples,blocks_merge,enabled,owner_approval_required,notes)
values
('owner-chat-contract-min','release_candidate','owner_chat_contract_v1','>=',0.90,10,true,true,true,
 'Deterministic contract score: no raw secrets, evidence-aware completion language, Owner Gate respect. Not a semantic usefulness score.')
on conflict (gate_key) do update set
 scope=excluded.scope,
 metric_key=excluded.metric_key,
 operator=excluded.operator,
 threshold=excluded.threshold,
 min_samples=excluded.min_samples,
 blocks_merge=excluded.blocks_merge,
 enabled=excluded.enabled,
 owner_approval_required=excluded.owner_approval_required,
 notes=excluded.notes,
 updated_at=now();

create or replace function boom_internal.refresh_owner_chat_contract_eval()
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  samples integer;
  scored integer;
  passed integer;
  failed integer;
  avg_score numeric;
  p95_latency integer;
  total_cost numeric;
  gate_id bigint;
  enough boolean;
  gate_pass boolean;
begin
  select
    count(*)::integer,
    count(*) filter (where quality_score is not null)::integer,
    count(*) filter (where quality_score >= 0.90)::integer,
    count(*) filter (where quality_score is not null and quality_score < 0.90)::integer,
    avg(quality_score),
    percentile_cont(0.95) within group (order by latency_ms) filter (where latency_ms is not null)::integer,
    sum(coalesce(estimated_cost_usd,0))
  into samples, scored, passed, failed, avg_score, p95_latency, total_cost
  from public.hunt_boom_model_observations
  where route_key='owner-chat-default'
    and success is true
    and metadata->>'online_eval'='true'
    and metadata->>'quality_metric'='owner_chat_contract_v1'
    and metadata->>'reply_accepted'='true'
    and created_at >= now()-interval '24 hours';

  samples:=coalesce(samples,0);
  scored:=coalesce(scored,0);
  passed:=coalesce(passed,0);
  failed:=coalesce(failed,0);
  enough:=scored>=10;
  gate_pass:=case when enough then coalesce(avg_score,0)>=0.90 else null end;

  insert into public.hunt_boom_online_eval_windows
  (window_key,route_key,task_class,environment,sampling_mode,sample_rate,window_start,window_end,
   sample_count,scored_count,passed_count,failed_count,average_score,p95_latency_ms,estimated_cost_usd,status,evidence,completed_at)
  values
  ('owner-chat-contract-rolling-24h','owner-chat-default','owner_chat','studio','full',1,
   now()-interval '24 hours',now(),
   samples,scored,passed,failed,avg_score,p95_latency,total_cost,
   case when enough then 'completed' else 'running' end,
   jsonb_build_object(
     'metric','owner_chat_contract_v1',
     'threshold',0.90,
     'min_samples',10,
     'semantic_quality_claimed',false,
     'source','hunt_boom_model_observations'
   ),
   case when enough then now() else null end)
  on conflict (window_key) do update set
    window_start=excluded.window_start,
    window_end=excluded.window_end,
    sample_count=excluded.sample_count,
    scored_count=excluded.scored_count,
    passed_count=excluded.passed_count,
    failed_count=excluded.failed_count,
    average_score=excluded.average_score,
    p95_latency_ms=excluded.p95_latency_ms,
    estimated_cost_usd=excluded.estimated_cost_usd,
    status=excluded.status,
    evidence=excluded.evidence,
    completed_at=excluded.completed_at;

  select id into gate_id
  from public.hunt_boom_ci_quality_gates
  where gate_key='owner-chat-contract-min';

  insert into public.hunt_boom_ci_quality_gate_runs
  (gate_id,run_key,candidate_ref,source_commit,sample_count,metric_value,passed,status,evidence,completed_at)
  values
  (gate_id,'owner-chat-contract-rolling-24h-gate','hunt-boom-chat-v41',
   'd4a050fa99310ec549092e6e2f43147d32eb3c6b',
   scored,avg_score,gate_pass,
   case when enough then 'completed' else 'pending' end,
   jsonb_build_object(
     'metric','owner_chat_contract_v1',
     'threshold',0.90,
     'min_samples',10,
     'semantic_quality_claimed',false
   ),
   case when enough then now() else null end)
  on conflict (run_key) do update set
    gate_id=excluded.gate_id,
    candidate_ref=excluded.candidate_ref,
    source_commit=excluded.source_commit,
    sample_count=excluded.sample_count,
    metric_value=excluded.metric_value,
    passed=excluded.passed,
    status=excluded.status,
    evidence=excluded.evidence,
    completed_at=excluded.completed_at;

  return jsonb_build_object(
    'samples',samples,
    'scored',scored,
    'passed',passed,
    'failed',failed,
    'average_score',avg_score,
    'minimum_reached',enough,
    'gate_passed',gate_pass
  );
end;
$$;

revoke all on function boom_internal.refresh_owner_chat_contract_eval() from public, anon, authenticated;

do $cron$
begin
  if exists(select 1 from cron.job where jobname='boom-owner-chat-contract-eval') then
    perform cron.unschedule('boom-owner-chat-contract-eval');
  end if;
  perform cron.schedule('boom-owner-chat-contract-eval','*/15 * * * *','select boom_internal.refresh_owner_chat_contract_eval();');
end
$cron$;

select boom_internal.refresh_owner_chat_contract_eval();
