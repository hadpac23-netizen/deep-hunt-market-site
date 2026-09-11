alter table public.hunt_shelf_coverage
  add column if not exists curated_eligible_products integer
    check (curated_eligible_products is null or curated_eligible_products >= 0),
  add column if not exists curation_source text;
