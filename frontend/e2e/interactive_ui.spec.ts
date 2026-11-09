import { test, expect } from '@playwright/test';

test.describe('GENESIS Engine Full Interactive UI Suite', () => {
  test('Traverse UI, test hotkeys, modals, technology tree, and verify zero errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('response', res => {
      if (res.status() >= 400 && !res.url().includes('favicon')) {
        networkErrors.push(`${res.request().method()} ${res.url()} -> ${res.status()}`);
      }
    });

    await page.goto('/');

    // 1. Dismiss Intro & Navigate to Auth
    const skipBtn = page.locator('button:has-text("SKIP INTRO")').first();
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click();
      await expect(skipBtn).toBeHidden({ timeout: 5000 });
    } else {
      await page.keyboard.press('Escape');
    }
    await page.waitForTimeout(600);

    const heroBtn = page.locator('button:has-text("BEGIN YOUR CIVILISATION")').first();
    await heroBtn.click({ force: true });

    // 2. Login as admin
    const adminBtn = page.locator('button:has-text("Admin / AdminPassword123!")').first();
    await expect(adminBtn).toBeVisible({ timeout: 8000 });
    await adminBtn.click();
    await page.locator('button[type="submit"]:has-text("Enter the Simulation")').click();
    await page.waitForTimeout(1500);

    // 3. Dismiss Tutorial
    const tutorialClose = page.locator('button[aria-label="Close tutorial"]').first();
    if (await tutorialClose.isVisible({ timeout: 1500 }).catch(() => false)) {
      await tutorialClose.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await page.waitForTimeout(500);

    // 4. Hotkeys test: Space (Play/Pause), 2 (Speed), B (Bulldozer), Z (Zoning)
    await page.keyboard.press('Space');
    await page.waitForTimeout(200);
    await page.keyboard.press('2');
    await page.waitForTimeout(200);
    await page.keyboard.press('b');
    await page.waitForTimeout(200);
    await page.keyboard.press('b');
    await page.waitForTimeout(200);
    await page.keyboard.press('z');
    await page.waitForTimeout(200);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // 5. Bottom Controls: Play/Pause and Step Day
    const playPauseBtn = page.locator('button[title*="Space" i]').first();
    if (await playPauseBtn.isVisible()) {
      await playPauseBtn.click({ force: true });
      await page.waitForTimeout(200);
    }
    const stepDayBtn = page.locator('button[title*="Advance 1 day" i]').first();
    if (await stepDayBtn.isVisible()) {
      await stepDayBtn.click({ force: true });
      await page.waitForTimeout(300);
    }

    // 6. Topbar Modals: Chirper, Presenter, Protest
    const chirperBtn = page.locator('button[title*="Chirper" i]').first();
    if (await chirperBtn.isVisible()) {
      await chirperBtn.click();
      await page.waitForTimeout(400);
      await expect(page.locator('text=CHIRPER LIVE FEED')).toBeVisible();
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }

    const presenterBtn = page.locator('button:has-text("Presenter")').first();
    if (await presenterBtn.isVisible()) {
      await presenterBtn.click();
      await page.waitForTimeout(400);
      await expect(page.locator('text=PRESENTER SUITE')).toBeVisible();
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }

    const protestBtn = page.locator('button:has-text("RESOLVE")').first();
    if (await protestBtn.isVisible()) {
      await protestBtn.click();
      await page.waitForTimeout(400);
      await expect(page.locator('text=THE GENESIS CHRONICLE')).toBeVisible();
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }

    // 7. Navigation Pages Traversal
    const pages = [
      'Overview',
      'Council of Advisors',
      'Technology Tree',
      'Policy Laboratory',
      'Future Simulator',
      'Research Wallet',
      'Settings',
      'Admin Console',
    ];

    for (const p of pages) {
      const navItem = page.locator(`button:has-text("${p}")`).first();
      await expect(navItem).toBeVisible();
      await navItem.click({ force: true });
      await page.waitForTimeout(600);

      if (p === 'Technology Tree') {
        const eurekaBtn = page.locator('button:has-text("BOOST!")').first();
        if (await eurekaBtn.isVisible().catch(() => false)) {
          await eurekaBtn.click({ force: true });
          await page.waitForTimeout(400);
        }
      } else if (p === 'Council of Advisors') {
        const advisorBtn = page.locator('button:has-text("Aurelius")').or(page.locator('button:has-text("The High Chancellor")')).first();
        if (await advisorBtn.isVisible().catch(() => false)) {
          await advisorBtn.click({ force: true });
          await page.waitForTimeout(300);
        }
      }

      // Close overlay to return to World Explorer
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }

    // 8. Mobile Viewport Resizing
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    await expect(page.locator('header').first()).toBeVisible();

    // Verify zero failures
    expect(consoleErrors).toHaveLength(0);
    expect(networkErrors).toHaveLength(0);
  });
});
