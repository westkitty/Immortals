# Requirements Traceability

| ID | Requirement | Subsystem | Phase | Evidence | Status |
| --- | --- | --- | --- | --- | --- |
| REQ-CORE-001 | Destruction becomes historical input | `src/main.ts` → `src/history.ts` | 3 | Code inspection and helper tests: shocks record compact collapse events; no canonical `BattleOutcome` | PARTIAL |
| REQ-TIME-001 | Year 0 through Year 100,000 | `src/deepTime.ts` | 6 | Unit test proves deterministic projection only; no campaign world at Year 100,000 | PARTIAL |
| REQ-RETURN-001 | Approximate 100-year return cycle | `src/main.ts`, `src/history.ts` | 3 | Source/helper tests; no reconstructed-world browser journey | PARTIAL |
| REQ-MOVE-001 | Superhuman traversal | `src/main.ts` player loop | 1 | Browser startup and source inspection prove a limited slice; required mechanics are incomplete | PARTIAL |
| REQ-DEST-001 | Structural failure behavior | `src/main.ts` | 2 | Height/visibility damage exists; no support graph, debris, or destructible bridge | PARTIAL |
| REQ-HIST-001 | Objective and believed history differ | `src/history.ts`, inspector UI | 5 | Scalar evidence/public-account helper tests; no evidence-carrier model | PARTIAL |
| REQ-PERSIST-001 | Campaign survives save/load | `src/main.ts` localStorage envelope | 3 | Source inspection only; no IndexedDB, migration, or corruption path | PARTIAL |
| REQ-ARCH-001 | Civilization adapts architecture | `src/history.ts`, derived meshes | 4/7 | Scalar adaptation and visual policy exist; no spatial civilization model | PARTIAL |
| REQ-DIVERGE-001 | Different early actions create different futures | `src/history.ts` helper | 4/10 | Deterministic scalar safety divergence; no spatial-world counterfactual | PARTIAL |
| REQ-ASSET-001 | No SVG artwork | repository asset contract | 0 | Automated source scan | COMPLETE |
