-- BOOM M28 — CAMPAIGN ATTRIBUTION LEDGER — APPLIED SOURCE
-- Applied as migration 20260919142109_campaign_attribution_ledger.
-- RLS deny-all hardening applied separately as 20260919142135_harden_campaign_attribution_ledger_rls.
-- Backend-only attribution evidence. No payment/ad activation.

set local lock_timeout = '5s';
set local statement_timeout = '30s';

create table if not exists public.hunt_attribution_ledger (
  id uuid primary key default gen_random_uuid(),
  payment_session_id uuid not null unique
    references public.hunt_payment_sessions(id) on delete cascade,
  order_id uuid null
    references public.hunt_orders(id) on delete set null,

  context_status text not null default 'NO_CONTEXT'
    check (context_status in ('NO_CONTEXT','BROWSER_CONTEXT_UNVERIFIED','SERVER_CONTEXT_VERIFIED')),

  first_utm_source text null,
  first_utm_medium text null,
  first_utm_campaign text null,
  last_utm_source text null,
  last_utm_medium text null,
  last_utm_campaign text null,

  click_provider text null
    check (click_provider is null or click_provider in ('GOOGLE_ADS','META','TIKTOK_ADS','MICROSOFT_ADS')),
  click_id_type text null
    check (click_id_type is null or click_id_type in ('gclid','fbclid','ttclid','msclkid')),
  click_id_digest text null
    check (click_id_digest is null or click_id_digest ~ '^[0-9a-f]{64}$'),

  provider_validation_status text not null default 'NO_PROVIDER_CLICK_ID'
    check (provider_validation_status in (
      'NO_PROVIDER_CLICK_ID',
      'PENDING_PROVIDER_VALIDATION',
      'VERIFIED',
      'REJECTED',
      'AMBIGUOUS_PROVIDER_CLICK_IDS'
    )),
  provider_validation_evidence_ref text null,
  provider_validated_at timestamptz null,

  purchase_status text not null default 'NOT_CONFIRMED'
    check (purchase_status in ('NOT_CONFIRMED','SERVER_CONFIRMED','REFUNDED','CHARGEBACK')),
  purchase_confirmed_at timestamptz null,
  conversion_claim_allowed boolean not null default false,

  source_payment_session_created_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint hunt_attribution_verified_evidence_check check (
    provider_validation_status <> 'VERIFIED'
    or (
      click_id_digest is not null
      and provider_validation_evidence_ref is not null
      and provider_validated_at is not null
    )
  ),
  constraint hunt_attribution_conversion_claim_check check (
    conversion_claim_allowed = false
    or (
      purchase_status = 'SERVER_CONFIRMED'
      and provider_validation_status = 'VERIFIED'
    )
  )
);

alter table public.hunt_attribution_ledger enable row level security;
revoke all on table public.hunt_attribution_ledger from public, anon, authenticated;
grant select, insert, update, delete on table public.hunt_attribution_ledger to service_role;

create index if not exists hunt_attribution_ledger_validation_idx
  on public.hunt_attribution_ledger(provider_validation_status, click_provider);
create index if not exists hunt_attribution_ledger_click_digest_idx
  on public.hunt_attribution_ledger(click_id_digest)
  where click_id_digest is not null;
create index if not exists hunt_attribution_ledger_order_idx
  on public.hunt_attribution_ledger(order_id)
  where order_id is not null;

create or replace function public.hunt_capture_attribution_ledger()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  a jsonb := coalesce(new.commerce_snapshot->'attribution','{}'::jsonb);
  first_touch jsonb := coalesce(a->'first_touch','{}'::jsonb);
  last_touch jsonb := coalesce(a->'last_touch','{}'::jsonb);
  gclid_v text := nullif(coalesce(last_touch->>'gclid',first_touch->>'gclid'),'');
  fbclid_v text := nullif(coalesce(last_touch->>'fbclid',first_touch->>'fbclid'),'');
  ttclid_v text := nullif(coalesce(last_touch->>'ttclid',first_touch->>'ttclid'),'');
  msclkid_v text := nullif(coalesce(last_touch->>'msclkid',first_touch->>'msclkid'),'');
  click_count integer;
  click_value text;
  provider_v text;
  click_type_v text;
  validation_v text;
