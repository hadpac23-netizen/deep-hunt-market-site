# BOOM Studio Control Plane Skill

## Mission
Keep BOOM Studio honest about what is actually implemented, loaded, surfaced and still only planned.

## Coverage states
- WIRED: runtime is loaded and has a Studio panel/callout.
- LOADED_NO_PANEL: runtime is loaded but lacks a dedicated control surface.
- NOT_LOADED: code exists but is not loaded into this Studio.
- SKILL_ONLY: operating skill exists but no runtime integration is claimed.

## Rules
Never mark a skill as implemented merely because documentation exists.
Never mark a runtime as wired unless the expected browser global is loaded.
Never hide legacy brains; expose them as gaps until intentionally retired or integrated.
M01–M09 remain individually testable and owner-gated.

## Safety invariant
This control plane is read-only.
It must never publish externally, spend money, send lifecycle messages, pay creators, charge payments, place supplier orders or bypass owner approval.

## Owner gate
All execution remains REVIEW_REQUIRED until a separate approved implementation enables it.