-- F60T near-real-time cadence + source eligibility gate.
-- First-party World Watch runs every 10 minutes.
-- External official connectors keep their safer hourly cadence.
-- Cloudflare Radar is registered research-only pending commercial-license review.

alter table public.f60t_signal_sources
  drop constraint if exists f60t_signal_sources_status_check;

alter table public.f60t_signal_sources
  add constraint f60t_signal_sources_status_check
  check (status = any (array[
    'LIVE'::text,
    'AVAILABLE_NOT_CONNECTED'::text,
    'ACCESS_REQUIRED'::text,
    'STUDIO_ONLY'::text,
    'PENDING_API_VERIFICATION'::text,
    'PENDING_PROTOCOL_TRAFFIC'::text,
    'LICENSE_REVIEW'::text,
    'DISABLED'::text
  ]));

insert into public.f60t_signal_sources
(source_key,platform,signal_family,access_mode,status,official_reference,notes,verified_at,updated_at)
values
(
  'cloudflare_radar',
  'Cloudflare Radar',
  'global_internet_activity',
  'OFFICIAL_API',
  'LICENSE_REVIEW',
  'https://developers.cloudflare.com/radar/',
  'Official near-real-time Radar API supports 15-minute aggregation and top locations, but the free Radar dataset is published under CC BY-NC 4.0. Do not use it for HUNT commercial profit routing unless separate commercial permission/license is confirmed.',
  now(),
  now()
)
on conflict(source_key) do update set
  platform=excluded.platform,
  signal_family=excluded.signal_family,
  access_mode=excluded.access_mode,
  status=excluded.status,
  official_reference=excluded.official_reference,
  notes=excluded.notes,
  verified_at=excluded.verified_at,
  updated_at=now();

select cron.unschedule('f60t-snapshot-hourly')
where exists (
  select 1 from cron.job where jobname='f60t-snapshot-hourly'
);

select cron.unschedule('f60t-snapshot-10m')
where exists (
  select 1 from cron.job where jobname='f60t-snapshot-10m'
);

select cron.schedule(
  'f60t-snapshot-10m',
  '*/10 * * * *',
  $cron$
    select net.http_post(
      url := 'https://zszlnahjqmwozwubetkm.supabase.co/functions/v1/hunt-f60t-snapshot',
      headers := jsonb_build_object(
        'Content-Type','application/json',
        'x-f60t-cron-secret',
        (select decrypted_secret from vault.decrypted_secrets where name='f60t_cron_secret' limit 1)
      ),
      body := '{"source":"F60T_10M_CRON"}'::jsonb,
      timeout_milliseconds := 45000
    ) as request_id;
  $cron$
);
