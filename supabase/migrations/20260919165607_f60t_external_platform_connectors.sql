-- F60T external official-platform connector audit trail

create table if not exists public.f60t_external_signal_runs (
  id uuid primary key default gen_random_uuid(),
  source_key text not null references public.f60t_signal_sources(source_key) on delete restrict,
  action text not null default '',
  status text not null check (status in ('STARTED','SKIPPED_CONFIG','SUCCESS','FAILED')),
  region text not null default '',
  rows_written integer not null default 0 check (rows_written >= 0),
  http_status integer,
  evidence_ref text not null default '',
  error_code text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists f60t_external_runs_source_idx
  on public.f60t_external_signal_runs(source_key,started_at desc);
create index if not exists f60t_external_runs_status_idx
  on public.f60t_external_signal_runs(status,started_at desc);

alter table public.f60t_external_signal_runs enable row level security;
revoke all on table public.f60t_external_signal_runs from anon;
revoke all on table public.f60t_external_signal_runs from authenticated;
grant select on table public.f60t_external_signal_runs to authenticated;

drop policy if exists "Admins read F60T external runs" on public.f60t_external_signal_runs;
create policy "Admins read F60T external runs"
on public.f60t_external_signal_runs for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id=(select auth.uid()) and p.is_admin
  )
);

insert into public.f60t_signal_sources
(source_key,platform,signal_family,access_mode,status,official_reference,notes,verified_at,updated_at)
values
('youtube_analytics','YouTube','channel_geo_traffic','OFFICIAL_API','AVAILABLE_NOT_CONNECTED','https://developers.google.com/youtube/analytics/reference/reports/query','Official YouTube Analytics API supports country and traffic-source reports; it is not treated as an hourly audience-time API.',now(),now())
on conflict(source_key) do update set
  platform=excluded.platform,
  signal_family=excluded.signal_family,
  access_mode=excluded.access_mode,
  official_reference=excluded.official_reference,
  notes=excluded.notes,
  updated_at=now();

update public.f60t_signal_sources
set official_reference='https://developers.tiktok.com/doc/display-api-overview/',
    notes='TikTok Display API is verified for profile/video metadata, not a global audience heatmap. Market Scope remains non-API until an official programmable surface is verified.',
    updated_at=now()
where source_key='tiktok_market_scope';

update public.f60t_signal_sources
set notes='Official Trends API. Connector requires a valid Pinterest access token. Successful API sync is required before status becomes LIVE.',
    updated_at=now()
where source_key='pinterest_trends';

update public.f60t_signal_sources
set notes='Official Audience Insights API. Requires Pinterest business/ad-account context and valid API authorization. Successful API sync is required before status becomes LIVE.',
    updated_at=now()
where source_key='pinterest_audience';
