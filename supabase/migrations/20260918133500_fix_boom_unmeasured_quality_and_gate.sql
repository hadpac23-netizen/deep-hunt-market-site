-- Correct historical owner-chat quality observations that were written as zero
-- because Number(null) was treated as a measured score.
-- Keep benchmark/scorer evidence untouched.

update public.hunt_boom_model_observations
set quality_score = null,
    metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object(
      'quality_state','UNMEASURED',
      'quality_correction','null_coercion_fixed_v40'
    )
where metadata->>'source' = 'hunt-boom-chat'
  and coalesce((metadata->>'benchmark')::boolean,false) = false
  and quality_score = 0;

update public.hunt_boom_online_eval_windows
set scored_count = 0,
    passed_count = 0,
    failed_count = 0,
    average_score = null,
    evidence = coalesce(evidence,'{}'::jsonb) || jsonb_build_object(
      'quality_state','UNMEASURED',
      'reason','historical quality_score=0 was instrumentation null-coercion'
    )
where window_key = 'owner-chat-default-2026-09-17-18';

update public.hunt_boom_ci_quality_gate_runs
set metric_value = null,
    passed = null,
    status = 'pending',
    evidence = coalesce(evidence,'{}'::jsonb) || jsonb_build_object(
      'quality_state','UNMEASURED',
      'reason','awaiting a real scorer/evaluator'
    ),
    completed_at = null
where run_key = 'owner-chat-default-2026-09-18-gate';
