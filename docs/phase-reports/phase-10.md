# Phase

Phase 10 — Adversarial Validation and Release-Quality Proof

# Goal

Try to break the game’s central claim and record the earliest missing evidence honestly.

# Implemented

- Added deterministic west-versus-east comparisons at Years 100, 1,000, 10,000, and 100,000.
- Added repeated-destruction, evidence-quality, archaeology, relic-lineage, save/load-shape, and deep-time-stratigraphy checks.
- Added no-SVG and no-live-web-API release-surface checks.
- Kept browser journey status separate from repository/unit evidence.

# Tests executed

- `npm run verify` — PASS (build, typecheck, 10 tests).
- `npm run test:browser` — BLOCKED: the mandated Playwright client hangs during browser protocol startup on this host.

# Adversarial result

- West/east divergence: PASS.
- Same-crater repeated layers: PASS.
- Evidence quality and archaeology recovery: PASS.
- Material lineage: PASS.
- Save/load shape: PASS.
- Deep-time stratigraphy: PASS.
- No SVG and offline dependency boundary: PASS.
- Browser journey: UNPROVEN due to host tooling hang.
- Same crater with dense versus peripheral context: UNPROVEN; site context is not yet modeled.
- Protected landmark significance: UNPROVEN; protected landmarks are not yet modeled.
- Cultural extinction and later recovery: UNPROVEN; cultural knowledge is not yet modeled.

# Completion status

PARTIAL
