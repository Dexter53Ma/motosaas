const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push('PAGE ERROR: ' + err.message));

  // 1. Home page
  console.log('--- Home page ---');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 15000 });
  console.log('URL:', page.url());
  await page.screenshot({ path: 'C:/Users/Ultrapc/Desktop/Nouveau dossier/motosaas/test-home.png', fullPage: true });
  console.log('Screenshot saved: test-home.png');

  // 2. Login page
  console.log('\n--- Login page ---');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 15000 });
  console.log('URL:', page.url());
  await page.screenshot({ path: 'C:/Users/Ultrapc/Desktop/Nouveau dossier/motosaas/test-login.png', fullPage: true });
  console.log('Screenshot saved: test-login.png');

  // 3. Login
  console.log('\n--- Logging in ---');
  await page.fill('input[name="email"]', 'abdo.gonzaloo@gmail.com');
  await page.fill('input[name="password"]', 'Dexter2001z-');
  await page.click('button[type="submit"]');

  try {
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
  } catch(e) {
    console.log('Navigation timeout, URL:', page.url());
  }
  await page.waitForTimeout(2000);
  console.log('URL after login:', page.url());
  await page.screenshot({ path: 'C:/Users/Ultrapc/Desktop/Nouveau dossier/motosaas/test-dashboard.png', fullPage: true });
  console.log('Screenshot saved: test-dashboard.png');

  // 4. Check page content
  const bodyText = await page.textContent('body');
  console.log('\n--- Dashboard text (first 500 chars) ---');
  console.log(bodyText?.substring(0, 500));

  // 5. Errors
  if (errors.length > 0) {
    console.log('\n--- Errors ---');
    errors.forEach(e => console.log('ERROR:', e));
  } else {
    console.log('\n--- No errors ---');
  }

  await browser.close();
})();
