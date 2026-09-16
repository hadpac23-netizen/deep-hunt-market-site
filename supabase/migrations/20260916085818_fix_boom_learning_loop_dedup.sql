-- BOOM learning-loop hardening (QA branch only until explicitly applied).
-- Goal: one active problem -> one active command; one active focus -> one cycle.
-- This migration is intentionally not applied to Production by this QA task.

alter table public.hunt_boom_agent_commands
  add column if not exists problem_key text,
  add column if not exists repeat_count integer not null default 0,
  add column if not exists latest_report_id bigint;

update public.hunt_boom_agent_commands
set problem_key = case
  when issued_by='boom-super-agent'
   and target_manager_id is not null
   and title like 'Resolve % state:%'
    then 'manager-health:'||target_manager_id
  else 'command:'||command_key
end
where problem_key is null;

with ranked as (
  select id,
         row_number() over (
           partition by problem_key
           order by created_at desc,id desc
         ) as rn
  from public.hunt_boom_agent_commands
  where status in ('queued','accepted','running','waiting_owner')
    and problem_key like 'manager-health:%'
)
update public.hunt_boom_agent_commands c
set status='superseded',
    updated_at=now(),
    evidence=coalesce(c.evidence,'[]'::jsonb)
      || jsonb_build_array('legacy_duplicate_superseded')
from ranked r
where c.id=r.id and r.rn>1;
with ranked as (
  select id,
         row_number() over (
           partition by started_by,focus
           order by started_at asc,id asc
         ) as rn
  from public.hunt_boom_improvement_cycles
  where status in ('running','evaluating')
)
update public.hunt_boom_improvement_cycles c
set status='killed',
    evaluated_at=coalesce(c.evaluated_at,now()),
    verdict=coalesce(c.verdict,'superseded_duplicate_cycle'),
    result=coalesce(c.result,'{}'::jsonb)
      || jsonb_build_object('dedup_reason','legacy_duplicate_cycle')
from ranked r
where c.id=r.id and r.rn>1;

with ranked as (
  select id,
         row_number() over (
           partition by cycle_id,metric_name
           order by created_at desc,id desc
         ) as rn
  from public.hunt_boom_evals
  where cycle_id is not null
)
delete from public.hunt_boom_evals e
using ranked r
where e.id=r.id and r.rn>1;

create unique index if not exists hunt_boom_open_problem_uidx
  on public.hunt_boom_agent_commands(problem_key)
  where problem_key is not null
    and status in ('queued','accepted','running','waiting_owner');

create unique index if not exists hunt_boom_active_cycle_focus_uidx
  on public.hunt_boom_improvement_cycles(started_by,focus)
  where status in ('running','evaluating');

create unique index if not exists hunt_boom_cycle_metric_uidx
  on public.hunt_boom_evals(cycle_id,metric_name)
  where cycle_id is not null;
create or replace function private.hunt_boom_command_dedup_guard()
returns trigger
language plpgsql
security invoker
set search_path=public,private
as $$
declare
  v_existing_id bigint;
begin
  if new.problem_key is null then
    if new.issued_by='boom-super-agent'
       and new.target_manager_id is not null
       and new.title like 'Resolve % state:%' then
      new.problem_key:='manager-health:'||new.target_manager_id;
    else
      new.problem_key:='command:'||new.command_key;
    end if;
  end if;

  if new.command_key ~ '^report-[0-9]+$' then
    new.latest_report_id:=substring(new.command_key from 8)::bigint;
  end if;

  if new.status in ('queued','accepted','running','waiting_owner') then
    perform pg_advisory_xact_lock(hashtextextended(new.problem_key,0));

    update public.hunt_boom_agent_commands c
    set priority=greatest(c.priority,new.priority),
        status=case
          when new.status='waiting_owner' then 'waiting_owner'
          when c.status in ('accepted','running') then c.status
          else new.status
        end,
        action_class=new.action_class,
        title=new.title,
        instruction=new.instruction,
        reason=new.reason,
        evidence=new.evidence,
        expected_result=new.expected_result,
        success_metric=new.success_metric,
        owner_approval_required=new.owner_approval_required,
        expires_at=new.expires_at,
        updated_at=coalesce(new.updated_at,now()),
        repeat_count=c.repeat_count+1,
        latest_report_id=coalesce(new.latest_report_id,c.latest_report_id)
    where c.problem_key=new.problem_key
      and c.status in ('queued','accepted','running','waiting_owner')
    returning c.id into v_existing_id;

    if v_existing_id is not null then
      return null;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists hunt_boom_command_dedup_guard
  on public.hunt_boom_agent_commands;
create trigger hunt_boom_command_dedup_guard
before insert on public.hunt_boom_agent_commands
for each row execute function private.hunt_boom_command_dedup_guard();

