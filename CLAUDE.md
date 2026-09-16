# CLAUDE.md — BOOM AI Engineering Studio

## Mission
Build and evolve BOOM as a real, inspectable AI-agent control system for HUNT.

The UI direction is a live node-graph studio inspired by modern workflow/agent builders:
- central agent node
- model / memory / tools
- manager and department nodes
- live status lines
- tabs for Studio / Executions / Evaluations / Learning
- right-side inspector and chat

Do not build a static mock dashboard. Every visible system state must be backed by real BOOM/HUNT data or be clearly marked as not connected.

## Authority hierarchy
OWNER
→ BOOM Meta-F35
₂ BOOM Super Agent
₂ BOOM EXECUTIVE
→ Directors / Managers
→ Workers
→ Reports / Events / Commands / Evals

## BOOM Meta-F35
Purpose:
- study AI engineering and agent systems
- improve orchestration, tools, memory, evals, observability, prompts and workflows
- propose bounded upgrades
- run before/after evals
- keep only measurable improvements
- kill regressions

Meta-F35 must never silently self-modify sensitive execution paths.

## BOOM Super Agent
Purpose:
- resolve priorities across all managers
- create manager/worker commands
- route work to the correct department
- resolve conflicts between local department goals
- keep Owner approval gates
- improve the site through staged, measurable commands

## Current top-level departments
- Sales
- Marketing & Advertising
- Dynamic Merchandising
- Categories
- Inventory Truth
- Product Quality / Sale Readiness
- Pricing & Profit
- Supplier & Shipping
- CJ Supplier
- EPROLO Supplier
- Checkout & Payment
- Returns & Customer Care
- Feedback Intelligence
- Integrations
- Reliability
- Repair / Engineering
- Trust & Compliance
- Analytics & Data Truth
- Security & Access
- Finance & Reconciliation
- Release & Change Control
- Merchandising & UX
- Country & Localization
- F35 Research & Learning
- F35 Buyer Acquisition
- Daily $10K+ Mission
- department managers for Women, Men, Kids, Beauty, Jewelry/Accessories, Home, Tech, Sports, Pets, Toys, Travel/Office/Gifts

## AI Engineering track
Meta-F35 has specialist workers for:
- Orchestration Engineering
- Tool Engineering
- Memory Engineering
- Eval Engineering
- Observability
- MCP / Integrations
- Workflow Engineering
- Safety / Guardrails

The system should learn and evaluate:
- single agent vs workflow vs multi-agent
- manager-style orchestration
- handoffs
- tool calling and schemas
- session memory vs durable state
- tracing
- evals and regression testing
- long-running task state
- multi-agent failure modes
- permission boundaries
- human approval gates

## Core priority order
Safety / legality
> shopper trust
> transaction correctness
> stock / shipping truth
> positive economics
> user relevance
> conversion
> growth
> cosmetic polish

## Sensitive actions
The following are OWNER-GATED and must never be enabled automatically:
- live payment
- supplier live order
- production deploy
- payout / settlement
- paid advertising spend
- secrets / permissions changes
- destructive data actions

## Truth rules
Never fake:
- products
- supplier availability
- prices
- shipping
- reviews
- AI model connectivity
- revenue
- profit
- worker status
- successful execution

If the LLM/provider is not connected, show:

Model connector ready — provider not enabled yet.

## Current BOOM data model
Supabase tables already exist for:
- hunt_boom_managers
- hunt_boom_workers
- hunt_boom_worker_reports
- hunt_boom_live_reports
- hunt_boom_events
- hunt_boom_chat
- hunt_boom_decisions
- hunt_boom_agent_commands
- hunt_boom_improvement_cycles
- hunt_boom_evals
- hunt_boom_learning_items

## Existing runtime
- BOOM Pulse: every 5 minutes
- Worker Pulse: every 15 minutes
- Meta-F35 Pulse: every 30 minutes
- Reliability workflow: every 30 minutes when active on default branch

## Primary UI build
Create/refine:
- boom-ai-studio.html
- boom-ai-studio.css
- boom-ai-studio.js

The Studio should include:

### Studio tab
A node graph with:
- Owner Chat trigger
- BOOM Meta-F35
- BOOM Super Agent
- LLM / Reasoning Model
- BOOM Memory / State
- Eval Guardian
- department nodes
- supplier nodes
- F35 nodes
- $10K Mission
- Reliability
- Checkout
- Security
- Analytics

Connections must reflect hierarchy and live status.

### Executions tab
Show:
- commands
- events
- latest manager reports
- worker reports
- current status
- priority
- target manager
- expected result

### Evaluations tab
Show:
- improvement cycles
- baseline
- current value
- target
- pass / fail / open
- keep / kill verdict

### Learning tab
Show:
- AI Engineering modules
- source
- principle
- HUNT application
- proposed experiment
- evaluation requirement

### Inspector
Clicking a node must show:
- manager name
- reports_to
- status
- latest report
- metrics
- issues
- recommended action
- workers
- worker report status
- open commands for that manager

### Chat
Chat remains in the Studio.
It should synthesize live BOOM state.
Do not claim an external LLM is running unless a real provider is connected server-side.

## Login
Use boom-login.html visual baseline.
Hebrew must render correctly.
UTF-8 only.
Owner/Admin access only.

## UI style
Dark engineering console.
High contrast.
Minimal fake decoration.
Node graph lines should visibly change for:
- healthy / working
- watch
- blocked / critical
- live activity

Do not copy another product pixel-for-pixel.
Use the workflow-canvas idea while maintaining BOOM identity.

## Technical rules
- Keep HUNT Production unchanged unless explicitly approved.
- Work only on the BOOM feature branch / preview first.
- No service-role secret in browser code.
- RLS must remain enabled.
- Do not weaken auth to make the UI easier.
- Every write path needs a clear permission boundary.
- Use deterministic code for money, supplier fulfillment, production deploy and owner approval.
- Prefer stable schemas over hidden model context.
- Add evals before claiming self-improvement.

## Source of truth
GitHub repository:
hadpac23-netizen/deep-hunt-market-site

Current BOOM feature branch:
feature/hunt-supplier-gravity-v1

Do not reset or overwrite unrelated dirty worktrees.

## First Claude task
1. Read this file.
2. Inspect current BOOM files and Supabase schema.
3. Build the node-based BOOM AI Engineering Studio in the repository.
4. Preserve current functionality.
5. Add tests for:
   - auth gate
   - manager/worker rendering
   - command rendering
   - eval rendering
   - model connector truthful state
   - mobile overflow
6. Produce a preview only.
7. Report changed files, test results and remaining blockers.
8. Do not deploy Production without explicit owner approval.
