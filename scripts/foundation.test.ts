import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { advanceHistory, archaeologyRecover, counterfactualDivergence, createHistory, recordDistrictDamage, recordEvent } from '../src/history';
import { simulateDeepTime } from '../src/deepTime';
import { Action, createInputState } from '../src/input';
import { applyStructureImpact, applySupportLoad, createStructureState } from '../src/destruction';
import { applyDamage } from '../src/combat';

const root = join(import.meta.dirname, '..');

describe('Phase 0 foundation', () => {
  it('keeps the selected runtime and authority files present', () => {
    expect(existsSync(join(root, 'century1.html'))).toBe(true);
    expect(existsSync(join(root, 'architecture.project.json'))).toBe(true);
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toContain('/src/main.ts');
  });

  it('keeps Repair 0 authority documents aligned with the active runtime', () => {
    expect(existsSync(join(root, 'README.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/validation/README.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/adr/0002-threejs-runtime-transition.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/phase-reports/RECONCILIATION.md'))).toBe(true);
    const architecture = JSON.parse(readFileSync(join(root, 'architecture.project.json'), 'utf8'));
    expect(architecture.runtime.entry).toBe('src/main.ts');
    expect(architecture.runtime.renderer).toBe('Three.js WebGL');
    expect(readFileSync(join(root, 'docs/requirements-traceability.md'), 'utf8')).not.toContain('world/history engine in `century1.html`');
  });

  it('contains no authored SVG assets', () => {
    const files = readdirSync(root, { recursive: true }).map(String)
      .filter((file) => !file.startsWith('node_modules/') && !file.startsWith('.git/'));
    expect(files.filter((file) => file.toLowerCase().endsWith('.svg'))).toEqual([]);
  });

  it('exposes the Phase 1 3D runtime observation hooks', () => {
    const source = readFileSync(join(root, 'src/main.ts'), 'utf8');
    expect(source).toContain("new THREE.WebGLRenderer");
    expect(source).toContain('window.render_game_to_text');
    expect(source).toContain('window.advanceTime');
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toContain('id="enter"');
  });

  it('keeps logical action edges separate from held state', () => {
    const input = createInputState();
    input.keyDown('q');
    expect(input.down.has(Action.Dash)).toBe(true);
    expect(input.pressed.has(Action.Dash)).toBe(true);
    input.consumeFrame();
    expect(input.down.has(Action.Dash)).toBe(true);
    expect(input.pressed.has(Action.Dash)).toBe(false);
    input.keyUp('q');
    expect(input.released.has(Action.Dash)).toBe(true);
    expect(input.down.has(Action.Dash)).toBe(false);
  });

  it('models impact damage and support failure as stateful structure behavior', () => {
    const structure = createStructureState('tower-1', 100);
    const first = applyStructureImpact(structure, 28);
    expect(first.damage).toBe(28);
    expect(first.collapsed).toBe(false);
    const collapse = applyStructureImpact(structure, 90);
    expect(collapse.collapsed).toBe(true);
    expect(structure.support).toBeLessThan(0.12);
    expect(applyStructureImpact(structure, 100).damage).toBe(0);
  });

  it('propagates bounded support load without instantly destroying neighbors', () => {
    const neighbor = createStructureState('neighbor-1', 100);
    const load = applySupportLoad(neighbor, 18);
    expect(load.damage).toBe(9);
    expect(neighbor.integrity).toBe(91);
    expect(neighbor.support).toBeCloseTo(0.82);
    expect(load.collapsed).toBe(false);
  });

  it('applies bounded combat damage and reports defeat', () => {
    const rival = { health: 50, maxHealth: 100 };
    expect(applyDamage(rival, 25)).toMatchObject({ accepted: true, remaining: 25, defeated: false });
    expect(applyDamage(rival, 50)).toMatchObject({ accepted: true, damage: 25, remaining: 0, defeated: true });
    expect(applyDamage(rival, 10).accepted).toBe(false);
  });

  it('records causal events and advances the return clock', () => {
    const history = createHistory();
    recordEvent(history, { year: 0, type: 'collapse', siteId: 'bridge-west', consequence: 'Bridge becomes inherited ruin.', publicAccount: 'The bridge failed in a storm.', evidenceStrength: .7 });
    advanceHistory(history);
    expect(history.year).toBe(100);
    expect(history.events.map((event) => event.type)).toEqual(['collapse', 'return']);
    expect(history.development.adaptation).toBeGreaterThan(0);
    expect(history.development.sheltering).toBeGreaterThan(0);
    expect(history.development.returnAwareness).toBeGreaterThan(0);
    expect(history.development.corridorStrength).toBeGreaterThan(0);
    recordDistrictDamage(history, -20);
    expect(history.development.westSafety).toBeLessThan(history.development.eastSafety);
    expect(history.development.eastTransit).toBeGreaterThan(history.development.westTransit);
    const event = history.events[0];
    while (history.year < 500) advanceHistory(history);
    expect(event.publicAccount).toContain('disputed');
    archaeologyRecover(history, event.id);
    expect(event.evidenceStrength).toBe(1);
  });

  it('produces different infrastructure futures for west versus east damage', () => {
    expect(counterfactualDivergence().differs).toBe(true);
  });

  it('reaches Year 100,000 deterministically without rendering each battle', () => {
    const first = simulateDeepTime(1701);
    expect(first.year).toBe(100000);
    expect(first.successions).toBe(10);
    expect(simulateDeepTime(1701).hash).toBe(first.hash);
    expect(simulateDeepTime(1702).hash).not.toBe(first.hash);
  });

  it('exposes the Phase 8 historical scrubber and map interface', () => {
    const html = readFileSync(join(root, 'index.html'), 'utf8');
    expect(html).toContain('id="timeline"');
    expect(html).toContain('id="timeline-year"');
    expect(html).toContain('id="history-map"');
    expect(readFileSync(join(root, 'src/main.ts'), 'utf8')).toContain('historyViewYear');
  });

  it('exposes Phase 9 accessibility and performance boundaries', () => {
    const html = readFileSync(join(root, 'index.html'), 'utf8');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('aria-label="Keyboard controls"');
    const source = readFileSync(join(root, 'src/main.ts'), 'utf8');
    expect(source).toContain('renderer.getPixelRatio()');
    expect(source).toContain('drawCalls');
    expect(readFileSync(join(root, 'src/style.css'), 'utf8')).toContain('prefers-reduced-motion');
  });

  it('passes the deterministic adversarial history checks that are implemented', () => {
    const checkpoints = [100, 1000, 10000, 100000];
    const west = createHistory();
    const east = createHistory();
    recordDistrictDamage(west, -1);
    recordDistrictDamage(east, 1);
    recordEvent(west, { year: 0, type: 'collapse', siteId: 'west', consequence: 'Western district damaged.', publicAccount: 'A storm damaged the west.', evidenceStrength: .6 });
    recordEvent(east, { year: 0, type: 'collapse', siteId: 'east', consequence: 'Eastern district damaged.', publicAccount: 'A storm damaged the east.', evidenceStrength: .6 });
    for (const checkpoint of checkpoints) {
      while (west.year < checkpoint) advanceHistory(west);
      while (east.year < checkpoint) advanceHistory(east);
      expect(west.development.westSafety).not.toBe(east.development.westSafety);
    }

    const repeated = createHistory();
    for (let index = 0; index < 4; index += 1) recordEvent(repeated, { year: repeated.year, type: 'collapse', siteId: 'same-crater', consequence: `Layer ${index}`, publicAccount: 'The account is incomplete.', evidenceStrength: .4 });
    while (repeated.year < 1000) advanceHistory(repeated);
    expect(repeated.events.filter((event) => event.siteId === 'same-crater')).toHaveLength(4);
    expect(repeated.development.returnAwareness).toBeGreaterThan(0);
    expect(repeated.relics.every((relic) => relic.lineage.length >= 2)).toBe(true);

    const strong = createHistory();
    const strongEvent = recordEvent(strong, { year: 0, type: 'collapse', siteId: 'strong', consequence: 'A well-recorded loss.', publicAccount: 'The archive agrees.', evidenceStrength: 1 });
    const weakEvent = recordEvent(strong, { year: 0, type: 'collapse', siteId: 'weak', consequence: 'A poorly recorded loss.', publicAccount: 'Only a rumor remains.', evidenceStrength: .2 });
    while (strong.year < 500) advanceHistory(strong);
    expect(strongEvent.evidenceStrength).toBeGreaterThan(weakEvent.evidenceStrength);
    archaeologyRecover(strong, weakEvent.id);
    expect(weakEvent.evidenceStrength).toBe(1);
    expect(strong.relics.some((relic) => relic.originEventId === strongEvent.id && relic.lineage.length >= 2)).toBe(true);

    const replay = JSON.parse(JSON.stringify(strong)) as typeof strong;
    expect(replay.year).toBe(strong.year);
    expect(replay.events).toHaveLength(strong.events.length);
    expect(simulateDeepTime(1701).strata).toBeGreaterThan(0);
  });

  it('keeps the release surface SVG-free and independent of live web APIs', () => {
    const html = readFileSync(join(root, 'index.html'), 'utf8');
    const runtime = readFileSync(join(root, 'src/main.ts'), 'utf8');
    expect(html).not.toMatch(/https?:\/\//);
    expect(runtime).not.toMatch(/fetch\(|XMLHttpRequest|https?:\/\//);
    const files = readdirSync(root, { recursive: true }).map(String)
      .filter((file) => !file.startsWith('node_modules/') && !file.startsWith('.git/'));
    expect(files.filter((file) => file.toLowerCase().endsWith('.svg'))).toEqual([]);
  });
});
