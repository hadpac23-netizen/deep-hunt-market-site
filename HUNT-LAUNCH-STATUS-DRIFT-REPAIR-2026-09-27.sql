-- HUNT Launch status-drift repair, shadow/pre-launch only.
-- Applied to Supabase on 2026-09-27 via execute_sql.
-- Not a migration file. Capture into a formal migration with the Supabase CLI before release.

create or replace function private.hunt_cj_readiness_reconcile()
returns integer
language plpgsql
set search_path to 'public','private','pg_catalog'
as $function$
declare n int;
begin
  with candidates as (
    select c.item_id,c.candidate_status,
      coalesce(nullif(c.source_payload->>'underwear_exact_variant_id',''),nullif(c.source_payload->>'variant_id','')) as canonical_variant
    from public.hunt_shelf_candidates c
    where c.provider='CJdropshipping' and c.candidate_status <> 'BLOCKED_CATEGORY_REVIEW'
  ),
  latest as (
    select distinct on (o.item_id)
      o.item_id,c.canonical_variant,
      coalesce((o.payload->>'pass_count')::int,0) as pass_count,
      coalesce((o.payload->>'requested_count')::int,5) as requested_count,
      coalesce((o.payload->>'all_5_destinations_pass')::boolean,false) as all5,
      nullif(o.payload->>'requested_variant_id','') as observed_variant,o.observed_at
    from candidates c
    join public.hunt_product_observations o
      on o.provider='CJdropshipping' and o.item_id=c.item_id
     and o.observation_type='product'
     and o.payload->>'runner'='hunt-cj-readiness-matrix-shadow-v4'
     and coalesce((o.payload->>'matrix')::boolean,false)=true
     and (c.canonical_variant is null or o.payload->>'requested_variant_id'=c.canonical_variant)
    where not (c.candidate_status='FULLY_READY' and c.canonical_variant is null)
    order by o.item_id,o.observed_at desc
  )
  update public.hunt_shelf_candidates c
  set candidate_status=case
      when l.all5 and l.pass_count=5 then case
        when c.candidate_status='FULLY_READY' then 'FULLY_READY'
        when c.candidate_status='MARKET5_READY_STYLE_PASS_PHYSICAL_METADATA_VERIFIED'
          then 'MARKET5_READY_STYLE_PASS_PHYSICAL_METADATA_VERIFIED'
        when coalesce(c.source_payload->>'image_technical_status','')='PASS'
          then 'MARKET5_READY_STYLE_PHYSICAL_PENDING'
        else 'MARKET5_READY_VISUAL_QUALITY_PENDING' end
      when l.pass_count>0 then 'PARTIAL_MARKET_READY'
      else 'HOLD_MARKET_READINESS' end,
      retail_truth_status=case
        when l.all5 and l.pass_count=5 then 'MARKET5_PROFIT_PASS'
        when l.pass_count>0 then 'PARTIAL_MARKET_PASS'
        else 'MARKET_HOLD' end,
      sellable=false,production_effect=false,
      source_payload=coalesce(c.source_payload,'{}'::jsonb)||jsonb_build_object(
        'latest_market5_pass_count',l.pass_count,
        'latest_market5_requested_count',l.requested_count,
        'latest_market5_all_pass',l.all5,
        'latest_market5_observed_at',l.observed_at,
        'latest_market5_variant_id',l.observed_variant,
        'canonical_variant_reconcile','HUNT_CJ_RECONCILE_V3'),
      updated_at=now()
  from latest l
  where c.provider='CJdropshipping' and c.item_id=l.item_id
    and c.candidate_status <> 'BLOCKED_CATEGORY_REVIEW';
  get diagnostics n=row_count;
  return n;
end;
$function$;

create or replace function private.hunt_eprolo_readiness_reconcile()
returns integer
language plpgsql
set search_path to 'public','private','pg_catalog'
as $function$
declare n int;
begin
  with latest as (
    select distinct on (o.item_id)
      o.item_id,
      coalesce((o.payload->>'pass_count')::int,0) as pass_count,
      coalesce((o.payload->>'requested_count')::int,5) as requested_count,
      coalesce((o.payload->>'all_requested_pass')::boolean,false) as all5,
      o.observed_at
    from public.hunt_product_observations o
    where o.provider='EPROLO'
      and o.observation_type='product'
      and o.payload->>'runner'='hunt-eprolo-readiness-matrix-shadow-v1'
    order by o.item_id,o.observed_at desc
  )
  update public.hunt_shelf_candidates c
  set candidate_status=case
      when l.all5 and l.pass_count=5 then case
        when c.candidate_status='FULLY_READY' then 'FULLY_READY'
        when c.candidate_status='MARKET5_READY_STYLE_PASS_PHYSICAL_METADATA_VERIFIED'
          then 'MARKET5_READY_STYLE_PASS_PHYSICAL_METADATA_VERIFIED'
        when coalesce(c.source_payload->>'image_technical_status','')='PASS'
          then 'MARKET5_READY_STYLE_PHYSICAL_PENDING'
        else 'MARKET5_READY_VISUAL_QUALITY_PENDING' end
      when l.pass_count>0 then 'PARTIAL_MARKET_READY'
      else 'HOLD_MARKET_READINESS' end,
      retail_truth_status=case
        when l.all5 and l.pass_count=5 then 'MARKET5_PROFIT_PASS'
        when l.pass_count>0 then 'PARTIAL_MARKET_PASS'
        else 'MARKET_HOLD' end,
      sellable=false,production_effect=false,
      source_payload=coalesce(c.source_payload,'{}'::jsonb)||jsonb_build_object(
        'latest_market5_pass_count',l.pass_count,
        'latest_market5_requested_count',l.requested_count,
        'latest_market5_all_pass',l.all5,
        'latest_market5_observed_at',l.observed_at,
        'readiness_reconcile','HUNT_EPROLO_RECONCILE_V2'),
      updated_at=now()
  from latest l
  where c.provider='EPROLO' and c.item_id=l.item_id
    and c.candidate_status <> 'BLOCKED_CATEGORY_REVIEW';
  get diagnostics n=row_count;
  return n;
end;
$function$;
