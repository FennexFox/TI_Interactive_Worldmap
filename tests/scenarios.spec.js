// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import { expect, test } from '@playwright/test';

async function chooseNation(page, query, tag) {
  await page.locator('#search').fill(query);
  await page.locator('#nationDropdown .searchOption')
    .filter({ has: page.locator('.searchOptionTag', { hasText: tag }) })
    .first()
    .click();
}

test('scenario selector switches supported start scenarios and keeps map workflows usable', async ({ page }) => {
  await page.goto('/?worldWrap=0');
  await expect(page.locator('#regions .region').first()).toBeVisible({ timeout: 10000 });

  await expect(page.locator('#scenarioSel')).toHaveValue('2026');
  await expect(page.locator('#scenarioSel option')).toHaveText(['2022', '2026', '2070']);
  await expect(page.locator('#scenarioSummary')).toHaveText('2026 · 363 regions · 305 nations · 2,225 claim rows · 57 projects');

  await page.locator('#scenarioSel').selectOption('2022');
  await expect(page.locator('#scenarioSel')).toHaveValue('2022');
  await expect(page.locator('#scenarioSummary')).toHaveText('2022 · 363 regions · 305 nations · 2,225 claim rows · 57 projects');

  await chooseNation(page, 'Canada', 'CAN');
  await expect(page.locator('#search')).toHaveValue(/Canada/);
  await expect(page.locator('#claimPill')).toContainText('Canada: territory');
  await expect(page.locator('#nationInfo')).toContainText('Canada');
  await expect(page.locator('#map')).toHaveClass(/claims-active/);
  await expect.poll(async () => page.locator('#claimOverlays .claim-overlay').count()).toBeGreaterThan(0);

  await page.locator('#scenarioSel').selectOption('2070');
  await expect(page.locator('#scenarioSel')).toHaveValue('2070');
  await expect(page.locator('#scenarioSummary')).toHaveText('2070 · 363 regions · 305 nations · 2,223 claim rows · 49 projects');
  await expect(page.locator('#map')).toHaveClass(/claims-active/);

  await chooseNation(page, 'Saudi Arabia', 'SAU');
  await expect(page.locator('#search')).toHaveValue(/Saudi Arabia/);
  await expect(page.locator('#claimPill')).toContainText('Saudi Arabia: territory');
  await expect(page.locator('#nationInfo')).toContainText('Saudi Arabia');
  await expect.poll(async () => page.locator('#claimOverlays .claim-overlay').count()).toBeGreaterThan(0);

  await page.locator('#scenarioSel').selectOption('2026');
  await expect(page.locator('#scenarioSel')).toHaveValue('2026');
  await expect(page.locator('#scenarioSummary')).toHaveText('2026 · 363 regions · 305 nations · 2,225 claim rows · 57 projects');

  await chooseNation(page, 'Canada', 'CAN');
  await expect(page.locator('#claimPill')).toContainText('Canada: territory');
  await expect(page.locator('#nationInfo')).toContainText('Canada');
});
