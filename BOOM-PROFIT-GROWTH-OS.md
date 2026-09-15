# BOOM Profit & Growth OS

## Mission
Build an evidence-first operating system for HUNT DEAL that connects verified product economics, deal intelligence, first-party analytics, SEO/growth signals, experimentation and owner approvals. The long-term business target is $10,000+ net profit/day, treated as a target rather than a guarantee.

## Existing systems reused
- `hunt-profit-engine`: verified unit economics and safe CAC/coupon capacity.
- `hunt-deal-engine`: verified deal candidates and owner-gated publish flow.
- `hunt-owner-mission-control`: first-party HUNT funnel and owner snapshot.
- `hunt-launch-readiness`: soft-launch, real-money and paid-marketing gates.
- `analytics.js`: consent-gated GA4 + first-party commerce signals.
- `hunt_boom_command_queue`: BOOM execution queue.
- `hunt_marketing_experiments`: existing measurable Marketing Lab experiments.
- `hunt_boom_world_ideas`: existing BOOM World Radar research/idea pipeline.

The Growth OS must orchestrate these systems rather than duplicate them.

## V1 files
- `boom-growth-os-core.js`: pure scoring, funnel, milestone and bottleneck logic.
- `boom-growth-os.js`: owner-only read orchestration.
- `boom-growth-os.html`: owner dashboard.
- `boom-growth-os.css`: isolated dashboard styles.
- `boom-growth-os.test.cjs`: deterministic core tests.

## Guardrails
1. No fake prices, discounts, reviews, scarcity, popularity, stock or demand.
2. No paid spend or campaign launch without explicit owner approval.
3. No live price/discount mutation without explicit owner approval.
4. No real-money activation until payment callback, order creation, supplier handoff, tracking and an end-to-end order test pass.
5. No promotion candidate is scale-eligible without verified positive economics, PASS profit gate and price-truth evidence.
6. Claude/automation works on a feature branch; production deploy remains owner-gated.
7. Optimize for sustainable net profit, trust and repeat purchase, not vanity metrics.

## Next architecture layers
- Marketing Brain: channel recommendation and campaign hypotheses.
- Creative Brain: channel-specific creative variants with traceable experiment IDs.
- SEO Brain: Search Console + Ahrefs + technical crawler signals.
- Love Engine: save/like/return-visit/repeat-purchase and trust metrics.
- Experiment Engine: hypothesis → exposure → outcome → net-profit evaluation.
- Everywhere Publisher: owner-approved scheduling/publishing adapters only.

## Claude continuation contract
Before adding a new table, edge function or duplicate engine, inspect the existing implementation. Prefer additive modules and reuse current source-of-truth tables/functions. Every change must include syntax checks, focused tests, regression checks, and browser verification. Never merge/deploy or activate external spend without owner approval.
