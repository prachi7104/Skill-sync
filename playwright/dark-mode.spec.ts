import { test, expect } from '@playwright/test';

test('homepage renders in dark mode', async ({ page }) => {
  await page.goto('http://localhost:3000');
  // Ensure dark class exists on html
  const htmlClass = await page.evaluate(() => document.documentElement.className);
  expect(htmlClass.includes('dark')).toBeTruthy();
  // Snapshot for basic visual regression
  await expect(page).toHaveScreenshot('homepage-dark.png', { fullPage: true });
});
