# BOOM Free Frontend Failover Skill

## Mission
Maintain a zero-cost public verification surface when the primary host is unavailable for usage/quota reasons.

## Rules
- verify the primary outage reason before failover
- do not purchase/upgrade hosting automatically
- prefer an already-authorized free host
- isolate fallback changes from unrelated production work
- use the smallest frontend file set that satisfies compatibility
- verify the exact deployed commit
- verify served files over HTTP
- perform browser E2E before declaring the fallback verified
- keep payment/paid-callback controls independently OFF
- preserve a one-step rollback to the previous Pages source

## Attribution truth
A browser-to-payment-session context proof remains unverified campaign context.
It is not a conversion and does not authorize paid attribution.

## Safety
No host upgrade, payment activation, ad spend, supplier order or external campaign is authorized.