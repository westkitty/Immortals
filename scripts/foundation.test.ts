import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { advanceHistory, archaeologyRecover, counterfactualDivergence, createHistory, recordDistrictDamage, recordEvent } from '../src/history';
import { simulateDeepTime } from '../src/deepTime';

const root = join(import.meta.dirname, '..');

describe('Phase 0 foundation', () => {
  it('keeps the selected runtime and authority files present', () => {
    expect(existsSync(join(root, 'century1.html'))).toBe(true);
    expect(existsSync(join(root, 'architecture.project.json'))).toBe(true);
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toContain('/src/main.ts');
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
});
