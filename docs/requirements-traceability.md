# Requirements Traceability

| ID | Requirement | Subsystem | Phase | Evidence | Status |
| --- | --- | --- | --- | --- | --- |
| REQ-CORE-001 | Destruction becomes historical input | world/history engine in `century1.html` | 3 | Existing source path and UI claims; runtime verification pending | PARTIAL |
| REQ-TIME-001 | Year 0 through Year 100,000 | simulation proof control | 6 | Existing source contains deep-time proof path; not independently run | PARTIAL |
| REQ-RETURN-001 | Approximate 100-year return cycle | century transition | 3 | Existing UI exposes century advance | PARTIAL |
| REQ-MOVE-001 | Superhuman traversal | player controller | 1 | Existing 2D movement only | PARTIAL |
| REQ-DEST-001 | Structural failure behavior | combat/destruction | 2 | Existing collapse/crater code paths | PARTIAL |
| REQ-HIST-001 | Objective and believed history differ | history engine/UI | 5 | Existing myths and historical panels | PARTIAL |
| REQ-PERSIST-001 | Campaign survives save/load | local save | 3 | Existing localStorage path | PARTIAL |
| REQ-ARCH-001 | Civilization adapts architecture | city simulation | 4/7 | Existing adaptation fields; causal depth pending | PARTIAL |
| REQ-DIVERGE-001 | Different early actions create different futures | divergence proof | 4/10 | Existing west/east validation path | PARTIAL |
| REQ-ASSET-001 | No SVG artwork | asset contract | 0 | No SVG files found in initial workspace | COMPLETE |
