# Phase

Phase 8 — Historical Scrubber, Map, and Era Interface

# Goal

Make the city’s causal memory inspectable across time rather than only as a latest-events list.

# Implemented

- Added an archive-year range scrubber to the causal inspector.
- Added filtered objective/public event history for the selected year.
- Added a compact west-to-east historical map strip with three landmark markers.
- Added runtime archive range synchronization as the campaign advances or reaches deep time.

# Tests executed

- `npm run verify` — PASS (build, typecheck, 7 tests).

# Known limitations

The map is a compact district landmark strip, not a navigable geographic editor. The mandated Playwright client still hangs during browser protocol startup on this host.

# Completion status

PARTIAL
