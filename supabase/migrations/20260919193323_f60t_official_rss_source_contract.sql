alter table public.f60t_signal_sources
  drop constraint if exists f60t_signal_sources_access_mode_check;

alter table public.f60t_signal_sources
  add constraint f60t_signal_sources_access_mode_check
  check (access_mode = any (array[
    'FIRST_PARTY'::text,
    'OFFICIAL_API'::text,
    'OFFICIAL_UI'::text,
    'OFFICIAL_RSS'::text,
    'PROTOCOL_EVENT'::text
  ]));

alter table public.f60t_signal_sources
  drop constraint if exists f60t_signal_sources_status_check;

alter table public.f60t_signal_sources
  add constraint f60t_signal_sources_status_check
  check (status = any (array[
    'LIVE'::text,
    'AVAILABLE'::text,
    'AVAILABLE_NOT_CONNECTED'::text,
    'ACCESS_REQUIRED'::text,
    'STUDIO_ONLY'::text,
    'PENDING_API_VERIFICATION'::text,
    'PENDING_PROTOCOL_TRAFFIC'::text,
    'LICENSE_REVIEW'::text,
    'DISABLED'::text
  ]));
