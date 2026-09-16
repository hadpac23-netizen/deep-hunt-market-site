-- Fix active-cycle reuse when a historical closed cycle already owns the incoming cycle_key.
-- Keeps one active cycle while preserving the historical key in archived metadata.

create or replace function private.hunt_boom_cycle_reuse_guard()
returns trigger
language plpgsql
security invoker
set search_path=public,private
as $$
declare
  v_existing_id bigint;
  v_conflict_id bigint;
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
      select id into v_conflict_id
      from public.hunt_boom_improvement_cycles
      where cycle_key=new.cycle_key
        and id<>v_existing_id
      limit 1
      for update;

      if v_conflict_id is not null then
        update public.hunt_boom_improvement_cycles
        set result=coalesce(result,'{}'::jsonb)
              || jsonb_build_object(
                   'archived_cycle_key',cycle_key,
                   'archived_for_active_reuse_at',now()
                 ),
            cycle_key=cycle_key||'-archived-'||id::text
        where id=v_conflict_id;
      end if;

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
