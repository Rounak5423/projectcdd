import { test, expect } from '@playwright/test';

test.describe('Causal Insights & Coupling UI Suite', () => {
  test('Navigate to Causal Insights, verify vital signs, flow graph, and policy what-if', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
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

    // 3. Dismiss Tutorial if open
    const tutorialClose = page.locator('button[aria-label="Close tutorial"]').first();
    if (await tutorialClose.isVisible({ timeout: 1500 }).catch(() => false)) {
      await tutorialClose.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await page.waitForTimeout(500);

    // 4. Click 'Causal Insights' in sidebar
    const causalNavBtn = page.locator('button:has-text("Causal Insights")').first();
    await expect(causalNavBtn).toBeVisible({ timeout: 5000 });
    await causalNavBtn.click();
    await page.waitForTimeout(1000);

    // 5. Verify Causal Insights Page header is visible
    await expect(page.locator('h1:has-text("CAUSAL SYSTEM INTELLIGENCE")')).toBeVisible();

    // 6. Verify Vital Signs Panel components
    await expect(page.locator('text=DEMOGRAPHIC PULSE').first()).toBeVisible();
    await expect(page.locator('text=POPULATION HEALTH').first()).toBeVisible();
    await expect(page.getByText('HOSPITAL CAPACITY', { exact: true })).toBeVisible();
    await expect(page.locator('text=CIVIL PROTEST').first()).toBeVisible();

    // 7. Switch to Cause & Effect Flow Graph tab
    const flowGraphTab = page.locator('button:has-text("CAUSE & EFFECT FLOW GRAPH")').first();
    await flowGraphTab.click();
    await page.waitForTimeout(600);
    await expect(page.locator('text=SYSTEM COUPLING PIPELINE')).toBeVisible();

    // 8. Switch to Policy Interventions tab
    const policyTab = page.locator('button:has-text("POLICY WHAT-IF INTERVENTIONS")').first();
    await policyTab.click();
    await page.waitForTimeout(600);
    await expect(page.locator('text=CAUSAL POLICY INTERVENTIONS')).toBeVisible();

    // 9. Enact Policy Directive
    const enactBtn = page.locator('button:has-text("Enact Causal Policy Directive")').first();
    await expect(enactBtn).toBeVisible();
    await enactBtn.click();
    await page.waitForTimeout(1500);
    await expect(page.locator('text=Successfully enacted:')).toBeVisible();
  });
});
