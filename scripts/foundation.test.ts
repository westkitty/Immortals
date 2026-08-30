import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { advanceHistory, createHistory, recordDistrictDamage, recordEvent } from '../src/history';

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
    recordEvent(history, { year: 0, type: 'collapse', siteId: 'bridge-west', consequence: 'Bridge becomes inherited ruin.' });
    advanceHistory(history);
    expect(history.year).toBe(100);
    expect(history.events.map((event) => event.type)).toEqual(['collapse', 'return']);
    expect(history.development.adaptation).toBeGreaterThan(0);
    expect(history.development.sheltering).toBeGreaterThan(0);
    recordDistrictDamage(history, -20);
    expect(history.development.westSafety).toBeLessThan(history.development.eastSafety);
  });
});
