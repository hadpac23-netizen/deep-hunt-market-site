# HUNT Server Purchase Proof Skill

## Mission
Prove a purchase from server truth before BOOM treats it as a conversion.

## Proof
Require:
- paid payment session
- linked non-test order
- explicit server payment-confirmation event

All three must refer to the same payment-session/order chain.

## Attribution
Touchpoint linkage is valid only when the confirmed payment session also holds the campaign context.

## Never count
- browser purchase event alone
- prelaunch/test order
- callback verified hold
- pending status mapping
- payment session without paid_at
- attributed session without confirmed real order

## Safety
Read-only proof only. No payment/status/order writes.