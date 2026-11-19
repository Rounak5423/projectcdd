import { test, expect } from '@playwright/test';

test.describe('Causal Insights & Coupling UI Suite', () => {
  test('Navigate to Causal Insights, verify vital signs, flow graph, and policy what-if', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/');

    // 1. Visit root app
    await page.goto('/');
    await page.waitForTimeout(1500);

    // 2. Login if auth modal is visible
    const quickFillBtn = page.locator('button:has-text("Admin / AdminPassword123!"), button:has-text("Player1 / UserPassword123!")').first();
    if (await quickFillBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await quickFillBtn.click();
      await page.waitForTimeout(400);
      const enterBtn = page.locator('button:has-text("Enter the Simulation")').first();
      if (await enterBtn.isVisible()) {
        await enterBtn.click();
        await page.waitForTimeout(2000);
      }
    }

    // 3. Dismiss Tutorial if open
    const tutorialClose = page.locator('button[aria-label="Close tutorial"]').first();
    if (await tutorialClose.isVisible({ timeout: 1500 }).catch(() => false)) {
      await tutorialClose.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await page.waitForTimeout(500);

    // 4. Click 'Causal Insights' in sidebar
    const causalNavBtn = page.locator('aside button:has-text("Causal Insights")').first();
    await expect(causalNavBtn).toBeVisible({ timeout: 5000 });
    await causalNavBtn.scrollIntoViewIfNeeded();
    await causalNavBtn.click({ force: true });
    await page.waitForTimeout(2000);

    // 5. Verify Causal Insights Page header is visible
    const causalHeading = page.locator('h1:has-text("CAUSAL SYSTEM INTELLIGENCE")').first();
    await expect(causalHeading).toBeVisible({ timeout: 10000 });

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
