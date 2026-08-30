# Operational State

CURRENT PHASE: Phase 2 partial.

REMOTE: `origin` configured as `git@github.com:westkitty/Immortals.git`; remote was empty at initialization probe.

CORE LOOP: The package entry launches a real Three.js/WebGL 3D city traversal and combat slice. The preserved canvas prototype still supports battle, damage, local history, century transition, changed world rendering, and return inspection. 3D combat damage is not yet connected to historical persistence.

CURRENT CAPABILITIES: `src/main.ts` adds a persistent 3D rival, strike/knockback, rival health, shockwave structure damage, collapse state, and rendered structural loss on top of traversal. Three original HTML prototypes remain preserved.

LAST VALIDATION: `npm run build`, `npm run typecheck`, and `npm test` pass. Playwright captured a post-start city screenshot before the host's browser protocol process began hanging; no console-error artifact was emitted.

NEXT PHASE: Continue Phase 2 by connecting 3D battle outcomes to scars, save state, and the first century return.

KNOWN LIMITATIONS: No TypeScript gameplay source yet; runtime remains a standalone 2D HTML prototype; mandated browser client hangs during protocol startup on this host, so text-state end-to-end evidence is pending.
