create or replace function public.hunt_eprolo_strict_pdp_candidate_v1(p_item_id text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select to_jsonb(r)
  from (
    select
      c.item_id::text as item_id,
      c.title::text as title,
      c.image_url::text as image_url,
      c.verified_inventory,
      c.source_payload
    from public.hunt_shelf_candidates c
    where c.provider='EPROLO'
      and c.item_id=p_item_id
      and c.production_effect=false
      and c.availability_verified=true
      and coalesce(c.verified_inventory,0)>0
      and coalesce(c.source_payload->'taxonomy_gate_v2'->>'status','')='REMAP'
      and coalesce(c.source_payload->>'catalog_safety_status','')='PASS'
      and coalesce(c.source_payload->>'image_technical_status','')='PASS'
      and lower(coalesce(c.source_payload->>'latest_market5_all_pass','false'))='true'
      and coalesce(c.source_payload->'profit_gate_v2'->>'status','')='PROFIT_REVIEW'
      and coalesce((c.source_payload->'profit_gate_v2'->>'target_retail_usd')::numeric,0)>0
      and coalesce((c.source_payload->'profit_gate_v2'->>'projected_product_contribution_usd')::numeric,0)>0
      and c.candidate_status in (
        'MARKET5_READY_STYLE_PHYSICAL_PENDING',
        'MARKET5_READY_STYLE_PASS_PHYSICAL_EVIDENCE_PENDING',
        'MARKET5_READY_STYLE_PASS_PHYSICAL_METADATA_VERIFIED'
      )
    order by c.updated_at desc
    limit 1
  ) r;
$$;

revoke all on function public.hunt_eprolo_strict_pdp_candidate_v1(text) from public;
revoke all on function public.hunt_eprolo_strict_pdp_candidate_v1(text) from anon;
revoke all on function public.hunt_eprolo_strict_pdp_candidate_v1(text) from authenticated;
grant execute on function public.hunt_eprolo_strict_pdp_candidate_v1(text) to service_role;
