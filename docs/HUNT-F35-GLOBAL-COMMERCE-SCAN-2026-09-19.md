# HUNT F35 Global Commerce Scan — 2026-09-19

## New intelligence added
- Clarify-or-Recommend Gate: when shopping intent is materially ambiguous, prefer at most one optional clarification step over confident guessing.
- Diversity Budget: exploration can favor serendipity, comparison stays balanced, and decision/checkout favors accuracy.
- Explain-Why: provide concise outcome explanations such as interest match, verified commerce readiness, complementary fit, or fresh discovery.
- Behavioral Decision Intelligence remains decision-support only; it cannot alter commercial truth.

## Why these matter
Recent conversational recommendation research supports preference elicitation and strategic clarification when user intent is incomplete. Research on AI retail recommenders shows that accuracy alone is not enough; diversity and serendipity also contribute to consumer gratification and behavioral intention.

## Agent-ready commerce
HUNT already emits Schema.org Product JSON-LD on product pages, including product identity and optional SKU/brand.
Next agent-readiness work should enrich machine-readable product truth only when verified:
- variants and compatibility;
- verified retail offer state;
- destination-aware availability and shipping;
- return/support policy references;
- substitutions and complementary products;
- common product questions/answers.

Do not publish uncertain price, stock, delivery, or offer claims into machine-readable commerce data.

## Shopping Mission Brain
F35 now separates category interest from the shopper's immediate mission.

Supported mission labels:
- gift
- outfit
- replace
- replenish
- compare
- trip
- event
- setup
- budget

Mission labels are derived locally from the search request. Raw search text is not sent in the `hunt:search-intent` event or AI context.

Mission-to-decision mapping:
- gift / budget -> simplify + guided narrowing
- outfit / trip / event / setup -> complete + guided composition
- replace / compare -> factual comparison
- replenish -> confidence + verified-first behavior

## Clarify Once
When intent is materially ambiguous, F35 may show one optional clarification step and then stop asking.
Replacement missions ask for model/size only when those qualifiers are missing.
Gift missions can narrow to a broad shopping world without inferring recipient identity.

## Mission telemetry
The browser can emit only the mission label with consented search analytics.
No raw query is included in mission telemetry.
The live Supabase signal function does not yet persist the new mission label; keep that backend change owner-gated until a reviewed Edge Function source is added to the repo.
