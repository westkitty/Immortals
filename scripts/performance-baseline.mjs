import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('..', import.meta.url));
const server = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4175'], { cwd: root, stdio: ['ignore', 'pipe', 'inherit'] });
let output = '';
server.stdout.on('data', (chunk) => { output += chunk; });
await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error(`Vite readiness timed out: ${output}`)), 8000);
  server.stdout.on('data', (chunk) => { if (String(chunk).includes('Local:')) { clearTimeout(timer); resolve(); } });
  server.once('error', reject);
});

let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('http://127.0.0.1:4175/', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('#enter').click({ force: true });
  const measure = async (name, keys, duration = 3000) => {
    for (const key of keys) await page.keyboard.down(key);
    const timing = await page.evaluate(async (milliseconds) => {
      const deltas = [];
      let last = performance.now();
      const start = last;
      let grappleObserved = false;
      await new Promise((resolve) => {
        const frame = (now) => {
          deltas.push(now - last);
          last = now;
          grappleObserved ||= JSON.parse(window.render_game_to_text?.() ?? '{}').traversal?.grapple === true;
          if (now - start >= milliseconds) resolve(); else requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      });
      const samples = deltas.slice(1);
      const meanFrameMs = samples.reduce((total, value) => total + value, 0) / samples.length;
      const sorted = [...samples].sort((a, b) => a - b);
      return { samples: samples.length, meanFrameMs: +meanFrameMs.toFixed(2), p95FrameMs: +(sorted[Math.floor((sorted.length - 1) * .95)] ?? 0).toFixed(2), fps: +(1000 / meanFrameMs).toFixed(1), grappleObserved };
    }, duration);
    for (const key of keys) await page.keyboard.up(key);
    await page.evaluate(() => window.advanceTime(50));
    const state = JSON.parse(await page.evaluate(() => window.render_game_to_text?.() ?? '{}'));
    if (timing.samples < 20 || state.performance.drawCalls <= 0 || (name === 'grapple' && !timing.grappleObserved)) throw new Error(`Invalid ${name} measurement: ${JSON.stringify({ timing, state, errors })}`);
    return { name, ...timing, drawCalls: state.performance.drawCalls, pixelRatio: state.performance.pixelRatio, player: state.player, traversal: state.traversal };
  };
  const ordinaryCityTraversal = await measure('ordinary-city-traversal', ['w']);
  const highSpeedSprint = await measure('high-speed-sprint', ['w', 'Shift']);
  const grapple = await measure('grapple', ['e']);
  const multiBlockTraversal = await measure('multi-block-traversal', ['d', 'w', 'Shift']);
  if (errors.length) throw new Error(`Performance baseline console errors: ${errors.join('\n')}`);
  console.log(JSON.stringify({ browser: 'Chromium headless', viewport: '1280x800', deviceScaleFactor: 1, scenarios: [ordinaryCityTraversal, highSpeedSprint, grapple, multiBlockTraversal], errors }, null, 2));
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
