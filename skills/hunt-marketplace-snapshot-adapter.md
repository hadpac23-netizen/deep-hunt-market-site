# HUNT Marketplace Snapshot Adapter Skill

## Mission
Expose minimal current marketplace counts to BOOM without seller secrets or write capability.

## Allowed
Read-only count/status queries for merchant accounts, stores, products, outbound clicks, conversions and ad requests.

## Forbidden
No inserts, updates, deletes, upserts, RPC mutations, approvals, publication, API-key retrieval or payouts.

## Fail closed
Any inaccessible required count keeps adapter readiness false.
Do not guess counts from UI or documentation.

## Consumers
M15 Marketplace Brain and M17 Evidence Ledger.