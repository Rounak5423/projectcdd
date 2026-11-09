import { test, expect } from '@playwright/test';

test.describe('Auth and RBAC Flows', () => {
  test('Standard Citizen (player1) cannot see or access Admin Console', async ({ page }) => {
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

    // Skip intro
    const skipBtn = page.locator('button:has-text("SKIP INTRO")').first();
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click();
      await expect(skipBtn).toBeHidden({ timeout: 5000 });
    } else {
      await page.keyboard.press('Escape');
    }
    await page.waitForTimeout(600);

    // Enter auth
    const heroBtn = page.locator('button:has-text("BEGIN YOUR CIVILISATION")').first();
    await heroBtn.click({ force: true });

    // Wait for Auth page
    const player1Btn = page.locator('button:has-text("Player1 / UserPassword123!")').first();
    await expect(player1Btn).toBeVisible({ timeout: 8000 });
    await player1Btn.click();
    await page.locator('button[type="submit"]:has-text("Enter the Simulation")').click();
    await page.waitForTimeout(1500);

    // Dismiss tutorial if open
    const tutorialClose = page.locator('button[aria-label="Close tutorial"]').first();
    if (await tutorialClose.isVisible({ timeout: 1500 }).catch(() => false)) {
      await tutorialClose.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await page.waitForTimeout(500);

    // Assert player1 is logged in
    await expect(page.locator('header').or(page.locator('nav'))).toBeVisible();

    // Assert Admin Console is NOT visible for player1
    const adminConsoleLink = page.locator('button:has-text("Admin Console")');
    await expect(adminConsoleLink).not.toBeVisible();

    expect(consoleErrors).toHaveLength(0);
    expect(networkErrors).toHaveLength(0);
  });

  test('Administrator (admin) has full RBAC visibility and can access Admin Console', async ({ page }) => {
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

    // Skip intro
    const skipBtn = page.locator('button:has-text("SKIP INTRO")').first();
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click();
      await expect(skipBtn).toBeHidden({ timeout: 5000 });
    } else {
      await page.keyboard.press('Escape');
    }
    await page.waitForTimeout(600);

    // Enter auth
    const heroBtn = page.locator('button:has-text("BEGIN YOUR CIVILISATION")').first();
    await heroBtn.click({ force: true });

    // Login as admin
    const adminBtn = page.locator('button:has-text("Admin / AdminPassword123!")').first();
    await expect(adminBtn).toBeVisible({ timeout: 8000 });
    await adminBtn.click();
    await page.locator('button[type="submit"]:has-text("Enter the Simulation")').click();
    await page.waitForTimeout(1500);

    // Dismiss tutorial if open
    const tutorialClose = page.locator('button[aria-label="Close tutorial"]').first();
    if (await tutorialClose.isVisible({ timeout: 1500 }).catch(() => false)) {
      await tutorialClose.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await page.waitForTimeout(500);

    // Assert Admin Console is visible for admin
    const adminConsoleLink = page.locator('button:has-text("Admin Console")');
    await expect(adminConsoleLink).toBeVisible();

    // Click Admin Console and assert panel renders
    await adminConsoleLink.click({ force: true });
    await page.waitForTimeout(500);
    await expect(page.locator('text=RBAC & System Telemetry').or(page.locator('text=Admin Console'))).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
    expect(networkErrors).toHaveLength(0);
  });
});
