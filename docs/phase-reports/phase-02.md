# Phase

Phase 2 — Immortal Combat and Structural Destruction

# Goal

Prove that the 3D city is physically vulnerable to immortal combat.

# Implemented

- Added a persistent rival immortal with health, pursuit, strike response, and knockback.
- Added player strike input (`F`) and shockwave input (`R`).
- Added nearby building damage with explicit integrity/support state, support-failure collapse, removal from the skyline, and visible rubble chunks.
- Added bounded combat damage, rival melee pressure, player vitality, cooldowns, hit feedback, and live combat state output.
- Exposed rival and building state through `render_game_to_text`.

# Files changed

`index.html`, `src/main.ts`, `src/destruction.ts`, `src/combat.ts`, plus phase documentation and regression checks.

# Architecture changes

The 3D runtime now owns explicit structure integrity, support, collapse, and rubble state. The pure destruction transition is isolated in `src/destruction.ts`; it remains coupled to the existing history event path and local envelope only at the runtime boundary.

# Tests executed

- `npm run verify` — PASS (build, typecheck, 13 unit tests).
- `npm run test:browser` — PASS for the preserved Repair 1 journey with zero console errors.
- Browser combat journey — PASS: rival health 100 → 75 and player vitality 100 → 92.

# Browser evidence

The direct browser journey includes positive structure-impact and combat scenarios, capturing `output/web-game/repair-2-collapse.png` and `output/web-game/repair-2-combat.png`; both screenshots were inspected after the passing run.

# Visual evidence

The implementation uses visible rival geometry and building scale/visibility changes; fresh screenshot evidence is pending the browser blocker.

# Performance evidence if relevant

Not measured.

# Known limitations

Bridge/support propagation, debris lifecycle, full collapse lifecycle, combat defeat flow, and rigid-body physics remain incomplete.

# Completion status

IN PROGRESS
