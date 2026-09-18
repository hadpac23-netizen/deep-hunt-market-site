create extension if not exists pg_cron with schema pg_catalog;

create table if not exists public.hunt_growth_daily_briefs (
  day date primary key,
  generated_at timestamptz not null default now(),
  status text not null default 'draft' check (status in ('draft','review','approved','archived')),
  funnel jsonb not null default '{}'::jsonb,
  economics jsonb not null default '{}'::jsonb,
  marketing jsonb not null default '{}'::jsonb,
  creative jsonb not null default '{}'::jsonb,
  seo jsonb not null default '{}'::jsonb,
  love jsonb not null default '{}'::jsonb,
  publisher jsonb not null default '{}'::jsonb,
  learning jsonb not null default '{}'::jsonb,
  next_move jsonb not null default '{}'::jsonb,
  notes text not null default ''
);

alter table public.hunt_growth_daily_briefs enable row level security;

drop policy if exists "Admins manage HUNT growth daily briefs" on public.hunt_growth_daily_briefs;
create policy "Admins manage HUNT growth daily briefs"
on public.hunt_growth_daily_briefs
for all
to authenticated
using (exists (
  select 1 from public.profiles p
  where p.id = auth.uid() and p.is_admin
))
with check (exists (
  select 1 from public.profiles p
  where p.id = auth.uid() and p.is_admin
));

create table if not exists public.hunt_distribution_drafts (
  id uuid primary key default gen_random_uuid(),
  day date not null,
  channel text not null check (channel in (
    'onsite','seo','organic_social','pinterest','youtube','email','creator','google','meta','tiktok','other'
  )),
  provider text not null check (char_length(provider) between 1 and 80),
  item_id text not null check (char_length(item_id) between 1 and 180),
  title_snapshot text not null check (char_length(title_snapshot) between 1 and 300),
  destination_url text not null,
  creative_format text not null,
  creative_payload jsonb not null default '{}'::jsonb,
  utm_source text not null,
  utm_medium text not null,
  utm_campaign text not null,
  utm_content text not null,
  status text not null default 'draft' check (status in ('draft','review','approved','published','rejected','archived')),
  owner_approval_required boolean not null default true,
  owner_approved boolean not null default false,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  published_at timestamptz,
  external_action_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(day, channel, provider, item_id),
  check (status <> 'published' or owner_approved = true)
);

alter table public.hunt_distribution_drafts enable row level security;

drop policy if exists "Admins manage HUNT distribution drafts" on public.hunt_distribution_drafts;
create policy "Admins manage HUNT distribution drafts"
on public.hunt_distribution_drafts
for all
to authenticated
using (exists (
  select 1 from public.profiles p
  where p.id = auth.uid() and p.is_admin
))
with check (exists (
  select 1 from public.profiles p
  where p.id = auth.uid() and p.is_admin
));

insert into public.hunt_runtime_controls(key,enabled,owner_approved,note)
values
  ('hunt_growth_daily_brain',true,true,'Internal daily BOOM learning, scoring and draft generation only. No external publishing or spend.'),
  ('hunt_external_everywhere_publish',false,false,'Master kill switch for external publishing. Must remain OFF until the owner approves a publishing workflow/channel.')
on conflict (key) do update
set enabled=excluded.enabled,
    owner_approved=excluded.owner_approved,
    note=excluded.note,
    updated_at=now();

create or replace function public.hunt_refresh_growth_daily_brief()
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_day date := (now() at time zone 'Asia/Jerusalem')::date;
  v_sessions bigint := 0;
  v_page_views bigint := 0;
  v_product_views bigint := 0;
  v_likes bigint := 0;
  v_saves bigint := 0;
  v_carts bigint := 0;
  v_checkouts bigint := 0;
  v_orders bigint := 0;
  v_gov numeric := 0;
  v_econ_count integer := 0;
  v_avg_contribution numeric := null;
  v_avg_safe_cac numeric := null;
  v_eligible_deals integer := 0;
  v_ready_experiments integer := 0;
  v_testing_experiments integer := 0;
  v_love_score numeric := 0;
  v_creative_today integer := 0;
  v_distribution_today integer := 0;
  v_next_code text := 'COLLECT_EVIDENCE';
  v_next_title text := 'Collect enough evidence to learn';
  v_next_action text := 'Keep organic discovery measured and do not scale paid acquisition yet.';
  v_brief jsonb;
