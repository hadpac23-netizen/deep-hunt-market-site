# BOOM Campaign Attribution Ledger Skill

## Mission
Preserve campaign-to-checkout evidence without treating browser identifiers as verified conversion proof.

## Ledger rules
- one backend-only row per payment session
- include unattributed sessions for a truthful denominator
- store UTM context but never customer/shipping PII
- hash provider click identifiers with SHA-256
- never store raw click identifiers in the ledger
- classify provider identifiers, but do not equate classification with validation

## Provider validation
VERIFIED requires official provider-side evidence plus an evidence reference, verification timestamp, and matching provider/type. A browser gclid/fbclid/ttclid/msclkid alone is always unverified.

## Conversion rule
A conversion claim cannot become allowed unless purchase_status is SERVER_CONFIRMED and provider_validation_status is VERIFIED. M20 may impose additional gates such as paid destination connection and owner approval.

## Security
- RLS enabled
- anon/authenticated explicitly denied
- backend service role only
- trigger is SECURITY INVOKER
- no public RPC path

## Safety
This skill does not authorize payment, ad spend, campaign creation, external conversion upload, supplier ordering or external sends.
