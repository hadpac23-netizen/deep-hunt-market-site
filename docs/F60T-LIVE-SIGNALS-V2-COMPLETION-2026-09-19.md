# F60T Live Signals v2 — Completion — 2026-09-19

## Mission

Activate the data foundation required for F60T / YAMAM to move from a static decision core toward live evidence-driven hourly operation.

Default stretch target remains:

USD 10,000 VERIFIED NET PROFIT / HOUR.

This is a target, never a promise.

## Implemented

### 1. Consented first-party crowd context

HUNT analytics now adds only privacy-limited dimensions after analytics consent:

- browser timezone
- attribution source
- attribution medium

No GPS or precise location is collected.

The commerce signal Edge Function now persists those fields into analytics metadata.

Live Edge Function:
hunt-commerce-signal v13.

### 2. F60T source registry

Table:
f60t_signal_sources

Current registry:

- HUNT first-party — LIVE
- Pinterest Trends API — AVAILABLE_NOT_CONNECTED
- Pinterest Audience Insights API — AVAILABLE_NOT_CONNECTED
- Google Trends API — ACCESS_REQUIRED / alpha
- YouTube audience time — STUDIO_ONLY
- TikTok Market Scope — PENDING_API_VERIFICATION
- Agent commerce events — PENDING_PROTOCOL_TRAFFIC

No external source is marked LIVE without verified access.

### 3. Crowd signal ledger

Table:
f60t_crowd_signal_snapshots

The F60T snapshot function aggregates consented first-party commerce events by:

market
source/platform
category
timezone
local hour
audience/mission
intent-proxy event type

The intent score is explicitly an internal FIRST_PARTY_INTENT_PROXY_NOT_PROFIT signal.

It is not treated as profit and is not a purchase claim.

### 4. Local Buying Clock

Timezone is collected only after analytics consent.

Local Buying Clock becomes ready only after sufficient timezone-tagged first-party events exist.

No country-wide timezone is guessed.

### 5. Agent signal ledger

Table:
f60t_agent_signal_events

Prepared event types:

discovered
considered
selected
cart
checkout
paid
returned

No live agent traffic is claimed without verified events.

### 6. Hourly verified profit ledger

Table:
f60t_hourly_profit_ledger

Truth chain:

M29 purchase attribution bridge
→ provider payment confirmation
→ server purchase confirmation
→ real non-test order
→ finance ledger evidence
→ settlement
→ available_profit

contribution_locked is evidence, but it is not counted as realized hourly verified net profit.

F60T may mark an hour VERIFIED only from settled real finance rows.

Possible states:

UNVERIFIED
LOCKED_EVIDENCE
PARTIAL
VERIFIED

### 7. F60T snapshot Edge Function

Live Edge Function:
hunt-f60t-snapshot v1

Security:

verify_jwt = true
admin check required
server-side aggregation
no public raw-event exposure

Outputs:

crowd signal readiness
local buying clock readiness
hot first-party zones
signal-source registry
verified agent-event counts
hourly verified profit
errors / missing evidence

### 8. BOOM Studio wiring

BOOM Studio now loads hunt-f60t-snapshot safely.

If the function is unavailable:
Studio continues loading and F60T falls back to SIGNALS PENDING.

F60T panel now distinguishes:

CORE READY
CROWD LIVE
LOCAL BUYING CLOCK
VERIFIED AGENT EVENTS
HOURLY PROFIT LEDGER
VERIFIED NET PROFIT

No fake success is allowed.

## Security

F60T tables:

f60t_signal_sources
f60t_crowd_signal_snapshots
f60t_agent_signal_events
f60t_hourly_profit_ledger

All have RLS enabled.

anon:
no SELECT.

authenticated:
SELECT only, protected by admin policy.

authenticated cannot:
INSERT
UPDATE
DELETE

Server-side writes use trusted Supabase server context.

Supabase Security Advisor:
no F60T findings.

## Current live truth at implementation time

analytics_events: 7291
events with market: 5733
events with timezone: 0
crowd snapshots: 0
agent events: 0
verified agent events: 0
hourly profit ledger rows: 0
confirmed payment events: 0
profit evidence rows: 0

Therefore:

REALIZED VERIFIED NET PROFIT / HOUR = UNVERIFIED.

The system must not claim USD 10,000/hour.

Timezone samples begin accumulating only after the updated frontend receives consented traffic.

Crowd and hourly ledger snapshots begin persisting when the updated BOOM Studio invokes hunt-f60t-snapshot.

## External source truth

Pinterest Trends and Audience Insights have official APIs but are not connected.

Google Trends API is alpha / access-required and is not marked live.

YouTube viewer-time data is treated as Studio-only until an official programmable endpoint is verified.

TikTok Market Scope is not treated as a public API integration until an official API surface is verified.

## Execution safety

paid_spend = false
external_publish = false
live_price_write = false
supplier_order = false
payment_activation = false

This phase measures and learns only.

## Unrelated work

product.html remains excluded from this change.

## Regression

All root project tests: 106/106 PASS.
