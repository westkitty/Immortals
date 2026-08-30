# Phase

Phase 3 — Battle Events, Save System, and First Century

# Goal

Connect the 3D battle slice to persistent state and prove that a return does not restore the original city.

# Implemented

- Added local save/load for player position, rival state, year, and building collapse state.
- Added a 100-year `C` transition after the rival is defeated.
- Preserved collapsed structures across the return and exposed state through the deterministic text hook.
- Added typed `HistoryEvent` records for strikes, collapses, and returns; saved history is restored with the campaign.
- Added persistent terrain scar geometry and an `H` causal inspector that renders recent event records.

# Files changed

`src/main.ts`, `index.html`, and phase documentation.

# Architecture changes

The 3D runtime now owns a typed causal event ledger, persistent terrain scars, and persistent return envelope. The mature `century1.html` event/history engine remains separate until the shared inspector bridge is implemented.

# Tests executed

- `npm run verify` — PASS (build, typecheck, 3 unit tests).
- Browser journey — BLOCKED by Playwright protocol startup hang on this host.

# Browser evidence

No new browser artifact; the mandated client remains blocked during protocol startup.

# Visual evidence

The implementation retains the same 3D geography and removes collapsed buildings from the rendered skyline on return; fresh screenshot evidence is pending browser validation.

# Performance evidence if relevant

Not measured.

# Known limitations

No canonical `BattleOutcome` bridge or IndexedDB persistence yet; the 3D inspector is currently limited to recent local events.

# Completion status

PARTIAL
