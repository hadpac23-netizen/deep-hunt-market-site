-- BOOM Brain v2 execution controls: bounded canary + team finalize/judge.

create or replace function private.hunt_boom_promote_shadow_to_canary(
  p_run_key text,
  p_owner_approved boolean,
  p_traffic_percent numeric
)
returns jsonb
language plpgsql
security invoker
set search_path=public,private
as $$
declare r public.hunt_boom_shadow_runs%rowtype;
begin
  select * into r from public.hunt_boom_shadow_runs where run_key=p_run_key for update;
  if not found then return jsonb_build_object('ok',false,'reason','run_not_found'); end if;
  if not coalesce(p_owner_approved,false) then return jsonb_build_object('ok',false,'reason','owner_approval_required'); end if;
  if r.run_mode <> 'shadow' or r.status <> 'passed' then return jsonb_build_object('ok',false,'reason','shadow_not_passed'); end if;
  if coalesce((r.comparison->>'safety_regression')::boolean,false) then return jsonb_build_object('ok',false,'reason','safety_regression'); end if;
  if p_traffic_percent <= 0 or p_traffic_percent > 10 then return jsonb_build_object('ok',false,'reason','traffic_out_of_bounds'); end if;
  update public.hunt_boom_shadow_runs
     set run_mode='canary',status='running',traffic_percent=p_traffic_percent,
         evidence=evidence||jsonb_build_array('owner_canary_approved','traffic_percent='||p_traffic_percent::text)
   where id=r.id;
  return jsonb_build_object('ok',true,'run_key',p_run_key,'run_mode','canary','traffic_percent',p_traffic_percent);
end $$;

create or replace function private.hunt_boom_rollback_canary(
  p_run_key text,
  p_reason text default 'rollback'
)
returns jsonb
language plpgsql
security invoker
set search_path=public,private
as $$
declare r public.hunt_boom_shadow_runs%rowtype;
begin
  select * into r from public.hunt_boom_shadow_runs where run_key=p_run_key for update;
  if not found then return jsonb_build_object('ok',false,'reason','run_not_found'); end if;
  if r.run_mode <> 'canary' then return jsonb_build_object('ok',false,'reason','not_canary'); end if;
  update public.hunt_boom_shadow_runs
     set traffic_percent=0,status='rolled_back',completed_at=now(),
         evidence=evidence||jsonb_build_array('rollback='||coalesce(p_reason,'rollback'))
   where id=r.id;
  return jsonb_build_object('ok',true,'run_key',p_run_key,'status','rolled_back','traffic_percent',0);
end $$;

create or replace function private.hunt_boom_finalize_team_shadow(
  p_run_key text,
  p_candidate_outputs jsonb,
  p_judge_verdict jsonb,
  p_evidence jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path=public,private
as $$
declare r public.hunt_boom_team_runs%rowtype; passed boolean;
begin
  select * into r from public.hunt_boom_team_runs where run_key=p_run_key for update;
  if not found then return jsonb_build_object('ok',false,'reason','run_not_found'); end if;
  if r.run_mode <> 'shadow' then return jsonb_build_object('ok',false,'reason','shadow_only'); end if;
  if coalesce(trim(r.judge_id),'')='' then return jsonb_build_object('ok',false,'reason','judge_required'); end if;
  if jsonb_typeof(p_candidate_outputs) <> 'array' then return jsonb_build_object('ok',false,'reason','outputs_must_be_array'); end if;
  if jsonb_array_length(p_candidate_outputs) <> jsonb_array_length(r.members)
  then return jsonb_build_object('ok',false,'reason','output_member_mismatch'); end if;
  if jsonb_typeof(p_judge_verdict) <> 'object' then return jsonb_build_object('ok',false,'reason','judge_verdict_required'); end if;
  passed:=coalesce((p_judge_verdict->>'passed')::boolean,false);
  update public.hunt_boom_team_runs
     set candidate_outputs=p_candidate_outputs,judge_verdict=p_judge_verdict,
         evidence=evidence||coalesce(p_evidence,'[]'::jsonb),
         status=case when passed then 'passed' else 'failed' end,
         completed_at=now()
   where id=r.id;
  return jsonb_build_object('ok',true,'run_key',p_run_key,'status',case when passed then 'passed' else 'failed' end,'judge_id',r.judge_id);
end $$;
