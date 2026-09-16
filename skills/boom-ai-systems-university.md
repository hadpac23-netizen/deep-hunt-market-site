# BOOM AI Systems University

## Mission
Train BOOM F35 Research to improve the HUNT management architecture continuously without turning the system into uncontrolled agent sprawl.

BOOM learns from official, current AI-agent engineering guidance and converts lessons into testable architecture upgrades.

## Core doctrine
1. Prefer the simplest architecture that solves the problem.
2. Use a central manager when one brain should retain control and delegate specialist work.
3. Use handoffs only when a specialist should temporarily own the task.
4. Keep deterministic code around money, permissions, production changes, supplier orders and other sensitive actions.
5. Require structured reports, evidence, guardrails, traces and evals.
6. Human approval remains required for owner-gated actions.
7. Add agents/workers only when specialization materially improves quality, context or reliability.
8. Measure the effect of architecture changes before keeping them.

## Course 1 — Single agent vs workflow vs multi-agent
Study:
- When a single well-equipped agent is enough.
- When routing and deterministic workflows are better.
- When multiple specialists reduce context overload or improve expertise.

Graduation test:
BOOM can explain why each HUNT department is a manager, worker, deterministic service or human approval gate.

## Course 2 — Manager orchestration and handoffs
Study:
- Manager-style orchestration.
- Agents-as-tools.
- Handoffs.
- Code-based routing versus LLM routing.

HUNT application:
BOOM Executive remains the manager. Supplier, Sales, Marketing, Category, Reliability and F35 are specialist departments. Sensitive execution remains code-gated.

## Course 3 — Tools and structured outputs
Study:
- Narrow tools.
- Explicit schemas.
- Validation.
- Failure handling.
- Idempotent operations.

HUNT application:
Every manager report follows the BOOM report contract. Unknown is never converted into PASS.

## Course 4 — Context, memory and state
Study:
- Session state.
- Working context versus durable facts.
- Context compression.
- Keeping specialist context small and relevant.

HUNT application:
Worker context is scoped to its department. BOOM receives summaries/evidence rather than every raw event.

## Course 5 — Guardrails and human-in-the-loop
Study:
- Input/output validation.
- Tool permission boundaries.
- Human approval.
- Blast-radius reduction.

HUNT application:
No live payment, supplier order, payout, paid campaign or production deploy without the required owner gate.

## Course 6 — Tracing, observability and evals
Study:
- Trace each run.
- Measure agent decisions.
- Build regression/evaluation suites.
- Compare architecture changes against real outcomes.

HUNT application:
Reliability, Category and future manager reports become observable BOOM events. Architecture changes need measurable improvement.

## Course 7 — Long-running agents and managed workers
Study:
- Durable task state.
- Resumable work.
- Context resets.
- Stable interfaces between brain and execution workers.

HUNT application:
Workers report through stable BOOM schemas so the model/provider can evolve without rewriting the whole organization.

## Course 8 — Multi-agent failure modes
Study:
- Duplicated work.
- Conflicting agents.
- Cascading errors.
- Excessive autonomy.
- Coordination overhead.
- Agents optimizing local goals against global goals.

HUNT application:
BOOM resolves conflicts using:
Safety/legality > shopper trust > transaction correctness > stock/shipping truth > positive economics > user relevance > conversion > growth > cosmetic polish.

## Course 9 — Market-learning loop
Study:
- Evidence collection.
- Hypothesis.
- Test.
- Evaluate.
- Keep/kill.
- Feed learning back into tools, prompts and category/supplier priorities.

HUNT application:
F35 Research must not merely collect trends. It must route validated findings to the manager that can use them.

## Official study sources
- OpenAI Agents SDK — Agents, orchestration, tools, sessions, guardrails, tracing and evals.
- Anthropic — Building Effective Agents; managed/long-running agent engineering; multi-agent research.
- Google Agent Development Kit — multi-agent development and evaluation practices.
- LangGraph/LangChain — multi-agent patterns and context-management tradeoffs.

## Continuous-learning report
F35 AI Systems worker reports:
- source
- date
- new pattern
- why it matters
- BOOM/HUNT component affected
- proposed experiment
- expected benefit
- failure risk
- eval required
- keep/kill criteria
- owner approval required

No architecture change is considered learned until it passes an eval or produces measurable reliability/business improvement.
