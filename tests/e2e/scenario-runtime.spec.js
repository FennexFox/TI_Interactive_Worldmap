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
    crimeaNation: document.querySelector(
      '#regions .region[data-wrap-canonical="1"][data-region="Crimea"]'
    )?.dataset.nation || '',
  }));
  expect([...initial.scenarios].sort()).toEqual(['1962', '2003', '2022', '2026', '2070']);
  expect(initial.activeScenario).toBe('2026');
  expect(initial.canonicalRegions).toBeGreaterThan(300);
  expect(initial.crimeaNation).toBe('RUS');

  await page.locator('#search').fill('Canada');
  await expect(page.locator('#nationDropdown')).toContainText('Canada');
  await page.evaluate(() => window.__TI_SCENARIO_API__.setActiveScenario('2070'));
  await page.waitForFunction(() => window.__TI_SCENARIO_API__?.activeScenario === '2070');

  const switched = await page.evaluate(() => ({
    activeScenario: window.__TI_SCENARIO_API__.activeScenario,
    canonicalRegions: document.querySelectorAll('#hitRegions .region-hit[data-wrap-canonical="1"]').length,
    crimeaNation: document.querySelector(
      '#regions .region[data-wrap-canonical="1"][data-region="Crimea"]'
    )?.dataset.nation || '',
    claimsActive: document.querySelector('#map')?.classList.contains('claims-active') || false,
    selectedPill: document.querySelector('#selectedPill')?.textContent || '',
  }));
  expect(switched.activeScenario).toBe('2070');
  expect(switched.canonicalRegions).toBe(initial.canonicalRegions);
  expect(switched.crimeaNation).toBe('EUA');
  expect(switched.crimeaNation).not.toBe(initial.crimeaNation);
  expect(switched.claimsActive).toBe(false);
  expect(switched.selectedPill).toBe('');
  await expect(page.locator('#nationDropdown')).toContainText('Canada');

  await page.evaluate(() => window.__TI_SCENARIO_API__.setActiveScenario('2026'));
  await page.waitForFunction(() => window.__TI_SCENARIO_API__?.activeScenario === '2026');
  await expect(page.locator(
    '#regions .region[data-wrap-canonical="1"][data-region="Crimea"]'
  )).toHaveAttribute('data-nation', initial.crimeaNation);
  await expect(page.locator('#nationDropdown')).toContainText('Canada');

  for (const scenarioId of ['1962', '2003', '2022', '2026', '2070', '2022']) {
    await page.evaluate(id => window.__TI_SCENARIO_API__.setActiveScenario(id), scenarioId);
    await page.waitForFunction(
      id => window.__TI_SCENARIO_API__?.activeScenario === id,
      scenarioId
    );
    await expect(page.locator(
      '#hitRegions .region-hit[data-wrap-canonical="1"]'
    )).toHaveCount(initial.canonicalRegions);
    await expect(page.locator('#selectedPill')).toBeHidden();
    await expect(page.locator('#map')).not.toHaveClass(/claims-active/);
    await expect(page.locator('#nationDropdown')).toContainText('Canada');
  }
});
