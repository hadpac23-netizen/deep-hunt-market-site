-- BOOM Media Vault: private generated-media storage + metadata ledger.
-- Migration source only. Do not apply to production without Owner approval.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('boom-media-vault', 'boom-media-vault', false, 104857600, array['video/mp4','video/webm'])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.boom_media_assets (
  id uuid primary key default gen_random_uuid(),
  mission_id text not null,
  creative_asset_id text not null,
  product_item_id text not null,
  product_variant_id text,
  source_provider text not null check (source_provider in ('runway-gen45','veo-3.1','other')),
  provider_task_id text,
  provider_output_index integer not null default 0 check (provider_output_index >= 0),
  storage_bucket text not null default 'boom-media-vault' check (storage_bucket = 'boom-media-vault'),
  storage_path text not null unique,
  media_kind text not null default 'video' check (media_kind = 'video'),
  mime_type text not null check (mime_type in ('video/mp4','video/webm')),
  byte_size bigint not null check (byte_size > 0 and byte_size <= 52428800),
  duration_seconds numeric(8,3) not null check (duration_seconds > 0 and duration_seconds <= 60),
  aspect_ratio text not null check (aspect_ratio = '9:16'),
  sha256 text,
  prompt_hash text,
  product_truth_verified_at timestamptz not null,
  status text not null default 'GENERATED_PENDING_INGEST' check (status in (
    'GENERATED_PENDING_INGEST','STORED_PENDING_QA','QA_PASSED','QA_FAILED','OWNER_APPROVED','REJECTED'
  )),
  qa_json jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  owner_approved_at timestamptz,
  ingested_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mission_id, creative_asset_id)
);

alter table public.boom_media_assets enable row level security;

create policy "boom_media_assets_admin_read"
on public.boom_media_assets for select
to authenticated
using (exists (
  select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true
));

create policy "boom_media_vault_admin_read"
on storage.objects for select
to authenticated
using (
  bucket_id = 'boom-media-vault'
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
);

comment on table public.boom_media_assets is
'Private BOOM generated-media ledger. Writes are server/service-role only; QA pass never implies publishing approval.';
