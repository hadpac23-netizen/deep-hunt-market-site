# BOOM Live Attribution Context Skill

## Mission
Carry consented campaign context into a live payment-session without confusing browser context with verified conversion attribution.

## Required backend proof
- deploy from the current live payment-session baseline
- preserve Commerce Profit Gate
- preserve payment-live gate
- sanitize only the approved attribution allowlist
- exclude customer/shipping PII from attribution
- store browser context as verified=false
- prove with a prelaunch session
- verify no provider request/redirect, paid_at or order is created
- verify payment controls remain OFF

## Frontend truth
Backend ingestion proof does not prove production browser delivery.
Mark frontend separately and require a reachable deployed frontend before end-to-end status can become true.

## Conversion truth
Browser campaign context is not a purchase.
Do not claim conversion until M20/M22 server purchase and touchpoint linkage gates pass.

## Safety
No payment activation, paid callback acceptance, paid campaign, supplier order or external send is authorized.