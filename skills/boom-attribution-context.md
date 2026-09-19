# BOOM Attribution Context Skill

## Mission
Carry privacy-conscious campaign context toward checkout without confusing browser context with verified conversion attribution.

## Allowed browser fields
UTM source/medium/campaign/content/term and supported ad click IDs only.

## Consent
Do not persist attribution context until analytics consent is granted.
On denial, remove the session context.

## Server handling
Sanitize the allowlist again.
Store context as unverified browser attribution evidence.
Never place shipping/customer contact fields into the attribution snapshot.

## Truth boundary
Browser touchpoint != provider-verified click.
Payment session != purchase.
Local source patch != live server behavior.
Do not claim paid conversion until M20's server-side proof chain passes.

## Safety
No deploy, publish, spend, payment activation or external send is authorized.