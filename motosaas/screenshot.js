const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const errors = [];
  page.on('pageerror', err => errors.push('PAGE ERROR: ' + err.message));

  // Landing page
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshot-landing.png', fullPage: true });
  console.log('Landing screenshot saved');

  // Login page
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshot-login.png', fullPage: true });
  console.log('Login screenshot saved');

  // Signup page
  await page.goto('http://localhost:3000/signup', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshot-signup.png', fullPage: true });
  console.log('Signup screenshot saved');

  // Login
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 15000 });
  await page.fill('input[name="email"]', 'abdo.gonzaloo@gmail.com');
  await page.fill('input[name="password"]', 'Dexter2001z-');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 10000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshot-dashboard.png', fullPage: true });
  console.log('Dashboard screenshot saved');

  // Vehicles page
  await page.goto('http://localhost:3000/dashboard/vehicles', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshot-vehicles.png', fullPage: true });
  console.log('Vehicles screenshot saved');

  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(e => console.log(e));
  } else {
    console.log('\nNo errors');
  }

  await browser.close();
})();
