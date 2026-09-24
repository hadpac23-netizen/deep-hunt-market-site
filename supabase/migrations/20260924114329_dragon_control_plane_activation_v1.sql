create or replace function private.dragon_control_maintenance()
returns jsonb
language plpgsql
set search_path to 'public','private'
as $function$
declare
  v_now timestamptz := now();
  v_scheduler boolean := false;
  v_retry boolean := false;
  v_evidence boolean := false;
  v_expired integer := 0;
begin
  select coalesce(enabled and owner_approved,false)
    into v_scheduler
  from public.hunt_runtime_controls
  where key='dragon_control_scheduler';

  if not coalesce(v_scheduler,false) then
    return jsonb_build_object(
      'status','scheduler_disabled',
      'expired_commands',0,
      'executed_at',v_now
    );
  end if;

  select coalesce(enabled and owner_approved,false)
    into v_retry
  from public.hunt_runtime_controls
  where key='dragon_control_retry_executor';

  select coalesce(enabled and owner_approved,false)
    into v_evidence
  from public.hunt_runtime_controls
  where key='dragon_control_evidence_persistence';

  if coalesce(v_retry,false) then
    update public.hunt_boom_agent_commands
    set status='superseded',
        updated_at=v_now
    where status in ('queued','accepted','running','waiting_owner')
      and expires_at is not null
      and expires_at <= v_now;

    get diagnostics v_expired = row_count;
  end if;

  if coalesce(v_evidence,false) and v_expired > 0 then
    insert into public.boom_evidence(
      claim,source_url,confidence,supporting_sources,contradictory_sources,verified_at
    )
    values(
      'DRAGON circuit breaker superseded '||v_expired||' expired command lease(s)',
      'boom://control-plane/maintenance/circuit-breaker',
      'high',
      greatest(v_expired,1),
      0,
      v_now
    );
  end if;

  return jsonb_build_object(
    'status','ok',
    'scheduler_enabled',coalesce(v_scheduler,false),
    'circuit_breaker_enabled',coalesce(v_retry,false),
    'evidence_enabled',coalesce(v_evidence,false),
    'expired_commands',v_expired,
    'retry_mode','fresh-evidence-reissue-only',
    'executed_at',v_now
  );
end;
$function$;

select cron.schedule(
  'dragon-control-maintenance-5m',
  '*/5 * * * *',
  $$select private.dragon_control_maintenance();$$
);
