-- HUNT Launch Core counts — CJ and EPROLO are intentionally separate.
-- READ-ONLY. Do not sum these numbers under a single readiness label without provider context.

with cj as (
  select count(*)::bigint as value
  from public.hunt_shelf_candidates
  where provider='CJdropshipping'
    and production_effect=false
    and candidate_status='PARTIAL_MARKET_READY'
    and nullif(trim(source_payload->>'variant_id'),'') is not null
    and coalesce(source_payload->>'image_technical_status','')='PASS'
    and coalesce(source_payload->'profit_gate_v2'->>'status','')='PROFIT_REVIEW'
    and coalesce((source_payload->'profit_gate_v2'->>'target_retail_usd')::numeric,0)>0
    and coalesce((source_payload->'profit_gate_v2'->>'projected_product_contribution_usd')::numeric,0)>0
),
latest_qa as (
  select distinct on (provider,item_id)
         provider,item_id,qa_status,http_status,variant_count,
         availability_verified,retail_price_verified
  from private.hunt_pdp_qa_runs
  where provider='EPROLO'
  order by provider,item_id,coalesce(checked_at,requested_at) desc,id desc
),
eprolo_base as (
  select c.item_id,c.title,c.image_url,c.source_payload,
         lower(c.title) as t,
         lower(coalesce(c.source_payload->'taxonomy_gate_v2'->>'canonical_shelf','')) as s
  from public.hunt_shelf_candidates c
  join latest_qa q using(provider,item_id)
  where c.provider='EPROLO'
    and c.production_effect=false
    and c.availability_verified=true
    and coalesce(c.verified_inventory,0)>0
    and nullif(trim(c.source_payload->>'variant_id'),'') is not null
    and coalesce(c.source_payload->>'catalog_safety_status','')='PASS'
    and coalesce(c.source_payload->>'image_technical_status','')='PASS'
    and lower(coalesce(c.source_payload->>'latest_market5_all_pass','false'))='true'
    and coalesce(c.source_payload->'taxonomy_gate_v2'->>'status','')='REMAP'
    and coalesce(c.source_payload->'profit_gate_v2'->>'status','')='PROFIT_REVIEW'
    and coalesce((c.source_payload->'profit_gate_v2'->>'target_retail_usd')::numeric,0)>0
    and coalesce((c.source_payload->'profit_gate_v2'->>'projected_product_contribution_usd')::numeric,0)>0
    and c.candidate_status in (
      'MARKET5_READY_STYLE_PHYSICAL_PENDING',
      'MARKET5_READY_STYLE_PASS_PHYSICAL_EVIDENCE_PENDING',
      'MARKET5_READY_STYLE_PASS_PHYSICAL_METADATA_VERIFIED'
    )
    and c.source_payload->'pdp_detail_gate'->>'status'='PASS'
    and coalesce((c.source_payload->'pdp_detail_gate'->>'http_status')::int,0)=200
    and q.qa_status='PASS' and coalesce(q.http_status,0)=200
    and coalesce(q.variant_count,0)>=1
    and coalesce(q.availability_verified,false)=true
    and coalesce(q.retail_price_verified,false)=true
    and coalesce(c.image_url,'') like 'https://%'
),
eprolo as (
  select count(*)::bigint as value
  from eprolo_base
  where not (
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
  )
)
select 'CJ_EXACT_VARIANT_REFRESH_POOL' as metric,value from cj
union all
select 'EPROLO_CANONICAL_PDP_READY' as metric,value from eprolo;
