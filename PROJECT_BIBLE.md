# Project Bible

## Thesis

Every fight is followed by a century. Physical damage is not reset: it enters a causal historical simulation that changes the next battlefield.

## Current playable slice

The package entry `src/main.ts` is the active experimental Three.js/WebGL runtime. It provides a compact procedural city, simple third-person chase camera, sprint, jump, approximate airborne wall traversal, dash, grapple, shockwave, rival health, height-based building damage, localStorage campaign save, short event ledger, and deterministic observation hooks. It does not yet meet the canonical Phase 1 traversal contract.

`century1.html`, `EVERY_FIGHT.html`, and `every-fight-is-followed-by-a-century.html` are preserved prototypes. They contain useful canvas-era experiments but are not integrated with the active runtime and cannot supply active-runtime completion evidence.

## Protected requirements

- Battle outcomes must remain available to later history.
- The same seed and same actions must produce stable simulation summaries.
- Objective history and public interpretation must remain distinct.
- Existing prototypes are preserved while the strongest runtime is advanced.
- No authored SVG artwork.

## Current non-goals

The repository does not claim rigid-body physics, IndexedDB persistence, a canonical `BattleOutcome`, spatial civilization simulation, carrier-based memory, campaign-integrated Year 100,000 world reconstruction, or a complete release build. The standalone deep-time projection is experimental only.

## Phase discipline

Canonical Phase 0 is reconciled by Repair 0. Canonical Phase 1 is the earliest incomplete phase. Later Phase 4–10 code remains experimental scaffolding until its actual completion contracts have browser and visual evidence.
