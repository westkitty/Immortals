# Phase

Phase 5 — Memory, Myth, Evidence, Archaeology, and Lineage

# Goal

Make history epistemically imperfect while preserving objective causal state.

# Implemented

- Added public accounts and evidence strength to objective history events.
- Added evidence decay across century returns; weak accounts become disputed public memory while objective events remain.
- Added `A` archaeology recovery for the first weakened event.
- Updated the `H` inspector and text-state output to show objective and public accounts.

# Files changed

`src/history.ts`, `src/main.ts`, `index.html`, styles, tests, and phase documentation.

# Architecture changes

History now separates objective event records from public interpretation and supports confidence recovery through archaeological evidence.

# Tests executed

- `npm run verify` — PASS (build, typecheck, 5 tests).
- Browser journey — blocked by the known Playwright protocol startup hang on this host.

# Browser evidence

No fresh browser artifact; the mandated client remains blocked during protocol startup.

# Visual evidence

The causal inspector now renders objective and public accounts, but browser screenshot validation is pending.

# Performance evidence if relevant

Not measured.

# Known limitations

Archaeology currently recovers one weakened event and material relic/site lineage is not yet modeled.

# Completion status

PARTIAL
