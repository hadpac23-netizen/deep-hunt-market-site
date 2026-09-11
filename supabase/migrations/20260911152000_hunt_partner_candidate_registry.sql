create table if not exists public.hunt_partner_candidates (
  slug text primary key check (slug ~ '^[a-z0-9-]+$'),
  partner_name text not null,
  vertical text not null,
  program_type text not null,
  approval_required boolean not null default true,
  catalog_access text not null default 'unknown',
  media_assets text not null default 'unknown',
  promotions_allowed text not null default 'unknown',
  checkout_mode text not null default 'offsite',
  regions text[] not null default '{}',
  status text not null default 'research'
    check (status in ('research','candidate','ready_to_apply','applied','approved','rejected','blocked')),
  priority integer not null default 3 check (priority between 1 and 5),
  evidence_url text,
  notes text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.hunt_partner_candidates enable row level security;

create index if not exists hunt_partner_candidates_status_idx
  on public.hunt_partner_candidates (status, priority desc, vertical);
