# HUNT Live Migration Sync Plan — 2026-09-20

Status: **SOURCE READY / LIVE EXECUTION REQUIRES OWNER APPROVAL**

Target project: `boom-social-world` (`zszlnahjqmwozwubetkm`)

Live migration head observed during read-only audit:

`20260919193323_f60t_official_rss_source_contract`

Final Candidate contains four later migrations. They must remain unapplied until explicit Owner approval.

## Pre-deploy invariants

Before any live migration:
- Final Candidate commit must be explicitly identified and owner-approved.
- Production payment remains OFF.
- `hunt_payplus_callback_accept_paid` remains disabled and owner_approved=false.
- No supplier order is triggered.
- No legal content is invented or auto-published.
- Capture current migration head and Security Advisor output for before/after comparison.
- Apply migrations in source order, never selectively out of sequence unless a reviewed dependency analysis says otherwise.

## Step 1 — Partner evidence freshness

Migration:
`20260920071959_partner_evidence_freshness.sql`

Purpose:
- adds nullable `terms_verified_at`;
- adds nullable `media_rights_verified_at`;
- preserves existing verified values and does not fabricate evidence.

Risk class: **LOW / additive**

Pre-source proof:
- `boom-partner-evidence.test.js = PASS`

Post-deploy verification:
- both columns exist on `hunt_partner_matrix`;
- existing rows are preserved;
- no automatic verification timestamps are populated;
- BOOM evidence decay maps null to UNKNOWN rather than assuming verified.

## Step 2 — Payment/order privilege hardening

Migration:
`20260920084547_harden_hunt_payment_order_grants.sql`

Purpose:
- removes direct anon/authenticated write privileges from payment/order/economics evidence tables;
- retains authenticated SELECT only where existing RLS permits it;
- keeps payment/order mutation owned by server-side functions;
- keeps PayPlus status observations server-only.

Risk class: **MEDIUM / privilege change**

Pre-source proof:
- `boom-payment-db-security.test.js = PASS`

Post-deploy verification:
- authenticated client cannot INSERT/UPDATE/DELETE payment sessions, payment events, orders, order events, fulfillment orders, pipeline runs, unit economics or PayPlus observations;
- authorized server Edge Functions can still perform required mutations;
- existing user-visible order reads still work through RLS;
- Checkout dry-run remains functional;
- live payment remains disabled.

## Step 3 — SECURITY DEFINER isolation

Migration:
`20260920094955_move_security_definers_to_boom_internal.sql`

Purpose:
- moves 8 privileged implementations from exposed `public` schema to `boom_internal`;
- keeps public RPC signatures as SECURITY INVOKER wrappers;
- preserves caller identity / ownership / admin checks;
- revokes anon execution;
- contains migration self-checks that fail closed if the expected privilege boundary is not achieved.

Risk class: **MEDIUM-HIGH / RPC security boundary**

Pre-source proof:
- `boom-security-definer-isolation.test.js = PASS`

Functions covered:
- `is_admin_user`
- `admin_set_user_ban`
- `create_post_draft`
- `get_my_drafts`
- `get_my_recent_deleted`
- `publish_draft`
- `soft_delete_post`
- `undo_delete_post`

Post-deploy verification:
- Supabase Security Advisor no longer reports the 8 public SECURITY DEFINER WARN findings;
- public wrappers report SECURITY INVOKER;
- protected internal functions exist in `boom_internal`;
- anon cannot execute protected RPCs;
- authenticated owner/admin flows still work;
- no unexpected function-signature regression.

Important:
- this migration does **not** enable Supabase leaked-password protection. That remains a separate Auth configuration task.

## Step 4 — Legal Registry

Migration:
`20260920095538_add_hunt_legal_registry.sql`

Purpose:
- creates `hunt_legal_document_versions`;
- adds versioned Terms / Privacy / Returns / Shipping registry;
- allows public reads only for owner-approved, published, effective, non-empty documents;
- admin-only mutation under RLS;
- inserts **no legal text**.

Risk class: **LOW-MEDIUM / additive legal gate**

Pre-source proof:
- `boom-legal-readiness.test.js = PASS`

Post-deploy verification:
- table exists;
- RLS enabled;
- anon/authenticated public SELECT returns only owner-approved published effective rows;
- anon cannot write;
- no legal document row is auto-created;
- Launch Readiness endpoint can query the legal registry without a missing-table failure.

## Separate live configuration — not SQL migrations

### Business Identity
Still required:
- legal entity name
- registration number
- business address
- support email
- privacy contact email
- returns address
- explicit owner approval and published status

Do not infer or fabricate any value.

### Legal documents
After Legal Registry deployment:
- Terms
- Privacy
- Returns
- Shipping

must be owner/counsel supplied, reviewed, owner-approved and published. Source migration alone does not make Legal Readiness PASS.

### PayPlus
Still blocked independently:
- signed sandbox success observation;
- ipn-full verified success fingerprint;
- signed sandbox reject observation;
- ipn-full verified reject fingerprint;
- exact fingerprint review;
- explicit Owner approval;
- only then consider enabling callback acceptance.

### Leaked-password protection
Current Security Advisor reports it disabled.
This is an Auth setting, not fixed by SQL migrations. It should be enabled only as an explicit live configuration action and re-verified afterward.

## Final verification sequence after approved migration deployment

1. Confirm live migration head includes all four versions.
2. Run Security Advisor again.
3. Run payment/order grant verification.
4. Run Legal Readiness source + live table checks.
5. Run Final Preview Matrix against an approved Preview/production candidate as appropriate.
6. Run Checkout dry-run with payment still disabled.
7. Query Launch Readiness and inspect soft/real-money blockers.
8. Do not enable PayPlus or supplier live fulfillment merely because migration sync passes.

## Owner Gate

Applying any of these migrations to the live Supabase project is a material external action and remains **NOT AUTHORIZED** by this plan itself.
