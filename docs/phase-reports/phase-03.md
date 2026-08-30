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
- Added a versioned `BattleOutcome` sealed on rival defeat with the victory year, player vitality, collapsed structures, scar count, and causal event identifiers.
- Migrated the local save envelope to version 2 and proved the sealed outcome survives a browser reload before the `C` century return.
- Legacy versionless saves are rewritten as version 2; malformed and future-version envelopes are discarded rather than partially applied.

# Files changed

`src/battleOutcome.ts`, `src/main.ts`, browser coverage, and phase documentation.

# Architecture changes

The 3D runtime now owns a typed causal event ledger, persistent terrain scars, a versioned battle-outcome contract, and a versioned persistent return envelope. The mature `century1.html` event/history engine remains separate until the shared inspector bridge is implemented.

# Tests executed

- `npm run verify` — PASS (build, typecheck, 16 unit tests).
- `npm run test:browser` — PASS for legacy-save migration, corrupt-save recovery, collapse persistence, sealed battle-outcome persistence across reload, and the first-century return, with zero console errors.

# Browser evidence

The browser journey upgrades a versionless envelope, rejects a malformed envelope, defeats the rival, confirms the sealed immortal `BattleOutcome`, reloads to confirm save version 2 and the retained outcome, then reaches year 100. The final screenshot shows `YEAR 100` and the causal inspector.

# Visual evidence

The inspected screenshot shows the active 3D city after the first return with the year and remembered-city status visible. The collapse screenshot shows the persisted skyline gap and rubble restored after reload.

# Performance evidence if relevant

Not measured.

# Known limitations

The browser-proven save boundary is a versioned localStorage envelope, not IndexedDB. The 3D inspector is currently limited to recent local events; full outcome reconstruction and IndexedDB migration remain outside this increment.

# Completion status

COMPLETE for the bounded localStorage/first-century runtime slice
