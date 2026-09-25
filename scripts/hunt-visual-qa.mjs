import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const manifestPath = process.env.HUNT_VISUAL_MANIFEST || 'visual-qa-manifest.json';
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
const outDir = process.env.HUNT_VISUAL_OUT || 'artifacts/hunt-visual-qa';
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 1200 }, deviceScaleFactor: 1 });

const report = {
  generated_at: new Date().toISOString(),
  production_effect: false,
  source: 'CJ exact variant images',
  items: []
};

for (const item of manifest.items) {
  const safe = item.item_id.replace(/[^a-zA-Z0-9_-]/g, '_');
  const screenshot = path.join(outDir, `${safe}.png`);
  const row = {
    item_id: item.item_id,
    title: item.title,
    variant_id: item.variant_id,
    variant_key: item.variant_key,
    image_url: item.image_url,
    http_status: null,
    natural_width: null,
    natural_height: null,
    screenshot,
    capture_status: 'UNKNOWN',
    error: null
  };

  try {
    const response = await page.goto(item.image_url, { waitUntil: 'load', timeout: 30000 });
    row.http_status = response?.status() ?? null;
    await page.waitForTimeout(700);
    const meta = await page.evaluate(() => {
      const img = document.querySelector('img');
      return img ? {
        src: img.currentSrc || img.src,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        complete: img.complete
      } : null;
    });
    row.natural_width = meta?.naturalWidth ?? null;
    row.natural_height = meta?.naturalHeight ?? null;
    await page.screenshot({ path: screenshot, fullPage: true });
    row.capture_status = row.http_status && row.http_status >= 200 && row.http_status < 400 && meta?.complete ? 'CAPTURED' : 'REVIEW';
  } catch (error) {
    row.capture_status = 'FAILED';
    row.error = error instanceof Error ? error.message : String(error);
  }

  report.items.push(row);
}

await browser.close();
await fs.writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
