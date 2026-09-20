-- HUNT legal document registry.
-- No legal content is fabricated by this migration.
-- Public readers can see only owner-approved published documents.
-- Draft/review/publish mutations remain admin-only under RLS.

create table if not exists public.hunt_legal_document_versions (
  id uuid primary key default gen_random_uuid(),
  doc_key text not null,
  version text not null,
  title text not null,
  body_markdown text not null default '',
  status text not null default 'draft',
  owner_approved boolean not null default false,
  effective_at timestamptz,
  published_at timestamptz,
  supersedes_id uuid references public.hunt_legal_document_versions(id) on delete set null,
  identity_snapshot jsonb not null default '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint hunt_legal_document_versions_doc_key_check
    check (doc_key in ('terms','privacy','returns','shipping')),
  constraint hunt_legal_document_versions_status_check
    check (status in ('draft','review','published','retired')),
  constraint hunt_legal_document_versions_version_nonempty
    check (length(btrim(version)) > 0),
  constraint hunt_legal_document_versions_title_nonempty
    check (length(btrim(title)) > 0),
  constraint hunt_legal_document_versions_publish_guard
    check (
      status <> 'published'
      or (
        owner_approved = true
        and effective_at is not null
        and published_at is not null
        and length(btrim(body_markdown)) > 0
      )
    ),
  unique (doc_key, version)
);

create unique index if not exists hunt_legal_one_published_per_doc_key
  on public.hunt_legal_document_versions(doc_key)
  where status = 'published';

create index if not exists hunt_legal_document_versions_status_idx
  on public.hunt_legal_document_versions(status, owner_approved, doc_key);

alter table public.hunt_legal_document_versions enable row level security;

drop policy if exists "public_read_published_hunt_legal_documents"
  on public.hunt_legal_document_versions;
create policy "public_read_published_hunt_legal_documents"
on public.hunt_legal_document_versions
for select
to anon, authenticated
using (
  status = 'published'
  and owner_approved = true
  and effective_at is not null
  and effective_at <= now()
  and published_at is not null
);

drop policy if exists "admins_manage_hunt_legal_documents"
  on public.hunt_legal_document_versions;
create policy "admins_manage_hunt_legal_documents"
on public.hunt_legal_document_versions
for all
to authenticated
using ((select public.is_admin_user()))
with check ((select public.is_admin_user()));

revoke all privileges on table public.hunt_legal_document_versions from anon, authenticated;
grant select on table public.hunt_legal_document_versions to anon, authenticated;
grant insert, update, delete on table public.hunt_legal_document_versions to authenticated;

comment on table public.hunt_legal_document_versions is
  'Versioned HUNT legal documents. Only owner-approved published rows are public. Draft/review management is admin-only.';
comment on column public.hunt_legal_document_versions.body_markdown is
  'Owner/counsel-supplied legal text. Never auto-populate with unverified legal claims.';
comment on column public.hunt_legal_document_versions.identity_snapshot is
  'Optional snapshot of the approved business identity associated with this legal version.';

do $assert$
declare
  v_public_policy integer;
  v_admin_policy integer;
  v_anon_write integer;
begin
  select count(*) into v_public_policy
  from pg_catalog.pg_policies
  where schemaname = 'public'
    and tablename = 'hunt_legal_document_versions'
    and policyname = 'public_read_published_hunt_legal_documents'
    and cmd = 'SELECT';

  if v_public_policy <> 1 then
    raise exception 'LEGAL_REGISTRY_HARDENING_FAILED: public read policy missing';
  end if;

  select count(*) into v_admin_policy
  from pg_catalog.pg_policies
  where schemaname = 'public'
    and tablename = 'hunt_legal_document_versions'
    and policyname = 'admins_manage_hunt_legal_documents'
    and cmd = 'ALL';

  if v_admin_policy <> 1 then
    raise exception 'LEGAL_REGISTRY_HARDENING_FAILED: admin management policy missing';
  end if;

  select count(*) into v_anon_write
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name = 'hunt_legal_document_versions'
    and grantee = 'anon'
    and privilege_type in ('INSERT','UPDATE','DELETE','TRUNCATE','TRIGGER','REFERENCES');

  if v_anon_write <> 0 then
    raise exception 'LEGAL_REGISTRY_HARDENING_FAILED: anon has write privileges';
  end if;
end
$assert$;
