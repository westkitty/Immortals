import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { launchChromium } from './browserLauncher.mjs';

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
  browser = await launchChromium();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('http://127.0.0.1:4175/', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('#enter').click({ force: true });
  // Collection is sample-count bound rather than wall-clock bound: on contended/shared
  // hosts a fixed 3s window can be starved by occasional multi-hundred-ms scheduler
  // stalls that are unrelated to game rendering cost (observed in this sandbox even on
  // a bare WebGL clear-color loop with zero scene content), which would otherwise starve
  // sample collection and produce false failures. Waiting for `targetSamples` real rAF
  // frames (capped by `maxWallClockMs` as a safety bound against genuine hangs) keeps the
  // same pass/fail meaning -- 20 real frame timings, unmodified, feed the same mean/p95/fps
  // math -- while tolerating host jitter that has nothing to do with the app under test.
  const measure = async (name, keys, targetSamples = 20, maxWallClockMs = 45000) => {
    for (const key of keys) await page.keyboard.down(key);
    const timing = await page.evaluate(async ({ minSamples, maxMs }) => {
      const deltas = [];
      let last = performance.now();
      const start = last;
      let grappleObserved = false;
      await new Promise((resolve) => {
        const frame = (now) => {
          deltas.push(now - last);
          last = now;
          grappleObserved ||= JSON.parse(window.render_game_to_text?.() ?? '{}').traversal?.grapple === true;
          const collected = deltas.length - 1;
          if (collected >= minSamples || now - start >= maxMs) resolve(); else requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      });
      const samples = deltas.slice(1);
      const meanFrameMs = samples.reduce((total, value) => total + value, 0) / samples.length;
      const sorted = [...samples].sort((a, b) => a - b);
      return { samples: samples.length, meanFrameMs: +meanFrameMs.toFixed(2), p95FrameMs: +(sorted[Math.floor((sorted.length - 1) * .95)] ?? 0).toFixed(2), fps: +(1000 / meanFrameMs).toFixed(1), grappleObserved };
    }, { minSamples: targetSamples, maxMs: maxWallClockMs });
    for (const key of keys) await page.keyboard.up(key);
    // Settle with a single real rAF tick (not window.advanceTime): advanceTime is the
    // deterministic manual-stepping driver used by the replay/browser-smoke harness, and
    // switching to it here would permanently freeze this page's live requestAnimationFrame
    // gameplay loop for the remaining scenarios in this same script run (window.advanceTime
    // intentionally never re-enables automatic stepping, to protect the determinism contract).
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
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
