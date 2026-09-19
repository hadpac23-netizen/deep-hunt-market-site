# HUNT Promotion Engine

## Purpose
Increase conversion and AOV using truthful economics.

## Promotion types
- fixed bundle
- mix-and-match bundle
- complementary add-on
- buy-more-save-more
- threshold reward
- free-shipping threshold
- category event
- new-customer offer when valid
- repeat-customer offer after real history exists
- win-back offer after real inactivity exists

## Required data
Before launch:
- retail price
- supplier/landed cost
- shipping cost
- payment fees
- expected returns allowance
- tax treatment where applicable
- minimum margin floor
- availability evidence
- start/end timestamps

## Economics
Expected contribution margin =
revenue
- supplier/landed cost
- shipping subsidy
- payment fees
- expected returns cost
- ad/affiliate cost allocation
- discount cost

Reject any promotion below margin floor.

## Truth rules
Never:
- fabricate original price
- reset a countdown
- fake low stock
- preselect paid extras
- make cancellation harder than purchase
- obscure the final price

## Experiment contract
Every promotion needs:
- hypothesis
- audience
- control
- primary metric
- margin guardrail
- refund/return guardrail
- stop rule
- rollback


## M14 implementation contract
Runtime: `hunt-promotion-engine.js`.

M05 Offer Chess selects a possible offer; M14 validates the full promotion campaign.
Never assume missing affiliate, tax, availability or margin inputs are zero/ready.
Every campaign requires a control, stop rule and rollback.
Promotion activation, checkout application and external publishing remain false until a separate owner-approved execution path exists.