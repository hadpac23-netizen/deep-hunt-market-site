# BOOM Purchase Attribution Bridge Skill

## Mission
Join payment, order, attribution and finance evidence without writing business state.

## Server purchase proof
Require all:
- paid_at present
- linked order present
- order is_test=false
- approved provider-confirmed payment event present

Never infer paid state from checkout, redirect, browser events or payment intent alone.

## Attribution proof
Purchase touchpoint linkage requires a campaign-context ledger row.
Provider click validation remains separately gated by official provider evidence.

## Profit proof
Require:
- finance row exists
- finance row is_test=false
- finance order matches the payment order
- settlement_status is locked or settled

Preview finance rows do not count.

## Security
The bridge must be a security_invoker view and unavailable to public/anon/authenticated roles.

## Safety
Never create an order, mark paid_at, change payment status, release profit, upload conversions, spend on ads, pay suppliers or enable payouts.