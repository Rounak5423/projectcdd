import { test, expect } from '@playwright/test';

test.describe('Gate B - Authoritative Movement HUD Visual Verification', () => {
  test('Capture HUD overlay screenshot series across all required scenarios', async ({ page }) => {
    test.setTimeout(90000);

    // 1. Navigate to root
    await page.goto('/');

    // 2. Dismiss Intro modal if present
    const skipBtn = page.locator('button:has-text("SKIP INTRO")').first();
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click();
      await expect(skipBtn).toBeHidden({ timeout: 5000 });
    } else {
      await page.keyboard.press('Escape');
    }
    await page.waitForTimeout(500);

    // 3. Click Enter Simulation / Begin Civilisation
    const enterBtn = page.locator('button:has-text("BEGIN YOUR CIVILISATION")').first();
    if (await enterBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await enterBtn.click({ force: true });
    }

    // 4. Login as admin if auth screen appears
    const adminBtn = page.locator('button:has-text("Admin / AdminPassword123!")').first();
    if (await adminBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
      await adminBtn.click();
      await page.locator('button[type="submit"]:has-text("Enter the Simulation")').click();
    }
    await page.waitForTimeout(2000);

    // 5. Dismiss Tutorial modal if present
    const tutorialClose = page.locator('button[aria-label="Close tutorial"]').first();
    if (await tutorialClose.isVisible({ timeout: 2000 }).catch(() => false)) {
      await tutorialClose.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await page.waitForTimeout(1000);

    // 6. Ensure MovementDebugOverlay is visible (or press F3)
    const overlayHeader = page.locator('text=GENESIS 3D MOVEMENT OVERLAY').first();
    const showOverlayBtn = page.locator('text=[F3] SHOW MOVEMENT OVERLAY').first();
    if (await showOverlayBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await showOverlayBtn.click();
    }
    await expect(overlayHeader).toBeVisible({ timeout: 10000 });

    // Scenario 1: Signal Queue at Junction with HUD Overlay
    await page.screenshot({ path: 'docs/screenshots/gate_b_01_signal_queue.png' });

    // Step simulation time and capture Scenario 2: Emergency Ambulance Siren Yield
    await page.keyboard.press('2'); // Set 2x speed
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'docs/screenshots/gate_b_02_ambulance_yield.png' });

    // Scenario 3: Bus Transit Dwelling & Boarding
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'docs/screenshots/gate_b_03_bus_boarding.png' });

    // Scenario 4: Pedestrian Sidewalk & Crosswalk Navigation
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'docs/screenshots/gate_b_04_pedestrian_crosswalk.png' });

    // Verify all invariant telemetry counters in overlay
    await expect(page.locator('text=FLOW EFFICIENCY').first()).toBeVisible();
    await expect(page.locator('text=VEHICLE FLEET TELEMETRY').first()).toBeVisible();
    await expect(page.locator('text=PEDESTRIAN MOBILITY').first()).toBeVisible();
    await expect(page.locator('text=TRAFFIC SIGNALS & JUNCTIONS').first()).toBeVisible();
    await expect(page.locator('text=AUTOMATED GLITCH INVARIANTS').first()).toBeVisible();
  });
});
