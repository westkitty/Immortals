# Phase

Phase 5 — Memory, Myth, Evidence, Archaeology, and Lineage

# Goal

Make history epistemically imperfect while preserving objective causal state.

# Implemented

- Added public accounts and evidence strength to objective history events.
- Added evidence decay across century returns; weak accounts become disputed public memory while objective events remain.
- Added `A` archaeology recovery for the first weakened event.
- Updated the `H` inspector and text-state output to show objective and public accounts.
- Added material relic records with origin event IDs, current use, and reuse lineage across returns.

# Files changed

`src/history.ts`, `src/main.ts`, `index.html`, styles, tests, and phase documentation.

# Architecture changes

History now separates objective event records from public interpretation and supports confidence recovery through archaeological evidence.

# Tests executed

- `npm run verify` — PASS (build, typecheck, 15 tests).
- `npm run test:browser` — PASS: history toggle, archaeology recovery, persistence, traversal, destruction, combat, and zero console errors.

# Browser evidence

The direct Playwright journey opens the ledger with `H`, recovers the first weakened objective event with `A`, and reports the recovered public account while preserving the objective event. The same run proves the previously recorded collapse and return paths after reload and defeat.

# Visual evidence

`output/web-game/repair-2-collapse.png` was inspected and shows the player among four visible rubble chunks after collapse. `output/web-game/repair-2-combat.png` was inspected after the history/deep-time actions and shows the Year 100 state with `DEEP TIME // YEAR 100,000 REACHED` in the HUD.

# Performance evidence if relevant

Not measured.

# Known limitations

Archaeology currently recovers the first weakened event; site selection and multiple independent evidence carriers are not yet modeled. The visible H inspector is browser-covered with objective consequence, public account, evidence percentage, and archive controls.

# Completion status

PARTIAL
