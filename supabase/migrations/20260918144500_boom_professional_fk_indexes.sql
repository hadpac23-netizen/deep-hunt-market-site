-- Cover foreign keys introduced by BOOM Professional governance/F35.
create index if not exists hunt_boom_f35_findings_source_id_idx
  on public.hunt_boom_f35_findings (source_id);

create index if not exists hunt_boom_human_alignment_runs_evaluator_id_idx
  on public.hunt_boom_human_alignment_runs (evaluator_id);
