import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const client = process.env.WEB_GAME_CLIENT ?? `${process.env.HOME}/.codex/skills/develop-web-game/scripts/web_game_playwright_client.js`;
const server = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4173'], { cwd: root, stdio: ['ignore', 'pipe', 'inherit'] });
let output = '';
server.stdout.on('data', (chunk) => { output += chunk; });
await new Promise((resolve, reject) => {
  const timer = setTimeout(resolve, 8000);
  server.stdout.on('data', (chunk) => { if (String(chunk).includes('4173')) { clearTimeout(timer); resolve(); } });
  server.once('error', reject);
});
console.log(output.trim());
const actions = JSON.stringify({ steps: [
  { buttons: ['right'], frames: 10 },
  { buttons: ['space'], frames: 4 },
  { buttons: [], frames: 12 },
] });
const result = spawn(process.execPath, [client, '--url', 'http://127.0.0.1:4173', '--click-selector', '#enter', '--actions-json', actions, '--iterations', '2', '--pause-ms', '250'], { cwd: root, stdio: 'inherit' });
const exitCode = await new Promise((resolve) => result.once('exit', (code) => resolve(code ?? 1)));
server.kill('SIGTERM');
if (exitCode !== 0) process.exit(exitCode);
