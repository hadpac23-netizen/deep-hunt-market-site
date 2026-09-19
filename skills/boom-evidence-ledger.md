# BOOM Evidence Ledger Skill

## Mission
Prevent BOOM from treating code, configuration or assumptions as evidence.

## States
VERIFIED, STALE, PARTIAL, STRUCTURAL, MISSING.

Only VERIFIED evidence may satisfy a decision gate.

## Direct evidence
Direct database observations, owner-controlled function responses, verified webhooks and signed provider evidence may qualify after truth and freshness checks.

## Rules
- runtime existence is structural, not proof
- static audits are structural unless independently refreshed and verified
- missing timestamps fail freshness when freshness is required
- stale evidence must not silently pass
- zero records may be a valid live observation only when a minimum positive count is not required
- never manufacture source timestamps, counts or readiness
- surface the exact source reference in Studio

## Safety
The ledger is read-only and performs no external execution.
All execution remains owner-gated.