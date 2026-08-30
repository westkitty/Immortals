# ADR 0002: Treat the Three.js Entry as the Active Experimental Runtime

## Problem

ADR 0001 selected `century1.html` while the repository had no package entry. The current `index.html` now loads `src/main.ts`, but several documents still describe the old canvas prototype as the active runtime or deny that Three.js is active.

## Evidence

- `index.html` imports `/src/main.ts`.
- `src/main.ts` creates `THREE.WebGLRenderer` and owns the live input, camera, rival, collision approximation, save envelope, and HUD updates.
- Repair 0 direct Playwright launched the active entry, clicked `#enter`, read explore-mode state, and captured a rendered WebGL screenshot without console errors.

## Decision

Treat the Three.js/Vite application as the active experimental runtime. Preserve `century1.html`, `EVERY_FIGHT.html`, and `every-fight-is-followed-by-a-century.html` as prototypes and sources of ideas, not production-state authority.

## Alternatives

1. Return the package entry to `century1.html`.
2. Merge the older canvas prototype into the current runtime immediately.
3. Keep the Three.js entry and explicitly repair it from the earliest incomplete phase.

## Impact

Repair work targets the Three.js runtime. It must earn Phase 1 and later claims through player-visible behavior and browser evidence; prototype features cannot satisfy active-runtime requirements by association.

## Validation

`npm run verify` passes on the reconciled repository. Direct local Playwright starts the active application and produces an explore-mode text state without console errors.

## Rollback

Restore the entry decision only through a new ADR and explicit package-entry change. The preserved prototypes remain available.
