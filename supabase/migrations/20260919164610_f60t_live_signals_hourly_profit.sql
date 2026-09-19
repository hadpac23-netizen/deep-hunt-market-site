-- F60T live signals + hourly verified profit
-- Internal control-plane data: admin read only, server-side writes only.

create table if not exists public.f60t_signal_sources (
  source_key text primary key,
  platform text not null default '',
  signal_family text not null default '',
  access_mode text not null check (access_mode in ('FIRST_PARTY','OFFICIAL_API','OFFICIAL_UI','PROTOCOL_EVENT')),
  status text not null check (status in ('LIVE','AVAILABLE_NOT_CONNECTED','ACCESS_REQUIRED','STUDIO_ONLY','PENDING_API_VERIFICATION','PENDING_PROTOCOL_TRAFFIC','DISABLED')),
  official_reference text not null default '',
  notes text not null default '',
  verified_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.f60t_crowd_signal_snapshots (
  id uuid primary key default gen_random_uuid(),
  bucket_start timestamptz not null,
  source_key text not null references public.f60t_signal_sources(source_key) on delete restrict,
  platform text not null default '',
  country_code text not null default '',
  region text not null default '',
  timezone text not null default '',
  local_hour smallint check (local_hour is null or (local_hour >= 0 and local_hour <= 23)),
  category text not null default '',
  audience text not null default '',
  signal_kind text not null default 'FIRST_PARTY_INTENT',
  event_count integer not null default 0 check (event_count >= 0),
  intent_score_avg numeric(6,2) check (intent_score_avg is null or (intent_score_avg >= 0 and intent_score_avg <= 100)),
  intent_score_max numeric(6,2) check (intent_score_max is null or (intent_score_max >= 0 and intent_score_max <= 100)),
  verified boolean not null default false,
  evidence_ref text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(bucket_start,source_key,platform,country_code,region,timezone,local_hour,category,audience,signal_kind)
);

create table if not exists public.f60t_agent_signal_events (
  id uuid primary key default gen_random_uuid(),
  source_event_id text,
  occurred_at timestamptz not null,
  surface text not null default '',
  protocol text not null default '',
  event_type text not null check (event_type in ('discovered','considered','selected','cart','checkout','paid','returned')),
  country_code text not null default '',
  product_key text not null default '',
  payment_session_id uuid references public.hunt_payment_sessions(id) on delete set null,
  order_id uuid references public.hunt_orders(id) on delete set null,
  verified boolean not null default false,
  evidence_ref text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists f60t_agent_source_event_uidx
  on public.f60t_agent_signal_events(source_event_id)
  where source_event_id is not null and source_event_id <> '';

create table if not exists public.f60t_hourly_profit_ledger (
  id uuid primary key default gen_random_uuid(),
  hour_start timestamptz not null,
  currency text not null default 'USD',
  verified_net_profit numeric(14,2) not null default 0,
  locked_contribution numeric(14,2) not null default 0,
  confirmed_real_orders integer not null default 0 check (confirmed_real_orders >= 0),
  settled_real_orders integer not null default 0 check (settled_real_orders >= 0),
  evidence_rows integer not null default 0 check (evidence_rows >= 0),
  verification_status text not null check (verification_status in ('UNVERIFIED','LOCKED_EVIDENCE','PARTIAL','VERIFIED')),
  source_mode text not null default 'M29_PURCHASE_BRIDGE',
  evidence jsonb not null default '{}'::jsonb,
  calculated_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(hour_start,currency)
);

create index if not exists f60t_crowd_source_idx
  on public.f60t_crowd_signal_snapshots(source_key);
create index if not exists f60t_crowd_bucket_idx
  on public.f60t_crowd_signal_snapshots(bucket_start desc);
create index if not exists f60t_crowd_market_idx
  on public.f60t_crowd_signal_snapshots(country_code,platform,bucket_start desc);
create index if not exists f60t_agent_occurred_idx
  on public.f60t_agent_signal_events(occurred_at desc);
create index if not exists f60t_agent_surface_idx
  on public.f60t_agent_signal_events(surface,event_type,occurred_at desc);
create index if not exists f60t_agent_payment_session_idx
  on public.f60t_agent_signal_events(payment_session_id);
create index if not exists f60t_agent_order_idx
  on public.f60t_agent_signal_events(order_id);
create index if not exists f60t_profit_hour_idx
  on public.f60t_hourly_profit_ledger(hour_start desc);

alter table public.f60t_signal_sources enable row level security;
alter table public.f60t_crowd_signal_snapshots enable row level security;
alter table public.f60t_agent_signal_events enable row level security;
alter table public.f60t_hourly_profit_ledger enable row level security;

revoke all on table public.f60t_signal_sources from anon;
revoke all on table public.f60t_crowd_signal_snapshots from anon;
revoke all on table public.f60t_agent_signal_events from anon;
revoke all on table public.f60t_hourly_profit_ledger from anon;

revoke all on table public.f60t_signal_sources from authenticated;
revoke all on table public.f60t_crowd_signal_snapshots from authenticated;
revoke all on table public.f60t_agent_signal_events from authenticated;
revoke all on table public.f60t_hourly_profit_ledger from authenticated;

grant select on table public.f60t_signal_sources to authenticated;
grant select on table public.f60t_crowd_signal_snapshots to authenticated;
grant select on table public.f60t_agent_signal_events to authenticated;
grant select on table public.f60t_hourly_profit_ledger to authenticated;

drop policy if exists "Admins read F60T signal sources" on public.f60t_signal_sources;
create policy "Admins read F60T signal sources"
on public.f60t_signal_sources for select
to authenticated
using (exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_admin));

drop policy if exists "Admins read F60T crowd signals" on public.f60t_crowd_signal_snapshots;
create policy "Admins read F60T crowd signals"
on public.f60t_crowd_signal_snapshots for select
to authenticated
using (exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_admin));

