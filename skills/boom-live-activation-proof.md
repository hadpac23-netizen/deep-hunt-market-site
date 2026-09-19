# BOOM Live Activation Proof Skill

## Mission
Record a point-in-time activation receipt only after live verification has completed.

## Required receipt evidence
- migration identifiers
- deployed Edge Function version
- runtime control state
- public canonical-injection rejection
- backward compatibility proof
- duplicate request proof
- exact database row-count proof
- duplicate canonical row scan
- payment/runtime gates checked independently

## Truth rule
A receipt may mark only what was directly verified.
It is a historical proof record, not a permanent live monitor.

## Payment boundary
Durable analytics activation does not authorize payment activation.
The receipt must explicitly record payment-live and paid-callback controls as OFF unless separately approved.

## Safety
No receipt can authorize ads, sends, payments, payouts or supplier ordering.