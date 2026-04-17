// Generate public/og-image.jpg from scripts/og-image-template.html.
// Run with: npm run generate:og
//
// Uses Playwright (already a dev dep for E2E tests) to rasterize the static
// HTML template at 1200×630 — the standard Open Graph size.

import { chromium } from '@playwright/test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const templatePath = resolve(__dirname, 'og-image-template.html');
const outputPath = resolve(__dirname, '..', 'public', 'og-image.jpg');

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 2, // render at 2x for crisp text, then downscale via JPEG
  });
  const page = await context.newPage();

  const url = pathToFileURL(templatePath).href;
  await page.goto(url, { waitUntil: 'networkidle' });

  // Give web fonts a moment to settle before snapshotting
  await page.evaluate(() => document.fonts.ready);

  await page.screenshot({
    path: outputPath,
    type: 'jpeg',
    quality: 92,
    clip: { x: 0, y: 0, width: 1200, height: 630 },
  });

  await browser.close();
  console.log(`Wrote ${outputPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
