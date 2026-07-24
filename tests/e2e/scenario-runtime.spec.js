// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import {expect, test} from '../fixtures/app.js';

test('app runtime scenario API rebuilds active scenario context without stale map data', async ({page}) => {
  await page.goto('/');
  await page.waitForFunction(() => window.__TI_SCENARIO_API__?.activeScenario === '2026');

  const initial = await page.evaluate(() => ({
    scenarios: window.__TI_SCENARIO_API__.scenarios,
    activeScenario: window.__TI_SCENARIO_API__.activeScenario,
    canonicalRegions: document.querySelectorAll('#hitRegions .region-hit[data-wrap-canonical="1"]').length,
  }));
  expect(initial.scenarios).toEqual(['2022', '2026', '2070']);
  expect(initial.activeScenario).toBe('2026');
  expect(initial.canonicalRegions).toBeGreaterThan(300);

  await page.locator('#search').fill('Canada');
  await expect(page.locator('#nationDropdown')).toContainText('Canada');
  await page.evaluate(() => window.__TI_SCENARIO_API__.setActiveScenario('2070'));
  await page.waitForFunction(() => window.__TI_SCENARIO_API__?.activeScenario === '2070');

  const switched = await page.evaluate(() => ({
    activeScenario: window.__TI_SCENARIO_API__.activeScenario,
    canonicalRegions: document.querySelectorAll('#hitRegions .region-hit[data-wrap-canonical="1"]').length,
    claimsActive: document.querySelector('#map')?.classList.contains('claims-active') || false,
    selectedPill: document.querySelector('#selectedPill')?.textContent || '',
  }));
  expect(switched.activeScenario).toBe('2070');
  expect(switched.canonicalRegions).toBe(initial.canonicalRegions);
  expect(switched.claimsActive).toBe(false);
  expect(switched.selectedPill).toBe('');
  await expect(page.locator('#nationDropdown')).toContainText('Canada');

  await page.evaluate(() => window.__TI_SCENARIO_API__.setActiveScenario('2026'));
  await page.waitForFunction(() => window.__TI_SCENARIO_API__?.activeScenario === '2026');
  await expect(page.locator('#nationDropdown')).toContainText('Canada');
});
