-- F60T OAuth metadata + protected hourly scheduler.
-- Tokens are stored in Supabase Vault only, never in public tables.

create table if not exists public.f60t_oauth_connections (
  provider text primary key check (provider in ('pinterest','youtube')),
  status text not null default 'DISCONNECTED'
    check (status in ('DISCONNECTED','CONFIG_REQUIRED','CONNECTED','TOKEN_EXPIRED','ERROR')),
  scopes text[] not null default '{}'::text[],
  external_account_id text not null default '',
  vault_access_secret_name text not null default '',
  vault_refresh_secret_name text not null default '',
  expires_at timestamptz,
  connected_by uuid references auth.users(id) on delete set null,
  connected_at timestamptz,
  last_refresh_at timestamptz,
  last_error_code text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.f60t_oauth_states (
  state_hash text primary key,
  provider text not null check (provider in ('pinterest','youtube')),
  created_by uuid not null references auth.users(id) on delete cascade,
  redirect_uri text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.f60t_cron_auth (
  key text primary key,
  secret_hash text not null,
  updated_at timestamptz not null default now()
);

create index if not exists f60t_oauth_connections_connected_by_idx
  on public.f60t_oauth_connections(connected_by);
create index if not exists f60t_oauth_connections_status_idx
  on public.f60t_oauth_connections(status,updated_at desc);
create index if not exists f60t_oauth_states_expiry_idx
  on public.f60t_oauth_states(expires_at);
create index if not exists f60t_oauth_states_creator_idx
  on public.f60t_oauth_states(created_by,created_at desc);

alter table public.f60t_oauth_connections enable row level security;
alter table public.f60t_oauth_states enable row level security;
alter table public.f60t_cron_auth enable row level security;

revoke all on table public.f60t_oauth_connections from anon;
revoke all on table public.f60t_oauth_states from anon;
revoke all on table public.f60t_cron_auth from anon;

revoke all on table public.f60t_oauth_connections from authenticated;
revoke all on table public.f60t_oauth_states from authenticated;
revoke all on table public.f60t_cron_auth from authenticated;

grant select on table public.f60t_oauth_connections to authenticated;

drop policy if exists "Admins read F60T OAuth connections" on public.f60t_oauth_connections;
create policy "Admins read F60T OAuth connections"
on public.f60t_oauth_connections for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id=(select auth.uid()) and p.is_admin
  )
);

-- Bootstrap one scheduler secret. The plaintext exists only in Vault.
do $$
declare
  v_secret text;
begin
  select decrypted_secret into v_secret
  from vault.decrypted_secrets
  where name='f60t_cron_secret'
  limit 1;

  if coalesce(v_secret,'')='' then
    v_secret := encode(gen_random_bytes(32),'hex');
    perform vault.create_secret(
      v_secret,
      'f60t_cron_secret',
      'F60T hourly read-only scheduler authentication'
    );
  end if;

  insert into public.f60t_cron_auth(key,secret_hash,updated_at)
  values (
    'hourly',
    encode(digest(v_secret,'sha256'),'hex'),
    now()
  )
  on conflict(key) do update set
    secret_hash=excluded.secret_hash,
    updated_at=excluded.updated_at;
end $$;

insert into public.f60t_oauth_connections(provider,status,updated_at)
values
  ('pinterest','DISCONNECTED',now()),
  ('youtube','DISCONNECTED',now())
on conflict(provider) do nothing;

-- Hourly read-only external signal sync.
select cron.schedule(
  'f60t-external-signals-hourly',
  '0 * * * *',
  $cron$
    select net.http_post(
      url := 'https://zszlnahjqmwozwubetkm.supabase.co/functions/v1/hunt-f60t-external-signals',
      headers := jsonb_build_object(
        'Content-Type','application/json',
        'x-f60t-cron-secret',
        (select decrypted_secret from vault.decrypted_secrets where name='f60t_cron_secret' limit 1)
      ),
      body := '{"action":"sync_available"}'::jsonb,
      timeout_milliseconds := 45000
    ) as request_id;
  $cron$
);

-- Snapshot runs after the external sync window; both remain read-only measurement jobs.
select cron.schedule(
  'f60t-snapshot-hourly',
  '10 * * * *',
  $cron$
    select net.http_post(
      url := 'https://zszlnahjqmwozwubetkm.supabase.co/functions/v1/hunt-f60t-snapshot',
      headers := jsonb_build_object(
        'Content-Type','application/json',
        'x-f60t-cron-secret',
        (select decrypted_secret from vault.decrypted_secrets where name='f60t_cron_secret' limit 1)
      ),
      body := '{"source":"F60T_HOURLY_CRON"}'::jsonb,
      timeout_milliseconds := 45000
    ) as request_id;
  $cron$
);
