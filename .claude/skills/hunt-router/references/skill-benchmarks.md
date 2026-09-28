# HUNT Skill Benchmarks

This file records design patterns studied before creating the HUNT-specific Claude Code skills.
HUNT does not vendor or execute third-party skill code from these sources.

## Benchmarked patterns

### Anthropic Claude Code frontend-design
Adopted concepts:
- protect explicit user direction and existing product behavior
- make visual direction intentional rather than generic
- pair implementation with rendered verification

### Anthropic Claude Code skill-development / plugin structure
Adopted concepts:
- project-local skills under .claude/skills/<name>/SKILL.md
- narrow trigger descriptions
- progressive disclosure: keep core procedures in SKILL.md, detailed references separately
- use a router to select specialized skills

### Autodesk browser-test-skills
Adopted concepts:
- browser journeys as reusable test contracts
- stabilize tests rather than accepting a single flaky pass
- compile critical journeys into repeatable regression checks when practical

### Visual regression skill patterns
Adopted concepts:
- compare approved baseline against experiment
- test affected routes at multiple viewports
- reject unintended CSS/layout regressions

### WCAG/accessibility skill patterns
Adopted concepts:
- keyboard reachability and visible focus
- semantic labels/headings
- no horizontal page scroll at narrow widths
- reduced-motion support
- dark/light contrast checks

### Supabase/Postgres best-practice skill patterns
Adopted concepts:
- bounded/indexed queries
- RLS/security review with schema work
- diagnose timeouts before adding resources
- keep external supplier work outside Postgres
- batch writes into the truth store

### Security review skill patterns
Adopted concepts:
- secrets, input validation, XSS, auth/RLS, rate limits, CORS/headers, dependency review
- higher scrutiny for payments, webhooks and third-party APIs
- deployment security as a launch gate

## HUNT-specific extensions

HUNT adds project-specific controls not supplied by generic skill packs:
- Owner-approved baseline locking
- Original Cinematic / Living Campaign preservation
- Main Category -> Department -> Exact Shelf hierarchy
- strict product identity and no cross-shelf filler
- Product Truth commerce gates
- verified size/variant rules
- recommendation dedupe
- Production / Payment Live / Supplier Live Order independent gates

## Supply-chain policy

Do not install or execute arbitrary external skill scripts/hooks automatically.
Review third-party skill instructions, bundled scripts, package lifecycle behavior and requested permissions before adoption.
Prefer synthesizing a small HUNT-owned skill unless external executable tooling has a clear, reviewed benefit.