drop policy if exists "Admins read F60T agent signals" on public.f60t_agent_signal_events;
create policy "Admins read F60T agent signals"
on public.f60t_agent_signal_events for select
to authenticated
using (exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_admin));

drop policy if exists "Admins read F60T hourly profit" on public.f60t_hourly_profit_ledger;
create policy "Admins read F60T hourly profit"
on public.f60t_hourly_profit_ledger for select
to authenticated
using (exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_admin));

insert into public.f60t_signal_sources
(source_key,platform,signal_family,access_mode,status,official_reference,notes,verified_at,updated_at)
values
('hunt_first_party','HUNT','commerce_intent','FIRST_PARTY','LIVE','','Consented first-party commerce events aggregated server-side; no precise location.',now(),now()),
('pinterest_trends','Pinterest','trend','OFFICIAL_API','AVAILABLE_NOT_CONNECTED','https://developers.pinterest.com/docs/analytics-and-reports/trends/','Official Trends API exists; connection/OAuth not yet configured.',now(),now()),
('pinterest_audience','Pinterest','audience','OFFICIAL_API','AVAILABLE_NOT_CONNECTED','https://developers.pinterest.com/docs/analytics-and-reports/audience-insights/','Official Audience Insights API exists for eligible business accounts; not yet connected.',now(),now()),
('google_trends_alpha','Google','trend','OFFICIAL_API','ACCESS_REQUIRED','https://developers.google.com/search/apis/trends','Google Trends API is alpha/early-access; do not mark live without approved access.',now(),now()),
('youtube_audience_time','YouTube','audience_time','OFFICIAL_UI','STUDIO_ONLY','https://support.google.com/youtube/answer/9314416','When-your-viewers-are-on-YouTube is verified in Studio; no public API endpoint is claimed here.',now(),now()),
('tiktok_market_scope','TikTok','market_intent','OFFICIAL_UI','PENDING_API_VERIFICATION','','Market Scope can inform research when connected; no public API capability is assumed by F60T until verified.',now(),now()),
('agent_commerce','AI Agents','agent_commerce','PROTOCOL_EVENT','PENDING_PROTOCOL_TRAFFIC','','UCP/ACP/MCP/A2A/AP2 event ledger is ready; live agent traffic not claimed until verified events arrive.',now(),now())
on conflict(source_key) do update set
  platform=excluded.platform,
  signal_family=excluded.signal_family,
  access_mode=excluded.access_mode,
  status=excluded.status,
  official_reference=excluded.official_reference,
  notes=excluded.notes,
  verified_at=excluded.verified_at,
  updated_at=now();
