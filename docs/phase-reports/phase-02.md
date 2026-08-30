# Phase

Phase 2 — Immortal Combat and Structural Destruction

# Goal

Prove that the 3D city is physically vulnerable to immortal combat.

# Implemented

- Added a persistent rival immortal with health, pursuit, strike response, and knockback.
- Added player strike input (`F`) and shockwave input (`R`).
- Added nearby building damage, visible height loss, and collapse/removal from the skyline.
- Exposed rival and building state through `render_game_to_text`.

# Files changed

`index.html` and `src/main.ts`, plus phase documentation and regression checks.

# Architecture changes

The 3D runtime now owns a minimal combat/destruction state. It is intentionally not yet coupled to the mature 2D historical engine or persistence envelope.

# Tests executed

- `npm run verify` — PASS (build, typecheck, 3 unit tests).
- Browser journey — BLOCKED by the known Playwright protocol startup hang on this host.

# Browser evidence

No new browser artifact; source/build verification passed, but the mandated client did not complete.

# Visual evidence

The implementation uses visible rival geometry and building scale/visibility changes; fresh screenshot evidence is pending the browser blocker.

# Performance evidence if relevant

Not measured.

# Known limitations

3D combat outcomes do not yet create persistent historical events, terrain scars, rubble, or century transitions. Rigid-body physics is not activated.

# Completion status

PARTIAL
