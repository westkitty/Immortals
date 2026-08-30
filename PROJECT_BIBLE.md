# Project Bible

## Thesis

Every fight is followed by a century. Physical damage is not reset: it enters a causal historical simulation that changes the next battlefield.

## Current playable slice

`century1.html` is the current runtime. It provides a canvas-based city, player movement, immortal combat, structural damage, craters, century transition, local save/load, historical inspection, and a west/east divergence proof.

## Protected requirements

- Battle outcomes must remain available to later history.
- The same seed and same actions must produce stable simulation summaries.
- Objective history and public interpretation must remain distinct.
- Existing prototypes are preserved while the strongest runtime is advanced.
- No authored SVG artwork.

## Current non-goals

The repository does not yet claim a Three.js 3D renderer, IndexedDB persistence, Rapier physics, or a complete 100,000-year release build. Those claims require implementation and evidence in later phases.

## Phase discipline

Each completed phase has a report, an updated operational state, one coherent commit, and remote SHA verification.
