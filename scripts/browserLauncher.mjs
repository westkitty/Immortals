// Shared headless Chromium launcher for the browser-driven scripts.
//
// Playwright normally downloads its own bundled Chromium build on `npm install`.
// Some sandboxed/offline environments cannot reach the Playwright CDN but can still
// reach the npm registry, so `@sparticuz/chromium` (a portable headless-shell build)
// is used as a fallback executable when Playwright's own browser is not installed.
// This keeps `npm run test:browser` / `npm run test:performance` runnable without
// requiring network access to download a second, redundant browser binary.
import { chromium } from 'playwright';

async function tryDefaultChromium() {
  try {
    const browser = await chromium.launch({ headless: true });
    return browser;
  } catch {
    return null;
  }
}

async function tryFallbackChromium() {
  try {
    process.env.AWS_EXECUTION_ENV ??= 'AWS_Lambda_nodejs20.x';
    const { default: chromiumBinary } = await import('@sparticuz/chromium');
    const executablePath = await chromiumBinary.executablePath();
    // `--single-process` (recommended for Lambda) breaks page.screenshot() compositing
    // under Playwright's CDP driver in this environment, so it is dropped here.
    const args = chromiumBinary.args.filter((flag) => flag !== '--single-process');
    return await chromium.launch({ executablePath, headless: true, args });
  } catch (error) {
    throw new Error(`No usable Chromium executable found (Playwright bundle missing and fallback failed): ${error.message}`);
  }
}

export async function launchChromium() {
  return (await tryDefaultChromium()) ?? (await tryFallbackChromium());
}