create or replace function private.hunt_boom_cycle_reuse_guard()
returns trigger
language plpgsql
security invoker
set search_path=public,private
as $$
declare
  v_existing_id bigint;
begin
  if new.status in ('running','evaluating') then
    perform pg_advisory_xact_lock(
      hashtextextended(coalesce(new.started_by,'')||':'||coalesce(new.focus,''),0)
    );

    select id into v_existing_id
    from public.hunt_boom_improvement_cycles
    where started_by=new.started_by
      and focus=new.focus
      and status in ('running','evaluating')
    order by started_at asc,id asc
    limit 1
    for update;

    if v_existing_id is not null then
      update public.hunt_boom_improvement_cycles c
      set cycle_key=new.cycle_key,
          planned_changes=coalesce(c.planned_changes,'[]'::jsonb)
            || jsonb_build_array(
              jsonb_build_object(
                'observed_at',now(),
                'incoming_cycle_key',new.cycle_key
              )
            ),
          owner_approval_required=
            coalesce(c.owner_approval_required,false)
            or coalesce(new.owner_approval_required,false)
      where c.id=v_existing_id;
      return null;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists hunt_boom_cycle_reuse_guard
  on public.hunt_boom_improvement_cycles;
create trigger hunt_boom_cycle_reuse_guard
before insert on public.hunt_boom_improvement_cycles
for each row execute function private.hunt_boom_cycle_reuse_guard();
create or replace function private.hunt_boom_cycle_close_guard()
returns trigger
language plpgsql
security invoker
set search_path=public,private
as $$
begin
  if new.status='evaluating'
     and coalesce((new.result->>'attention')::integer,1)=0 then
    new.status:='kept';
    new.evaluated_at:=coalesce(new.evaluated_at,now());
    new.verdict:=coalesce(new.verdict,'passed');
  end if;
  return new;
end;
$$;

drop trigger if exists hunt_boom_cycle_close_guard
  on public.hunt_boom_improvement_cycles;
create trigger hunt_boom_cycle_close_guard
before update on public.hunt_boom_improvement_cycles
for each row execute function private.hunt_boom_cycle_close_guard();

create or replace function private.hunt_boom_eval_upsert_guard()
returns trigger
language plpgsql
security invoker
set search_path=public,private
as $$
declare
  v_existing_id bigint;
begin
  if new.cycle_id is null then
    return new;
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(new.cycle_id::text||':'||new.metric_name,0)
  );
  update public.hunt_boom_evals e
  set eval_key=new.eval_key,
      subject_type=new.subject_type,
      subject_key=new.subject_key,
      baseline=coalesce(e.baseline,new.baseline),
      current_value=new.current_value,
      target=new.target,
      passed=new.passed,
      evidence=new.evidence,
      notes=new.notes,
      created_at=coalesce(new.created_at,now())
  where e.cycle_id=new.cycle_id
    and e.metric_name=new.metric_name
  returning e.id into v_existing_id;

  if v_existing_id is not null then
    return null;
  end if;

  return new;
end;
$$;

drop trigger if exists hunt_boom_eval_upsert_guard
  on public.hunt_boom_evals;
create trigger hunt_boom_eval_upsert_guard
before insert on public.hunt_boom_evals
for each row execute function private.hunt_boom_eval_upsert_guard();

create or replace function private.hunt_boom_refresh_learning_evals()
returns trigger
language plpgsql
security invoker
set search_path=public,private
as $$
declare
  v_total_commands numeric:=0;
  v_done_commands numeric:=0;
  v_open_commands numeric:=0;
  v_duplicate_active numeric:=0;
  v_done_with_evidence numeric:=0;
  v_total_cycles numeric:=0;
  v_closed_cycles numeric:=0;
  v_duplicate_rate numeric:=0;
  v_command_closure numeric:=0;
  v_cycle_closure numeric:=0;
  v_evidence_rate numeric:=0;
