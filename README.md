# Every Fight Is Followed By A Century

An experimental browser game about immortal combat, persistent damage, and the histories that follow it.

## Current truthful state

The active application is a Three.js/WebGL prototype in `src/main.ts`. It provides a compact procedural city, a controllable player, one rival, lightweight combat, building-height damage, terrain-scar markers, a local campaign save, a 100-year return, and a causal inspector. It is not yet the complete 100,000-year game described by the project thesis.

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

## Validation

```bash
npm run verify
npm run test:browser
npm run test:browser:phase1
```

`verify` runs the build, TypeScript check, and unit tests. `test:browser` uses direct local Playwright and proves the current traversal/destruction/combat/history journey. `test:browser:phase1` adds a four-scenario request-animation-frame baseline: ordinary traversal, sprint, reachable grapple, and multi-block travel.

See [the validation index](docs/validation/README.md) for the current evidence boundary.

## Architecture

- Rendering: Three.js/WebGL
- Gameplay remains in `src/main.ts`, with browser input isolated behind logical held/pressed/released actions in `src/input.ts`; traversal contacts, grapple visibility, camera collision, and observation state are explicit runtime boundaries.
- Short-term campaign/history: `src/history.ts`
- Experimental deep-time benchmark: `src/deepTime.ts`
- Persistence: localStorage campaign envelope

The scene graph is currently too authoritative and the history/civilization model is too small for the final thesis. The bounded canonical Phase 1 traversal gate is complete; Canonical Phase 2 is next. Later Phase 4–10 code is preserved as experimental scaffolding, not completion evidence.

## Repository

- Branch: `main`
- Remote: `git@github.com:westkitty/Immortals.git`
- Status: Repair 1 traversal implementation, browser gate, and reproducible headless baseline are complete locally; publication is complete only after the final commit and remote SHA verification.