begin
  click_count :=
    (case when gclid_v is null then 0 else 1 end) +
    (case when fbclid_v is null then 0 else 1 end) +
    (case when ttclid_v is null then 0 else 1 end) +
    (case when msclkid_v is null then 0 else 1 end);

  if click_count > 1 then
    validation_v := 'AMBIGUOUS_PROVIDER_CLICK_IDS';
  elsif click_count = 1 then
    validation_v := 'PENDING_PROVIDER_VALIDATION';
    if gclid_v is not null then provider_v := 'GOOGLE_ADS'; click_type_v := 'gclid'; click_value := gclid_v;
    elsif fbclid_v is not null then provider_v := 'META'; click_type_v := 'fbclid'; click_value := fbclid_v;
    elsif ttclid_v is not null then provider_v := 'TIKTOK_ADS'; click_type_v := 'ttclid'; click_value := ttclid_v;
    elsif msclkid_v is not null then provider_v := 'MICROSOFT_ADS'; click_type_v := 'msclkid'; click_value := msclkid_v;
    end if;
  else
    validation_v := 'NO_PROVIDER_CLICK_ID';
  end if;

  insert into public.hunt_attribution_ledger(
    payment_session_id,order_id,context_status,
    first_utm_source,first_utm_medium,first_utm_campaign,
    last_utm_source,last_utm_medium,last_utm_campaign,
    click_provider,click_id_type,click_id_digest,
    provider_validation_status,purchase_status,conversion_claim_allowed,
    source_payment_session_created_at,updated_at
  ) values (
    new.id,new.order_id,
    case when a = '{}'::jsonb then 'NO_CONTEXT' else 'BROWSER_CONTEXT_UNVERIFIED' end,
    nullif(first_touch->>'utm_source',''),nullif(first_touch->>'utm_medium',''),nullif(first_touch->>'utm_campaign',''),
    nullif(last_touch->>'utm_source',''),nullif(last_touch->>'utm_medium',''),nullif(last_touch->>'utm_campaign',''),
    provider_v,click_type_v,
    case when click_value is null then null else encode(extensions.digest(click_value,'sha256'),'hex') end,
    validation_v,'NOT_CONFIRMED',false,new.created_at,now()
  )
  on conflict (payment_session_id) do nothing;

  return new;
end;
$$;

revoke all on function public.hunt_capture_attribution_ledger() from public, anon, authenticated;
grant execute on function public.hunt_capture_attribution_ledger() to service_role;

drop trigger if exists hunt_payment_session_capture_attribution on public.hunt_payment_sessions;
create trigger hunt_payment_session_capture_attribution
after insert on public.hunt_payment_sessions
for each row execute function public.hunt_capture_attribution_ledger();

-- Truth-preserving backfill: one row per existing payment session.
-- Raw click IDs are used only transiently inside this SQL to compute SHA-256.
with src as (
  select
    s.*,
    coalesce(s.commerce_snapshot->'attribution','{}'::jsonb) as a,
    coalesce(s.commerce_snapshot->'attribution'->'first_touch','{}'::jsonb) as f,
    coalesce(s.commerce_snapshot->'attribution'->'last_touch','{}'::jsonb) as l
  from public.hunt_payment_sessions s
), clicks as (
  select src.*,
    nullif(coalesce(l->>'gclid',f->>'gclid'),'') as gclid_v,
    nullif(coalesce(l->>'fbclid',f->>'fbclid'),'') as fbclid_v,
    nullif(coalesce(l->>'ttclid',f->>'ttclid'),'') as ttclid_v,
    nullif(coalesce(l->>'msclkid',f->>'msclkid'),'') as msclkid_v
  from src
), classified as (
  select clicks.*,
    ((gclid_v is not null)::int + (fbclid_v is not null)::int + (ttclid_v is not null)::int + (msclkid_v is not null)::int) as click_count,
    case
      when gclid_v is not null then 'GOOGLE_ADS'
      when fbclid_v is not null then 'META'
      when ttclid_v is not null then 'TIKTOK_ADS'
      when msclkid_v is not null then 'MICROSOFT_ADS'
      else null
    end as provider_v,
    case
      when gclid_v is not null then 'gclid'
      when fbclid_v is not null then 'fbclid'
      when ttclid_v is not null then 'ttclid'
      when msclkid_v is not null then 'msclkid'
      else null
    end as click_type_v,
    coalesce(gclid_v,fbclid_v,ttclid_v,msclkid_v) as click_value
  from clicks
)
insert into public.hunt_attribution_ledger(
  payment_session_id,order_id,context_status,
  first_utm_source,first_utm_medium,first_utm_campaign,
  last_utm_source,last_utm_medium,last_utm_campaign,
  click_provider,click_id_type,click_id_digest,
  provider_validation_status,purchase_status,conversion_claim_allowed,
  source_payment_session_created_at,updated_at
)
select
  id,order_id,
  case when a='{}'::jsonb then 'NO_CONTEXT' else 'BROWSER_CONTEXT_UNVERIFIED' end,
  nullif(f->>'utm_source',''),nullif(f->>'utm_medium',''),nullif(f->>'utm_campaign',''),
  nullif(l->>'utm_source',''),nullif(l->>'utm_medium',''),nullif(l->>'utm_campaign',''),
  case when click_count=1 then provider_v else null end,
  case when click_count=1 then click_type_v else null end,
  case when click_count=1 and click_value is not null then encode(extensions.digest(click_value,'sha256'),'hex') else null end,
  case when click_count=0 then 'NO_PROVIDER_CLICK_ID'
       when click_count=1 then 'PENDING_PROVIDER_VALIDATION'
       else 'AMBIGUOUS_PROVIDER_CLICK_IDS' end,
  'NOT_CONFIRMED',false,created_at,now()
from classified
on conflict (payment_session_id) do nothing;