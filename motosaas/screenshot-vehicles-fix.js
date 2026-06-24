const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 15000 });
  await page.fill('input[name="email"]', 'abdo.gonzaloo@gmail.com');
  await page.fill('input[name="password"]', 'Dexter2001z-');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 10000 });
  await page.waitForTimeout(1000);
  await page.goto('http://localhost:3000/dashboard/vehicles', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshot-vehicles-fixed.png', fullPage: true });
  console.log('Done');
  await browser.close();
})();
