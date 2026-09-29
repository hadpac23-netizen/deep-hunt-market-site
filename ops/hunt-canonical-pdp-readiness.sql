-- HUNT Launch Closure: canonical EPROLO PDP readiness
-- Read-only query. This file does not mutate production.
-- Definitions:
--   STRICT_CANDIDATE     = passes catalog/safety/image/market/profit preconditions.
--   PDP_DETAIL_PASS      = live PDP detail runner returned PASS.
--   CANONICAL_PDP_READY  = strict + PDP detail PASS/200 + >=1 variant + canonical HTTPS image + no obvious taxonomy conflict.
--
-- Do not call PDP_QA_AUDIT_PASS or any historical QA-run count "PDP Ready".
-- Until its source is explicitly mapped, it remains a separate audit metric.

with strict as (
  select
    item_id,title,image_url,verified_inventory,candidate_status,source_payload,
    lower(title) as t,
    lower(coalesce(source_payload->'taxonomy_gate_v2'->>'canonical_shelf','')) as s
  from public.hunt_shelf_candidates
  where provider='EPROLO'
    and production_effect=false
    and availability_verified=true
    and coalesce(verified_inventory,0)>0
    and nullif(trim(source_payload->>'variant_id'),'') is not null
    and coalesce(source_payload->>'catalog_safety_status','')='PASS'
    and coalesce(source_payload->>'image_technical_status','')='PASS'
    and lower(coalesce(source_payload->>'latest_market5_all_pass','false'))='true'
    and coalesce(source_payload->'taxonomy_gate_v2'->>'status','')='REMAP'
    and coalesce(source_payload->'profit_gate_v2'->>'status','')='PROFIT_REVIEW'
    and coalesce((source_payload->'profit_gate_v2'->>'target_retail_usd')::numeric,0)>0
    and coalesce((source_payload->'profit_gate_v2'->>'projected_product_contribution_usd')::numeric,0)>0
    and candidate_status in (
      'MARKET5_READY_STYLE_PHYSICAL_PENDING',
      'MARKET5_READY_STYLE_PASS_PHYSICAL_EVIDENCE_PENDING',
      'MARKET5_READY_STYLE_PASS_PHYSICAL_METADATA_VERIFIED'
    )
),
classified as (
  select *,
    source_payload->'pdp_detail_gate'->>'status' as pdp_status,
    coalesce((source_payload->'pdp_detail_gate'->>'http_status')::int,0) as pdp_http,
    coalesce((source_payload->'pdp_detail_gate'->>'variant_count')::int,0) as variant_count,
    (
      (
        (
          t like '%iphone%case%' or t like '%phone case%' or
          t like '%samsung%case%' or t like '%galaxy%case%'
        )
        and t not like '%key chain%' and t not like '%keychain%'
        and t not like '%bag pendant%' and t not like '%passport%'
        and t not like '%document case%' and t not like '%card holder%'
        and s not like '%phone-case%' and s not like '%phoneaccess%' and s not like '%phone-access%'
      )
      or (
        (t like '%shoe%' or t like '%sandal%' or t like '%loafer%' or t like '%slipper%' or t like '%boot%' or t like '%sneaker%' or t like '%insole%')
        and (s like '%cushion%' or s like '%throw%' or s like '%pet%' or s like '%mirror%')
      )
      or (
        (t like '%montessori%' or t like '% toy%' or t like 'toy%' or t like '%toys%' or t like '%play house%')
        and s like '%pet%'
      )
      or (
        (t like '%watch%' or t like '%wristwatch%')
        and (s like '%bracelet%' or s like '%necklace%' or s like '%earring%' or s like '%ring%')
      )
      or (
        (t like '%t-shirt%' or t like '%t shirt%' or t like '%shirt%' or t like '%hoodie%' or t like '%sweatshirt%' or t like '%jacket%' or t like '%pants%' or t like '%trousers%')
        and (s like '%pet%' or s like '%cushion%' or s like '%throw%')
      )
    ) as obvious_taxonomy_conflict
  from strict
)
select *
from (
  select 'STRICT_CANDIDATE'::text as metric, count(*)::bigint as value from classified
  union all
  select 'PDP_DETAIL_PASS', count(*) filter (where pdp_status='PASS') from classified
  union all
  select 'CANONICAL_PDP_READY', count(*) filter (
    where pdp_status='PASS'
      and pdp_http=200
      and variant_count>=1
      and coalesce(image_url,'') like 'https://%'
      and not obvious_taxonomy_conflict
  ) from classified
  union all
  select 'PDP_NOT_RUN', count(*) filter (where not (source_payload ? 'pdp_detail_gate')) from classified
  union all
  select 'TAXONOMY_BLOCKED', count(*) filter (where pdp_status='PASS' and obvious_taxonomy_conflict) from classified
) metrics
order by case metric
  when 'STRICT_CANDIDATE' then 1
  when 'PDP_DETAIL_PASS' then 2
  when 'CANONICAL_PDP_READY' then 3
  when 'PDP_NOT_RUN' then 4
  when 'TAXONOMY_BLOCKED' then 5
  else 99 end;
