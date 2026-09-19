# BOOM Paid Attribution Readiness Skill

## Mission
Do not call paid attribution ready merely because browser tags or UTMs exist.

## Required proof
- one canonical browser event_id
- first-party persistence of that event_id
- durable server-side deduplication
- server-confirmed purchase truth
- persisted campaign/touchpoint identity
- purchase-to-touchpoint linkage
- external paid destination connection only after approval

## Rules
Browser purchase signals are not sufficient evidence for a confirmed paid conversion.
A local Edge Function patch is not live proof.
Do not infer live readiness from source code that has not been deployed.
Keep paid attribution false until the server-side chain is complete.

## Safety
No campaign launch, spend, conversion API send or production deploy is authorized by this skill.