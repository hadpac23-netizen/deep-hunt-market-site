CREATE OR REPLACE FUNCTION private.hunt_cj_costed_variant_prefilter_tick()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'private', 'net', 'pg_catalog'
AS $function$
declare
  r record;
  st jsonb;
  resp record;
  detail_req bigint;
  matrix_req bigint;
  item text;
  variant_id text;
  variant_cost numeric;
  retry_count int;
  residue int;
  picked record;
  not_before timestamptz;
  did_external boolean := false;
begin
  -- Phase 1: reconcile completed detail responses. At most one successful
  -- detail may fan out into the 5-market matrix per tick.
  for r in
    select *
    from public.hunt_runtime_controls
    where key like 'cj_prefilter_lane_%'
      and enabled=true
      and owner_approved=true
    order by updated_at asc,key
  loop
    st := coalesce(r.note::jsonb,'{}'::jsonb);
    residue := coalesce((st->>'residue')::int,0);
    detail_req := nullif(st->>'last_request_id','')::bigint;
    item := nullif(st->>'item_id','');
    retry_count := coalesce((st->>'retry_count')::int,0);

    if detail_req is null then
      continue;
    end if;

    select status_code,timed_out,error_msg,content
    into resp
    from net._http_response
    where id=detail_req
    order by created desc
    limit 1;

    if not found then
      continue;
    end if;

    if resp.status_code=200 and coalesce(resp.timed_out,false)=false then
      if did_external then
        continue;
      end if;

      select
        nullif(v->>'variant_id','') as variant_id,
        nullif(v->>'supplier_cost_usd','')::numeric as supplier_cost
      into picked
      from jsonb_array_elements(coalesce(resp.content::jsonb->'normalized'->'variants','[]'::jsonb)) v
      where nullif(v->>'variant_id','') is not null
        and nullif(v->>'supplier_cost_usd','')::numeric > 0
      order by nullif(v->>'supplier_cost_usd','')::numeric asc
      limit 1;

      if picked.variant_id is not null then
        variant_id := picked.variant_id;
        variant_cost := picked.supplier_cost;

        select net.http_post(
          url:='https://zszlnahjqmwozwubetkm.supabase.co/functions/v1/hunt-cj-readiness-matrix-shadow',
          headers:=jsonb_build_object(
            'content-type','application/json',
            'apikey','sb_publishable_SCGT8rsQsVrAt5CtlKVMzA_wGjT2I6X'
          ),
          body:=jsonb_build_object(
            'item_id',item,
            'variant_id',variant_id,
            'countries',jsonb_build_array('US','DE','GB','IL','AE')
          ),
          timeout_milliseconds:=60000
        ) into matrix_req;
        did_external := true;

        insert into public.hunt_product_observations
        (provider,item_id,observation_type,currency,availability_verified,payload,observed_at)
        values
        ('CJdropshipping',item,'product','USD',true,
         jsonb_build_object(
           'runner','hunt-cj-costed-variant-prefilter-v2',
           'status','PASS',
           'variant_id',variant_id,
           'supplier_cost_usd',variant_cost,
           'matrix_request_id',matrix_req,
           'production_effect',false
         ),now());
      else
        insert into public.hunt_product_observations
        (provider,item_id,observation_type,currency,availability_verified,payload,observed_at)
        values
        ('CJdropshipping',item,'product','USD',false,
         jsonb_build_object(
           'runner','hunt-cj-costed-variant-prefilter-v2',
           'status','HOLD',
           'reason','NO_COSTED_EXACT_VARIANT',
           'production_effect',false
         ),now());
      end if;

      st := jsonb_build_object(
        'residue',residue,
        'item_id',null,
        'last_request_id',null,
        'status','ready',
        'retry_count',0,
        'not_before',null,
        'last_item_id',item,
        'version','HUNT_CJ_PREFILTER_PACED_V2'
      );

      update public.hunt_runtime_controls
      set note=st::text,updated_at=now()
      where key=r.key;

    else
      retry_count := retry_count + 1;
      if retry_count >= 3 then
        insert into public.hunt_product_observations
        (provider,item_id,observation_type,currency,availability_verified,payload,observed_at)
        values
        ('CJdropshipping',item,'product','USD',false,
         jsonb_build_object(
           'runner','hunt-cj-costed-variant-prefilter-v2',
           'status','HOLD',
           'reason','DETAIL_UNAVAILABLE_AFTER_RETRIES',
           'http_status',resp.status_code,
           'error',resp.error_msg,
           'production_effect',false
         ),now());

        st := jsonb_build_object(
          'residue',residue,
          'item_id',null,
          'last_request_id',null,
          'status','ready',
          'retry_count',0,
          'not_before',null,
          'last_item_id',item,
          'version','HUNT_CJ_PREFILTER_PACED_V2'
        );
      else
        not_before := now() + make_interval(mins => least(15, power(2,retry_count)::int));
        st := st || jsonb_build_object(
          'last_request_id',null,
          'status','retry',
          'retry_count',retry_count,
          'not_before',not_before,
          'version','HUNT_CJ_PREFILTER_PACED_V2'
        );
      end if;

      update public.hunt_runtime_controls
      set note=st::text,updated_at=now()
      where key=r.key;
    end if;
  end loop;

  -- Phase 2: only when no matrix was dispatched this tick, send one detail request.
  if did_external then
    return;
  end if;

  for r in
    select *
    from public.hunt_runtime_controls
    where key like 'cj_prefilter_lane_%'
      and enabled=true
      and owner_approved=true
    order by updated_at asc,key
  loop
    st := coalesce(r.note::jsonb,'{}'::jsonb);
    residue := coalesce((st->>'residue')::int,0);
    detail_req := nullif(st->>'last_request_id','')::bigint;
    item := nullif(st->>'item_id','');
    retry_count := coalesce((st->>'retry_count')::int,0);
    not_before := nullif(st->>'not_before','')::timestamptz;

    if detail_req is not null then
      continue;
    end if;
    if not_before is not null and not_before > now() then
      continue;
    end if;

    if coalesce(st->>'status','ready')='retry' and item is not null then
      null;
    else
      select c.item_id
      into item
      from public.hunt_shelf_candidates c
      join public.hunt_boom_product_scores s
        on s.provider=c.provider and s.item_id=c.item_id
      where c.provider='CJdropshipping'
        and c.candidate_status <> 'BLOCKED_CATEGORY_REVIEW'
        and c.production_effect=false
        and c.availability_verified=true
        and coalesce(c.verified_inventory,0)>0
        and coalesce(c.source_payload->>'catalog_safety_status','')='PASS'
        and coalesce(c.source_payload->'taxonomy_gate_v2'->>'status','')='REMAP'
        and coalesce(c.source_payload->'profit_gate_v2'->>'status','')='PROFIT_REVIEW'
        and mod(c.id,4)=residue
        and not exists (
          select 1
          from public.hunt_product_observations o
          where o.provider='CJdropshipping'
            and o.item_id=c.item_id
            and o.observation_type='product'
            and o.payload->>'runner' in (
              'hunt-cj-costed-variant-prefilter-v1',
              'hunt-cj-costed-variant-prefilter-v2'
            )
        )
      order by s.total_score desc,c.verified_inventory desc nulls last
      limit 1;
    end if;

    if item is null then
      update public.hunt_runtime_controls
      set enabled=false,
          note=(st||jsonb_build_object('status','complete','version','HUNT_CJ_PREFILTER_PACED_V2'))::text,
          updated_at=now()
      where key=r.key;
      continue;
    end if;

    select net.http_get(
      url:='https://zszlnahjqmwozwubetkm.supabase.co/functions/v1/hunt-cj-product-detail-shadow?id='||item,
      headers:=jsonb_build_object('apikey','sb_publishable_SCGT8rsQsVrAt5CtlKVMzA_wGjT2I6X'),
      timeout_milliseconds:=60000
    ) into detail_req;

    st := st || jsonb_build_object(
      'item_id',item,
      'last_request_id',detail_req,
      'status','running',
      'last_started_at',now(),
      'not_before',null,
      'version','HUNT_CJ_PREFILTER_PACED_V2'
    );

    update public.hunt_runtime_controls
    set note=st::text,updated_at=now()
    where key=r.key;

    exit;
  end loop;
end;
$function$

