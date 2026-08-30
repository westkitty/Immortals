# Phase Report Reconciliation

## Why this exists

The historical Phase 0–10 reports are preserved as records of what was attempted. Their `PARTIAL` status is accurate. Their phase numbers, commit messages, and source additions do not demonstrate that the corresponding canonical completion contracts passed.

## Verified current state

The active runtime is the Vite/Three.js entry at `src/main.ts`, not the preserved canvas prototype. It supplies a real but limited 3D traversal/combat slice, localStorage persistence, compact history helpers, and an experimental deep-time projection. It lacks several required player-visible mechanics and all later systems required for a complete causal 100,000-year campaign.

## Canonical phase matrix

| Phase | Required behavior | Exists | Tested | Browser proven | Visual proven | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | Repository foundation and truthful authority | Yes | Build/typecheck/unit docs checks | Startup only | Startup scene | COMPLETE after Repair 0 |
| 1 | Full superhuman traversal | Yes | Action tests, complete journey, performance baseline | Two-tower mantle, dash, reachable grapple, glide/dive, pause and negative control | Mantle screenshot | COMPLETE FOR BOUNDED GATE |
| 2 | Structural combat, bridge failure, debris | Partial | Source/unit assertions | Collapse, rubble, bridge support, and combat journey | Collapse screenshot | PARTIAL |
| 3 | `BattleOutcome`, versioned persistence, reconstructed return | Partial | BattleOutcome helper and save migration coverage | Outcome reload and first-century journey | Year-100 inspector screenshot | PARTIAL |
| 4 | Spatial civilization model | No | No | No | No | NOT IMPLEMENTED |
| 5 | Carrier-based memory and archaeology | No | Scalar helper checks only | No | No | NOT IMPLEMENTED |
| 6 | Campaign-integrated Year 100,000 world | No | Projection determinism only | No | No | NOT IMPLEMENTED |
| 7 | State-dependent civilization adaptation | No | Scalar helper checks only | No | No | NOT IMPLEMENTED |
| 8 | Geographic history UX and era realization | Partial | DOM contract only | No | No | PARTIAL |
| 9 | Game-quality polish and measured performance | Partial | Accessibility marker checks | No | One startup scene | PARTIAL |
| 10 | Full adversarial release proof | No | Partial helper checks only | No | No | NOT IMPLEMENTED |

## Earliest incomplete phase

Canonical Phase 2 is the earliest incomplete phase after Repair 1. Later code remains preserved as experimental scaffolding and must not be promoted by filename, commit order, or unrelated tests.
