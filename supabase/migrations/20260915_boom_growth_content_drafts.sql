create or replace function public.hunt_refresh_growth_content_drafts()
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_day date := (now() at time zone 'Asia/Jerusalem')::date;
  v_creative integer := 0;
  v_distribution integer := 0;
begin
  with latest as (
    select distinct on (e.provider,e.item_id)
      e.provider,e.item_id,e.variant_id,e.destination_country,e.currency,
      e.contribution_before_coupon,e.max_safe_cac,e.calculated_at,
      coalesce(nullif(e.calculation->>'title',''),e.item_id) as title
    from public.hunt_unit_economics e
    where e.inputs_verified=true
      and e.profit_gate_status='PASS'
      and e.contribution_before_coupon>=e.min_required_contribution
      and e.max_safe_cac>0
      and e.calculated_at>=now()-interval '7 days'
    order by e.provider,e.item_id,e.calculated_at desc
  ),
  picks as (
    select * from latest
    order by contribution_before_coupon desc, max_safe_cac desc, calculated_at desc
    limit 6
  )
  insert into public.hunt_creative_drafts(
    experiment_id,provider,item_id,format,hook,headline,body,cta,status,
    verified_product_relation,disclosure,created_at,updated_at
  )
  select
    null,p.provider,p.item_id,c.format,c.hook,left(p.title,240),
    left(c.body,1200),c.cta,'draft',true,
    'BOOM organic draft only · no discount claim · external publishing requires owner approval',
    now(),now()
  from picks p
  cross join (
    values
      ('9:16'::text,'A HUNT find worth a closer look'::text,
       'Explore current product details, variants and checkout readiness on HUNT DEAL.'::text,
       'See the HUNT find'::text),
      ('2:3'::text,'Save this HUNT find'::text,
       'Explore current product details, variants and checkout readiness on HUNT DEAL.'::text,
       'View product'::text),
      ('search_copy'::text,''::text,
       'Explore verified HUNT product details and current checkout readiness.'::text,
       'Explore'::text),
      ('onsite_card'::text,'BOOM PICK'::text,
       'Profit Gate passed on a recent verified check. Recheck happens before checkout.'::text,
       'View details'::text)
  ) as c(format,hook,body,cta)
  where not exists (
    select 1 from public.hunt_creative_drafts d
    where d.provider=p.provider
      and d.item_id=p.item_id
      and d.format=c.format
      and (d.created_at at time zone 'Asia/Jerusalem')::date=v_day
  );
  get diagnostics v_creative = row_count;

  with latest as (
    select distinct on (e.provider,e.item_id)
      e.provider,e.item_id,e.variant_id,e.destination_country,e.currency,
      e.contribution_before_coupon,e.max_safe_cac,e.calculated_at,
      coalesce(nullif(e.calculation->>'title',''),e.item_id) as title
    from public.hunt_unit_economics e
    where e.inputs_verified=true
      and e.profit_gate_status='PASS'
      and e.contribution_before_coupon>=e.min_required_contribution
      and e.max_safe_cac>0
      and e.calculated_at>=now()-interval '7 days'
    order by e.provider,e.item_id,e.calculated_at desc
  ),
  picks as (
    select * from latest
    order by contribution_before_coupon desc, max_safe_cac desc, calculated_at desc
    limit 6
  )
  insert into public.hunt_distribution_drafts(
    day,channel,provider,item_id,title_snapshot,destination_url,
    creative_format,creative_payload,
    utm_source,utm_medium,utm_campaign,utm_content,
    status,owner_approval_required,owner_approved,created_at,updated_at
  )
  select
    v_day,c.channel,p.provider,p.item_id,left(p.title,300),
    'https://deep-hunt-market.netlify.app/product.html?provider='||
      replace(p.provider,' ','%20')||'&id='||replace(p.item_id,' ','%20'),
    c.format,
    jsonb_build_object(
      'hook',c.hook,
      'headline',left(p.title,240),
      'body',c.body,
      'cta',c.cta,
      'verified_product_relation',true,
      'discount_claim',false,
      'economics_checked_at',p.calculated_at,
      'destination_tested',p.destination_country
    ),
    c.utm_source,c.utm_medium,'boom-'||v_day::text,
    lower(regexp_replace(p.item_id,'[^a-zA-Z0-9]+','-','g')),
    'draft',true,false,now(),now()
  from picks p
  cross join (
    values
      ('organic_social'::text,'9:16'::text,'A HUNT find worth a closer look'::text,
       'Explore current product details, variants and checkout readiness on HUNT DEAL.'::text,
       'See the HUNT find'::text,'social'::text,'organic'::text),
      ('pinterest'::text,'2:3'::text,'Save this HUNT find'::text,
       'Explore current product details, variants and checkout readiness on HUNT DEAL.'::text,
       'View product'::text,'pinterest'::text,'organic'::text),
      ('seo'::text,'search_copy'::text,''::text,
       'Explore verified HUNT product details and current checkout readiness.'::text,
       'Explore'::text,'google'::text,'organic'::text),
      ('onsite'::text,'onsite_card'::text,'BOOM PICK'::text,
       'Profit Gate passed on a recent verified check. Recheck happens before checkout.'::text,
       'View details'::text,'hunt'::text,'owned'::text)
  ) as c(channel,format,hook,body,cta,utm_source,utm_medium)
  on conflict(day,channel,provider,item_id) do nothing;
  get diagnostics v_distribution = row_count;

  return jsonb_build_object(
    'day',v_day,
    'creative_created',v_creative,
    'distribution_created',v_distribution,
    'external_publish_enabled',false
  );
end;
$$;

revoke all on function public.hunt_refresh_growth_content_drafts() from public, anon, authenticated;
grant execute on function public.hunt_refresh_growth_content_drafts() to postgres, service_role;

do $$
begin
  if exists(select 1 from cron.job where jobname='hunt-growth-content-drafts') then
    perform cron.unschedule('hunt-growth-content-drafts');
  end if;
  perform cron.schedule(
    'hunt-growth-content-drafts',
    '10 6 * * *',
    'select public.hunt_refresh_growth_content_drafts();'
  );
end;
$$;
