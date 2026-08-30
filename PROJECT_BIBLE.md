# Project Bible

## Thesis

Every fight is followed by a century. Physical damage is not reset: it enters a causal historical simulation that changes the next battlefield.

## Current playable slice

The package entry `src/main.ts` is the active Three.js/WebGL runtime. It provides a compact procedural city, third-person chase camera, sprint, long jump, wall run/climb/mantle/rebound, dash, reachable line-of-sight grapple, glide, dive, moving debris, combat, structural failure, a versioned localStorage campaign save, a short event ledger, and deterministic observation hooks. The browser journey and measured headless baseline complete the bounded canonical Phase 1 traversal gate; the broader campaign remains incomplete.

`century1.html`, `EVERY_FIGHT.html`, and `every-fight-is-followed-by-a-century.html` are preserved prototypes. They contain useful canvas-era experiments but are not integrated with the active runtime and cannot supply active-runtime completion evidence.

## Protected requirements

- Battle outcomes must remain available to later history.
- The same seed and same actions must produce stable simulation summaries.
- Objective history and public interpretation must remain distinct.
- Existing prototypes are preserved while the strongest runtime is advanced.
- No authored SVG artwork.

## Current non-goals

The repository does not claim general-purpose rigid-body physics, IndexedDB persistence, spatial civilization simulation, carrier-based memory, campaign-integrated Year 100,000 world reconstruction, or a complete release build. The standalone deep-time projection is experimental only.

## Phase discipline

Canonical Phase 0 is reconciled by Repair 0 and Canonical Phase 1 is complete for its bounded traversal gate. Canonical Phase 2 is the earliest incomplete phase; later systems remain experimental scaffolding until their actual completion contracts have browser and visual evidence.
