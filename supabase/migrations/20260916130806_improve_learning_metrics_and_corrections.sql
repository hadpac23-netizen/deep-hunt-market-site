-- Improve BOOM learning metrics and ingest durable owner-correction recurrence.
-- 1) command_closure_rate measures terminal closure, not only successful completion.
-- 2) owner_correction_recurrence is backed by persisted correction counters.

alter table public.hunt_boom_owner_memory
  add column if not exists occurrence_count integer not null default 1,
  add column if not exists recurrence_count integer not null default 0,
  add column if not exists last_recurrence_at timestamptz;

alter table public.hunt_boom_owner_memory
  drop constraint if exists hunt_boom_owner_memory_occurrence_count_check;
alter table public.hunt_boom_owner_memory
  add constraint hunt_boom_owner_memory_occurrence_count_check
  check (occurrence_count >= 1);

alter table public.hunt_boom_owner_memory
  drop constraint if exists hunt_boom_owner_memory_recurrence_count_check;
alter table public.hunt_boom_owner_memory
  add constraint hunt_boom_owner_memory_recurrence_count_check
  check (recurrence_count >= 0 and recurrence_count <= occurrence_count - 1);

-- Backfill known non-sensitive owner corrections already implemented in this session.
-- These are baseline occurrences, not recurrences.
insert into public.hunt_boom_owner_memory(
  owner_id,memory_key,category,content,confidence,source_type,
  active,last_seen_at,created_at,updated_at,occurrence_count,recurrence_count
)
select ts.owner_id,v.memory_key,'correction',v.content,1,
       'owner_correction_backfill_2026_09_16',true,now(),now(),now(),1,0
from public.hunt_boom_topic_state ts
cross join (values
  ('topic_continuity_name_ping',
   'Name-only BOOM calls, short continuation messages and display-only copy requests must preserve the active topic, goal, task and next step.'),
  ('voice_no_markdown_symbols',
   'Voice output must use spoken_text and must not read Markdown markers, decorative symbols, raw URLs or technical IDs unnecessarily.'),
  ('copy_preserves_active_task',
   'Asking for a copy report is a display-only request and must not replace the active current task or next action.'),
  ('context_absence_requires_verification',
   'Absence from prompt context is not proof of system absence; without evidence BOOM must use NEEDS_VERIFICATION instead of MISSING.')
) as v(memory_key,content)
on conflict(owner_id,memory_key) do update
set category='correction',
    content=excluded.content,
    confidence=greatest(public.hunt_boom_owner_memory.confidence,excluded.confidence),
    active=true,
    updated_at=now();

create or replace function private.hunt_boom_refresh_learning_evals()
returns trigger
language plpgsql
security invoker
set search_path=public,private
as $$
declare
  v_total_commands numeric:=0;
  v_done_commands numeric:=0;
  v_closed_commands numeric:=0;
  v_open_commands numeric:=0;
  v_duplicate_active numeric:=0;
  v_done_with_evidence numeric:=0;
  v_total_cycles numeric:=0;
  v_closed_cycles numeric:=0;
  v_duplicate_rate numeric:=0;
  v_command_closure numeric:=0;
  v_cycle_closure numeric:=0;
  v_evidence_rate numeric:=0;
  v_owner_correction_occurrences numeric:=0;
  v_owner_correction_recurrences numeric:=0;
  v_owner_correction_rate numeric:=0;
begin
  select count(*)::numeric,
         count(*) filter(where status='done')::numeric,
         count(*) filter(where status in ('done','failed','superseded'))::numeric,
         count(*) filter(
           where status in ('queued','accepted','running','waiting_owner')
         )::numeric,
         count(*) filter(
           where status='done'
             and evidence is not null
             and evidence not in ('[]'::jsonb,'{}'::jsonb)
         )::numeric
  into v_total_commands,v_done_commands,v_closed_commands,
       v_open_commands,v_done_with_evidence
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

  select coalesce(sum(occurrence_count),0)::numeric,
         coalesce(sum(recurrence_count),0)::numeric
  into v_owner_correction_occurrences,v_owner_correction_recurrences
  from public.hunt_boom_owner_memory
  where active=true and category='correction';

  v_duplicate_rate:=case when v_open_commands=0 then 0
    else v_duplicate_active/v_open_commands end;
  v_command_closure:=case when v_total_commands=0 then 1
    else v_closed_commands/v_total_commands end;
  v_cycle_closure:=case when v_total_cycles=0 then 1
    else v_closed_cycles/v_total_cycles end;
  v_evidence_rate:=case when v_done_commands=0 then 1
    else v_done_with_evidence/v_done_commands end;
  v_owner_correction_rate:=case when v_owner_correction_occurrences=0 then 0
    else v_owner_correction_recurrences/v_owner_correction_occurrences end;

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
     jsonb_build_array('terminal_closed_commands='||v_closed_commands,
                       'done_commands='||v_done_commands,
                       'open_commands='||v_open_commands,
                       'total_commands='||v_total_commands),
     'Measures terminal command closure. DONE, FAILED and SUPERSEDED are closed; open workflow states are not.')
  on conflict (cycle_id,metric_name) where cycle_id is not null
  do update set
    eval_key=excluded.eval_key,
    subject_type=excluded.subject_type,
    subject_key=excluded.subject_key,
    baseline=excluded.baseline,
    current_value=excluded.current_value,
    target=excluded.target,
    passed=excluded.passed,
    evidence=excluded.evidence,
    notes=excluded.notes,
    created_at=now();

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
     null,v_owner_correction_rate,0,v_owner_correction_rate=0,
     jsonb_build_array('correction_occurrences='||v_owner_correction_occurrences,
                       'correction_recurrences='||v_owner_correction_recurrences),
     'Repeated correction keys indicate BOOM repeated a behavior the owner already corrected.')
  on conflict (cycle_id,metric_name) where cycle_id is not null
  do update set
    eval_key=excluded.eval_key,
    subject_type=excluded.subject_type,
    subject_key=excluded.subject_key,
    baseline=excluded.baseline,
    current_value=excluded.current_value,
    target=excluded.target,
    passed=excluded.passed,
    evidence=excluded.evidence,
    notes=excluded.notes,
    created_at=now();

  return new;
end;
$$;

-- Refresh metrics on the current active cycle, or on the most recent cycle if none is active.
with target as (
  select id
  from public.hunt_boom_improvement_cycles
  order by (status in ('running','evaluating')) desc, started_at desc, id desc
  limit 1
)
update public.hunt_boom_improvement_cycles c
set result=coalesce(c.result,'{}'::jsonb)
  || jsonb_build_object('learning_metrics_refreshed_at',now())
from target
where c.id=target.id;
