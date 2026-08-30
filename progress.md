Original prompt: Build the repository-bound game Every Fight Is Followed By A Century through the phase-gated 100,000-year implementation contract in the attached directive.

## Repair 0 — truth reconciliation

- Verified `src/main.ts` is the active Three.js/WebGL runtime; the three standalone HTML files remain preserved prototypes.
- Reconciled authority documents, traceability, architecture metadata, and ADRs with inspected source and direct browser startup evidence.
- Replaced the failing custom browser-helper smoke route with ordinary local Playwright.
- Canonical Phase 1 is the earliest incomplete phase. Do not advance past it until the full traversal journey is browser- and visually proven.

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

## Phase 2 implementation

- Added a visible persistent 3D rival with strike damage and knockback.
- Added shockwave-based structure damage and collapse state; collapsed buildings leave the skyline.
- Added rival health and structure state to `render_game_to_text`.
- TODO: connect these 3D battle outcomes to the existing historical event model and save/century return flow.

## Phase 3 implementation

- Added a local save envelope for year, player position, rival health, and building collapse state.
- Added `C` century advance after defeating the rival; collapsed structures remain absent after return.
- Added load-on-enter and exposed year/history state through `render_game_to_text`.
- TODO: replace the minimal local envelope with the canonical battle/history event bridge and richer historical inspection.
- Added `src/history.ts` with typed `HistoryEvent` records and a 100-year return clock; 3D strike, collapse, and return actions now emit events into the saved history ledger.
- Added persistent terrain scar geometry on shockwave, scar save/load, scar text-state output, and an `H` causal inspector for recent events.
- Added deterministic development state to the event ledger: population, trade, sheltering, and adaptation rise/fall from inherited collapse history and century returns.
- Made development visible: returns reinforce surviving building materials and derive shelter structures from accumulated sheltering pressure; shockwave updates reapply the same policy.
- Added west/east safety pressure derived from impact location; return-time trade updates and material policy now diverge by district.
- Added west/east transit capacity, counterfactual divergence helper, and visible district transit routes derived from safety pressure.
- Added objective/public history separation, evidence-strength decay into disputed memory, `A` archaeology recovery, and inspector output for both accounts.
- Added material relic lineage: collapse events mint relics, returns can reuse buried material in foundations, and the full lineage is persisted and exposed in text state.
- Added `src/deepTime.ts`: deterministic non-rendering projection to Year 100,000 with population, technology, memory, stratigraphy, succession count, and replay hash; `T` exposes it in the 3D runtime.
- Added return-aware development metrics: recurrence awareness and protective corridor strength grow from repeated collapse/return cycles and persist in the campaign state.

## Phase 8 implementation

- Added a causal-history scrubber that filters the inspector ledger to a selected archive year.
- Added a compact historical map strip to anchor the three recurring impact landmarks visually.
- Added a focused regression check for the scrubber, year output, and map contract.
- TODO: complete the accessibility, presentation, and performance instrumentation pass; browser protocol startup remains blocked on this host.

## Phase 9 implementation

- Added live status announcements, labeled keyboard controls, labeled history controls, and visible keyboard focus states.
- Added reduced-motion CSS and a responsive mobile HUD/history layout.
- Added render pixel-ratio and draw-call fields to the deterministic text observation payload.
- TODO: perform final integrated acceptance in Phase 10; browser protocol startup remains blocked on this host.

## Phase 10 validation

- Added deterministic adversarial checks for west/east divergence at Year 100, 1,000, 10,000, and 100,000; repeated destruction; evidence quality and archaeology; relic lineage; save/load shape; deep-time strata; no-SVG; and offline runtime dependency boundaries.
- Phase 10 remains PARTIAL because the browser journey is blocked by the mandated client hang, and context-specific crater value, protected landmarks, and cultural extinction are not fully modeled.

## Repair 1 expanded traversal pass

- Replaced the compressed traversal loop with explicit traversal state: wall contact and surface eligibility, wall run, wall climb, rebound, glide, dive, hard-landing recovery, moving surfable debris, grapple targeting, and camera collision handling.
- Added pointer-lock yaw/pitch with clamp, speed-aware FOV, sensitivity and reduced-shake settings, momentum-preserving acceleration, long jump, directional dash cooldown, and deterministic input-edge consumption.
- Extended `scripts/browser-smoke.mjs` into a direct Playwright journey covering sprint-jump, dash, glide, dive, open-air wall-run negative control, pause freeze, screenshot, and console errors.
- Fixed two discovered defects during validation: vector speed clamping was incorrectly calling numeric `Vector3.set`, and glide/dive observations were sampled after key release. Added a logical action edge unit test.
- `npm run verify` passes; `npm run test:browser` passes; inspected `output/web-game/repair-1-journey.png`.
- Remaining bounded limitations: wall-to-roof mantle, complete multi-wall course, and release-grade FPS measurement are not claimed. Repair 2 has not started.

## Repair 2 — structural integrity increment

- Added `src/destruction.ts` with explicit structure integrity, support, collapse, and support-failure transitions.
- Integrated building structure state into the shockwave path and added four visible rubble chunks on collapse; exposed integrity, support, collapsed state, and rubble count through `render_game_to_text`.
- Added unit coverage for non-collapsing impact, support failure, and inert post-collapse behavior.
- `npm run verify` passes with 13 tests; `npm run test:browser` passes with zero console errors; the journey screenshot was inspected again.
- Added positive browser structure-impact coverage: the player navigates to a building, shockwave reduces integrity from 100 to 72, and `output/web-game/repair-2-collapse.png` was inspected. Repair 2 remains in progress; bridge/support propagation, full collapse lifecycle, and remaining combat behaviors are pending.
