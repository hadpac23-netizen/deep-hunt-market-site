-- Refresh BOOM F35 OpenAI sources to machine-readable official developer docs.

update public.hunt_boom_f35_sources
set display_name='OpenAI · Evals Guide',
    source_type='official_docs',
    canonical_url='https://developers.openai.com/api/docs/guides/evals.md',
    domain='developers.openai.com',
    freshness_hours=168,
    last_checked_at=null,
    last_http_status=null,
    last_content_hash=null,
    last_error=null,
    consecutive_failures=0,
    updated_at=now()
where source_key='openai-trustworthy-evals';

update public.hunt_boom_f35_sources
set display_name='OpenAI · API Changelog',
    source_type='official_changelog',
    canonical_url='https://developers.openai.com/api/docs/changelog.md',
    domain='developers.openai.com',
    freshness_hours=24,
    last_checked_at=null,
    last_http_status=null,
    last_content_hash=null,
    last_error=null,
    consecutive_failures=0,
    updated_at=now()
where source_key='openai-evals-business';

insert into public.hunt_boom_f35_findings
(source_id,finding_key,observed_at,published_at,title,summary,evidence_url,impact_area,relevance_score,
 confidence,action_state,requires_owner_review,evidence)
select id,'openai-agents-api-public-beta-2026-09-10',now(),'2026-09-10T00:00:00Z',
'OpenAI Agents API entered public beta',
'Official changelog says the managed agent harness now provides session orchestration, context compaction and recovery, with durable sessions plus tool/MCP connections. BOOM should compare these primitives against its own orchestration and recovery stack before adopting anything.',
canonical_url,'agents',0.99,'verified_official','review',true,
'{"auto_implement":false,"owner_gate":true,"review":["session orchestration","context compaction","recovery","durable sessions","MCP"]}'::jsonb
from public.hunt_boom_f35_sources where source_key='openai-evals-business'
on conflict (finding_key) do update set
 observed_at=excluded.observed_at,
 summary=excluded.summary,
 evidence_url=excluded.evidence_url,
 confidence=excluded.confidence,
 action_state=excluded.action_state,
 evidence=excluded.evidence;

insert into public.hunt_boom_f35_findings
(source_id,finding_key,observed_at,title,summary,evidence_url,impact_area,relevance_score,
 confidence,action_state,requires_owner_review,evidence)
select id,'openai-evals-guide-radar-2026',now(),
'OpenAI Evals guide is part of BOOM F35 monitored evidence',
'BOOM should continuously compare evaluator definitions, datasets, graders and run evidence against current OpenAI Evals guidance, while keeping local Owner Gate and release policy authoritative.',
canonical_url,'evals',0.96,'verified_official','review',true,
'{"auto_implement":false,"owner_gate":true}'::jsonb
from public.hunt_boom_f35_sources where source_key='openai-trustworthy-evals'
on conflict (finding_key) do update set
 observed_at=excluded.observed_at,
 summary=excluded.summary,
 evidence_url=excluded.evidence_url,
 confidence=excluded.confidence,
 action_state=excluded.action_state,
 evidence=excluded.evidence;