begin
  select
    coalesce(max(unique_sessions),0),
    coalesce(max(page_views),0),
    coalesce(max(product_views),0),
    coalesce(max(likes),0),
    coalesce(max(saves),0),
    coalesce(max(add_to_cart),0),
    coalesce(max(checkout_starts),0),
    coalesce(max(orders),0),
    coalesce(max(gross_order_value),0)
  into
    v_sessions,v_page_views,v_product_views,v_likes,v_saves,
    v_carts,v_checkouts,v_orders,v_gov
  from public.hunt_daily_owner_metrics
  where day=v_day;

  select
    count(*)::int,
    avg(contribution_before_coupon),
    avg(max_safe_cac)
  into v_econ_count,v_avg_contribution,v_avg_safe_cac
  from public.hunt_unit_economics
  where inputs_verified=true
    and profit_gate_status='PASS'
    and contribution_before_coupon>0
    and max_safe_cac>0;

  select count(*)::int
  into v_eligible_deals
  from public.hunt_deal_candidates d
  where d.status not in ('rejected','expired')
    and d.profit_gate_status='PASS'
    and lower(coalesce(d.truth_status,'')) ~ '(verified|confirmed|truth)'
    and exists (
      select 1
      from public.hunt_unit_economics e
      where e.provider=d.provider
        and e.item_id=d.item_id
        and e.inputs_verified=true
        and e.profit_gate_status='PASS'
        and e.contribution_before_coupon>0
        and e.max_safe_cac>0
    );

  select
    count(*) filter (where status='ready')::int,
    count(*) filter (where status='testing')::int
  into v_ready_experiments,v_testing_experiments
  from public.hunt_marketing_experiments;

  if v_product_views>0 then
    v_love_score := least(
      100,
      least(30,(v_likes::numeric/v_product_views)*300) +
      least(35,(v_saves::numeric/v_product_views)*500) +
      least(25,(v_carts::numeric/v_product_views)*200) +
      least(10,v_sessions::numeric/10)
    );
  end if;

  if v_econ_count < 3 then
    v_next_code := 'VERIFY_ECONOMICS';
    v_next_title := 'Verify unit economics before promotion';
    v_next_action := 'Run Profit Engine checks on strong products and destinations until BOOM has at least three verified positive samples.';
  elsif v_sessions < 20 then
    v_next_code := 'ORGANIC_TRAFFIC';
    v_next_title := 'Grow qualified organic traffic';
    v_next_action := 'Prioritize SEO, free product discovery and owner-approved organic creative with tracked UTMs.';
  elsif v_product_views >= 20 and (v_carts::numeric/nullif(v_product_views,0))*100 < 4 then
    v_next_code := 'OFFER_FIT';
    v_next_title := 'Improve product and offer fit';
    v_next_action := 'Test stronger product selection, trust, shipping clarity and verified offers before increasing traffic.';
  elsif v_carts >= 10 and (v_checkouts::numeric/nullif(v_carts,0))*100 < 30 then
    v_next_code := 'CART_TO_CHECKOUT';
    v_next_title := 'Fix cart to checkout friction';
    v_next_action := 'Audit cart persistence, destination selection, totals, shipping and checkout clarity.';
  elsif v_checkouts > 0 and v_orders=0 then
    v_next_code := 'CHECKOUT_COMPLETION';
    v_next_title := 'Do not scale until checkout completes';
    v_next_action := 'Finish payment callback, order creation, supplier handoff, tracking and end-to-end order validation.';
  else
    v_next_code := 'TEST_WINNERS';
    v_next_title := 'Test verified winners';
    v_next_action := 'Run controlled owned/organic experiments and scale only what improves real profit and trust.';
  end if;

  insert into public.hunt_creative_drafts(
    experiment_id,provider,item_id,format,hook,headline,body,cta,status,verified_product_relation,disclosure
  )
  select
    null,
    d.provider,
    d.item_id,
    f.format,
    f.hook,
    left(coalesce(nullif(d.title_snapshot,''),d.item_id),240),
    left(
      case
        when coalesce(d.discount_percent,0)>0
          then round(d.discount_percent,0)::text || '% verified price drop. Review product details and shipping on HUNT DEAL.'
        else 'Review product details, variants and shipping checks on HUNT DEAL.'
      end,
      1200
    ),
    f.cta,
    'draft',
    true,
    'BOOM draft only · external publishing requires owner approval'
  from (
    select d.*
    from public.hunt_deal_candidates d
    where d.status not in ('rejected','expired')
      and d.profit_gate_status='PASS'
      and lower(coalesce(d.truth_status,'')) ~ '(verified|confirmed|truth)'
      and exists (
        select 1
        from public.hunt_unit_economics e
        where e.provider=d.provider and e.item_id=d.item_id
          and e.inputs_verified=true and e.profit_gate_status='PASS'
          and e.contribution_before_coupon>0 and e.max_safe_cac>0
      )
    order by coalesce(d.deal_score,0) desc, d.updated_at desc
    limit 3
  ) d
  cross join (
    values
      ('9:16'::text,'A HUNT find worth a closer look'::text,'See the HUNT find'::text),
      ('2:3'::text,'Save this HUNT find'::text,'View product'::text),
      ('search_copy'::text,''::text,'Explore'::text),
      ('onsite_card'::text,'BOOM PICK'::text,'View details'::text)
  ) as f(format,hook,cta)
  where not exists (
    select 1
    from public.hunt_creative_drafts c
    where c.provider=d.provider
      and c.item_id=d.item_id
      and c.format=f.format
      and c.created_at::date=v_day
  );

  insert into public.hunt_distribution_drafts(
    day,channel,provider,item_id,title_snapshot,destination_url,creative_format,creative_payload,
    utm_source,utm_medium,utm_campaign,utm_content,status,owner_approval_required,owner_approved
  )
  select
    v_day,
    c.channel,
    d.provider,
    d.item_id,
    left(coalesce(nullif(d.title_snapshot,''),d.item_id),300),
    'https://deep-hunt-market.netlify.app/product.html?provider='||replace(d.provider,' ','%20')||'&id='||replace(d.item_id,' ','%20'),
    c.format,
    jsonb_build_object(
      'hook',c.hook,
      'headline',left(coalesce(nullif(d.title_snapshot,''),d.item_id),240),
      'body','Review product details, variants and shipping checks on HUNT DEAL.',
      'cta',c.cta,
      'verified_product_relation',true
    ),
    c.utm_source,
    c.utm_medium,
    'boom-'||v_day::text,
    lower(regexp_replace(d.item_id,'[^a-zA-Z0-9]+','-','g')),
    'draft',
    true,
    false
  from (
    select d.*
    from public.hunt_deal_candidates d
    where d.status not in ('rejected','expired')
      and d.profit_gate_status='PASS'
      and lower(coalesce(d.truth_status,'')) ~ '(verified|confirmed|truth)'
      and exists (
        select 1
        from public.hunt_unit_economics e
        where e.provider=d.provider and e.item_id=d.item_id
          and e.inputs_verified=true and e.profit_gate_status='PASS'
          and e.contribution_before_coupon>0 and e.max_safe_cac>0
      )
    order by coalesce(d.deal_score,0) desc, d.updated_at desc
    limit 3
  ) d
  cross join (
    values
      ('organic_social'::text,'9:16'::text,'A HUNT find worth a closer look'::text,'See the HUNT find'::text,'social'::text,'organic'::text),
      ('pinterest'::text,'2:3'::text,'Save this HUNT find'::text,'View product'::text,'pinterest'::text,'organic'::text),
      ('seo'::text,'search_copy'::text,''::text,'Explore'::text,'google'::text,'organic'::text),
      ('onsite'::text,'onsite_card'::text,'BOOM PICK'::text,'View details'::text,'hunt'::text,'owned'::text)
  ) as c(channel,format,hook,cta,utm_source,utm_medium)
  on conflict(day,channel,provider,item_id) do nothing;

  select count(*)::int into v_creative_today
  from public.hunt_creative_drafts
  where created_at::date=v_day;

  select count(*)::int into v_distribution_today
  from public.hunt_distribution_drafts
  where day=v_day;

  v_brief := jsonb_build_object(
    'day',v_day,
    'generated_at',now(),
    'funnel',jsonb_build_object(
      'sessions',v_sessions,'page_views',v_page_views,'product_views',v_product_views,
      'likes',v_likes,'saves',v_saves,'add_to_cart',v_carts,'checkout_starts',v_checkouts,
      'orders',v_orders,'gross_order_value',v_gov
    ),
    'economics',jsonb_build_object(
      'verified_positive_samples',v_econ_count,
      'avg_contribution_before_acquisition',v_avg_contribution,
      'avg_safe_cac',v_avg_safe_cac,
      'eligible_deals',v_eligible_deals
    ),
    'marketing',jsonb_build_object(
      'organic_first',true,
      'primary_channel',case when v_sessions<100 then 'seo' else 'onsite' end,
      'paid_locked',true
    ),
    'creative',jsonb_build_object(
      'drafts_today',v_creative_today,
      'rule','Only promotion-eligible products may create drafts.'
    ),
    'seo',jsonb_build_object(
      'repo_audit','boom-seo-audit.json',
      'search_console_required',true
    ),
    'love',jsonb_build_object(
      'score',round(v_love_score,1),
      'confidence',case
        when v_product_views>=500 then 'high'
        when v_product_views>=100 then 'medium'
        when v_product_views>=20 then 'low'
        else 'insufficient'
      end
    ),
    'publisher',jsonb_build_object(
      'drafts_today',v_distribution_today,
      'external_publish_enabled',false,
      'owner_approval_required',true
    ),
    'learning',jsonb_build_object(
      'experiments_ready',v_ready_experiments,
      'experiments_testing',v_testing_experiments,
      'rule','No winner without sufficient comparative evidence.'
    ),
    'next_move',jsonb_build_object(
      'code',v_next_code,'title',v_next_title,'action',v_next_action
    )
  );

  insert into public.hunt_growth_daily_briefs(
    day,generated_at,status,funnel,economics,marketing,creative,seo,love,publisher,learning,next_move,notes
  )
  values(
    v_day,now(),'draft',
    v_brief->'funnel',v_brief->'economics',v_brief->'marketing',v_brief->'creative',
    v_brief->'seo',v_brief->'love',v_brief->'publisher',v_brief->'learning',
    v_brief->'next_move','Generated by BOOM Daily Brain. Draft/internal decisions only.'
  )
  on conflict(day) do update set
    generated_at=excluded.generated_at,
    funnel=excluded.funnel,
    economics=excluded.economics,
    marketing=excluded.marketing,
    creative=excluded.creative,
    seo=excluded.seo,
    love=excluded.love,
    publisher=excluded.publisher,
    learning=excluded.learning,
    next_move=excluded.next_move,
    notes=excluded.notes;

  return v_brief;
end;
$$;

revoke all on function public.hunt_refresh_growth_daily_brief() from public, anon, authenticated;
grant execute on function public.hunt_refresh_growth_daily_brief() to postgres, service_role;

do $$
begin
  if exists(select 1 from cron.job where jobname='hunt-growth-daily-brief') then
    perform cron.unschedule('hunt-growth-daily-brief');
  end if;
  perform cron.schedule(
    'hunt-growth-daily-brief',
    '15 6 * * *',
    'select public.hunt_refresh_growth_daily_brief();'
  );
end;
$$;
