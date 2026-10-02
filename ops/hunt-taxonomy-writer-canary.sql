-- HUNT taxonomy writer canary
-- Run only after hunt_taxonomy_writer_guard_v3 is applied in an approved Shadow/Canary environment.
-- This script intentionally attempts a bad taxonomy rewrite and always rolls back.

begin;

do $canary$
declare
  v_id bigint;
  v_before_gate jsonb;
  v_after_gate jsonb;
  v_before_production_effect boolean;
begin
  select id, source_payload->'taxonomy_gate_v2', production_effect
    into v_id, v_before_gate, v_before_production_effect
  from public.hunt_shelf_candidates
  where production_effect = false
    and sellable = false
    and coalesce(source_payload->'taxonomy_gate_v2'->>'canonical_shelf','') <> ''
  order by id
  limit 1
  for update;

  if v_id is null then
    raise exception 'HUNT_TAXONOMY_CANARY_NO_SAFE_ROW';
  end if;

  update public.hunt_shelf_candidates
  set source_payload = jsonb_build_object(
    'taxonomy_gate_v2', jsonb_build_object(
      'canonical_department', '__HUNT_CANARY_INVALID__',
      'canonical_shelf', '__HUNT_CANARY_INVALID__'
    ),
    'taxonomy_writer_canary', 'attempted_replacement'
  )
  where id = v_id;

  select source_payload->'taxonomy_gate_v2'
    into v_after_gate
  from public.hunt_shelf_candidates
  where id = v_id;

  if v_after_gate is distinct from v_before_gate then
    raise exception 'HUNT_TAXONOMY_CANARY_FAIL: canonical taxonomy changed';
  end if;

  if v_before_production_effect is distinct from false then
    raise exception 'HUNT_TAXONOMY_CANARY_FAIL: unsafe row selected';
  end if;

  raise notice 'HUNT_TAXONOMY_CANARY_PASS candidate_id=%', v_id;
end;
$canary$;

rollback;
