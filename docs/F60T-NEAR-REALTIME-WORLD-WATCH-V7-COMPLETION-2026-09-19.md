# F60T Near-Real-Time World Watch v7 — Completion — 2026-09-19

## Mission

Move F60T World Watch from an hourly-only first-party snapshot to a safer near-real-time cadence while preserving Profit Truth and source licensing rules.

## Live cadence

HUNT first-party World Watch:
every 10 minutes.

External official platform connectors:
hourly.

Hourly profit truth:
remains hourly.

This separation prevents unnecessary API usage and preserves the meaning of VERIFIED NET PROFIT / HOUR.

## First-party 10-minute window

hunt-f60t-snapshot now creates first-party crowd snapshots using a 10-minute UTC bucket.

The crowd window no longer reuses the hourly profit bucket.

Profit ledger continues to use the hourly boundary.

Runtime state:

world_watch.cadence = TEN_MINUTES_FIRST_PARTY
world_watch.first_party_window_minutes = 10
world_watch.external_connector_cadence = HOURLY

## Cron

Active jobs:

f60t-snapshot-10m
schedule: */10 * * * *

f60t-external-signals-hourly
schedule: 0 * * * *

The previous f60t-snapshot-hourly job was removed.

## Cloudflare Radar

Cloudflare Radar was reviewed as a possible near-real-time global Internet activity signal.

Official capabilities verified:
- Radar API
- top locations by HTTP requests
- lastUpdated metadata
- confidence metadata
- 15-minute aggregation support for HTTP time series

However, Cloudflare documents the free Radar API dataset under CC BY-NC 4.0.

Because HUNT / F60T is a commercial profit engine, Cloudflare Radar is NOT used for commercial profit routing at this stage.

Registry state:

source_key = cloudflare_radar
status = LICENSE_REVIEW
access_mode = OFFICIAL_API

Rule:

Do not ingest Cloudflare Radar into commercial decision scoring unless separate commercial permission/license is confirmed.

## Google / TikTok

Google Trends API:
ACCESS_REQUIRED / alpha.

TikTok Creative Center:
useful public trend research surface, but no unsupported automated scraping is added.

F60T keeps the official API/feed-only rule.

## BOOM Studio

Studio now displays:

World Watch cadence = 10 min
Cloudflare Radar = RESEARCH ONLY · LICENSE REVIEW

Cache versions were bumped so the updated status is visible immediately.

## Live verification

hunt-f60t-snapshot version 6 is ACTIVE.

Cron-authenticated live test:
HTTP 200.

Returned live state:

world_watch.always_on = true
world_watch.cadence = TEN_MINUTES_FIRST_PARTY
world_watch.skill_count = 40
world_watch.first_party_window_minutes = 10
world_watch.external_connector_cadence = HOURLY
world_watch.cloudflare_radar_state = LICENSE_REVIEW

Current radars:

SEARCH_RADAR = OBSERVE
SOCIAL_DISCOVERY_RADAR = OBSERVE
COMMUNITY_RADAR = OBSERVE
CREATOR_LIVE_RADAR = OBSERVE
AGENT_RADAR = OBSERVE

Current truth:

recognized_intent_event_count = 0
recognized_market_intent_event_count = 0
timezone_event_count = 0
hot_zones = []

verified_net_profit = USD 0.00
verification_status = UNVERIFIED

No opportunity or profit is fabricated.

## Safety / controls

paid_spend = false
external_publish = false
live_price_write = false
supplier_order remains gated
payment activation remains gated

## Unrelated work

product.html remains excluded from this change.
