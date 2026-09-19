# F60T Live World Radar — Current State

Verified: 2026-09-19

## Production truth
- `hunt_first_party`: **LIVE**
- First-party analytics events observed in last 24h at verification time: **7,121**
- First-party analytics events observed in last hour at verification time: **62**
- Verified crowd snapshots in last 24h at verification time: **0**
- Pinterest OAuth: **DISCONNECTED**
- YouTube OAuth: **DISCONNECTED**
- External connector scheduler is running, but Pinterest/YouTube syncs are currently `SKIPPED_CONFIG`.
- Current-hour verified net profit at verification time: **$0.00**
- Current-hour locked contribution at verification time: **$0.00**

## Source gates
- Google Trends Trending Now: official RSS export exists; use as aggregate attention evidence only.
- Google Trends API Alpha: access required; do not claim connected.
- Cloudflare Radar API data: CC BY-NC 4.0; research context only, not commercial profit routing without separate permission.
- Pinterest Trends / Audience Insights: connector code exists; blocked only on OAuth.
- YouTube Analytics: connector code exists; blocked only on OAuth.
- TikTok: no verified global live commercial heatmap source is claimed.
- Agent commerce: event ledger is ready; remains pending until verified protocol traffic arrives.

## Source of truth
The deployed F60T Edge Functions are now mirrored into this branch:
- `supabase/functions/hunt-f60t-snapshot/index.ts`
- `supabase/functions/hunt-f60t-external-signals/index.ts`
- `supabase/functions/hunt-f60t-oauth/index.ts`

This branch does not deploy or mutate production by itself.


## 2026-09-19 live upgrade
- Production schema migration `20260919193323_f60t_official_rss_source_contract` applied and verified.
- `OFFICIAL_RSS` and source status `AVAILABLE` are now valid F60T source-contract values.
- `google_trends_rss` is registered in Production as `AVAILABLE`, not `LIVE`; no success is claimed before a real sync writes verified rows.
- `hunt-f60t-external-signals` deployed successfully as version 6 with the Google Trends Trending Now RSS adapter.
- The adapter has no scraping fallback and stores null purchase-intent scores with `ATTENTION_PROXY_NOT_PURCHASE_INTENT`.
- `f60t-external-signals-hourly` is active at `0 * * * *` and already calls `sync_available`.
- `f60t-snapshot-10m` is active every 10 minutes.
- F60T Live Index regression gates: 5/5 PASS after canonical source-key alignment.
- World Radar live dashboard is staged in this branch; it is not merged to the storefront yet.
