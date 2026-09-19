# BOOM Behavioral Commerce Intelligence

## Mission
Help each shopper make an informed, voluntary decision with less friction, less uncertainty and better relevance.

## Runtime states
F35 treats behavior as a shopping state, never as a personality diagnosis.

- explore: broad inspiration and editorial discovery.
- simplify: reduce choice overload and surface a smaller relevant set.
- compare: support side-by-side evaluation and meaningful differences.
- confidence: prioritize verified facts, shipping/returns clarity and trust.
- complete: show genuinely complementary items without pressure.

## Allowed first-party signals
- explicit category preferences;
- search-derived category intent without sending raw search text;
- product views;
- like/save actions;
- session phase and page context;
- market/country readiness;
- verified catalog depth.

No sensitive traits, identity, private messages, payment data or vulnerability inference may enter the decision model.

## Choice architecture
Map the runtime state to a presentation strategy:

- explore -> editorial + relevant-mix;
- simplify -> guided + narrow-set;
- compare -> comparison + side-by-side;
- confidence -> evidence/minimal + verified-first;
- complete -> evidence + complementary.

The behavioral layer may re-rank presentation modestly, but it may not fabricate or alter price, stock, shipping, delivery, reviews, discounts, quality claims or supplier readiness.

## Research-backed principles
1. Reduce cognitive load and avoid overwhelming product lists.
2. Use progressive disclosure as purchase intent deepens.
3. Make comparison easy on attributes that actually matter.
4. Reduce uncertainty near payment with clear totals, fulfillment, returns and support information.
5. Use trust signals only when verified.
6. Preserve guest/low-friction paths where operationally supported.
7. Explain why optional or required information is requested.
8. Keep recommendations reversible and easy to ignore.


## Learning loop
HUNT has two learning layers:

1. Session intelligence in `boom-commerce-brain.js` uses the current shopper's explicit interests and first-party actions to infer only the current decision state.
2. Aggregate intelligence in `hunt-commerce-learning` learns 30-day category/product demand from anonymized session-level commerce events and feeds BOOM NET ranking.

The aggregate layer is a curation prior, not social proof. F35 must never turn aggregate demand into copy such as "everyone is buying" or "best seller" unless an independently verified merchandising system explicitly supports that claim.

## Optimization objective
Optimize for:
- successful discovery;
- useful saves and comparisons;
- verified add-to-cart readiness;
- checkout clarity;
- lower avoidable abandonment;
- repeat trust.

Do not optimize a user-specific model for maximum spend, compulsion, time-on-site, or susceptibility.

## Kill test
Reject any behavioral change that:
- changes commercial truth;
- creates pressure, fear, shame, fake urgency or fake scarcity;
- hides costs or makes cancellation harder;
- infers sensitive traits, emotions, financial stress or vulnerability;
- makes recommendations difficult to ignore;
- degrades accessibility or reduced-motion behavior;
- cannot fall back safely when AI is unavailable.
