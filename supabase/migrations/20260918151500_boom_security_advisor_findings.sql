-- Persist reviewed Supabase security-advisor observations into BOOM F35 Radar.

insert into public.hunt_boom_f35_findings
(source_id,finding_key,observed_at,title,summary,impact_area,relevance_score,confidence,action_state,requires_owner_review,evidence)
values
(null,'supabase-security-definer-reviewed-2026-09-18',now(),
 'SECURITY DEFINER advisor findings reviewed',
 'Eight legacy public SECURITY DEFINER functions were inspected. Each uses auth.uid ownership checks or an explicit Admin check. Keep under security review, but do not revoke blindly because the current access is intentional and guarded.',
 'security',0.88,'cross_verified','no_action',true,
 '{"advisor":"authenticated_security_definer_function_executable","reviewed_count":8,"auto_change":false,"reason":"guarded by auth.uid/ownership/admin checks"}'::jsonb)
on conflict (finding_key) do update set
 observed_at=excluded.observed_at,
 summary=excluded.summary,
 confidence=excluded.confidence,
 action_state=excluded.action_state,
 evidence=excluded.evidence;

insert into public.hunt_boom_f35_findings
(source_id,finding_key,observed_at,title,summary,impact_area,relevance_score,confidence,action_state,requires_owner_review,evidence)
values
(null,'supabase-leaked-password-protection-disabled-2026-09-18',now(),
 'Supabase leaked-password protection is disabled',
 'Security Advisor reports leaked-password protection disabled. This is an account/Auth configuration item, not a BOOM code migration; keep it in Owner security review until enabled in Supabase Auth settings.',
 'security',0.93,'verified_official','review',true,
 '{"advisor":"auth_leaked_password_protection","auto_implement":false,"owner_gate":true}'::jsonb)
on conflict (finding_key) do update set
 observed_at=excluded.observed_at,
 summary=excluded.summary,
 confidence=excluded.confidence,
 action_state=excluded.action_state,
 evidence=excluded.evidence;
