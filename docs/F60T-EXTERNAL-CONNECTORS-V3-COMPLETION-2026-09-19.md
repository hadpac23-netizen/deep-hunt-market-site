# F60T External Platform Connectors — Completion — 2026-09-19

## Scope

Add official external demand/audience connectors to F60T without treating trend/viewership data as purchase intent or verified profit.

## Live Edge Functions

- hunt-commerce-signal v13 — ACTIVE
- hunt-f60t-snapshot v2 — ACTIVE, JWT required
- hunt-f60t-external-signals v1 — ACTIVE, JWT required + admin check

## Official connector contract

### Pinterest Trends

Official endpoint family:
https://api.pinterest.com/v5/trends/keywords/{REGION}/top/growing

Connector behavior:
- requires PINTEREST_ACCESS_TOKEN
- accepts up to 12 configured regions per sync
- stores top growing keywords as verified external demand-trend signals
- labels semantics as DEMAND_TREND_NOT_PURCHASE_INTENT
- successful API sync is required before source status becomes LIVE

### Pinterest Audience Insights

Official endpoint family:
https://api.pinterest.com/v5/ad_accounts/{AD_ACCOUNT_ID}/audience_insights

Connector behavior:
- requires PINTEREST_ACCESS_TOKEN
- requires PINTEREST_AD_ACCOUNT_ID
- stores aggregate category affinity and country distribution
- labels semantics as audience affinity/distribution, not purchase intent
- successful API sync is required before source status becomes LIVE

### YouTube Analytics

Official endpoint:
https://youtubeanalytics.googleapis.com/v2/reports

Connector behavior:
- requires YOUTUBE_OAUTH_ACCESS_TOKEN
- queries country-level channel viewership for a recent completed period
- stores viewership geography as external demand/context signals
- labels semantics as CHANNEL_VIEWERSHIP_NOT_PURCHASE_INTENT
- does not claim access to the Studio-only "when viewers are on YouTube" heatmap

### Google Trends

Source remains:
ACCESS_REQUIRED

The Trends API is not marked live until approved API access exists.

### TikTok

TikTok Display API is not treated as a global audience or buying-intent API.
Market Scope remains PENDING_API_VERIFICATION until a suitable official programmable surface is verified.

## Audit ledger

New table:
public.f60t_external_signal_runs

Tracks:
- source
- action
- region
- status
- rows written
- HTTP status
- evidence ref
- safe error code
- start/completion timestamps

No credential values are stored in this ledger.

## Security

f60t_external_signal_runs:
- RLS enabled
- anon: no access
- authenticated: SELECT only
- SELECT protected by admin policy
- authenticated cannot INSERT / UPDATE / DELETE
- server-side Edge Functions perform connector writes

Supabase Security Advisor:
no F60T findings.

## BOOM Studio

F60T now separates:

1. First-party Crowd Radar
2. External official platform signals
3. Local Buying Clock
4. Agent commerce signals
5. Verified hourly profit

The Mission Board displays:
- External official row count
- External platform status
- Top external signal when one exists

External trend/audience/viewership data cannot by itself become a profit opportunity.

## Current live truth

At completion:
- external official signal rows: 0
- external connector runs: 0
- successful external runs: 0
- verified agent events: 0
- verified profit hours: 0

Therefore no external source is represented as producing live demand data yet.

Current source state:
- Pinterest Trends: AVAILABLE_NOT_CONNECTED
- Pinterest Audience: AVAILABLE_NOT_CONNECTED
- YouTube Analytics: AVAILABLE_NOT_CONNECTED
- YouTube audience-time: STUDIO_ONLY
- Google Trends API: ACCESS_REQUIRED
- TikTok Market Scope: PENDING_API_VERIFICATION

## Execution safety

paid_spend = false
external_publish = false
live_price_write = false
supplier_order = false
payment_activation = false

The external connector is research/measurement only.

## Verification

Focused F60T connector tests: PASS.
All root project tests: 108/108 PASS.

## Unrelated work

product.html remains excluded from this change.
