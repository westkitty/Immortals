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
- `Space`: jump; hold while airborne for the current wall-traversal prototype
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
```

`verify` runs the build, TypeScript check, and unit tests. `test:browser` now uses direct local Playwright, starts the game, performs a short movement input, captures a screenshot, and checks the exposed game state. It is a smoke test, not proof of the full player journey.

See [the validation index](docs/validation/README.md) for the current evidence boundary.

## Architecture

- Rendering: Three.js/WebGL
- Gameplay, input, camera, combat, and rendering: currently concentrated in `src/main.ts`
- Short-term campaign/history: `src/history.ts`
- Experimental deep-time benchmark: `src/deepTime.ts`
- Persistence: localStorage campaign envelope

The scene graph is currently too authoritative and the history/civilization model is too small for the final thesis. Repair work resumes at canonical Phase 1 after Repair 0; later Phase 4–10 code is preserved as experimental scaffolding, not completion evidence.

## Repository

- Branch: `main`
- Remote: `git@github.com:westkitty/Immortals.git`
- Status: Repair 0 reconciles the repository with verified implementation. The first incomplete canonical phase is Phase 1: superhuman traversal.
