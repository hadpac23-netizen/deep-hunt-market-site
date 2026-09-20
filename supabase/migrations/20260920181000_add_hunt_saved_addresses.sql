create table if not exists public.hunt_saved_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'default',
  recipient_name text not null,
  email text,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  region text,
  postal_code text,
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  phone text,
  is_default boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id,label)
);

alter table public.hunt_saved_addresses enable row level security;

revoke all on public.hunt_saved_addresses from anon;
grant select,insert,update,delete on public.hunt_saved_addresses to authenticated;

drop policy if exists hunt_saved_addresses_select_own on public.hunt_saved_addresses;
create policy hunt_saved_addresses_select_own
on public.hunt_saved_addresses for select to authenticated
using (auth.uid() = user_id);

drop policy if exists hunt_saved_addresses_insert_own on public.hunt_saved_addresses;
create policy hunt_saved_addresses_insert_own
on public.hunt_saved_addresses for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists hunt_saved_addresses_update_own on public.hunt_saved_addresses;
create policy hunt_saved_addresses_update_own
on public.hunt_saved_addresses for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists hunt_saved_addresses_delete_own on public.hunt_saved_addresses;
create policy hunt_saved_addresses_delete_own
on public.hunt_saved_addresses for delete to authenticated
using (auth.uid() = user_id);
