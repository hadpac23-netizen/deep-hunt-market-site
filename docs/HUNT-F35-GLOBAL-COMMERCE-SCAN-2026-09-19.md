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