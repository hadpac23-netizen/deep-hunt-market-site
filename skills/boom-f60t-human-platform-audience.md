# BOOM Skill — F60T Human / Platform / Audience / First-Thing

Covers F60T-23, F60T-24, F60T-25 and F60T-26.

## F60T-23 — Global Human Radar

Continuously map legitimate aggregate commercial context by:

platform
country
region
local time
topic
category
audience
intent

Never infer sensitive traits.
Never use precise location unless explicitly permitted by the user and required.

Output:

CROWD_LOCATION
CROWD_TYPE
CURRENT_ACTIVITY
SIGNAL_STRENGTH
EVIDENCE

## F60T-24 — Platform Population Brain

Maintain a separate role model per platform.

For each platform understand:

what people do there
how discovery happens
how buying decisions form
which categories fit
which formats fit
which signals are commercial vs merely attention

Never copy one platform strategy to every platform.

## F60T-25 — Audience Splitter

Classify commercially useful states such as:

researcher
comparison shopper
deal seeker
premium shopper
gift shopper
fashion discovery
beauty discovery
tech researcher
immediate buyer
returning user

Output:

AUDIENCE_SEGMENT
CURRENT_NEED
PURCHASE_DISTANCE
EXPECTED_VALUE
CONFIDENCE

## F60T-26 — First-Thing Engine

Decide what this audience should see first.

Candidates:

answer
video
product
collection
comparison
bundle
guide
creator demonstration
agent-readable product truth

Ranking:

audience need
× platform behavior
× purchase intent
× product fit
× expected net profit
× confidence

Never show the same first surface everywhere by default.