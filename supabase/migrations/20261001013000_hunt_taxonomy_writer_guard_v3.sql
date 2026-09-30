-- HUNT taxonomy writer hardening v3
-- Shadow-only integrity patch. Does not enable sellability, payments, supplier live ordering, or production effects.

create or replace function public.hunt_preserve_shadow_taxonomy_gate_v2()
returns trigger
language plpgsql
as $function$
declare
  old_gate jsonb;
  new_gate jsonb;
  old_department text;
  old_shelf text;
  new_department text;
  new_shelf text;
begin
  if old.production_effect = false then
    old_gate := old.source_payload->'taxonomy_gate_v2';
    old_department := coalesce(old_gate->>'canonical_department','');
    old_shelf := coalesce(old_gate->>'canonical_shelf','');

    if old_shelf <> '' then
      new_gate := new.source_payload->'taxonomy_gate_v2';
      new_department := coalesce(new_gate->>'canonical_department','');
      new_shelf := coalesce(new_gate->>'canonical_shelf','');

      -- Existing canonical taxonomy is authoritative for shadow rows.
      -- A generic refill/enrichment writer may neither remove it nor silently replace it.
      if new_gate is null
         or new_shelf = ''
         or new_shelf is distinct from old_shelf
         or (old_department <> '' and new_department is distinct from old_department) then
        new.source_payload := jsonb_set(
          coalesce(new.source_payload, '{}'::jsonb),
          '{taxonomy_gate_v2}',
          old_gate,
          true
        );
      end if;
    end if;
  end if;

  return new;
end;
$function$;

create or replace function private.hunt_cj_mass_fill_tick()
returns void
language plpgsql
set search_path to 'public', 'private', 'net', 'pg_catalog'
as $function$
declare
  r record;
  st jsonb;
  req_id bigint;
  resp record;
  current_total int;
  next_page int;
  stride int;
  last_req bigint;
  last_page int;
  product_count int;
  page_http int;
  total_pages int;
  retry_count int;
begin
  select count(*)::int into current_total from public.hunt_shelf_candidates;
  if current_total >= 60000 then
    update public.hunt_runtime_controls
    set enabled=false,
        note=(coalesce(note::jsonb,'{}'::jsonb) || jsonb_build_object('status','target_reached'))::text,
        updated_at=now()
    where key like 'cj_mass_fill_lane_%';
    return;
  end if;

  for r in
    select * from public.hunt_runtime_controls
    where key like 'cj_mass_fill_lane_%' and enabled=true and owner_approved=true
    order by key
  loop
    st := coalesce(r.note::jsonb,'{}'::jsonb);
    next_page := coalesce((st->>'next_page')::int,1);
    stride := coalesce((st->>'stride')::int,4);
    last_req := nullif(st->>'last_request_id','')::bigint;
    last_page := nullif(st->>'last_page','')::int;
    retry_count := coalesce((st->>'retry_count')::int,0);

    if last_req is not null then
      select status_code,timed_out,error_msg,content
      into resp
      from net._http_response
      where id=last_req
      order by created desc
      limit 1;

      if not found then
        continue;
      end if;

      if resp.status_code=200 and coalesce(resp.timed_out,false)=false then
        begin
          product_count := coalesce(jsonb_array_length(resp.content::jsonb->'products'),0);
          page_http := coalesce((resp.content::jsonb->'pages'->0->>'http_status')::int,200);
          total_pages := nullif(resp.content::jsonb->'pages'->0->>'total_pages','')::int;
        exception when others then
          product_count := 0;
          page_http := 500;
          total_pages := null;
        end;

        if page_http=200 and product_count>0 then
          insert into public.hunt_shelf_candidates
          (provider,item_id,title,category,image_url,supplier_cost,supplier_currency,
           verified_inventory,warehouse_inventory,verified_warehouse,availability_verified,
           retail_truth_status,product_truth_status,candidate_status,sellable,production_effect,
           source,source_payload,discovered_at,updated_at)
          select
            'CJdropshipping',
            p->>'item_id',
            p->>'title',
            nullif(p->>'category',''),
            p->>'image_url',
            nullif(p->>'supplier_cost','')::numeric,
            'USD',
            coalesce(nullif(p->>'verified_inventory','')::bigint,0),
            coalesce(nullif(p->>'warehouse_inventory','')::bigint,0),
            coalesce((p->>'verified_warehouse')::boolean,false),
            coalesce((p->>'availability_verified')::boolean,false),
            'NOT_FINAL',
            'CJ_SAFE_EXPORT_PASS',
            'PENDING_BOOM_STYLE_EXACT_VARIANT_GLOBAL_SHIPPING_PROFIT_VISUAL_QUALITY',
            false,false,
            'CJ_SHADOW_EXPORT_MASS_FILL_V2',
            jsonb_build_object('page',last_page,'source_category',p->>'category'),
            now(),now()
          from jsonb_array_elements(resp.content::jsonb->'products') p
          where coalesce(p->>'item_id','') <> ''
          on conflict (provider,item_id) do update set
            title=excluded.title,
            image_url=excluded.image_url,
            supplier_cost=excluded.supplier_cost,
            verified_inventory=excluded.verified_inventory,
            warehouse_inventory=excluded.warehouse_inventory,
            verified_warehouse=excluded.verified_warehouse,
            availability_verified=excluded.availability_verified,
            source=excluded.source,
            source_payload=coalesce(public.hunt_shelf_candidates.source_payload,'{}'::jsonb) || excluded.source_payload,
            updated_at=now();

          next_page := coalesce(last_page,next_page)+stride;
          retry_count := 0;
          st := st || jsonb_build_object(
            'next_page',next_page,'last_request_id',null,'last_success_page',last_page,
            'status','ready','retry_count',0,'total_pages',total_pages
          );

          if total_pages is not null and next_page > total_pages then
            update public.hunt_runtime_controls
            set enabled=false,
                note=(st || jsonb_build_object('status','completed_source'))::text,
                updated_at=now()
            where key=r.key;
            continue;
          end if;
        else
          retry_count := retry_count+1;
          st := st || jsonb_build_object(
            'last_request_id',null,'status','retry','retry_count',retry_count,
            'last_error','page_http_'||coalesce(page_http::text,'unknown')
          );
          if retry_count >= 8 then
            next_page := coalesce(last_page,next_page)+stride;
            st := st || jsonb_build_object(
              'next_page',next_page,'retry_count',0,'status','skip_after_retries'
            );
          end if;
        end if;
      else
        retry_count := retry_count+1;
        st := st || jsonb_build_object(
          'last_request_id',null,'status','retry','retry_count',retry_count,
          'last_error',coalesce(resp.error_msg,'http_'||coalesce(resp.status_code::text,'unknown'))
        );
      end if;
    end if;

    select net.http_get(
      url := 'https://zszlnahjqmwozwubetkm.supabase.co/functions/v1/hunt-cj-shadow-export?start_page='||next_page||'&page_count=1&page_size=100&min_inventory=1',
      headers := jsonb_build_object('apikey','sb_publishable_SCGT8rsQsVrAt5CtlKVMzA_wGjT2I6X'),
      timeout_milliseconds := 60000
    ) into req_id;

    st := st || jsonb_build_object(
      'last_request_id',req_id,'last_page',next_page,'status','running','last_started_at',now()
    );
    update public.hunt_runtime_controls set note=st::text,updated_at=now() where key=r.key;
  end loop;
end;
$function$;
