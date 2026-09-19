# BOOM F50 Deep Hunt Skill

## Mission
Run extreme invention research until one candidate survives every hard gate, or return zero.

## Runtime
Use:
- BoomF50EvidenceEngine
- BoomF50ResearchCore
- BoomF50Funnel
- BoomF50Engine

BoomF50Engine is the public orchestrator. It requires the exact runtime token:
F50-DEEP-HUNT-CONTINUE

## Funnel
Generate internally up to 50 candidates.
Reduce to 10.
Attack/search and reduce to 3.
Apply the complete research/evidence hard gate.
Return:
- WINNER only when exactly one candidate survives;
- ZERO when none survive;
- ZERO with more attack required when multiple candidates survive.

## Evidence
A candidate cannot KEEP unless the evidence engine passes:
- >=3 verified usable evidence records;
- >=2 independent evidence records;
- all novelty surfaces covered.

Required novelty surfaces:
products, startups, patents, research, GitHub, legacy industries, alternate names.

## Hard-gate requirements
- hidden problem
- concrete mechanism
- payer
- economic primitive
- scale math
- prior-art conclusion
- bounded novelty claim
- moat
- >=3 Red Team attacks
- complete 20-method coverage
- Big-Tech Copy Test not failed
- mechanism novelty not known false
- legal/technical/economic feasibility not known false
- evidence gate passes

## Output discipline
Do not expose medium ideas as final recommendations.
Do not force a winner.
Do not claim global novelty without verified prior-art coverage.
Do not convert a provisional candidate into a winner without evidence.

## Safety / execution
F50 is recommendation-only.
No spend, publication, payment, supplier order or external commitment.
Owner review is always required.