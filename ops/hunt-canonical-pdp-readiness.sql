-- HUNT Launch Closure: canonical EPROLO PDP readiness
-- READ-ONLY. This file does not mutate production.
--
-- Canonical definitions:
--   STRICT_CANDIDATE       = catalog/safety/image/market/profit preconditions.
--   PDP_DETAIL_PASS        = source_payload.pdp_detail_gate PASS.
--   PDP_QA_LATEST_PASS     = latest private.hunt_pdp_qa_runs record is PASS.
--   CANONICAL_PDP_READY    = intersection of all launch-critical PDP truth.
--
-- Current verified baseline (2026-09-29):
--   STRICT_CANDIDATE=826
--   PDP_DETAIL_PASS=517
--   PDP_QA_LATEST_PASS=266
--   CANONICAL_PDP_READY=261
--
-- Never label PDP_DETAIL_PASS or PDP_QA_LATEST_PASS alone as "PDP Ready".

with latest_qa as (
  select distinct on (provider,item_id)
         provider,item_id,qa_status,http_status,variant_count,gallery_count,
         has_sizes,has_colors,availability_verified,retail_price_verified,
         checked_at,error_text
  from private.hunt_pdp_qa_runs
  order by provider,item_id,coalesce(checked_at,requested_at) desc,id desc
),
strict as (
  select
    provider,item_id,title,image_url,verified_inventory,candidate_status,source_payload,
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
  select s.*,
    s.source_payload->'pdp_detail_gate'->>'status' as pdp_detail_status,
    coalesce((s.source_payload->'pdp_detail_gate'->>'http_status')::int,0) as pdp_detail_http,
    q.qa_status,
    coalesce(q.http_status,0) as qa_http_status,
    coalesce(q.variant_count,0) as qa_variant_count,
    coalesce(q.availability_verified,false) as qa_availability_verified,
    coalesce(q.retail_price_verified,false) as qa_retail_price_verified,
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
  from strict s
  left join latest_qa q using(provider,item_id)
)
select *
from (
  select 'STRICT_CANDIDATE'::text as metric, count(*)::bigint as value from classified
  union all
  select 'PDP_DETAIL_PASS', count(*) filter (where pdp_detail_status='PASS') from classified
  union all
  select 'PDP_QA_LATEST_PASS', count(*) filter (where qa_status='PASS') from classified
  union all
  select 'CANONICAL_PDP_READY', count(*) filter (
    where pdp_detail_status='PASS'
      and pdp_detail_http=200
      and qa_status='PASS'
      and qa_http_status=200
      and qa_variant_count>=1
      and qa_availability_verified=true
      and qa_retail_price_verified=true
      and coalesce(image_url,'') like 'https://%'
      and not obvious_taxonomy_conflict
  ) from classified
  union all
  select 'PDP_NOT_RUN', count(*) filter (where not (source_payload ? 'pdp_detail_gate')) from classified
  union all
  select 'DETAIL_PASS_WITHOUT_QA', count(*) filter (where pdp_detail_status='PASS' and qa_status is null) from classified
  union all
  select 'TAXONOMY_BLOCKED', count(*) filter (where pdp_detail_status='PASS' and obvious_taxonomy_conflict) from classified
) metrics
order by case metric
  when 'STRICT_CANDIDATE' then 1
  when 'PDP_DETAIL_PASS' then 2
  when 'PDP_QA_LATEST_PASS' then 3
  when 'CANONICAL_PDP_READY' then 4
  when 'PDP_NOT_RUN' then 5
  when 'DETAIL_PASS_WITHOUT_QA' then 6
  when 'TAXONOMY_BLOCKED' then 7
  else 99 end;
