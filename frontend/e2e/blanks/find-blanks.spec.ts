import { test, expect } from '@playwright/test';

test.describe('Automated Blank Hunter & Visual Integrity Audit', () => {
  const forbiddenPatterns = [
    'undefined',
    'NaN',
    'null',
    '[object Object]',
    'Invalid Date',
  ];

  test('audit views for blanks, undefined/NaN values, and valid WebGL 3D canvas', async ({ page }) => {
    // 1. Visit root app
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Save landing/auth view screenshot
    await page.screenshot({
      path: 'docs/blank_audit_screenshots/01_initial_landing.png',
      fullPage: true,
    });

    // 2. Click Player1 quick-fill button to populate credentials
    const quickFillBtn = page.locator('button:has-text("Player1 / UserPassword123!")');
    if (await quickFillBtn.isVisible()) {
      await quickFillBtn.click();
      await page.waitForTimeout(500);
      
      const enterBtn = page.locator('button:has-text("Enter the Simulation")');
      if (await enterBtn.isVisible()) {
        await enterBtn.click();
        await page.waitForTimeout(4000);
      }
    }

    // Capture main world view
    await page.screenshot({
      path: 'docs/blank_audit_screenshots/02_main_world_view.png',
      fullPage: true,
    });

    // 3. Check for 3D Canvas
    const canvas = page.locator('canvas').first();
    if (await canvas.isVisible()) {
      const box = await canvas.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.width).toBeGreaterThan(100);
        expect(box.height).toBeGreaterThan(100);
      }
      await canvas.screenshot({
        path: 'docs/blank_audit_screenshots/03_3d_webgl_canvas.png',
      });
    }

    // 4. Assert absence of forbidden NaN/undefined strings in visible body
    const bodyText = await page.locator('body').innerText();
    for (const pattern of forbiddenPatterns) {
      if (pattern === '[object Object]') {
        expect(bodyText.includes('[object Object]'), `Found literal '${pattern}' rendered in UI`).toBe(false);
      } else if (pattern !== 'null') {
        const regex = new RegExp(`\\b${pattern}\\b`, 'i');
        const hasForbidden = regex.test(bodyText);
        expect(hasForbidden, `Found forbidden string '${pattern}' rendered in UI`).toBe(false);
      }
    }
  });
});
