alter table public.hunt_catalog_products
  add column if not exists brand text,
  add column if not exists ean text,
  add column if not exists supplier_sku text,
  add column if not exists product_line text,
  add column if not exists volume_ml numeric,
  add column if not exists concentration text,
  add column if not exists gender text,
  add column if not exists stock_quantity integer,
  add column if not exists source_region text,
  add column if not exists authenticity_status text not null default 'unverified',
  add column if not exists last_stock_check_at timestamptz;

create index if not exists hunt_catalog_products_brand_idx
  on public.hunt_catalog_products (brand, updated_at desc)
  where brand is not null;

create index if not exists hunt_catalog_products_ean_idx
  on public.hunt_catalog_products (ean)
  where ean is not null;
