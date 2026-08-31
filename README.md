# Every Fight Is Followed By A Century

An experimental browser game about immortal combat, persistent damage, and the histories that follow it.

## Current truthful state

The active application is a Three.js/WebGL prototype in `src/main.ts`. It provides a denser, instanced-rendered procedural city (traffic, pedestrians, and street-level detail via `InstancedMesh`), a controllable player, one rival, lightweight combat, building-height damage, terrain-scar markers, a local campaign save, a 100-year return, and a causal inspector. It is not yet the complete 100,000-year game described by the project thesis, and this pass does not itself constitute completion of Canonical Phase 2.

Input is unified across keyboard, mouse, touch, and gamepad (`src/input.ts`): the same logical actions drive movement, camera look, and every ability, with a touch movement joystick, look zone, and contextual action cluster for mobile, and standard-layout gamepad stick/button mapping. Settings — key bindings, quality tier, camera sensitivity, haptics, and accessibility flags (reduced camera shake, reduced hit-flash) — persist in a versioned, migrated `localStorage` envelope (`src/settings.ts`). A frame-budget governor (`src/quality.ts`) adapts rendering density (AUTO/LOW/MEDIUM/HIGH) to sustained frame time with hysteresis, while a manual quality-tier choice always overrides it. The HUD switches between FULL, MINIMAL, CONTEXT_ALERT, and hidden-exploration modes depending on recent player activity, and world-space labels (e.g. over the landmark) replace some earlier fixed-position prompts.

The city fabric (`src/city.ts`) tracks per-parcel land use and district identity, a landmark with a stable id that can be damaged and later rebuilt, and public-memory markers projected from real collapse events — the public account can diverge from the objective event ledger, but the objective `history.ts` event itself is never rewritten to make a public story true. Every public-memory marker (collapse, landmark damage, and archaeology-recovery corrective markers) also spawns a small plaque mesh in the world at the site, and a rebuilt parcel that reuses relic material gets a distinct lineage marker. Century advancement evolves land use, rebuilds/re-colors a damaged landmark, and runs a visible multi-second reconstruction (a rebuilt parcel grows from near-zero height and eases its color toward its new land use rather than snapping instantly). Buildings are spatially partitioned (`src/spatialGrid.ts`) for wall/grapple/shockwave queries, and `activeChunkCount` in the observation hook reports the real occupied-cell count. Traffic uses three distinct `InstancedMesh` vehicle types (sedan/van/bus) instead of one repeated box. Rubble and terrain-scar meshes are capped with oldest-first disposal so long sessions cannot leak GPU resources, without ever trimming the underlying objective history or save data.

The three standalone HTML prototypes are preserved as historical experiments. `century1.html` contains richer older canvas logic, but it is not integrated with the active runtime and is not production authority.

## Run

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173/`.

## Controls

- `WASD` / arrow keys: move
- `Shift`: sprint
- `Space`: jump; hold while airborne near a valid wall to wall-run or climb
- `Z`: rebound from a contacted wall
- `Q`: air dash
- `E`: grapple
- `F`: strike
- `R`: shockwave
- `C`: advance one century after defeating the rival
- `H`: causal inspector
- `A`: archaeology recovery of a weak event
- `K`: save
- `T`: experimental deep-time projection
- `Esc`: pause

All of the above are also available as rebindable logical actions (see the in-game settings gear icon), and are reachable via touch controls (movement joystick, look zone, and a contextual action cluster) or a standard-layout gamepad.

## Validation

```bash
npm run verify
npm run test:browser
npm run test:browser:phase1
```

`verify` runs the build, TypeScript check, and unit tests. `test:browser` uses direct local Playwright and proves the current traversal/destruction/combat/history journey. `test:browser:phase1` adds a four-scenario request-animation-frame baseline: ordinary traversal, sprint, reachable grapple, and multi-block travel.

See [the validation index](docs/validation/README.md) for the current evidence boundary.

## Architecture

- Rendering: Three.js/WebGL, with traffic, pedestrians, and street-level detail drawn via `InstancedMesh` rather than one mesh per object.
- Gameplay remains in `src/main.ts`, with browser/touch/gamepad input isolated behind logical held/pressed/released actions in `src/input.ts`; traversal contacts, grapple visibility, camera collision, and observation state are explicit runtime boundaries.
- Settings persistence: `src/settings.ts` (versioned, migrated, independent of the campaign save envelope).
- Adaptive quality governor: `src/quality.ts` (frame-budget AUTO/LOW/MEDIUM/HIGH with hysteresis; manual override always wins).
- City fabric (district identity, land use, landmark lifecycle, public memory): `src/city.ts`.
- Short-term campaign/history: `src/history.ts`
- Experimental deep-time benchmark: `src/deepTime.ts`
- Persistence: versioned/migrated localStorage campaign envelope (`SAVE_VERSION` in `src/main.ts`), separate from the settings envelope in `src/settings.ts`.

The scene graph is currently too authoritative and the history/civilization model is too small for the final thesis. The bounded canonical Phase 1 traversal gate is complete; Canonical Phase 2 (expanding structural combat and destruction beyond the current bounded browser-proven slice) is still next and is not claimed as complete by this pass. Later Phase 4–10 code is preserved as experimental scaffolding, not completion evidence.

## Repository

- Branch: `main`
- Remote: `git@github.com:westkitty/Immortals.git`
- Status: Repair 1 traversal implementation, browser gate, and reproducible headless baseline are complete locally; publication is complete only after the final commit and remote SHA verification.
