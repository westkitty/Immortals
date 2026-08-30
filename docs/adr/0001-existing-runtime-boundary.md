# ADR 0001: Preserve the Existing Canvas Runtime at Phase 0

## Problem

The local directory contained three substantial standalone HTML prototypes and no package or Git metadata. Replacing them would risk discarding unpublished work.

## Evidence

`century1.html` contains the most complete current loop: canvas rendering, combat, destruction, local save/load, century transitions, historical UI, and divergence tooling.

## Options

1. Replace all prototypes with a clean Three.js scaffold.
2. Preserve all prototypes and establish `century1.html` as the current entry runtime.

## Decision

Preserve all three prototypes and route the package entry to `century1.html`. Record the actual renderer and persistence choices as Canvas 2D and localStorage until later implementation proves a change.

## Rejected alternatives

Immediate replacement would violate the local preservation gate and provide no evidence that the existing loop should be discarded.

## Impact

Phase 0 is truthful and reversible. Later phases can extract systems incrementally or replace the renderer with evidence.

## Validation

The source scan identified the runtime systems and no existing Git history or remote refs were present locally.

## Rollback

Remove the Phase 0 wrapper/configuration files; the three original HTML files remain intact.
