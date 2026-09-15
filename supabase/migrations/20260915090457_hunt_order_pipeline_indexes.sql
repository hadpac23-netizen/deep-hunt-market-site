create index if not exists hunt_order_pipeline_runs_order_idx
  on public.hunt_order_pipeline_runs(order_id)
  where order_id is not null;

create index if not exists hunt_order_pipeline_runs_created_by_idx
  on public.hunt_order_pipeline_runs(created_by)
  where created_by is not null;
