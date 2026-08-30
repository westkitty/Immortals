# Phase

Phase 1 — Playable City and Superhuman Traversal

# Goal

Create a genuinely playable city traversal slice with superhuman movement and a stable browser journey.

# Implemented

- Added a real Three.js/WebGL procedural 3D city entry in `src/main.ts`.
- Added a player and third-person camera with sprint, long jump, momentum carry, explicit wall contact/surface classification, wall run, wall climb, rebound, directional air dash cooldown, line-of-sight grapple pull, glide, dive, hard-landing recovery, moving rideable debris, pause, resize, pointer lock, camera collision pull-in, and deterministic observation hooks.
- Preserved the existing `century1.html` combat/history runtime and other prototypes.

# Files changed

The package entry and architecture metadata now point to the new 3D traversal runtime. Existing prototypes remain unchanged.

# Architecture changes

The package renderer remains Three.js/WebGL with procedural geometry. Keyboard input now terminates at the logical action layer in `src/input.ts`; the runtime exposes traversal state rather than relying on screenshots. The controller remains kinematic. Combat/history scaffolding is preserved and Repair 2 is not started.

# Tests executed

- Source inspection of traversal and input paths — PASS.
- Phase 0 build/typecheck/unit checks remain passing.
- Three.js entry build and hook regression test — PASS.
- `npm run test:browser` — PASS: deterministic sprint-jump, dash, glide, dive, open-air wall-run negative control, pause freeze, screenshot, and zero console errors.

# Browser evidence

Direct local Playwright reached the rendered post-start city scene and completed the traversal journey. The inspected journey screenshot shows the city, player, updated state HUD, and pause overlay.

# Visual evidence

The inspected gameplay screenshot shows the player, buildings, bridge, roadway, civilians, and crater.

# Performance evidence if relevant

The browser observation reported device pixel ratio and draw-call count; a release FPS baseline is not claimed.

# Known limitations

Wall-to-roof mantle, full multi-wall course completion, and release-grade performance measurement remain bounded follow-up work.

# Completion status

COMPLETE FOR REPAIR 1 TRAVERSAL GATE
