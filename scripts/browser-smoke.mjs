import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('..', import.meta.url));
const server = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4173'], { cwd: root, stdio: ['ignore', 'pipe', 'inherit'] });
let output = '';
server.stdout.on('data', (chunk) => { output += chunk; });
await new Promise((resolve, reject) => {
  const timer = setTimeout(resolve, 8000);
  server.stdout.on('data', (chunk) => { if (String(chunk).includes('Local:')) { clearTimeout(timer); resolve(); } });
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
  const debrisActive = JSON.parse(await page.evaluate(() => window.render_game_to_text?.() ?? '{}'));
  await page.evaluate(() => window.advanceTime(27500));
  const debrisExpired = JSON.parse(await page.evaluate(() => window.render_game_to_text?.() ?? '{}'));
  await page.evaluate(() => window.advanceTime(1500));
  const debrisRespawned = JSON.parse(await page.evaluate(() => window.render_game_to_text?.() ?? '{}'));
  if (sprintJump.mode !== 'explore' || sprintJump.player.y <= 2.2 || !debrisActive.traversal.debris.every((item) => item.active) || !debrisExpired.traversal.debris.some((item) => !item.active) || !debrisRespawned.traversal.debris.every((item) => item.active) || dash.traversal.dashCooldown <= 0 || !glide.traversal.gliding || !dive.traversal.diving || openAirWallRun.traversal.wallRun || errors.length) {
    throw new Error(`Traversal browser journey failed: ${JSON.stringify({ checks: { mode: sprintJump.mode, airborne: sprintJump.player.y > 2.2, active: debrisActive.traversal.debris.every((item) => item.active), expired: debrisExpired.traversal.debris.some((item) => !item.active), respawned: debrisRespawned.traversal.debris.every((item) => item.active), dash: dash.traversal.dashCooldown > 0, glide: glide.traversal.gliding, dive: dive.traversal.diving, openAirWallRun: !openAirWallRun.traversal.wallRun, errors: errors.length === 0 }, sprintJump, debrisActive, debrisExpired, debrisRespawned, dash, glide, dive, openAirWallRun, errors })}`);
  }
  await page.keyboard.press('Escape');
  await page.evaluate(() => window.advanceTime(500));
  const paused = JSON.parse(await page.evaluate(() => window.render_game_to_text?.() ?? '{}'));
  if (paused.mode !== 'paused' || errors.length) throw new Error(`Pause journey failed: ${JSON.stringify({ paused, errors })}`);
  await page.screenshot({ path: 'output/web-game/repair-1-journey.png' });
  await page.evaluate(() => localStorage.clear());
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
  for (let impact = 0; impact < 3; impact += 1) {
    await page.keyboard.down('r');
    await page.evaluate(() => window.advanceTime(80));
    await page.keyboard.up('r');
  }
  const collapse = JSON.parse(await page.evaluate(() => window.render_game_to_text?.() ?? '{}'));
  const collapsed = collapse.buildings.filter((building) => building.collapsed);
  const supportAffected = collapse.buildings.filter((building) => building.id !== 'building-1-1' && building.integrity < 100);
  if (!collapsed.length || !supportAffected.length || collapse.bridge.integrity >= 160 || collapse.rubbleCount <= 0 || errors.length) throw new Error(`Structure collapse journey failed: ${JSON.stringify({ collapsed, supportAffected, bridge: collapse.bridge, rubbleCount: collapse.rubbleCount, errors })}`);
  await page.screenshot({ path: 'output/web-game/repair-2-collapse.png' });
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('#enter').click({ force: true });
  const structurePersisted = JSON.parse(await page.evaluate(() => window.render_game_to_text?.() ?? '{}'));
  if (!structurePersisted.buildings.some((building) => building.collapsed && building.visible === false && building.integrity < 18) || structurePersisted.rubbleCount <= 0 || structurePersisted.development.adaptation <= 0 || structurePersisted.districtPolicies.find((district) => district.district === 'west').safety >= structurePersisted.districtPolicies.find((district) => district.district === 'east').safety || errors.length) throw new Error(`Structure persistence journey failed: ${JSON.stringify({ structurePersisted, errors })}`);
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('#enter').click({ force: true });
  await hold(['d'], 1100);
  await hold(['w'], 700);
  const combatBefore = JSON.parse(await page.evaluate(() => window.render_game_to_text?.() ?? '{}'));
  await hold(['f'], 100);
  const combatAfterAttack = JSON.parse(await page.evaluate(() => window.render_game_to_text?.() ?? '{}'));
  await hold(['s'], 300);
  const combatAfterHit = JSON.parse(await page.evaluate(() => window.render_game_to_text?.() ?? '{}'));
  if (combatAfterAttack.rival.health >= combatBefore.rival.health || combatAfterHit.playerCombat.health >= 100 || errors.length) throw new Error(`Combat journey failed: ${JSON.stringify({ combatBefore, combatAfterAttack, combatAfterHit, errors })}`);
  await hold(['w'], 100);
  for (let strike = 0; strike < 8 && combatAfterAttack.rival.health > 0; strike += 1) {
    await hold(['w', 'f'], 40);
    await hold([], 500);
  }
  const combatDefeat = JSON.parse(await page.evaluate(() => window.render_game_to_text?.() ?? '{}'));
  if (combatDefeat.rival.health !== 0 || combatDefeat.rival.visible !== false || !combatDefeat.history.some((event) => event.consequence.includes('battle is won')) || errors.length) throw new Error(`Combat defeat journey failed: ${JSON.stringify({ combatDefeat, errors })}`);
  await page.keyboard.down('c');
  await page.evaluate(() => window.advanceTime(80));
  await page.keyboard.up('c');
  const centuryReturn = JSON.parse(await page.evaluate(() => window.render_game_to_text?.() ?? '{}'));
  if (centuryReturn.year !== 100 || centuryReturn.rival.health !== 100 || centuryReturn.rival.visible !== true || centuryReturn.development.returnAwareness <= 0 || !centuryReturn.history.some((event) => event.type === 'return' && event.year === 100) || errors.length) throw new Error(`Century return journey failed: ${JSON.stringify({ centuryReturn, errors })}`);
  await page.keyboard.down('h');
  await page.evaluate(() => window.advanceTime(80));
  await page.keyboard.up('h');
  const historyOpen = JSON.parse(await page.evaluate(() => window.render_game_to_text?.() ?? '{}'));
  const historyPanelVisible = await page.locator('#history').isVisible();
  const historyPanelText = await page.locator('#history-list').innerText();
  await page.locator('#history-list .recover-evidence').first().click();
  await page.keyboard.down('a');
  await page.evaluate(() => window.advanceTime(80));
  await page.keyboard.up('a');
  const archaeology = JSON.parse(await page.evaluate(() => window.render_game_to_text?.() ?? '{}'));
  await page.keyboard.down('t');
  await page.evaluate(() => window.advanceTime(80));
  await page.keyboard.up('t');
  const deepTime = JSON.parse(await page.evaluate(() => window.render_game_to_text?.() ?? '{}'));
  if (!historyOpen.historyInspectorOpen || !historyPanelVisible || !historyPanelText.includes('PUBLIC ACCOUNT:') || archaeology.history.filter((event) => event.publicAccount.startsWith('Recovered evidence confirms')).length < 2 || deepTime.deepTime?.year !== 100000 || errors.length) throw new Error(`History/deep-time journey failed: ${JSON.stringify({ historyOpen, historyPanelVisible, historyPanelText, archaeology, deepTime, errors })}`);
  await page.screenshot({ path: 'output/web-game/repair-2-combat.png' });
  console.log(JSON.stringify({ mode: paused.mode, sprintJump: sprintJump.traversal, debrisLifecycle: { active: debrisActive.traversal.debris, expired: debrisExpired.traversal.debris, respawned: debrisRespawned.traversal.debris }, dash: dash.traversal, glide: glide.traversal, dive: dive.traversal, openAirWallRun: openAirWallRun.traversal, structureImpact: { damaged, collapsed, supportAffected, bridge: collapse.bridge, rubbleCount: collapse.rubbleCount, persisted: { collapsed: structurePersisted.buildings.filter((building) => building.collapsed).length, rubbleCount: structurePersisted.rubbleCount, adaptation: structurePersisted.development.adaptation, districtPolicies: structurePersisted.districtPolicies } }, combat: { before: combatBefore.player, rivalAfterAttack: combatAfterAttack.rival, playerAfterHit: combatAfterHit.playerCombat, defeat: { health: combatDefeat.rival.health, visible: combatDefeat.rival.visible }, centuryReturn: { year: centuryReturn.year, rivalHealth: centuryReturn.rival.health, visible: centuryReturn.rival.visible, returnAwareness: centuryReturn.development.returnAwareness, districtPolicies: centuryReturn.districtPolicies } }, history: { inspectorOpen: historyOpen.historyInspectorOpen, panelVisible: historyPanelVisible, recovered: archaeology.history.filter((event) => event.publicAccount.startsWith('Recovered evidence confirms')).length }, deepTime: { year: deepTime.deepTime?.year, hash: deepTime.deepTime?.hash }, errors }, null, 2));
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
