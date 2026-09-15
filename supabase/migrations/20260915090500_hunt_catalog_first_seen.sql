alter table public.hunt_catalog_products
  add column if not exists first_seen_at timestamptz;

create or replace function public.hunt_catalog_products_set_first_seen()
returns trigger
language plpgsql
as $$
begin
  if new.first_seen_at is null then
    new.first_seen_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists hunt_catalog_products_first_seen_trg
  on public.hunt_catalog_products;

create trigger hunt_catalog_products_first_seen_trg
before insert on public.hunt_catalog_products
for each row
execute function public.hunt_catalog_products_set_first_seen();

comment on column public.hunt_catalog_products.first_seen_at is
'Immutable first-seen timestamp for genuinely new catalog arrivals. Existing pre-feature rows remain null and must not be relabeled NEW.';
