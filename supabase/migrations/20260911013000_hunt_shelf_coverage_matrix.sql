create table if not exists public.hunt_shelf_coverage (
  shelf_slug text primary key check (shelf_slug ~ '^[a-z0-9]+$'),
  static_unique_products integer not null default 0 check (static_unique_products >= 0),
  live_verified_products integer check (live_verified_products is null or live_verified_products >= 0),
  providers text[] not null default '{}',
  coverage_status text not null default 'unknown'
    check (coverage_status in ('critical','weak','ok','strong','unknown')),
  last_static_audit_at timestamptz,
  last_live_audit_at timestamptz,
  notes text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.hunt_shelf_coverage enable row level security;

create index if not exists hunt_shelf_coverage_status_idx
  on public.hunt_shelf_coverage (coverage_status, static_unique_products);
