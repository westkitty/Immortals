# Phase

Phase 6 — Deep-Time Engine to Year 100,000

# Goal

Prove that the campaign can reach Year 100,000 without rendering 1,000 battles.

# Implemented

- Added a pure deterministic deep-time projection across 1,000 century steps.
- Tracks population, technology, memory, stratigraphic layers, and civilizational successions.
- Added stable replay hash and `T` runtime trigger.

# Tests executed

- `npm run verify` — PASS (build, typecheck, 15 tests).
- `npm run test:browser` — PASS: `T` exposes Year 100,000 and the deterministic replay hash with zero console errors.

# Known limitations

The projection is not yet coupled to every live campaign event, saved snapshots, or the mature 2D simulator, so this remains a capability proof rather than final campaign-scale integration. Browser proof covers the runtime trigger and exposed state, not a 1,000-step rendered replay.

# Completion status

PARTIAL
