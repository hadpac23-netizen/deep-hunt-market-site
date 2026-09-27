# HUNT Launch Status Drift Repair — 2026-09-27

## Scope
Shadow/pre-launch only. No Payment Live, no Supplier Live Order, no Production taxonomy publish.

## Drift found
Readiness reconciliation was overwriting stronger downstream statuses after Market5:
- Image PASS rows were pushed back to `MARKET5_READY_VISUAL_QUALITY_PENDING` / `MARKET5_READY_STYLE_PHYSICAL_PENDING`.
- Rows promoted to `MARKET5_READY_STYLE_PASS_PHYSICAL_EVIDENCE_PENDING` could be demoted again on the next readiness cron pass.

## Repair
Readiness reconcile now preserves these stronger states when Market5 remains 5/5:
- `FULLY_READY`
- `MARKET5_READY_STYLE_PASS_PHYSICAL_EVIDENCE_PENDING`
- `MARKET5_READY_STYLE_PASS_PHYSICAL_METADATA_VERIFIED`
- `MARKET5_READY_PHYSICAL_METADATA_REVIEW`

If no stronger state exists:
- Image PASS -> `MARKET5_READY_STYLE_PHYSICAL_PENDING`
- Otherwise -> `MARKET5_READY_VISUAL_QUALITY_PENDING`

Versions:
- CJ reconcile marker: `HUNT_CJ_RECONCILE_V4`
- EPROLO reconcile marker: `HUNT_EPROLO_RECONCILE_V3`

## Style gate reconciliation
283 EPROLO candidates met all of:
- Taxonomy V2 REMAP
- Profit REVIEW
- verified inventory + availability
- Image Technical PASS
- Market5 5/5
- catalog safety PASS
- `stylist_precheck.status = PASS`
- no stylist hold
- exact `variant_id`

They were promoted to:
`MARKET5_READY_STYLE_PASS_PHYSICAL_EVIDENCE_PENDING`

## Controlled physical-evidence batches
Three bounded batches were run against the existing internal `hunt-eprolo-physical-evidence` function.

Batch 1:
- 16 requests
- 16/16 HTTP 200
- 16/16 VERIFIED_METADATA

Batch 2:
- 16 requests
- 16/16 HTTP 200
- 16/16 VERIFIED_METADATA

Batch 3:
- 15 requests
- 15/15 HTTP 200
- 15/15 VERIFIED_METADATA

At the final checkpoint, the gated EPROLO pool contains **55 VERIFIED_METADATA** rows total, including evidence that already existed before these three batches.

Important: supplier exact-variant metadata is NOT physical-quality proof. The function deliberately leaves:
`physical_quality_status = UNVERIFIED`

Therefore these products are not marked FULLY_READY from metadata alone.

## Cost discipline
- Netlify deploys used: 0
- CJ mass fill remains disabled
- Existing gated inventory is being promoted before new broad sourcing