begin
  select count(*)::numeric,
         count(*) filter(where status='done')::numeric,
         count(*) filter(
           where status in ('queued','accepted','running','waiting_owner')
         )::numeric,
         count(*) filter(
           where status='done'
             and evidence is not null
             and evidence not in ('[]'::jsonb,'{}'::jsonb)
         )::numeric
  into v_total_commands,v_done_commands,v_open_commands,v_done_with_evidence
  from public.hunt_boom_agent_commands;

  select coalesce(sum(n-1),0)::numeric
  into v_duplicate_active
  from (
    select problem_key,count(*)::numeric n
    from public.hunt_boom_agent_commands
    where problem_key is not null
      and status in ('queued','accepted','running','waiting_owner')
    group by problem_key
    having count(*)>1
  ) d;

  select count(*)::numeric,
         count(*) filter(
           where evaluated_at is not null
              or status in ('kept','killed','blocked')
         )::numeric
  into v_total_cycles,v_closed_cycles
  from public.hunt_boom_improvement_cycles;

  v_duplicate_rate:=case when v_open_commands=0 then 0
    else v_duplicate_active/v_open_commands end;
  v_command_closure:=case when v_total_commands=0 then 1
    else v_done_commands/v_total_commands end;
  v_cycle_closure:=case when v_total_cycles=0 then 1
    else v_closed_cycles/v_total_cycles end;
  v_evidence_rate:=case when v_done_commands=0 then 1
    else v_done_with_evidence/v_done_commands end;

  insert into public.hunt_boom_evals
    (eval_key,cycle_id,subject_type,subject_key,metric_name,
     baseline,current_value,target,passed,evidence,notes)
  values
    (new.cycle_key||'-command-duplicate-rate',new.id,'meta-cycle',
     new.cycle_key,'command_duplicate_rate',
     null,v_duplicate_rate,0,v_duplicate_rate=0,
     jsonb_build_array('duplicate_active='||v_duplicate_active,
                       'open_commands='||v_open_commands),
     'One active problem must map to one active command.'),

    (new.cycle_key||'-cycle-closure-rate',new.id,'meta-cycle',
     new.cycle_key,'cycle_closure_rate',
     null,v_cycle_closure,1,v_cycle_closure=1,
     jsonb_build_array('closed_cycles='||v_closed_cycles,
                       'total_cycles='||v_total_cycles),
     'Cycles must close with evidence instead of accumulating forever.'),

    (new.cycle_key||'-command-closure-rate',new.id,'meta-cycle',
     new.cycle_key,'command_closure_rate',
     null,v_command_closure,1,v_command_closure=1,
     jsonb_build_array('done_commands='||v_done_commands,
                       'total_commands='||v_total_commands),
     'Measures command completion rather than command creation.');
  insert into public.hunt_boom_evals
    (eval_key,cycle_id,subject_type,subject_key,metric_name,
     baseline,current_value,target,passed,evidence,notes)
  values
    (new.cycle_key||'-repeat-error-rate',new.id,'meta-cycle',
     new.cycle_key,'repeat_error_rate',
     null,v_duplicate_rate,0,v_duplicate_rate=0,
     jsonb_build_array('active_duplicate_problem_count='||v_duplicate_active),
     'Current measurable repeat-error proxy is active duplicate problems.'),

    (new.cycle_key||'-evidence-completion-rate',new.id,'meta-cycle',
     new.cycle_key,'evidence_completion_rate',
     null,v_evidence_rate,1,v_evidence_rate=1,
     jsonb_build_array('done_with_evidence='||v_done_with_evidence,
                       'done_commands='||v_done_commands),
     'DONE requires evidence, not a status claim alone.'),

    (new.cycle_key||'-owner-correction-recurrence',new.id,'meta-cycle',
     new.cycle_key,'owner_correction_recurrence',
     null,null,0,null,
     jsonb_build_array('needs_explicit_owner_correction_event_ingestion'),
     'Metric exists but remains unevaluated until correction events are stored.');

  return new;
end;
$$;

drop trigger if exists hunt_boom_refresh_learning_evals
  on public.hunt_boom_improvement_cycles;
create trigger hunt_boom_refresh_learning_evals
after update on public.hunt_boom_improvement_cycles
for each row execute function private.hunt_boom_refresh_learning_evals();
insert into public.hunt_boom_learning_items
  (learning_key,domain,title,source_name,learned_at,principle,
   hunt_application,proposed_experiment,eval_required,status,confidence,metadata)
values
  ('context_absence_is_not_system_absence','agent-reliability',
   'Context absence is not system absence','owner-correction',now(),
   'Never classify a component as MISSING only because it is absent from prompt context.',
   'Require DB/API/runtime/repository evidence before MISSING; otherwise use NEEDS_VERIFICATION.',
   'Evaluate future component audits for unsupported MISSING classifications.',
   true,'testing',0.99,
   jsonb_build_object('qa_migration','fix_boom_learning_loop_dedup')),

  ('command_duplication_is_not_progress','agent-reliability',
   'Command duplication is not progress','owner-correction',now(),
   'Repeated commands for the same unresolved problem do not count as progress.',
   'Use problem_key, repeat_count and latest evidence so one active problem has one active command.',
   'Run three consecutive Meta-F35 cycles and require zero active duplicates.',
   true,'testing',0.99,
   jsonb_build_object('qa_migration','fix_boom_learning_loop_dedup'))
on conflict(learning_key) do update
set principle=excluded.principle,
    hunt_application=excluded.hunt_application,
    proposed_experiment=excluded.proposed_experiment,
    eval_required=true,
    status='testing',
    confidence=greatest(public.hunt_boom_learning_items.confidence,excluded.confidence),
    metadata=coalesce(public.hunt_boom_learning_items.metadata,'{}'::jsonb)
      || excluded.metadata;
