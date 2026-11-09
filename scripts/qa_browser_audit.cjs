const { chromium } = require('playwright');
const fs = require('fs');

async function runAudit() {
  console.log('=== STARTING PLAYWRIGHT NODE BROWSER AUDIT ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleLogs = [];
  const networkErrors = [];
  const apiFailures = [];

  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
    });
  });

  page.on('requestfailed', (req) => {
    networkErrors.push({
      url: req.url(),
      method: req.method(),
      failure: req.failure() ? req.failure().errorText : 'unknown',
    });
  });

  page.on('response', (res) => {
    if (res.status() >= 400) {
      apiFailures.push({
        url: res.url(),
        status: res.status(),
        statusText: res.statusText(),
      });
    }
  });

  console.log('1. Navigating to http://127.0.0.1:5173/...');
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Check login form
  const loginInput = await page.$("input[placeholder*='sername'], input[type='text']");
  const passInput = await page.$("input[type='password']");
  const loginBtn = await page.$("button:has-text('Enter Civilisation'), button:has-text('Sign In'), button:has-text('Login')");

  if (loginInput && passInput && loginBtn) {
    console.log('Logging in as admin...');
    await loginInput.fill('admin');
    await passInput.fill('AdminPassword123!');
    await loginBtn.click();
    await page.waitForTimeout(3000);
  }

  // Click on each sidebar tab
  const tabs = [
    'Causal Insights',
    'Council Chamber',
    'Policy Laboratory',
    'Technology',
    'Economy',
    'Population',
    'Infrastructure',
    'Missions',
    'Admin Console',
  ];

  const results = [];
  for (const tab of tabs) {
    console.log(`Clicking tab: ${tab}`);
    const tabEl = await page.$(`text="${tab}"`);
    if (tabEl) {
      try {
        await tabEl.click();
        await page.waitForTimeout(1500);
        results.push({ tab, status: 'clicked' });
      } catch (err) {
        results.push({ tab, status: 'click_error', error: err.message });
      }
    } else {
      results.push({ tab, status: 'not_found' });
    }
  }

  // Check What-If button inside Causal Insights if present
  console.log('Testing Causal Insights What-If button...');
  const whatIfTab = await page.locator("button:has-text('Policy What-If')").first();
  if (await whatIfTab.count() > 0) {
    await whatIfTab.click();
    await page.waitForTimeout(1000);
    const execBtn = await page.locator("button:has-text('Enact Selected Policy'), button:has-text('Enact')").first();
    if (await execBtn.count() > 0) {
      console.log('Executing What-If shortcut...');
      await execBtn.click();
      await page.waitForTimeout(2000);
    }
  }

  await browser.close();

  const auditOutput = {
    consoleLogs,
    consoleErrors: consoleLogs.filter((c) => c.type === 'error' || c.type === 'warning'),
    networkErrors,
    apiFailures,
    tabResults: results,
  };

  fs.writeFileSync('/tmp/browser_audit_results.json', JSON.stringify(auditOutput, null, 2));

  console.log('\n--- AUDIT COMPLETED ---');
  console.log(`Console messages: ${consoleLogs.length} (${auditOutput.consoleErrors.length} errors/warnings)`);
  console.log(`Failed network requests: ${networkErrors.length}`);
  console.log(`HTTP >= 400 responses: ${apiFailures.length}`);
  if (apiFailures.length > 0) {
    console.log('API failures:', apiFailures);
  }
  if (auditOutput.consoleErrors.length > 0) {
    console.log('First 5 Console errors/warnings:');
    auditOutput.consoleErrors.slice(0, 5).forEach((e) => console.log(`  [${e.type}] ${e.text}`));
  }
}

runAudit().catch((err) => {
  console.error('Audit crashed:', err);
  process.exit(1);
});
