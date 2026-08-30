# Validation Index

## Automated

`npm run verify` builds the Vite application, runs TypeScript validation, and runs focused Vitest checks for source contracts, deterministic history helpers, deep-time projection determinism, accessibility markers, no-SVG, and the current offline dependency boundary.

These checks do not prove the player-visible traversal, combat, destruction, persistence, or 100,000-year campaign contract.

## Browser-tested

`npm run test:browser` uses ordinary local Playwright. It launches Chromium, opens the active Vite application, force-clicks the entry control, performs a short movement burst, reads `window.render_game_to_text`, checks for console errors, and captures `output/web-game/browser-smoke.png`.

The Repair 0 manual Playwright probe was run at 1280×800 and captured `output/web-game/repair-0-playwright.png`. The scene showed the active 3D player, rival, procedural streets/buildings, and HUD. It is evidence of startup only, not the required Phase 1 or later browser journeys.

## Visually inspected

The Repair 0 browser screenshot was inspected after capture. It confirms that the current runtime is a minimal, readable 3D slice. It does not show wall contact traversal, structural failure, a century reconstruction, or historical world differences.

## Unverified or incomplete

- Full Phase 1 traversal journey, including real wall contact, climb, glide, dive, rebound, and debris surfing.
- Structural support failure, bridge failure, interactive debris, environmental enemy damage, and rubble lifecycle.
- Canonical `BattleOutcome`, IndexedDB persistence/migration/corruption handling, and world reconstruction.
- Spatial civilization, carrier-based memory, campaign-integrated deep time, adaptive policy consequences, and geographic historical UX.
- Release-grade performance measurements and the full adversarial A–Q gate.
