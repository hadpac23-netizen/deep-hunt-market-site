-- BOOM Worker Tool Contracts v1
-- Defines measurable worker contracts without granting new autonomy.

alter table public.hunt_boom_workers
  drop constraint if exists hunt_boom_workers_capabilities_array_check;
alter table public.hunt_boom_workers
  add constraint hunt_boom_workers_capabilities_array_check
  check (jsonb_typeof(capabilities)='array');

alter table public.hunt_boom_workers
  drop constraint if exists hunt_boom_workers_guardrails_array_check;
alter table public.hunt_boom_workers
  add constraint hunt_boom_workers_guardrails_array_check
  check (jsonb_typeof(guardrails)='array');

update public.hunt_boom_workers
set capabilities=jsonb_build_array(
      jsonb_build_object(
        'contract_version','v1',
        'capability_key',id,
        'name',role,
        'mission',mission,
        'input_schema',jsonb_build_object(
          'type','object',
          'required',jsonb_build_array('task'),
          'properties',jsonb_build_object(
            'task',jsonb_build_object('type','string'),
            'context',jsonb_build_object('type','object'),
            'evidence',jsonb_build_object('type','array')
          )
        ),
        'output_schema',jsonb_build_object(
          'type','object',
          'required',jsonb_build_array('status','evidence','recommended_action','action_class','confidence'),
          'properties',jsonb_build_object(
            'status',jsonb_build_object('type','string'),
            'evidence',jsonb_build_object('type','array'),
            'metrics',jsonb_build_object('type','object'),
            'issues',jsonb_build_object('type','array'),
            'finding',jsonb_build_object('type','string'),
            'recommended_action',jsonb_build_object('type','string'),
            'action_class',jsonb_build_object('type','string'),
            'owner_approval_required',jsonb_build_object('type','boolean'),
            'confidence',jsonb_build_object('type','number')
          )
        ),
        'expected_outcome',mission,
        'evidence_required',true
      )
    ),
    metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object(
      'tool_contract_version','v1',
      'tool_contract_source','worker_definition',
      'tool_contract_updated_at',now()
    ),
    updated_at=now()
where jsonb_typeof(capabilities)='array'
  and jsonb_array_length(capabilities)=0;

update public.hunt_boom_workers
set guardrails=jsonb_build_array(
      'evidence_required',
      'no_unverified_completion',
      'respect_action_class',
      'owner_gate_sensitive_live_actions',
      'no_new_autonomy_from_contract'
    ),
    metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object(
      'guardrail_contract_version','v1',
      'guardrail_contract_updated_at',now()
    ),
    updated_at=now()
where jsonb_typeof(guardrails)='array'
  and jsonb_array_length(guardrails)=0;
