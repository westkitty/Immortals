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
  const hold = async (keys, ms) => {
    for (const key of keys) await page.keyboard.down(key);
    await page.evaluate((duration) => window.advanceTime(duration), ms);
    const active = JSON.parse(await page.evaluate(() => window.render_game_to_text?.() ?? '{}'));
    for (const key of keys) await page.keyboard.up(key);
    await page.evaluate(() => window.advanceTime(50));
    return active;
  };
  const sprintJump = await hold(['w', 'Shift', 'Space'], 220);
  const dash = await hold(['q'], 80);
  const glide = await hold(['g'], 100);
  await hold(['Space'], 300);
  const dive = await hold(['Space', 'v'], 100);
  const openAirWallRun = await hold(['w', 'Space'], 180);
  if (sprintJump.mode !== 'explore' || sprintJump.player.y <= 2.2 || dash.traversal.dashCooldown <= 0 || !glide.traversal.gliding || !dive.traversal.diving || openAirWallRun.traversal.wallRun || errors.length) {
    throw new Error(`Traversal browser journey failed: ${JSON.stringify({ sprintJump, dash, glide, dive, openAirWallRun, errors })}`);
  }
  await page.keyboard.press('Escape');
  await page.evaluate(() => window.advanceTime(500));
  const paused = JSON.parse(await page.evaluate(() => window.render_game_to_text?.() ?? '{}'));
  if (paused.mode !== 'paused' || errors.length) throw new Error(`Pause journey failed: ${JSON.stringify({ paused, errors })}`);
  await page.screenshot({ path: 'output/web-game/repair-1-journey.png' });
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('#enter').click({ force: true });
  await hold(['a'], 1600);
  await hold(['w'], 1500);
  await page.keyboard.down('r');
  await page.evaluate(() => window.advanceTime(50));
  const structureImpact = JSON.parse(await page.evaluate(() => window.render_game_to_text?.() ?? '{}'));
  await page.keyboard.up('r');
  const damaged = structureImpact.buildings.filter((building) => building.integrity < 100 || building.collapsed);
  if (!damaged.length || structureImpact.rubbleCount < 0 || errors.length) throw new Error(`Structure impact journey failed: ${JSON.stringify({ damaged, rubbleCount: structureImpact.rubbleCount, errors })}`);
  await page.screenshot({ path: 'output/web-game/repair-2-collapse.png' });
  console.log(JSON.stringify({ mode: paused.mode, sprintJump: sprintJump.traversal, dash: dash.traversal, glide: glide.traversal, dive: dive.traversal, openAirWallRun: openAirWallRun.traversal, structureImpact: { damaged, rubbleCount: structureImpact.rubbleCount }, errors }, null, 2));
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
