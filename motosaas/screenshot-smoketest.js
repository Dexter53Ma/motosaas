const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', err => errors.push(`PAGE ERROR: ${err.message}`));

  // Login
  console.log('Logging in...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 15000 });
  await page.fill('input[name="email"]', 'abdo.gonzaloo@gmail.com');
  await page.fill('input[name="password"]', 'Dexter2001z-');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 10000 });
  await page.waitForTimeout(1000);
  console.log('Login OK');

  const routes = [
    'dashboard',
    'vehicles', 'vehicles/new',
    'customers', 'customers/new',
    'rentals', 'rentals/new',
    'payments', 'payments/new',
    'bookings',
    'calendar',
    'checklists',
    'documents',
    'locations',
    'fuel',
    'reports',
    'analytics',
    'loans',
    'pos',
    'deposits',
    'insurance',
    'pricing',
    'refunds',
    'whatsapp',
    'reminders',
    'notifications',
    'loyalty',
    'feedback',
    'search',
    'import',
    'export',
    'audit-trail',
    'custom-fields',
    'ai',
    'settings',
    'help',
  ];

  let passed = 0;
  let failed = 0;

  for (const route of routes) {
    const url = `http://localhost:3000/dashboard/${route}`;
    try {
      const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
      const status = response?.status() || 0;
      if (status >= 400) {
        console.log(`FAIL [${status}] /dashboard/${route}`);
        failed++;
      } else {
        console.log(`OK [${status}] /dashboard/${route}`);
        passed++;
      }
    } catch (err) {
      console.log(`ERROR /dashboard/${route}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n=== RESULTS ===`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${routes.length}`);

  if (errors.length > 0) {
    console.log(`\nPage Errors (${errors.length}):`);
    errors.forEach(e => console.log(`  ${e}`));
  } else {
    console.log('\nNo page errors');
  }

  await browser.close();
})();
