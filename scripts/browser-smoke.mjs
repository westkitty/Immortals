import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('..', import.meta.url));
const server = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4173'], { cwd: root, stdio: ['ignore', 'pipe', 'inherit'] });
let output = '';
server.stdout.on('data', (chunk) => { output += chunk; });
await new Promise((resolve, reject) => {
  const timer = setTimeout(resolve, 8000);
  server.stdout.on('data', (chunk) => { if (String(chunk).includes('4173')) { clearTimeout(timer); resolve(); } });
  server.once('error', reject);
});
console.log(output.trim());
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
  await page.locator('#enter').click({ force: true });
  await page.keyboard.down('w');
  await page.waitForTimeout(250);
  await page.keyboard.up('w');
  await page.waitForTimeout(100);
  const state = JSON.parse(await page.evaluate(() => window.render_game_to_text?.() ?? '{}'));
  if (state.mode !== 'explore' || !state.player || errors.length) throw new Error(`Browser smoke failed: ${JSON.stringify({ state, errors })}`);
  await page.screenshot({ path: 'output/web-game/browser-smoke.png' });
  console.log(JSON.stringify({ mode: state.mode, player: state.player, errors }, null, 2));
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
