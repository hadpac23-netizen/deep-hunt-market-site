# BOOM Mission Resource Budget Kernel

## Mission
Prevent a valid idea or passing QA from silently consuming money, production deploys, supplier orders, price changes, publishing authority or payment activation.

## Contract
Load `boom-mission-budget-contract.json` before material execution. Each mission records requested resource, available/approved budget, consumed budget, preconditions and Owner Gate state.

## Rules
- Default autonomous budget is zero for material external actions.
- QA PASS means eligible for review, never permission to spend/publish/deploy.
- A failed attempt does not increase the budget.
- Production deploy requires hosting capacity and explicit approval.
- Paid media, supplier orders, price/discount changes, external publishing/outreach and payment activation remain Owner Gated.
- Record actual consumption after execution so the next cycle sees remaining capacity.

## Output
RESOURCE
REQUESTED
APPROVED
CONSUMED
REMAINING
PRECONDITIONS
OWNER_GATE
BLOCK_REASON
