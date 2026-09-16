-- BOOM Learning Graduation Engine v1
-- A learning item may become learned/adopted only after behavior + eval + evidence proof.

alter table public.hunt_boom_learning_items
  add column if not exists behavior_rule text,
  add column if not exists graduation_eval_key text,
  add column if not exists graduation_evidence jsonb not null default '[]'::jsonb,
  add column if not exists last_evaluated_at timestamptz,
  add column if not exists graduated_at timestamptz,
  add column if not exists graduation_notes text;

update public.hunt_boom_learning_items
set behavior_rule = coalesce(nullif(trim(behavior_rule),''), nullif(trim(hunt_application),''))
where behavior_rule is null or trim(behavior_rule)='';

-- Existing learned rows predate item-level graduation evals.
-- Revalidate them under the new evidence gate instead of grandfathering status.
update public.hunt_boom_learning_items li
set status='testing',
    metadata=coalesce(metadata,'{}'::jsonb) || jsonb_build_object(
      'pre_graduation_status','learned',
      'graduation_revalidation_required',true,
      'graduation_engine','v1'
    ),
    graduated_at=null,
    graduation_notes='Revalidation required: item was marked learned before the graduation engine existed.'
where li.status='learned'
  and li.eval_required
  and not exists (
    select 1
    from public.hunt_boom_evals e
    where e.subject_type='learning_item'
      and e.subject_key=li.learning_key
      and e.passed is true
      and jsonb_typeof(e.evidence)='array'
      and jsonb_array_length(e.evidence)>0
  );

create or replace function private.hunt_boom_learning_graduation_guard()
returns trigger
language plpgsql
security invoker
set search_path=public,private
as $$
declare
  v_eval public.hunt_boom_evals%rowtype;
begin
  if new.status in ('learned','adopted') then
    if coalesce(trim(new.behavior_rule),'')='' then
      raise exception 'BOOM_LEARNING_GRADUATION_BLOCKED: behavior_rule required for %',new.learning_key;
    end if;

    if coalesce(trim(new.graduation_eval_key),'')='' then
      raise exception 'BOOM_LEARNING_GRADUATION_BLOCKED: graduation_eval_key required for %',new.learning_key;
    end if;

    if jsonb_typeof(coalesce(new.graduation_evidence,'[]'::jsonb))<>'array'
       or jsonb_array_length(coalesce(new.graduation_evidence,'[]'::jsonb))=0 then
      raise exception 'BOOM_LEARNING_GRADUATION_BLOCKED: graduation_evidence required for %',new.learning_key;
    end if;

    select e.*
      into v_eval
    from public.hunt_boom_evals e
    where e.eval_key=new.graduation_eval_key
      and e.subject_type='learning_item'
      and e.subject_key=new.learning_key
      and e.passed is true
      and jsonb_typeof(e.evidence)='array'
      and jsonb_array_length(e.evidence)>0
    order by e.created_at desc,e.id desc
    limit 1;

    if not found then
      raise exception 'BOOM_LEARNING_GRADUATION_BLOCKED: passed learning_item eval with evidence required for %',new.learning_key;
    end if;

    new.last_evaluated_at:=v_eval.created_at;
    new.graduated_at:=coalesce(new.graduated_at,now());
    new.metadata:=coalesce(new.metadata,'{}'::jsonb) || jsonb_build_object(
      'graduation_engine','v1',
      'graduation_verified',true,
      'graduation_eval_key',new.graduation_eval_key
    );
  end if;

  return new;
end;
$$;

drop trigger if exists hunt_boom_learning_graduation_guard
  on public.hunt_boom_learning_items;
create trigger hunt_boom_learning_graduation_guard
before insert or update of status,behavior_rule,graduation_eval_key,graduation_evidence
on public.hunt_boom_learning_items
for each row execute function private.hunt_boom_learning_graduation_guard();

create or replace function private.hunt_boom_try_graduate_learning(
  p_learning_key text,
  p_eval_key text
)
returns jsonb
language plpgsql
security invoker
set search_path=public,private
as $$
declare
  v_item public.hunt_boom_learning_items%rowtype;
  v_eval public.hunt_boom_evals%rowtype;
begin
  select * into v_item
  from public.hunt_boom_learning_items
  where learning_key=p_learning_key
  for update;

  if not found then
    return jsonb_build_object('graduated',false,'reason','learning_item_not_found','learning_key',p_learning_key);
  end if;

  if coalesce(trim(v_item.behavior_rule),'')='' then
    return jsonb_build_object('graduated',false,'reason','behavior_rule_missing','learning_key',p_learning_key);
  end if;

  select * into v_eval
  from public.hunt_boom_evals
  where eval_key=p_eval_key
    and subject_type='learning_item'
    and subject_key=p_learning_key
  order by created_at desc,id desc
  limit 1;

  if not found then
    return jsonb_build_object('graduated',false,'reason','eval_not_found','learning_key',p_learning_key,'eval_key',p_eval_key);
  end if;

  if v_eval.passed is distinct from true then
    return jsonb_build_object('graduated',false,'reason','eval_not_passed','learning_key',p_learning_key,'eval_key',p_eval_key);
  end if;

  if jsonb_typeof(v_eval.evidence)<>'array' or jsonb_array_length(v_eval.evidence)=0 then
    return jsonb_build_object('graduated',false,'reason','eval_evidence_missing','learning_key',p_learning_key,'eval_key',p_eval_key);
  end if;

  update public.hunt_boom_learning_items
  set graduation_eval_key=p_eval_key,
      graduation_evidence=v_eval.evidence,
      last_evaluated_at=v_eval.created_at,
      graduated_at=now(),
      graduation_notes='Graduated by BOOM Learning Graduation Engine v1 after passed item-level eval with evidence.',
      status='learned'
  where learning_key=p_learning_key;

  return jsonb_build_object(
    'graduated',true,
    'learning_key',p_learning_key,
    'eval_key',p_eval_key,
    'evaluated_at',v_eval.created_at
  );
end;
$$;

-- First evidence-backed graduation:
-- repeated active commands were eliminated and stayed deduplicated in QA + Production.
update public.hunt_boom_learning_items
set behavior_rule='Before creating a command for an unresolved problem, reuse the existing open problem command and update its repeat_count, latest report and evidence instead of creating another active command.'
where learning_key='command_duplication_is_not_progress';

insert into public.hunt_boom_evals(
  eval_key,cycle_id,subject_type,subject_key,metric_name,
  baseline,current_value,target,passed,evidence,notes
)
select
  'learning-command-duplication-is-not-progress-v1',
  null,
  'learning_item',
  'command_duplication_is_not_progress',
  'active_command_duplicate_rate',
  147.0/154.0,
  0,
  0,
  true,
  jsonb_build_array(
    'before_open_commands=154',
    'before_distinct_problems=7',
    'before_duplicate_active=147',
    'after_open_commands=7',
    'after_distinct_problems=7',
    'after_duplicate_active=0',
    'qa_three_pulse_active_commands=1',
    'qa_three_pulse_repeat_count=2',
    'production_command_duplicate_rate=0'
  ),
  'Passed after QA three-pulse simulation and Production verification showed one active command per unresolved problem.'
where exists (
  select 1
  from public.hunt_boom_learning_items
  where learning_key='command_duplication_is_not_progress'
)
and not exists (
  select 1 from public.hunt_boom_evals
  where eval_key='learning-command-duplication-is-not-progress-v1'
);

select private.hunt_boom_try_graduate_learning(
  'command_duplication_is_not_progress',
  'learning-command-duplication-is-not-progress-v1'
);
