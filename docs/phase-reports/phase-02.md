# Phase

Phase 2 — Immortal Combat and Structural Destruction

# Goal

Prove that the 3D city is physically vulnerable to immortal combat.

# Implemented

- Added a persistent rival immortal with health, pursuit, strike response, and knockback.
- Added player strike input (`F`) and shockwave input (`R`).
- Added nearby building damage with explicit integrity/support state, support-failure collapse, removal from the skyline, and visible rubble chunks; repeated impacts now prove the complete collapse transition in the browser journey.
- Added bounded combat damage, rival melee pressure, player vitality, cooldowns, hit feedback, explicit rival defeat/hide behavior, and live combat state output.
- Exposed rival and building state through `render_game_to_text`.

# Files changed

`index.html`, `src/main.ts`, `src/destruction.ts`, `src/combat.ts`, plus phase documentation and regression checks.

# Architecture changes

The 3D runtime now owns explicit structure integrity, support, collapse, and rubble state. The pure destruction transition is isolated in `src/destruction.ts`; it remains coupled to the existing history event path and local envelope only at the runtime boundary.

# Tests executed

- `npm run verify` — PASS (build, typecheck, 14 unit tests).
- `npm run test:browser` — PASS for the preserved Repair 1 journey, structure impact/full collapse-rubble journey, and rival defeat journey, with zero console errors.
- Browser combat journey — PASS: rival health 100 → 75 and player vitality 100 → 92.

# Browser evidence

The direct browser journey includes positive structure-impact, full collapse/rubble, bounded combat, and rival defeat scenarios, capturing `output/web-game/repair-2-collapse.png` and `output/web-game/repair-2-combat.png`; both screenshots were inspected after the passing run. The collapse observation reports the building hidden at zero height with eight visible rubble chunks; the combat observation reports rival health 75 and player vitality 92 before the final three strikes reduce health to zero and hide the rival.

# Visual evidence

The implementation uses visible rival geometry, building scale/visibility changes, terrain scars, and rubble geometry. The inspected collapse screenshot shows the missing skyline structure and rubble field; the inspected combat screenshot shows the rival and vitality HUD.

# Performance evidence if relevant

Not measured.

# Known limitations

Bridge/support propagation, debris lifecycle, and rigid-body physics remain incomplete.

# Completion status

IN PROGRESS
