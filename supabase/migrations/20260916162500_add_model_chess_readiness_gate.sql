-- Machine gate for BOOM Model Chess readiness.

create or replace function private.hunt_boom_model_chess_readiness(
  p_task_class text default 'owner_chat',
  p_min_samples integer default 5
)
returns jsonb
language sql
security invoker
set search_path=public,private
as $$
with per_model as (
  select
    provider,
    model,
    count(*) filter(where success)::int as successful_samples,
    count(*) filter(where success and latency_ms is not null)::int as latency_samples,
    count(*) filter(where success and estimated_cost_usd is not null)::int as cost_samples,
    count(*) filter(where success and quality_score is not null)::int as quality_samples,
    avg(latency_ms) filter(where success and latency_ms is not null) as avg_latency_ms,
    avg(estimated_cost_usd) filter(where success and estimated_cost_usd is not null) as avg_cost_usd,
    avg(quality_score) filter(where success and quality_score is not null) as avg_quality_score
  from public.hunt_boom_model_observations
  where task_class=p_task_class
    and model is not null
  group by provider,model
),
eligible as (
  select *,
    successful_samples>=p_min_samples
      and latency_samples>=p_min_samples
      and cost_samples>=p_min_samples
      and quality_samples>=p_min_samples as ready
  from per_model
),
summary as (
  select
    count(*) filter(where ready)::int as ready_routes,
    coalesce(jsonb_agg(jsonb_build_object(
      'provider',provider,
      'model',model,
      'successful_samples',successful_samples,
      'latency_samples',latency_samples,
      'cost_samples',cost_samples,
      'quality_samples',quality_samples,
      'avg_latency_ms',avg_latency_ms,
      'avg_cost_usd',avg_cost_usd,
      'avg_quality_score',avg_quality_score,
      'ready',ready
    ) order by provider,model),'[]'::jsonb) as routes
  from eligible
)
select jsonb_build_object(
  'task_class',p_task_class,
  'min_samples_per_dimension',p_min_samples,
  'ready_routes',ready_routes,
  'required_routes',2,
  'passed',ready_routes>=2,
  'routes',routes
)
from summary;
$$;
