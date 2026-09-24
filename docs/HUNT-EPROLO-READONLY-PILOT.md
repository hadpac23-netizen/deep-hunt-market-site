# HUNT EPROLO Read-Only Pilot

Status date: 2026-09-24

## Purpose

Verify the EPROLO integration from HUNT using server-side credentials without exposing supplier secrets and without enabling payment, checkout activation, or supplier ordering.

## Security

- EPROLO credentials are stored in Supabase Vault.
- No EPROLO key or secret is committed to Git.
- The pilot function is protected by an internal token stored in Vault.
- The function has a fixed read-only endpoint scope: product list and shipping quote only.
- No order-creation endpoint is implemented.

## Live verification

- Catalog read: HTTP 200 and supplier code 0.
- Controlled sample: 5 products.
- Destinations: IL, DE, US.
- Live shipping quotes: 15/15.
- Exact variant image endpoints reachable: 4/5; one returned HTTP 404 and stays on hold.
- Text/style pre-gate: 3 pass, 2 hold.
- Physical/material quality: not verified by supplier API.
- Visual merchandising quality: requires separate visual review.
- Final profit: not verified. Current retail/profit values are shadow projections only.
- FULLY_READY: 0.

## Activation gates

A product cannot move to production until exact variant truth, visual QA, physical/claims review where relevant, fresh stock, destination shipping, final supplier order-cost truth, Price Gate, policy checks, and Owner Gate all pass.

## Hard blocks

Payment stays OFF. Supplier Live Order stays OFF. Checkout activation stays OFF. Production catalog writes stay OFF.
