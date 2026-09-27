CREATE OR REPLACE FUNCTION private.hunt_eprolo_physical_evidence_dispatch_tick(batch_size integer DEFAULT 8)
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'public', 'private', 'pg_catalog'
AS $function$
declare
  n int := 0;
begin
  with token as (
    select decrypted_secret as v
    from vault.decrypted_secrets
    where name='hunt_underwear_catalog_token'
    limit 1
  ),
  ranked as (
    select c.id,c.item_id,c.source_payload->>'variant_id' variant_id,
           c.source_payload->'taxonomy_gate_v2'->>'canonical_department' department,
           c.source_payload->'taxonomy_gate_v2'->>'canonical_shelf' shelf,
           coalesce(s.total_score,0) boom_score,
           row_number() over (
             partition by c.source_payload->'taxonomy_gate_v2'->>'canonical_department',
                          c.source_payload->'taxonomy_gate_v2'->>'canonical_shelf'
             order by coalesce(s.total_score,0) desc,c.verified_inventory desc nulls last,c.updated_at asc
           ) rn
    from public.hunt_shelf_candidates c
    left join public.hunt_boom_product_scores s
      on s.provider=c.provider and s.item_id=c.item_id
    where c.provider='EPROLO'
      and c.candidate_status='MARKET5_READY_STYLE_PASS_PHYSICAL_EVIDENCE_PENDING'
      and nullif(c.source_payload->>'variant_id','') is not null
      and not (
        ((c.source_payload->'taxonomy_gate_v2'->>'canonical_department')='gifts'
         and (c.source_payload->'taxonomy_gate_v2'->>'canonical_shelf')='party')
        or
        ((c.source_payload->'taxonomy_gate_v2'->>'canonical_department')='kids'
         and (c.source_payload->'taxonomy_gate_v2'->>'canonical_shelf')='tableware')
      )
      and (
        coalesce(c.source_payload->>'physical_evidence_dispatch_state','')<>'INFLIGHT'
        or coalesce((c.source_payload->>'physical_evidence_dispatched_at')::timestamptz,'epoch'::timestamptz)
             < now()-interval '15 minutes'
      )
  ),
  picked as (
    select *
    from ranked
    order by rn asc,boom_score desc,department,shelf
    limit greatest(1,least(batch_size,8))
    for update skip locked
  ),
  marked as (
    update public.hunt_shelf_candidates c
    set source_payload=coalesce(c.source_payload,'{}'::jsonb)||jsonb_build_object(
          'physical_evidence_dispatch_state','INFLIGHT',
          'physical_evidence_dispatched_at',now(),
          'physical_evidence_dispatch_version','HUNT_EPROLO_PHYSICAL_DISPATCH_V1'
        ),
        updated_at=now()
    from picked p
    where c.id=p.id
    returning c.id,c.item_id,c.source_payload->>'variant_id' variant_id
  ),
  sent as (
    select m.id,
           net.http_post(
             url:='https://zszlnahjqmwozwubetkm.supabase.co/functions/v1/hunt-eprolo-physical-evidence',
             headers:=jsonb_build_object(
               'content-type','application/json',
               'x-hunt-internal-token',(select v from token)
             ),
             body:=jsonb_build_object('item_id',m.item_id,'variant_id',m.variant_id),
             timeout_milliseconds:=30000
           ) request_id
    from marked m
  )
  select count(*) into n from sent;
  return n;
end;
$function$

