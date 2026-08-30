import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(import.meta.dirname, '..');

describe('Phase 0 foundation', () => {
  it('keeps the selected runtime and authority files present', () => {
    expect(existsSync(join(root, 'century1.html'))).toBe(true);
    expect(existsSync(join(root, 'architecture.project.json'))).toBe(true);
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toContain('century1.html');
  });

  it('contains no authored SVG assets', () => {
    const files = readdirSync(root, { recursive: true }).map(String)
      .filter((file) => !file.startsWith('node_modules/') && !file.startsWith('.git/'));
    expect(files.filter((file) => file.toLowerCase().endsWith('.svg'))).toEqual([]);
  });
});
