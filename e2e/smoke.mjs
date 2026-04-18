import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'fs';

const PAGES = [
  { name: 'dashboard', path: '/' },
  { name: 'trend', path: '/trend' },
  { name: 'publish', path: '/publish' },
  { name: 'calendar', path: '/calendar' },
  { name: 'history', path: '/history' },
  { name: 'accounts', path: '/accounts' },
];

const OUT = './e2e/screenshots';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const errors = [];
  page.on('pageerror', (err) => errors.push({ page: page.url(), error: err.message }));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push({ page: page.url(), console: msg.text() });
  });

  for (const { name, path } of PAGES) {
    try {
      await page.goto(`http://localhost:3001${path}`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
      console.log(`OK  ${name} (${path})`);
    } catch (e) {
      console.log(`ERR ${name} (${path}): ${e.message}`);
    }
  }

  if (errors.length > 0) {
    console.log('\n--- ERRORS ---');
    errors.forEach((e) => console.log(JSON.stringify(e)));
  } else {
    console.log('\nNo JS errors detected.');
  }

  await browser.close();
})();
