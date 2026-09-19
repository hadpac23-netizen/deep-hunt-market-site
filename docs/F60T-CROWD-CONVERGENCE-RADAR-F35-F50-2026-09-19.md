# F60T Crowd Convergence Radar — F35 + F50 Round — 2026-09-19

## Mission

Detect where real audience concentration is forming, when an entry window exists, and which legitimate route HUNT should prepare to enter through.

The radar is not allowed to infer audience size, purchase intent or profit from weak signals.

## F35 broad scan

The strongest verified signal families available to F60T are:

1. HUNT first-party commerce intent
   - search
   - product view
   - select item
   - save / like
   - add to cart
   - begin checkout

2. Pinterest Trends
   - region
   - growing keyword
   - WoW / MoM / YoY growth

3. Pinterest Audience Insights
   - affinity categories
   - audience geography
   - aggregated audience data

4. YouTube Analytics
   - country
   - views / watch time
   - traffic-source type

5. Local-time evidence
   - only when a verified timezone is present

6. Agent commerce signals
   - only when verified protocol events arrive

## F50 kill round

### KILLED — Spray everywhere

Reason:
A platform being large is not evidence that a particular HUNT audience is there now.

### KILLED — Trend-only entry

Reason:
A trend is demand/attention context, not purchase intent or verified contribution.

### KILLED — Best-time-only entry

Reason:
Posting time without audience/product/intent convergence is too weak to justify an entry window.

### KILLED — Views = buyers

Reason:
Views and watch time are attention evidence, not transaction intent.

### KILLED — Audience affinity = buyers

Reason:
Affinity is interest evidence, not a verified purchase signal.

### KILLED — Scrape communities globally

Reason:
F60T follows the official API/feed-only rule. No scraping or fake community discovery.

### KILLED — Spam / fake-account penetration

Reason:
Not acceptable for HUNT. No impersonation, fake accounts, astroturfing, spam or deceptive urgency.

### HOLD — Reddit as a global crowd source

Reddit's current official developer surface is community/app scoped and protects private user data such as subscriptions, saved items and browsing history.

F60T may later use verified community-level public activity where official access is available, but it must not claim global Reddit audience coverage from partial community access.

## SURVIVED — Crowd Convergence Radar

Mechanism:

CROWD SIGNALS
→ GEO / TOPIC CLUSTER
→ CROSS-SOURCE FUSION
→ RECENCY
→ LOCAL-TIME EVIDENCE
→ ENTRY ROUTE
→ OWNER / PROFIT GATES

The score is:

EVIDENCE CONVERGENCE

It is explicitly not:

- audience size
- purchase probability
- revenue forecast
- profit forecast

## Radar scoring

Possible evidence weights include:

- verified first-party intent
- official trend signal
- official audience-affinity signal
- official traffic-route signal
- country evidence
- multiple independent sources
- recency
- local-time evidence

The radar emits:

- OBSERVE
- LOW
- MEDIUM
- HIGH

A score does not authorize execution.

## Entry Routes

### ONSITE_CAPTURE

Use when HUNT first-party intent is verified.

Prepare:
- matching product prioritization
- collections
- recommendations
- onsite merchandising

No live price write.

### PINTEREST_TREND_CONTENT

Use when a growing Pinterest trend is verified.

Prepare:
- trend-aligned organic Pins
- matching HUNT collection / landing page
- truthful creative

No fake scarcity or automated external publishing.

### PINTEREST_AFFINITY_COLLECTION

Use when verified Pinterest affinity aligns to a topic/product category.

Prepare:
- interest-matched collection
- creative angle
- localization where evidence exists

Affinity is not treated as purchase intent.

### YOUTUBE_GEO_CONTENT

Use when verified country viewership exists.

Prepare:
- country-relevant concepts
- video ideas
- HUNT landing content

Views remain attention evidence only.

### SEARCH_CAPTURE

Use when YouTube traffic-source evidence points to search.

Prepare:
- search-aligned video topics
- truthful titles/descriptions
- matching HUNT pages

No keyword stuffing.

### RELATED_CONTENT_BRIDGE

Use when related/suggested video traffic is verified.

Prepare:
- adjacent comparison/demo content
- genuinely related topics

No imitation or misrepresentation of another creator.

### EXTERNAL_REFERRAL_BRIDGE

Use when external referral traffic is verified.

Prepare:
- identify the legitimate referral class
- owned/partner content
- matching landing page

Any commercial partnership remains owner-gated.

### COMMUNITY_ANSWER_FIRST

Future community route.

Rules:
- community rules first
- answer the need before promotion
- disclose affiliation when relevant
- no spam
- no fake accounts

## Cross-report fusion

A single API row does not need to contain every answer.

Example:

YouTube country report:
Germany = verified viewership geography

YouTube traffic-source report:
YT_SEARCH = verified discovery route

Radar may fuse both because they come from the same verified platform/account context.

It must not invent a country for the traffic-source row.

## Current live truth

Pinterest OAuth:
DISCONNECTED

YouTube OAuth:
DISCONNECTED

Therefore:

- no live Pinterest Trends rows
- no live Pinterest Audience rows
- no live YouTube country rows
- no live YouTube traffic-source rows

Current Radar status must remain:

OBSERVE

until converged verified signals arrive.

## Execution safety

external_publish = false
paid_spend = false
live_price_write = false
supplier_order = false
payment_activation = false
execute_actions = false
spam_allowed = false
deception_allowed = false

## Official references

Pinterest Trends:
https://developers.pinterest.com/docs/analytics-and-reports/trends/

Pinterest Audience Insights:
https://developers.pinterest.com/docs/analytics-and-reports/audience-insights/

YouTube Analytics channel reports:
https://developers.google.com/youtube/analytics/channel_reports

YouTube Analytics sample traffic-source requests:
https://developers.google.com/youtube/analytics/sample-requests

Reddit API overview:
https://developers.reddit.com/docs/capabilities/server/reddit-api
