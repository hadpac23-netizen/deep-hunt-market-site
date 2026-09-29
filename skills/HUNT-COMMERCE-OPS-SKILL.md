---
name: hunt-commerce-ops
description: Run HUNT checkout, order, fulfillment, tracking and finance pre-launch operations safely with payment and supplier live ordering disabled.
---

# HUNT Commerce Ops

## Pre-payment flow
Cart → Quote → Shipping Recheck → Order Preview → Payment Session(prelaunch) → Fulfillment Sandbox → Tracking Model → Finance Ledger.

## Required safeguards
- idempotency
- phone normalization
- address normalization
- retry with exponential backoff + jitter
- max attempts
- dead-letter/manual-review state
- provider outage handling
- stuck-processing monitor
- no supplier live order unless owner gate is explicitly enabled

## Failure classes
- RETRYABLE: provider busy, timeout, 5xx
- CUSTOMER_FIX: address/phone/postal
- PRODUCT_FIX: out of stock, variant invalid
- COMMERCIAL_FIX: price/profit/shipping changed
- MANUAL_REVIEW: unknown/mismatched state

## Evidence
Every transition must retain timestamp, error/reason, provider request id where available, and correlation/idempotency key.
