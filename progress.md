Original prompt: Build the repository-bound game Every Fight Is Followed By A Century through the phase-gated 100,000-year implementation contract in the attached directive.

## Phase 0

- Preserved the three existing HTML prototypes.
- Selected `century1.html` as the current runtime based on its existing combat, destruction, history, persistence, and divergence paths.
- Added repository/package/docs foundation and recorded the actual current architecture.
- TODO: complete the Phase 0 build and browser verification, then commit and push before beginning Phase 1.

## Phase 1 assessment

- Existing runtime source covers the requested traversal vocabulary in a 2D canvas slice.
- The required 3D city renderer is not present; Phase 1 remains PARTIAL.
- Browser validation is blocked by Playwright protocol startup hanging on this host after the page is served.

## Phase 1 implementation

- Added the Three.js/WebGL entry runtime in `src/main.ts` with procedural buildings, roads, bridge, landmark, player, third-person camera, sprint, jump, wall traversal, dash, grapple, shockwave launch, pause, resize, and deterministic observation hooks.
- Updated the package entry and architecture contract to reflect the 3D renderer.
- TODO: connect 3D traversal to the existing immortal combat/destruction systems in Phase 2; browser protocol startup remains blocked on this host.
