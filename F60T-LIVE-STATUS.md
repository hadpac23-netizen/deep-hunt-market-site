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
