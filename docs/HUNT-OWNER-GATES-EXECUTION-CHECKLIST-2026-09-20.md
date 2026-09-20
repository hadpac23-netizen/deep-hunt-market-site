# HUNT Owner Gates — Execution Checklist

Date: 2026-09-20  
Candidate: PR #20 / `feature/hunt-final-candidate-v1`  
Status: **READY FOR OWNER DECISIONS / NO LIVE ACTION AUTHORIZED**

This checklist separates every material action. Approval of one gate does not approve any other gate.

## Gate A — Live Supabase migration sync

Purpose: synchronize the live database with the four source-ready migrations already proven in Final Candidate.

Migrations, in required order:

1. `20260920071959_partner_evidence_freshness.sql`
2. `20260920084547_harden_hunt_payment_order_grants.sql`
3. `20260920094955_move_security_definers_to_boom_internal.sql`
4. `20260920095538_add_hunt_legal_registry.sql`

Preconditions already PASS:
- Partner Evidence source test
- Payment DB Security source test
- SECURITY DEFINER Isolation source test
- Legal Readiness source test

Live pre-state captured:
- migration head: `20260919193323_f60t_official_rss_source_contract`
- payment live OFF
- callback-paid acceptance OFF
- supplier live ordering OFF
- current Security Advisor captured

Execution safety:
- apply only in source order;
- stop immediately on any migration error;
- do not enable any runtime control;
- do not insert legal text;
- do not alter Business Identity values.

Required post-check:
- new migration head includes all four versions;
- payment/order direct client writes remain denied;
- 8 public SECURITY DEFINER warnings disappear;
- legal registry exists with zero fabricated document rows;
- checkout dry-run remains PASS;
- all live kill switches remain OFF.

Owner approval required: **YES**

## Gate B — PayPlus sandbox evidence

Purpose: learn the exact PayPlus signed success and reject fingerprints without accepting real money.

Current state:
- callback v9 ACTIVE;
- sandbox-evidence v2 ACTIVE;
- `hunt_payplus_sandbox_evidence` control OFF / not owner-approved;
- zero PayPlus status observations;
- callback-paid acceptance OFF.

Execution sequence:
1. create a one-time random access token locally;
2. store only its SHA-256 digest in the sandbox-evidence runtime-control note;
3. enable + owner-approve only `hunt_payplus_sandbox_evidence`;
4. generate **success** sandbox session/link for ILS 1;
5. owner completes PayPlus sandbox success;
6. verify:
   - valid PayPlus HMAC;
   - `ipn-full` verified;
   - amount/currency/reference match;
   - observation row stored;
   - `accepted_paid=false`;
7. generate **reject** sandbox session/link;
8. owner completes rejection scenario;
9. verify reject observation;
10. disable sandbox-evidence control again;
11. compare exact fingerprints;
12. keep `hunt_payplus_callback_accept_paid` OFF.

Hard boundary:
PayPlus sandbox evidence approval does **not** approve real payment or paid-state mapping.

Required PASS:
- one verified success observation;
- one verified reject observation;
- both signature_verified=true;
- both ipn_full_verified=true;
- neither accepted as paid;
- exact mapping reviewed separately.

Owner approval required: **YES**

## Gate C — CJ sandbox order E2E

Purpose: prove supplier order ID + sandbox tracking on the current orchestrator v15.

Current state:
- CJ sandbox control ON / owner-approved;
- live supplier control OFF;
- old sandbox attempts failed on transient CJ server-busy error;
- orchestrator v15 now has retry + reconciliation.

Execution sequence:
1. use an authenticated admin-owned prelaunch/test payment session only;
2. confirm line item is CJ and exact variant/logistics/origin/shipping data is present;
3. run orchestrator with `run_mode=sandbox`;
4. require `isSandbox=1`;
5. confirm no real supplier charge and no real logistics;
6. verify supplier sandbox order ID/code;
7. verify sandbox tracking number;
8. verify order/fulfillment/payment-session states become shipped in test data;
9. store pipeline PASS evidence.

Abort on:
- any non-test order;
- live supplier control unexpectedly enabled;
- unexpected charge/logistics behavior;
- ambiguous supplier state after retry/reconciliation.

Required PASS:
- pipeline stage completed / status pass;
- supplier_order_id present;
- tracking_number present;
- test-only order state;
- live supplier switch remains OFF.

Owner approval required: **YES**

## Gate D — Business Identity

Purpose: make the operating business identity complete enough for customer/legal launch gates.

Current live row: `primary` / draft / unapproved.

Required real values:
- legal entity name;
- registration number;
- registered country;
- business address;
- support email;
- privacy contact email;
- returns address;
- optional support phone.

Rules:
- never infer or fabricate;
- owner supplies or confirms each value;
- keep draft until all required fields are reviewed;
- publishing Business Identity requires a separate explicit Owner approval.

Owner input required: **YES**

## Gate E — Legal documents

Purpose: publish real customer Terms, Privacy, Returns and Shipping policies.

Precondition:
- Legal Registry migration from Gate A exists live.

Required documents:
- Terms of Service
- Privacy Policy
- Returns & Refund Policy
- Shipping Policy

Rules:
- no auto-generated text goes live without review;
- content must be owner/counsel supplied or explicitly reviewed;
- each version remains draft until separately approved;
- only owner-approved, published, effective, non-empty versions are publicly readable.

Owner/counsel review required: **YES**

## Gate F — Leaked-password protection

Purpose: enable the Supabase Auth compromised-password check.

Current Security Advisor: disabled.

Scope:
- Auth configuration only;
- not a SQL migration;
- does not enable payment, supplier ordering or deployment.

Post-check:
- Security Advisor warning disappears;
- existing login/signup flow smoke test still passes.

Owner approval required: **YES**

## Gate G — Candidate deployment

Purpose: put the exact tested candidate on a real Netlify review URL, then eventually production.

Current:
- PR #20 is Draft;
- local matrix PASS;
- automatic Netlify PR preview absent;
- manual draft CLI attempts were canceled due CDN-diff stall;
- production remains unchanged.

Review deployment:
- preview/review only;
- no production promotion;
- run full responsive matrix against hosted URL.

Production deployment:
- separate final Owner approval only after launch blockers pass.

Owner approval required for production: **YES**

## Final real-money gate

Do not consider live payment until all are true:

- Business Identity PASS
- legal documents PASS
- payment callback proof PASS
- order/tracking proof PASS
- security hardening PASS
- production analytics evidence PASS
- exact tested deployment synchronized
- payment route approved for intended country/currency
- explicit final Owner approval

Then, and only then, consider enabling:
- `hunt_payplus_callback_accept_paid`
- `hunt_payment_live`

Live supplier ordering remains a separate switch:
- `hunt_supplier_order_live`

No gate implies another gate.
