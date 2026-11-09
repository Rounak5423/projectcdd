import { test, expect } from '@playwright/test';

test.describe('GENESIS Unified World Architecture & Command Integration', () => {

  test('Backend state API and live action log are synchronized', async ({ request }) => {
    // 1. Fetch state from authoritative backend endpoint
    const stateRes = await request.get('/api/v1/worlds/aurora-prime/state');
    expect(stateRes.status()).toBe(200);
    const state = await stateRes.json();
    expect(state.world_id).toBe('aurora-prime');
    expect(state.buildings.length).toBeGreaterThan(0);
    expect(state.road_segments.length).toBeGreaterThan(0);
    expect(state.utilities.total_power_supply_mw).toBeGreaterThan(0);

    // 2. Issue a building placement command directly to command endpoint
    const cmdRes = await request.post('/api/v1/worlds/aurora-prime/commands', {
      data: {
        commands: [
          {
            action: 'place_building',
            payload: {
              type: 'Residential',
              name: 'Unified Habitat E2E',
              x: 18.0,
              z: 18.0
            }
          }
        ]
      }
    });
    expect(cmdRes.status()).toBe(200);
    const cmdData = await cmdRes.json();
    expect(cmdData.batch_status).toBe('success');
    const createdId = cmdData.results[0].entity_id;
    expect(createdId).toBeTruthy();

    // 3. Verify action appeared in action log
    const logRes = await request.get('/api/v1/worlds/aurora-prime/action-log?limit=5');
    expect(logRes.status()).toBe(200);
    const logs = await logRes.json();
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].action_type).toBe('place_building');

    // 4. Demolish the created building
    const delRes = await request.post('/api/v1/worlds/aurora-prime/commands', {
      data: {
        commands: [
          {
            action: 'demolish_building',
            payload: { building_id: createdId }
          }
        ]
      }
    });
    expect(delRes.status()).toBe(200);

    // 5. Verify undo restores the demolished building
    const undoRes = await request.post('/api/v1/worlds/aurora-prime/undo');
    expect(undoRes.status()).toBe(200);
    const undoData = await undoRes.json();
    expect(undoData.success).toBe(true);
    expect(undoData.restored_building_id).toBe(createdId);
  });

  test('AI Risk Overlays and Counterfactual endpoint return live data', async ({ request }) => {
    // 1. Test risk overlays
    const riskRes = await request.get('/api/v1/worlds/aurora-prime/risk-overlays');
    expect(riskRes.status()).toBe(200);
    const risk = await riskRes.json();
    expect(risk.risk_grid.length).toBeGreaterThan(0);
    expect(risk.features.average_happiness).toBeGreaterThan(0);

    // 2. Test counterfactual projection
    const cfRes = await request.post('/api/v1/worlds/aurora-prime/counterfactual?horizon_ticks=6', {
      data: {
        commands: [
          {
            action: 'place_building',
            payload: { type: 'Energy', name: 'High-Output Fission Reactor', x: 20, z: 20 }
          }
        ]
      }
    });
    expect(cfRes.status()).toBe(200);
    const cf = await cfRes.json();
    expect(cf.commands_evaluated).toBe(1);
    expect(cf.net_impact.power_supply_impact_mw).toBeGreaterThanOrEqual(75.0);
  });

  test('3D World Command Center loads and connects to live simulation state', async ({ page }) => {
    await page.goto('/');

    // 1. Dismiss Intro
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

    // 4. Verify 3D canvas and HUD
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();

    const tacticalHUD = page.getByText('CAMERA ANGLES', { exact: false }).first();
    await expect(tacticalHUD).toBeVisible();
  });
});
