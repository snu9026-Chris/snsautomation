import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const notFound = [];
  page.on('response', (res) => {
    if (res.status() === 404) notFound.push(res.url());
  });

  await page.goto('http://localhost:3001/', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1000);

  if (notFound.length > 0) {
    console.log('404 resources:');
    notFound.forEach((u) => console.log('  ', u));
  } else {
    console.log('No 404s');
  }
  await browser.close();
})();
