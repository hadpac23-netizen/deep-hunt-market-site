-- HUNT DEAL canonical live operations health
-- READ-ONLY. Source of truth for CJ + EPROLO launch operations.
-- No product visibility, payment, supplier order or production state is changed.

with providers(provider) as (
  values ('CJdropshipping'::text),('EPROLO'::text)
),
policies as (
  select p.provider,r.mode,r.stock_refresh_minutes,r.price_refresh_minutes,r.shipping_refresh_minutes,
         r.stale_after_minutes,r.prepayment_live_recheck,r.presupplier_live_recheck,r.failure_action,r.updated_at
  from providers p
  left join private.hunt_supplier_refresh_policy r using(provider)
),
latest_observation as (
  select distinct on (provider,item_id,coalesce(payload->>'variant_id',''),coalesce(destination_country,''))
         provider,item_id,coalesce(payload->>'variant_id','') as variant_id,
         destination_country,availability_verified,price_amount,shipping_amount,payload,observed_at
  from public.hunt_product_observations
  where provider in ('CJdropshipping','EPROLO')
  order by provider,item_id,coalesce(payload->>'variant_id',''),coalesce(destination_country,''),observed_at desc,id desc
),
obs_health as (
  select o.provider,
         count(*) as observed_variant_markets,
         count(*) filter (where o.observed_at >= now() - make_interval(mins=>p.stale_after_minutes)) as fresh,
         count(*) filter (where o.observed_at < now() - make_interval(mins=>p.stale_after_minutes)) as stale,
         count(*) filter (where coalesce(o.availability_verified,false)=false) as availability_unverified,
         count(*) filter (where coalesce(lower(o.payload->>'shipping_verified'),'false') <> 'true' and coalesce(o.destination_country,'')<>'') as shipping_unverified,
         max(o.observed_at) as latest_observed_at
  from latest_observation o
  join policies p using(provider)
  where p.stale_after_minutes is not null
  group by o.provider
),
econ as (
  select provider,
         count(*) filter (where inputs_verified=true and profit_gate_status='PASS') as verified_profit_pass,
         count(*) filter (where inputs_verified=false or profit_gate_status<>'PASS') as profit_not_ready,
         max(calculated_at) as latest_economics_at
  from public.hunt_unit_economics
  where provider in ('CJdropshipping','EPROLO')
  group by provider
),
exceptions as (
  select provider,
         count(*) filter (where status<>'resolved') as open_exceptions,
         count(*) filter (where status<>'resolved' and severity='critical') as critical_open,
         min(opened_at) filter (where status<>'resolved') as oldest_opened_at
  from private.hunt_ops_exceptions
  where provider in ('CJdropshipping','EPROLO')
  group by provider
),
fulfillment as (
  select provider,
         count(*) filter (where status in ('processing','submitted') and updated_at < now()-interval '30 minutes') as stuck_over_30m,
         count(*) filter (where status='failed') as failed,
         max(updated_at) as latest_fulfillment_update
  from public.hunt_fulfillment_orders
  where provider in ('CJdropshipping','EPROLO')
  group by provider
)
select p.provider,
       case when p.stale_after_minutes is null then 'MISSING' else 'PRESENT' end as refresh_policy_status,
       p.mode,p.stock_refresh_minutes,p.price_refresh_minutes,p.shipping_refresh_minutes,p.stale_after_minutes,
       p.prepayment_live_recheck,p.presupplier_live_recheck,p.failure_action,
       coalesce(h.observed_variant_markets,0) as observed_variant_markets,
       coalesce(h.fresh,0) as fresh_variant_markets,
       coalesce(h.stale,0) as stale_variant_markets,
       coalesce(h.availability_unverified,0) as availability_unverified,
       coalesce(h.shipping_unverified,0) as shipping_unverified,
       h.latest_observed_at,
       coalesce(e.verified_profit_pass,0) as verified_profit_pass,
       coalesce(e.profit_not_ready,0) as profit_not_ready,
       e.latest_economics_at,
       coalesce(x.open_exceptions,0) as open_exceptions,
       coalesce(x.critical_open,0) as critical_open,
       x.oldest_opened_at,
       coalesce(f.stuck_over_30m,0) as stuck_fulfillment_over_30m,
       coalesce(f.failed,0) as failed_fulfillment,
       f.latest_fulfillment_update
from policies p
left join obs_health h using(provider)
left join econ e using(provider)
left join exceptions x using(provider)
left join fulfillment f using(provider)
order by p.provider;
