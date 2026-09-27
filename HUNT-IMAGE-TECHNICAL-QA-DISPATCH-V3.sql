CREATE OR REPLACE FUNCTION private.hunt_image_technical_qa_dispatch_tick(batch_size integer DEFAULT 8)
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'public', 'private', 'net', 'pg_catalog'
AS $function$
declare
  r record;
  req_id bigint;
  n int:=0;
begin
  for r in
    select c.provider,c.item_id
    from public.hunt_shelf_candidates c
    join public.hunt_boom_product_scores s
      on s.provider=c.provider and s.item_id=c.item_id
    where c.candidate_status='MARKET5_READY_VISUAL_QUALITY_PENDING'
      and c.image_url is not null
      and not exists (
        select 1
        from public.hunt_product_observations o
        where o.provider=c.provider
          and o.item_id=c.item_id
          and o.observation_type='product'
          and o.payload->>'runner' in ('hunt-image-technical-qa-v2','hunt-image-technical-qa-v3')
      )
    order by s.total_score desc,c.verified_inventory desc nulls last
    limit greatest(1,least(batch_size,20))
  loop
    select net.http_post(
      url:='https://zszlnahjqmwozwubetkm.supabase.co/functions/v1/hunt-image-technical-qa',
      headers:=jsonb_build_object(
        'content-type','application/json',
        'apikey','sb_publishable_SCGT8rsQsVrAt5CtlKVMzA_wGjT2I6X'
      ),
      body:=jsonb_build_object('provider',r.provider,'item_id',r.item_id),
      timeout_milliseconds:=60000
    ) into req_id;
    n:=n+1;
  end loop;
  return n;
end;
$function$

