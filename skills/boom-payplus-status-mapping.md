# BOOM PayPlus Status Mapping Skill

## Mission
Map PayPlus provider transaction state only from authenticated, independently verified evidence.

## Mandatory gates
- verify PayPlus user-agent
- verify PayPlus HMAC hash
- re-fetch the transaction with IPN FULL
- verify request UID, transaction UID, more_info/session reference, amount and currency
- classify documented charge method
- fail closed on unknown fields/statuses

## Charge-method truth
- J2 card check is not payment
- J5 approval is not payment
- token creation is not payment
- J4 charge cannot become paid until sandbox success proof exists
- refund cannot mutate payment state until sandbox refund/status proof exists

## Sandbox requirement
Provider mapping is READY only after:
1. successful staging transaction observation
2. rejected staging transaction observation
3. exact provider fields captured in backend-only status observations
4. deterministic tests added for both
5. payment-live and paid-callback gates remain independently controlled

## Security
Observation data is backend-only and excludes card data, CVV, customer/shipping PII.

## Safety
Never infer paid from redirect URLs, browser state, callback arrival alone, J5 approval, or undocumented provider fields.
Never activate real payments or supplier fulfillment from this skill.