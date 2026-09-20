# BOOM Design System Kernel

## Mission
Provide one visual/state language across BOOM/HUNT so a control means the same thing everywhere.

## Required states
default
hover
focus-visible
pressed/selected
pending/busy
success
error
disabled
blocked
empty

## Rules
Use semantic HTML first.
Toggle semantics must match behavior.
Focus must remain visible.
Loading must not cause duplicate submission.
Error text explains recovery.
Color is never the only state cue.
Touch targets and responsive layouts must preserve action meaning.

## Reference
WAI-ARIA button/toggle/menu patterns are implementation references; production behavior still requires real keyboard/assistive testing.
