# F60T OAuth + Hourly Scheduler v4 — Completion — 2026-09-19

## Mission

Complete the connection layer that lets F60T / YAMAM ingest approved official platform signals every hour without storing provider tokens in public tables or claiming activity that has not happened.

Default stretch target remains:

USD 10,000 VERIFIED NET PROFIT / HOUR.

This remains a target, never a promise.

## Live Edge Functions

- hunt-f60t-oauth v2 — ACTIVE — user JWT + admin required
- hunt-f60t-external-signals v4 — ACTIVE — admin user or protected cron secret
- hunt-f60t-snapshot v4 — ACTIVE — admin user or protected cron secret
- hunt-commerce-signal v13 — ACTIVE

## OAuth Gate

Supported connection flows:

- Pinterest
- YouTube / Google

OAuth start:

- owner/admin only
- one-time random state
- only SHA-256 state hash stored
- 10 minute expiry
- state is tied to the initiating owner user
- callback provider is inferred server-side from the state record
- browser-supplied provider is not trusted for exchange

Default callback:

https://deep-hunt-market.netlify.app/f60t-oauth-callback.html

The callback never receives or stores access/refresh tokens.

## Provider scopes

Pinterest requests read-only scopes:

- ads:read
- user_accounts:read

YouTube requests read-only scopes:

- youtube.readonly
- yt-analytics.readonly

No write/publish scopes are requested.

## Secret storage

Provider credentials/tokens are never stored in public tables.

OAuth access and refresh tokens are stored only in Supabase Vault.

Vault secret names:

- f60t_pinterest_access_token
- f60t_pinterest_refresh_token
- f60t_youtube_access_token
- f60t_youtube_refresh_token

Public/admin-readable connection metadata stores only:

- provider
- connection status
- scopes
- external account/channel identifier
- expiry timestamps
- refresh timestamps
- safe error code
- Vault secret names, not secret values

## Token refresh

F60T external-signal worker can refresh expired/near-expired tokens server-side.

Pinterest:
official refresh-token flow.

YouTube:
Google OAuth refresh-token flow.

If refresh cannot be completed:
connection becomes TOKEN_EXPIRED.

No source is marked LIVE on refresh failure.

## Account discovery

After successful OAuth:

Pinterest:
F60T calls the official read-only List Ad Accounts endpoint.
If exactly one account is returned, it is auto-selected.
If multiple accounts exist, F60T records OWNER_SELECTION_REQUIRED and does not guess.

YouTube:
F60T queries the authenticated user's channels read-only.
If exactly one channel is returned, the channel ID is stored as the external account identifier.

## BOOM Studio

F60T panel now includes:

- Connect Pinterest
- Connect YouTube
- CONNECTED / CONFIG REQUIRED / RECONNECT state
- secure connection status message

BOOM Studio now calls hunt-f60t-snapshot with POST correctly.

The previous GET/POST mismatch was removed.

OAuth status is loaded alongside the F60T mission board.

## Hourly scheduler

Supabase pg_cron jobs are live:

- f60t-external-signals-hourly
  schedule: 0 * * * *
- f60t-snapshot-hourly
  schedule: 10 * * * *

Both jobs are active.

Scheduler authentication:

- random F60T cron secret stored only in Supabase Vault
- SHA-256 hash stored in f60t_cron_auth
- Edge Functions compare the provided secret against the hash
- no Supabase secret/service key is hardcoded into cron SQL

## Dual-auth boundary

hunt-f60t-external-signals and hunt-f60t-snapshot accept only:

1. signed-in admin user
or
2. valid F60T cron secret

All other calls return ADMIN_OR_CRON_REQUIRED.

## Crowd truth hardening

A market-tagged analytics event is no longer sufficient to make Crowd Radar READY.

Crowd Radar requires recognized commercial-intent event types.

Only known F60T intent events can contribute to:

- recognized intent count
- recognized market intent count
- Local Buying Clock
- hot-zone eligibility

Hot zones require intent_score_max > 0.

This prevents generic/legacy events from being labeled as hot buying demand.

## External sync audit

SKIPPED_CONFIG now writes to f60t_external_signal_runs.

Example reasons:

- PINTEREST_OAUTH_NOT_CONNECTED
- PINTEREST_AD_ACCOUNT_SELECTION_REQUIRED
- YOUTUBE_OAUTH_NOT_CONNECTED

This gives the hourly scheduler a complete audit trail even when a source cannot run.

## Live verification

Cron-secret live tests:

hunt-f60t-external-signals:
HTTP 200.

hunt-f60t-snapshot:
HTTP 200.

Current external state:

Pinterest Trends:
SKIPPED_CONFIG — OAuth not connected.

Pinterest Audience:
SKIPPED_CONFIG — OAuth not connected.

YouTube Analytics:
SKIPPED_CONFIG — OAuth not connected.

Current first-party truth:

recognized_intent_event_count = 0
recognized_market_intent_event_count = 0
timezone_event_count = 0
crowd_signals_ready = false
local_buying_clock_ready = false
hot_zones = []

Current profit truth:

verified_net_profit = USD 0.00
verification_status = UNVERIFIED
confirmed_real_orders = 0
settled_real_orders = 0

Therefore F60T does not claim the USD 10,000/hour target has been achieved.

## Current connection state

Pinterest:
DISCONNECTED

YouTube:
DISCONNECTED

OAuth app credentials still need to be configured before either platform can be authorized.

Metricool account is connected to ChatGPT, but its current brand has no connected social networks, so it cannot yet provide live platform timing data.

## Security

f60t_oauth_connections:
RLS enabled.
anon: no access.
authenticated: SELECT only through admin policy.
authenticated cannot INSERT / UPDATE / DELETE.

f60t_oauth_states:
RLS enabled.
no client grants.
server-only.

f60t_cron_auth:
RLS enabled.
no client grants.
server-only.

Supabase Vault holds plaintext secrets encrypted at rest.

## Execution safety

paid_spend = false
external_publish = false
live_price_write = false
supplier_order = false
payment_activation = false

OAuth and hourly synchronization are measurement/research infrastructure only.

## Verification

All root project tests:

111 / 111 PASS.

## Unrelated work

product.html remains excluded from this change.
